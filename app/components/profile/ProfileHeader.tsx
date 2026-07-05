"use client";
import { Copy, Share2, MapPin, Award, Star, Calendar, DollarSign, LogOut } from "lucide-react";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Button from "../ui/Button";
import Toast from "../ui/Toast";
import { type UserProfile, formatCurrency, getDaysAgoText } from "../../data/profile";
import { assetUrl } from "../../lib/api";
import { useAuth } from "../../context/AuthContext";

interface ProfileHeaderProps {
  profile: UserProfile;
  isOwnProfile?: boolean;
}

const LEVEL_ICON: Record<string, string> = {
  Bronze:   "🥉",
  Silver:   "🥈",
  Gold:     "🥇",
  Platinum: "💎",
};

export default function ProfileHeader({ profile, isOwnProfile = false }: ProfileHeaderProps) {
  const router = useRouter();
  const { logout } = useAuth();
  const [toast, setToast] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [bioExpanded, setBioExpanded] = useState(false);

  const BIO_COLLAPSE_LENGTH = 160;
  const bioIsLong = (profile.bio ?? "").length > BIO_COLLAPSE_LENGTH;

  const handleLogout = () => {
    logout();
    router.push("/auth/login");
  };

  const handleCopyLink = () => {
    const link = `${typeof window !== "undefined" ? window.location.origin : ""}/profile/${profile.id}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    setToast("Link profil disalin!");
    setTimeout(() => setCopied(false), 2000);
  };

  const joinDaysAgo = getDaysAgoText(profile.joinDate);

  return (
    <div className="bg-white border border-[#E7E7E7] rounded-lg p-6 sm:p-8">
      {/* Background & Header */}
      <div className="mb-6">
        {/* Top bar */}
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex items-start gap-4 flex-1">
            {/* Avatar */}
            <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full bg-[#D64545] flex items-center justify-center text-4xl sm:text-5xl font-bold text-white flex-shrink-0 border-4 border-white shadow-lg overflow-hidden">
              {profile.profilePicture ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={assetUrl(profile.profilePicture)} alt={profile.name} className="w-full h-full object-cover" />
              ) : (
                profile.name.charAt(0)
              )}
            </div>

            {/* Name & Info */}
            <div className="flex-1 pt-2">
              <div className="flex items-center gap-2 mb-1">
                <h1 className="text-2xl sm:text-3xl font-bold text-[#232F3E]">{profile.name}</h1>
                {profile.verified && (
                  <span title="Verified" className="text-lg">
                    ✓
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 text-sm text-[#565A5C] mb-3">
                <MapPin className="w-4 h-4" />
                <span>{profile.city}</span>
              </div>

              {/* Level badge */}
              <div className="flex items-center gap-2">
                <span className="text-2xl">{LEVEL_ICON[profile.level]}</span>
                <div>
                  <p className="text-xs font-bold text-[#E8B4D1]">Level {profile.level}</p>
                  <p className="text-xs text-[#565A5C]">{profile.earnedBadges.length} badge</p>
                </div>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-col gap-2 flex-shrink-0">
            <Button size="sm" variant="secondary" onClick={handleCopyLink} className="flex items-center gap-1">
              <Copy className="w-4 h-4" /> Share
            </Button>
            {isOwnProfile && (
              <>
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
              </>
            )}
          </div>
        </div>

        {/* Bio — break-words mencegah teks panjang tembus keluar card */}
        {profile.bio && (
          <div className="max-w-2xl">
            <p
              className={`text-sm text-[#232F3E] leading-relaxed break-words whitespace-pre-line ${
                bioIsLong && !bioExpanded ? "line-clamp-3" : ""
              }`}
            >
              {profile.bio}
            </p>
            {bioIsLong && (
              <button
                onClick={() => setBioExpanded((v) => !v)}
                className="mt-1 text-xs font-semibold text-[#146EB4] hover:underline"
              >
                {bioExpanded ? "Sembunyikan" : "Lihat selengkapnya"}
              </button>
            )}
          </div>
        )}
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 py-5 border-y border-[#E7E7E7]">
        {[
          { icon: Award, label: "Badge", value: profile.earnedBadges.length, total: "8" },
          { icon: Star, label: "Rating", value: profile.rating.toFixed(1), unit: "★" },
          { icon: DollarSign, label: "Earned", value: formatCurrency(profile.totalEarnings), sm: true },
          { icon: Calendar, label: "Joined", value: joinDaysAgo },
        ].map((s) => (
          <div key={s.label} className="text-center">
            <div className="flex items-center justify-center gap-1.5 mb-1">
              <s.icon className="w-4 h-4 text-[#E8B4D1]" />
              <span className="text-xs text-[#565A5C]">{s.label}</span>
            </div>
            <p className={`font-bold text-[#232F3E] ${s.sm ? "text-xs" : "text-sm"}`}>
              {s.value}
              <span className="text-xs text-[#565A5C] ml-1">
                {s.unit || (s.total ? `/${s.total}` : "")}
              </span>
            </p>
          </div>
        ))}
      </div>

      {/* Skills & Links */}
      <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div>
          <h3 className="text-sm font-bold text-[#232F3E] mb-2">Skill</h3>
          <div className="flex flex-wrap gap-2">
            {profile.skills.map((s) => (
              <span
                key={s}
                className="text-xs bg-blue-50 text-[#146EB4] px-3 py-1.5 rounded-full font-semibold"
              >
                {s}
              </span>
            ))}
          </div>
        </div>

        <div>
          <h3 className="text-sm font-bold text-[#232F3E] mb-2">Link</h3>
          {profile.portfolioUrl ? (
            <a
              href={profile.portfolioUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-sm text-[#146EB4] hover:underline font-semibold"
            >
              <Share2 className="w-4 h-4" />
              Kunjungi Portfolio
            </a>
          ) : (
            <p className="text-xs text-[#565A5C]">Belum ada portfolio link</p>
          )}
        </div>
      </div>

      {/* Verified badge */}
      {profile.verified && (
        <div className="mt-5 flex items-center gap-2 bg-green-50 border border-green-200 rounded-lg px-4 py-3">
          <span className="text-lg">✓</span>
          <div>
            <p className="text-sm font-semibold text-green-800">Profil Terverifikasi</p>
            <p className="text-xs text-green-700">Freelancer yang dipercaya oleh employer</p>
          </div>
        </div>
      )}

      {toast && <Toast message={toast} type="success" onClose={() => setToast(null)} />}
    </div>
  );
}
