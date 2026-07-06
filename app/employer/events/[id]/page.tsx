"use client";
import { use, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Header from "../../../components/layout/Header";
import Footer from "../../../components/layout/Footer";
import {
  ChevronLeft, Users, CheckCircle, Loader2, Calendar, MapPin,
  QrCode, Copy, ChevronRight, KeyRound, CheckCircle2,
} from "lucide-react";
import Link from "next/link";
import QRCode from "qrcode";
import Modal from "../../../components/ui/Modal";
import Button from "../../../components/ui/Button";
import Toast from "../../../components/ui/Toast";
import { useAuth } from "../../../context/AuthContext";
import { eventsApi, type ApiEvent } from "../../../lib/events.api";

const STATUS_BADGE: Record<string, { label: string; cls: string }> = {
  active:         { label: "Aktif",           cls: "bg-green-100 text-green-700" },
  pending_review: { label: "Menunggu Review", cls: "bg-yellow-100 text-yellow-700" },
  rejected:       { label: "Ditolak",         cls: "bg-red-100 text-red-700" },
  completed:      { label: "Selesai",         cls: "bg-gray-100 text-gray-500" },
  closed:         { label: "Selesai",         cls: "bg-gray-100 text-gray-500" },
};

const EVENT_TYPE_LABEL: Record<string, string> = {
  workshop: "🎓 Workshop", meetup: "👥 Meetup", coffee_chat: "☕ Coffee Chat", networking: "🤝 Networking",
};

function fmtDate(d?: string) {
  if (!d) return "-";
  return new Date(d).toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
}

type EventWithStatus = ApiEvent & { status?: string };

export default function EmployerEventDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const [event, setEvent] = useState<EventWithStatus | null>(null);
  const [attendees, setAttendees] = useState<{ checked_in: boolean }[]>([]);
  const [qrDataUrl, setQrDataUrl] = useState<string>("");
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showComplete, setShowComplete] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const handleComplete = async () => {
    setCompleting(true);
    try {
      await eventsApi.complete(id);
      setEvent((prev) => (prev ? { ...prev, status: "completed" } : prev));
      setToast({ message: "Event ditandai selesai.", type: "success" });
      setShowComplete(false);
    } catch (e: unknown) {
      setToast({ message: e instanceof Error ? e.message : "Gagal menandai event selesai.", type: "error" });
    } finally {
      setCompleting(false);
    }
  };

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push(`/auth/login?redirect=/employer/events/${id}`);
      return;
    }
    (async () => {
      try {
        const [evRes, attRes] = await Promise.all([
          eventsApi.get(id),
          eventsApi.attendees(id).catch(() => ({ data: { event_title: "", attendees: [] } })),
        ]);
        setEvent(evRes.data as EventWithStatus);
        setAttendees(attRes.data.attendees);
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : "Gagal memuat detail event");
      } finally {
        setLoading(false);
      }
    })();
  }, [id, user, authLoading, router]);

  // Generate QR: link ke halaman event dengan kode check-in terisi otomatis
  useEffect(() => {
    if (!event?.check_in_code) return;
    const url = `${window.location.origin}/events/${id}?checkin=${encodeURIComponent(event.check_in_code)}`;
    QRCode.toDataURL(url, { width: 480, margin: 2, color: { dark: "#1E1B2E", light: "#FFFFFF" } })
      .then(setQrDataUrl)
      .catch(() => setQrDataUrl(""));
  }, [event, id]);

  const copyCode = () => {
    if (!event?.check_in_code) return;
    navigator.clipboard.writeText(event.check_in_code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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

  if (error || !event) {
    return (
      <>
        <Header />
        <main className="flex-1 bg-[#F8F6FF] flex items-center justify-center py-24">
          <div className="text-center">
            <p className="text-[#DC2C1E] mb-3">{error ?? "Event tidak ditemukan"}</p>
            <Link href="/employer/events" className="text-sm text-[#146EB4] hover:underline">← Kembali ke Event Saya</Link>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  const badge = STATUS_BADGE[event.status ?? "active"] ?? STATUS_BADGE.closed;
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
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <h1 className="text-2xl font-bold">{event.title}</h1>
                  <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${badge.cls}`}>{badge.label}</span>
                </div>
                <div className="flex flex-wrap gap-3 text-sm text-[#6B6880]">
                  <span>{EVENT_TYPE_LABEL[event.type] ?? event.type}</span>
                  <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> {fmtDate(event.event_date)}</span>
                  {event.location_name && (
                    <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> {event.location_name}</span>
                  )}
                </div>
              </div>
              {event.status === "active" && (
                <button
                  onClick={() => setShowComplete(true)}
                  className="flex items-center gap-1.5 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-semibold rounded-lg transition-colors flex-shrink-0"
                >
                  <CheckCircle2 className="w-4 h-4" /> Tandai Selesai
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-6">
            {/* Kolom kiri: statistik & peserta */}
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white border border-[#EAE6F5] rounded-xl p-5 text-center">
                  <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center mx-auto mb-2">
                    <Users className="w-5 h-5 text-blue-600" />
                  </div>
                  <p className="text-3xl font-bold text-[#1E1B2E]">{attendees.length}</p>
                  <p className="text-xs text-[#6B6880] mt-0.5">
                    Terdaftar{event.attendee_limit ? ` / ${event.attendee_limit} slot` : ""}
                  </p>
                </div>
                <div className="bg-white border border-[#EAE6F5] rounded-xl p-5 text-center">
                  <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center mx-auto mb-2">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  </div>
                  <p className="text-3xl font-bold text-[#1E1B2E]">{checkedInCount}</p>
                  <p className="text-xs text-[#6B6880] mt-0.5">Sudah Check-in di Tempat</p>
                </div>
              </div>

              <div className="bg-white border border-[#EAE6F5] rounded-xl p-5">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="font-bold text-[#1E1B2E]">Peserta</h2>
                  <Link
                    href={`/employer/events/${id}/attendees`}
                    className="text-sm text-[#D64545] hover:underline font-semibold flex items-center gap-0.5"
                  >
                    Kelola Peserta <ChevronRight className="w-4 h-4" />
                  </Link>
                </div>
                <p className="text-sm text-[#6B6880]">
                  {attendees.length === 0
                    ? "Belum ada peserta yang RSVP."
                    : `${attendees.length} peserta terdaftar — ${checkedInCount} sudah hadir & check-in.`}
                </p>
              </div>

              {event.description && (
                <div className="bg-white border border-[#EAE6F5] rounded-xl p-5">
                  <h2 className="font-bold text-[#1E1B2E] mb-2">Deskripsi Event</h2>
                  <p className="text-sm text-[#232F3E] leading-relaxed whitespace-pre-line break-words">
                    {event.description}
                  </p>
                </div>
              )}
            </div>

            {/* Kolom kanan: kode & QR check-in */}
            <div className="space-y-4">
              <div className="bg-white border-2 border-[#D64545]/30 rounded-xl p-6 text-center">
                <div className="flex items-center justify-center gap-2 mb-1">
                  <QrCode className="w-5 h-5 text-[#D64545]" />
                  <h2 className="font-bold text-[#1E1B2E]">Check-in di Tempat</h2>
                </div>
                <p className="text-xs text-[#6B6880] mb-4">
                  Tunjukkan QR ini di lokasi — peserta scan untuk check-in otomatis
                </p>

                {event.check_in_code ? (
                  <>
                    {qrDataUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={qrDataUrl} alt="QR Check-in" className="w-56 h-56 mx-auto rounded-lg border border-[#EAE6F5]" />
                    ) : (
                      <div className="w-56 h-56 mx-auto rounded-lg bg-[#F8F6FF] flex items-center justify-center">
                        <Loader2 className="w-6 h-6 animate-spin text-[#D64545]" />
                      </div>
                    )}

                    <p className="text-xs text-[#6B6880] mt-4 mb-1.5 flex items-center justify-center gap-1">
                      <KeyRound className="w-3.5 h-3.5" /> Atau masukkan kode manual:
                    </p>
                    <button
                      onClick={copyCode}
                      className="inline-flex items-center gap-2 bg-[#FFF5F5] border border-[#D64545]/30 hover:border-[#D64545] rounded-lg px-4 py-2.5 transition-colors group"
                      title="Klik untuk salin"
                    >
                      <span className="text-xl font-mono font-bold tracking-[0.25em] text-[#D64545]">
                        {event.check_in_code}
                      </span>
                      <Copy className="w-4 h-4 text-[#D64545] opacity-60 group-hover:opacity-100" />
                    </button>
                    {copied && <p className="text-xs text-green-600 font-semibold mt-1.5">✓ Kode disalin!</p>}
                  </>
                ) : (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-xs text-yellow-800">
                    Event ini belum punya kode check-in. Kode diisi saat membuat event —
                    tambahkan lewat form Buat Event berikutnya.
                  </div>
                )}
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <p className="text-xs font-bold text-blue-800 mb-1">ℹ️ Cara kerjanya</p>
                <p className="text-xs text-blue-700 leading-relaxed">
                  Peserta yang sudah RSVP tinggal <strong>scan QR</strong> dengan kamera HP —
                  otomatis membuka halaman event dengan kode terisi, klik konfirmasi, dan
                  kehadirannya tercatat (plus badge kehadiran ✓).
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />

      <Modal isOpen={showComplete} onClose={() => setShowComplete(false)} title="Tandai Event Selesai?" size="sm">
        <div>
          <p className="text-sm text-[#6B6880] mb-5">
            <strong className="text-[#1E1B2E]">{event.title}</strong> akan ditandai selesai dan tampil
            sebagai "Selesai" di halaman freelancer. Peserta tidak bisa RSVP lagi setelah ini.
          </p>
          <div className="flex gap-2">
            <Button fullWidth size="lg" loading={completing} onClick={handleComplete}>
              Ya, Tandai Selesai
            </Button>
            <button
              onClick={() => setShowComplete(false)}
              className="px-5 bg-[#F8F6FF] hover:bg-[#EAE6F5] text-[#6B6880] rounded-lg font-semibold text-sm transition-colors"
            >
              Batal
            </button>
          </div>
        </div>
      </Modal>

      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} duration={4000} />
      )}
    </>
  );
}
