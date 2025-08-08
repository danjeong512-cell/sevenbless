import OpenAI from "openai";
import { buildSystemPrompt, buildUserPrompt, SignalSchema, Locale, Tone } from "@/lib/prompt";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function generateMessage(args: {
  locale: Locale;
  tone: Tone;
  signals: unknown;
}): Promise<string> {
  const parsed = SignalSchema.parse(args.signals);
  const system = buildSystemPrompt();
  const user = buildUserPrompt(args.locale, args.tone, parsed);

  const resp = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
    temperature: 0.7,
    max_tokens: 120,
  });

  const text = resp.choices?.[0]?.message?.content?.trim() ?? "";
  return text;
}