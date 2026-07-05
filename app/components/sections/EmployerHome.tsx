"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Briefcase, Users, Plus, CalendarDays, UserRoundSearch, Settings,
  Loader2, Hourglass, ChevronRight, MapPin, Building2,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { profileApi, type ApiEmployerProfile } from "../../lib/profile.api";
import { jobsApi, type ApiJob, type ApiEmployerApplication } from "../../lib/jobs.api";
import { eventsApi, type ApiEvent } from "../../lib/events.api";
import { assetUrl } from "../../lib/api";

type MyEvent = ApiEvent & { status: string; created_at: string };

const levelColor: Record<string, string> = {
  Bronze:   "text-orange-700 bg-orange-50 border-orange-200",
  Silver:   "text-gray-600  bg-gray-50   border-gray-200",
  Gold:     "text-yellow-700 bg-yellow-50 border-yellow-200",
  Platinum: "text-blue-600  bg-blue-50   border-blue-200",
};

const applicationStatus: Record<string, { label: string; cls: string }> = {
  pending:  { label: "Baru",     cls: "bg-blue-100 text-blue-700" },
  reviewed: { label: "Direview", cls: "bg-yellow-100 text-yellow-700" },
  accepted: { label: "Diterima", cls: "bg-green-100 text-green-700" },
  rejected: { label: "Ditolak",  cls: "bg-red-100 text-red-700" },
  expired:  { label: "Expired",  cls: "bg-gray-100 text-gray-500" },
};

const QUICK_ACCESS = [
  { href: "/employer",            label: "Lowongan Saya",     desc: "Kelola lowongan Anda",   icon: Briefcase,       color: "text-[#D64545]",  bg: "bg-purple-50" },
  { href: "/employer/applicants", label: "Pendaftar",         desc: "Lihat & kelola pelamar", icon: UserRoundSearch, color: "text-blue-600",   bg: "bg-blue-50"   },
  { href: "/employer/events",     label: "Kelola Event",      desc: "Event & peserta Anda",   icon: CalendarDays,    color: "text-green-600",  bg: "bg-green-50"  },
  { href: "/employer/post-job",   label: "Pasang Lowongan",   desc: "Buat lowongan baru",     icon: Plus,            color: "text-[#D64545]",  bg: "bg-red-50"    },
  { href: "/employer/post-event", label: "Buat Event",        desc: "Adakan event komunitas", icon: Plus,            color: "text-green-600",  bg: "bg-emerald-50"},
  { href: "/profile/edit",        label: "Profil Perusahaan", desc: "Edit info & logo",       icon: Settings,        color: "text-yellow-600", bg: "bg-yellow-50" },
];

export default function EmployerHome() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<ApiEmployerProfile | null>(null);
  const [jobs, setJobs] = useState<ApiJob[]>([]);
  const [events, setEvents] = useState<MyEvent[]>([]);
  const [applicants, setApplicants] = useState<ApiEmployerApplication[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [profRes, jobsRes, eventsRes, appsRes] = await Promise.all([
          profileApi.getOwnEmployer(),
          jobsApi.mine(),
          eventsApi.mine().catch(() => ({ data: [] as MyEvent[] })),
          jobsApi.employerApplications(5).catch(() => ({ data: [] as ApiEmployerApplication[] })),
        ]);
        setProfile(profRes.data);
        setJobs(jobsRes.data);
        setEvents(eventsRes.data);
        setApplicants(appsRes.data);
      } catch {
        // banner tetap tampil dengan data user dari context
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F1F1F1] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#D64545]" />
      </div>
    );
  }

  const activeJobs      = jobs.filter((j) => j.status === "active").length;
  const pendingCount    = jobs.filter((j) => j.status === "pending_review").length
                        + events.filter((e) => e.status === "pending_review").length;
  const totalApplicants = jobs.reduce((sum, j) => sum + (Number(j.application_count) || 0), 0);

  return (
    <div className="min-h-screen bg-[#F1F1F1]">
      {/* Welcome banner */}
      <div className="bg-white border-b border-[#E7E7E7] py-8">
        <div className="max-w-7xl mx-auto px-4 flex items-center gap-4">
          <div className="w-14 h-14 rounded-xl bg-[#D64545] flex items-center justify-center text-2xl font-bold text-white overflow-hidden flex-shrink-0">
            {profile?.company_logo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={assetUrl(profile.company_logo_url)} alt={profile.company_name} className="w-full h-full object-cover" />
            ) : (
              (profile?.company_name ?? user?.name ?? "?").charAt(0)
            )}
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-[#232F3E]">
              Selamat datang, {profile?.company_name ?? user?.name}!
            </h1>
            <p className="text-[#6B6880] text-sm flex items-center gap-1.5 mt-1">
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
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Lowongan Aktif",  value: activeJobs,      icon: Briefcase,    color: "text-[#D64545]",  bg: "bg-purple-50" },
            { label: "Menunggu Review", value: pendingCount,    icon: Hourglass,    color: "text-yellow-600", bg: "bg-yellow-50" },
            { label: "Total Pelamar",   value: totalApplicants, icon: Users,        color: "text-blue-600",   bg: "bg-blue-50"   },
            { label: "Total Event",     value: events.length,   icon: CalendarDays, color: "text-green-600",  bg: "bg-green-50"  },
          ].map((s) => (
            <div key={s.label} className="bg-white border border-[#E7E7E7] rounded-xl p-4">
              <div className={`w-9 h-9 ${s.bg} rounded-lg flex items-center justify-center mb-3`}>
                <s.icon className={`w-5 h-5 ${s.color}`} />
              </div>
              <p className="text-2xl font-bold text-[#1E1B2E]">{s.value}</p>
              <p className="text-xs text-[#6B6880] mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Quick access */}
          <div className="lg:col-span-2">
            <h2 className="font-bold text-[#1E1B2E] mb-4">Akses Cepat</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {QUICK_ACCESS.map((q) => (
                <Link
                  key={q.href + q.label}
                  href={q.href}
                  className="bg-white border border-[#E7E7E7] rounded-xl p-4 hover:border-[#D64545]/40 hover:shadow-sm transition-all group"
                >
                  <div className={`w-9 h-9 ${q.bg} rounded-lg flex items-center justify-center mb-3`}>
                    <q.icon className={`w-5 h-5 ${q.color}`} />
                  </div>
                  <p className="text-sm font-bold text-[#1E1B2E] group-hover:text-[#D64545] transition-colors">{q.label}</p>
                  <p className="text-xs text-[#6B6880] mt-0.5">{q.desc}</p>
                </Link>
              ))}
            </div>

            {/* Info alur review */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mt-4">
              <p className="text-xs font-bold text-blue-800 mb-1">ℹ️ Alur Review</p>
              <p className="text-xs text-blue-700 leading-relaxed">
                Lowongan & event yang baru dipasang akan <strong>direview admin</strong> terlebih dahulu.
                Setelah disetujui, otomatis tampil untuk para freelancer.
              </p>
            </div>
          </div>

          {/* Pelamar terbaru */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-[#1E1B2E]">Pelamar Terbaru</h2>
              {applicants.length > 0 && (
                <Link href="/employer/applicants" className="text-xs text-[#D64545] hover:underline font-semibold flex items-center gap-0.5">
                  Lihat semua <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              )}
            </div>
            <div className="bg-white border border-[#E7E7E7] rounded-xl p-5">
              {applicants.length === 0 ? (
                <p className="text-xs text-[#6B6880] italic">Belum ada pelamar masuk</p>
              ) : (
                <div className="space-y-4">
                  {applicants.map((a) => {
                    const st = applicationStatus[a.status] ?? applicationStatus.pending;
                    return (
                      <div key={a.id} className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-[#D64545] flex items-center justify-center text-white text-sm font-bold flex-shrink-0 overflow-hidden">
                          {a.profile_picture_url ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={assetUrl(a.profile_picture_url)} alt={a.name} className="w-full h-full object-cover" />
                          ) : (
                            a.name.charAt(0)
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-[#1E1B2E] truncate">{a.name}</p>
                          <p className="text-xs text-[#6B6880] truncate">{a.job_title}</p>
                        </div>
                        <div className="flex flex-col items-end gap-1 flex-shrink-0">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${st.cls}`}>
                            {st.label}
                          </span>
                          {a.level && (
                            <span className={`text-xs px-2 py-0.5 rounded-full border font-semibold ${levelColor[a.level] ?? levelColor.Bronze}`}>
                              {a.level}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Tips */}
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mt-4">
              <p className="text-xs font-bold text-amber-800 mb-1">💡 Tips Employer</p>
              <p className="text-xs text-amber-700 leading-relaxed">
                Freelancer dengan badge <strong>Silver ke atas</strong> dan passport progress &gt;15 hari
                biasanya lebih konsisten dalam delivery.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
