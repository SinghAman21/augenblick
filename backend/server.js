import express from "express";
import cors from "cors";

const app = express();
const PORT = process.env.BACKEND_PORT || 3001;
const XAI_API_KEY = process.env.XAI_API_KEY;
const GROK_BASE = "https://api.x.ai/v1";
const MODEL = "grok-3-mini"; // Cost-effective, fast; use grok-4 or grok-4.1-fast for heavier tasks

app.use(cors({ origin: true }));
app.use(express.json());

/** Health check: frontend can call this to verify backend is reachable */
app.get("/api/health", (req, res) => {
  res.json({
    ok: true,
    service: "augenblick-backend",
    aiConfigured: !!XAI_API_KEY,
  });
});

const systemPrompts = {
  generate: `You are an AI brainstorming assistant. Given a short prompt or topic, generate 3–5 concise, creative ideas that could be explored in a brainstorming session. Output a clear list (numbered or bulleted). Keep each idea to one line. Be creative and varied.`,

  expand: `You are an AI brainstorming assistant. Given a brief or incomplete idea, expand it into a more detailed concept: add a short description, 1–2 variations, and supporting context (benefits, considerations, or next steps). Keep the response structured and concise (a few short paragraphs or bullets).`,

  summarize: `You are an AI brainstorming assistant. Given a list of ideas and/or discussion points from a brainstorming session, produce a short summary: main themes, top ideas, and any clear next steps or recommendations. Keep it concise (under 200 words).`,

  related: `You are an AI brainstorming assistant. Given existing ideas from a session, suggest 3–5 new directions or related concepts that build on them—variations, adjacent ideas, or "what if" angles. Output a clear list. Be concise and creative.`,

  chat: `You are a helpful AI brainstorming assistant. You help teams generate ideas, expand concepts, organize thoughts, and evaluate options. Be concise, creative, and practical. When asked about ideas or sessions, give short, actionable suggestions.`,
};

function buildUserMessage(action, body) {
  const { prompt = "", context = "", ideas = [] } = body;
  switch (action) {
    case "generate":
      return prompt.trim() ? `Topic/prompt: ${prompt}` : "Generate some starter ideas for a product brainstorming session.";
    case "expand":
      return prompt.trim() ? `Expand this idea: ${prompt}` : "Please provide an idea to expand.";
    case "summarize":
      if (ideas.length) return `Summarize this brainstorming session:\n\nIdeas:\n${ideas.join("\n")}`;
      if (context.trim()) return `Summarize:\n${context}`;
      return "Summarize the key points and ideas from this session.";
    case "related":
      if (ideas.length) return `Existing ideas:\n${ideas.join("\n")}\n\nSuggest related directions or new ideas.`;
      if (prompt.trim()) return `Based on: ${prompt}\n\nSuggest related ideas.`;
      return "Suggest new directions based on the current ideas in the session.";
    default:
      return prompt.trim() || "How can you help with this brainstorming session?";
  }
}

app.post("/api/ai", async (req, res) => {
  if (!XAI_API_KEY) {
    return res.status(503).json({
      error: "AI not configured",
      message: "Set XAI_API_KEY in the backend .env to enable Grok AI.",
    });
  }

  const { action = "chat", prompt = "", context = "", ideas = [] } = req.body;
  const sys = systemPrompts[action] || systemPrompts.chat;
  const userContent = buildUserMessage(action, { prompt, context, ideas });

  try {
    const response = await fetch(`${GROK_BASE}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${XAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: "system", content: sys },
          { role: "user", content: userContent },
        ],
        max_tokens: 1024,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      const status = response.status;
      return res.status(status >= 400 ? status : 502).json({
        error: "Grok API error",
        message: errText || response.statusText,
      });
    }

    const data = await response.json();
    const text = data.choices?.[0]?.message?.content?.trim() || "No response generated.";
    return res.json({ text });
  } catch (e) {
    console.error("Grok request failed:", e);
    return res.status(500).json({
      error: "Request failed",
      message: e.message || "Failed to reach Grok AI.",
    });
  }
});

app.listen(PORT, () => {
  console.log(`Augenblick backend running at http://localhost:${PORT}`);
  if (!XAI_API_KEY) console.warn("XAI_API_KEY not set — AI endpoints will return 503.");
});
