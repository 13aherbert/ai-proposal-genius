import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { integration_id, integration_type, webhook_url } = await req.json();

    if (!integration_id) {
      return new Response(JSON.stringify({ error: "integration_id required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let testResult = { success: false, message: "" };

    if (webhook_url) {
      // Test webhook connectivity
      try {
        const testPayload = {
          text: "🔔 OptiRFP Integration Test — Connection verified!",
          blocks: [
            {
              type: "section",
              text: {
                type: "mrkdwn",
                text: "*OptiRFP Integration Test* ✅\nThis is a test notification. Your integration is configured correctly.",
              },
            },
          ],
        };

        const response = await fetch(webhook_url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(testPayload),
        });

        if (response.ok) {
          testResult = { success: true, message: "Webhook responded successfully" };
        } else {
          const text = await response.text();
          testResult = {
            success: false,
            message: `Webhook returned ${response.status}: ${text.substring(0, 200)}`,
          };
        }
      } catch (fetchError: any) {
        testResult = {
          success: false,
          message: `Connection failed: ${fetchError.message}`,
        };
      }
    } else {
      // For non-webhook integrations, just verify the record exists
      const { data, error } = await supabase
        .from("organization_integrations")
        .select("id, is_active")
        .eq("id", integration_id)
        .single();

      if (error || !data) {
        testResult = { success: false, message: "Integration not found" };
      } else {
        testResult = { success: true, message: "Integration record verified" };
      }
    }

    // Log the test as a sync event
    await supabase.from("integration_sync_logs").insert({
      integration_id,
      sync_type: "test",
      direction: "push",
      records_processed: testResult.success ? 1 : 0,
      records_failed: testResult.success ? 0 : 1,
      error_details: testResult.success ? null : { message: testResult.message },
      started_at: new Date().toISOString(),
      completed_at: new Date().toISOString(),
    });

    // Update integration status
    await supabase
      .from("organization_integrations")
      .update({
        sync_status: testResult.success ? "success" : "error",
        error_message: testResult.success ? null : testResult.message,
        last_sync_at: new Date().toISOString(),
      })
      .eq("id", integration_id);

    if (!testResult.success) {
      return new Response(JSON.stringify({ error: testResult.message }), {
        status: 422,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ success: true, message: testResult.message }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("test-integration error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
