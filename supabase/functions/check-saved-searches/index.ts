import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Fetch all active saved searches that need checking
    const now = new Date();
    const { data: searches, error: searchError } = await supabase
      .from("saved_searches")
      .select("*")
      .eq("is_active", true);

    if (searchError) {
      console.error("Failed to fetch saved searches:", searchError);
      return new Response(JSON.stringify({ error: "Failed to fetch saved searches" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!searches || searches.length === 0) {
      console.log("No active saved searches to process");
      return new Response(JSON.stringify({ processed: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let processed = 0;
    let alertsSent = 0;

    for (const search of searches) {
      try {
        // Check if alert is due based on frequency
        const lastSent = search.last_alert_sent ? new Date(search.last_alert_sent) : null;
        const hoursSinceLastAlert = lastSent
          ? (now.getTime() - lastSent.getTime()) / (1000 * 60 * 60)
          : Infinity;

        // Rate limit: max 1 email per search per day
        if (hoursSinceLastAlert < 24) {
          console.log(`Skipping search "${search.name}" - alert sent ${hoursSinceLastAlert.toFixed(1)}h ago`);
          continue;
        }

        // Check frequency
        if (search.alert_frequency === "weekly" && hoursSinceLastAlert < 168) {
          continue;
        }

        // Run the search to find new opportunities
        const params = search.search_params;
        const searchBody = {
          keyword: params.keyword || "",
          sources: params.sources || ["sam_gov", "grants_gov"],
          naicsCode: params.naicsCode || "",
          setAside: params.setAside || "",
          agency: params.agency || "",
          postedFrom: lastSent
            ? lastSent.toLocaleDateString("en-US", { month: "2-digit", day: "2-digit", year: "numeric" })
            : undefined,
          limit: 25,
          offset: 0,
        };

        // Call search-opportunities function
        const searchUrl = `${supabaseUrl}/functions/v1/search-opportunities`;
        const searchRes = await fetch(searchUrl, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${serviceRoleKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(searchBody),
        });

        if (!searchRes.ok) {
          console.error(`Search failed for "${search.name}": HTTP ${searchRes.status}`);
          await searchRes.text();
          continue;
        }

        const searchData = await searchRes.json();
        const newOpportunities = searchData.opportunities || [];

        if (newOpportunities.length === 0) {
          console.log(`No new results for "${search.name}"`);
          // Still update last_alert_sent to avoid re-checking constantly
          await supabase
            .from("saved_searches")
            .update({ last_alert_sent: now.toISOString() })
            .eq("id", search.id);
          processed++;
          continue;
        }

        // Create notification
        const { data: profile } = await supabase
          .from("profiles")
          .select("first_name, username")
          .eq("profile_id", search.user_id)
          .single();

        const oppList = newOpportunities
          .slice(0, 5)
          .map((o: any) => `• ${o.title} (${o.department || "Unknown Agency"})${o.response_deadline ? ` — Due: ${new Date(o.response_deadline).toLocaleDateString()}` : ""}`)
          .join("\n");

        const message = `${newOpportunities.length} new opportunit${newOpportunities.length === 1 ? "y" : "ies"} matching "${search.name}":\n\n${oppList}${newOpportunities.length > 5 ? `\n\n...and ${newOpportunities.length - 5} more` : ""}`;

        // Insert notification
        await supabase.from("notifications").insert({
          user_id: search.user_id,
          organization_id: search.organization_id,
          type: "opportunity_alert",
          title: `${newOpportunities.length} new ${search.name} opportunities`,
          message,
          data: {
            saved_search_id: search.id,
            opportunity_count: newOpportunities.length,
            search_params: params,
          },
        });

        // Update last_alert_sent
        await supabase
          .from("saved_searches")
          .update({ last_alert_sent: now.toISOString() })
          .eq("id", search.id);

        alertsSent++;
        processed++;
        console.log(`Alert sent for "${search.name}": ${newOpportunities.length} new opportunities`);
      } catch (err) {
        console.error(`Error processing search "${search.name}":`, err);
        processed++;
      }
    }

    console.log(`Processed ${processed} saved searches, sent ${alertsSent} alerts`);
    return new Response(
      JSON.stringify({ processed, alertsSent }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("check-saved-searches error:", err);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
