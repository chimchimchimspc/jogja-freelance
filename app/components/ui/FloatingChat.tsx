"use client";
import { useState, useRef, useEffect } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { MessageCircle, X, RotateCcw } from "lucide-react";

// ===== Topik bantuan, dikelompokkan per kategori =====
interface HelpTopic {
  id: string;
  option: string;
  answer: string;
  links?: { href: string; label: string }[];
}

interface HelpCategory {
  id: string;
  option: string;
  intro: string;
  topics: HelpTopic[];
}

const CATEGORIES: HelpCategory[] = [
  {
    id: "freelancer",
    option: "🧑‍💻 Bantuan Freelancer",
    intro: "Oke! Soal apa nih?",
    topics: [
      {
        id: "lamar",
        option: "🔍 Cara melamar lowongan",
        answer:
          "Buka halaman Lowongan, pilih yang cocok, lalu klik \"Lamar Sekarang\" dan tulis surat lamaran singkat (maks 300 karakter). Status lamaran (Baru / Direview / Diterima / Ditolak) bisa dipantau di halaman Lamaranku — ada notifikasi juga saat statusnya berubah.",
        links: [
          { href: "/jobs", label: "Buka Lowongan" },
          { href: "/jobs/applications", label: "Lamaranku" },
        ],
      },
      {
        id: "event",
        option: "📅 Ikut event & check-in",
        answer:
          "Pilih event di halaman Events lalu klik \"RSVP Sekarang\". Saat hadir di lokasi, klik \"Check-in Event\" dan masukkan kode dari penyelenggara — badge kehadiran langsung masuk ke profilmu.",
        links: [{ href: "/events", label: "Lihat Events" }],
      },
      {
        id: "panduan",
        option: "🎓 Panduan 30 hari & level",
        answer:
          "Selesaikan misi harian lalu klik \"Tandai Selesai\". Level naik otomatis: Silver (10 hari), Gold (20 hari), Platinum (30 hari), dengan badge spesial di hari ke-5, 15, dan 30. Tamat 30 hari? Kamu bisa cetak portofolio!",
        links: [{ href: "/passport", label: "Buka Panduan" }],
      },
      {
        id: "portofolio",
        option: "📄 Print portofolio",
        answer:
          "Setelah 30 hari panduan tamat, tombol \"Print Portofolio\" muncul di halaman Panduan. Isinya otomatis dari profil, lamaran, event yang diikuti, dan badge — langsung bisa di-download sebagai PDF.",
        links: [{ href: "/passport", label: "Cek Progressku" }],
      },
    ],
  },
  {
    id: "pengelola",
    option: "🏢 Bantuan Pengelola",
    intro: "Siap! Pilih topiknya:",
    topics: [
      {
        id: "pasang",
        option: "📢 Pasang lowongan / event",
        answer:
          "Dari dashboard, klik \"Pasang Lowongan\" — atau menu Events → \"Buat Event\". Lengkapi form (bisa sertakan foto & pin lokasi di peta). Postingan direview admin dulu (±1–2 hari kerja) sebelum tayang untuk freelancer.",
      },
      {
        id: "pelamar",
        option: "👥 Kelola pelamar & peserta",
        answer:
          "Buka menu Pendaftar untuk melihat semua pelamar: baca surat lamaran, lalu Terima / Tolak (freelancer otomatis dapat notifikasi). Kamu juga bisa langsung chat dengan pelamar atau peserta event dari sana.",
      },
      {
        id: "review",
        option: "⏳ Kenapa postingan belum tayang?",
        answer:
          "Semua lowongan & event baru berstatus \"Menunggu Review\" sampai disetujui admin (biasanya 1–2 hari kerja). Statusnya bisa dicek di dashboard — begitu disetujui, otomatis tampil untuk para freelancer.",
      },
    ],
  },
  {
    id: "akun",
    option: "👤 Akun & Profil",
    intro: "Baik! Mau tahu soal apa?",
    topics: [
      {
        id: "login",
        option: "🔑 Masalah login / daftar",
        answer:
          "Masuk pakai email + password, atau klik \"Lanjutkan dengan Google\" (akun baru otomatis terdaftar sebagai freelancer). Lupa password? Hubungi admin di admin@jogjafreelance.id untuk dibantu reset.",
        links: [{ href: "/auth/login", label: "Halaman Login" }],
      },
      {
        id: "profil",
        option: "🖼️ Edit profil & foto",
        answer:
          "Klik foto profilmu di pojok kanan atas → \"Edit Profil\". Kamu bisa ganti foto (maks 5MB), nama, kota, bio, portfolio URL, dan skill. Login pakai Google? Foto akun Google-mu otomatis dipakai.",
        links: [{ href: "/profile/edit", label: "Edit Profil" }],
      },
      {
        id: "chat",
        option: "💬 Chat dengan employer",
        answer:
          "Percakapan hanya bisa dimulai oleh pengelola lowongan/event — setelah kamu melamar atau ikut event, tunggu mereka menghubungimu. Pesan masuk muncul di ikon 💬 di header, dan kamu bebas membalasnya.",
        links: [{ href: "/chat", label: "Buka Chat" }],
      },
    ],
  },
];

interface ChatMessage {
  from: "bot" | "user";
  text: string;
  links?: { href: string; label: string }[];
}

interface Option {
  label: string;
  onPick: () => void;
}

const GREETING: ChatMessage = {
  from: "bot",
  text: "Halo! 👋 Aku asisten bantuan JogjaFreelance. Pilih kategori bantuan di bawah ini ya:",
};

export default function FloatingChat() {
  const pathname = usePathname();
  const [chatOpen, setChatOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([GREETING]);
  const [typing, setTyping] = useState(false);
  const [activeCategory, setActiveCategory] = useState<HelpCategory | null>(null);
  const chatRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        chatRef.current &&
        buttonRef.current &&
        !chatRef.current.contains(event.target as Node) &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setChatOpen(false);
      }
    }

    if (chatOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [chatOpen]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typing, chatOpen]);

  // Balasan bot dengan efek mengetik
  const botReply = (userText: string, reply: ChatMessage[], after?: () => void) => {
    setMessages((prev) => [...prev, { from: "user", text: userText }]);
    setTyping(true);
    setTimeout(() => {
      setMessages((prev) => [...prev, ...reply]);
      setTyping(false);
      after?.();
    }, 700 + Math.random() * 500);
  };

  const pickCategory = (cat: HelpCategory) => {
    botReply(cat.option, [{ from: "bot", text: cat.intro }], () => setActiveCategory(cat));
  };

  const pickTopic = (topic: HelpTopic) => {
    botReply(topic.option, [
      { from: "bot", text: topic.answer, links: topic.links },
      { from: "bot", text: "Semoga membantu! Masih ada yang ingin ditanyakan? 😊" },
    ]);
  };

  const backToMenu = () => {
    setActiveCategory(null);
    setMessages((prev) => [
      ...prev,
      { from: "bot", text: "Silakan pilih kategori bantuan lainnya:" },
    ]);
  };

  const resetChat = () => {
    setMessages([GREETING]);
    setActiveCategory(null);
    setTyping(false);
  };

  // Opsi yang sedang ditawarkan (kategori atau topik dalam kategori)
  const currentOptions: Option[] = typing
    ? []
    : activeCategory
    ? [
        ...activeCategory.topics.map((t) => ({ label: t.option, onPick: () => pickTopic(t) })),
        { label: "↩️ Menu utama", onPick: backToMenu },
      ]
    : CATEGORIES.map((c) => ({ label: c.option, onPick: () => pickCategory(c) }));

  // Sembunyikan widget di halaman chat penuh
  if (pathname?.startsWith("/chat")) return null;

  return (
    <>
      {/* Tombol chat */}
      <button
        ref={buttonRef}
        onClick={() => setChatOpen((v) => !v)}
        className="print:hidden fixed bottom-6 right-6 z-40 p-4 bg-[#D64545] hover:bg-[#C23B3B] text-white rounded-full shadow-lg transition-all duration-200 hover:scale-110 active:scale-95"
        aria-label="Bantuan"
      >
        {chatOpen ? <X className="w-6 h-6" /> : <MessageCircle className="w-6 h-6" />}
      </button>

      {/* Jendela bantuan */}
      {chatOpen && (
        <div
          ref={chatRef}
          className="print:hidden fixed bottom-24 right-6 z-40 w-80 sm:w-96 bg-white rounded-xl shadow-xl border border-[#E7E7E7] overflow-hidden flex flex-col"
          style={{ height: "480px", animation: "chat-popup 300ms cubic-bezier(0.34, 1.56, 0.64, 1) forwards" }}
        >
          {/* Header */}
          <div className="bg-[#D64545] text-white p-4 flex items-center justify-between flex-shrink-0">
            <div>
              <h3 className="font-semibold">Pusat Bantuan</h3>
              <p className="text-xs text-white/80">Jawaban instan untuk masalah umum ⚡</p>
            </div>
            <button
              onClick={resetChat}
              className="p-1.5 hover:bg-white/15 rounded transition-colors"
              title="Mulai ulang"
              aria-label="Mulai ulang percakapan"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>

          {/* Percakapan */}
          <div className="flex-1 overflow-y-auto p-4 bg-[#F8F8F8] space-y-3">
            {messages.map((m, i) =>
              m.from === "bot" ? (
                <div key={i} className="flex gap-2">
                  <div className="w-8 h-8 rounded-full bg-[#D64545] flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                    JF
                  </div>
                  <div className="bg-white rounded-lg rounded-tl-none p-3 max-w-[85%] shadow-sm">
                    <p className="text-sm text-[#232F3E] leading-relaxed">{m.text}</p>
                    {m.links && m.links.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {m.links.map((l) => (
                          <Link
                            key={l.href}
                            href={l.href}
                            onClick={() => setChatOpen(false)}
                            className="text-xs font-semibold bg-[#FFF5F5] text-[#D64545] border border-[#D64545]/30 px-2.5 py-1 rounded-full hover:bg-[#D64545] hover:text-white transition-colors"
                          >
                            {l.label} →
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div key={i} className="flex justify-end">
                  <div className="bg-[#D64545] text-white rounded-lg rounded-tr-none p-3 max-w-[85%] shadow-sm">
                    <p className="text-sm">{m.text}</p>
                  </div>
                </div>
              )
            )}

            {/* Indikator mengetik */}
            {typing && (
              <div className="flex gap-2">
                <div className="w-8 h-8 rounded-full bg-[#D64545] flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                  JF
                </div>
                <div className="bg-white rounded-lg rounded-tl-none px-4 py-3 shadow-sm flex items-center gap-1">
                  <span className="typing-dot" style={{ animationDelay: "0ms" }} />
                  <span className="typing-dot" style={{ animationDelay: "150ms" }} />
                  <span className="typing-dot" style={{ animationDelay: "300ms" }} />
                </div>
              </div>
            )}

            {/* Opsi (kategori / topik) di dalam percakapan */}
            {currentOptions.length > 0 && (
              <div className="pl-10 space-y-1.5">
                {currentOptions.map((o) => (
                  <button
                    key={o.label}
                    onClick={o.onPick}
                    className="block w-full text-left text-sm bg-white border border-[#EAE6F5] hover:border-[#D64545] hover:bg-[#FFF5F5] text-[#232F3E] px-3 py-2 rounded-lg transition-colors shadow-sm"
                  >
                    {o.label}
                  </button>
                ))}
              </div>
            )}

            <div ref={endRef} />
          </div>

          {/* Footer */}
          <div className="px-4 py-2 border-t border-[#E7E7E7] bg-white flex-shrink-0">
            <p className="text-[10px] text-[#9B96AD] text-center">
              Bantuan lain: <span className="font-semibold text-[#D64545]">admin@jogjafreelance.id</span>
            </p>
          </div>
        </div>
      )}

      <style>{`
        @keyframes chat-popup {
          from {
            opacity: 0;
            transform: scale(0.3) translateY(20px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }
        .typing-dot {
          width: 7px;
          height: 7px;
          border-radius: 9999px;
          background: #C9C4D8;
          display: inline-block;
          animation: typing-bounce 1s ease-in-out infinite;
        }
        @keyframes typing-bounce {
          0%, 60%, 100% { transform: translateY(0); opacity: 0.5; }
          30% { transform: translateY(-5px); opacity: 1; }
        }
      `}</style>
    </>
  );
}
