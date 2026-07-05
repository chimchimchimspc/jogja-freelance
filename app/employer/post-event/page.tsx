"use client";
import { useState, useRef } from "react";
import Header from "../../components/layout/Header";
import Footer from "../../components/layout/Footer";
import Toast from "../../components/ui/Toast";
import MapPicker from "../../components/ui/MapPicker";
import { CalendarDays, CheckCircle, ChevronLeft, X, Upload } from "lucide-react";
import Link from "next/link";
import { eventsApi } from "../../lib/events.api";
import { uploadsApi } from "../../lib/uploads.api";
import { useAuth } from "../../context/AuthContext";

const EVENT_TYPES = [
  { value: "workshop",     label: "Workshop" },
  { value: "meetup",       label: "Meetup" },
  { value: "coffee_chat",  label: "Coffee Chat" },
  { value: "networking",   label: "Networking" },
] as const;

interface FormData {
  title: string;
  description: string;
  type: "workshop" | "meetup" | "coffee_chat" | "networking";
  eventDate: string;
  eventTime: string;
  durationMinutes: string;
  locationName: string;
  locationAddress: string;
  attendeeLimit: string;
  isFree: boolean;
  price: string;
  registrationUrl: string;
  skills: string[];
}

const INIT: FormData = {
  title: "", description: "", type: "workshop",
  eventDate: "", eventTime: "", durationMinutes: "60",
  locationName: "", locationAddress: "",
  attendeeLimit: "30", isFree: true, price: "",
  registrationUrl: "", skills: [],
};

export default function PostEventPage() {
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [form, setForm]             = useState<FormData>(INIT);
  const [skillInput, setSkillInput] = useState("");
  const [submitted, setSubmitted]   = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast]           = useState<string | null>(null);
  const [errors, setErrors]         = useState<Partial<Record<keyof FormData, string>>>({});

  // Foto & pin lokasi
  const [photoFile, setPhotoFile]   = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string>("");
  const [photoError, setPhotoError] = useState("");
  const [lat, setLat]               = useState<number | null>(null);
  const [lng, setLng]               = useState<number | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { setPhotoError("Ukuran maksimal 5MB"); return; }
    if (!file.type.startsWith("image/")) { setPhotoError("Hanya file gambar"); return; }
    setPhotoError("");
    setPhotoFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setPhotoPreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const set = <K extends keyof FormData>(k: K, v: FormData[K]) =>
    setForm((p) => ({ ...p, [k]: v }));

  const addSkill = (skill: string) => {
    const s = skill.trim();
    if (s && !form.skills.includes(s) && form.skills.length < 6) {
      set("skills", [...form.skills, s]);
      setSkillInput("");
    }
  };

  const removeSkill = (s: string) => set("skills", form.skills.filter((x) => x !== s));

  const validate = (): boolean => {
    const e: typeof errors = {};
    if (!form.title.trim())             e.title = "Judul event wajib diisi";
    if (!form.description.trim() || form.description.length < 30)
                                        e.description = "Deskripsi minimal 30 karakter";
    if (!form.eventDate)                e.eventDate = "Tanggal event wajib diisi";
    if (!form.eventTime)                e.eventTime = "Jam event wajib diisi";
    if (!form.locationName.trim())      e.locationName = "Nama lokasi wajib diisi";
    if (!form.attendeeLimit || +form.attendeeLimit < 1) e.attendeeLimit = "Minimal 1 peserta";
    if (!form.isFree && (!form.price || +form.price < 1000)) e.price = "Isi harga tiket";
    if (!form.isFree && +form.price > 50_000_000) e.price = "Harga tiket maksimal Rp 50 juta";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    try {
      let image_url: string | undefined;
      if (photoFile) {
        const up = await uploadsApi.image(photoFile);
        image_url = up.data.url;
      }

      await eventsApi.create({
        title: form.title,
        description: form.description,
        type: form.type,
        event_date: form.eventDate,
        event_time: form.eventTime,
        duration_minutes: +form.durationMinutes,
        location_name: form.locationName,
        location_address: form.locationAddress || undefined,
        latitude: lat ?? undefined,
        longitude: lng ?? undefined,
        image_url,
        organizer_name: user?.name,
        attendee_limit: +form.attendeeLimit,
        is_free: form.isFree,
        price: form.isFree ? undefined : +form.price,
        registration_url: form.registrationUrl || undefined,
        skills: form.skills,
      });
      setSubmitted(true);
      setToast("Event berhasil diajukan! Menunggu review admin (1–2 hari kerja).");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Gagal mengajukan event. Coba lagi.";
      setToast(msg);
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <>
        <Header />
        <main className="flex-1 bg-[#F8F6FF]">
          <div className="max-w-lg mx-auto px-4 py-20 text-center">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-10 h-10 text-green-600" />
            </div>
            <h1 className="text-2xl font-bold text-[#1E1B2E] mb-3">Event Berhasil Diajukan!</h1>
            <p className="text-[#6B6880] mb-2">
              <strong className="text-[#1E1B2E]">{form.title}</strong> sedang direview oleh admin.
            </p>
            <p className="text-sm text-[#6B6880] mb-8">
              Biasanya disetujui dalam 1–2 hari kerja. Event akan tampil publik setelah disetujui.
            </p>
            <div className="flex gap-3 justify-center">
              <Link href="/employer/events" className="px-5 py-2.5 bg-[#D64545] hover:bg-[#C23B3B] text-white rounded-lg font-semibold text-sm transition-colors">
                Kembali ke Event Saya
              </Link>
              <button
                onClick={() => { setForm(INIT); setSubmitted(false); setErrors({}); }}
                className="px-5 py-2.5 border border-[#EAE6F5] text-[#1E1B2E] rounded-lg font-semibold text-sm hover:bg-white transition-colors"
              >
                Buat Event Lain
              </button>
            </div>
          </div>
        </main>
        <Footer />
        {toast && <Toast message={toast} type="success" onClose={() => setToast(null)} duration={6000} />}
      </>
    );
  }

  return (
    <>
      <Header />
      <main className="flex-1 bg-[#F8F6FF]">
        <div className="bg-white text-[#1E1B2E] py-8">
          <div className="max-w-3xl mx-auto px-4">
            <Link href="/employer/events" className="flex items-center gap-1.5 text-[#6B6880] hover:text-[#D64545] text-sm mb-4 transition-colors">
              <ChevronLeft className="w-4 h-4" /> Event Saya
            </Link>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#D64545] rounded-lg flex items-center justify-center">
                <CalendarDays className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold">Buat Event Baru</h1>
                <p className="text-[#6B6880]/60 text-sm">Isi detail event komunitas Anda</p>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-3xl mx-auto px-4 py-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="bg-white border border-[#EAE6F5] rounded-xl p-6">
              <h2 className="font-bold text-[#1E1B2E] mb-4">Informasi Dasar</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-[#1E1B2E] mb-1.5">
                    Judul Event <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={form.title}
                    onChange={(e) => set("title", e.target.value)}
                    placeholder="Contoh: Workshop Portfolio Freelance"
                    className={`w-full px-3.5 py-2.5 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D64545]/30 transition-colors ${errors.title ? "border-red-400" : "border-[#EAE6F5]"}`}
                  />
                  {errors.title && <p className="text-xs text-red-500 mt-1">{errors.title}</p>}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-[#1E1B2E] mb-1.5">
                    Tipe Event <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={form.type}
                    onChange={(e) => set("type", e.target.value as FormData["type"])}
                    className="w-full px-3.5 py-2.5 text-sm border border-[#EAE6F5] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D64545]/30 bg-white"
                  >
                    {EVENT_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-[#1E1B2E] mb-1.5">
                    Deskripsi <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={form.description}
                    onChange={(e) => set("description", e.target.value)}
                    rows={5}
                    placeholder="Jelaskan apa yang akan dibahas/dilakukan di event ini..."
                    className={`w-full px-3.5 py-2.5 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D64545]/30 resize-none transition-colors ${errors.description ? "border-red-400" : "border-[#EAE6F5]"}`}
                  />
                  <div className="flex justify-between mt-1">
                    {errors.description
                      ? <p className="text-xs text-red-500">{errors.description}</p>
                      : <span />}
                    <p className={`text-xs ml-auto ${form.description.length < 30 ? "text-[#6B6880]" : "text-green-600"}`}>
                      {form.description.length} / 30 min
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white border border-[#EAE6F5] rounded-xl p-6">
              <h2 className="font-bold text-[#1E1B2E] mb-4">Waktu & Lokasi</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-[#1E1B2E] mb-1.5">
                    Tanggal <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={form.eventDate}
                    onChange={(e) => set("eventDate", e.target.value)}
                    className={`w-full px-3.5 py-2.5 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D64545]/30 ${errors.eventDate ? "border-red-400" : "border-[#EAE6F5]"}`}
                  />
                  {errors.eventDate && <p className="text-xs text-red-500 mt-1">{errors.eventDate}</p>}
                </div>
                <div>
                  <label className="block text-sm font-semibold text-[#1E1B2E] mb-1.5">
                    Jam <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="time"
                    value={form.eventTime}
                    onChange={(e) => set("eventTime", e.target.value)}
                    className={`w-full px-3.5 py-2.5 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D64545]/30 ${errors.eventTime ? "border-red-400" : "border-[#EAE6F5]"}`}
                  />
                  {errors.eventTime && <p className="text-xs text-red-500 mt-1">{errors.eventTime}</p>}
                </div>
                <div>
                  <label className="block text-sm font-semibold text-[#1E1B2E] mb-1.5">Durasi (menit)</label>
                  <input
                    type="number"
                    value={form.durationMinutes}
                    onChange={(e) => set("durationMinutes", e.target.value)}
                    min={15}
                    className="w-full px-3.5 py-2.5 text-sm border border-[#EAE6F5] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D64545]/30"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-[#1E1B2E] mb-1.5">
                    Kuota Peserta <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    value={form.attendeeLimit}
                    onChange={(e) => set("attendeeLimit", e.target.value)}
                    min={1}
                    className={`w-full px-3.5 py-2.5 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D64545]/30 ${errors.attendeeLimit ? "border-red-400" : "border-[#EAE6F5]"}`}
                  />
                  {errors.attendeeLimit && <p className="text-xs text-red-500 mt-1">{errors.attendeeLimit}</p>}
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm font-semibold text-[#1E1B2E] mb-1.5">
                    Nama Lokasi <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={form.locationName}
                    onChange={(e) => set("locationName", e.target.value)}
                    placeholder="Contoh: Co-working Space Jogja"
                    className={`w-full px-3.5 py-2.5 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D64545]/30 ${errors.locationName ? "border-red-400" : "border-[#EAE6F5]"}`}
                  />
                  {errors.locationName && <p className="text-xs text-red-500 mt-1">{errors.locationName}</p>}
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm font-semibold text-[#1E1B2E] mb-1.5">Alamat Lengkap</label>
                  <input
                    type="text"
                    value={form.locationAddress}
                    onChange={(e) => set("locationAddress", e.target.value)}
                    placeholder="Alamat lengkap lokasi (opsional)"
                    className="w-full px-3.5 py-2.5 text-sm border border-[#EAE6F5] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D64545]/30"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm font-semibold text-[#1E1B2E] mb-2">Pin Lokasi di Peta</label>
                  <MapPicker latitude={lat} longitude={lng} onChange={(la, lo) => { setLat(la); setLng(lo); }} />
                </div>
              </div>
            </div>

            {/* Foto event */}
            <div className="bg-white border border-[#EAE6F5] rounded-xl p-6">
              <h2 className="font-bold text-[#1E1B2E] mb-1">Foto Event</h2>
              <p className="text-xs text-[#6B6880] mb-4">Foto akan tampil di kartu & halaman detail event (opsional).</p>
              <div className="flex items-start gap-4">
                {photoPreview ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={photoPreview} alt="Preview" className="w-32 h-20 rounded-lg object-cover border border-[#EAE6F5]" />
                ) : (
                  <div className="w-32 h-20 rounded-lg bg-[#F8F6FF] border-2 border-dashed border-[#D5D0E8] flex items-center justify-center text-2xl">
                    📷
                  </div>
                )}
                <div className="flex-1">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-2 px-4 py-2 bg-[#F8F6FF] border border-[#EAE6F5] rounded-lg cursor-pointer hover:bg-[#EAE6F5] transition-colors text-sm font-semibold text-[#1E1B2E]"
                  >
                    <Upload className="w-4 h-4" /> Pilih Foto
                  </button>
                  <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                  <p className="text-xs text-[#6B6880] mt-2">Max 5MB. Format: JPG, PNG, WebP</p>
                  {photoError && <p className="text-xs text-red-500 mt-1">{photoError}</p>}
                </div>
              </div>
            </div>

            <div className="bg-white border border-[#EAE6F5] rounded-xl p-6">
              <h2 className="font-bold text-[#1E1B2E] mb-1">Skill yang Relevan</h2>
              <p className="text-xs text-[#6B6880] mb-4">Maksimal 6 skill, opsional.</p>
              <div className="flex gap-2 mb-3">
                <input
                  type="text"
                  value={skillInput}
                  onChange={(e) => setSkillInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addSkill(skillInput); } }}
                  placeholder="Ketik skill lalu Enter..."
                  className="flex-1 px-3.5 py-2 text-sm border border-[#EAE6F5] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D64545]/30"
                  disabled={form.skills.length >= 6}
                />
                <button
                  type="button"
                  onClick={() => addSkill(skillInput)}
                  className="px-4 py-2 bg-[#D64545] text-white text-sm rounded-lg hover:bg-[#C23B3B] transition-colors disabled:opacity-40"
                  disabled={form.skills.length >= 6}
                >
                  Tambah
                </button>
              </div>
              {form.skills.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {form.skills.map((s) => (
                    <span key={s} className="flex items-center gap-1.5 text-xs bg-[#F3F0FB] text-[#D64545] px-2.5 py-1 rounded-full">
                      {s}
                      <button type="button" onClick={() => removeSkill(s)}>
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-white border border-[#EAE6F5] rounded-xl p-6">
              <h2 className="font-bold text-[#1E1B2E] mb-4">Tiket</h2>
              <div className="flex flex-col gap-3">
                <label className="flex items-center gap-3 cursor-pointer">
                  <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-colors ${form.isFree ? "border-[#D64545] bg-[#D64545]" : "border-[#D5D0E8]"}`}>
                    {form.isFree && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                  </div>
                  <input type="radio" className="sr-only" checked={form.isFree} onChange={() => set("isFree", true)} />
                  <span className="text-sm text-[#1E1B2E]">Gratis</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-colors ${!form.isFree ? "border-[#D64545] bg-[#D64545]" : "border-[#D5D0E8]"}`}>
                    {!form.isFree && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                  </div>
                  <input type="radio" className="sr-only" checked={!form.isFree} onChange={() => set("isFree", false)} />
                  <span className="text-sm text-[#1E1B2E]">Berbayar</span>
                </label>
                {!form.isFree && (
                  <div>
                    <input
                      type="number"
                      value={form.price}
                      onChange={(e) => set("price", e.target.value)}
                      placeholder="Harga tiket (Rp)"
                      min={1000}
                      className={`w-full px-3.5 py-2.5 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D64545]/30 ${errors.price ? "border-red-400" : "border-[#EAE6F5]"}`}
                    />
                    {errors.price && <p className="text-xs text-red-500 mt-1">{errors.price}</p>}
                  </div>
                )}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 justify-end">
              <Link
                href="/employer/events"
                className="px-6 py-2.5 border border-[#EAE6F5] text-[#1E1B2E] rounded-lg font-semibold text-sm hover:bg-white transition-colors text-center"
              >
                Batal
              </Link>
              <button
                type="submit"
                disabled={submitting}
                className="px-8 py-2.5 bg-[#D64545] hover:bg-[#C23B3B] text-white rounded-lg font-bold text-sm transition-colors disabled:opacity-60"
              >
                {submitting ? "Mengajukan..." : "Ajukan Event"}
              </button>
            </div>
          </form>
        </div>
      </main>
      <Footer />
      {toast && <Toast message={toast} type="success" onClose={() => setToast(null)} duration={6000} />}
    </>
  );
}
