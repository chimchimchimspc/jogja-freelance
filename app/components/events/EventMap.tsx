"use client";
import dynamic from "next/dynamic";
import { useMemo } from "react";
import type { MapContainerProps, TileLayerProps, MarkerProps, PopupProps } from "react-leaflet";
import type { Event } from "../../data/events";

const MapContainer = dynamic<MapContainerProps>(
  () => import("react-leaflet").then((mod) => mod.MapContainer),
  { ssr: false }
);
const TileLayer = dynamic<TileLayerProps>(
  () => import("react-leaflet").then((mod) => mod.TileLayer),
  { ssr: false }
);
const Marker = dynamic<MarkerProps>(
  () => import("react-leaflet").then((mod) => mod.Marker),
  { ssr: false }
);
const Popup = dynamic<PopupProps>(
  () => import("react-leaflet").then((mod) => mod.Popup),
  { ssr: false }
);

interface EventMapProps {
  event: Event;
}

export default function EventMap({ event }: EventMapProps) {
  // Initialize marker dynamically to avoid SSR issues
  const markerIcon = useMemo(() => {
    if (typeof window === "undefined") return null;

    const L = require("leaflet");
    return new L.Icon({
      iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
      iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
      shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowSize: [41, 41],
    });
  }, []);

  return (
    <MapContainer
      center={[event.latitude, event.longitude] as [number, number]}
      zoom={15}
      scrollWheelZoom={false}
      style={{ height: "100%", width: "100%", borderRadius: "0.5rem" }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {markerIcon && (
        <Marker position={[event.latitude, event.longitude] as [number, number]} icon={markerIcon}>
          <Popup>{event.location}</Popup>
        </Marker>
      )}
    </MapContainer>
  );
}
