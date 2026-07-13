"use client";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Modal from "../ui/Modal";
import Button from "../ui/Button";
import { Input } from "../ui/Input";
import { type Event } from "../../data/events";
import { ScanLine, CheckCircle, Loader2 } from "lucide-react";
import { eventsApi } from "../../lib/events.api";
import QRScanner from "./QRScanner";

interface CheckInModalProps {
  event: Event | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialCode?: string;
}

/**
 * Ambil kode check-in dari hasil scan QR.
 * QR pengelola berisi URL "/events/{id}?checkin=KODE", tapi terima juga
 * QR yang berisi kode mentah.
 */
function parseScan(text: string): { code: string; eventId?: string } {
  try {
    const url = new URL(text);
    const code = url.searchParams.get("checkin") ?? "";
    const m = url.pathname.match(/\/events\/([0-9a-f-]{36})/i);
    return { code: code.toUpperCase(), eventId: m?.[1] };
  } catch {
    return { code: text.trim().toUpperCase() };
  }
}

export default function CheckInModal({ event, isOpen, onClose, onSuccess, initialCode = "" }: CheckInModalProps) {
  const router = useRouter();
  const [code, setCode] = useState(initialCode);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [scanning, setScanning] = useState(false);

  // Isi otomatis saat modal dibuka dari scan QR / URL ?checkin=
  useEffect(() => {
    if (isOpen && initialCode) setCode(initialCode);
  }, [isOpen, initialCode]);

  const doCheckIn = useCallback(async (checkCode: string) => {
    if (!checkCode.trim()) {
      setError("Masukkan kode check-in");
      return;
    }
    if (!event) return;

    setLoading(true);
    setError("");
    try {
      await eventsApi.checkIn(event.id, checkCode.toUpperCase());
      setSuccess(true);
      setTimeout(() => {
        onSuccess();
        setCode("");
        setError("");
        setSuccess(false);
        onClose();
      }, 2000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Check-in gagal. Coba lagi.";
      setError(
        msg.includes("Invalid check-in code") ? "Kode tidak sesuai. Coba lagi."
        : msg.includes("Not RSVPd") ? "Anda belum RSVP ke event ini."
        : msg
      );
    } finally {
      setLoading(false);
    }
  }, [event, onClose, onSuccess]);

  const handleScanResult = (text: string) => {
    setScanning(false);
    const { code: scanned, eventId } = parseScan(text);

    // QR milik event lain → pindah ke halaman event tersebut (auto check-in di sana)
    if (eventId && event && eventId !== event.id) {
      router.push(`/events/${eventId}?checkin=${encodeURIComponent(scanned)}`);
      return;
    }
    if (!scanned) {
      setError("QR tidak berisi kode check-in. Coba scan ulang.");
      return;
    }
    setCode(scanned);
    // langsung check-in tanpa perlu klik konfirmasi lagi
    doCheckIn(scanned);
  };

  const handleClose = () => {
    setCode("");
    setError("");
    setSuccess(false);
    setScanning(false);
    onClose();
  };

  if (!event) return null;

  return (
    <>
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={success ? "Check-in Berhasil!" : "Check-in Event"}
      size="sm"
      footer={
        !success && (
          <>
            <Button variant="secondary" onClick={handleClose}>
              Batal
            </Button>
            <Button onClick={() => doCheckIn(code)} loading={loading}>
              Konfirmasi
            </Button>
          </>
        )
      }
    >
      {success ? (
        <div className="text-center py-6">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-[#12A54D]" />
          </div>
          <h3 className="text-lg font-bold text-[#232F3E] mb-1">Selamat!</h3>
          <p className="text-sm text-[#565A5C] mb-3">
            Check-in untuk <strong>{event.title}</strong> berhasil
          </p>
          <p className="text-xs text-[#D64545] font-semibold">
            🎤 Badge "Event Attendee" langsung masuk ke profilmu!
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm font-semibold text-[#232F3E] mb-1">{event.title}</p>
            <p className="text-xs text-[#565A5C]">{event.location}</p>
          </div>

          <button
            type="button"
            onClick={() => { setError(""); setScanning(true); }}
            disabled={loading}
            className="w-full bg-[#1E1B2E] hover:bg-[#2c2842] text-white rounded-lg p-5 text-center transition-colors disabled:opacity-60"
          >
            {loading ? (
              <Loader2 className="w-8 h-8 mx-auto mb-2 animate-spin" />
            ) : (
              <ScanLine className="w-8 h-8 mx-auto mb-2 text-[#D64545]" />
            )}
            <p className="text-sm font-bold">Scan QR dari Pengelola</p>
            <p className="text-[11px] text-white/60 mt-0.5">Pakai kamera HP atau webcam laptop</p>
          </button>

          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-[#E7E7E7]" />
            <span className="text-[11px] text-[#565A5C]">atau isi manual</span>
            <div className="flex-1 h-px bg-[#E7E7E7]" />
          </div>

          <Input
            label="Kode Check-in"
            placeholder="Contoh: A3K7ZP"
            value={code}
            onChange={(e) => {
              setCode(e.target.value.toUpperCase());
              if (error) setError("");
            }}
            error={error}
            hint="Kode ada di layar pengelola atau tanyakan ke panitia"
          />
        </div>
      )}
    </Modal>

    <QRScanner
      isOpen={scanning}
      onClose={() => setScanning(false)}
      onResult={handleScanResult}
    />
    </>
  );
}
