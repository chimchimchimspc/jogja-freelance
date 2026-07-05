"use client";
import { useState, useEffect } from "react";
import Header from "../../components/layout/Header";
import Footer from "../../components/layout/Footer";
import Badge from "../../components/ui/Badge";
import Button from "../../components/ui/Button";
import Modal from "../../components/ui/Modal";
import Toast from "../../components/ui/Toast";
import { ArrowLeft, Clock, DollarSign, CheckCircle, XCircle, Eye, RotateCcw, Trash2, Loader2 } from "lucide-react";
import Link from "next/link";
import { jobsApi, type ApiApplication } from "../../lib/jobs.api";

type FilterTab = "semua" | "pending" | "accepted" | "rejected";

const statusConfig: Record<ApiApplication["status"], {
  label: string;
  color: "blue" | "green" | "red" | "gray" | "orange";
  icon: typeof CheckCircle;
}> = {
  pending:   { label: "Menunggu",    color: "blue",   icon: Clock },
  reviewed:  { label: "Ditinjau",   color: "orange",  icon: Eye },
  accepted:  { label: "Diterima",   color: "green",   icon: CheckCircle },
  completed: { label: "Selesai ✓",  color: "green",   icon: CheckCircle },
  rejected:  { label: "Ditolak",    color: "red",     icon: XCircle },
  expired:   { label: "Kedaluwarsa",color: "gray",    icon: RotateCcw },
};

function formatBudget(amount: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency", currency: "IDR", minimumFractionDigits: 0,
  }).format(amount);
}

export default function ApplicationsPage() {
  const [activeTab, setActiveTab]     = useState<FilterTab>("semua");
  const [withdrawId, setWithdrawId]   = useState<string | null>(null);
  const [applications, setApplications] = useState<ApiApplication[]>([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState<string | null>(null);
  const [toast, setToast]             = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await jobsApi.myApplications({ limit: 100 });
        setApplications(res.data);
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : "Gagal memuat lamaran");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filtered = applications.filter((a) => {
    if (activeTab === "semua")    return true;
    if (activeTab === "pending")  return a.status === "pending" || a.status === "reviewed";
    if (activeTab === "accepted") return a.status === "accepted" || a.status === "completed";
    if (activeTab === "rejected") return a.status === "rejected" || a.status === "expired";
    return true;
  });

  const counts = {
    semua:    applications.length,
    pending:  applications.filter((a) => a.status === "pending" || a.status === "reviewed").length,
    accepted: applications.filter((a) => a.status === "accepted" || a.status === "completed").length,
    rejected: applications.filter((a) => a.status === "rejected" || a.status === "expired").length,
  };

  const handleWithdraw = async () => {
    if (!withdrawId) return;
    try {
      await jobsApi.withdraw(withdrawId);
      setApplications((prev) => prev.filter((a) => a.id !== withdrawId));
      setToast("Lamaran berhasil ditarik.");
    } catch (e: unknown) {
      setToast(e instanceof Error ? e.message : "Gagal menarik lamaran");
    } finally {
      setWithdrawId(null);
    }
  };

  const TABS: { key: FilterTab; label: string }[] = [
    { key: "semua",    label: `Semua (${counts.semua})` },
    { key: "pending",  label: `Menunggu (${counts.pending})` },
    { key: "accepted", label: `Diterima (${counts.accepted})` },
    { key: "rejected", label: `Ditolak (${counts.rejected})` },
  ];

  return (
    <>
      <Header />
      <main className="flex-1 bg-[#F1F1F1] py-8">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex items-center justify-between mb-6">
            <div>
              <Link href="/jobs" className="inline-flex items-center gap-1 text-sm text-[#146EB4] hover:underline mb-2">
                <ArrowLeft className="w-4 h-4" /> Kembali ke Lowongan
              </Link>
              <h1 className="text-2xl font-bold text-[#232F3E]">Lamaranku</h1>
              <p className="text-sm text-[#565A5C]">Pantau status semua lamaran Anda</p>
            </div>
            <Link href="/jobs"><Button size="sm">+ Cari Lowongan</Button></Link>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            {[
              { label: "Total Lamaran", val: counts.semua,    bg: "bg-white" },
              { label: "Menunggu",      val: counts.pending,  bg: "bg-blue-50" },
              { label: "Diterima",      val: counts.accepted, bg: "bg-green-50" },
              { label: "Ditolak",       val: counts.rejected, bg: "bg-red-50" },
            ].map((s) => (
              <div key={s.label} className={`${s.bg} border border-[#E7E7E7] rounded-lg p-4 text-center`}>
                <p className="text-2xl font-bold text-[#232F3E]">{s.val}</p>
                <p className="text-xs text-[#565A5C] mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Tabs */}
          <div className="flex gap-1 bg-white border border-[#E7E7E7] rounded-lg p-1 mb-5">
            {TABS.map((t) => (
              <button key={t.key} onClick={() => setActiveTab(t.key)}
                className={`flex-1 text-xs sm:text-sm py-2 px-2 rounded-md font-semibold transition-colors ${
                  activeTab === t.key ? "bg-[#E8B4D1] text-white" : "text-[#565A5C] hover:bg-[#F1F1F1]"
                }`}>
                {t.label}
              </button>
            ))}
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
              <div className="text-5xl mb-4">📋</div>
              <h3 className="text-lg font-bold text-[#232F3E] mb-2">Belum ada lamaran</h3>
              <p className="text-sm text-[#565A5C] mb-4">Mulai lamar lowongan yang sesuai skill Anda</p>
              <Link href="/jobs"><Button size="sm">Lihat Lowongan</Button></Link>
            </div>
          ) : (
            <div className="space-y-3">
              {filtered.map((app) => {
                const { label, color, icon: Icon } = statusConfig[app.status];
                const canWithdraw = app.status === "pending";
                return (
                  <div key={app.id} className="bg-white border border-[#E7E7E7] rounded-lg p-5 hover:shadow-sm transition-shadow">
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex-1">
                        <Link href={`/jobs/${app.job_id}`}
                          className="text-base font-bold text-[#232F3E] hover:text-[#146EB4] transition-colors">
                          {app.job_title}
                        </Link>
                        <p className="text-sm text-[#565A5C]">{app.company}</p>
                      </div>
                      <Badge label={label} color={color} />
                    </div>

                    {app.status === "accepted" && (
                      <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-lg p-3 mb-3">
                        <CheckCircle className="w-4 h-4 text-[#12A54D] flex-shrink-0" />
                        <p className="text-sm text-green-800 font-medium">
                          Selamat! Lamaran Anda diterima. Employer akan segera menghubungi Anda.
                        </p>
                      </div>
                    )}
                    {app.status === "rejected" && (
                      <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg p-3 mb-3">
                        <XCircle className="w-4 h-4 text-[#DC2C1E] flex-shrink-0" />
                        <p className="text-sm text-red-800">Lamaran tidak dilanjutkan. Jangan menyerah, terus apply!</p>
                      </div>
                    )}

                    <p className="text-sm text-[#565A5C] bg-[#F1F1F1] rounded p-3 mb-3 line-clamp-2">
                      "{app.cover_letter}"
                    </p>

                    <div className="flex flex-wrap items-center gap-4 text-xs text-[#565A5C]">
                      <span className="flex items-center gap-1">
                        <DollarSign className="w-3.5 h-3.5" /> {formatBudget(app.budget_max ?? app.budget_min ?? 0)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" /> Dikirim: {app.submitted_at?.split("T")[0]}
                      </span>
                      {app.reviewed_at && (
                        <span className="flex items-center gap-1">
                          <Icon className="w-3.5 h-3.5" /> Ditinjau: {app.reviewed_at.split("T")[0]}
                        </span>
                      )}
                      {canWithdraw && (
                        <button onClick={() => setWithdrawId(app.id)}
                          className="ml-auto flex items-center gap-1 text-[#DC2C1E] hover:underline">
                          <Trash2 className="w-3.5 h-3.5" /> Tarik Lamaran
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      <Footer />

      <Modal isOpen={!!withdrawId} onClose={() => setWithdrawId(null)} title="Tarik Lamaran?" size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setWithdrawId(null)}>Batal</Button>
            <Button variant="danger" onClick={handleWithdraw}>Ya, Tarik</Button>
          </>
        }
      >
        <p className="text-sm text-[#565A5C]">
          Apakah Anda yakin ingin menarik lamaran ini? Tindakan ini tidak bisa dibatalkan.
        </p>
      </Modal>

      {toast && <Toast message={toast} type="success" onClose={() => setToast(null)} />}
    </>
  );
}
