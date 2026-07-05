"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input, Checkbox } from "../ui/Input";
import Button from "../ui/Button";
import Toast from "../ui/Toast";
import Link from "next/link";
import { useAuth } from "../../context/AuthContext";
import { Briefcase, Code2 } from "lucide-react";
import GoogleLoginButton from "./GoogleLoginButton";

const SKILL_OPTIONS = [
  "Web Development", "UI/UX Design", "Content Writing",
  "Video Editing", "Social Media", "Logo Design",
  "Mobile Development", "Photography",
];

type RoleType = "freelancer" | "employer";

const ROLES: { value: RoleType; label: string; desc: string; icon: React.ReactNode }[] = [
  {
    value: "freelancer",
    label: "Freelancer",
    desc: "Cari & lamar pekerjaan freelance",
    icon: <Code2 className="w-5 h-5" />,
  },
  {
    value: "employer",
    label: "Pembuat Lowongan & Event",
    desc: "Pasang lowongan, cari freelancer & buat event komunitas",
    icon: <Briefcase className="w-5 h-5" />,
  },
];

export default function RegisterForm() {
  const router = useRouter();
  const { register } = useAuth();
  const [role, setRole] = useState<RoleType>("freelancer");
  const [form, setForm] = useState({
    email: "", password: "", confirmPassword: "",
    fullName: "", city: "Yogyakarta",
    companyName: "",
    skills: [] as string[], agreeTerms: false,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.email) e.email = "Email diperlukan";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = "Format email tidak valid";
    if (!form.password) e.password = "Password diperlukan";
    else if (form.password.length < 8) e.password = "Password minimal 8 karakter";
    if (form.password !== form.confirmPassword) e.confirmPassword = "Password tidak cocok";
    if (!form.fullName || form.fullName.length < 3) e.fullName = "Nama minimal 3 karakter";
    if (role === "employer" && !form.companyName.trim()) e.companyName = "Nama perusahaan wajib diisi";
    if (role === "freelancer" && form.skills.length === 0) e.skills = "Pilih minimal 1 skill";
    if (role === "freelancer" && form.skills.length > 5) e.skills = "Maksimal 5 skill";
    if (!form.agreeTerms) e.agreeTerms = "Setuju dengan syarat dan ketentuan";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      await register({
        email: form.email,
        password: form.password,
        full_name: form.fullName,
        role,
        city: form.city,
        skills: role === "freelancer" ? form.skills : [],
        company_name: role === "employer" ? form.companyName : undefined,
      });
      setToast({ message: "Akun berhasil dibuat! Melanjutkan...", type: "success" });
      const redirect = role === "employer" ? "/employer" : "/auth/profile-setup";
      setTimeout(() => router.push(redirect), 1500);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Terjadi kesalahan. Coba lagi.";
      setToast({ message: msg, type: "error" });
    } finally {
      setLoading(false);
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

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Role selection */}
      <div className="mb-2">
        <label className="block text-sm font-semibold mb-2 text-[#232F3E]">Daftar sebagai</label>
        <div className="flex flex-col gap-2">
          {ROLES.map((r) => (
            <label
              key={r.value}
              className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-colors ${
                role === r.value
                  ? "border-[#D64545] bg-[#FFF5F5]"
                  : "border-[#E7E7E7] hover:border-[#D64545]/40"
              }`}
            >
              <input
                type="radio"
                name="role"
                value={r.value}
                checked={role === r.value}
                onChange={() => setRole(r.value)}
                className="sr-only"
              />
              <span className={`${role === r.value ? "text-[#D64545]" : "text-[#565A5C]"}`}>
                {r.icon}
              </span>
              <div className="flex-1">
                <p className={`text-sm font-semibold ${role === r.value ? "text-[#D64545]" : "text-[#232F3E]"}`}>
                  {r.label}
                </p>
                <p className="text-xs text-[#565A5C]">{r.desc}</p>
              </div>
              <div
                className={`w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-colors ${
                  role === r.value ? "border-[#D64545] bg-[#D64545]" : "border-[#D5D0E8]"
                }`}
              >
                {role === r.value && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
              </div>
            </label>
          ))}
        </div>
      </div>

      <Input label="Email" type="email" placeholder="kamu@example.com"
        value={form.email} onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
        error={errors.email} />

      <Input label="Nama Lengkap" type="text" placeholder="Nama Anda"
        value={form.fullName} onChange={(e) => setForm((p) => ({ ...p, fullName: e.target.value }))}
        error={errors.fullName} />

      {role === "employer" && (
        <Input label="Nama Perusahaan / Studio" type="text" placeholder="Contoh: Studio Kreatif Batik"
          value={form.companyName} onChange={(e) => setForm((p) => ({ ...p, companyName: e.target.value }))}
          error={errors.companyName} />
      )}

      <Input label="Password" type="password" placeholder="Minimal 8 karakter"
        value={form.password} onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
        error={errors.password} />

      <Input label="Konfirmasi Password" type="password" placeholder="Masukkan ulang password"
        value={form.confirmPassword} onChange={(e) => setForm((p) => ({ ...p, confirmPassword: e.target.value }))}
        error={errors.confirmPassword} />

      {role === "freelancer" && (
        <div className="mb-6">
          <label className="block text-sm font-semibold mb-2 text-[#232F3E]">Pilih Skill (1-5)</label>
          <div className="grid grid-cols-2 gap-2">
            {SKILL_OPTIONS.map((skill) => (
              <label key={skill} className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.skills.includes(skill)}
                  onChange={() => toggleSkill(skill)} className="w-4 h-4 accent-[#E8B4D1]" />
                <span className="text-sm text-[#232F3E]">{skill}</span>
              </label>
            ))}
          </div>
          {errors.skills && <span className="block text-xs text-[#DC2C1E] mt-2">{errors.skills}</span>}
          <span className="block text-xs text-[#565A5C] mt-2">{form.skills.length} skill dipilih</span>
        </div>
      )}

      <Checkbox label="Saya setuju dengan Syarat & Ketentuan"
        checked={form.agreeTerms} onChange={(v) => setForm((p) => ({ ...p, agreeTerms: v }))} />
      {errors.agreeTerms && <span className="block text-xs text-[#DC2C1E]">{errors.agreeTerms}</span>}

      <Button type="submit" fullWidth size="lg" loading={loading}>
        Daftar Akun
      </Button>

      {role === "freelancer" && (
        <GoogleLoginButton
          redirectTo="/auth/profile-setup"
          onError={(msg) => setToast({ message: msg, type: "error" })}
        />
      )}

      <p className="text-center text-sm text-[#565A5C]">
        Sudah punya akun?{" "}
        <Link href="/auth/login" className="text-[#D64545] font-semibold hover:underline">
          Masuk di sini
        </Link>
      </p>

      {toast && (
        <Toast message={toast.message} type={toast.type}
          onClose={() => setToast(null)} duration={toast.type === "success" ? 2000 : 4000} />
      )}
    </form>
  );
}
