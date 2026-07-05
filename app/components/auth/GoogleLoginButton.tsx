"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../context/AuthContext";

// Tipe data hasil decode kredensial (JWT) dari Google
interface GoogleJwtPayload {
  sub: string;
  name: string;
  email: string;
  picture?: string;
}

// Decode payload JWT tanpa verifikasi (cukup untuk demo sisi client).
function decodeJwt(token: string): GoogleJwtPayload | null {
  try {
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const json = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    return JSON.parse(json);
  } catch {
    return null;
  }
}

// Deklarasi global untuk objek google yang disuntikkan oleh script GIS
declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string;
            callback: (response: { credential: string }) => void;
          }) => void;
          renderButton: (
            parent: HTMLElement,
            options: Record<string, unknown>
          ) => void;
        };
      };
    };
  }
}

const CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

export default function GoogleLoginButton() {
  const router = useRouter();
  const { loginWithGoogle } = useAuth();
  const buttonRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!CLIENT_ID) {
      setError(
        "Google Client ID belum diatur. Isi NEXT_PUBLIC_GOOGLE_CLIENT_ID di file .env.local"
      );
      return;
    }

    const handleCredential = async (response: { credential: string }) => {
      const payload = decodeJwt(response.credential);
      if (!payload) {
        setError("Gagal membaca data akun Google. Coba lagi.");
        return;
      }
      try {
        // Kirim kredensial ke backend agar akun tersimpan di database.
        await loginWithGoogle(response.credential);
        router.push("/");
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Gagal login dengan Google."
        );
      }
    };

    const initialize = () => {
      if (!window.google || !buttonRef.current) return;
      window.google.accounts.id.initialize({
        client_id: CLIENT_ID,
        callback: handleCredential,
      });
      window.google.accounts.id.renderButton(buttonRef.current, {
        theme: "outline",
        size: "large",
        width: 320,
        text: "continue_with",
        shape: "rectangular",
        logo_alignment: "left",
      });
    };

    // Muat script Google Identity Services sekali saja
    const existing = document.getElementById("google-gsi-script");
    if (existing) {
      initialize();
      return;
    }

    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.id = "google-gsi-script";
    script.async = true;
    script.defer = true;
    script.onload = initialize;
    script.onerror = () => setError("Gagal memuat layanan Google.");
    document.body.appendChild(script);
  }, [loginWithGoogle, router]);

  return (
    <div className="w-full">
      <div ref={buttonRef} className="flex justify-center" />
      {error && (
        <p className="text-xs text-[#DC2C1E] text-center mt-2">{error}</p>
      )}
    </div>
  );
}
