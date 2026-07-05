"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../context/AuthContext";
import Modal from "../ui/Modal";
import Button from "../ui/Button";
import { Input } from "../ui/Input";

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: object) => void;
          renderButton: (el: HTMLElement, options: object) => void;
        };
      };
    };
  }
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48">
      <path fill="#FFC107" d="M43.6 20.1H42V20H24v8h11.3c-1.6 4.7-6.1 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3l5.7-5.7C34 6.1 29.3 4 24 4 13 4 4 13 4 24s9 20 20 20 20-9 20-20c0-1.3-.1-2.6-.4-3.9z"/>
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.9 1.2 8 3l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/>
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z"/>
      <path fill="#1976D2" d="M43.6 20.1H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C41.4 34.9 44 29.9 44 24c0-1.3-.1-2.6-.4-3.9z"/>
    </svg>
  );
}

interface GoogleLoginButtonProps {
  redirectTo?: string;
  onError?: (message: string) => void;
}

export default function GoogleLoginButton({ redirectTo = "/", onError }: GoogleLoginButtonProps) {
  const router = useRouter();
  const { loginWithGoogle } = useAuth();
  const btnRef = useRef<HTMLDivElement>(null);
  const [scriptReady, setScriptReady] = useState(false);

  // Mode demo (tanpa Client ID)
  const [showDemo, setShowDemo] = useState(false);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [demoError, setDemoError] = useState("");
  const [loading, setLoading] = useState(false);

  // === Mode asli: muat Google Identity Services & render tombol resmi ===
  useEffect(() => {
    if (!GOOGLE_CLIENT_ID) return;
    if (window.google?.accounts) {
      setScriptReady(true);
      return;
    }
    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.onload = () => setScriptReady(true);
    document.head.appendChild(script);
  }, []);

  useEffect(() => {
    if (!scriptReady || !btnRef.current || !window.google || !GOOGLE_CLIENT_ID) return;
    window.google.accounts.id.initialize({
      client_id: GOOGLE_CLIENT_ID,
      callback: async (response: { credential: string }) => {
        try {
          await loginWithGoogle({ credential: response.credential });
          router.push(redirectTo);
        } catch (err: unknown) {
          onError?.(err instanceof Error ? err.message : "Login Google gagal. Coba lagi.");
        }
      },
    });
    window.google.accounts.id.renderButton(btnRef.current, {
      theme: "outline", size: "large",
      width: btnRef.current.offsetWidth || 320,
      text: "continue_with", locale: "id",
    });
  }, [scriptReady, loginWithGoogle, router, redirectTo, onError]);

  // === Mode demo: submit email → langsung masuk ===
  const handleDemoSubmit = async () => {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setDemoError("Format email tidak valid");
      return;
    }
    setDemoError("");
    setLoading(true);
    try {
      await loginWithGoogle({ email, name: name || undefined });
      setShowDemo(false);
      router.push(redirectTo);
    } catch (err: unknown) {
      setDemoError(err instanceof Error ? err.message : "Login gagal. Coba lagi.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="flex items-center gap-3 my-4">
        <div className="flex-1 border-t border-[#E7E7E7]" />
        <span className="text-xs text-[#565A5C]">atau</span>
        <div className="flex-1 border-t border-[#E7E7E7]" />
      </div>

      {GOOGLE_CLIENT_ID ? (
        <div ref={btnRef} className="flex justify-center" />
      ) : (
        <button
          type="button"
          onClick={() => setShowDemo(true)}
          className="w-full flex items-center justify-center gap-3 py-2.5 px-4 border border-[#DADCE0] rounded-lg bg-white hover:bg-[#F8F9FA] hover:shadow-sm transition-all text-sm font-semibold text-[#3C4043]"
        >
          <GoogleIcon />
          Lanjutkan dengan Google
        </button>
      )}

      {/* Dialog email ala Google (mode demo) */}
      <Modal isOpen={showDemo} onClose={() => setShowDemo(false)} title="Masuk dengan Google" size="sm">
        <div className="flex items-center gap-2 mb-4">
          <GoogleIcon />
          <p className="text-sm text-[#565A5C]">Gunakan Akun Google Anda</p>
        </div>
        <Input
          label="Email Google"
          type="email"
          placeholder="kamu@gmail.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={demoError}
        />
        <Input
          label="Nama (Opsional)"
          type="text"
          placeholder="Nama lengkap Anda"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <Button fullWidth size="lg" loading={loading} onClick={handleDemoSubmit}>
          Lanjutkan
        </Button>
      </Modal>
    </div>
  );
}
