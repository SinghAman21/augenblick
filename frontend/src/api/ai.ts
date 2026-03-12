/**
 * Grok AI proxy client for brainstorming: generate, expand, summarize, related ideas.
 * Backend keeps XAI_API_KEY server-side; Vite proxies /api to the backend.
 */

export type AIAction = "generate" | "expand" | "summarize" | "related" | "chat";

export interface AIRequest {
  action: AIAction;
  prompt?: string;
  context?: string;
  ideas?: string[];
}

export interface AIResponse {
  text: string;
}

const API_BASE = "/api";

/** Check if the backend is reachable (frontend connected to backend). */
export async function checkBackendConnection(): Promise<{
  connected: boolean;
  aiConfigured?: boolean;
  error?: string;
}> {
  try {
    const res = await fetch(`${API_BASE}/health`);
    const raw = await res.text();
    let data: { ok?: boolean; aiConfigured?: boolean };
    try {
      data = raw.length > 0 ? JSON.parse(raw) : {};
    } catch {
      return { connected: false, error: "Invalid response from backend" };
    }
    if (!res.ok) return { connected: true, error: `Backend returned ${res.status}` };
    return {
      connected: true,
      aiConfigured: data.aiConfigured,
    };
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return {
      connected: false,
      error: message.includes("fetch") ? "Backend not reachable (is it running on port 3001?)" : message,
    };
  }
}

export async function askGrok(request: AIRequest): Promise<AIResponse> {
  const res = await fetch(`${API_BASE}/ai`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(request),
  });
  const raw = await res.text();
  let data: { text?: string; message?: string; error?: string };
  try {
    data = raw.length > 0 ? JSON.parse(raw) : {};
  } catch {
    if (!res.ok) {
      throw new Error(
        res.status === 502 || res.status === 504
          ? "AI backend is not running. Start it with: cd backend && npm run dev"
          : `Request failed (${res.status}). Backend may be down or returned invalid response.`
      );
    }
    throw new Error("Invalid response from AI. Is the backend running on port 3001?");
  }
  if (!res.ok) {
    throw new Error(data.message || data.error || "AI request failed");
  }
  return { text: data.text ?? "" };
}
