"use client";
import { useState, useEffect, useCallback } from "react";
import { Loader2, CheckCircle, Award } from "lucide-react";
import Badge from "../../components/ui/Badge";
import Toast from "../../components/ui/Toast";
import { adminApi, type ApiPendingBadge } from "../../lib/admin.api";

const RARITY_COLOR: Record<string, "blue" | "orange" | "green" | "red" | "gray" | "gold"> = {
  common: "gray",
  uncommon: "blue",
  rare: "orange",
  legendary: "gold",
};

export default function AdminBadgesPage() {
  const [badges, setBadges] = useState<ApiPendingBadge[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const loadBadges = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminApi.getPendingBadges();
      setBadges(res.data);
    } catch (err: unknown) {
      setToast({ message: err instanceof Error ? err.message : "Gagal memuat badge.", type: "error" });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadBadges();
  }, [loadBadges]);

  const handleVerify = async (userBadgeId: string) => {
    try {
      await adminApi.verifyUserBadge(userBadgeId);
      setBadges((prev) => prev.filter((b) => b.user_badge_id !== userBadgeId));
      setToast({ message: "Badge berhasil diverifikasi.", type: "success" });
    } catch (err: unknown) {
      setToast({ message: err instanceof Error ? err.message : "Gagal memverifikasi badge.", type: "error" });
    }
  };

  return (
    <>
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-[#232F3E]">Verifikasi Badge</h1>
          <p className="text-sm text-[#565A5C]">Badge yang butuh verifikasi manual admin sebelum aktif ke pengguna</p>
        </div>

        <div className="bg-white border border-[#E7E7E7] rounded-lg">
          {loading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="w-7 h-7 animate-spin text-[#D64545]" />
            </div>
          ) : badges.length === 0 ? (
            <div className="p-16 text-center">
              <CheckCircle className="w-10 h-10 text-[#12A54D] mx-auto mb-3" />
              <p className="font-semibold text-[#232F3E]">Semua badge sudah diverifikasi!</p>
              <p className="text-sm text-[#565A5C] mt-1">Tidak ada yang perlu diproses.</p>
            </div>
          ) : (
            <div className="divide-y divide-[#E7E7E7]">
              {badges.map((b) => (
                <div key={b.user_badge_id} className="flex items-center gap-4 px-6 py-4 hover:bg-[#F8F8F8] transition-colors">
                  <div className="w-10 h-10 flex-shrink-0 rounded-full bg-[#F1F1F1] flex items-center justify-center text-xl">
                    {b.icon || <Award className="w-5 h-5 text-[#565A5C]" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-[#232F3E]">{b.badge_name}</p>
                      <Badge label={b.rarity} color={RARITY_COLOR[b.rarity] || "gray"} />
                    </div>
                    <p className="text-xs text-[#565A5C] mt-0.5">
                      {b.full_name} ({b.email})
                      {b.event_title && ` · ${b.event_title}`}
                    </p>
                    <p className="text-xs text-[#565A5C]">Didapat {new Date(b.earned_at).toLocaleString("id-ID")}</p>
                  </div>
                  <button
                    onClick={() => handleVerify(b.user_badge_id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#12A54D] hover:bg-green-50 rounded transition-colors flex-shrink-0"
                  >
                    <CheckCircle className="w-4 h-4" /> Verifikasi
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </>
  );
}
