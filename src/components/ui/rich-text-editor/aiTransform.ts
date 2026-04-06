import { supabase } from "@/integrations/supabase/client";

export type AIAction = "rewrite" | "expand" | "summarize" | "formal" | "concise" | "fix_grammar" | "custom";
export type Tone = "professional" | "persuasive" | "technical" | "executive" | "conversational";

interface TransformParams {
  action: AIAction;
  selectedText: string;
  context?: string;
  sectionTitle?: string;
  tone?: Tone;
  customPrompt?: string;
}

export async function aiTransform(params: TransformParams): Promise<string> {
  const { data, error } = await supabase.functions.invoke<{ transformedText?: string; error?: string }>("ai-transform", {
    body: params,
  });

  if (error) throw new Error(error.message || "AI transform failed");
  if (data?.error) throw new Error(data.error);
  if (!data?.transformedText) throw new Error("AI couldn't transform this text. Try again.");

  return data.transformedText;
}
