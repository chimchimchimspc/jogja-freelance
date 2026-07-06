"use client";
import { Suspense, useState, useEffect, useMemo, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Header from "../components/layout/Header";
import Footer from "../components/layout/Footer";
import EventCard from "../components/events/EventCard";
import CheckInModal from "../components/events/CheckInModal";
import Toast from "../components/ui/Toast";
import { Calendar, Search, X, Loader2 } from "lucide-react";
import type { Event as LocalEvent, EventType } from "../data/events";
import { EVENT_TYPES } from "../data/events";
import FadeInSection from "../components/ui/FadeInSection";
import { eventsApi, type ApiEvent } from "../lib/events.api";
import { useAuth } from "../context/AuthContext";

type FilterType = "upcoming" | "past";

// Adapter: ApiEvent → local Event shape
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

function EventsPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const [filterType, setFilterType] = useState<FilterType>("upcoming");
  const [selectedCategory, setSelectedCategory] = useState<EventType | "semua">("semua");
  const [search, setSearch] = useState(searchParams.get("search") ?? "");
  const [checkInEvent, setCheckInEvent] = useState<LocalEvent | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const [events, setEvents]         = useState<LocalEvent[]>([]);
  const [rsvpedIds, setRsvpedIds]   = useState<Set<string>>(new Set());
  const [rsvpLoadingId, setRsvpLoadingId] = useState<string | null>(null);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState<string | null>(null);

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await eventsApi.list({
        upcoming: filterType === "upcoming" ? true : undefined,
        past: filterType === "past" ? true : undefined,
        search: search.trim() || undefined,
      });
      setEvents(res.data.map(adaptEvent));
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Gagal memuat events");
    } finally {
      setLoading(false);
    }
  }, [filterType, search]);

  useEffect(() => {
    const t = setTimeout(fetchEvents, 300);
    return () => clearTimeout(t);
  }, [fetchEvents]);

  // Muat event yang sudah di-RSVP agar tombolnya jadi "Terdaftar"
  useEffect(() => {
    if (!user) return;
    (async () => {
      try {
        const res = await eventsApi.attended();
        setRsvpedIds(new Set(res.data.map((e) => e.id)));
      } catch {}
    })();
  }, [user]);

  const handleRsvp = async (event: LocalEvent) => {
    if (!user) {
      router.push("/auth/login?redirect=/events");
      return;
    }
    setRsvpLoadingId(event.id);
    try {
      await eventsApi.rsvp(event.id);
      setRsvpedIds((prev) => new Set([...prev, event.id]));
      setEvents((prev) =>
        prev.map((e) => (e.id === event.id ? { ...e, attendeeCount: e.attendeeCount + 1 } : e))
      );
      setToast(`✓ RSVP "${event.title}" berhasil! Jangan lupa check-in saat event dimulai.`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "RSVP gagal. Coba lagi.";
      if (msg.includes("Already RSVPd")) {
        setRsvpedIds((prev) => new Set([...prev, event.id]));
        setToast("Kamu sudah terdaftar di event ini.");
      } else {
        setToast(msg.includes("full") ? "Event sudah penuh." : msg);
      }
    } finally {
      setRsvpLoadingId(null);
    }
  };

  const filtered = useMemo(() => {
    let result = events;
    if (selectedCategory !== "semua") {
      result = result.filter((e) => e.type === selectedCategory);
    }
    return result.sort((a, b) => a.date.localeCompare(b.date));
  }, [events, selectedCategory]);

  const handleCheckInSuccess = () => {
    setToast("✓ Check-in berhasil! Badge kehadiran langsung masuk ke profilmu 🎉");
  };

  return (
    <>
      <Header />
      <main className="flex-1 bg-[#F1F1F1]">
        <div className="bg-white text-[#1E1B2E] py-10">
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex items-center gap-3 mb-2">
              <Calendar className="w-6 h-6 text-[#D64545]" />
              <h1 className="text-3xl font-bold">Events & Workshop</h1>
            </div>
            <p className="text-[#6B6880] text-sm">Workshop, meetup, dan networking event untuk freelancer Yogyakarta</p>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 py-6">
          {/* Search */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#565A5C]" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari judul event, deskripsi, atau lokasi..."
              className="w-full pl-9 pr-9 py-2.5 text-sm border border-[#CCCCCC] rounded-lg bg-white focus:outline-none focus:border-[#D64545] focus:ring-2 focus:ring-[#D64545]/10"
            />
            {search && (
              <button onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#565A5C] hover:text-[#232F3E]">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="flex flex-col sm:flex-row gap-3 mb-6">
            <div className="flex gap-2 bg-white border border-[#E7E7E7] rounded-lg p-1">
              {(["upcoming", "past"] as const).map((f) => (
                <button key={f} onClick={() => setFilterType(f)}
                  className={`px-4 py-2 text-sm font-semibold rounded transition-colors ${
                    filterType === f ? "bg-[#D64545] text-white" : "text-[#565A5C] hover:bg-[#F1F1F1]"
                  }`}>
                  {f === "upcoming" ? "Mendatang" : "Selesai"}
                </button>
              ))}
            </div>

            <div className="flex gap-2 flex-wrap">
              <button onClick={() => setSelectedCategory("semua")}
                className={`text-xs px-3 py-2 rounded-full font-semibold transition-colors ${
                  selectedCategory === "semua"
                    ? "bg-[#D64545] text-white"
                    : "bg-white border border-[#CCCCCC] text-[#565A5C] hover:border-[#D64545]"
                }`}>
                Semua
              </button>
              {(Object.keys(EVENT_TYPES) as EventType[]).map((type) => (
                <button key={type} onClick={() => setSelectedCategory(type)}
                  className={`text-xs px-3 py-2 rounded-full font-semibold transition-colors flex items-center gap-1 ${
                    selectedCategory === type
                      ? "bg-[#D64545] text-white"
                      : "bg-white border border-[#CCCCCC] text-[#565A5C] hover:border-[#D64545]"
                  }`}>
                  <span>{EVENT_TYPES[type].icon}</span> {EVENT_TYPES[type].label}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-[#D64545]" />
            </div>
          ) : error ? (
            <div className="bg-white border border-[#E7E7E7] rounded-lg p-16 text-center">
              <p className="text-[#DC2C1E]">{error}</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="bg-white border border-[#E7E7E7] rounded-lg p-16 text-center">
              <div className="text-5xl mb-4">📭</div>
              <h3 className="text-lg font-bold text-[#232F3E] mb-2">Tidak ada event</h3>
              <p className="text-sm text-[#565A5C]">
                {filterType === "past" ? "Belum ada event sebelumnya" : "Tidak ada event mendatang untuk filter ini"}
              </p>
            </div>
          ) : (
            <>
              <p className="text-sm text-[#565A5C] mb-4">
                Menampilkan <strong>{filtered.length}</strong> event
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filtered.map((event, i) => (
                  <FadeInSection key={event.id} delay={Math.min(i * 80, 320)}>
                    <EventCard
                      event={event}
                      onRsvp={handleRsvp}
                      rsvped={rsvpedIds.has(event.id)}
                      rsvpLoading={rsvpLoadingId === event.id}
                    />
                  </FadeInSection>
                ))}
              </div>
            </>
          )}
        </div>
      </main>

      <Footer />

      <CheckInModal
        event={checkInEvent}
        isOpen={!!checkInEvent}
        onClose={() => setCheckInEvent(null)}
        onSuccess={handleCheckInSuccess}
      />

      {toast && <Toast message={toast} type="success" onClose={() => setToast(null)} duration={5000} />}
    </>
  );
}

export default function EventsPage() {
  return (
    <Suspense fallback={<main className="flex-1 bg-[#F1F1F1] py-16 text-center text-sm text-[#565A5C]">Memuat…</main>}>
      <EventsPageInner />
    </Suspense>
  );
}
