// Thin OpenAI client using fetch for Vite browser apps.
// Reads API key from Vite env: VITE_OPENAI_API_KEY

export interface PersonalityPayload {
  stats: any;
  habits: any;
  topArtists: any;
  topTracks: any;
}

export async function generatePersonalityReport(
  payload: PersonalityPayload,
  tone: string = "super engaging, hilarious, witty, playful, slightly self-deprecating"
):
  Promise<string> {
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY as string | undefined;
  if (!apiKey) {
    throw new Error("Missing VITE_OPENAI_API_KEY env variable.");
  }

  // Compose a concise system + user prompt with key figures only.
  const messages = [
    {
      role: "system",
      content:
        `You are a friendly music analyst with a ${tone} voice. Make it super interesting, engaging, and funny. Produce a concise personality report based on lifetime Spotify stats. Keep it snappy (150-220 words), use Gen Z slang and playful roasting that's kind (no insults, no profanity, no hate). Include 3-5 punchy bullets with short, funny labels, varied structure and rhythm. End with a one-liner "verdict" tagline that feels memorable.`
    },
    {
      role: "user",
      content: JSON.stringify({
        instructions: "Summarize listening personality based on these aggregates.",
        payload,
      }),
    },
  ];

  // OpenAI responses API (chat completions via responses)
  const resp = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages,
      temperature: 0.7,
      max_tokens: 600,
    }),
  });

  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`OpenAI error: ${resp.status} ${text}`);
  }

  const data = await resp.json();
  const content = data?.choices?.[0]?.message?.content ?? "";
  return content;
}
