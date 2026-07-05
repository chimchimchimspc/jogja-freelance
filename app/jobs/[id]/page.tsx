"use client";
import { useState, useEffect, use } from "react";
import { notFound } from "next/navigation";
import Header from "../../components/layout/Header";
import Footer from "../../components/layout/Footer";
import Badge from "../../components/ui/Badge";
import Button from "../../components/ui/Button";
import ApplyModal from "../../components/jobs/ApplyModal";
import Toast from "../../components/ui/Toast";
import { ArrowLeft, DollarSign, Clock, Eye, Users, MapPin, Mail, Phone, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import Link from "next/link";
import { jobsApi, type ApiJob, type ApiApplication } from "../../lib/jobs.api";
import LocationMap from "../../components/ui/LocationMap";
import { useAuth } from "../../context/AuthContext";
import { assetUrl } from "../../lib/api";

const categoryColor: Record<string, "blue" | "orange" | "green" | "gray"> = {
  "Web Development":    "blue",
  "UI/UX Design":       "orange",
  "Mobile Development": "blue",
  "Content Writing":    "green",
  "Video Editing":      "gray",
  "Social Media":       "orange",
  "Logo Design":        "green",
};

function formatBudget(amount: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency", currency: "IDR", minimumFractionDigits: 0,
  }).format(amount);
}

export default function JobDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { user } = useAuth();
  const [job, setJob]           = useState<ApiJob | null>(null);
  const [related, setRelated]   = useState<ApiJob[]>([]);
  const [loading, setLoading]   = useState(true);
  const [myApp, setMyApp]       = useState<ApiApplication | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [toast, setToast]       = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await jobsApi.get(id);
        setJob(res.data);
        // Fetch related jobs in same category
        const relRes = await jobsApi.list({ category: res.data.category, limit: 4 });
        setRelated(relRes.data.filter((j) => j.id !== id).slice(0, 3));
      } catch {
        setJob(null);
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  // Cek apakah user sudah pernah melamar lowongan ini
  useEffect(() => {
    if (!user || user.role !== "freelancer") return;
    (async () => {
      try {
        const res = await jobsApi.myApplications({ limit: 100 });
        setMyApp(res.data.find((a) => a.job_id === id) ?? null);
      } catch {
        setMyApp(null);
      }
    })();
  }, [id, user]);

  if (loading) {
    return (
      <>
        <Header />
        <main className="flex-1 flex items-center justify-center py-24">
          <Loader2 className="w-8 h-8 animate-spin text-[#D64545]" />
        </main>
        <Footer />
      </>
    );
  }

  if (!job) return notFound();

  const budget    = job.budget_max ?? job.budget_min ?? 0;
  const deadline  = job.deadline_days ?? 0;
  const hasCoords = !!(job.latitude && job.longitude);

  return (
    <>
      <Header />
      <main className="flex-1 bg-[#F1F1F1] py-8">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center gap-2 text-sm text-[#565A5C] mb-6">
            <Link href="/jobs" className="flex items-center gap-1 hover:text-[#146EB4] transition-colors">
              <ArrowLeft className="w-4 h-4" /> Kembali ke Lowongan
            </Link>
            <span>/</span>
            <span className="text-[#232F3E]">{job.title}</span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
            <div className="space-y-4">
              {job.image_url && (
                <div className="w-full h-56 sm:h-72 rounded-lg overflow-hidden border border-[#E7E7E7]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={assetUrl(job.image_url)} alt={job.title} className="w-full h-full object-cover" />
                </div>
              )}
              <div className="bg-white border border-[#E7E7E7] rounded-lg p-6">
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div>
                    <Badge label={job.category} color={categoryColor[job.category] ?? "blue"} className="mb-2" />
                    <h1 className="text-2xl font-bold text-[#232F3E] mb-1">{job.title}</h1>
                    <p className="text-[#565A5C]">{job.company}</p>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-[#565A5C] flex-shrink-0">
                    <Eye className="w-4 h-4" /><span>{job.view_count} views</span>
                  </div>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-[#E7E7E7]">
                  {[
                    { icon: DollarSign, label: "Budget",   val: formatBudget(budget) },
                    { icon: Clock,      label: "Deadline", val: `${deadline} hari lagi` },
                    { icon: MapPin,     label: "Lokasi",   val: job.location },
                    { icon: Users,      label: "Pelamar",  val: `${job.application_count} orang` },
                  ].map(({ icon: Icon, label, val }) => (
                    <div key={label} className="text-center">
                      <div className="flex items-center justify-center gap-1 text-[#565A5C] mb-1">
                        <Icon className="w-4 h-4" /><span className="text-xs">{label}</span>
                      </div>
                      <p className="text-sm font-semibold text-[#232F3E]">{val}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white border border-[#E7E7E7] rounded-lg p-6">
                <h2 className="text-lg font-bold text-[#232F3E] mb-4">Deskripsi Pekerjaan</h2>
                <p className="text-sm text-[#232F3E] leading-relaxed">{job.description}</p>
              </div>

              {job.requirements && job.requirements.length > 0 && (
                <div className="bg-white border border-[#E7E7E7] rounded-lg p-6">
                  <h2 className="text-lg font-bold text-[#232F3E] mb-4">Persyaratan</h2>
                  <ul className="space-y-2">
                    {job.requirements.map((req, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-[#232F3E]">
                        <CheckCircle className="w-4 h-4 text-[#12A54D] flex-shrink-0 mt-0.5" />{req}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {job.skills && job.skills.length > 0 && (
                <div className="bg-white border border-[#E7E7E7] rounded-lg p-6">
                  <h2 className="text-lg font-bold text-[#232F3E] mb-4">Skill yang Dibutuhkan</h2>
                  <div className="flex flex-wrap gap-2">
                    {job.skills.map((s) => (
                      <span key={s} className="px-3 py-1.5 bg-blue-50 text-[#146EB4] rounded-full text-sm font-semibold">{s}</span>
                    ))}
                  </div>
                </div>
              )}

              {related.length > 0 && (
                <div className="bg-white border border-[#E7E7E7] rounded-lg p-6">
                  <h2 className="text-lg font-bold text-[#232F3E] mb-4">Lowongan Serupa</h2>
                  <div className="space-y-3">
                    {related.map((rj) => (
                      <Link key={rj.id} href={`/jobs/${rj.id}`}
                        className="flex items-start justify-between gap-3 p-3 bg-[#F1F1F1] rounded-lg hover:bg-blue-50 transition-colors">
                        <div>
                          <p className="text-sm font-semibold text-[#232F3E]">{rj.title}</p>
                          <p className="text-xs text-[#565A5C]">{rj.company}</p>
                        </div>
                        <span className="text-xs font-semibold text-[#E8B4D1] flex-shrink-0">
                          {formatBudget(rj.budget_max ?? rj.budget_min ?? 0)}
                        </span>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-4">
              <div className="bg-white border border-[#E7E7E7] rounded-lg p-5">
                <div className="text-center mb-4">
                  <p className="text-2xl font-bold text-[#232F3E]">{formatBudget(budget)}</p>
                  <p className="text-xs text-[#565A5C]">Budget proyek</p>
                </div>

                {myApp?.status === "accepted" ? (
                  <div className="text-center py-3 bg-green-50 border border-green-200 rounded-lg mb-4">
                    <CheckCircle className="w-5 h-5 text-green-600 mx-auto mb-1" />
                    <p className="text-sm font-semibold text-green-700">🎉 Lamaran Anda Diterima!</p>
                    <p className="text-xs text-[#565A5C] mt-1">
                      Employer akan menghubungi Anda — cek chat & notifikasi
                    </p>
                  </div>
                ) : myApp?.status === "rejected" ? (
                  <div className="text-center py-3 bg-gray-50 border border-gray-200 rounded-lg mb-4">
                    <AlertCircle className="w-5 h-5 text-gray-500 mx-auto mb-1" />
                    <p className="text-sm font-semibold text-gray-600">Lamaran Tidak Diterima</p>
                    <p className="text-xs text-[#565A5C] mt-1">
                      Jangan menyerah — masih banyak lowongan lain untukmu
                    </p>
                  </div>
                ) : myApp ? (
                  <div className="text-center py-3 bg-blue-50 border border-blue-200 rounded-lg mb-4">
                    <CheckCircle className="w-5 h-5 text-[#146EB4] mx-auto mb-1" />
                    <p className="text-sm font-semibold text-[#146EB4]">Lamaran Terkirim!</p>
                    <p className="text-xs text-[#565A5C] mt-1">
                      Status: {myApp.status === "reviewed" ? "Sedang direview" : "Menunggu review"} — pantau di Lamaranku
                    </p>
                  </div>
                ) : (
                  <Button fullWidth size="lg" onClick={() => setShowModal(true)} className="mb-3">
                    Lamar Sekarang
                  </Button>
                )}

                {deadline <= 7 && (
                  <div className="flex items-center gap-2 text-xs text-[#DC2C1E] bg-red-50 rounded-lg p-2 mt-2">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    Deadline sangat dekat — {deadline} hari lagi!
                  </div>
                )}

                <div className="border-t border-[#E7E7E7] mt-4 pt-4 space-y-2">
                  <h4 className="text-sm font-semibold text-[#232F3E]">Kontak Employer</h4>
                  {job.contact_email && (
                    <div className="flex items-center gap-2 text-sm text-[#565A5C]">
                      <Mail className="w-4 h-4 flex-shrink-0" />
                      <span className="truncate">{job.contact_email}</span>
                    </div>
                  )}
                  {job.contact_whatsapp && (
                    <div className="flex items-center gap-2 text-sm text-[#565A5C]">
                      <Phone className="w-4 h-4 flex-shrink-0" />
                      <span>{job.contact_whatsapp}</span>
                    </div>
                  )}
                  <p className="text-xs text-[#565A5C] mt-2">Kontak tersedia setelah lamaran diterima</p>
                </div>
              </div>

              <div className="bg-white border border-[#E7E7E7] rounded-lg p-5">
                <h4 className="text-sm font-bold text-[#232F3E] mb-3">Tentang Employer</h4>
                <div className="flex items-center gap-3">
                  {/* Logo dari profil pengelola */}
                  <div className="w-12 h-12 rounded-lg bg-[#D64545] flex items-center justify-center text-white font-bold overflow-hidden flex-shrink-0">
                    {job.company_logo ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={assetUrl(job.company_logo)} alt={job.company} className="w-full h-full object-cover" />
                    ) : (
                      job.company?.charAt(0) ?? "?"
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-[#232F3E]">{job.company}</p>
                    <p className="text-xs text-[#565A5C]">
                      {job.company_industry || "Verified Employer"}
                    </p>
                  </div>
                </div>
                <div className="mt-3 text-xs text-[#565A5C] space-y-1">
                  <p>📍 {job.location || job.location_type}</p>
                  <p>📅 Diposting {job.created_at?.split("T")[0]}</p>
                  <p>👁️ {job.view_count} kali dilihat</p>
                </div>
              </div>

              {/* Lokasi kerja */}
              <div className="bg-white border border-[#E7E7E7] rounded-lg overflow-hidden">
                <div className="p-5">
                  <p className="text-sm font-bold text-[#232F3E] mb-3 flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-[#D64545]" />
                    Lokasi Kerja
                  </p>
                  <p className="text-sm text-[#232F3E] leading-relaxed bg-[#F8F8F8] p-3 rounded">
                    {job.location || (job.location_type === "Remote" ? "Remote — bisa dikerjakan dari mana saja" : job.location_type)}
                  </p>
                </div>

                {hasCoords && (
                  <>
                    <div style={{ height: "260px" }} className="w-full border-t border-[#E7E7E7]">
                      <LocationMap
                        latitude={Number(job.latitude)}
                        longitude={Number(job.longitude)}
                        label={`${job.company} — ${job.location}`}
                      />
                    </div>
                    <div className="p-5 border-t border-[#E7E7E7]">
                      <a
                        href={`https://maps.google.com/?q=${job.latitude},${job.longitude}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 text-sm text-[#D64545] hover:text-[#C23B3B] font-semibold"
                      >
                        <MapPin className="w-4 h-4" />
                        Buka di Google Maps →
                      </a>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />

      <ApplyModal
        job={showModal ? {
          id: job.id, title: job.title, company: job.company,
          budget, deadline, contactWhatsapp: job.contact_whatsapp,
        } : null}
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onSuccess={() => {
          setMyApp({ job_id: id, status: "pending" } as ApiApplication);
          setShowModal(false);
          setToast("Lamaran berhasil dikirim! Employer akan menghubungi Anda.");
        }}
      />

      {toast && <Toast message={toast} type="success" onClose={() => setToast(null)} />}
    </>
  );
}
