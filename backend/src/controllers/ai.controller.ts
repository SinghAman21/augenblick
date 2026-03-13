import type { Request, Response } from 'express';
import { env } from '../config/env.js';
import { asyncHandler } from '../middleware/async-handler.js';

const GROQ_BASE = 'https://api.groq.com/openai/v1';
const GROQ_MODEL = 'llama-3.1-8b-instant';
const XAI_BASE = 'https://api.x.ai/v1';
const XAI_MODEL = 'grok-3-mini';

const systemPrompts: Record<string, string> = {
  generate: `You are an AI brainstorming assistant. Given a short prompt or topic, generate 3–5 concise, creative ideas that could be explored in a brainstorming session. Output a clear list (numbered or bulleted). Keep each idea to one line. Be creative and varied.`,
  expand: `You are an AI brainstorming assistant. Given a brief or incomplete idea, expand it into a more detailed concept: add a short description, 1–2 variations, and supporting context (benefits, considerations, or next steps). Keep the response structured and concise (a few short paragraphs or bullets).`,
  summarize: `You are an AI brainstorming assistant. Given a list of ideas and/or discussion points from a brainstorming session, produce a short summary: main themes, top ideas, and any clear next steps or recommendations. Keep it concise (under 200 words).`,
  related: `You are an AI brainstorming assistant. Given existing ideas from a session, suggest 3–5 new directions or related concepts that build on them—variations, adjacent ideas, or "what if" angles. Output a clear list. Be concise and creative.`,
  chat: `You are a helpful AI brainstorming assistant. You help teams generate ideas, expand concepts, organize thoughts, and evaluate options. Be concise, creative, and practical. When asked about ideas or sessions, give short, actionable suggestions.`,
};

function buildUserMessage(
  action: string,
  body: { prompt?: string; context?: string; ideas?: string[] }
): string {
  const { prompt = '', context = '', ideas = [] } = body;

  switch (action) {
    case 'generate':
      return prompt.trim()
        ? `Topic/prompt: ${prompt}`
        : 'Generate some starter ideas for a product brainstorming session.';
    case 'expand':
      return prompt.trim() ? `Expand this idea: ${prompt}` : 'Please provide an idea to expand.';
    case 'summarize':
      if (ideas.length) return `Summarize this brainstorming session:\n\nIdeas:\n${ideas.join('\n')}`;
      if (context.trim()) return `Summarize:\n${context}`;
      return 'Summarize the key points and ideas from this session.';
    case 'related':
      if (ideas.length)
        return `Existing ideas:\n${ideas.join('\n')}\n\nSuggest related directions or new ideas.`;
      if (prompt.trim()) return `Based on: ${prompt}\n\nSuggest related ideas.`;
      return 'Suggest new directions based on the current ideas in the session.';
    default:
      return prompt.trim() || 'How can you help with this brainstorming session?';
  }
}

async function callLLM(
  apiBase: string,
  apiKey: string,
  model: string,
  systemContent: string,
  userContent: string
): Promise<string> {
  const response = await fetch(`${apiBase}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: systemContent },
        { role: 'user', content: userContent },
      ],
      max_tokens: 1024,
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(errText || response.statusText || 'AI request failed');
  }

  const data = (await response.json()) as { choices?: Array<{ message?: { content?: string } }> };
  return data.choices?.[0]?.message?.content?.trim() ?? 'No response generated.';
}

/** POST /api/ai — tries Groq first (free), then XAI. Returns 503 if neither key is set. */
export const postAI = asyncHandler(async (req: Request, res: Response) => {
  const body = req.body as { action?: string; prompt?: string; context?: string; ideas?: string[] };
  const action = body.action || 'chat';
  const sys = systemPrompts[action] || systemPrompts.chat;
  const userContent = buildUserMessage(action, body);

  if (!env.GROQ_API_KEY && !env.XAI_API_KEY) {
    res.status(503).json({
      error: 'AI not configured',
      message: 'Set GROQ_API_KEY (free at console.groq.com) or XAI_API_KEY in the backend .env to enable AI.',
    });
    return;
  }

  try {
    let text: string;

    if (env.GROQ_API_KEY) {
      text = await callLLM(GROQ_BASE, env.GROQ_API_KEY, GROQ_MODEL, sys, userContent);
    } else {
      text = await callLLM(XAI_BASE, env.XAI_API_KEY!, XAI_MODEL, sys, userContent);
    }

    res.json({ text });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'AI request failed.';
    res.status(502).json({ error: 'AI request failed', message });
  }
});
