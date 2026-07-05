"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Header from "../../components/layout/Header";
import Footer from "../../components/layout/Footer";
import {
  Users, Clock, Plus, MapPin, Building2,
  CalendarDays, Loader2, Hourglass, PartyPopper, ChevronRight,
} from "lucide-react";
import Link from "next/link";
import { useAuth } from "../../context/AuthContext";
import { profileApi, type ApiEmployerProfile } from "../../lib/profile.api";
import { eventsApi, type ApiEvent } from "../../lib/events.api";
import { assetUrl } from "../../lib/api";

type MyEvent = ApiEvent & { status: string; created_at: string };

const statusBadge: Record<string, { label: string; cls: string }> = {
  active:         { label: "Aktif",           cls: "bg-green-100 text-green-700" },
  pending_review: { label: "Menunggu Review", cls: "bg-yellow-100 text-yellow-700" },
  rejected:       { label: "Ditolak",         cls: "bg-red-100 text-red-700" },
  closed:         { label: "Selesai",         cls: "bg-gray-100 text-gray-500" },
};

const EVENT_TYPE_LABEL: Record<string, string> = {
  workshop: "🎓 Workshop", meetup: "👥 Meetup", coffee_chat: "☕ Coffee Chat", networking: "🤝 Networking",
};

function fmtDate(d: string) {
  if (!d) return "-";
  return new Date(d).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
}

export default function EmployerEventsDashboard() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [profile, setProfile] = useState<ApiEmployerProfile | null>(null);
  const [events, setEvents] = useState<MyEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push("/auth/login?redirect=/employer/events");
      return;
    }
    if (user.role !== "employer" && user.role !== "event_organizer" && user.role !== "admin") {
      router.push("/");
      return;
    }
    (async () => {
      try {
        const [profRes, eventsRes] = await Promise.all([
          profileApi.getOwnEmployer(),
          eventsApi.mine(),
        ]);
        setProfile(profRes.data);
        setEvents(eventsRes.data);
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : "Gagal memuat dashboard event");
      } finally {
        setLoading(false);
      }
    })();
  }, [user, authLoading, router]);

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

  if (error) {
    return (
      <>
        <Header />
        <main className="flex-1 bg-[#F8F6FF] flex items-center justify-center py-24">
          <div className="text-center">
            <p className="text-[#DC2C1E] mb-4">{error}</p>
            <button onClick={() => window.location.reload()}
              className="text-sm text-[#146EB4] hover:underline">Coba lagi</button>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  const activeEvents   = events.filter((e) => e.status === "active").length;
  const pendingEvents  = events.filter((e) => e.status === "pending_review").length;
  const totalAttendees = events.reduce((sum, e) => sum + (Number(e.attendee_count) || 0), 0);

  return (
    <>
      <Header />
      <main className="flex-1 bg-[#F8F6FF]">
        {/* Top banner */}
        <div className="bg-white text-[#1E1B2E] py-8">
          <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl bg-[#D64545] flex items-center justify-center text-2xl font-bold text-white overflow-hidden">
                {profile?.company_logo_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={assetUrl(profile.company_logo_url)} alt={profile.company_name} className="w-full h-full object-cover" />
                ) : (
                  profile?.company_name?.charAt(0) ?? "?"
                )}
              </div>
              <div>
                <h1 className="text-xl font-bold">{profile?.company_name}</h1>
                <p className="text-[#6B6880]/60 text-sm flex items-center gap-1.5 mt-0.5">
                  <MapPin className="w-3.5 h-3.5" /> {profile?.location || profile?.city || "Yogyakarta"}
                  {profile?.industry && (
                    <>
                      <span className="mx-1 text-[#CCCCCC]">·</span>
                      <Building2 className="w-3.5 h-3.5" /> {profile.industry}
                    </>
                  )}
                </p>
              </div>
            </div>
            <Link
              href="/employer/post-event"
              className="flex items-center gap-2 bg-[#D64545] hover:bg-[#C23B3B] text-white font-semibold text-sm px-4 py-2.5 rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4" /> Buat Event
            </Link>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-4 py-8">
          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
            {[
              { label: "Event Aktif",     value: activeEvents,   icon: PartyPopper,  color: "text-[#D64545]",  bg: "bg-purple-50" },
              { label: "Menunggu Review", value: pendingEvents,  icon: Hourglass,    color: "text-yellow-600", bg: "bg-yellow-50" },
              { label: "Total Peserta",   value: totalAttendees, icon: Users,        color: "text-blue-600",   bg: "bg-blue-50"   },
              { label: "Total Event",     value: events.length,  icon: CalendarDays, color: "text-green-600",  bg: "bg-green-50"  },
            ].map((s) => (
              <div key={s.label} className="bg-white border border-[#EAE6F5] rounded-xl p-4">
                <div className={`w-9 h-9 ${s.bg} rounded-lg flex items-center justify-center mb-3`}>
                  <s.icon className={`w-5 h-5 ${s.color}`} />
                </div>
                <p className="text-2xl font-bold text-[#1E1B2E]">{s.value}</p>
                <p className="text-xs text-[#6B6880] mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
            {/* Event list */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-bold text-[#1E1B2E]">Event Saya</h2>
                <Link href="/employer/post-event" className="text-sm text-[#D64545] hover:underline font-semibold">
                  + Buat event
                </Link>
              </div>

              {events.length === 0 ? (
                <div className="bg-white border border-dashed border-[#D5D0E8] rounded-xl p-8 text-center">
                  <CalendarDays className="w-8 h-8 text-[#D5D0E8] mx-auto mb-2" />
                  <p className="text-sm text-[#6B6880] mb-3">Belum ada event yang dibuat</p>
                  <Link href="/employer/post-event" className="text-sm text-[#D64545] hover:underline font-semibold">
                    Buat event pertama Anda →
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {events.map((ev) => {
                    const badge = statusBadge[ev.status] ?? statusBadge.closed;
                    return (
                      <div key={ev.id} className="bg-white border border-[#EAE6F5] rounded-xl p-5 hover:border-[#D64545]/40 transition-colors">
                        <div className="flex items-start justify-between gap-3 mb-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap mb-1">
                              <h3 className="font-bold text-[#1E1B2E]">{ev.title}</h3>
                              <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${badge.cls}`}>
                                {badge.label}
                              </span>
                            </div>
                            <div className="flex flex-wrap gap-2 text-xs text-[#6B6880]">
                              <span>{EVENT_TYPE_LABEL[ev.type] ?? ev.type}</span>
                              <span>·</span>
                              <span>📅 {fmtDate(ev.event_date)}{ev.event_time ? ` · ${ev.event_time.slice(0, 5)}` : ""}</span>
                              {ev.location_name && (
                                <>
                                  <span>·</span>
                                  <span>📍 {ev.location_name}</span>
                                </>
                              )}
                            </div>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <p className="text-xs text-[#6B6880]">Biaya</p>
                            <p className="text-sm font-bold text-[#1E1B2E]">
                              {ev.is_free ? "Gratis" : `Rp ${Number(ev.price ?? 0).toLocaleString("id-ID")}`}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-4 mb-2">
                          <div className="flex items-center gap-1.5 text-sm">
                            <Users className="w-4 h-4 text-[#6B6880]" />
                            <span className="font-semibold text-[#1E1B2E]">{ev.attendee_count ?? 0}</span>
                            <span className="text-[#6B6880]">
                              peserta{ev.attendee_limit ? ` / ${ev.attendee_limit} slot` : ""}
                            </span>
                          </div>
                          {ev.status === "pending_review" && (
                            <span className="text-xs text-yellow-700 italic flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5" /> Sedang direview admin
                            </span>
                          )}
                        </div>

                        {ev.skills?.length > 0 && (
                          <div className="flex flex-wrap gap-1.5">
                            {ev.skills.map((s) => (
                              <span key={s} className="text-xs bg-[#F3F0FB] text-[#D64545] px-2 py-0.5 rounded">
                                {s}
                              </span>
                            ))}
                          </div>
                        )}

                        {Number(ev.attendee_count) > 0 && (
                          <Link
                            href={`/employer/events/${ev.id}/attendees`}
                            className="flex items-center gap-1 text-sm text-[#D64545] hover:underline font-semibold mt-3"
                          >
                            Lihat Peserta <ChevronRight className="w-4 h-4" />
                          </Link>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Right sidebar */}
            <div className="space-y-5">
              <div className="bg-white border border-[#EAE6F5] rounded-xl p-5">
                <div className="flex items-center gap-2 mb-4">
                  <Clock className="w-4 h-4 text-[#E8B4D1]" />
                  <h3 className="font-bold text-sm text-[#1E1B2E]">
                    Bergabung {profile?.created_at ? fmtDate(profile.created_at) : "-"}
                  </h3>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-[#F8F6FF] rounded-lg p-3 text-center">
                    <p className="text-2xl font-bold text-[#D64545]">{events.length}</p>
                    <p className="text-xs text-[#6B6880] mt-0.5">Event Dibuat</p>
                  </div>
                  <div className="bg-[#F8F6FF] rounded-lg p-3 text-center">
                    <p className="text-2xl font-bold text-[#D64545]">{totalAttendees}</p>
                    <p className="text-xs text-[#6B6880] mt-0.5">Total Peserta</p>
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <p className="text-xs font-bold text-blue-800 mb-1">ℹ️ Alur Review</p>
                <p className="text-xs text-blue-700 leading-relaxed">
                  Event yang baru dibuat akan <strong>direview admin</strong> terlebih dahulu.
                  Setelah disetujui, otomatis tampil di halaman{" "}
                  <Link href="/events" className="underline font-semibold">Events</Link> untuk para freelancer.
                </p>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                <p className="text-xs font-bold text-amber-800 mb-1">💡 Tips Event</p>
                <p className="text-xs text-amber-700 leading-relaxed">
                  Sertakan <strong>kode check-in</strong> saat membuat event agar peserta bisa check-in
                  di lokasi dan mendapatkan badge kehadiran.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
