"use client";
import { use, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Header from "../../components/layout/Header";
import Footer from "../../components/layout/Footer";
import Badge from "../../components/ui/Badge";
import Button from "../../components/ui/Button";
import CheckInModal from "../../components/events/CheckInModal";
import Toast from "../../components/ui/Toast";
import { ArrowLeft, Calendar, Clock, MapPin, Users, Link2, CheckCircle, Loader2 } from "lucide-react";
import Link from "next/link";
import EventMap from "../../components/events/EventMap";
import { EVENT_TYPES, formatDate, formatTime, type Event as LocalEvent } from "../../data/events";
import { eventsApi, type ApiEvent } from "../../lib/events.api";
import { useAuth } from "../../context/AuthContext";
import { assetUrl } from "../../lib/api";

// Adapter: ApiEvent → local Event shape (dipakai EventMap & CheckInModal)
function adaptEvent(e: ApiEvent): LocalEvent {
  return {
    id: e.id,
    title: e.title,
    description: e.description,
    type: e.type,
    date: e.event_date,
    time: e.event_time,
    duration: e.duration_minutes,
    location: e.location_name,
    latitude: e.latitude ?? 0,
    longitude: e.longitude ?? 0,
    organizerId: "",
    organizerName: e.organizer_name,
    image: e.image_url,
    attendeeLimit: e.attendee_limit,
    attendeeCount: e.attendee_count,
    checkInCode: e.check_in_code ?? "",
    skills: e.skills ?? [],
    isFree: e.is_free,
    price: e.price,
    registrationUrl: e.registration_url,
    status: e.status,
  };
}

export default function EventDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { user } = useAuth();

  const [event, setEvent] = useState<LocalEvent | null>(null);
  const [organizer, setOrganizer] = useState<{ company?: string; logo?: string; industry?: string }>({});
  const [loading, setLoading] = useState(true);
  const [qrCode, setQrCode] = useState<string>("");
  const [showCheckIn, setShowCheckIn] = useState(false);
  const [isAttending, setIsAttending] = useState(false);
  const [rsvpLoading, setRsvpLoading] = useState(false);
  const [checkedIn, setCheckedIn] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await eventsApi.get(id);
        setEvent(adaptEvent(res.data));
        setOrganizer({
          company: res.data.organizer_company,
          logo: res.data.organizer_logo,
          industry: res.data.organizer_industry,
        });
      } catch {
        setEvent(null);
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  // Cek apakah user sudah RSVP event ini (mis. dari kartu di halaman Events)
  useEffect(() => {
    if (!user) return;
    (async () => {
      try {
        const res = await eventsApi.attended();
        const mine = res.data.find((e) => e.id === id);
        if (mine) {
          setIsAttending(true);
          if (mine.checked_in) setCheckedIn(true);
        }
      } catch {}
    })();
  }, [id, user]);

  // Datang dari scan QR pengelola (?checkin=KODE):
  // auto-RSVP bila belum, lalu buka modal check-in dengan kode terisi
  useEffect(() => {
    if (loading || !event || !user || checkedIn) return;
    const code = new URLSearchParams(window.location.search).get("checkin");
    if (!code) return;
    setQrCode(code.toUpperCase());
    (async () => {
      if (!isAttending) {
        try {
          await eventsApi.rsvp(event.id);
          setIsAttending(true);
        } catch {
          setIsAttending(true); // kemungkinan sudah RSVP
        }
      }
      setShowCheckIn(true);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, event, user]);

  const handleRsvp = async () => {
    if (!user) {
      router.push(`/auth/login?redirect=/events/${id}`);
      return;
    }
    if (!event) return;
    setRsvpLoading(true);
    try {
      await eventsApi.rsvp(event.id);
      setIsAttending(true);
      setEvent((p) => (p ? { ...p, attendeeCount: p.attendeeCount + 1 } : p));
      setToast({ message: "✓ RSVP berhasil! Jangan lupa check-in saat event dimulai.", type: "success" });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "RSVP gagal. Coba lagi.";
      if (msg.includes("Already RSVPd")) {
        setIsAttending(true);
        setToast({ message: "Anda sudah RSVP ke event ini.", type: "success" });
      } else {
        setToast({ message: msg.includes("full") ? "Event sudah penuh." : msg, type: "error" });
      }
    } finally {
      setRsvpLoading(false);
    }
  };

  if (loading) {
    return (
      <>
        <Header />
        <main className="flex-1 bg-[#F1F1F1] flex items-center justify-center py-24">
          <Loader2 className="w-8 h-8 animate-spin text-[#D64545]" />
        </main>
        <Footer />
      </>
    );
  }

  if (!event) {
    return (
      <>
        <Header />
        <main className="flex-1 bg-[#F1F1F1] flex items-center justify-center py-24">
          <div className="text-center">
            <div className="text-5xl mb-4">📭</div>
            <h1 className="text-lg font-bold text-[#232F3E] mb-2">Event tidak ditemukan</h1>
            <Link href="/events" className="text-sm text-[#D64545] hover:underline font-semibold">
              ← Kembali ke Events
            </Link>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  const type = EVENT_TYPES[event.type];
  const full = !!event.attendeeLimit && event.attendeeCount >= event.attendeeLimit;
  const isCompleted = event.status === "completed";
  const hasCoords = !!(event.latitude && event.longitude);
  const durationLabel =
    event.duration >= 60
      ? `${Math.floor(event.duration / 60)} jam${event.duration % 60 ? ` ${event.duration % 60} mnt` : ""}`
      : `${event.duration} menit`;

  return (
    <>
      <Header />
      <main className="flex-1 bg-[#F1F1F1] py-8">
        <div className="max-w-4xl mx-auto px-4">
          {/* Back button */}
          <Link
            href="/events"
            className="inline-flex items-center gap-1 text-sm text-[#D64545] hover:underline mb-6"
          >
            <ArrowLeft className="w-4 h-4" /> Kembali ke Events
          </Link>

          {/* Foto event */}
          {event.image && (
            <div className="w-full h-64 sm:h-80 rounded-lg overflow-hidden mb-6 border border-[#E7E7E7]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={assetUrl(event.image)} alt={event.title} className="w-full h-full object-cover" />
            </div>
          )}

          {/* Header */}
          <div className="bg-white border border-[#E7E7E7] rounded-lg p-6 sm:p-8 mb-6">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-3">
                  <Badge label={`${type?.icon ?? ""} ${type?.label ?? event.type}`} color="orange" />
                  {isCompleted && <Badge label="Selesai" color="gray" />}
                  {!isCompleted && full && <Badge label="Penuh" color="red" />}
                  {event.isFree && <Badge label="Gratis" color="green" />}
                </div>
                <h1 className="text-3xl font-bold text-[#232F3E] mb-1">{event.title}</h1>
                <p className="text-sm text-[#565A5C]">Oleh {event.organizerName}</p>
              </div>
            </div>

            {/* Event meta */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-4 border-t border-b border-[#E7E7E7]">
              {[
                { icon: Calendar, label: formatDate(event.date) },
                { icon: Clock, label: `${formatTime(event.time)} • ${durationLabel}` },
                { icon: MapPin, label: event.location || "Lokasi menyusul" },
                {
                  icon: Users,
                  label: event.attendeeLimit
                    ? `${event.attendeeCount}/${event.attendeeLimit} peserta`
                    : `${event.attendeeCount} peserta`,
                },
              ].map((m, i) => {
                const Icon = m.icon;
                return (
                  <div key={i} className="flex items-center gap-3">
                    <Icon className="w-5 h-5 text-[#D64545] flex-shrink-0" />
                    <span className="text-sm text-[#232F3E]">{m.label}</span>
                  </div>
                );
              })}
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-wrap gap-3 mt-6">
              {isCompleted ? (
                <div className="flex items-center gap-2 px-6 py-3 bg-gray-100 border border-gray-200 rounded-lg">
                  <CheckCircle className="w-5 h-5 text-gray-500" />
                  <span className="font-semibold text-gray-600">Event ini sudah selesai</span>
                </div>
              ) : checkedIn ? (
                <div className="flex items-center gap-2 px-6 py-3 bg-green-50 border border-green-200 rounded-lg">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span className="font-semibold text-green-700">Sudah Check-in</span>
                </div>
              ) : isAttending ? (
                <Button onClick={() => setShowCheckIn(true)} size="lg">
                  Check-in Event
                </Button>
              ) : (
                <Button onClick={handleRsvp} disabled={full} loading={rsvpLoading} size="lg">
                  {full ? "Event Sudah Penuh" : "RSVP Sekarang"}
                </Button>
              )}

              {event.registrationUrl && (
                <a
                  href={event.registrationUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-[#F1F1F1] hover:bg-[#E7E7E7] text-[#232F3E] font-semibold rounded-lg transition-colors"
                >
                  <Link2 className="w-5 h-5" />
                  Daftar Eksternal
                </a>
              )}
            </div>
          </div>

          {/* Content */}
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
            {/* Description */}
            <div className="bg-white border border-[#E7E7E7] rounded-lg p-6">
              <h2 className="text-lg font-bold text-[#232F3E] mb-4">Tentang Event</h2>
              <p className="text-sm text-[#232F3E] leading-relaxed mb-6 whitespace-pre-line break-words">
                {event.description || "Belum ada deskripsi."}
              </p>

              {/* Skills */}
              {event.skills.length > 0 && (
                <>
                  <h3 className="text-sm font-bold text-[#232F3E] mb-2">Skill yang Relevan</h3>
                  <div className="flex flex-wrap gap-2 mb-6">
                    {event.skills.map((skill) => (
                      <span key={skill} className="text-xs bg-blue-50 text-[#146EB4] px-3 py-1.5 rounded-full font-semibold">
                        {skill}
                      </span>
                    ))}
                  </div>
                </>
              )}

              {/* Organizer — profil dari pengelola */}
              <div className="bg-[#F1F1F1] rounded-lg p-4">
                <h3 className="text-sm font-bold text-[#232F3E] mb-3">Penyelenggara</h3>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-[#D64545] flex items-center justify-center text-white font-bold overflow-hidden flex-shrink-0">
                    {organizer.logo ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={assetUrl(organizer.logo)}
                        alt={organizer.company ?? event.organizerName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      (organizer.company ?? event.organizerName ?? "?").charAt(0)
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-[#232F3E]">
                      {organizer.company ?? event.organizerName}
                    </p>
                    <p className="text-xs text-[#565A5C]">
                      {organizer.industry || "Verified Organizer"}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-4">
              {/* Price */}
              <div className="bg-white border border-[#E7E7E7] rounded-lg p-5">
                <p className="text-xs text-[#565A5C] font-bold uppercase mb-2">Biaya</p>
                {event.isFree ? (
                  <p className="text-2xl font-bold text-green-600">GRATIS</p>
                ) : (
                  <p className="text-2xl font-bold text-[#232F3E]">
                    Rp {Number(event.price || 0).toLocaleString("id-ID")}
                  </p>
                )}
              </div>

              {/* Location */}
              <div className="bg-white border border-[#E7E7E7] rounded-lg overflow-hidden">
                <div className="p-5">
                  <p className="text-sm font-bold text-[#232F3E] mb-3 flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-[#D64545]" />
                    Lokasi
                  </p>
                  <p className="text-sm text-[#232F3E] leading-relaxed bg-[#F8F8F8] p-3 rounded">
                    {event.location || "Lokasi akan diumumkan"}
                  </p>
                </div>

                {hasCoords && (
                  <>
                    <div style={{ height: "300px" }} className="w-full border-t border-[#E7E7E7]">
                      <EventMap event={event} />
                    </div>
                    <div className="p-5 border-t border-[#E7E7E7]">
                      <a
                        href={`https://maps.google.com/?q=${event.latitude},${event.longitude}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 text-sm text-[#D64545] hover:text-[#C23B3B] font-semibold"
                      >
                        <MapPin className="w-4 h-4" />
                        Buka di Google Maps →
                      </a>
                    </div>
                  </>
                )}
              </div>

              {/* Attendees */}
              <div className="bg-white border border-[#E7E7E7] rounded-lg p-5">
                <p className="text-sm font-bold text-[#232F3E] mb-3">Peserta</p>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-[#565A5C]">Terdaftar</span>
                    <strong className="text-[#232F3E]">{event.attendeeCount}</strong>
                  </div>
                  {event.attendeeLimit ? (
                    <>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-[#565A5C]">Kapasitas</span>
                        <strong className="text-[#232F3E]">{event.attendeeLimit}</strong>
                      </div>
                      <div className="w-full bg-[#E7E7E7] rounded-full h-2 mt-2">
                        <div
                          className="bg-[#D64545] h-2 rounded-full transition-all"
                          style={{ width: `${Math.min((event.attendeeCount / event.attendeeLimit) * 100, 100)}%` }}
                        />
                      </div>
                    </>
                  ) : (
                    <p className="text-xs text-[#565A5C]">Tanpa batas kapasitas</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />

      <CheckInModal
        event={showCheckIn ? event : null}
        isOpen={showCheckIn}
        initialCode={qrCode}
        onClose={() => setShowCheckIn(false)}
        onSuccess={() => {
          setCheckedIn(true);
          setShowCheckIn(false);
          setToast({ message: "✓ Check-in berhasil! Badge kehadiran langsung masuk ke profilmu 🎉", type: "success" });
        }}
      />

      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}
    </>
  );
}
