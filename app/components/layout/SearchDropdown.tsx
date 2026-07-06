"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Search, X, Briefcase, Calendar, Loader2, MapPin, ArrowRight } from "lucide-react";
import { jobsApi, type ApiJob } from "../../lib/jobs.api";
import { eventsApi, type ApiEvent } from "../../lib/events.api";

interface SearchDropdownProps {
  variant?: "desktop" | "mobile";
  onNavigate?: () => void;
}

const EVENT_TYPE_ICON: Record<string, string> = {
  workshop: "🎓", meetup: "👥", coffee_chat: "☕", networking: "🤝",
};

function fmtBudget(min?: number, max?: number) {
  const f = (n: number) => (n >= 1_000_000 ? `${(n / 1_000_000).toLocaleString("id-ID")}jt` : `${(n / 1000).toFixed(0)}rb`);
  return `Rp ${f(Number(min ?? 0))} – ${f(Number(max ?? 0))}`;
}

function fmtEventDate(d: string) {
  return new Date(d).toLocaleDateString("id-ID", { day: "numeric", month: "short" });
}

export default function SearchDropdown({ variant = "desktop", onNavigate }: SearchDropdownProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [jobs, setJobs] = useState<ApiJob[]>([]);
  const [events, setEvents] = useState<ApiEvent[]>([]);
  const [searched, setSearched] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Debounced live search — rekomendasi lowongan & event sesuai ketikan
  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) {
      setJobs([]);
      setEvents([]);
      setSearched(false);
      return;
    }
    setLoading(true);
    const t = setTimeout(async () => {
      try {
        const [jobsRes, eventsRes] = await Promise.allSettled([
          jobsApi.list({ search: q, limit: 4 }),
          eventsApi.list({ search: q, limit: 3 }),
        ]);
        setJobs(jobsRes.status === "fulfilled" ? jobsRes.value.data : []);
        setEvents(eventsRes.status === "fulfilled" ? eventsRes.value.data : []);
      } finally {
        setLoading(false);
        setSearched(true);
      }
    }, 350);
    return () => clearTimeout(t);
  }, [query]);

  // Fokus otomatis saat search box baru dibuka (desktop toggle / mobile menu)
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    }
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [open]);

  const goTo = useCallback((href: string) => {
    setOpen(false);
    onNavigate?.();
    router.push(href);
  }, [router, onNavigate]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    goTo(`/jobs?search=${encodeURIComponent(query.trim())}`);
  };

  const hasQuery = query.trim().length >= 2;
  const hasResults = jobs.length > 0 || events.length > 0;
  const showPanel = open && hasQuery;

  return (
    <div ref={wrapRef} className="relative w-full">
      <form onSubmit={handleSubmit} className="relative w-full">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#565A5C] pointer-events-none" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          placeholder="Cari lowongan, skill, atau event..."
          className={
            variant === "desktop"
              ? "w-full pl-9 pr-8 py-2 text-sm border border-[#E0E0E0] rounded-lg bg-[#F8F8F8] text-[#232F3E] placeholder:text-[#999] focus:outline-none focus:border-[#D64545] focus:ring-2 focus:ring-[#D64545]/10"
              : "w-full pl-9 pr-8 py-2 text-sm rounded-lg border border-[#E0E0E0] bg-[#F8F8F8] text-[#232F3E] placeholder:text-[#999] focus:outline-none"
          }
        />
        {query && (
          <button
            type="button"
            onClick={() => { setQuery(""); inputRef.current?.focus(); }}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#9AA0A6] hover:text-[#565A5C]"
            aria-label="Hapus pencarian"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </form>

      {/* Dropdown rekomendasi hasil */}
      {showPanel && (
        <div className="absolute left-0 right-0 mt-2 bg-white rounded-lg shadow-xl border border-[#E7E7E7] z-50 overflow-hidden max-h-[70vh] overflow-y-auto">
          {loading && !searched ? (
            <div className="p-6 flex items-center justify-center gap-2 text-sm text-[#6B6880]">
              <Loader2 className="w-4 h-4 animate-spin" /> Mencari...
            </div>
          ) : !hasResults ? (
            <div className="p-6 text-center text-sm text-[#6B6880]">
              Tidak ada hasil untuk "<strong className="text-[#232F3E]">{query}</strong>"
            </div>
          ) : (
            <>
              {jobs.length > 0 && (
                <div className="p-2">
                  <p className="px-2.5 py-1.5 text-xs font-bold text-[#9AA0A6] uppercase tracking-wide flex items-center gap-1.5">
                    <Briefcase className="w-3.5 h-3.5" /> Lowongan
                  </p>
                  {jobs.map((job) => (
                    <button
                      key={job.id}
                      onClick={() => goTo(`/jobs/${job.id}`)}
                      className="w-full text-left px-2.5 py-2 rounded-lg hover:bg-[#FFF5F5] transition-colors flex items-start gap-2.5"
                    >
                      <div className="w-8 h-8 rounded-lg bg-[#D64545] flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                        {(job.company ?? "?").charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-[#232F3E] truncate">{job.title}</p>
                        <p className="text-xs text-[#6B6880] truncate">
                          {job.company} · {fmtBudget(job.budget_min, job.budget_max)}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {events.length > 0 && (
                <div className="p-2 border-t border-[#F1F1F1]">
                  <p className="px-2.5 py-1.5 text-xs font-bold text-[#9AA0A6] uppercase tracking-wide flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5" /> Event
                  </p>
                  {events.map((ev) => (
                    <button
                      key={ev.id}
                      onClick={() => goTo(`/events/${ev.id}`)}
                      className="w-full text-left px-2.5 py-2 rounded-lg hover:bg-[#FFF5F5] transition-colors flex items-start gap-2.5"
                    >
                      <div className="w-8 h-8 rounded-lg bg-[#F8F6FF] flex items-center justify-center text-sm flex-shrink-0">
                        {EVENT_TYPE_ICON[ev.type] ?? "📅"}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-[#232F3E] truncate">{ev.title}</p>
                        <p className="text-xs text-[#6B6880] truncate flex items-center gap-1">
                          {fmtEventDate(ev.event_date)}
                          {ev.location_name && (
                            <span className="flex items-center gap-0.5 truncate">
                              <MapPin className="w-3 h-3 flex-shrink-0" /> {ev.location_name}
                            </span>
                          )}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              <div className="p-2 border-t border-[#F1F1F1] bg-[#FAFAFA] flex flex-col gap-1">
                <button
                  onClick={() => goTo(`/jobs?search=${encodeURIComponent(query.trim())}`)}
                  className="w-full flex items-center justify-between px-2.5 py-2 text-sm font-semibold text-[#D64545] hover:bg-white rounded-lg transition-colors"
                >
                  Lihat semua lowongan untuk "{query}" <ArrowRight className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => goTo(`/events?search=${encodeURIComponent(query.trim())}`)}
                  className="w-full flex items-center justify-between px-2.5 py-2 text-sm font-semibold text-[#D64545] hover:bg-white rounded-lg transition-colors"
                >
                  Lihat semua event untuk "{query}" <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
