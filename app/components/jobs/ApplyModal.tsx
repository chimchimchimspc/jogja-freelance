"use client";
import { useState } from "react";
import Modal from "../ui/Modal";
import Button from "../ui/Button";
import Toast from "../ui/Toast";
import { Textarea } from "../ui/Input";
import { DollarSign, Clock, Building2 } from "lucide-react";
import { jobsApi } from "../../lib/jobs.api";
import { useAuth } from "../../context/AuthContext";

interface Job {
  id: string;
  title: string;
  company: string;
  budget: number;
  deadline: number;
  contactWhatsapp?: string;
}

interface ApplyModalProps {
  job: Job | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (jobId: string) => void;
}

const MAX_COVER = 300;

function formatBudget(amount: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency", currency: "IDR", minimumFractionDigits: 0,
  }).format(amount);
}

export default function ApplyModal({ job, isOpen, onClose, onSuccess }: ApplyModalProps) {
  const { user } = useAuth();
  const [coverLetter, setCoverLetter] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const handleClose = () => {
    setCoverLetter("");
    setError("");
    onClose();
  };

  const handleSubmit = async () => {
    if (!job) return;
    if (!user) {
      setToast({ message: "Silakan login terlebih dahulu", type: "error" });
      return;
    }
    if (coverLetter.trim().length < 20) {
      setError("Pesan minimal 20 karakter");
      return;
    }
    if (coverLetter.length > MAX_COVER) {
      setError(`Pesan maksimal ${MAX_COVER} karakter`);
      return;
    }
    setError("");
    setLoading(true);

    try {
      await jobsApi.apply(job.id, coverLetter);
      setToast({ message: "Lamaran berhasil dikirim!", type: "success" });
      setTimeout(() => {
        onSuccess(job.id);
        handleClose();
        setToast(null);
      }, 1500);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Gagal mengirim lamaran. Coba lagi.";
      setToast({ message: msg, type: "error" });
    } finally {
      setLoading(false);
    }
  };

  if (!job) return null;

  const initials = user?.name
    ?.split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) ?? "?";

  return (
    <>
      <Modal isOpen={isOpen} onClose={handleClose} title="Lamar Pekerjaan" size="md"
        footer={
          <>
            <Button variant="secondary" onClick={handleClose} disabled={loading}>Batal</Button>
            <Button onClick={handleSubmit} loading={loading}>Kirim Lamaran</Button>
          </>
        }
      >
        {/* Job Summary */}
        <div className="bg-[#F1F1F1] rounded-lg p-4 mb-5">
          <h4 className="font-bold text-[#232F3E] mb-1">{job.title}</h4>
          <div className="flex flex-wrap items-center gap-3 text-sm text-[#565A5C]">
            <span className="flex items-center gap-1"><Building2 className="w-3.5 h-3.5" /> {job.company}</span>
            <span className="flex items-center gap-1"><DollarSign className="w-3.5 h-3.5" /> {formatBudget(job.budget)}</span>
            <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {job.deadline} hari</span>
          </div>
        </div>

        {/* Profile Preview */}
        <div className="flex items-center gap-3 bg-blue-50 border border-[#EBF5FF] rounded-lg p-3 mb-5">
          <div className="w-10 h-10 rounded-full bg-[#146EB4] flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
            {initials}
          </div>
          <div>
            <p className="text-sm font-semibold text-[#232F3E]">{user?.name ?? "Anda"}</p>
            <p className="text-xs text-[#565A5C]">{user?.level ?? "Bronze"} · Freelancer</p>
          </div>
          <span className="ml-auto text-xs text-[#146EB4] bg-blue-100 px-2 py-1 rounded font-medium">
            Profil Anda
          </span>
        </div>

        {/* Cover Letter */}
        <Textarea
          label="Pesan Singkat ke Employer"
          placeholder="Ceritakan kenapa Anda cocok untuk pekerjaan ini, pengalaman relevan, dan kapan bisa mulai. Singkat, padat, menarik!"
          value={coverLetter}
          onChange={(e) => { setCoverLetter(e.target.value); if (error) setError(""); }}
          rows={5}
          maxLength={MAX_COVER}
          currentLength={coverLetter.length}
          error={error}
          hint="Tips: Sebutkan pengalaman relevan & link portfolio Anda"
        />

        <p className="text-xs text-[#565A5C]">
          Employer akan menghubungi Anda via{" "}
          <span className="font-semibold">{job.contactWhatsapp ? "WhatsApp / " : ""}Email</span> jika tertarik.
        </p>
      </Modal>

      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}
    </>
  );
}
