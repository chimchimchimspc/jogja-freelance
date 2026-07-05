"use client";
import dynamic from "next/dynamic";
import { MapPin, X } from "lucide-react";

// react-leaflet tidak bisa di-render di server
const MapPickerInner = dynamic(() => import("./MapPickerInner"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-[#F1F1F1] rounded-lg">
      <p className="text-sm text-[#6B6880]">Memuat peta…</p>
    </div>
  ),
});

interface MapPickerProps {
  latitude: number | null;
  longitude: number | null;
  onChange: (lat: number | null, lng: number | null) => void;
  height?: number;
}

export default function MapPicker({ latitude, longitude, onChange, height = 280 }: MapPickerProps) {
  const hasPin = latitude != null && longitude != null;
  return (
    <div>
      <div style={{ height }} className="w-full border border-[#EAE6F5] rounded-lg overflow-hidden">
        <MapPickerInner latitude={latitude} longitude={longitude} onChange={(lat, lng) => onChange(lat, lng)} />
      </div>
      <div className="flex items-center justify-between mt-2">
        <p className="text-xs text-[#6B6880] flex items-center gap-1">
          <MapPin className="w-3.5 h-3.5 text-[#D64545]" />
          {hasPin
            ? `Pin: ${latitude!.toFixed(5)}, ${longitude!.toFixed(5)}`
            : "Klik pada peta untuk menandai lokasi"}
        </p>
        {hasPin && (
          <button
            type="button"
            onClick={() => onChange(null, null)}
            className="text-xs text-[#DC2C1E] hover:underline flex items-center gap-0.5"
          >
            <X className="w-3 h-3" /> Hapus pin
          </button>
        )}
      </div>
    </div>
  );
}
