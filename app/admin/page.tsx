"use client";
import { useState, useEffect, useCallback } from "react";
import { Users, Briefcase, Clock, Calendar, Award, TrendingUp, CheckCircle, XCircle, Eye } from "lucide-react";
import Toast from "../components/ui/Toast";
import { MOCK_ANALYTICS, MOCK_RECENT_ACTIVITY, formatBudget, type PendingJob, type AdminAnalytics } from "../data/admin";
import { adminApi } from "../lib/admin.api";
import Modal from "../components/ui/Modal";
import Button from "../components/ui/Button";

interface PendingEventView {
  id: string;
  title: string;
  type: string;
  eventDate: string;
  organizerName: string;
  locationName: string;
  organizerEmail: string;
  submittedAt: string;
}

export default function AdminDashboard() {
  const [pendingJobs, setPendingJobs] = useState<PendingJob[]>([]);
  const [pendingEvents, setPendingEvents] = useState<PendingEventView[]>([]);
  const [analytics, setAnalytics] = useState<AdminAnalytics>(MOCK_ANALYTICS);
  const [previewJob, setPreviewJob] = useState<PendingJob | null>(null);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const loadData = useCallback(async () => {
    try {
      const [analyticsRes, pendingRes, pendingEventsRes] = await Promise.all([
        adminApi.getAnalytics(),
        adminApi.getPendingJobs(),
        adminApi.getPendingEvents(),
      ]);
      setAnalytics(analyticsRes.data);
      setPendingJobs(
        pendingRes.data.map((j) => ({
          id: j.id,
          title: j.title,
          company: j.company_name || "—",
          category: j.category || "—",
          budget: j.budget_max ?? j.budget_min ?? 0,
          submittedAt: new Date(j.created_at).toLocaleString("id-ID"),
          contactEmail: j.contact_email || "—",
        }))
      );
      setPendingEvents(
        pendingEventsRes.data.map((e) => ({
          id: e.id,
          title: e.title,
          type: e.type,
          eventDate: new Date(e.event_date).toLocaleDateString("id-ID"),
          organizerName: e.organizer_name || "—",
          locationName: e.location_name || "—",
          organizerEmail: e.organizer_email || "—",
          submittedAt: new Date(e.created_at).toLocaleString("id-ID"),
        }))
      );
    } catch {
      setToast({ message: "Gagal memuat data admin.", type: "error" });
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleApprove = async (id: string) => {
    try {
      await adminApi.approveJob(id);
      setPendingJobs((p) => p.filter((j) => j.id !== id));
      setPreviewJob(null);
      setToast({ message: "Lowongan disetujui dan dipublikasikan.", type: "success" });
      setAnalytics((a) => ({ ...a, activeJobs: a.activeJobs + 1, pendingJobs: a.pendingJobs - 1 }));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Gagal menyetujui lowongan.";
      setToast({ message: msg, type: "error" });
    }
  };

  const handleReject = async (id: string) => {
    try {
      await adminApi.rejectJob(id);
      setPendingJobs((p) => p.filter((j) => j.id !== id));
      setPreviewJob(null);
      setToast({ message: "Lowongan ditolak dan email notifikasi dikirim.", type: "error" });
      setAnalytics((a) => ({ ...a, pendingJobs: a.pendingJobs - 1 }));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Gagal menolak lowongan.";
      setToast({ message: msg, type: "error" });
    }
  };

  const handleApproveEvent = async (id: string) => {
    try {
      await adminApi.approveEvent(id);
      setPendingEvents((p) => p.filter((e) => e.id !== id));
      setToast({ message: "Event disetujui dan dipublikasikan.", type: "success" });
      setAnalytics((a) => ({ ...a, totalEvents: a.totalEvents + 1, pendingEvents: a.pendingEvents - 1 }));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Gagal menyetujui event.";
      setToast({ message: msg, type: "error" });
    }
  };

  const handleRejectEvent = async (id: string) => {
    try {
      await adminApi.rejectEvent(id);
      setPendingEvents((p) => p.filter((e) => e.id !== id));
      setToast({ message: "Event ditolak dan notifikasi dikirim.", type: "error" });
      setAnalytics((a) => ({ ...a, pendingEvents: a.pendingEvents - 1 }));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Gagal menolak event.";
      setToast({ message: msg, type: "error" });
    }
  };

  const STAT_CARDS = [
    { icon: Users,     label: "Total Pengguna",     value: analytics.totalUsers,             sub: `+${analytics.newUsersThisWeek} minggu ini`, color: "bg-purple-50 border-purple-200" },
    { icon: Briefcase, label: "Lowongan Aktif",      value: analytics.activeJobs,             sub: `${analytics.pendingJobs} menunggu review`,  color: "bg-orange-50 border-orange-200" },
    { icon: Calendar,  label: "Events",              value: analytics.totalEvents,            sub: `${analytics.pendingEvents} menunggu review`, color: "bg-blue-50 border-blue-200" },
    { icon: Award,     label: "Verifikasi Badge",    value: analytics.pendingBadgeVerifications, sub: "perlu diverifikasi",                      color: "bg-yellow-50 border-yellow-200" },
    { icon: TrendingUp,label: "Lamaran Hari Ini",    value: analytics.jobApplicationsToday,   sub: "di semua lowongan",                          color: "bg-green-50 border-green-200" },
    { icon: Clock,     label: "Job Pending Review",  value: analytics.pendingJobs,            sub: "menunggu approval",                          color: "bg-red-50 border-red-200" },
  ];

  return (
    <>
      <div className="max-w-6xl mx-auto">
        {/* Page header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-[#232F3E]">Dashboard Admin</h1>
          <p className="text-sm text-[#565A5C]">Pantau dan kelola seluruh aktivitas platform</p>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-8">
          {STAT_CARDS.map((card) => {
            const Icon = card.icon;
            return (
              <div key={card.label} className={`border rounded-lg p-5 ${card.color}`}>
                <div className="flex items-center gap-2 mb-2">
                  <Icon className="w-4 h-4 text-[#565A5C]" />
                  <span className="text-xs text-[#565A5C] font-medium">{card.label}</span>
                </div>
                <p className="text-3xl font-bold text-[#232F3E]">{card.value}</p>
                <p className="text-xs text-[#565A5C] mt-1">{card.sub}</p>
              </div>
            );
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
          <div className="space-y-6">
            {/* Moderation Panel — Jobs */}
            <div className="bg-white border border-[#E7E7E7] rounded-lg">
              <div className="flex items-center justify-between px-6 py-4 border-b border-[#E7E7E7]">
                <h2 className="font-bold text-[#232F3E]">Lowongan Menunggu Review</h2>
                <span className="text-xs bg-orange-100 text-orange-700 font-bold px-2.5 py-1 rounded-full">
                  {pendingJobs.length} pending
                </span>
              </div>

              {pendingJobs.length === 0 ? (
                <div className="p-12 text-center">
                  <CheckCircle className="w-10 h-10 text-[#12A54D] mx-auto mb-3" />
                  <p className="font-semibold text-[#232F3E]">Semua lowongan sudah diproses!</p>
                  <p className="text-sm text-[#565A5C] mt-1">Tidak ada yang perlu di-review.</p>
                </div>
              ) : (
                <div className="divide-y divide-[#E7E7E7]">
                  {pendingJobs.map((job) => (
                    <div key={job.id} className="flex items-center gap-4 px-6 py-4 hover:bg-[#F1F1F1] transition-colors">
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-[#232F3E] truncate">{job.title}</p>
                        <p className="text-xs text-[#565A5C] mt-0.5">{job.company} · {job.category}</p>
                        <p className="text-xs text-[#565A5C]">{formatBudget(job.budget)} · {job.submittedAt}</p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <button
                          onClick={() => setPreviewJob(job)}
                          className="p-1.5 text-[#565A5C] hover:text-[#146EB4] hover:bg-blue-50 rounded transition-colors"
                          title="Preview"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleApprove(job.id)}
                          className="p-1.5 text-[#12A54D] hover:bg-green-50 rounded transition-colors"
                          title="Setujui"
                        >
                          <CheckCircle className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleReject(job.id)}
                          className="p-1.5 text-[#DC2C1E] hover:bg-red-50 rounded transition-colors"
                          title="Tolak"
                        >
                          <XCircle className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Moderation Panel — Events */}
            <div className="bg-white border border-[#E7E7E7] rounded-lg">
              <div className="flex items-center justify-between px-6 py-4 border-b border-[#E7E7E7]">
                <h2 className="font-bold text-[#232F3E]">Event Menunggu Review</h2>
                <span className="text-xs bg-orange-100 text-orange-700 font-bold px-2.5 py-1 rounded-full">
                  {pendingEvents.length} pending
                </span>
              </div>

              {pendingEvents.length === 0 ? (
                <div className="p-12 text-center">
                  <CheckCircle className="w-10 h-10 text-[#12A54D] mx-auto mb-3" />
                  <p className="font-semibold text-[#232F3E]">Semua event sudah diproses!</p>
                  <p className="text-sm text-[#565A5C] mt-1">Tidak ada yang perlu di-review.</p>
                </div>
              ) : (
                <div className="divide-y divide-[#E7E7E7]">
                  {pendingEvents.map((ev) => (
                    <div key={ev.id} className="flex items-center gap-4 px-6 py-4 hover:bg-[#F1F1F1] transition-colors">
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-[#232F3E] truncate">{ev.title}</p>
                        <p className="text-xs text-[#565A5C] mt-0.5">{ev.organizerName} · {ev.locationName}</p>
                        <p className="text-xs text-[#565A5C]">{ev.eventDate} · Diajukan {ev.submittedAt}</p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <button
                          onClick={() => handleApproveEvent(ev.id)}
                          className="p-1.5 text-[#12A54D] hover:bg-green-50 rounded transition-colors"
                          title="Setujui"
                        >
                          <CheckCircle className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleRejectEvent(ev.id)}
                          className="p-1.5 text-[#DC2C1E] hover:bg-red-50 rounded transition-colors"
                          title="Tolak"
                        >
                          <XCircle className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Recent activity */}
          <div className="bg-white border border-[#E7E7E7] rounded-lg">
            <div className="px-5 py-4 border-b border-[#E7E7E7]">
              <h2 className="font-bold text-[#232F3E]">Aktivitas Terbaru</h2>
            </div>
            <div className="divide-y divide-[#E7E7E7]">
              {MOCK_RECENT_ACTIVITY.map((a) => (
                <div key={a.id} className="flex items-start gap-3 px-5 py-3.5">
                  <span className="text-lg flex-shrink-0">{a.icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-[#232F3E] leading-snug">{a.message}</p>
                    <p className="text-xs text-[#565A5C] mt-0.5">{a.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Quick stats bottom */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
          {[
            { title: "Distribusi Skill",       items: [["React/Next.js","34%"],["Design","22%"],["Content","18%"],["Mobile","14%"],["Lainnya","12%"]] },
            { title: "Kategori Lowongan Aktif", items: [["Web Development","3"],["UI/UX Design","2"],["Content Writing","1"],["Social Media","1"],["Lainnya","1"]] },
            { title: "Event Bulan Ini",         items: [["Workshop","3"],["Meetup","1"],["Coffee Chat","1"],["Networking","1"]] },
          ].map((card) => (
            <div key={card.title} className="bg-white border border-[#E7E7E7] rounded-lg p-5">
              <h3 className="font-bold text-[#232F3E] mb-4 text-sm">{card.title}</h3>
              <div className="space-y-2.5">
                {card.items.map(([label, val]) => (
                  <div key={label} className="flex items-center justify-between">
                    <span className="text-xs text-[#565A5C] truncate flex-1">{label}</span>
                    <span className="text-xs font-bold text-[#232F3E] ml-2">{val}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Job preview modal */}
      <Modal
        isOpen={!!previewJob}
        onClose={() => setPreviewJob(null)}
        title="Review Lowongan"
        size="md"
        footer={
          previewJob && (
            <>
              <Button variant="danger" onClick={() => handleReject(previewJob.id)}>
                <XCircle className="w-4 h-4" /> Tolak
              </Button>
              <Button onClick={() => handleApprove(previewJob.id)}>
                <CheckCircle className="w-4 h-4" /> Setujui & Publikasikan
              </Button>
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
                <p className="text-sm text-[#232F3E]">{previewJob.company}</p>
              </div>
              <div>
                <p className="text-xs text-[#565A5C] font-bold mb-1">KATEGORI</p>
                <p className="text-sm text-[#232F3E]">{previewJob.category}</p>
              </div>
              <div>
                <p className="text-xs text-[#565A5C] font-bold mb-1">BUDGET</p>
                <p className="text-sm font-semibold text-[#12A54D]">{formatBudget(previewJob.budget)}</p>
              </div>
              <div>
                <p className="text-xs text-[#565A5C] font-bold mb-1">KONTAK</p>
                <p className="text-sm text-[#232F3E]">{previewJob.contactEmail}</p>
              </div>
            </div>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <p className="text-xs text-yellow-800">
                ⚠️ Pastikan tidak ada konten spam, budget masuk akal, dan kontak valid sebelum menyetujui.
              </p>
            </div>
          </div>
        )}
      </Modal>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </>
  );
}
