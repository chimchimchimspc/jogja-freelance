"use client";
import { useState, useEffect, useCallback } from "react";
import { Search, CheckCircle, XCircle, Eye, Loader2, ChevronLeft, ChevronRight } from "lucide-react";
import Badge from "../../components/ui/Badge";
import Button from "../../components/ui/Button";
import Modal from "../../components/ui/Modal";
import Toast from "../../components/ui/Toast";
import { Textarea } from "../../components/ui/Input";
import { adminApi, type ApiAdminEvent } from "../../lib/admin.api";

type StatusFilter = "" | "pending_review" | "active" | "rejected";

const TABS: { key: StatusFilter; label: string }[] = [
  { key: "",               label: "Semua" },
  { key: "pending_review", label: "Pending" },
  { key: "active",         label: "Aktif" },
  { key: "rejected",       label: "Ditolak" },
];

const STATUS_BADGE: Record<ApiAdminEvent["status"], { label: string; color: "blue" | "orange" | "green" | "red" | "gray" }> = {
  pending_review: { label: "Pending", color: "orange" },
  active:         { label: "Aktif",   color: "green" },
  rejected:       { label: "Ditolak", color: "red" },
};

const TYPE_LABEL: Record<string, string> = {
  workshop: "Workshop",
  meetup: "Meetup",
  coffee_chat: "Coffee Chat",
  networking: "Networking",
};

const LIMIT = 15;

export default function AdminEventsPage() {
  const [status, setStatus] = useState<StatusFilter>("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [events, setEvents] = useState<ApiAdminEvent[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [previewEvent, setPreviewEvent] = useState<ApiAdminEvent | null>(null);
  const [rejectEvent, setRejectEvent] = useState<ApiAdminEvent | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const loadEvents = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminApi.listEvents({ page, limit: LIMIT, status: status || undefined, search: search || undefined });
      setEvents(res.data);
      setTotal(res.pagination.total);
    } catch (err: unknown) {
      setToast({ message: err instanceof Error ? err.message : "Gagal memuat event.", type: "error" });
    } finally {
      setLoading(false);
    }
  }, [page, status, search]);

  useEffect(() => {
    const t = setTimeout(loadEvents, 300);
    return () => clearTimeout(t);
  }, [loadEvents]);

  const handleApprove = async (id: string) => {
    try {
      await adminApi.approveEvent(id);
      setToast({ message: "Event disetujui dan dipublikasikan.", type: "success" });
      setPreviewEvent(null);
      loadEvents();
    } catch (err: unknown) {
      setToast({ message: err instanceof Error ? err.message : "Gagal menyetujui event.", type: "error" });
    }
  };

  const handleReject = async () => {
    if (!rejectEvent) return;
    try {
      await adminApi.rejectEvent(rejectEvent.id, rejectReason || undefined);
      setToast({ message: "Event ditolak.", type: "error" });
      setRejectEvent(null);
      setRejectReason("");
      setPreviewEvent(null);
      loadEvents();
    } catch (err: unknown) {
      setToast({ message: err instanceof Error ? err.message : "Gagal menolak event.", type: "error" });
    }
  };

  const totalPages = Math.max(1, Math.ceil(total / LIMIT));

  return (
    <>
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-[#232F3E]">Kelola Events</h1>
          <p className="text-sm text-[#565A5C]">Tinjau, setujui, atau tolak event yang diajukan organizer</p>
        </div>

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
              placeholder="Cari judul event..."
              className="w-full pl-9 pr-4 py-2.5 text-sm border border-[#CCCCCC] rounded-lg bg-white focus:outline-none focus:border-[#146EB4]"
            />
          </div>
        </div>

        <div className="bg-white border border-[#E7E7E7] rounded-lg">
          {loading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="w-7 h-7 animate-spin text-[#D64545]" />
            </div>
          ) : events.length === 0 ? (
            <div className="p-16 text-center text-sm text-[#565A5C]">Tidak ada event untuk filter ini.</div>
          ) : (
            <div className="divide-y divide-[#E7E7E7]">
              {events.map((ev) => {
                const badge = STATUS_BADGE[ev.status];
                return (
                  <div key={ev.id} className="flex items-center gap-4 px-6 py-4 hover:bg-[#F8F8F8] transition-colors">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-[#232F3E] truncate">{ev.title}</p>
                        <Badge label={badge.label} color={badge.color} />
                      </div>
                      <p className="text-xs text-[#565A5C] mt-0.5">
                        {TYPE_LABEL[ev.type] || ev.type} · {ev.organizer_name || "—"} · {ev.location_name || "—"}
                      </p>
                      <p className="text-xs text-[#565A5C]">
                        {new Date(ev.event_date).toLocaleDateString("id-ID")} · Diajukan {new Date(ev.created_at).toLocaleDateString("id-ID")}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button
                        onClick={() => setPreviewEvent(ev)}
                        className="p-1.5 text-[#565A5C] hover:text-[#146EB4] hover:bg-blue-50 rounded transition-colors"
                        title="Detail"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      {ev.status === "pending_review" && (
                        <>
                          <button
                            onClick={() => handleApprove(ev.id)}
                            className="p-1.5 text-[#12A54D] hover:bg-green-50 rounded transition-colors"
                            title="Setujui"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setRejectEvent(ev)}
                            className="p-1.5 text-[#DC2C1E] hover:bg-red-50 rounded transition-colors"
                            title="Tolak"
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-4 text-sm text-[#565A5C]">
            <span>Halaman {page} dari {totalPages} · {total} event</span>
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

      <Modal
        isOpen={!!previewEvent}
        onClose={() => setPreviewEvent(null)}
        title="Detail Event"
        size="md"
        footer={
          previewEvent?.status === "pending_review" && (
            <>
              <Button variant="danger" onClick={() => setRejectEvent(previewEvent)}>
                <XCircle className="w-4 h-4" /> Tolak
              </Button>
              <Button onClick={() => handleApprove(previewEvent.id)}>
                <CheckCircle className="w-4 h-4" /> Setujui & Publikasikan
              </Button>
            </>
          )
        }
      >
        {previewEvent && (
          <div className="space-y-4">
            <div>
              <p className="text-xs text-[#565A5C] font-bold mb-1">JUDUL</p>
              <p className="font-semibold text-[#232F3E]">{previewEvent.title}</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-[#565A5C] font-bold mb-1">TIPE</p>
                <p className="text-sm text-[#232F3E]">{TYPE_LABEL[previewEvent.type] || previewEvent.type}</p>
              </div>
              <div>
                <p className="text-xs text-[#565A5C] font-bold mb-1">TANGGAL</p>
                <p className="text-sm text-[#232F3E]">{new Date(previewEvent.event_date).toLocaleDateString("id-ID")} {previewEvent.event_time}</p>
              </div>
              <div>
                <p className="text-xs text-[#565A5C] font-bold mb-1">ORGANIZER</p>
                <p className="text-sm text-[#232F3E]">{previewEvent.organizer_name || "—"}</p>
              </div>
              <div>
                <p className="text-xs text-[#565A5C] font-bold mb-1">KONTAK</p>
                <p className="text-sm text-[#232F3E]">{previewEvent.organizer_email || "—"}</p>
              </div>
              <div className="col-span-2">
                <p className="text-xs text-[#565A5C] font-bold mb-1">LOKASI</p>
                <p className="text-sm text-[#232F3E]">{previewEvent.location_name || "—"}</p>
              </div>
            </div>
            {previewEvent.admin_notes && (
              <div>
                <p className="text-xs text-[#565A5C] font-bold mb-1">CATATAN ADMIN</p>
                <p className="text-sm text-[#232F3E] bg-[#F1F1F1] rounded p-3">{previewEvent.admin_notes}</p>
              </div>
            )}
          </div>
        )}
      </Modal>

      <Modal
        isOpen={!!rejectEvent}
        onClose={() => { setRejectEvent(null); setRejectReason(""); }}
        title="Tolak Event"
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => { setRejectEvent(null); setRejectReason(""); }}>Batal</Button>
            <Button variant="danger" onClick={handleReject}>Tolak Event</Button>
          </>
        }
      >
        <p className="text-sm text-[#565A5C] mb-3">
          Berikan alasan penolakan untuk <strong>{rejectEvent?.title}</strong> (opsional, akan dikirim ke organizer).
        </p>
        <Textarea
          value={rejectReason}
          onChange={(e) => setRejectReason(e.target.value)}
          placeholder="Contoh: Lokasi tidak jelas, deskripsi tidak lengkap..."
          rows={3}
        />
      </Modal>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </>
  );
}
