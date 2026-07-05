"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, Download, Loader2, MapPin, Star, Award,
  Briefcase, Calendar, CheckCircle, Globe,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { profileApi, type ApiProfile } from "../lib/profile.api";
import { jobsApi, type ApiApplication } from "../lib/jobs.api";
import { eventsApi } from "../lib/events.api";
import { reviewsApi, type ReviewsResult } from "../lib/reviews.api";
import { assetUrl } from "../lib/api";

type AttendedEvent = {
  id: string;
  title: string;
  type: string;
  event_date: string;
  location_name?: string;
  organizer_name?: string;
  checked_in: boolean;
};

const EVENT_TYPE_LABEL: Record<string, string> = {
  workshop: "Workshop", meetup: "Meetup", coffee_chat: "Coffee Chat", networking: "Networking",
};

function fmtDate(d?: string) {
  if (!d) return "-";
  return new Date(d).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
}

export default function PortfolioPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [profile, setProfile] = useState<ApiProfile | null>(null);
  const [applications, setApplications] = useState<ApiApplication[]>([]);
  const [events, setEvents] = useState<AttendedEvent[]>([]);
  const [reviewData, setReviewData] = useState<ReviewsResult | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push("/auth/login?redirect=/portfolio");
      return;
    }
    (async () => {
      const [prof, apps, evs, revs] = await Promise.allSettled([
        profileApi.getOwn(),
        jobsApi.myApplications({ limit: 100 }),
        eventsApi.attended(),
        reviewsApi.forUser(user.id),
      ]);
      if (prof.status === "fulfilled") setProfile(prof.value.data);
      if (apps.status === "fulfilled") setApplications(apps.value.data);
      if (evs.status === "fulfilled") setEvents(evs.value.data);
      if (revs.status === "fulfilled") setReviewData(revs.value.data);
      setLoading(false);
    })();
  }, [user, authLoading, router]);

  if (authLoading || loading) {
    return (
      <main className="min-h-screen bg-[#F1F1F1] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#D64545]" />
      </main>
    );
  }

  if (!profile) {
    return (
      <main className="min-h-screen bg-[#F1F1F1] flex items-center justify-center">
        <div className="text-center">
          <p className="text-[#DC2C1E] mb-3">Gagal memuat portofolio</p>
          <Link href="/passport" className="text-sm text-[#146EB4] hover:underline">← Kembali ke Panduan</Link>
        </div>
      </main>
    );
  }

  // Hanya pekerjaan yang sudah ditandai SELESAI oleh employer yang masuk portofolio
  const completedJobs = applications.filter((a) => a.status === "completed");
  const rating = Number(profile.rating ?? 0);

  return (
    <main className="min-h-screen bg-[#E9E6F2] print:bg-white py-8 print:py-0">
      {/* Paksa browser mencetak warna background (banner merah, badge, dll) */}
      <style>{`
        @media print {
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          @page { margin: 0.8cm; }
        }
      `}</style>
      {/* Toolbar — disembunyikan saat print */}
      <div className="max-w-3xl mx-auto px-4 mb-5 flex items-center justify-between print:hidden">
        <Link href="/passport" className="inline-flex items-center gap-1.5 text-sm text-[#6B6880] hover:text-[#D64545] transition-colors">
          <ArrowLeft className="w-4 h-4" /> Kembali ke Panduan
        </Link>
        <button
          onClick={() => window.print()}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#D64545] hover:bg-[#C23B3B] text-white rounded-lg font-semibold text-sm transition-colors shadow"
        >
          <Download className="w-4 h-4" />
          Download PDF
        </button>
      </div>

      {/* ===== Dokumen portofolio (A4-friendly) ===== */}
      <div className="max-w-3xl mx-auto bg-white shadow-xl print:shadow-none rounded-xl print:rounded-none overflow-hidden">
        {/* Kepala dokumen */}
        <div className="bg-[#D64545] text-white p-8 print:p-6">
          <div className="flex items-center gap-5">
            <div className="w-24 h-24 rounded-full bg-white/20 border-4 border-white/60 flex items-center justify-center text-4xl font-bold overflow-hidden flex-shrink-0">
              {profile.profile_picture_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={assetUrl(profile.profile_picture_url)} alt={profile.full_name} className="w-full h-full object-cover" />
              ) : (
                profile.full_name.charAt(0)
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-3xl font-bold mb-1">{profile.full_name}</h1>
              <p className="text-white/85 text-sm flex items-center gap-1.5 mb-2">
                <MapPin className="w-4 h-4" /> {profile.city ?? "Yogyakarta"}
                <span className="mx-1">·</span> Freelancer — Level {profile.level ?? "Bronze"}
              </p>
              <div className="flex flex-wrap gap-3 text-sm text-white/90">
                <span className="flex items-center gap-1"><Star className="w-4 h-4 fill-white" /> {rating.toFixed(1)}/5.0</span>
                <span className="flex items-center gap-1"><CheckCircle className="w-4 h-4" /> {profile.completed_projects ?? 0} proyek</span>
                <span className="flex items-center gap-1"><Award className="w-4 h-4" /> {(profile.badges ?? []).length} badge</span>
              </div>
            </div>
            <div className="flex flex-col items-end gap-1.5 text-xs text-white/70 hidden sm:flex print:flex flex-shrink-0">
              {/* Logo project di atas latar putih agar kontras */}
              <div className="bg-white rounded-lg px-3 py-1.5">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/logo.png" alt="JogjaFreelance" className="h-7 w-auto object-contain" style={{ mixBlendMode: "multiply" }} />
              </div>
              <p className="text-white font-semibold">🎓 30 Hari Selesai</p>
              <p>{fmtDate(new Date().toISOString())}</p>
            </div>
          </div>
        </div>

        <div className="p-8 print:p-6 space-y-7">
          {/* Bio */}
          {profile.bio && (
            <section>
              <h2 className="text-sm font-bold text-[#D64545] uppercase tracking-wide mb-2">Tentang Saya</h2>
              <p className="text-sm text-[#232F3E] leading-relaxed break-words">{profile.bio}</p>
            </section>
          )}

          {/* Skills */}
          {(profile.skills ?? []).length > 0 && (
            <section>
              <h2 className="text-sm font-bold text-[#D64545] uppercase tracking-wide mb-2">Keahlian</h2>
              <div className="flex flex-wrap gap-2">
                {profile.skills.map((s) => (
                  <span key={s} className="text-xs font-semibold bg-[#FFF5F5] text-[#D64545] border border-[#D64545]/20 px-3 py-1 rounded-full">
                    {s}
                  </span>
                ))}
              </div>
            </section>
          )}

          {/* Proyek yang sudah SELESAI dikerjakan */}
          <section>
            <h2 className="text-sm font-bold text-[#D64545] uppercase tracking-wide mb-3 flex items-center gap-2">
              <Briefcase className="w-4 h-4" /> Proyek yang Diselesaikan
            </h2>
            {completedJobs.length === 0 ? (
              <p className="text-sm text-[#6B6880] italic">
                Belum ada proyek yang diselesaikan — proyek masuk ke sini setelah employer menandai pekerjaanmu selesai.
              </p>
            ) : (
              <div className="space-y-3">
                {completedJobs.map((a) => (
                  <div key={a.id} className="flex items-start justify-between gap-3 border-l-2 border-[#D64545]/30 pl-4 py-1">
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-[#232F3E]">{a.job_title}</p>
                      <p className="text-xs text-[#6B6880]">
                        {a.company} · {a.category ?? "Freelance"} · dikerjakan {fmtDate(a.submitted_at)}
                      </p>
                    </div>
                    <span className="text-xs font-bold px-2.5 py-1 rounded-full flex-shrink-0 bg-green-100 text-green-700">
                      ✓ Selesai
                    </span>
                  </div>
                ))}
                <p className="text-xs text-[#6B6880] mt-1">
                  <strong className="text-green-700">{completedJobs.length} proyek diselesaikan</strong> lewat Jogja Freelance Passport.
                </p>
              </div>
            )}
          </section>

          {/* Event yang diikuti */}
          <section>
            <h2 className="text-sm font-bold text-[#D64545] uppercase tracking-wide mb-3 flex items-center gap-2">
              <Calendar className="w-4 h-4" /> Event & Workshop yang Diikuti
            </h2>
            {events.length === 0 ? (
              <p className="text-sm text-[#6B6880] italic">Belum ada event tercatat.</p>
            ) : (
              <div className="space-y-3">
                {events.map((ev) => (
                  <div key={ev.id} className="flex items-start justify-between gap-3 border-l-2 border-[#D64545]/30 pl-4 py-1">
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-[#232F3E]">{ev.title}</p>
                      <p className="text-xs text-[#6B6880]">
                        {EVENT_TYPE_LABEL[ev.type] ?? ev.type}
                        {ev.organizer_name ? ` · ${ev.organizer_name}` : ""} · {fmtDate(ev.event_date)}
                        {ev.location_name ? ` · ${ev.location_name}` : ""}
                      </p>
                    </div>
                    {ev.checked_in && (
                      <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-green-100 text-green-700 flex-shrink-0">
                        ✓ Hadir
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Ulasan employer */}
          {reviewData && reviewData.summary.total > 0 && (
            <section>
              <h2 className="text-sm font-bold text-[#D64545] uppercase tracking-wide mb-3 flex items-center gap-2">
                <Star className="w-4 h-4" /> Ulasan Employer
                <span className="normal-case font-semibold text-[#232F3E]">
                  — ⭐ {Number(reviewData.summary.average).toFixed(1)}/5.0 dari {reviewData.summary.total} ulasan
                </span>
              </h2>
              <div className="space-y-3">
                {reviewData.reviews.slice(0, 3).map((r) => (
                  <div key={r.id} className="border-l-2 border-[#D64545]/30 pl-4 py-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-[#232F3E]">{r.reviewer_name}</span>
                      <span className="text-xs text-yellow-600 font-semibold">
                        {"★".repeat(r.rating)}{"☆".repeat(5 - r.rating)}
                      </span>
                    </div>
                    {r.comment && (
                      <p className="text-sm text-[#232F3E] leading-relaxed break-words">"{r.comment}"</p>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Badge */}
          {(profile.badges ?? []).length > 0 && (
            <section>
              <h2 className="text-sm font-bold text-[#D64545] uppercase tracking-wide mb-3 flex items-center gap-2">
                <Award className="w-4 h-4" /> Badge & Pencapaian
              </h2>
              <div className="flex flex-wrap gap-2">
                {profile.badges.map((b) => (
                  <span key={b.name} className="text-xs font-semibold bg-yellow-50 text-yellow-800 border border-yellow-200 px-3 py-1.5 rounded-full">
                    {b.icon} {b.name}
                  </span>
                ))}
              </div>
            </section>
          )}

          {/* Kontak / portfolio link */}
          {profile.portfolio_url && (
            <section className="pt-4 border-t border-[#E7E7E7]">
              <p className="text-xs text-[#6B6880] flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5" /> Portfolio: <span className="text-[#146EB4]">{profile.portfolio_url}</span>
              </p>
            </section>
          )}

          {/* Footer dokumen */}
          <div className="pt-4 border-t border-[#E7E7E7] flex items-center justify-between text-[10px] text-[#9B96AD]">
            <span>Dibuat otomatis oleh Jogja Freelance Passport — program panduan 30 hari freelancer Yogyakarta</span>
            <span>jogjafreelance.id</span>
          </div>
        </div>
      </div>
    </main>
  );
}
