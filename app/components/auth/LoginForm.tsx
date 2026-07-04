"use client";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Input } from "../ui/Input";
import Button from "../ui/Button";
import Toast from "../ui/Toast";
import Link from "next/link";
import { useAuth } from "../../context/AuthContext";

export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect") || "/";
  const { login } = useAuth();
  const [form, setForm] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.email) e.email = "Email diperlukan";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = "Format email tidak valid";
    if (!form.password) e.password = "Password diperlukan";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      await login(form.email, form.password);
      setToast({ message: "Berhasil masuk! Mengarahkan...", type: "success" });
      setTimeout(() => router.push(redirectTo), 1200);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Email atau password salah.";
      setToast({ message: msg, type: "error" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {redirectTo !== "/" && (
        <div className="mb-4 p-3 bg-[#FFF5F5] border border-[#D64545]/30 rounded-lg text-sm text-[#D64545] text-center">
          Silakan masuk terlebih dahulu untuk melanjutkan
        </div>
      )}
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Email"
          type="email"
          placeholder="kamu@example.com"
          value={form.email}
          onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
          error={errors.email}
        />

        <div>
          <Input
            label="Password"
            type="password"
            placeholder="Masukkan password Anda"
            value={form.password}
            onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
            error={errors.password}
          />
          <Link href="#" className="text-xs text-[#D64545] hover:underline">
            Lupa password?
          </Link>
        </div>

        <Button type="submit" fullWidth size="lg" loading={loading}>
          Masuk
        </Button>

        {toast && (
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={() => setToast(null)}
            duration={toast.type === "success" ? 2000 : 4000}
          />
        )}
      </form>

      <div className="mt-6 pt-6 border-t border-[#E7E7E7]">
        <p className="text-center text-sm text-[#565A5C] mb-3">Belum memiliki akun?</p>
        <Link
          href="/auth/register"
          className="w-full inline-flex items-center justify-center bg-[#F1F1F1] hover:bg-[#E7E7E7] text-[#232F3E] font-semibold py-3 px-4 rounded-lg transition-colors"
        >
          Buat Akun Baru
        </Link>
      </div>
    </>
  );
}
