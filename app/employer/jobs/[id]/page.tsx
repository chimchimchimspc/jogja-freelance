"use client";
import { use, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Header from "../../../components/layout/Header";
import Footer from "../../../components/layout/Footer";
import {
  ChevronLeft, Eye, Users, CheckCircle, Loader2, Briefcase,
  ChevronRight, Clock, Flag, MapPin,
} from "lucide-react";
import Link from "next/link";
import { useAuth } from "../../../context/AuthContext";
import { jobsApi, type ApiJob, type ApiJobApplicant } from "../../../lib/jobs.api";

const STATUS_BADGE: Record<string, { label: string; cls: string }> = {
  active:         { label: "Aktif",           cls: "bg-green-100 text-green-700" },
  pending_review: { label: "Menunggu Review", cls: "bg-yellow-100 text-yellow-700" },
  rejected:       { label: "Ditolak",         cls: "bg-red-100 text-red-700" },
  closed:         { label: "Ditutup",         cls: "bg-gray-100 text-gray-500" },
};

function fmtBudget(n?: number) {
  return `Rp ${Number(n ?? 0).toLocaleString("id-ID")}`;
}
function fmtDate(d?: string) {
  if (!d) return "-";
  return new Date(d).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
}

export default function EmployerJobDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const [job, setJob] = useState<ApiJob | null>(null);
  const [applicants, setApplicants] = useState<ApiJobApplicant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push(`/auth/login?redirect=/employer/jobs/${id}`);
      return;
    }
    (async () => {
      try {
        // Pakai jobs/mine agar view_count tidak ikut bertambah saat pengelola membukanya
        const [mineRes, appsRes] = await Promise.all([
          jobsApi.mine(),
          jobsApi.applicantsForJob(id).catch(() => ({ data: [] as ApiJobApplicant[] })),
        ]);
        const found = mineRes.data.find((j) => j.id === id) ?? null;
        if (!found) {
          setError("Lowongan tidak ditemukan atau bukan milik Anda");
        } else {
          setJob(found);
          setApplicants(appsRes.data);
        }
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : "Gagal memuat detail lowongan");
      } finally {
        setLoading(false);
      }
    })();
  }, [id, user, authLoading, router]);

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

  if (error || !job) {
    return (
      <>
        <Header />
        <main className="flex-1 bg-[#F8F6FF] flex items-center justify-center py-24">
          <div className="text-center">
            <p className="text-[#DC2C1E] mb-3">{error ?? "Lowongan tidak ditemukan"}</p>
            <Link href="/employer" className="text-sm text-[#146EB4] hover:underline">← Kembali ke Dashboard</Link>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  const badge = STATUS_BADGE[job.status] ?? STATUS_BADGE.closed;
  const totalApplicants = applicants.length;
  const acceptedCount = applicants.filter((a) => a.status === "accepted" || a.status === "completed").length;
  const completedCount = applicants.filter((a) => a.status === "completed").length;

  return (
    <>
      <Header />
      <main className="flex-1 bg-[#F8F6FF]">
        <div className="bg-white text-[#1E1B2E] py-8">
          <div className="max-w-4xl mx-auto px-4">
            <Link href="/employer" className="flex items-center gap-1.5 text-[#6B6880] hover:text-[#D64545] text-sm mb-4 transition-colors">
              <ChevronLeft className="w-4 h-4" /> Dashboard Lowongan
            </Link>
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <h1 className="text-2xl font-bold">{job.title}</h1>
              <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${badge.cls}`}>{badge.label}</span>
            </div>
            <div className="flex flex-wrap gap-3 text-sm text-[#6B6880]">
              <span className="flex items-center gap-1"><Briefcase className="w-3.5 h-3.5" /> {job.category}</span>
              <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> {job.location_type}</span>
              <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> Dipost {fmtDate(job.created_at)}</span>
            </div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
          {/* ===== Statistik utama ===== */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: "Dilihat",          value: job.view_count ?? 0,   icon: Eye,         color: "text-blue-600",   bg: "bg-blue-50" },
              { label: "Pelamar",          value: totalApplicants,       icon: Users,       color: "text-[#D64545]",  bg: "bg-[#FFF5F5]" },
              { label: "Diterima",         value: acceptedCount,         icon: CheckCircle, color: "text-green-600",  bg: "bg-green-50" },
              { label: "Selesai Dikerjakan", value: completedCount,      icon: Flag,        color: "text-purple-600", bg: "bg-purple-50" },
            ].map((s) => (
              <div key={s.label} className="bg-white border border-[#EAE6F5] rounded-xl p-4 text-center">
                <div className={`w-10 h-10 ${s.bg} rounded-lg flex items-center justify-center mx-auto mb-2`}>
                  <s.icon className={`w-5 h-5 ${s.color}`} />
                </div>
                <p className="text-2xl font-bold text-[#1E1B2E]">{s.value}</p>
                <p className="text-xs text-[#6B6880] mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Rasio konversi kecil */}
          <div className="bg-white border border-[#EAE6F5] rounded-xl p-5">
            <h2 className="font-bold text-[#1E1B2E] mb-3">Ringkasan Performa</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
              <div className="flex justify-between sm:block">
                <span className="text-[#6B6880]">Tingkat lamar (pelamar/views)</span>
                <p className="font-bold text-[#1E1B2E]">
                  {job.view_count ? `${Math.round((totalApplicants / job.view_count) * 100)}%` : "—"}
                </p>
              </div>
              <div className="flex justify-between sm:block">
                <span className="text-[#6B6880]">Tingkat diterima</span>
                <p className="font-bold text-[#1E1B2E]">
                  {totalApplicants ? `${Math.round((acceptedCount / totalApplicants) * 100)}%` : "—"}
                </p>
              </div>
              <div className="flex justify-between sm:block">
                <span className="text-[#6B6880]">Budget</span>
                <p className="font-bold text-[#D64545]">{fmtBudget(job.budget_min)} – {fmtBudget(job.budget_max)}</p>
              </div>
            </div>
          </div>

          {/* Pelamar terbaru */}
          <div className="bg-white border border-[#EAE6F5] rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-[#1E1B2E]">Pelamar ({totalApplicants})</h2>
              {totalApplicants > 0 && (
                <Link
                  href={`/employer/jobs/${id}/applicants`}
                  className="text-sm text-[#D64545] hover:underline font-semibold flex items-center gap-0.5"
                >
                  Kelola Semua Pelamar <ChevronRight className="w-4 h-4" />
                </Link>
              )}
            </div>
            {totalApplicants === 0 ? (
              <p className="text-sm text-[#6B6880] italic">Belum ada pelamar untuk lowongan ini.</p>
            ) : (
              <div className="space-y-2">
                {applicants.slice(0, 5).map((a) => (
                  <div key={a.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-[#F8F6FF]">
                    <div className="w-9 h-9 rounded-full bg-[#D64545] flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                      {a.name.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-[#1E1B2E] truncate">{a.name}</p>
                      <p className="text-xs text-[#6B6880]">{fmtDate(a.submitted_at)}</p>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-semibold flex-shrink-0 ${
                      a.status === "accepted" ? "bg-green-100 text-green-700"
                      : a.status === "completed" ? "bg-purple-100 text-purple-700"
                      : a.status === "rejected" ? "bg-red-100 text-red-700"
                      : "bg-blue-100 text-blue-700"
                    }`}>
                      {a.status === "accepted" ? "Diterima" : a.status === "completed" ? "Selesai"
                        : a.status === "rejected" ? "Ditolak" : a.status === "reviewed" ? "Direview" : "Baru"}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Deskripsi */}
          <div className="bg-white border border-[#EAE6F5] rounded-xl p-5">
            <h2 className="font-bold text-[#1E1B2E] mb-2">Deskripsi Lowongan</h2>
            <p className="text-sm text-[#232F3E] leading-relaxed whitespace-pre-line break-words">{job.description}</p>
            {job.skills?.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-3">
                {job.skills.map((s) => (
                  <span key={s} className="text-xs bg-[#FFF5F5] text-[#D64545] px-2.5 py-1 rounded-full font-semibold">{s}</span>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
