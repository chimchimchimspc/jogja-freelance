"use client";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { X, CameraOff, Loader2, ScanLine } from "lucide-react";
import jsQR from "jsqr";

interface QRScannerProps {
  isOpen: boolean;
  onClose: () => void;
  /** Dipanggil sekali saat QR terbaca — berisi teks mentah dari QR */
  onResult: (text: string) => void;
}

/**
 * Scanner QR via kamera browser (getUserMedia + jsQR).
 * Bekerja di kamera HP (belakang) maupun webcam laptop — butuh HTTPS/localhost.
 * Dirender lewat portal supaya overlay fullscreen tidak terganggu transform ancestor.
 */
export default function QRScanner({ isOpen, onClose, onResult }: QRScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number>(0);
  const doneRef = useRef(false);
  const [error, setError] = useState<string | null>(null);
  const [starting, setStarting] = useState(true);

  useEffect(() => {
    if (!isOpen) return;
    doneRef.current = false;
    setError(null);
    setStarting(true);

    let cancelled = false;

    const stop = () => {
      cancelAnimationFrame(rafRef.current);
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    };

    const tick = () => {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (video && canvas && video.readyState === video.HAVE_ENOUGH_DATA && !doneRef.current) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext("2d", { willReadFrequently: true });
        if (ctx) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const qr = jsQR(imageData.data, imageData.width, imageData.height, {
            inversionAttempts: "dontInvert",
          });
          if (qr?.data) {
            doneRef.current = true;
            stop();
            onResult(qr.data);
            return;
          }
        }
      }
      rafRef.current = requestAnimationFrame(tick);
    };

    (async () => {
      try {
        if (!navigator.mediaDevices?.getUserMedia) {
          throw new Error("NO_CAMERA_API");
        }
        // "environment" = kamera belakang di HP; di laptop otomatis pakai webcam
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: "environment" } },
          audio: false,
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        const video = videoRef.current;
        if (video) {
          video.srcObject = stream;
          await video.play();
        }
        setStarting(false);
        rafRef.current = requestAnimationFrame(tick);
      } catch (e: unknown) {
        if (cancelled) return;
        setStarting(false);
        const name = e instanceof DOMException ? e.name : e instanceof Error ? e.message : "";
        if (name === "NotAllowedError") {
          setError("Izin kamera ditolak. Izinkan akses kamera di pengaturan browser, lalu coba lagi.");
        } else if (name === "NotFoundError" || name === "NO_CAMERA_API") {
          setError("Kamera tidak ditemukan di perangkat ini. Masukkan kode secara manual saja.");
        } else if (name === "NotReadableError") {
          setError("Kamera sedang dipakai aplikasi lain. Tutup aplikasi itu lalu coba lagi.");
        } else {
          setError("Gagal membuka kamera. Pastikan situs diakses lewat HTTPS, lalu coba lagi.");
        }
      }
    })();

    return () => {
      cancelled = true;
      stop();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  if (!isOpen || typeof document === "undefined") return null;

  return createPortal(
    <div className="fixed inset-0 z-[70] bg-black flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 text-white flex-shrink-0">
        <p className="font-bold flex items-center gap-2">
          <ScanLine className="w-5 h-5 text-[#D64545]" /> Scan QR Check-in
        </p>
        <button
          onClick={onClose}
          className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          aria-label="Tutup scanner"
        >
          <X className="w-6 h-6" />
        </button>
      </div>

      {/* Area kamera */}
      <div className="flex-1 relative overflow-hidden">
        {error ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-8">
            <CameraOff className="w-12 h-12 text-white/40 mb-4" />
            <p className="text-sm text-white/80 max-w-sm">{error}</p>
            <button
              onClick={onClose}
              className="mt-6 px-5 py-2.5 bg-white text-[#1E1B2E] rounded-lg text-sm font-bold"
            >
              Tutup & Isi Manual
            </button>
          </div>
        ) : (
          <>
            <video
              ref={videoRef}
              className="absolute inset-0 w-full h-full object-cover"
              playsInline
              muted
            />
            {starting && (
              <div className="absolute inset-0 flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-white animate-spin" />
              </div>
            )}
            {/* Bingkai target scan */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-64 h-64 rounded-2xl border-2 border-white/80 shadow-[0_0_0_9999px_rgba(0,0,0,0.5)]" />
            </div>
            <p className="absolute bottom-8 inset-x-0 text-center text-sm text-white/80 px-6">
              Arahkan kamera ke QR code dari pengelola event
            </p>
          </>
        )}
      </div>

      <canvas ref={canvasRef} className="hidden" />
    </div>,
    document.body
  );
}
