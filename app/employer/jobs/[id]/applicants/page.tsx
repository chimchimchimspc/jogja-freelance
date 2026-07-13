"use client";
import { use, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Header from "../../../../components/layout/Header";
import Footer from "../../../../components/layout/Footer";
import Toast from "../../../../components/ui/Toast";
import Modal from "../../../../components/ui/Modal";
import Button from "../../../../components/ui/Button";
import { Textarea } from "../../../../components/ui/Input";
import {
  ChevronLeft, CheckCircle, XCircle, Eye, Loader2, Briefcase, Star, Users, MessageCircle,
  Send, AlertCircle, Ban,
} from "lucide-react";
import Link from "next/link";
import { useAuth } from "../../../../context/AuthContext";
import { jobsApi, type ApiJob, type ApiJobApplicant, type ApplicationStatus } from "../../../../lib/jobs.api";
import { chatApi } from "../../../../lib/chat.api";
import CompleteReviewModal from "../../../../components/employer/CompleteReviewModal";

type Tab = "" | ApplicationStatus;

const TABS: { key: Tab; label: string }[] = [
  { key: "",                    label: "Semua" },
  { key: "pending",             label: "Baru" },
  { key: "reviewed",            label: "Direview" },
  { key: "accepted",            label: "Diterima" },
  { key: "submitted_for_review",label: "Perlu Direview" },
  { key: "completed",           label: "Selesai" },
  { key: "rejected",            label: "Ditolak" },
];

const STATUS_BADGE: Record<string, { label: string; cls: string }> = {
  pending:               { label: "Baru",            cls: "bg-blue-100 text-blue-700" },
  reviewed:              { label: "Direview",        cls: "bg-yellow-100 text-yellow-700" },
  accepted:              { label: "Diterima",        cls: "bg-green-100 text-green-700" },
  submitted_for_review:  { label: "Perlu Direview",  cls: "bg-orange-100 text-orange-700" },
  revision_requested:    { label: "Revisi Diminta",  cls: "bg-orange-100 text-orange-700" },
  completed:             { label: "Selesai",         cls: "bg-green-100 text-green-700" },
  terminated:            { label: "Diberhentikan",   cls: "bg-red-100 text-red-700" },
  rejected:              { label: "Ditolak",         cls: "bg-red-100 text-red-700" },
  expired:               { label: "Expired",         cls: "bg-gray-100 text-gray-500" },
};

const levelBadge: Record<string, string> = {
  Bronze:   "text-orange-700 bg-orange-50 border-orange-200",
  Silver:   "text-gray-600  bg-gray-50   border-gray-200",
  Gold:     "text-yellow-700 bg-yellow-50 border-yellow-200",
  Platinum: "text-blue-600  bg-blue-50   border-blue-200",
};

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
}

export default function JobApplicantsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const [job, setJob] = useState<ApiJob | null>(null);
  const [applicants, setApplicants] = useState<ApiJobApplicant[]>([]);
  const [tab, setTab] = useState<Tab>("");
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [chatting, setChatting] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  // Alur review hasil kerja: pilih aksi (tolak → revisi/berhentikan) via modal
  const [decisionApp, setDecisionApp] = useState<ApiJobApplicant | null>(null);
  const [decisionMode, setDecisionMode] = useState<"choose" | "revision" | "terminate">("choose");
  const [feedbackNote, setFeedbackNote] = useState("");
  const [decisionBusy, setDecisionBusy] = useState(false);

  const handleChat = async (freelancerId: string) => {
    setChatting(freelancerId);
    try {
      const convo = await chatApi.start(freelancerId);
      router.push(`/chat?c=${convo.id}`);
    } catch (e: unknown) {
      setToast({ message: e instanceof Error ? e.message : "Gagal membuka chat.", type: "error" });
      setChatting(null);
    }
  };

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push(`/auth/login?redirect=/employer/jobs/${id}/applicants`);
      return;
    }
    (async () => {
      try {
        const [jobRes, appsRes] = await Promise.all([
          jobsApi.get(id),
          jobsApi.applicantsForJob(id),
        ]);
        setJob(jobRes.data);
        setApplicants(appsRes.data);
      } catch (e: unknown) {
        setToast({ message: e instanceof Error ? e.message : "Gagal memuat pelamar", type: "error" });
      } finally {
        setLoading(false);
      }
    })();
  }, [id, user, authLoading, router]);

  const handleUpdateStatus = async (appId: string, status: "reviewed" | "accepted" | "rejected") => {
    setUpdating(appId);
    try {
      await jobsApi.updateApplicationStatus(appId, status);
      setApplicants((prev) => prev.map((a) => (a.id === appId ? { ...a, status } : a)));
      const msg = {
        accepted: "Pelamar diterima! Notifikasi terkirim ke freelancer. 🎉",
        rejected: "Pelamar ditolak. Notifikasi terkirim ke freelancer.",
        reviewed: "Lamaran ditandai sudah direview.",
      }[status];
      setToast({ message: msg, type: status === "rejected" ? "error" : "success" });
    } catch (e: unknown) {
      setToast({ message: e instanceof Error ? e.message : "Gagal memperbarui status.", type: "error" });
    } finally {
      setUpdating(null);
    }
  };

  // Setujui hasil kerja = buka modal rating & ulasan (approve + review sekali jalan)
  const [reviewTarget, setReviewTarget] = useState<{
    applicationId: string; freelancerId: string; name: string; jobId?: string; jobTitle?: string;
  } | null>(null);

  const openDecision = (app: ApiJobApplicant) => {
    setDecisionApp(app);
    setDecisionMode("choose");
    setFeedbackNote("");
  };

  const closeDecision = () => {
    setDecisionApp(null);
    setFeedbackNote("");
  };

  const handleConfirmDecision = async () => {
    if (!decisionApp) return;
    if (decisionMode === "revision" && !feedbackNote.trim()) {
      setToast({ message: "Catatan revisi wajib diisi.", type: "error" });
      return;
    }
    setDecisionBusy(true);
    try {
      if (decisionMode === "revision") {
        await jobsApi.requestRevision(decisionApp.id, feedbackNote.trim());
        setApplicants((prev) => prev.map((a) => (a.id === decisionApp.id ? { ...a, status: "revision_requested" } : a)));
        setToast({ message: "Revisi diminta ke freelancer.", type: "success" });
      } else if (decisionMode === "terminate") {
        await jobsApi.terminateApplication(decisionApp.id, feedbackNote.trim() || undefined);
        setApplicants((prev) => prev.map((a) => (a.id === decisionApp.id ? { ...a, status: "terminated" } : a)));
        setToast({ message: "Kerja sama diberhentikan.", type: "success" });
      }
      closeDecision();
    } catch (e: unknown) {
      setToast({ message: e instanceof Error ? e.message : "Gagal memproses keputusan.", type: "error" });
    } finally {
      setDecisionBusy(false);
    }
  };

  const filtered = tab ? applicants.filter((a) => a.status === tab) : applicants;
  const counts = (key: Tab) => (key ? applicants.filter((a) => a.status === key).length : applicants.length);

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

  return (
    <>
      <Header />
      <main className="flex-1 bg-[#F8F6FF]">
        <div className="bg-white text-[#1E1B2E] py-8">
          <div className="max-w-4xl mx-auto px-4">
            <Link href="/employer" className="flex items-center gap-1.5 text-[#6B6880] hover:text-[#D64545] text-sm mb-4 transition-colors">
              <ChevronLeft className="w-4 h-4" /> Dashboard Employer
            </Link>
            <h1 className="text-xl font-bold mb-1">{job?.title ?? "Lowongan"}</h1>
            <div className="flex flex-wrap gap-3 text-sm text-[#6B6880]">
              <span className="flex items-center gap-1">
                <Briefcase className="w-3.5 h-3.5" /> {job?.category}
              </span>
              <span className="flex items-center gap-1">
                <Users className="w-3.5 h-3.5" /> {applicants.length} pelamar
              </span>
            </div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 py-6">
          {/* Tabs status */}
          <div className="flex gap-2 bg-white border border-[#EAE6F5] rounded-lg p-1 mb-6 w-fit flex-wrap">
            {TABS.map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`px-4 py-2 text-sm font-semibold rounded transition-colors ${
                  tab === t.key ? "bg-[#D64545] text-white" : "text-[#6B6880] hover:bg-[#F8F6FF]"
                }`}
              >
                {t.label} ({counts(t.key)})
              </button>
            ))}
          </div>

          {filtered.length === 0 ? (
            <div className="bg-white border border-[#EAE6F5] rounded-xl p-16 text-center">
              <Users className="w-10 h-10 text-[#D5D0E8] mx-auto mb-3" />
              <h3 className="font-bold text-[#1E1B2E] mb-1">Belum ada pelamar</h3>
              <p className="text-sm text-[#6B6880]">Pelamar untuk lowongan ini akan muncul di sini</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filtered.map((a) => {
                const st = STATUS_BADGE[a.status] ?? STATUS_BADGE.pending;
                const busy = updating === a.id;
                return (
                  <div key={a.id} className="bg-white border border-[#EAE6F5] rounded-xl p-5">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-full bg-[#D64545] flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                        {a.name.charAt(0)}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-0.5">
                          <p className="font-bold text-[#1E1B2E]">{a.name}</p>
                          {a.level && (
                            <span className={`text-xs px-2 py-0.5 rounded-full border font-semibold ${levelBadge[a.level] ?? levelBadge.Bronze}`}>
                              {a.level}
                            </span>
                          )}
                          <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${st.cls}`}>
                            {st.label}
                          </span>
                        </div>
                        <p className="text-xs text-[#6B6880] mb-2">
                          {fmtDate(a.submitted_at)}
                          {a.rating != null && Number(a.rating) > 0 && (
                            <span className="inline-flex items-center gap-0.5 ml-2">
                              <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                              {Number(a.rating).toFixed(1)}
                            </span>
                          )}
                          {a.completed_projects != null && (
                            <span className="ml-2">✓ {a.completed_projects} proyek selesai</span>
                          )}
                          <span className="ml-2">🏅 {a.badge_count} badge</span>
                        </p>

                        {a.skills?.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mb-2">
                            {a.skills.map((s) => (
                              <span key={s} className="text-xs bg-blue-50 text-[#146EB4] px-2 py-0.5 rounded-full font-semibold">
                                {s}
                              </span>
                            ))}
                          </div>
                        )}

                        {a.cover_letter && (
                          <p className="text-sm text-[#232F3E] bg-[#F8F6FF] rounded-lg p-3 break-words">
                            {a.cover_letter}
                          </p>
                        )}

                        {a.status === "submitted_for_review" && a.work_note && (
                          <div className="mt-2 bg-orange-50 border border-orange-200 rounded-lg p-3">
                            <p className="text-xs font-bold text-orange-700 mb-1 flex items-center gap-1">
                              <Send className="w-3.5 h-3.5" /> Catatan hasil kerja
                            </p>
                            <p className="text-sm text-orange-900 break-words">{a.work_note}</p>
                          </div>
                        )}
                        {a.status === "revision_requested" && a.employer_feedback && (
                          <div className="mt-2 bg-orange-50 border border-orange-200 rounded-lg p-3">
                            <p className="text-xs font-bold text-orange-700 mb-1 flex items-center gap-1">
                              <AlertCircle className="w-3.5 h-3.5" /> Revisi yang kamu minta
                            </p>
                            <p className="text-sm text-orange-900 break-words">{a.employer_feedback}</p>
                          </div>
                        )}
                        {a.status === "terminated" && a.employer_feedback && (
                          <div className="mt-2 bg-red-50 border border-red-200 rounded-lg p-3">
                            <p className="text-xs font-bold text-red-700 mb-1 flex items-center gap-1">
                              <Ban className="w-3.5 h-3.5" /> Alasan pemberhentian
                            </p>
                            <p className="text-sm text-red-900 break-words">{a.employer_feedback}</p>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 mt-4 pl-16 flex-wrap">
                      {(a.status === "pending" || a.status === "reviewed") && (
                        <>
                          <button
                            onClick={() => handleUpdateStatus(a.id, "accepted")}
                            disabled={busy}
                            className="flex items-center gap-1.5 px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-60"
                          >
                            <CheckCircle className="w-4 h-4" /> Terima
                          </button>
                          <button
                            onClick={() => handleUpdateStatus(a.id, "rejected")}
                            disabled={busy}
                            className="flex items-center gap-1.5 px-4 py-2 bg-red-50 hover:bg-red-100 text-[#DC3545] border border-red-200 text-sm font-semibold rounded-lg transition-colors disabled:opacity-60"
                          >
                            <XCircle className="w-4 h-4" /> Tolak
                          </button>
                          {a.status === "pending" && (
                            <button
                              onClick={() => handleUpdateStatus(a.id, "reviewed")}
                              disabled={busy}
                              className="flex items-center gap-1.5 px-4 py-2 bg-[#F8F6FF] hover:bg-[#EAE6F5] text-[#6B6880] text-sm font-semibold rounded-lg transition-colors disabled:opacity-60"
                            >
                              <Eye className="w-4 h-4" /> Tandai Direview
                            </button>
                          )}
                          {busy && <Loader2 className="w-4 h-4 animate-spin text-[#D64545]" />}
                        </>
                      )}

                      {a.status === "rejected" && (
                        <p className="text-xs text-[#6B6880] italic">✕ Pelamar sudah ditolak</p>
                      )}

                      {a.status === "accepted" && (
                        <>
                          <p className="text-xs text-[#6B6880] italic">
                            ✓ Diterima — menunggu freelancer mengerjakan & menandai selesai
                          </p>
                          <button
                            onClick={() => openDecision(a)}
                            disabled={busy}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-[#DC3545] text-xs font-semibold hover:underline disabled:opacity-60"
                          >
                            <Ban className="w-3.5 h-3.5" /> Berhentikan Kerja Sama
                          </button>
                        </>
                      )}

                      {a.status === "submitted_for_review" && (
                        <>
                          <button
                            onClick={() => setReviewTarget({
                              applicationId: a.id,
                              freelancerId: a.freelancer_id,
                              name: a.name,
                              jobId: id,
                              jobTitle: job?.title,
                            })}
                            disabled={busy}
                            className="flex items-center gap-1.5 px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-60"
                          >
                            <CheckCircle className="w-4 h-4" /> Setujui & Beri Ulasan
                          </button>
                          <button
                            onClick={() => openDecision(a)}
                            disabled={busy}
                            className="flex items-center gap-1.5 px-4 py-2 bg-red-50 hover:bg-red-100 text-[#DC3545] border border-red-200 text-sm font-semibold rounded-lg transition-colors disabled:opacity-60"
                          >
                            <XCircle className="w-4 h-4" /> Tolak
                          </button>
                          {busy && <Loader2 className="w-4 h-4 animate-spin text-[#D64545]" />}
                        </>
                      )}

                      {a.status === "revision_requested" && (
                        <>
                          <p className="text-xs text-[#6B6880] italic">
                            ⏳ Menunggu freelancer mengirim ulang hasil revisi
                          </p>
                          <button
                            onClick={() => openDecision(a)}
                            disabled={busy}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-[#DC3545] text-xs font-semibold hover:underline disabled:opacity-60"
                          >
                            <Ban className="w-3.5 h-3.5" /> Berhentikan Kerja Sama
                          </button>
                        </>
                      )}

                      {a.status === "completed" && (
                        <p className="text-xs text-green-700 italic font-semibold">🎉 Pekerjaan selesai & disetujui</p>
                      )}
                      {a.status === "terminated" && (
                        <p className="text-xs text-[#6B6880] italic">✕ Kerja sama diberhentikan</p>
                      )}

                      <button
                        onClick={() => handleChat(a.freelancer_id)}
                        disabled={chatting === a.freelancer_id}
                        className="flex items-center gap-1.5 px-4 py-2 bg-[#146EB4] hover:bg-[#0F5A94] text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-60 ml-auto"
                      >
                        {chatting === a.freelancer_id
                          ? <Loader2 className="w-4 h-4 animate-spin" />
                          : <MessageCircle className="w-4 h-4" />}
                        Chat
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
      <Footer />

      <Modal
        isOpen={!!decisionApp}
        onClose={closeDecision}
        title={
          decisionMode === "choose" ? "Tolak Hasil Kerja"
          : decisionMode === "revision" ? "Ajukan Revisi"
          : "Berhentikan Kerja Sama"
        }
        size="sm"
        footer={
          decisionMode === "choose" ? undefined : (
            <>
              <Button variant="secondary" onClick={() => setDecisionMode("choose")} disabled={decisionBusy}>
                Kembali
              </Button>
              <Button
                variant={decisionMode === "terminate" ? "danger" : "primary"}
                onClick={handleConfirmDecision}
                loading={decisionBusy}
              >
                {decisionMode === "revision" ? "Kirim Permintaan Revisi" : "Ya, Berhentikan"}
              </Button>
            </>
          )
        }
      >
        {decisionMode === "choose" ? (
          <div className="space-y-3">
            <p className="text-sm text-[#565A5C] mb-1">
              Pilih tindak lanjut untuk <strong>{decisionApp?.name}</strong>:
            </p>
            <button
              onClick={() => setDecisionMode("revision")}
              className="w-full text-left p-4 border border-orange-200 bg-orange-50 hover:bg-orange-100 rounded-lg transition-colors"
            >
              <p className="font-semibold text-orange-800 flex items-center gap-2">
                <AlertCircle className="w-4 h-4" /> Ajukan Revisi
              </p>
              <p className="text-xs text-orange-700 mt-1">
                Hasil kerja belum sesuai, tapi freelancer masih bisa memperbaikinya dan kirim ulang.
              </p>
            </button>
            <button
              onClick={() => setDecisionMode("terminate")}
              className="w-full text-left p-4 border border-red-200 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
            >
              <p className="font-semibold text-red-800 flex items-center gap-2">
                <Ban className="w-4 h-4" /> Berhentikan Kerja Sama
              </p>
              <p className="text-xs text-red-700 mt-1">
                Hentikan kerja sama untuk pekerjaan ini. Tindakan final, tidak bisa dilanjutkan lagi.
              </p>
            </button>
          </div>
        ) : decisionMode === "revision" ? (
          <>
            <p className="text-sm text-[#565A5C] mb-3">
              Jelaskan apa yang perlu diperbaiki oleh <strong>{decisionApp?.name}</strong>. Catatan ini wajib diisi.
            </p>
            <Textarea
              value={feedbackNote}
              onChange={(e) => setFeedbackNote(e.target.value)}
              placeholder="Contoh: warna belum sesuai brand guideline, mohon revisi bagian..."
              rows={4}
            />
          </>
        ) : (
          <>
            <p className="text-sm text-[#565A5C] mb-3">
              Kerja sama dengan <strong>{decisionApp?.name}</strong> untuk pekerjaan ini akan diberhentikan dan tidak
              bisa dilanjutkan lagi. Tambahkan alasan (opsional).
            </p>
            <Textarea
              value={feedbackNote}
              onChange={(e) => setFeedbackNote(e.target.value)}
              placeholder="Contoh: tidak responsif, hasil tidak sesuai kesepakatan awal, dsb."
              rows={4}
            />
          </>
        )}
      </Modal>

      <CompleteReviewModal
        isOpen={!!reviewTarget}
        onClose={() => setReviewTarget(null)}
        applicant={reviewTarget}
        onDone={(appId) => {
          setApplicants((prev) => prev.map((a) => (a.id === appId ? { ...a, status: "completed" } : a)));
          setToast({ message: "Pekerjaan disetujui! Rating & ulasan terkirim ke profil freelancer 🎉", type: "success" });
        }}
        onError={(msg) => setToast({ message: msg, type: "error" })}
      />

      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} duration={4000} />
      )}
    </>
  );
}
