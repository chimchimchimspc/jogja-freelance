"use client";
import { LayoutDashboard, Briefcase, Users, Calendar, Award, BarChart3, Settings, LogOut, Loader2 } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "../context/AuthContext";

const NAV = [
  { href: "/admin",          icon: LayoutDashboard, label: "Dashboard" },
  { href: "/admin/jobs",     icon: Briefcase,       label: "Lowongan" },
  { href: "/admin/users",    icon: Users,           label: "Pengguna" },
  { href: "/admin/events",   icon: Calendar,        label: "Events" },
  { href: "/admin/badges",   icon: Award,           label: "Badge" },
  { href: "/admin/analytics",icon: BarChart3,       label: "Analitik" },
  { href: "/admin/settings", icon: Settings,        label: "Pengaturan" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isLoading && (!user || user.role !== "admin")) {
      router.replace("/auth/login?redirect=/admin");
    }
  }, [user, isLoading, router]);

  if (isLoading || !user || user.role !== "admin") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F1F1F1]">
        <Loader2 className="w-8 h-8 animate-spin text-[#D64545]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#F1F1F1]">
      {/* Admin top bar */}
      <header className="bg-white text-[#1E1B2E] px-6 py-3 flex items-center justify-between sticky top-0 z-40 shadow-md">
        <div className="flex items-center gap-3">
          <Link href="/admin" className="flex items-center">
            <Image src="/logo.png" alt="JogjaFreelance" width={150} height={36} className="object-contain" style={{ mixBlendMode: "multiply" }} />
          </Link>
          <span className="text-xs bg-[#D64545] text-white px-2 py-0.5 rounded font-semibold">ADMIN</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-[#6B6880]">{user.email}</span>
          <button
            onClick={() => { logout(); router.push("/"); }}
            className="flex items-center gap-1 text-sm text-[#6B6880] hover:text-[#D64545]"
          >
            <LogOut className="w-4 h-4" /> Keluar
          </button>
        </div>
      </header>

      <div className="flex flex-1">
        {/* Sidebar */}
        <aside className="w-56 bg-[#232F3E] text-white flex-shrink-0 hidden md:flex flex-col sticky top-14 h-[calc(100vh-3.5rem)]">
          <nav className="flex-1 py-4">
            {NAV.map(({ href, icon: Icon, label }) => {
              const isActive = pathname === href || (href !== "/admin" && pathname.startsWith(href + "/"));
              return (
                <Link
                  key={href}
                  href={href}
                  className={`flex items-center gap-3 px-5 py-3 text-sm transition-colors ${
                    isActive ? "bg-white/10 text-white" : "text-[#6B6880] hover:bg-white/10 hover:text-white"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {label}
                </Link>
              );
            })}
          </nav>
          <div className="p-4 border-t border-white/10">
            <Link href="/" className="text-xs text-white/40 hover:text-[#6B6880] transition-colors">
              ← Kembali ke Site
            </Link>
          </div>
        </aside>

        {/* Content */}
        <main className="flex-1 p-6 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
