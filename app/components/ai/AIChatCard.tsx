"use client";
import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { Sparkles, Send, X, Bot, Loader2 } from "lucide-react";
import { streamAIChat, type AIChatMessage } from "../../lib/ai.api";
import { useAuth } from "../../context/AuthContext";
import { assetUrl } from "../../lib/api";

const STARTERS = [
  "Kategori lowongan apa yang paling menjanjikan buat saya?",
  "Bandingkan budget rata-rata antar kategori pekerjaan",
  "Lowongan mana yang paling cocok dengan skill saya?",
  "Tips menulis proposal yang menarik untuk employer",
];

export default function AIChatCard() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<AIChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streaming]);

  const send = async (text: string) => {
    const message = text.trim();
    if (!message || streaming) return;
    setError(null);
    setInput("");
    const history = messages;
    setMessages((m) => [...m, { role: "user", text: message }, { role: "model", text: "" }]);
    setStreaming(true);
    try {
      await streamAIChat({
        message,
        history,
        onText: (chunk) => {
          setMessages((m) => {
            const copy = [...m];
            const last = copy[copy.length - 1];
            copy[copy.length - 1] = { ...last, text: last.text + chunk };
            return copy;
          });
        },
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Terjadi kesalahan. Coba lagi.");
      // buang bubble model kosong kalau belum sempat terisi
      setMessages((m) => (m[m.length - 1]?.role === "model" && !m[m.length - 1].text ? m.slice(0, -1) : m));
    } finally {
      setStreaming(false);
    }
  };

  return (
    <>
      {/* Card di dashboard */}
      <div className="bg-gradient-to-br from-[#1E1B2E] to-[#3D2C5A] rounded-xl p-5 text-white">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-8 h-8 rounded-lg bg-white/15 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-yellow-300" />
          </div>
          <h3 className="font-bold">Asisten Karier AI</h3>
        </div>
        <p className="text-xs text-white/70 mb-4 leading-relaxed">
          Diskusi rekomendasi lowongan, bandingkan kategori pekerjaan, dan dapatkan tips karier — langsung dengan AI.
        </p>
        <button
          onClick={() => setOpen(true)}
          className="w-full py-2.5 bg-white text-[#1E1B2E] rounded-lg text-sm font-bold hover:bg-yellow-50 transition-colors flex items-center justify-center gap-2"
        >
          <Bot className="w-4 h-4" />
          Diskusi Rekomendasi dengan AI
        </button>
      </div>

      {/* Modal chat — dirender lewat portal ke body, karena ancestor card
          punya CSS transform (FadeInSection) yang merusak position:fixed */}
      {open && typeof document !== "undefined" && createPortal(
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-0 sm:p-4">
          <div className="bg-white w-full sm:max-w-lg h-[85vh] sm:h-[600px] sm:rounded-2xl rounded-t-2xl flex flex-col overflow-hidden shadow-2xl">
            {/* Header */}
            <div className="flex items-center gap-3 px-4 py-3 bg-[#1E1B2E] text-white flex-shrink-0">
              <div className="w-8 h-8 rounded-lg bg-white/15 flex items-center justify-center">
                <Bot className="w-4 h-4 text-yellow-300" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm">Asisten Karier AI</p>
                <p className="text-[11px] text-white/60">Powered by Gemini · maks 10 pesan/hari</p>
              </div>
              <button onClick={() => setOpen(false)} className="p-1.5 hover:bg-white/10 rounded-lg transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#F8F6FF]">
              {messages.length === 0 && (
                <div className="text-center pt-6">
                  <div className="w-12 h-12 rounded-full bg-[#1E1B2E] flex items-center justify-center mx-auto mb-3">
                    <Sparkles className="w-6 h-6 text-yellow-300" />
                  </div>
                  <p className="text-sm font-semibold text-[#1E1B2E] mb-1">Mau diskusi apa hari ini?</p>
                  <p className="text-xs text-[#6B6880] mb-4">AI ini tahu profil skill-mu, lowongan aktif, dan statistik tiap kategori.</p>
                  <div className="space-y-2 text-left">
                    {STARTERS.map((s) => (
                      <button
                        key={s}
                        onClick={() => send(s)}
                        className="w-full text-left text-xs p-3 bg-white border border-[#EAE6F5] rounded-lg hover:border-[#D64545] hover:bg-[#FFF5F5] transition-colors text-[#1E1B2E]"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {messages.map((m, i) => (
                <div key={i} className={`flex gap-2 ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                  {m.role === "model" && (
                    <div className="w-7 h-7 rounded-lg bg-[#1E1B2E] flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Bot className="w-3.5 h-3.5 text-yellow-300" />
                    </div>
                  )}
                  <div
                    className={`max-w-[80%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
                      m.role === "user"
                        ? "bg-[#D64545] text-white rounded-br-md"
                        : "bg-white border border-[#EAE6F5] text-[#1E1B2E] rounded-bl-md"
                    }`}
                  >
                    {m.text || (
                      <span className="inline-flex items-center gap-1.5 text-[#6B6880]">
                        <Loader2 className="w-3.5 h-3.5 animate-spin" /> berpikir...
                      </span>
                    )}
                  </div>
                  {m.role === "user" && (
                    <div className="w-7 h-7 rounded-full bg-[#D64545] flex items-center justify-center flex-shrink-0 mt-0.5 overflow-hidden">
                      {user?.avatar ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={assetUrl(user.avatar)} alt={user.name} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-[11px] font-bold text-white">
                          {(user?.name || "?").charAt(0).toUpperCase()}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              ))}

              {error && (
                <div className="text-center">
                  <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2 inline-block">{error}</p>
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            {/* Input */}
            <form
              onSubmit={(e) => { e.preventDefault(); send(input); }}
              className="flex items-center gap-2 p-3 border-t border-[#EAE6F5] bg-white flex-shrink-0"
            >
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Tulis pertanyaanmu..."
                maxLength={2000}
                className="flex-1 px-4 py-2.5 text-sm border border-[#EAE6F5] rounded-full bg-[#F8F6FF] focus:outline-none focus:border-[#D64545]"
              />
              <button
                type="submit"
                disabled={streaming || !input.trim()}
                className="w-10 h-10 rounded-full bg-[#D64545] text-white flex items-center justify-center hover:bg-[#C23B3B] disabled:opacity-40 transition-colors flex-shrink-0"
              >
                {streaming ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </button>
            </form>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
