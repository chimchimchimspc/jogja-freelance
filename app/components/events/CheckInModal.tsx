"use client";
import { useState, useEffect } from "react";
import Modal from "../ui/Modal";
import Button from "../ui/Button";
import Toast from "../ui/Toast";
import { Input } from "../ui/Input";
import { type Event } from "../../data/events";
import { QrCode, CheckCircle } from "lucide-react";
import { eventsApi } from "../../lib/events.api";

interface CheckInModalProps {
  event: Event | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialCode?: string;
}

export default function CheckInModal({ event, isOpen, onClose, onSuccess, initialCode = "" }: CheckInModalProps) {
  const [code, setCode] = useState(initialCode);

  // Isi otomatis saat modal dibuka dari scan QR
  useEffect(() => {
    if (isOpen && initialCode) setCode(initialCode);
  }, [isOpen, initialCode]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleCheckIn = async () => {
    if (!code.trim()) {
      setError("Masukkan kode check-in");
      return;
    }
    if (!event) return;

    setLoading(true);
    setError("");
    try {
      await eventsApi.checkIn(event.id, code.toUpperCase());
      setSuccess(true);
      setTimeout(() => {
        onSuccess();
        handleClose();
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
  };

  const handleClose = () => {
    setCode("");
    setError("");
    setSuccess(false);
    onClose();
  };

  if (!event) return null;

  return (
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
            <Button onClick={handleCheckIn} loading={loading}>
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

          <div className="bg-[#F1F1F1] border-2 border-dashed border-[#CCCCCC] rounded-lg p-6 text-center">
            <QrCode className="w-10 h-10 mx-auto text-[#565A5C] mb-2" />
            <p className="text-xs text-[#565A5C]">Scan QR code atau masukkan kode manual</p>
          </div>

          <Input
            label="Kode Check-in"
            placeholder="Masukkan 10 digit kode"
            value={code}
            onChange={(e) => {
              setCode(e.target.value.toUpperCase());
              if (error) setError("");
            }}
            error={error}
            hint={`Kode ada di tiket atau tanyakan ke panitia`}
          />

          <p className="text-xs text-[#565A5C] text-center">
            💡 Contoh kode: <code className="bg-[#F1F1F1] px-2 py-1 rounded text-[#232F3E]">{event.checkInCode}</code>
          </p>
        </div>
      )}
    </Modal>
  );
}
