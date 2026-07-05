"use client";
import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Bell, FileText, CheckCircle, Briefcase, Calendar, Award,
  MailOpen, Trash2, Inbox, Loader2, ExternalLink, Clock,
} from "lucide-react";
import Link from "next/link";
import Header from "../components/layout/Header";
import Footer from "../components/layout/Footer";
import Modal from "../components/ui/Modal";
import { notificationsApi, type Notification } from "../lib/notifications.api";
import { useAuth } from "../context/AuthContext";

// Ikon & warna per tipe notifikasi (mengikuti tipe dari backend)
const TYPE_STYLE: Record<string, { icon: typeof Bell; cls: string }> = {
  application_update: { icon: FileText,    cls: "bg-blue-50 text-blue-600" },
  application:        { icon: FileText,    cls: "bg-blue-50 text-blue-600" },
  accepted:           { icon: CheckCircle, cls: "bg-green-50 text-green-600" },
  new_job:            { icon: Briefcase,   cls: "bg-purple-50 text-purple-600" },
  job_match:          { icon: Briefcase,   cls: "bg-purple-50 text-purple-600" },
  event:              { icon: Calendar,    cls: "bg-orange-50 text-orange-600" },
  event_reminder:     { icon: Calendar,    cls: "bg-orange-50 text-orange-600" },
  badge:              { icon: Award,       cls: "bg-yellow-50 text-yellow-600" },
};
const DEFAULT_STYLE = { icon: Bell, cls: "bg-gray-100 text-gray-600" };

// Label tipe untuk detail
const TYPE_LABEL: Record<string, string> = {
  application_update: "Update Lamaran",
  job_approved:       "Lowongan Disetujui",
  event_approved:     "Event Disetujui",
  badge_earned:       "Badge Baru",
  job_match:          "Lowongan Cocok Untukmu",
};

// Tujuan link berdasarkan related_type
function relatedLink(n: Notification): { href: string; label: string } | null {
  if (n.related_type === "job" && n.related_id)   return { href: `/jobs/${n.related_id}`,   label: "Lihat Lowongan" };
  if (n.related_type === "event" && n.related_id) return { href: `/events/${n.related_id}`, label: "Lihat Event" };
  if (n.related_type === "application")           return { href: "/jobs/applications",      label: "Lihat Lamaranku" };
  if (n.related_type === "badge")                 return { href: "/profile",                label: "Lihat Badge Saya" };
  return null;
}

function fmtFullDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("id-ID", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  }) + " · " + new Date(dateStr).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
}

type Filter = "semua" | "belum" | "sudah";

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Baru saja";
  if (mins < 60) return `${mins} menit lalu`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} jam lalu`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} hari lalu`;
  return new Date(dateStr).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
}

export default function NotificationsPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [filter, setFilter] = useState<Filter>("semua");
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Notification | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push("/auth/login?redirect=/notifications");
      return;
    }
    (async () => {
      try {
        const res = await notificationsApi.getAll();
        setNotifications(res.data.rows);
      } catch {
        setNotifications([]);
      } finally {
        setLoading(false);
      }
    })();
  }, [user, authLoading, router]);

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const filtered = useMemo(() => {
    if (filter === "belum") return notifications.filter((n) => !n.is_read);
    if (filter === "sudah") return notifications.filter((n) => n.is_read);
    return notifications;
  }, [notifications, filter]);

  const handleMarkRead = async (id: string) => {
    try {
      await notificationsApi.markRead(id);
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)));
    } catch {}
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationsApi.markAllRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    } catch {}
  };

  const handleDelete = async (id: string) => {
    try {
      await notificationsApi.delete(id);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    } catch {}
  };

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
        <div className="bg-white border-b border-[#EAE6F5] py-8">
          <div className="max-w-3xl mx-auto px-4 flex items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <Bell className="w-6 h-6 text-[#D64545]" />
                <h1 className="text-2xl sm:text-3xl font-bold text-[#1E1B2E]">Notifikasi</h1>
              </div>
              <p className="text-sm text-[#6B6880]">
                {unreadCount > 0 ? `${unreadCount} notifikasi belum dibaca` : "Semua notifikasi sudah dibaca"}
              </p>
            </div>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="flex items-center gap-2 text-sm font-semibold text-[#D64545] hover:text-[#C23B3B] transition-colors flex-shrink-0"
              >
                <MailOpen className="w-4 h-4" />
                Tandai semua dibaca
              </button>
            )}
          </div>
        </div>

        <div className="max-w-3xl mx-auto px-4 py-6">
          {/* Filter */}
          <div className="flex gap-2 bg-white border border-[#EAE6F5] rounded-lg p-1 mb-6 w-fit">
            {([
              { key: "semua", label: `Semua (${notifications.length})` },
              { key: "belum", label: `Belum Dibaca (${unreadCount})` },
              { key: "sudah", label: `Sudah Dibaca (${notifications.length - unreadCount})` },
            ] as { key: Filter; label: string }[]).map((f) => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={`px-4 py-2 text-sm font-semibold rounded transition-colors ${
                  filter === f.key ? "bg-[#D64545] text-white" : "text-[#6B6880] hover:bg-[#F8F6FF]"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* List */}
          {filtered.length === 0 ? (
            <div className="bg-white border border-[#EAE6F5] rounded-xl p-16 text-center">
              <Inbox className="w-10 h-10 text-[#D5D0E8] mx-auto mb-3" />
              <h3 className="font-bold text-[#1E1B2E] mb-1">Tidak ada notifikasi</h3>
              <p className="text-sm text-[#6B6880]">
                {filter === "belum" ? "Semua notifikasi sudah dibaca 🎉" : "Notifikasi akan muncul di sini"}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {filtered.map((n) => {
                const style = TYPE_STYLE[n.type] ?? DEFAULT_STYLE;
                const Icon = style.icon;
                return (
                  <div
                    key={n.id}
                    onClick={() => {
                      setSelected(n);
                      if (!n.is_read) handleMarkRead(n.id);
                    }}
                    className={`bg-white border rounded-xl p-4 flex items-start gap-3 transition-all group cursor-pointer ${
                      !n.is_read
                        ? "border-[#D64545]/30 shadow-sm hover:border-[#D64545]"
                        : "border-[#EAE6F5] opacity-80 hover:opacity-100 hover:border-[#D5D0E8]"
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${style.cls}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-bold text-[#1E1B2E]">{n.title}</p>
                        {!n.is_read && <span className="w-2 h-2 bg-[#D64545] rounded-full flex-shrink-0" />}
                      </div>
                      <p className="text-sm text-[#6B6880] mt-0.5 break-words line-clamp-2">{n.message}</p>
                      <p className="text-xs text-[#9B96AD] mt-1">
                        {timeAgo(n.created_at)} · <span className="text-[#146EB4]">Klik untuk detail</span>
                      </p>
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDelete(n.id); }}
                      className="p-1.5 rounded-lg text-[#CCC] hover:text-[#D64545] hover:bg-[#FFF5F5] transition-colors opacity-0 group-hover:opacity-100"
                      aria-label="Hapus notifikasi"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
      <Footer />

      {/* Detail notifikasi */}
      <Modal
        isOpen={!!selected}
        onClose={() => setSelected(null)}
        title="Detail Notifikasi"
        size="md"
      >
        {selected && (() => {
          const style = TYPE_STYLE[selected.type] ?? DEFAULT_STYLE;
          const Icon = style.icon;
          const link = relatedLink(selected);
          return (
            <div>
              <div className="flex items-start gap-3 mb-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${style.cls}`}>
                  <Icon className="w-6 h-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-[#D64545] uppercase mb-0.5">
                    {TYPE_LABEL[selected.type] ?? "Notifikasi"}
                  </p>
                  <h3 className="text-lg font-bold text-[#1E1B2E]">{selected.title}</h3>
                </div>
              </div>

              <p className="text-sm text-[#232F3E] leading-relaxed bg-[#F8F6FF] rounded-lg p-4 mb-4 break-words whitespace-pre-line">
                {selected.message}
              </p>

              <div className="flex items-center gap-2 text-xs text-[#6B6880] mb-5">
                <Clock className="w-3.5 h-3.5" />
                {fmtFullDate(selected.created_at)}
                <span className="mx-1">·</span>
                <span className={selected.is_read ? "text-green-600" : "text-[#D64545]"}>
                  {selected.is_read ? "✓ Sudah dibaca" : "Baru"}
                </span>
              </div>

              <div className="flex gap-2">
                {link && (
                  <Link
                    href={link.href}
                    className="flex-1 inline-flex items-center justify-center gap-2 bg-[#D64545] hover:bg-[#C23B3B] text-white font-semibold text-sm py-2.5 px-4 rounded-lg transition-colors"
                  >
                    <ExternalLink className="w-4 h-4" />
                    {link.label}
                  </Link>
                )}
                <button
                  onClick={() => { handleDelete(selected.id); setSelected(null); }}
                  className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-red-50 hover:bg-red-100 text-[#DC3545] border border-red-200 text-sm font-semibold rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4" /> Hapus
                </button>
              </div>
            </div>
          );
        })()}
      </Modal>
    </>
  );
}
