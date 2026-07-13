const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1";

export interface AIChatMessage {
  role: "user" | "model";
  text: string;
}

/**
 * Kirim pesan ke AI chat backend (SSE streaming).
 * onText dipanggil per potongan teks; resolve saat stream selesai.
 */
export async function streamAIChat(opts: {
  message: string;
  history: AIChatMessage[];
  onText: (text: string) => void;
  signal?: AbortSignal;
}): Promise<void> {
  const token = typeof window !== "undefined" ? localStorage.getItem("jfp_token") : null;

  const res = await fetch(`${BASE_URL}/ai/chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ message: opts.message, history: opts.history }),
    signal: opts.signal,
  });

  // Error sebelum stream dimulai (rate limit, validasi, dll) datang sebagai JSON biasa
  const contentType = res.headers.get("content-type") || "";
  if (!res.ok || !contentType.includes("text/event-stream")) {
    const data = await res.json().catch(() => null);
    throw new Error(data?.message || `HTTP ${res.status}`);
  }

  const reader = res.body!.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";
    for (const line of lines) {
      if (!line.startsWith("data: ")) continue;
      try {
        const evt = JSON.parse(line.slice(6));
        if (evt.type === "text") opts.onText(evt.text);
        else if (evt.type === "error") throw new Error(evt.message);
      } catch (e) {
        if (e instanceof Error && e.message && !(e instanceof SyntaxError)) throw e;
      }
    }
  }
}
