"use client";
import { useState, useRef, useEffect, useCallback } from "react";
import { Search, Bell, Menu, X, MessageCircle } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { clsx } from "clsx";
import { useAuth, type User } from "../../context/AuthContext";
import { notificationsApi, type Notification } from "../../lib/notifications.api";
import { chatApi } from "../../lib/chat.api";
import { assetUrl } from "../../lib/api";

const GUEST_NAV_LINKS = [
  { href: "/jobs",     label: "Lowongan" },
  { href: "/events",   label: "Events" },
  { href: "/passport", label: "Panduan" },
];

const FREELANCER_NAV_LINKS = [
  { href: "/jobs",     label: "Lowongan" },
  { href: "/events",   label: "Events" },
  { href: "/passport", label: "Panduan" },
];

const RECRUITER_NAV_LINKS = [
  { href: "/employer",            label: "Lowongan" },
  { href: "/employer/events",     label: "Events" },
  { href: "/employer/applicants", label: "Pendaftar" },
];

const ADMIN_NAV_LINKS = [
  { href: "/admin", label: "Admin Panel" },
];

function getNavLinks(role?: User["role"]) {
  if (role === "admin") return ADMIN_NAV_LINKS;
  if (role === "employer" || role === "event_organizer") return RECRUITER_NAV_LINKS;
  if (!role) return GUEST_NAV_LINKS;
  return FREELANCER_NAV_LINKS;
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Baru saja";
  if (mins < 60) return `${mins} menit lalu`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} jam lalu`;
  const days = Math.floor(hours / 24);
  return `${days} hari lalu`;
}

export default function Header() {
  const { user } = useAuth();
  const [menuOpen,   setMenuOpen]   = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [notifOpen,  setNotifOpen]  = useState(false);
  const [notifClosing, setNotifClosing] = useState(false);
  const [search,     setSearch]     = useState("");
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadChats, setUnreadChats] = useState(0);
  const pathname  = usePathname();
  const inputRef  = useRef<HTMLInputElement>(null);
  const notifRef  = useRef<HTMLDivElement>(null);
  const navLinks = getNavLinks(user?.role);

  // Hanya link paling spesifik yang di-highlight, agar "/employer"
  // tidak ikut aktif saat berada di "/employer/events"
  const activeHref = navLinks
    .filter((l) => pathname === l.href || pathname.startsWith(l.href + "/"))
    .sort((a, b) => b.href.length - a.href.length)[0]?.href;

  const fetchNotifications = useCallback(async () => {
    if (!user) return;
    try {
      const res = await notificationsApi.getAll();
      setNotifications(res.data.rows);
    } catch {
      setNotifications([]);
    }
  }, [user]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // Jumlah pesan chat belum dibaca — refresh tiap 30 detik
  useEffect(() => {
    if (!user) return;
    let active = true;
    const load = async () => {
      try {
        const rows = await chatApi.conversations();
        if (active) setUnreadChats(rows.reduce((sum, c) => sum + (Number(c.unread_count) || 0), 0));
      } catch {
        if (active) setUnreadChats(0);
      }
    };
    load();
    const t = setInterval(load, 30000);
    return () => { active = false; clearInterval(t); };
  }, [user, pathname]);

  const handleMarkRead = async (id: string) => {
    try {
      await notificationsApi.markRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
    } catch {}
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationsApi.markAllRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    } catch {}
  };

  useEffect(() => {
    if (searchOpen) inputRef.current?.focus();
  }, [searchOpen]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setNotifClosing(true);
        setTimeout(() => {
          setNotifOpen(false);
          setNotifClosing(false);
        }, 200);
      }
    }
    if (notifOpen && !notifClosing) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [notifOpen, notifClosing]);

  return (
    <header className="sticky top-0 z-40 shadow-md bg-white">
      {/* Top bar */}
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-6">

        {/* Logo */}
        <Link href="/" className="flex items-center flex-shrink-0">
          <Image src="/logo.png" alt="JogjaFreelance" width={150} height={36} className="object-contain" style={{ mixBlendMode: "multiply" }} />
        </Link>

        {/* Nav links — kiri, desktop */}
        <nav className="hidden md:flex items-center gap-6">
          {navLinks.map((l) => {
            const isActive = l.href === activeHref;
            return (
              <Link
                key={l.href}
                href={l.href}
                className={clsx(
                  "text-sm transition-colors relative whitespace-nowrap",
                  isActive
                    ? "text-[#D64545] font-semibold after:absolute after:bottom-[-4px] after:left-0 after:w-full after:h-[2px] after:bg-[#D64545] after:rounded-full"
                    : "text-[#1E1B2E] hover:text-[#D64545]"
                )}
              >
                {l.label}
              </Link>
            );
          })}
        </nav>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Search bar expandable */}
        <div className="hidden sm:flex items-center">
          <div
            className="flex items-center overflow-hidden transition-all duration-300"
            style={{ width: searchOpen ? 220 : 0, opacity: searchOpen ? 1 : 0 }}
          >
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#565A5C]" />
              <input
                ref={inputRef}
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cari lowongan, skill, event..."
                className="w-full pl-9 pr-4 py-2 text-sm border border-[#E0E0E0] rounded-lg bg-[#F8F8F8] text-[#232F3E] placeholder:text-[#999] focus:outline-none focus:border-[#D64545] focus:ring-2 focus:ring-[#D64545]/10"
              />
            </div>
          </div>
          <button
            onClick={() => {
              if (searchOpen) {
                setSearchOpen(false);
                setSearch("");
              } else {
                setSearchOpen(true);
              }
            }}
            className="p-1.5 hover:bg-[#F0F0F0] rounded transition-colors ml-1"
            aria-label="Toggle search"
          >
            {searchOpen
              ? <X className="w-5 h-5 text-[#1E1B2E]" />
              : <Search className="w-5 h-5 text-[#1E1B2E]" />
            }
          </button>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {user && (
            <Link
              href="/chat"
              className="relative p-1.5 hover:bg-[#F0F0F0] rounded transition-colors"
              aria-label="Chat"
              title="Chat"
            >
              <MessageCircle className="w-5 h-5 text-[#1E1B2E]" />
              {unreadChats > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 bg-[#D64545] text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                  {unreadChats > 9 ? "9+" : unreadChats}
                </span>
              )}
            </Link>
          )}
          {user && (
          <div className="relative" ref={notifRef}>
            <button
              onClick={() => setNotifOpen((v) => !v)}
              className="relative p-1.5 hover:bg-[#F0F0F0] rounded transition-colors"
              aria-label="Notifikasi"
            >
              <Bell className="w-5 h-5 text-[#1E1B2E]" />
              {notifications.some((n) => !n.is_read) && (
                <span className="absolute top-0.5 right-0.5 w-2 h-2 bg-[#D64545] rounded-full" />
              )}
            </button>

            {/* Notification dropdown */}
            {notifOpen && (
              <div
                className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl border border-[#E7E7E7] z-50 overflow-hidden"
                style={{
                  animation: notifClosing
                    ? "notif-dropup 200ms cubic-bezier(0.34, 1.56, 0.64, 1) forwards"
                    : "notif-dropdown 300ms cubic-bezier(0.34, 1.56, 0.64, 1) forwards",
                }}
              >
                <div className="p-4 border-b border-[#E7E7E7] flex items-center justify-between bg-[#F8F8F8]">
                  <h3 className="font-semibold text-[#232F3E]">Notifikasi</h3>
                  <button
                    onClick={() => {
                      setNotifClosing(true);
                      setTimeout(() => {
                        setNotifOpen(false);
                        setNotifClosing(false);
                      }, 200);
                    }}
                    className="text-[#565A5C] hover:text-[#232F3E]"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="max-h-96 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="p-8 text-center text-sm text-[#565A5C]">
                      Belum ada notifikasi
                    </div>
                  ) : (
                    notifications.map((notif) => (
                      <div
                        key={notif.id}
                        onClick={() => !notif.is_read && handleMarkRead(notif.id)}
                        className={`p-4 border-b border-[#E7E7E7] hover:bg-[#F8F8F8] transition-colors cursor-pointer ${
                          !notif.is_read ? "bg-blue-50" : ""
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div
                            className={`w-2 h-2 rounded-full flex-shrink-0 mt-2 ${
                              !notif.is_read ? "bg-[#D64545]" : "bg-transparent"
                            }`}
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold text-[#D64545] mb-0.5">{notif.title}</p>
                            <p className="text-sm text-[#232F3E] line-clamp-2">{notif.message}</p>
                            <p className="text-xs text-[#565A5C] mt-1">{timeAgo(notif.created_at)}</p>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <div className="p-3 border-t border-[#E7E7E7] bg-[#F8F8F8] flex items-center gap-2">
                  <button
                    onClick={handleMarkAllRead}
                    className="flex-1 text-center text-sm text-[#DC3545] font-semibold hover:text-[#C23B3B] py-2"
                  >
                    Tandai semua dibaca
                  </button>
                  <Link
                    href="/notifications"
                    onClick={() => setNotifOpen(false)}
                    className="flex-1 text-center text-sm text-[#146EB4] font-semibold hover:underline py-2"
                  >
                    Lihat semua
                  </Link>
                </div>
              </div>
            )}
          </div>
          )}

          {/* Avatar → langsung ke halaman profil */}
          {user ? (
            <Link
              href="/profile"
              className="flex-shrink-0 w-8 h-8 rounded-full border-2 border-[#D64545] hover:border-[#C23B3B] transition-colors bg-[#D64545] flex items-center justify-center text-white text-xs font-bold overflow-hidden"
              title={user.name}
            >
              {user.avatar ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={assetUrl(user.avatar)} alt={user.name} className="w-full h-full object-cover" />
              ) : (
                user.name.charAt(0).toUpperCase()
              )}
            </Link>
          ) : (
            <Link
              href="/auth/login"
              className="px-4 py-2 text-sm bg-[#D64545] hover:bg-[#C23B3B] text-white rounded-lg font-semibold transition-colors whitespace-nowrap"
            >
              Masuk
            </Link>
          )}
          {/* Hamburger mobile */}
          <button
            className="md:hidden p-1.5 hover:bg-[#F0F0F0] rounded"
            onClick={() => setMenuOpen((v) => !v)}
            aria-label="Menu"
          >
            {menuOpen ? <X className="w-5 h-5 text-[#1E1B2E]" /> : <Menu className="w-5 h-5 text-[#1E1B2E]" />}
          </button>
        </div>
      </div>

      {/* Mobile nav */}
      <div
        className={clsx(
          "md:hidden bg-white overflow-hidden transition-all duration-200 border-t border-[#EAE6F5]",
          menuOpen ? "max-h-80 py-2" : "max-h-0"
        )}
      >
        {/* Mobile search */}
        <div className="px-4 pb-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#565A5C]" />
            <input
              type="text"
              placeholder="Cari lowongan atau event..."
              className="w-full pl-9 pr-4 py-2 text-sm rounded-lg border border-[#E0E0E0] bg-[#F8F8F8] text-[#232F3E] placeholder:text-[#999] focus:outline-none"
            />
          </div>
        </div>
        {navLinks.map((l) => {
          const isActive = l.href === activeHref;
          return (
            <Link
              key={l.href}
              href={l.href}
              onClick={() => setMenuOpen(false)}
              className={clsx(
                "block px-4 py-3 text-sm transition-colors",
                isActive
                  ? "text-[#D64545] font-semibold bg-[#FFF5F5] border-l-2 border-[#D64545]"
                  : "text-[#1E1B2E] hover:bg-[#F5F5F5]"
              )}
            >
              {l.label}
            </Link>
          );
        })}
      </div>

      <style>{`
        @keyframes notif-dropdown {
          from {
            opacity: 0;
            transform: translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes notif-dropup {
          from {
            opacity: 1;
            transform: translateY(0);
          }
          to {
            opacity: 0;
            transform: translateY(-20px);
          }
        }
      `}</style>
    </header>
  );
}
