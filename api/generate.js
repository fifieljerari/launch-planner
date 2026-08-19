const MODEL = "gemini-3.1-flash-lite";
const MAX_RETRIES = 3;

async function callGemini(prompt, apiKey) {
  return fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
      }),
    }
  );
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "Server is missing GEMINI_API_KEY" });
  }

  const { prompt } = req.body || {};
  if (!prompt) {
    return res.status(400).json({ error: "Missing prompt" });
  }

  try {
    let response;
    let lastErrText = "";

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      response = await callGemini(prompt, apiKey);

      if (response.ok) break;

      if (response.status !== 503 && response.status !== 429) {
        lastErrText = await response.text();
        return res.status(response.status).json({ error: lastErrText });
      }

      lastErrText = await response.text();
      if (attempt < MAX_RETRIES) {
        await sleep(attempt * 1500);
      }
    }

    if (!response.ok) {
      return res.status(response.status).json({
        error: "The model is temporarily overloaded and retries were exhausted. Please try again in a minute.",
        details: lastErrText,
      });
    }

    const data = await response.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";

    return res.status(200).json({ content: [{ type: "text", text }] });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
