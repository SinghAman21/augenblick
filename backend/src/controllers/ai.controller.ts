import type { Request, Response } from 'express';
import { env } from '../config/env.js';
import { asyncHandler } from '../middleware/async-handler.js';
import { ApiError } from '../lib/api-error.js';

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

/** Build a fallback response when XAI_API_KEY is not set */
function fallbackResponse(
  action: string,
  body: { prompt?: string; ideas?: string[] }
): string {
  const prompt = (body.prompt || '').trim();
  const ideas = body.ideas || [];
  const note = '\n\n---\n💡 To get real AI suggestions, add XAI_API_KEY to your backend .env (get a key at x.ai).';

  switch (action) {
    case 'generate':
      if (prompt) {
        return `Here are some starter ideas for "${prompt.slice(0, 50)}${prompt.length > 50 ? '…' : ''}":\n\n1. Explore user research and pain points\n2. Prototype a minimal version\n3. Consider integration with existing tools\n4. Add a feedback loop for iteration\n5. Measure impact with clear metrics${note}`;
      }
      return `Starter ideas for a brainstorming session:\n\n1. User-centric feature improvement\n2. Automation to save time\n3. Better onboarding flow\n4. Analytics and insights dashboard\n5. Collaboration or sharing feature${note}`;
    case 'expand':
      if (prompt) {
        return `Expanded idea: "${prompt.slice(0, 60)}${prompt.length > 60 ? '…' : ''}"\n\n• Description: Add more detail, user benefits, and success criteria.\n• Variations: Try a lighter version and a premium version.\n• Next steps: Validate with a small group, then iterate.${note}`;
      }
      return `Provide an idea in the prompt to expand it. You’ll get description, variations, and next steps.${note}`;
    case 'summarize':
      if (ideas.length) {
        return `Summary of ${ideas.length} idea(s):\n\n• Main themes: Review the list above for recurring topics.\n• Top ideas: Prioritize by impact and feasibility.\n• Next steps: Pick 1–2 to prototype and get feedback.${note}`;
      }
      return `Add some ideas to this session, then run Summary again for themes and next steps.${note}`;
    case 'related':
      if (prompt || ideas.length) {
        return `Related directions:\n\n1. "What if" version of the same idea\n2. Opposite or complementary approach\n3. Different audience or use case\n4. Simpler or more advanced variant\n5. Integration with another product${note}`;
      }
      return `Share an idea or open a session with ideas, then ask for related directions.${note}`;
    default:
      return `You asked: "${prompt || 'How can you help?'}"\n\nTry the Generate tab for new ideas, Summary for session recap, or Elaboration to expand an idea. For real AI, add GROQ_API_KEY (free) or XAI_API_KEY to backend .env.${note}`;
  }
}

/** Call Groq (free tier) or X.AI (Grok); same OpenAI-compatible response shape */
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
    throw new ApiError(response.status >= 400 ? response.status : 502, errText || response.statusText || 'AI request failed');
  }

  const data = (await response.json()) as { choices?: Array<{ message?: { content?: string } }> };
  return data.choices?.[0]?.message?.content?.trim() ?? 'No response generated.';
}

/** POST /ai – generate, expand, summarize, related, chat. Uses Groq (free) if GROQ_API_KEY set, else XAI if XAI_API_KEY set. On invalid key or API error, returns fallback text so the app keeps working. */
export const postAI = asyncHandler(async (req: Request, res: Response) => {
  const body = req.body as { action?: string; prompt?: string; context?: string; ideas?: string[] };
  const action = body.action || 'chat';
  const sys = systemPrompts[action] || systemPrompts.chat;
  const userContent = buildUserMessage(action, body);
  const keyInvalidNote = '\n\n---\n⚠️ Your API key was rejected. For free AI: remove any XAI_API_KEY from backend .env, add GROQ_API_KEY from https://console.groq.com, then restart the backend.';

  if (env.GROQ_API_KEY) {
    try {
      const text = await callLLM(GROQ_BASE, env.GROQ_API_KEY, GROQ_MODEL, sys, userContent);
      res.json({ text });
      return;
    } catch {
      const text = fallbackResponse(action, body) + keyInvalidNote;
      res.json({ text });
      return;
    }
  }

  if (env.XAI_API_KEY) {
    try {
      const text = await callLLM(XAI_BASE, env.XAI_API_KEY, XAI_MODEL, sys, userContent);
      res.json({ text });
      return;
    } catch {
      const text = fallbackResponse(action, body) + keyInvalidNote;
      res.json({ text });
      return;
    }
  }

  const text = fallbackResponse(action, body);
  res.json({ text });
});
