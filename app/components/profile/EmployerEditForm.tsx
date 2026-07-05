"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Upload, Loader2, Building2 } from "lucide-react";
import { Input, Textarea } from "../ui/Input";
import Button from "../ui/Button";
import Toast from "../ui/Toast";
import { profileApi } from "../../lib/profile.api";
import { assetUrl } from "../../lib/api";
import { useAuth } from "../../context/AuthContext";

export default function EmployerEditForm() {
  const router = useRouter();
  const { updateUser } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    companyName: "",
    industry: "",
    description: "",
    websiteUrl: "",
    location: "",
  });
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | undefined>(undefined);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await profileApi.getOwnEmployer();
        const p = res.data;
        setForm({
          companyName: p.company_name ?? "",
          industry: p.industry ?? "",
          description: p.company_description ?? "",
          websiteUrl: p.website_url ?? "",
          location: p.location ?? p.city ?? "Yogyakarta",
        });
        setPreview(assetUrl(p.company_logo_url));
      } catch (e: unknown) {
        setToast({ message: e instanceof Error ? e.message : "Gagal memuat profil", type: "error" });
      } finally {
        setLoading(false);
      }
    })();
  }, []);

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
    if (!form.companyName || form.companyName.trim().length < 3) e.companyName = "Nama perusahaan minimal 3 karakter";
    if (form.description && form.description.length > 1000) e.description = "Deskripsi maksimal 1000 karakter";
    if (form.websiteUrl && !/^https?:\/\/.+/.test(form.websiteUrl)) {
      e.websiteUrl = "URL tidak valid (harus diawali http:// atau https://)";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setSaving(true);
    try {
      await profileApi.updateEmployer({
        company_name: form.companyName,
        industry: form.industry || undefined,
        company_description: form.description || undefined,
        website_url: form.websiteUrl || undefined,
        location: form.location || undefined,
      });

      if (photoFile) {
        const up = await profileApi.uploadPhoto(photoFile);
        updateUser({ avatar: up.data.url });
      }

      setToast({ message: "Profil perusahaan berhasil diperbarui!", type: "success" });
      setTimeout(() => router.push("/profile"), 1200);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Gagal menyimpan profil. Coba lagi.";
      setToast({ message: msg, type: "error" });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-8 h-8 animate-spin text-[#D64545]" />
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Logo perusahaan */}
      <div className="mb-6">
        <label className="block text-sm font-semibold mb-3 text-[#232F3E]">Logo Perusahaan</label>
        <div className="flex items-start gap-4">
          {preview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={preview}
              alt="Logo perusahaan"
              className="w-24 h-24 rounded-2xl object-cover border-2 border-[#E8B4D1]"
            />
          ) : (
            <div className="w-24 h-24 rounded-2xl bg-[#D64545] flex items-center justify-center text-white">
              <Building2 className="w-10 h-10" />
            </div>
          )}
          <div className="flex-1">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2 px-4 py-2 bg-[#F1F1F1] border border-[#CCCCCC] rounded cursor-pointer hover:bg-[#E7E7E7] transition-colors"
            >
              <Upload className="w-4 h-4" />
              <span className="text-sm font-semibold text-[#232F3E]">Ganti Logo</span>
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
        label="Nama Perusahaan / Studio"
        type="text"
        placeholder="Contoh: Studio Kreatif Batik"
        value={form.companyName}
        onChange={(e) => setForm((p) => ({ ...p, companyName: e.target.value }))}
        error={errors.companyName}
      />

      <Input
        label="Industri (Opsional)"
        type="text"
        placeholder="Contoh: Kreatif & Desain, Teknologi, Kuliner"
        value={form.industry}
        onChange={(e) => setForm((p) => ({ ...p, industry: e.target.value }))}
      />

      <Textarea
        label="Deskripsi Perusahaan"
        placeholder="Ceritakan tentang perusahaan atau komunitas Anda..."
        value={form.description}
        onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
        currentLength={form.description.length}
        maxLength={1000}
        error={errors.description}
        rows={4}
      />

      <Input
        label="Lokasi"
        type="text"
        placeholder="Yogyakarta"
        value={form.location}
        onChange={(e) => setForm((p) => ({ ...p, location: e.target.value }))}
      />

      <Input
        label="Website (Opsional)"
        type="url"
        placeholder="https://perusahaan-anda.com"
        value={form.websiteUrl}
        onChange={(e) => setForm((p) => ({ ...p, websiteUrl: e.target.value }))}
        error={errors.websiteUrl}
      />

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

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
          duration={toast.type === "success" ? 2000 : 4000}
        />
      )}
    </form>
  );
}
