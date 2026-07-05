"use client";
import { use, useState, useEffect } from "react";
import Header from "../../components/layout/Header";
import Footer from "../../components/layout/Footer";
import ProfileHeader from "../../components/profile/ProfileHeader";
import BadgeGrid from "../../components/profile/BadgeGrid";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import { profileApi, type ApiProfile } from "../../lib/profile.api";
import type { UserProfile } from "../../data/profile";

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
    passportDaysCompleted: Number(p.passport_days_completed ?? 0),
    rating: Number(p.rating ?? 0),
    reviewCount: Number(p.review_count ?? 0),
    completedProjects: Number(p.completed_projects ?? 0),
    totalEarnings: 0,
  };
}

export default function PublicProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await profileApi.getPublic(id);
        setProfile(adaptProfile(res.data));
      } catch {
        setProfile(null);
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  if (loading) {
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

  if (!profile) {
    return (
      <>
        <Header />
        <main className="flex-1 bg-[#F1F1F1] flex items-center justify-center py-24">
          <div className="text-center">
            <div className="text-5xl mb-4">🔍</div>
            <h1 className="text-lg font-bold text-[#232F3E] mb-2">Profil tidak ditemukan</h1>
            <Link href="/" className="text-sm text-[#D64545] hover:underline font-semibold">
              ← Kembali ke Beranda
            </Link>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header />
      <main className="flex-1 bg-[#F1F1F1]">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <ProfileHeader profile={profile} isOwnProfile={false} />
          <div className="mt-6">
            <BadgeGrid earnedBadges={profile.earnedBadges} />
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
