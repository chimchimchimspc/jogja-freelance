"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Header from "../../components/layout/Header";
import Footer from "../../components/layout/Footer";
import { Input, Textarea } from "../../components/ui/Input";
import Button from "../../components/ui/Button";
import Toast from "../../components/ui/Toast";
import { ArrowLeft, Upload, Loader2 } from "lucide-react";
import Link from "next/link";
import { profileApi } from "../../lib/profile.api";
import { assetUrl } from "../../lib/api";
import { useAuth } from "../../context/AuthContext";
import EmployerEditForm from "../../components/profile/EmployerEditForm";

// Fallback kalau fetch daftar skill dari server gagal.
// Daftar utama diambil dari GET /profile/skills (tabel master skills),
// supaya pilihan di sini dijamin cocok dengan yang dikenali backend.
const SKILL_OPTIONS_FALLBACK = [
  "React", "Next.js", "TypeScript", "Node.js", "Laravel", "Flutter",
  "Figma", "UI Design", "UX Design", "Photoshop", "Illustrator",
  "Copywriting", "SEO Writing", "Premiere Pro", "Instagram", "TikTok",
];

export default function EditProfilePage() {
  const { user, isLoading: authLoading, updateUser } = useAuth();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    fullName: "",
    city: "",
    bio: "",
    portfolioUrl: "",
    skills: [] as string[],
  });
  const [skillOptions, setSkillOptions] = useState<string[]>(SKILL_OPTIONS_FALLBACK);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | undefined>(undefined);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const isEmployer = user?.role === "employer" || user?.role === "event_organizer";

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push("/auth/login?redirect=/profile/edit");
      return;
    }
    // Profil employer di-fetch oleh EmployerEditForm sendiri
    if (user.role === "employer" || user.role === "event_organizer") {
      setLoading(false);
      return;
    }
    (async () => {
      try {
        const [res, skillsRes] = await Promise.all([
          profileApi.getOwn(),
          profileApi.getSkillOptions().catch(() => null),
        ]);
        const p = res.data;
        setForm({
          fullName: p.full_name ?? "",
          city: p.city ?? "Yogyakarta",
          bio: p.bio ?? "",
          portfolioUrl: p.portfolio_url ?? "",
          skills: p.skills ?? [],
        });
        setPreview(assetUrl(p.profile_picture_url));
        if (skillsRes?.data?.length) {
          // gabungkan dengan skill user yang mungkin belum ada di master
          const names = skillsRes.data.map((s) => s.name);
          const extra = (p.skills ?? []).filter((s) => !names.includes(s));
          setSkillOptions([...names, ...extra]);
        }
      } catch (e: unknown) {
        setToast({ message: e instanceof Error ? e.message : "Gagal memuat profil", type: "error" });
      } finally {
        setLoading(false);
      }
    })();
  }, [user, authLoading, router]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setErrors((p) => ({ ...p, photo: "Ukuran maksimal 5MB" }));
      return;
    }
    if (!file.type.startsWith("image/")) {
      setErrors((p) => ({ ...p, photo: "Hanya file gambar" }));
      return;
    }
    setErrors((p) => ({ ...p, photo: "" }));
    setPhotoFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setPreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.fullName || form.fullName.trim().length < 3) e.fullName = "Nama minimal 3 karakter";
    if (!form.city.trim()) e.city = "Kota diperlukan";
    if (form.bio && form.bio.length > 500) e.bio = "Bio maksimal 500 karakter";
    if (form.portfolioUrl && !/^https?:\/\/.+/.test(form.portfolioUrl)) {
      e.portfolioUrl = "URL portfolio tidak valid (harus diawali http:// atau https://)";
    }
    if (form.skills.length > 5) e.skills = "Maksimal 5 skill";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setSaving(true);
    try {
      await profileApi.update({
        full_name: form.fullName,
        city: form.city,
        bio: form.bio,
        portfolio_url: form.portfolioUrl || undefined,
        skills: form.skills.length ? form.skills : undefined,
      });

      let avatar: string | undefined;
      if (photoFile) {
        const up = await profileApi.uploadPhoto(photoFile);
        avatar = up.data.url;
      }

      updateUser({ name: form.fullName, ...(avatar ? { avatar } : {}) });
      setToast({ message: "Profil berhasil diperbarui!", type: "success" });
      setTimeout(() => router.push("/profile"), 1200);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Gagal menyimpan profil. Coba lagi.";
      setToast({ message: msg, type: "error" });
    } finally {
      setSaving(false);
    }
  };

  const toggleSkill = (skill: string) => {
    setForm((p) => ({
      ...p,
      skills: p.skills.includes(skill)
        ? p.skills.filter((s) => s !== skill)
        : [...p.skills, skill],
    }));
  };

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

  // Session penyedia lowongan / event → edit profil perusahaan
  if (isEmployer) {
    return (
      <>
        <Header />
        <main className="flex-1 bg-[#F1F1F1]">
          <div className="max-w-2xl mx-auto px-4 py-8">
            <Link href="/profile" className="inline-flex items-center gap-2 text-[#D64545] hover:underline text-sm mb-6">
              <ArrowLeft className="w-4 h-4" />
              Kembali ke Profil
            </Link>
            <div className="bg-white rounded-xl border border-[#E7E7E7] p-6 sm:p-8 shadow-sm">
              <h1 className="text-2xl font-bold text-[#232F3E] mb-1">Edit Profil Perusahaan</h1>
              <p className="text-sm text-[#565A5C] mb-6">Perbarui informasi perusahaan / penyelenggara event Anda</p>
              <EmployerEditForm />
            </div>
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
        <div className="max-w-2xl mx-auto px-4 py-8">
          <Link href="/profile" className="inline-flex items-center gap-2 text-[#D64545] hover:underline text-sm mb-6">
            <ArrowLeft className="w-4 h-4" />
            Kembali ke Profil
          </Link>

          <div className="bg-white rounded-xl border border-[#E7E7E7] p-6 sm:p-8 shadow-sm">
            <h1 className="text-2xl font-bold text-[#232F3E] mb-1">Edit Profil</h1>
            <p className="text-sm text-[#565A5C] mb-6">Perbarui informasi profil Anda</p>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Foto profil */}
              <div className="mb-6">
                <label className="block text-sm font-semibold mb-3 text-[#232F3E]">Foto Profil</label>
                <div className="flex items-start gap-4">
                  {preview ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={preview}
                      alt="Foto profil"
                      className="w-24 h-24 rounded-full object-cover border-2 border-[#E8B4D1]"
                    />
                  ) : (
                    <div className="w-24 h-24 rounded-full bg-[#D64545] flex items-center justify-center text-3xl font-bold text-white">
                      {form.fullName.charAt(0).toUpperCase() || "?"}
                    </div>
                  )}
                  <div className="flex-1">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="flex items-center gap-2 px-4 py-2 bg-[#F1F1F1] border border-[#CCCCCC] rounded cursor-pointer hover:bg-[#E7E7E7] transition-colors"
                    >
                      <Upload className="w-4 h-4" />
                      <span className="text-sm font-semibold text-[#232F3E]">Ganti Foto</span>
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                    <p className="text-xs text-[#565A5C] mt-2">Max 5MB. Format: JPG, PNG, WebP</p>
                    {errors.photo && <span className="block text-xs text-[#DC2C1E] mt-1">{errors.photo}</span>}
                  </div>
                </div>
              </div>

              <Input
                label="Nama Lengkap"
                type="text"
                placeholder="Nama Anda"
                value={form.fullName}
                onChange={(e) => setForm((p) => ({ ...p, fullName: e.target.value }))}
                error={errors.fullName}
              />

              <Input
                label="Kota"
                type="text"
                placeholder="Yogyakarta"
                value={form.city}
                onChange={(e) => setForm((p) => ({ ...p, city: e.target.value }))}
                error={errors.city}
              />

              <Textarea
                label="Bio Singkat"
                placeholder="Ceritakan tentang Anda..."
                value={form.bio}
                onChange={(e) => setForm((p) => ({ ...p, bio: e.target.value }))}
                currentLength={form.bio.length}
                maxLength={500}
                error={errors.bio}
                rows={4}
              />

              <Input
                label="Portfolio URL (Opsional)"
                type="url"
                placeholder="https://portfolio.com atau https://github.com/username"
                value={form.portfolioUrl}
                onChange={(e) => setForm((p) => ({ ...p, portfolioUrl: e.target.value }))}
                error={errors.portfolioUrl}
                hint="Link ke portfolio, GitHub, atau website Anda"
              />

              <div className="mb-6">
                <label className="block text-sm font-semibold mb-2 text-[#232F3E]">Skill (1-5)</label>
                <div className="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto border border-[#E7E7E7] rounded-lg p-3">
                  {skillOptions.map((skill) => (
                    <label key={skill} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={form.skills.includes(skill)}
                        onChange={() => toggleSkill(skill)}
                        className="w-4 h-4 accent-[#E8B4D1]"
                      />
                      <span className="text-sm text-[#232F3E]">{skill}</span>
                    </label>
                  ))}
                </div>
                {errors.skills && <span className="block text-xs text-[#DC2C1E] mt-2">{errors.skills}</span>}
                <span className="block text-xs text-[#565A5C] mt-2">{form.skills.length} skill dipilih</span>
              </div>

              <div className="flex gap-3">
                <Button type="submit" fullWidth size="lg" loading={saving}>
                  Simpan Perubahan
                </Button>
                <Link
                  href="/profile"
                  className="flex items-center justify-center px-6 bg-[#F1F1F1] hover:bg-[#E7E7E7] text-[#232F3E] font-semibold rounded-lg transition-colors text-sm"
                >
                  Batal
                </Link>
              </div>
            </form>
          </div>
        </div>
      </main>
      <Footer />

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
          duration={toast.type === "success" ? 2000 : 4000}
        />
      )}
    </>
  );
}
