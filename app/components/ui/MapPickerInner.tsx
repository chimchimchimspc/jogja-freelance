"use client";
import { useMemo } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import L from "leaflet";

interface MapPickerInnerProps {
  latitude: number | null;
  longitude: number | null;
  onChange: (lat: number, lng: number) => void;
}

// Pusat default: Titik Nol Km Yogyakarta
const DEFAULT_CENTER: [number, number] = [-7.8014, 110.3647];

function ClickHandler({ onChange }: { onChange: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      // wrap() menjaga longitude tetap di rentang -180..180
      // meskipun peta di-drag melewati batas dunia
      const p = e.latlng.wrap();
      onChange(Number(p.lat.toFixed(7)), Number(p.lng.toFixed(7)));
    },
  });
  return null;
}

export default function MapPickerInner({ latitude, longitude, onChange }: MapPickerInnerProps) {
  const markerIcon = useMemo(
    () =>
      new L.Icon({
        iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
        iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
        shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        shadowSize: [41, 41],
      }),
    []
  );

  const hasPin = latitude != null && longitude != null;

  return (
    <MapContainer
      center={hasPin ? [latitude!, longitude!] : DEFAULT_CENTER}
      zoom={13}
      scrollWheelZoom={false}
      style={{ height: "100%", width: "100%", borderRadius: "0.5rem" }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <ClickHandler onChange={onChange} />
      {hasPin && <Marker position={[latitude!, longitude!]} icon={markerIcon} />}
    </MapContainer>
  );
}
