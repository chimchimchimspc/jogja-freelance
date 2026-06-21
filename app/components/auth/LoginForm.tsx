"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "../ui/Input";
import Button from "../ui/Button";
import Toast from "../ui/Toast";
import Link from "next/link";
import { useAuth, DUMMY_USER } from "../../context/AuthContext";

interface FormData {
  email: string;
  password: string;
}

interface FormErrors {
  [key: string]: string;
}

export default function LoginForm() {
  const router = useRouter();
  const { login } = useAuth();
  const [form, setForm] = useState<FormData>({
    email: "",
    password: "",
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const validate = (): boolean => {
    const newErrors: FormErrors = {};

    if (!form.email) newErrors.email = "Email diperlukan";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) newErrors.email = "Format email tidak valid";

    if (!form.password) newErrors.password = "Password diperlukan";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      await login(form.email, form.password);
      setToast({ message: "Berhasil masuk! Redirecting...", type: "success" });
      setTimeout(() => router.push("/"), 1500);
    } catch (err) {
      setToast({ message: "Email atau password salah.", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-xs text-blue-900">
          <strong>Demo Account:</strong> {DUMMY_USER.email} / {DUMMY_USER.password}
        </p>
      </div>

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
        <p className="text-center text-sm text-[#565A5C] mb-3">
          Belum memiliki akun?
        </p>
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
