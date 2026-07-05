"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Calendar, ChevronRight, CheckCircle2, Lock, Loader2,
  Briefcase, MapPin, Sparkles, FileText, User,
} from "lucide-react";
import { PASSPORT_DAYS } from "../../data/passport";
import { EVENT_TYPES, type EventType } from "../../data/events";
import { passportApi, type PassportProgress } from "../../lib/passport.api";
import { jobsApi, type ApiJob } from "../../lib/jobs.api";
import { eventsApi, type ApiEvent } from "../../lib/events.api";
import { useAuth } from "../../context/AuthContext";
import FadeInSection from "../ui/FadeInSection";

// Warna kategori lowongan — mengikuti mapping di halaman Lowongan (JobCard)
const CATEGORY_STYLE: Record<string, { chip: string; avatar: string }> = {
  "Web Development":    { chip: "bg-blue-50 text-blue-700",     avatar: "bg-blue-500" },
  "Mobile Development": { chip: "bg-blue-50 text-blue-700",     avatar: "bg-blue-500" },
  "UI/UX Design":       { chip: "bg-orange-50 text-orange-700", avatar: "bg-orange-500" },
  "Social Media":       { chip: "bg-orange-50 text-orange-700", avatar: "bg-orange-500" },
  "Content Writing":    { chip: "bg-green-50 text-green-700",   avatar: "bg-green-600" },
  "Logo Design":        { chip: "bg-green-50 text-green-700",   avatar: "bg-green-600" },
  "Graphic Design":     { chip: "bg-purple-50 text-purple-700", avatar: "bg-purple-500" },
  "Video Editing":      { chip: "bg-gray-100 text-gray-600",    avatar: "bg-gray-500" },
  "Photography":        { chip: "bg-gray-100 text-gray-600",    avatar: "bg-gray-500" },
  "Translation":        { chip: "bg-purple-50 text-purple-700", avatar: "bg-purple-500" },
};
const DEFAULT_CATEGORY_STYLE = { chip: "bg-blue-50 text-blue-700", avatar: "bg-blue-500" };

// Kotak tanggal event mengikuti warna tipe (EVENT_TYPES dari halaman Events)
const EVENT_DATE_BOX: Record<EventType, string> = {
  workshop:    "bg-blue-500",
  meetup:      "bg-green-600",
  coffee_chat: "bg-orange-500",
  networking:  "bg-purple-500",
};

function fmtBudget(min: number, max: number) {
  const f = (n: number) => (n >= 1_000_000 ? `${(n / 1_000_000).toLocaleString("id-ID")}jt` : `${(n / 1000).toFixed(0)}rb`);
  return `Rp ${f(Number(min))} – ${f(Number(max))}`;
}

function fmtEventDate(d: string) {
  return new Date(d).toLocaleDateString("id-ID", { weekday: "short", day: "numeric", month: "short" });
}

function isToday(d: string) {
  return d?.slice(0, 10) === new Date().toISOString().slice(0, 10);
}

export default function LoggedInHome() {
  const { user } = useAuth();
  const [progress, setProgress] = useState<PassportProgress | null>(null);
  const [jobs, setJobs] = useState<ApiJob[]>([]);
  const [events, setEvents] = useState<ApiEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [progRes, jobsRes, eventsRes] = await Promise.allSettled([
        passportApi.getProgress(),
        jobsApi.list({ sort: "newest", limit: 3 }),
        eventsApi.list({ upcoming: true, limit: 2 }),
      ]);
      setProgress(
        progRes.status === "fulfilled"
          ? progRes.value.data
          : { current_day: 1, completed_days: [], days_completed: 0, earned_badges: [], level: "Bronze", start_date: "" }
      );
      if (jobsRes.status === "fulfilled") setJobs(jobsRes.value.data);
      if (eventsRes.status === "fulfilled") setEvents(eventsRes.value.data);
      setLoading(false);
    })();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8F6FF] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#D64545]" />
      </div>
    );
  }

  const currentDay    = progress?.current_day ?? 1;
  const completedDays = progress?.completed_days ?? [];
  const earnedBadges  = progress?.earned_badges ?? [];
  const progressPct   = Math.round((completedDays.length / 30) * 100);

  const todayEntry   = PASSPORT_DAYS.find((d) => d.day === currentDay);
  const isCompleted  = completedDays.includes(currentDay);
  const upcomingDays = PASSPORT_DAYS.slice(currentDay - 1, currentDay + 2);
  const todayEvents  = events.filter((e) => isToday(e.event_date));

  return (
    <div className="min-h-screen bg-[#F8F6FF]">
      {/* Welcome banner — putih, teks gelap */}
      <FadeInSection>
        <div className="bg-white border-b border-[#EAE6F5] py-8">
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-[#1E1B2E] mb-1">
                  Halo, {user?.name?.split(" ")[0] ?? "Freelancer"}! 👋
                </h1>
                <p className="text-[#6B6880] text-sm">
                  Hari ke-{currentDay} dari 30 · Level {progress?.level ?? "Bronze"} · {earnedBadges.length} badge
                </p>
              </div>
              <div className="sm:text-right">
                <p className="text-xs text-[#6B6880] mb-1.5">Progress Passport · {progressPct}%</p>
                <div className="w-full sm:w-56 h-2.5 bg-[#EAE6F5] rounded-full overflow-hidden">
                  <div className="h-full bg-[#D64545] rounded-full transition-all" style={{ width: `${progressPct}%` }} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </FadeInSection>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* ==== Kolom utama ==== */}
          <div className="lg:col-span-2 space-y-6">
            {/* Tugas hari ini */}
            {todayEntry && (
              <FadeInSection delay={80}>
                <div className="bg-white rounded-xl border border-[#EAE6F5] overflow-hidden">
                  <div className="p-6">
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div>
                        <span className="inline-block bg-[#FFF5F5] text-[#D64545] text-xs px-3 py-1 rounded-full font-bold mb-2">
                          📌 TUGAS HARI INI
                        </span>
                        <h2 className="text-xl font-bold text-[#1E1B2E]">{todayEntry.task}</h2>
                      </div>
                      {isCompleted && <CheckCircle2 className="w-7 h-7 text-green-600 flex-shrink-0" />}
                    </div>
                    <p className="text-sm text-[#6B6880] mb-3">{todayEntry.description}</p>
                    <div className="flex items-center gap-4 text-xs text-[#6B6880] mb-4">
                      <span>⏱️ {todayEntry.estimatedTime}</span>
                      <span>📍 Fase: {todayEntry.phase}</span>
                    </div>
                    <Link
                      href={`/passport?day=${currentDay}`}
                      className="inline-flex items-center gap-2 bg-[#D64545] hover:bg-[#C23B3B] text-white font-semibold text-sm py-2.5 px-5 rounded-lg transition-colors"
                    >
                      {isCompleted ? "Lihat Hari Ini" : "Mulai Sekarang"}
                      <ChevronRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              </FadeInSection>
            )}

            {/* Lowongan terbaru */}
            <FadeInSection delay={160}>
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Briefcase className="w-5 h-5 text-[#D64545]" />
                    <h2 className="font-bold text-[#1E1B2E]">Lowongan Terbaru</h2>
                  </div>
                  <Link href="/jobs" className="text-xs text-[#D64545] hover:underline font-semibold flex items-center gap-0.5">
                    Lihat semua <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
                {jobs.length === 0 ? (
                  <div className="bg-white border border-[#EAE6F5] rounded-xl p-8 text-center text-sm text-[#6B6880]">
                    Belum ada lowongan tersedia
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {jobs.map((job) => {
                      const style = CATEGORY_STYLE[job.category] ?? DEFAULT_CATEGORY_STYLE;
                      return (
                        <Link
                          key={job.id}
                          href={`/jobs/${job.id}`}
                          className="bg-white border border-[#EAE6F5] rounded-xl p-5 hover:shadow-md hover:-translate-y-0.5 transition-all group"
                        >
                          <div className="flex items-center gap-3 mb-3">
                            <div className={`w-10 h-10 rounded-lg ${style.avatar} flex items-center justify-center text-white font-bold flex-shrink-0`}>
                              {(job.company ?? "?").charAt(0)}
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-bold text-[#1E1B2E] group-hover:text-[#D64545] transition-colors line-clamp-1">
                                {job.title}
                              </p>
                              <p className="text-xs text-[#6B6880] truncate">{job.company}</p>
                            </div>
                          </div>

                          <p className="text-base font-bold text-[#D64545] mb-3">
                            {fmtBudget(job.budget_min, job.budget_max)}
                          </p>

                          <div className="flex items-center gap-2 flex-wrap text-xs">
                            {job.category && (
                              <span className={`px-2 py-1 rounded-full font-semibold ${style.chip}`}>
                                {job.category}
                              </span>
                            )}
                            <span className="flex items-center gap-1 bg-[#F8F6FF] text-[#6B6880] px-2 py-1 rounded-full">
                              <MapPin className="w-3 h-3" /> {job.location_type}
                            </span>
                            {job.skills?.length > 0 && (
                              <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded-full font-semibold">
                                {job.skills[0]}{job.skills.length > 1 ? ` +${job.skills.length - 1}` : ""}
                              </span>
                            )}
                          </div>
                        </Link>
                      );
                    })}

                    {/* Kartu menuju halaman lowongan */}
                    <Link
                      href="/jobs"
                      className="border-2 border-dashed border-[#D64545]/30 rounded-xl p-5 flex flex-col items-center justify-center text-center gap-2 hover:border-[#D64545] hover:bg-[#FFF5F5] transition-all group min-h-[150px]"
                    >
                      <div className="w-10 h-10 rounded-full bg-[#FFF5F5] group-hover:bg-[#D64545] flex items-center justify-center transition-colors">
                        <Briefcase className="w-5 h-5 text-[#D64545] group-hover:text-white transition-colors" />
                      </div>
                      <p className="text-sm font-bold text-[#D64545]">Lihat Semua Lowongan</p>
                      <p className="text-xs text-[#6B6880]">Temukan lebih banyak peluang di halaman Lowongan</p>
                    </Link>
                  </div>
                )}
              </div>
            </FadeInSection>

            {/* Event tersedia */}
            <FadeInSection delay={240}>
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-[#D64545]" />
                    <h2 className="font-bold text-[#1E1B2E]">
                      {todayEvents.length > 0 ? "Event Hari Ini & Mendatang" : "Event Mendatang"}
                    </h2>
                  </div>
                  <Link href="/events" className="text-xs text-[#D64545] hover:underline font-semibold flex items-center gap-0.5">
                    Lihat semua <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
                {events.length === 0 ? (
                  <div className="bg-white border border-[#EAE6F5] rounded-xl p-8 text-center text-sm text-[#6B6880]">
                    Belum ada event mendatang
                  </div>
                ) : (
                  <div className="space-y-3">
                    {events.map((ev) => {
                      const typeInfo = EVENT_TYPES[ev.type];
                      return (
                        <Link
                          key={ev.id}
                          href={`/events/${ev.id}`}
                          className={`border rounded-xl p-4 flex items-center gap-4 hover:shadow-md hover:-translate-y-0.5 transition-all group ${typeInfo?.color ?? "bg-white border-[#EAE6F5]"}`}
                        >
                          {/* Kotak tanggal berwarna sesuai tipe event */}
                          <div className={`w-14 h-14 rounded-xl ${EVENT_DATE_BOX[ev.type] ?? "bg-[#D64545]"} flex flex-col items-center justify-center flex-shrink-0 shadow-sm`}>
                            <span className="text-lg font-bold text-white leading-none">
                              {new Date(ev.event_date).getDate()}
                            </span>
                            <span className="text-[10px] text-white/80 uppercase font-semibold mt-0.5">
                              {new Date(ev.event_date).toLocaleDateString("id-ID", { month: "short" })}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap mb-1">
                              <p className="text-sm font-bold text-[#1E1B2E] group-hover:text-[#D64545] transition-colors truncate">
                                {ev.title}
                              </p>
                              {isToday(ev.event_date) && (
                                <span className="text-[10px] bg-[#D64545] text-white px-2 py-0.5 rounded-full font-bold animate-pulse">
                                  HARI INI
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 flex-wrap text-xs">
                              <span className="bg-white/70 text-[#1E1B2E] px-2 py-0.5 rounded-full font-semibold">
                                {typeInfo?.icon} {typeInfo?.label ?? ev.type}
                              </span>
                              <span className="text-[#6B6880]">{fmtEventDate(ev.event_date)}</span>
                              {ev.location_name && (
                                <span className="text-[#6B6880] truncate">📍 {ev.location_name}</span>
                              )}
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-1 flex-shrink-0">
                            <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                              ev.is_free ? "bg-green-100 text-green-700" : "bg-[#D64545] text-white"
                            }`}>
                              {ev.is_free ? "Gratis" : `Rp ${Number(ev.price ?? 0).toLocaleString("id-ID")}`}
                            </span>
                            {ev.attendee_limit ? (
                              <span className="text-[10px] text-[#6B6880]">
                                {ev.attendee_count ?? 0}/{ev.attendee_limit} peserta
                              </span>
                            ) : null}
                          </div>
                        </Link>
                      );
                    })}

                    {/* Kartu menuju halaman events */}
                    <Link
                      href="/events"
                      className="border-2 border-dashed border-[#D64545]/30 rounded-xl p-4 flex items-center justify-center gap-2 hover:border-[#D64545] hover:bg-[#FFF5F5] transition-all group"
                    >
                      <Sparkles className="w-4 h-4 text-[#D64545]" />
                      <span className="text-sm font-bold text-[#D64545]">Lihat Semua Event</span>
                      <ChevronRight className="w-4 h-4 text-[#D64545] group-hover:translate-x-0.5 transition-transform" />
                    </Link>
                  </div>
                )}
              </div>
            </FadeInSection>
          </div>

          {/* ==== Sidebar ==== */}
          <div className="space-y-6">
            {/* Stats — tiap kartu beda warna */}
            <FadeInSection delay={120}>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { value: completedDays.length,      label: "Hari Selesai", cls: "text-green-600 bg-green-50 border-green-200" },
                  { value: earnedBadges.length,       label: "Badge",        cls: "text-yellow-600 bg-yellow-50 border-yellow-200" },
                  { value: 30 - completedDays.length, label: "Hari Tersisa", cls: "text-blue-600 bg-blue-50 border-blue-200" },
                ].map((s) => (
                  <div key={s.label} className={`rounded-xl border p-3 text-center ${s.cls.split(" ").slice(1).join(" ")}`}>
                    <p className={`text-2xl font-bold ${s.cls.split(" ")[0]}`}>{s.value}</p>
                    <p className="text-[11px] text-[#6B6880] mt-0.5">{s.label}</p>
                  </div>
                ))}
              </div>
            </FadeInSection>

            {/* Jadwal berikutnya */}
            <FadeInSection delay={200}>
              <div className="bg-white rounded-xl border border-[#EAE6F5] p-5">
                <div className="flex items-center gap-2 mb-4">
                  <Calendar className="w-5 h-5 text-blue-600" />
                  <h3 className="font-bold text-[#1E1B2E]">Jadwal Berikutnya</h3>
                </div>
                <div className="space-y-3">
                  {upcomingDays.map((day) => {
                    const isCurrent = day.day === currentDay;
                    const isDone    = completedDays.includes(day.day);
                    const isFuture  = day.day > currentDay;
                    return (
                      <Link key={day.day} href={`/passport?day=${day.day}`}
                        className={`p-3 rounded-lg border transition-all block ${
                          isCurrent ? "bg-[#FFF5F5] border-[#D64545] shadow-sm"
                            : isDone ? "bg-green-50 border-green-200"
                            : isFuture ? "bg-gray-50 border-gray-200 opacity-60"
                            : "bg-white border-[#EAE6F5] hover:shadow-sm"
                        }`}>
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <p className="text-[10px] font-bold text-[#6B6880] mb-1">
                              HARI {day.day}{isCurrent ? " · HARI INI" : ""}
                            </p>
                            <p className="text-sm font-semibold text-[#1E1B2E] line-clamp-2">{day.task}</p>
                          </div>
                          {isDone && <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />}
                          {isFuture && <Lock className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />}
                        </div>
                      </Link>
                    );
                  })}
                </div>
                <Link href="/passport"
                  className="mt-4 w-full text-center text-sm text-[#D64545] font-semibold hover:text-[#C23B3B] pt-4 border-t border-[#EAE6F5] block">
                  Lihat Semua Hari →
                </Link>
              </div>
            </FadeInSection>

            {/* Akses cepat — ikon warna-warni */}
            <FadeInSection delay={280}>
              <div className="bg-white rounded-xl border border-[#EAE6F5] p-5">
                <h3 className="font-bold text-[#1E1B2E] mb-4">Akses Cepat</h3>
                <div className="space-y-2">
                  {[
                    { href: "/jobs/applications", label: "Lamaranku",       icon: FileText, iconCls: "text-blue-600",   bgCls: "bg-blue-50" },
                    { href: "/profile",           label: "Profil Saya",     icon: User,     iconCls: "text-purple-600", bgCls: "bg-purple-50" },
                    { href: "/passport",          label: "Panduan 30 Hari", icon: Calendar, iconCls: "text-green-600",  bgCls: "bg-green-50" },
                  ].map((q) => (
                    <Link
                      key={q.href}
                      href={q.href}
                      className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-[#F8F6FF] transition-colors group"
                    >
                      <div className={`w-8 h-8 rounded-lg ${q.bgCls} flex items-center justify-center`}>
                        <q.icon className={`w-4 h-4 ${q.iconCls}`} />
                      </div>
                      <span className="text-sm font-semibold text-[#1E1B2E] group-hover:text-[#D64545] transition-colors flex-1">
                        {q.label}
                      </span>
                      <ChevronRight className="w-4 h-4 text-[#CCC]" />
                    </Link>
                  ))}
                </div>
              </div>
            </FadeInSection>
          </div>
        </div>
      </div>
    </div>
  );
}
