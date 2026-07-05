"use client";
import { use, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Header from "../../../../components/layout/Header";
import Footer from "../../../../components/layout/Footer";
import Toast from "../../../../components/ui/Toast";
import {
  ChevronLeft, Loader2, Users, MessageCircle, CheckCircle, Clock,
} from "lucide-react";
import Link from "next/link";
import { useAuth } from "../../../../context/AuthContext";
import { eventsApi } from "../../../../lib/events.api";
import { chatApi } from "../../../../lib/chat.api";
import { assetUrl } from "../../../../lib/api";

type Attendee = {
  id: string;
  rsvp_at: string;
  checked_in: boolean;
  checked_in_at?: string;
  user_id: string;
  name: string;
  city?: string;
  level?: string;
  profile_picture_url?: string;
};

const levelBadge: Record<string, string> = {
  Bronze:   "text-orange-700 bg-orange-50 border-orange-200",
  Silver:   "text-gray-600  bg-gray-50   border-gray-200",
  Gold:     "text-yellow-700 bg-yellow-50 border-yellow-200",
  Platinum: "text-blue-600  bg-blue-50   border-blue-200",
};

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
}

export default function EventAttendeesPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const [eventTitle, setEventTitle] = useState("");
  const [attendees, setAttendees] = useState<Attendee[]>([]);
  const [loading, setLoading] = useState(true);
  const [chatting, setChatting] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push(`/auth/login?redirect=/employer/events/${id}/attendees`);
      return;
    }
    (async () => {
      try {
        const res = await eventsApi.attendees(id);
        setEventTitle(res.data.event_title);
        setAttendees(res.data.attendees);
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : "Gagal memuat peserta");
      } finally {
        setLoading(false);
      }
    })();
  }, [id, user, authLoading, router]);

  const handleChat = async (userId: string) => {
    setChatting(userId);
    try {
      const convo = await chatApi.start(userId);
      router.push(`/chat?c=${convo.id}`);
    } catch (e: unknown) {
      setToast({ message: e instanceof Error ? e.message : "Gagal membuka chat.", type: "error" });
      setChatting(null);
    }
  };

  if (authLoading || loading) {
    return (
      <>
        <Header />
        <main className="flex-1 bg-[#F8F6FF] flex items-center justify-center py-24">
          <Loader2 className="w-8 h-8 animate-spin text-[#D64545]" />
        </main>
        <Footer />
      </>
    );
  }

  const checkedInCount = attendees.filter((a) => a.checked_in).length;

  return (
    <>
      <Header />
      <main className="flex-1 bg-[#F8F6FF]">
        <div className="bg-white text-[#1E1B2E] py-8">
          <div className="max-w-4xl mx-auto px-4">
            <Link href="/employer/events" className="flex items-center gap-1.5 text-[#6B6880] hover:text-[#D64545] text-sm mb-4 transition-colors">
              <ChevronLeft className="w-4 h-4" /> Event Saya
            </Link>
            <h1 className="text-xl font-bold mb-1">{eventTitle || "Peserta Event"}</h1>
            <div className="flex flex-wrap gap-3 text-sm text-[#6B6880]">
              <span className="flex items-center gap-1">
                <Users className="w-3.5 h-3.5" /> {attendees.length} peserta terdaftar
              </span>
              <span className="flex items-center gap-1">
                <CheckCircle className="w-3.5 h-3.5" /> {checkedInCount} sudah check-in
              </span>
            </div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 py-6">
          {error ? (
            <div className="bg-white border border-[#EAE6F5] rounded-xl p-16 text-center">
              <p className="text-[#DC2C1E] mb-2">{error}</p>
              <button onClick={() => window.location.reload()} className="text-sm text-[#146EB4] hover:underline">
                Coba lagi
              </button>
            </div>
          ) : attendees.length === 0 ? (
            <div className="bg-white border border-[#EAE6F5] rounded-xl p-16 text-center">
              <Users className="w-10 h-10 text-[#D5D0E8] mx-auto mb-3" />
              <h3 className="font-bold text-[#1E1B2E] mb-1">Belum ada peserta</h3>
              <p className="text-sm text-[#6B6880]">Peserta yang RSVP akan muncul di sini</p>
            </div>
          ) : (
            <div className="space-y-3">
              {attendees.map((a) => (
                <div key={a.id} className="bg-white border border-[#EAE6F5] rounded-xl p-4 flex items-center gap-4">
                  <div className="w-11 h-11 rounded-full bg-[#D64545] flex items-center justify-center text-white font-bold flex-shrink-0 overflow-hidden">
                    {a.profile_picture_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={assetUrl(a.profile_picture_url)} alt={a.name} className="w-full h-full object-cover" />
                    ) : (
                      a.name.charAt(0)
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-bold text-[#1E1B2E]">{a.name}</p>
                      {a.level && (
                        <span className={`text-xs px-2 py-0.5 rounded-full border font-semibold ${levelBadge[a.level] ?? levelBadge.Bronze}`}>
                          {a.level}
                        </span>
                      )}
                      {a.checked_in ? (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700 font-semibold flex items-center gap-1">
                          <CheckCircle className="w-3 h-3" /> Check-in
                        </span>
                      ) : (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 font-semibold flex items-center gap-1">
                          <Clock className="w-3 h-3" /> Belum hadir
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-[#6B6880] mt-0.5">
                      {a.city ? `${a.city} · ` : ""}RSVP {fmtDate(a.rsvp_at)}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={() => handleChat(a.user_id)}
                      disabled={chatting === a.user_id}
                      className="flex items-center gap-1.5 px-4 py-2 bg-[#146EB4] hover:bg-[#0F5A94] text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-60"
                    >
                      {chatting === a.user_id
                        ? <Loader2 className="w-4 h-4 animate-spin" />
                        : <MessageCircle className="w-4 h-4" />}
                      Chat
                    </button>
                    <Link
                      href={`/profile/${a.user_id}`}
                      className="text-xs text-[#146EB4] hover:underline font-semibold whitespace-nowrap"
                    >
                      Profil →
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />

      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} duration={4000} />
      )}
    </>
  );
}
