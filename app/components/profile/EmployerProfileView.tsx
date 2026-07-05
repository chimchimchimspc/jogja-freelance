"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  MapPin, Globe, Briefcase, Users, Calendar, Building2, LogOut, Loader2, PlusCircle,
} from "lucide-react";
import { profileApi, type ApiEmployerProfile } from "../../lib/profile.api";
import { assetUrl } from "../../lib/api";
import { useAuth } from "../../context/AuthContext";

export default function EmployerProfileView() {
  const router = useRouter();
  const { logout } = useAuth();
  const [profile, setProfile] = useState<ApiEmployerProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await profileApi.getOwnEmployer();
        setProfile(res.data);
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : "Gagal memuat profil");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleLogout = () => {
    logout();
    router.push("/auth/login");
  };

  if (loading) {
    return (
      <main className="flex-1 bg-[#F1F1F1] flex items-center justify-center py-24">
        <Loader2 className="w-8 h-8 animate-spin text-[#D64545]" />
      </main>
    );
  }

  if (error || !profile) {
    return (
      <main className="flex-1 bg-[#F1F1F1] flex items-center justify-center py-24">
        <div className="text-center">
          <p className="text-[#DC2C1E] mb-4">{error ?? "Profil tidak ditemukan"}</p>
          <button onClick={() => window.location.reload()}
            className="text-sm text-[#146EB4] hover:underline">Coba lagi</button>
        </div>
      </main>
    );
  }

  const joinDate = profile.created_at
    ? new Date(profile.created_at).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })
    : "-";

  return (
    <main className="flex-1 bg-[#F1F1F1]">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Kartu utama */}
        <div className="bg-white border border-[#E7E7E7] rounded-lg p-6 sm:p-8">
          <div className="flex items-start justify-between gap-4 mb-6">
            <div className="flex items-start gap-4 flex-1">
              {/* Logo perusahaan */}
              <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-2xl bg-[#D64545] flex items-center justify-center text-4xl sm:text-5xl font-bold text-white flex-shrink-0 border-4 border-white shadow-lg overflow-hidden">
                {profile.company_logo_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={assetUrl(profile.company_logo_url)} alt={profile.company_name} className="w-full h-full object-cover" />
                ) : (
                  <Building2 className="w-12 h-12" />
                )}
              </div>

              <div className="flex-1 pt-2">
                <h1 className="text-2xl sm:text-3xl font-bold text-[#232F3E] mb-1">
                  {profile.company_name}
                </h1>
                <p className="text-sm text-[#565A5C] mb-2">
                  Penanggung jawab: <span className="font-semibold">{profile.full_name}</span>
                </p>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-[#565A5C]">
                  <span className="flex items-center gap-1.5">
                    <MapPin className="w-4 h-4" />
                    {profile.location || profile.city || "Yogyakarta"}
                  </span>
                  {profile.industry && (
                    <span className="flex items-center gap-1.5">
                      <Briefcase className="w-4 h-4" />
                      {profile.industry}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Tombol aksi */}
            <div className="flex flex-col gap-2 flex-shrink-0">
              <Link
                href="/profile/edit"
                className="inline-flex items-center justify-center px-3 py-1.5 text-sm bg-[#F1F1F1] hover:bg-[#E7E7E7] text-[#232F3E] rounded-lg font-semibold transition-colors"
              >
                Edit Profil
              </Link>
              <button
                onClick={handleLogout}
                className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-sm bg-red-50 hover:bg-red-100 text-[#DC3545] border border-red-200 rounded-lg font-semibold transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Keluar
              </button>
            </div>
          </div>

          {/* Deskripsi */}
          {profile.company_description ? (
            <p className="text-sm text-[#232F3E] leading-relaxed max-w-2xl mb-6">
              {profile.company_description}
            </p>
          ) : (
            <p className="text-sm text-[#999] italic mb-6">
              Belum ada deskripsi perusahaan.{" "}
              <Link href="/profile/edit" className="text-[#146EB4] hover:underline not-italic">
                Tambahkan sekarang
              </Link>
            </p>
          )}

          {/* Statistik */}
          <div className="grid grid-cols-3 gap-4 py-5 border-y border-[#E7E7E7]">
            {[
              { icon: Briefcase, label: "Lowongan Diposting", value: profile.total_jobs_posted ?? 0 },
              { icon: Users, label: "Freelancer Direkrut", value: profile.total_hired ?? 0 },
              { icon: Calendar, label: "Bergabung", value: joinDate, sm: true },
            ].map((s) => (
              <div key={s.label} className="text-center">
                <div className="flex items-center justify-center gap-1.5 mb-1">
                  <s.icon className="w-4 h-4 text-[#E8B4D1]" />
                  <span className="text-xs text-[#565A5C]">{s.label}</span>
                </div>
                <p className={`font-bold text-[#232F3E] ${s.sm ? "text-sm" : "text-xl"}`}>{s.value}</p>
              </div>
            ))}
          </div>

          {/* Website */}
          <div className="mt-5">
            <h3 className="text-sm font-bold text-[#232F3E] mb-2">Website</h3>
            {profile.website_url ? (
              <a
                href={profile.website_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-sm text-[#146EB4] hover:underline font-semibold"
              >
                <Globe className="w-4 h-4" />
                {profile.website_url}
              </a>
            ) : (
              <p className="text-xs text-[#565A5C]">Belum ada website</p>
            )}
          </div>
        </div>

        {/* Aksi cepat */}
        <div className="bg-[#D64545] text-white rounded-lg p-6 mt-6 text-center">
          <h3 className="text-lg font-bold mb-2">Kelola Lowongan & Event Anda</h3>
          <p className="text-white/80 text-sm mb-4">
            Pasang lowongan baru, buat event komunitas, dan lihat pendaftar dari dashboard employer.
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            <Link href="/employer" className="inline-flex items-center gap-1.5 px-4 py-2 bg-white text-[#232F3E] rounded-lg font-semibold text-sm hover:bg-[#F1F1F1] transition-colors">
              <Briefcase className="w-4 h-4" />
              Dashboard Employer
            </Link>
            <Link href="/employer/post-job" className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#D64545] hover:bg-[#C23B3B] text-white rounded-lg font-semibold text-sm transition-colors">
              <PlusCircle className="w-4 h-4" />
              Pasang Lowongan
            </Link>
            <Link href="/employer/events" className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#D64545] hover:bg-[#C23B3B] text-white rounded-lg font-semibold text-sm transition-colors">
              <Calendar className="w-4 h-4" />
              Kelola Event
            </Link>
            <Link href="/employer/applicants" className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#D64545] hover:bg-[#C23B3B] text-white rounded-lg font-semibold text-sm transition-colors">
              <Users className="w-4 h-4" />
              Lihat Pendaftar
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
