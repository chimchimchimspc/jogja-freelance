"use client";
import { useState, useEffect } from "react";
import { Star, MessageSquareQuote } from "lucide-react";
import { reviewsApi, type ReviewsResult } from "../../lib/reviews.api";
import { assetUrl } from "../../lib/api";

function Stars({ value, size = "w-4 h-4" }: { value: number; size?: string }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          className={`${size} ${s <= Math.round(value) ? "text-yellow-400 fill-yellow-400" : "text-[#D5D0E8]"}`}
        />
      ))}
    </div>
  );
}

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
}

export default function ReviewList({ userId }: { userId: string }) {
  const [data, setData] = useState<ReviewsResult | null>(null);

  useEffect(() => {
    reviewsApi
      .forUser(userId)
      .then((res) => setData(res.data))
      .catch(() => setData(null));
  }, [userId]);

  const reviews = data?.reviews ?? [];
  const summary = data?.summary;

  return (
    <div className="bg-white border border-[#E7E7E7] rounded-lg p-6">
      <div className="flex items-center justify-between gap-2 mb-4">
        <div className="flex items-center gap-2">
          <MessageSquareQuote className="w-5 h-5 text-[#D64545]" />
          <h2 className="text-lg font-bold text-[#232F3E]">Ulasan dari Employer</h2>
        </div>
        {summary && summary.total > 0 && (
          <div className="flex items-center gap-2">
            <Stars value={Number(summary.average)} />
            <span className="text-sm font-bold text-[#232F3E]">{Number(summary.average).toFixed(1)}</span>
            <span className="text-xs text-[#565A5C]">({summary.total} ulasan)</span>
          </div>
        )}
      </div>

      {reviews.length === 0 ? (
        <p className="text-sm text-[#565A5C] italic">
          Belum ada ulasan. Ulasan akan muncul setelah employer menandai pekerjaanmu selesai.
        </p>
      ) : (
        <div className="space-y-4">
          {reviews.map((r) => (
            <div key={r.id} className="border-l-2 border-[#D64545]/30 pl-4">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-7 h-7 rounded-full bg-[#D64545] flex items-center justify-center text-white text-xs font-bold overflow-hidden flex-shrink-0">
                  {r.reviewer_avatar ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={assetUrl(r.reviewer_avatar)} alt={r.reviewer_name} className="w-full h-full object-cover" />
                  ) : (
                    r.reviewer_name.charAt(0)
                  )}
                </div>
                <span className="text-sm font-semibold text-[#232F3E]">{r.reviewer_name}</span>
                <Stars value={r.rating} size="w-3.5 h-3.5" />
              </div>
              {r.comment && (
                <p className="text-sm text-[#232F3E] leading-relaxed break-words">"{r.comment}"</p>
              )}
              <p className="text-xs text-[#9B96AD] mt-1">{fmtDate(r.created_at)}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
