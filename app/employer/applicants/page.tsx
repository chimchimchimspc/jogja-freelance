"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Header from "../../components/layout/Header";
import Footer from "../../components/layout/Footer";
import Toast from "../../components/ui/Toast";
import {
  UserRoundSearch, CheckCircle, XCircle, Eye, Loader2, Briefcase, Star, MessageCircle, ClipboardCheck,
} from "lucide-react";
import Link from "next/link";
import { useAuth } from "../../context/AuthContext";
import { jobsApi, type ApiEmployerApplication, type ApplicationStatus } from "../../lib/jobs.api";
import { chatApi } from "../../lib/chat.api";
import { assetUrl } from "../../lib/api";
import CompleteReviewModal from "../../components/employer/CompleteReviewModal";

type Tab = "" | ApplicationStatus;

const TABS: { key: Tab; label: string }[] = [
  { key: "",                     label: "Semua" },
  { key: "pending",              label: "Baru" },
  { key: "accepted",             label: "Diterima" },
  { key: "submitted_for_review", label: "Perlu Direview" },
  { key: "completed",            label: "Selesai" },
  { key: "rejected",             label: "Ditolak" },
];

const STATUS_BADGE: Record<string, { label: string; cls: string }> = {
  pending:               { label: "Baru",           cls: "bg-blue-100 text-blue-700" },
  reviewed:              { label: "Direview",       cls: "bg-yellow-100 text-yellow-700" },
  accepted:              { label: "Diterima",       cls: "bg-green-100 text-green-700" },
  submitted_for_review:  { label: "Perlu Direview", cls: "bg-orange-100 text-orange-700" },
  revision_requested:    { label: "Revisi Diminta", cls: "bg-orange-100 text-orange-700" },
  completed:             { label: "Selesai",        cls: "bg-purple-100 text-purple-700" },
  terminated:            { label: "Diberhentikan",  cls: "bg-red-100 text-red-700" },
  rejected:              { label: "Ditolak",        cls: "bg-red-100 text-red-700" },
  expired:               { label: "Expired",        cls: "bg-gray-100 text-gray-500" },
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

export default function ApplicantsPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [applicants, setApplicants] = useState<ApiEmployerApplication[]>([]);
  const [tab, setTab] = useState<Tab>("");
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [chatting, setChatting] = useState<string | null>(null);
  const [reviewTarget, setReviewTarget] = useState<{
    applicationId: string; freelancerId: string; name: string; jobId?: string; jobTitle?: string;
  } | null>(null);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

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
      router.push("/auth/login?redirect=/employer/applicants");
      return;
    }
    if (user.role !== "employer" && user.role !== "event_organizer" && user.role !== "admin") {
      router.push("/");
      return;
    }
    (async () => {
      try {
        const res = await jobsApi.employerApplications(100);
        setApplicants(res.data);
      } catch {
        setApplicants([]);
      } finally {
        setLoading(false);
      }
    })();
  }, [user, authLoading, router]);

  const handleUpdateStatus = async (id: string, status: "reviewed" | "accepted" | "rejected") => {
    setUpdating(id);
    try {
      await jobsApi.updateApplicationStatus(id, status);
      setApplicants((prev) => prev.map((a) => (a.id === id ? { ...a, status } : a)));
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
            <div className="flex items-center gap-3 mb-1">
              <UserRoundSearch className="w-6 h-6 text-[#D64545]" />
              <h1 className="text-2xl font-bold">Pendaftar Lowongan</h1>
            </div>
            <p className="text-sm text-[#6B6880]">
              {applicants.length} pelamar dari semua lowongan Anda · Terima atau tolak langsung dari sini
            </p>
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
              <Briefcase className="w-10 h-10 text-[#D5D0E8] mx-auto mb-3" />
              <h3 className="font-bold text-[#1E1B2E] mb-1">Belum ada pelamar</h3>
              <p className="text-sm text-[#6B6880]">Pelamar untuk lowongan Anda akan muncul di sini</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filtered.map((a) => {
                const st = STATUS_BADGE[a.status] ?? STATUS_BADGE.pending;
                const busy = updating === a.id;
                const undecided = a.status === "pending" || a.status === "reviewed";
                return (
                  <div key={a.id} className="bg-white border border-[#EAE6F5] rounded-xl p-5">
                    <div className="flex items-start gap-4">
                      {/* Avatar */}
                      <div className="w-12 h-12 rounded-full bg-[#D64545] flex items-center justify-center text-white font-bold flex-shrink-0 overflow-hidden">
                        {a.profile_picture_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={assetUrl(a.profile_picture_url)} alt={a.name} className="w-full h-full object-cover" />
                        ) : (
                          a.name.charAt(0)
                        )}
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
                          Melamar: <span className="font-semibold text-[#1E1B2E]">{a.job_title}</span>
                          {" · "}{fmtDate(a.submitted_at)}
                          {a.rating != null && Number(a.rating) > 0 && (
                            <span className="inline-flex items-center gap-0.5 ml-2">
                              <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                              {Number(a.rating).toFixed(1)}
                            </span>
                          )}
                        </p>
                        {a.cover_letter && (
                          <p className="text-sm text-[#232F3E] bg-[#F8F6FF] rounded-lg p-3 break-words">
                            {a.cover_letter}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Aksi */}
                    <div className="flex items-center gap-2 mt-4 pl-16 flex-wrap">
                      {undecided ? (
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
                      ) : a.status === "submitted_for_review" ? (
                        <>
                          <button
                            onClick={() => setReviewTarget({
                              applicationId: a.id,
                              freelancerId: a.freelancer_id,
                              name: a.name,
                              jobId: a.job_id,
                              jobTitle: a.job_title,
                            })}
                            className="flex items-center gap-1.5 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-semibold rounded-lg transition-colors"
                          >
                            <ClipboardCheck className="w-4 h-4" /> Setujui & Beri Ulasan
                          </button>
                          <Link
                            href={`/employer/jobs/${a.job_id}/applicants`}
                            className="text-xs text-[#146EB4] hover:underline font-semibold"
                          >
                            Tolak / Minta Revisi →
                          </Link>
                        </>
                      ) : a.status === "accepted" ? (
                        <p className="text-xs text-[#6B6880] italic">
                          ✓ Diterima — menunggu freelancer menandai pekerjaan selesai
                        </p>
                      ) : a.status === "revision_requested" ? (
                        <p className="text-xs text-orange-700 italic">
                          ⏳ Menunggu freelancer mengirim ulang hasil revisi
                        </p>
                      ) : a.status === "completed" ? (
                        <p className="text-xs text-purple-700 italic">
                          🏁 Pekerjaan selesai — ulasan sudah masuk ke profil freelancer
                        </p>
                      ) : a.status === "terminated" ? (
                        <p className="text-xs text-[#6B6880] italic">✕ Kerja sama diberhentikan</p>
                      ) : (
                        <p className="text-xs text-[#6B6880] italic">✕ Pelamar sudah ditolak</p>
                      )}
                      <button
                        onClick={() => handleChat(a.freelancer_id)}
                        disabled={chatting === a.freelancer_id}
                        className="flex items-center gap-1.5 px-4 py-2 bg-[#146EB4] hover:bg-[#0F5A94] text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-60"
                      >
                        {chatting === a.freelancer_id
                          ? <Loader2 className="w-4 h-4 animate-spin" />
                          : <MessageCircle className="w-4 h-4" />}
                        Chat
                      </button>
                      <Link
                        href={`/profile/${a.freelancer_id}`}
                        className="ml-auto text-xs text-[#146EB4] hover:underline font-semibold"
                      >
                        Lihat Profil →
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
      <Footer />

      <CompleteReviewModal
        isOpen={!!reviewTarget}
        onClose={() => setReviewTarget(null)}
        applicant={reviewTarget}
        onDone={(appId) => {
          setApplicants((prev) => prev.map((a) => (a.id === appId ? { ...a, status: "completed" } : a)));
          setToast({ message: "Pekerjaan selesai! Ulasan terkirim ke profil freelancer 🎉", type: "success" });
        }}
        onError={(msg) => setToast({ message: msg, type: "error" })}
      />

      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} duration={4000} />
      )}
    </>
  );
}
