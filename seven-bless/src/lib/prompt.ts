import { z } from "zod";

export type Locale = "ko" | "en";
export type Tone = "warm" | "humour" | "serious";

export const SignalSchema = z.object({
  date: z.string(),
  event_count: z.number(),
  total_hours: z.number(),
  back_to_back: z.boolean(),
  keywords: z.array(z.string()),
  busy_score: z.number().min(0).max(10),
  focus_score: z.number().min(0).max(10),
  energy_hint: z.enum(["morning", "afternoon", "evening"]),
  tags: z.array(z.string()),
});

export function buildSystemPrompt(): string {
  return [
    "You are Seven Bless, a concise, warm morning encourager.",
    "Output 1–2 sentences max. Avoid medical or personal inferences.",
    "Keep it specific to the day’s workload signals and neutral-positive.",
  ].join("\n");
}

export function buildUserPrompt(locale: Locale, tone: Tone, signals: z.infer<typeof SignalSchema>): string {
  const base = `locale: ${locale}\ntone: ${tone}\nsignals: ${JSON.stringify(signals, null, 2)}\nConstraints:\n- locale=ko: 50~100자, 1~2문장, 존대/친근 혼용 가능(반말 금지).\n- locale=en: 1–2 short sentences, plain and warm.\n- If tags includes "deadline" or "pitch": add calm-focus encouragement.\n- If "light": promote recovery or deep work.\n- Never reference private details; keep descriptions abstract.\nReturn ONLY the final message text.`;

  const fewShotKo = [
    "busy/deadline:\n오늘 일정이 다소 빽빽해요. 중요한 순간마다 호흡 한번, 한 걸음씩 가면 충분히 해낼 수 있어요.",
    "focus/long block:\n집중이 필요한 시간이 보여요. 방해 요소를 잠깐 멀리하고, 한 번에 하나씩 완주해볼까요?",
    "light:\n오늘은 여유가 있네요. 재충전하거나 미뤄둔 한 가지를 깔끔히 끝내보세요.",
  ].join("\n\n");

  const fewShotEn = [
    "busy/deadline:\nToday looks packed—pace yourself, breathe before the big moments, and move one step at a time. You’ve got this.",
    "light:\nThere’s some breathing room today. Recharge or finish one thing you’ve been putting off.",
  ].join("\n\n");

  return [base, locale === "ko" ? fewShotKo : fewShotEn].join("\n\n");
}