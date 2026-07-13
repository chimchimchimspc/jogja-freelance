"use client";
import { useState } from "react";
import { Star, Loader2 } from "lucide-react";
import Modal from "../ui/Modal";
import Button from "../ui/Button";
import { jobsApi } from "../../lib/jobs.api";
import { reviewsApi } from "../../lib/reviews.api";

interface CompleteReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  applicant: {
    applicationId: string;
    freelancerId: string;
    name: string;
    jobId?: string;
    jobTitle?: string;
  } | null;
  onDone: (applicationId: string) => void;
  onError: (message: string) => void;
}

export default function CompleteReviewModal({
  isOpen, onClose, applicant, onDone, onError,
}: CompleteReviewModalProps) {
  const [rating, setRating] = useState(5);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const reset = () => {
    setRating(5);
    setHover(0);
    setComment("");
  };

  const handleSubmit = async () => {
    if (!applicant) return;
    setSubmitting(true);
    try {
      // 1. Setujui hasil kerja (hanya valid dari status submitted_for_review)
      await jobsApi.completeApplication(applicant.applicationId);
      // 2. Kirim ulasan → rating profil freelancer tersinkron otomatis di backend
      await reviewsApi.create({
        reviewee_id: applicant.freelancerId,
        job_id: applicant.jobId,
        rating,
        comment: comment.trim() || undefined,
      });
      onDone(applicant.applicationId);
      reset();
      onClose();
    } catch (e: unknown) {
      onError(e instanceof Error ? e.message : "Gagal menyimpan ulasan.");
    } finally {
      setSubmitting(false);
    }
  };

  const RATING_LABEL = ["", "Buruk", "Kurang", "Cukup", "Bagus", "Luar Biasa"];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Setujui Hasil Kerja & Beri Ulasan" size="md">
      {applicant && (
        <div>
          <p className="text-sm text-[#6B6880] mb-5">
            Setujui hasil kerja <strong className="text-[#1E1B2E]">{applicant.jobTitle ?? "ini"}</strong> dan
            beri ulasan untuk <strong className="text-[#1E1B2E]">{applicant.name}</strong>.
            Rating & ulasan akan tampil di profil dan portofolionya.
          </p>

          {/* Rating bintang */}
          <div className="text-center mb-5">
            <div className="flex justify-center gap-1.5 mb-2">
              {[1, 2, 3, 4, 5].map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setRating(s)}
                  onMouseEnter={() => setHover(s)}
                  onMouseLeave={() => setHover(0)}
                  className="transition-transform hover:scale-115"
                  aria-label={`${s} bintang`}
                >
                  <Star
                    className={`w-9 h-9 transition-colors ${
                      s <= (hover || rating)
                        ? "text-yellow-400 fill-yellow-400"
                        : "text-[#D5D0E8]"
                    }`}
                  />
                </button>
              ))}
            </div>
            <p className="text-sm font-semibold text-[#1E1B2E]">
              {rating}/5 — {RATING_LABEL[hover || rating]}
            </p>
          </div>

          {/* Komentar */}
          <div className="mb-5">
            <label className="block text-sm font-semibold text-[#1E1B2E] mb-1.5">
              Ulasan (Opsional)
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={3}
              maxLength={1000}
              placeholder="Bagaimana kualitas kerja, komunikasi, dan ketepatan waktunya?"
              className="w-full px-3.5 py-2.5 text-sm border border-[#EAE6F5] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D64545]/30 resize-none"
            />
            <p className="text-xs text-[#9B96AD] text-right mt-1">{comment.length}/1000</p>
          </div>

          <div className="flex gap-2">
            <Button fullWidth size="lg" onClick={handleSubmit} loading={submitting}>
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "✓ Setujui & Kirim Ulasan"}
            </Button>
            <button
              onClick={onClose}
              className="px-5 bg-[#F8F6FF] hover:bg-[#EAE6F5] text-[#6B6880] rounded-lg font-semibold text-sm transition-colors"
            >
              Batal
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
}
