"use client";
import { useState, useEffect, useCallback } from "react";
import Header from "../components/layout/Header";
import Footer from "../components/layout/Footer";
import JobCard from "../components/jobs/JobCard";
import JobFilters, { DEFAULT_FILTERS, type Filters } from "../components/jobs/JobFilters";
import ApplyModal from "../components/jobs/ApplyModal";
import Toast from "../components/ui/Toast";
import { Search, SlidersHorizontal, X, Briefcase, Loader2 } from "lucide-react";
import Link from "next/link";
import FadeInSection from "../components/ui/FadeInSection";
import { jobsApi, type ApiJob } from "../lib/jobs.api";
import { useAuth } from "../context/AuthContext";

// Adapter: ApiJob → shape expected by JobCard
function adaptJob(j: ApiJob) {
  return {
    id: j.id,
    title: j.title,
    company: j.company,
    category: j.category,
    description: j.description,
    requirements: j.requirements ?? [],
    skills: j.skills ?? [],
    budget: j.budget_max ?? j.budget_min ?? 0,
    budgetType: j.budget_type,
    deadline: j.deadline_days ?? 0,
    location: j.location,
    contactWhatsapp: j.contact_whatsapp,
    contactEmail: j.contact_email,
    status: j.status as "active",
    views: j.view_count,
    applicationCount: j.application_count,
    postedAt: j.created_at?.split("T")[0] ?? "",
  };
}

const SORT_OPTIONS = [
  { value: "newest",   label: "Terbaru" },
  { value: "budget_high", label: "Budget Tertinggi" },
  { value: "deadline", label: "Deadline Terdekat" },
  { value: "popular",  label: "Paling Populer" },
];

export default function JobsPage() {
  const { user } = useAuth();
  const [filters, setFilters]           = useState<Filters>(DEFAULT_FILTERS);
  const [sort, setSort]                 = useState("newest");
  const [showMobileFilter, setShowMobileFilter] = useState(false);
  const [applyJob, setApplyJob]         = useState<ReturnType<typeof adaptJob> | null>(null);
  const [appliedIds, setAppliedIds]     = useState<Set<string>>(new Set());
  const [toast, setToast]               = useState<string | null>(null);

  const [jobs, setJobs]         = useState<ReturnType<typeof adaptJob>[]>([]);
  const [total, setTotal]       = useState(0);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState<string | null>(null);

  const fetchJobs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await jobsApi.list({
        sort,
        search: filters.search || undefined,
        category: filters.category !== "Semua Kategori" ? filters.category : undefined,
        budget_max: filters.budgetMax < 20_000_000 ? filters.budgetMax : undefined,
        skill: filters.skills.length === 1 ? filters.skills[0] : undefined,
      });
      setJobs(res.data.map(adaptJob));
      setTotal(res.pagination.total);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Gagal memuat lowongan");
    } finally {
      setLoading(false);
    }
  }, [filters, sort]);

  useEffect(() => {
    const t = setTimeout(fetchJobs, 300);
    return () => clearTimeout(t);
  }, [fetchJobs]);

  // Muat lamaran user agar tombol "Lamar" tidak muncul lagi untuk lowongan yang sudah dilamar
  useEffect(() => {
    if (!user || user.role !== "freelancer") return;
    (async () => {
      try {
        const res = await jobsApi.myApplications({ limit: 100 });
        setAppliedIds(new Set(res.data.map((a) => a.job_id)));
      } catch {}
    })();
  }, [user]);

  const handleApplySuccess = (jobId: string) => {
    setAppliedIds((p) => new Set([...p, jobId]));
    setToast("Lamaran berhasil dikirim! Pantau di halaman Lamaranku.");
  };

  // Lowongan yang sudah dilamar diletakkan paling bawah (urutan lain tetap)
  const displayJobs = [...jobs].sort(
    (a, b) => Number(appliedIds.has(a.id)) - Number(appliedIds.has(b.id))
  );

  return (
    <>
      <Header />
      <main className="flex-1 bg-[#F1F1F1]">
        <div className="bg-white text-[#1E1B2E] py-10">
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex items-center gap-3 mb-2">
              <Briefcase className="w-6 h-6 text-[#D64545]" />
              <h1 className="text-3xl font-bold">Lowongan Freelance di Jogja</h1>
            </div>
            <p className="text-[#6B6880] text-sm">
              {loading ? "Memuat..." : `${total} lowongan aktif · Diverifikasi admin`}
            </p>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 py-6">
          {/* Search + Sort */}
          <div className="flex flex-col sm:flex-row gap-3 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#565A5C]" />
              <input
                type="text"
                placeholder="Cari judul, company, atau deskripsi..."
                value={filters.search}
                onChange={(e) => setFilters((p) => ({ ...p, search: e.target.value }))}
                className="w-full pl-9 pr-4 py-2.5 text-sm border border-[#CCCCCC] rounded-lg bg-white focus:outline-none focus:border-[#146EB4] focus:ring-2 focus:ring-[#146EB4]/10"
              />
              {filters.search && (
                <button onClick={() => setFilters((p) => ({ ...p, search: "" }))}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#565A5C] hover:text-[#232F3E]">
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            <select value={sort} onChange={(e) => setSort(e.target.value)}
              className="px-3 py-2.5 text-sm border border-[#CCCCCC] rounded-lg bg-white text-[#232F3E] focus:outline-none focus:border-[#146EB4]">
              {SORT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>

            <button onClick={() => setShowMobileFilter((v) => !v)}
              className="md:hidden flex items-center gap-2 px-4 py-2.5 text-sm border border-[#CCCCCC] rounded-lg bg-white text-[#232F3E]">
              <SlidersHorizontal className="w-4 h-4" /> Filter
            </button>

            <Link href="/jobs/applications"
              className="flex items-center gap-2 px-4 py-2.5 text-sm bg-[#D64545] hover:bg-[#C23B3B] text-white rounded-lg font-semibold transition-colors whitespace-nowrap">
              Lamaranku ({appliedIds.size})
            </Link>
          </div>

          {showMobileFilter && (
            <div className="md:hidden mb-4">
              <JobFilters filters={filters} onChange={setFilters} resultCount={jobs.length} />
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-[280px_1fr] gap-6">
            <div className="hidden md:block">
              <JobFilters filters={filters} onChange={setFilters} resultCount={jobs.length} />
            </div>

            <div>
              {loading ? (
                <div className="flex items-center justify-center py-24">
                  <Loader2 className="w-8 h-8 animate-spin text-[#D64545]" />
                </div>
              ) : error ? (
                <div className="bg-white border border-[#E7E7E7] rounded-lg p-16 text-center">
                  <div className="text-5xl mb-4">⚠️</div>
                  <h3 className="text-lg font-bold text-[#232F3E] mb-2">Gagal memuat lowongan</h3>
                  <p className="text-sm text-[#565A5C] mb-4">{error}</p>
                  <button onClick={fetchJobs} className="text-sm text-[#146EB4] hover:underline">
                    Coba lagi
                  </button>
                </div>
              ) : jobs.length === 0 ? (
                <div className="bg-white border border-[#E7E7E7] rounded-lg p-16 text-center">
                  <div className="text-5xl mb-4">🔍</div>
                  <h3 className="text-lg font-bold text-[#232F3E] mb-2">Tidak ada hasil</h3>
                  <p className="text-sm text-[#565A5C] mb-4">Coba ubah filter atau kata kunci pencarian</p>
                  <button onClick={() => setFilters(DEFAULT_FILTERS)}
                    className="text-sm text-[#146EB4] hover:underline">
                    Reset semua filter
                  </button>
                </div>
              ) : (
                <>
                  <p className="text-sm text-[#565A5C] mb-4">
                    Menampilkan <strong>{jobs.length}</strong> dari {total} lowongan
                  </p>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {displayJobs.map((job, i) => (
                      <FadeInSection key={job.id} delay={Math.min(i * 80, 320)}>
                        <JobCard job={job} onApply={setApplyJob} applied={appliedIds.has(job.id)} />
                      </FadeInSection>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </main>

      <Footer />

      <ApplyModal
        job={applyJob}
        isOpen={!!applyJob}
        onClose={() => setApplyJob(null)}
        onSuccess={handleApplySuccess}
      />

      {toast && (
        <Toast message={toast} type="success" onClose={() => setToast(null)} duration={5000} />
      )}
    </>
  );
}
