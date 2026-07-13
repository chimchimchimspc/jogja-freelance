"use client";
import { useState, useEffect, useCallback } from "react";
import { Search, CheckCircle, XCircle, Eye, Loader2, ChevronLeft, ChevronRight, Trash2 } from "lucide-react";
import Badge from "../../components/ui/Badge";
import Button from "../../components/ui/Button";
import Modal from "../../components/ui/Modal";
import Toast from "../../components/ui/Toast";
import { Textarea } from "../../components/ui/Input";
import { adminApi, type ApiAdminJob } from "../../lib/admin.api";
import { formatBudget } from "../../data/admin";

type StatusFilter = "" | "pending_review" | "active" | "rejected" | "closed";

const TABS: { key: StatusFilter; label: string }[] = [
  { key: "",               label: "Semua" },
  { key: "pending_review", label: "Pending" },
  { key: "active",         label: "Aktif" },
  { key: "rejected",       label: "Ditolak" },
  { key: "closed",         label: "Ditutup" },
];

const STATUS_BADGE: Record<ApiAdminJob["status"], { label: string; color: "blue" | "orange" | "green" | "red" | "gray" }> = {
  draft:           { label: "Draft",   color: "gray" },
  pending_review:  { label: "Pending", color: "orange" },
  active:          { label: "Aktif",   color: "green" },
  closed:          { label: "Ditutup", color: "gray" },
  rejected:        { label: "Ditolak", color: "red" },
};

const LIMIT = 15;

export default function AdminJobsPage() {
  const [status, setStatus] = useState<StatusFilter>("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [jobs, setJobs] = useState<ApiAdminJob[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [previewJob, setPreviewJob] = useState<ApiAdminJob | null>(null);
  const [rejectJob, setRejectJob] = useState<ApiAdminJob | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [deleteJobTarget, setDeleteJobTarget] = useState<ApiAdminJob | null>(null);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const loadJobs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminApi.listJobs({ page, limit: LIMIT, status: status || undefined, search: search || undefined });
      setJobs(res.data);
      setTotal(res.pagination.total);
    } catch (err: unknown) {
      setToast({ message: err instanceof Error ? err.message : "Gagal memuat lowongan.", type: "error" });
    } finally {
      setLoading(false);
    }
  }, [page, status, search]);

  useEffect(() => {
    const t = setTimeout(loadJobs, 300);
    return () => clearTimeout(t);
  }, [loadJobs]);

  const handleApprove = async (id: string) => {
    try {
      await adminApi.approveJob(id);
      setToast({ message: "Lowongan disetujui dan dipublikasikan.", type: "success" });
      setPreviewJob(null);
      loadJobs();
    } catch (err: unknown) {
      setToast({ message: err instanceof Error ? err.message : "Gagal menyetujui lowongan.", type: "error" });
    }
  };

  const handleReject = async () => {
    if (!rejectJob) return;
    try {
      await adminApi.rejectJob(rejectJob.id, rejectReason || undefined);
      setToast({ message: "Lowongan ditolak.", type: "error" });
      setRejectJob(null);
      setRejectReason("");
      setPreviewJob(null);
      loadJobs();
    } catch (err: unknown) {
      setToast({ message: err instanceof Error ? err.message : "Gagal menolak lowongan.", type: "error" });
    }
  };

  const handleDelete = async () => {
    if (!deleteJobTarget) return;
    try {
      await adminApi.deleteJob(deleteJobTarget.id);
      setToast({ message: "Lowongan dihapus.", type: "success" });
      setDeleteJobTarget(null);
      setPreviewJob(null);
      loadJobs();
    } catch (err: unknown) {
      setToast({ message: err instanceof Error ? err.message : "Gagal menghapus lowongan.", type: "error" });
    }
  };

  const totalPages = Math.max(1, Math.ceil(total / LIMIT));

  return (
    <>
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-[#232F3E]">Kelola Lowongan</h1>
          <p className="text-sm text-[#565A5C]">Tinjau, setujui, atau tolak lowongan yang diajukan employer</p>
        </div>

        {/* Tabs + search */}
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <div className="flex gap-1 bg-white border border-[#E7E7E7] rounded-lg p-1">
            {TABS.map((t) => (
              <button
                key={t.key}
                onClick={() => { setStatus(t.key); setPage(1); }}
                className={`text-xs sm:text-sm py-2 px-3 rounded-md font-semibold transition-colors whitespace-nowrap ${
                  status === t.key ? "bg-[#232F3E] text-white" : "text-[#565A5C] hover:bg-[#F1F1F1]"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#565A5C]" />
            <input
              type="text"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder="Cari judul lowongan..."
              className="w-full pl-9 pr-4 py-2.5 text-sm border border-[#CCCCCC] rounded-lg bg-white focus:outline-none focus:border-[#146EB4]"
            />
          </div>
        </div>

        {/* List */}
        <div className="bg-white border border-[#E7E7E7] rounded-lg">
          {loading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="w-7 h-7 animate-spin text-[#D64545]" />
            </div>
          ) : jobs.length === 0 ? (
            <div className="p-16 text-center text-sm text-[#565A5C]">Tidak ada lowongan untuk filter ini.</div>
          ) : (
            <div className="divide-y divide-[#E7E7E7]">
              {jobs.map((job) => {
                const badge = STATUS_BADGE[job.status];
                return (
                  <div key={job.id} className="flex items-center gap-4 px-6 py-4 hover:bg-[#F8F8F8] transition-colors">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-[#232F3E] truncate">{job.title}</p>
                        <Badge label={badge.label} color={badge.color} />
                      </div>
                      <p className="text-xs text-[#565A5C] mt-0.5">{job.company_name || "—"} · {job.category || "—"}</p>
                      <p className="text-xs text-[#565A5C]">
                        {formatBudget(job.budget_max ?? job.budget_min ?? 0)} · Diajukan {new Date(job.created_at).toLocaleDateString("id-ID")}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button
                        onClick={() => setPreviewJob(job)}
                        className="p-1.5 text-[#565A5C] hover:text-[#146EB4] hover:bg-blue-50 rounded transition-colors"
                        title="Detail"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      {job.status === "pending_review" && (
                        <>
                          <button
                            onClick={() => handleApprove(job.id)}
                            className="p-1.5 text-[#12A54D] hover:bg-green-50 rounded transition-colors"
                            title="Setujui"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setRejectJob(job)}
                            className="p-1.5 text-[#DC2C1E] hover:bg-red-50 rounded transition-colors"
                            title="Tolak"
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
                        </>
                      )}
                      <button
                        onClick={() => setDeleteJobTarget(job)}
                        className="p-1.5 text-[#DC2C1E] hover:bg-red-50 rounded transition-colors"
                        title="Hapus"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-4 text-sm text-[#565A5C]">
            <span>Halaman {page} dari {totalPages} · {total} lowongan</span>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="p-2 border border-[#E7E7E7] rounded-lg bg-white disabled:opacity-40 hover:bg-[#F1F1F1]"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="p-2 border border-[#E7E7E7] rounded-lg bg-white disabled:opacity-40 hover:bg-[#F1F1F1]"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Preview modal */}
      <Modal
        isOpen={!!previewJob}
        onClose={() => setPreviewJob(null)}
        title="Detail Lowongan"
        size="md"
        footer={
          previewJob && (
            <>
              <Button variant="danger" onClick={() => setDeleteJobTarget(previewJob)}>
                <Trash2 className="w-4 h-4" /> Hapus
              </Button>
              {previewJob.status === "pending_review" && (
                <>
                  <Button variant="danger" onClick={() => setRejectJob(previewJob)}>
                    <XCircle className="w-4 h-4" /> Tolak
                  </Button>
                  <Button onClick={() => handleApprove(previewJob.id)}>
                    <CheckCircle className="w-4 h-4" /> Setujui & Publikasikan
                  </Button>
                </>
              )}
            </>
          )
        }
      >
        {previewJob && (
          <div className="space-y-4">
            <div>
              <p className="text-xs text-[#565A5C] font-bold mb-1">JUDUL</p>
              <p className="font-semibold text-[#232F3E]">{previewJob.title}</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-[#565A5C] font-bold mb-1">PERUSAHAAN</p>
                <p className="text-sm text-[#232F3E]">{previewJob.company_name || "—"}</p>
              </div>
              <div>
                <p className="text-xs text-[#565A5C] font-bold mb-1">KATEGORI</p>
                <p className="text-sm text-[#232F3E]">{previewJob.category || "—"}</p>
              </div>
              <div>
                <p className="text-xs text-[#565A5C] font-bold mb-1">BUDGET</p>
                <p className="text-sm font-semibold text-[#12A54D]">{formatBudget(previewJob.budget_max ?? previewJob.budget_min ?? 0)}</p>
              </div>
              <div>
                <p className="text-xs text-[#565A5C] font-bold mb-1">KONTAK</p>
                <p className="text-sm text-[#232F3E]">{previewJob.contact_email || "—"}</p>
              </div>
            </div>
            {previewJob.admin_notes && (
              <div>
                <p className="text-xs text-[#565A5C] font-bold mb-1">CATATAN ADMIN</p>
                <p className="text-sm text-[#232F3E] bg-[#F1F1F1] rounded p-3">{previewJob.admin_notes}</p>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Reject reason modal */}
      <Modal
        isOpen={!!rejectJob}
        onClose={() => { setRejectJob(null); setRejectReason(""); }}
        title="Tolak Lowongan"
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => { setRejectJob(null); setRejectReason(""); }}>Batal</Button>
            <Button variant="danger" onClick={handleReject}>Tolak Lowongan</Button>
          </>
        }
      >
        <p className="text-sm text-[#565A5C] mb-3">
          Berikan alasan penolakan untuk <strong>{rejectJob?.title}</strong> (opsional, akan dikirim ke employer).
        </p>
        <Textarea
          value={rejectReason}
          onChange={(e) => setRejectReason(e.target.value)}
          placeholder="Contoh: Budget tidak wajar, deskripsi tidak jelas..."
          rows={3}
        />
      </Modal>

      {/* Delete confirm modal */}
      <Modal
        isOpen={!!deleteJobTarget}
        onClose={() => setDeleteJobTarget(null)}
        title="Hapus Lowongan"
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setDeleteJobTarget(null)}>Batal</Button>
            <Button variant="danger" onClick={handleDelete}>Ya, Hapus</Button>
          </>
        }
      >
        <p className="text-sm text-[#565A5C]">
          Yakin ingin menghapus lowongan <strong>{deleteJobTarget?.title}</strong>? Tindakan ini tidak bisa dibatalkan
          dan akan menghapus juga lamaran yang terkait.
        </p>
      </Modal>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </>
  );
}
