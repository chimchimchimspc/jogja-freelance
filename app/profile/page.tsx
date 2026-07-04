"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Header from "../components/layout/Header";
import Footer from "../components/layout/Footer";
import ProfileHeader from "../components/profile/ProfileHeader";
import BadgeGrid from "../components/profile/BadgeGrid";
import ProgressBar from "../components/ui/ProgressBar";
import { Calendar, TrendingUp, Loader2 } from "lucide-react";
import Link from "next/link";
import { profileApi, type ApiProfile } from "../lib/profile.api";
import type { UserProfile } from "../data/profile";
import { useAuth } from "../context/AuthContext";

function adaptProfile(p: ApiProfile): UserProfile {
  return {
    id: p.id,
    name: p.full_name,
    email: "",
    city: p.city ?? "Yogyakarta",
    bio: p.bio ?? "",
    profilePicture: p.profile_picture_url,
    portfolioUrl: p.portfolio_url,
    skills: p.skills ?? [],
    verified: true,
    joinDate: p.created_at?.split("T")[0] ?? "",
    level: (p.level ?? "Bronze") as UserProfile["level"],
    earnedBadges: (p.badges ?? []).map((b) => b.name),
    passportDaysCompleted: p.passport_days_completed ?? 0,
    rating: p.rating ?? 0,
    reviewCount: p.review_count ?? 0,
    completedProjects: p.completed_projects ?? 0,
    totalEarnings: 0,
  };
}

const BADGE_MILESTONES = [5, 15, 30];

export default function ProfilePage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push("/auth/login");
      return;
    }
    (async () => {
      try {
        const res = await profileApi.getOwn();
        setProfile(adaptProfile(res.data));
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : "Gagal memuat profil");
      } finally {
        setLoading(false);
      }
    })();
  }, [user, authLoading, router]);

  if (authLoading || loading) {
    return (
      <>
        <Header />
        <main className="flex-1 bg-[#F1F1F1] flex items-center justify-center py-24">
          <Loader2 className="w-8 h-8 animate-spin text-[#D64545]" />
        </main>
        <Footer />
      </>
    );
  }

  if (error || !profile) {
    return (
      <>
        <Header />
        <main className="flex-1 bg-[#F1F1F1] flex items-center justify-center py-24">
          <div className="text-center">
            <p className="text-[#DC2C1E] mb-4">{error ?? "Profil tidak ditemukan"}</p>
            <button onClick={() => window.location.reload()}
              className="text-sm text-[#146EB4] hover:underline">Coba lagi</button>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  const nextMilestone = BADGE_MILESTONES.find((m) => m > profile.passportDaysCompleted) ?? 30;
  const daysToMilestone = nextMilestone - profile.passportDaysCompleted;

  return (
    <>
      <Header />
      <main className="flex-1 bg-[#F1F1F1]">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <ProfileHeader profile={profile} isOwnProfile={true} />

          {/* Passport Journey */}
          <div className="bg-white border border-[#E7E7E7] rounded-lg p-6 mt-6">
            <div className="flex items-center gap-2 mb-4">
              <Calendar className="w-5 h-5 text-[#E8B4D1]" />
              <h2 className="text-lg font-bold text-[#232F3E]">Jogja Passport Journey</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
                <p className="text-3xl font-bold text-[#146EB4]">{profile.passportDaysCompleted}</p>
                <p className="text-sm text-[#565A5C] mt-1">Hari Selesai</p>
                <p className="text-xs text-[#565A5C] mt-2">dari 30 hari total</p>
              </div>

              <div className="bg-[#F1F1F1] border border-[#E7E7E7] rounded-lg p-4">
                <p className="text-xs font-bold text-[#565A5C] mb-2">Progress</p>
                <ProgressBar value={profile.passportDaysCompleted} max={30} showPercent color="orange" size="lg" />
                <p className="text-xs text-[#565A5C] mt-2">
                  {Math.round((profile.passportDaysCompleted / 30) * 100)}% perjalanan selesai
                </p>
              </div>

              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 text-center">
                <p className="text-lg font-bold text-[#EC7211]">Hari {nextMilestone}</p>
                <p className="text-sm text-[#565A5C] mt-1">Milestone Berikutnya</p>
                <p className="text-xs text-[#565A5C] mt-2">{daysToMilestone} hari lagi</p>
              </div>
            </div>

            <Link href="/passport" className="inline-block mt-4 text-sm text-[#146EB4] hover:underline font-semibold">
              Lanjutkan Panduan →
            </Link>
          </div>

          {/* Badge Grid */}
          <div className="mt-6">
            <BadgeGrid earnedBadges={profile.earnedBadges} />
          </div>

          {/* Project Statistics */}
          <div className="bg-white border border-[#E7E7E7] rounded-lg p-6 mt-6">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-5 h-5 text-[#E8B4D1]" />
              <h2 className="text-lg font-bold text-[#232F3E]">Statistik Pekerjaan</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <h3 className="text-sm font-bold text-[#232F3E] mb-3">Rating & Review</h3>
                <div className="flex items-center gap-3 mb-4">
                  <div>
                    <p className="text-3xl font-bold text-[#232F3E]">{profile.rating.toFixed(1)}</p>
                    <p className="text-xs text-[#565A5C]">dari 5.0</p>
                  </div>
                  <div className="flex">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <span key={i} className={`text-lg ${i < Math.round(profile.rating) ? "text-yellow-400" : "text-[#CCCCCC]"}`}>★</span>
                    ))}
                  </div>
                </div>
                <p className="text-sm text-[#565A5C]">
                  Berdasarkan <strong>{profile.reviewCount} review</strong> dari employer
                </p>
              </div>
              <div>
                <h3 className="text-sm font-bold text-[#232F3E] mb-3">Pencapaian</h3>
                <div className="space-y-2">
                  {[
                    { icon: "✓", label: "Proyek Selesai", value: profile.completedProjects },
                    { icon: "⭐", label: "Review Positif", value: `${profile.reviewCount} review` },
                    { icon: "📅", label: "Passport Days", value: `${profile.passportDaysCompleted}/30 hari` },
                  ].map((stat) => (
                    <div key={stat.label} className="flex items-center justify-between p-2 bg-[#F1F1F1] rounded">
                      <span className="text-sm text-[#565A5C]"><span className="mr-2">{stat.icon}</span>{stat.label}</span>
                      <p className="font-bold text-[#232F3E]">{stat.value}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-[#D64545] to-[#E8B4D1] text-white rounded-lg p-6 mt-6 text-center">
            <h3 className="text-lg font-bold mb-2">Tingkatkan Profil Anda</h3>
            <p className="text-white/80 text-sm mb-4">
              Kumpulkan lebih banyak badge dan tingkatkan rating untuk menarik lebih banyak project.
            </p>
            <div className="flex gap-3 justify-center">
              <Link href="/passport" className="inline-block px-4 py-2 bg-[#D64545] hover:bg-[#C23B3B] text-white rounded-lg font-semibold text-sm transition-colors">
                Lanjutkan Panduan
              </Link>
              <Link href="/jobs" className="inline-block px-4 py-2 bg-white text-[#232F3E] rounded-lg font-semibold text-sm hover:bg-[#F1F1F1] transition-colors">
                Cari Lowongan
              </Link>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
