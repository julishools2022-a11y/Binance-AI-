// lib/groq.js
//
// Uses Groq's OpenAI-compatible chat completions endpoint to turn a raw
// trigger + ticker snapshot into a plain-language explanation.

export async function explainMove(symbol, ticker, triggerDetail) {
  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: "openai/gpt-oss-20b",
      messages: [
        {
          role: "system",
          content:
            "You are a crypto market analyst writing short alert notes for students. " +
            "Explain the move in plain language in 2-3 sentences. State observations " +
            "only — never give financial advice or predictions.",
        },
        {
          role: "user",
          content: `Symbol: ${symbol}\nTrigger: ${triggerDetail}\n24h stats: ${JSON.stringify(
            ticker
          )}\n\nExplain what's happening in plain terms.`,
        },
      ],
      temperature: 0.4,
      max_tokens: 200,
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Groq error ${res.status}: ${body}`);
  }

  const data = await res.json();
  return data.choices[0].message.content.trim();
}
