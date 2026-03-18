import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix default marker icons in React/Vite
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

function ClickHandler({ value, onChange }) {
  useMapEvents({
    click(e) {
      const next = {
        lat: e.latlng.lat,
        lng: e.latlng.lng,
      };
      onChange(next);
    },
  });

  return value ? <Marker position={[value.lat, value.lng]} /> : null;
}

function RecenterMap({ value }) {
  const map = useMapEvents({});
  useEffect(() => {
    if (value?.lat && value?.lng) {
      map.setView([value.lat, value.lng], 16);
    }
  }, [value, map]);

  return null;
}

export default function LocationPicker({ value, onChange, height = 320 }) {
  const center = value?.lat && value?.lng ? [value.lat, value.lng] : [31.9539, 35.9106]; // Amman default

  return (
    <div style={{ borderRadius: 12, overflow: "hidden", border: "1px solid #ddd" }}>
      <MapContainer
        center={center}
        zoom={13}
        style={{ height, width: "100%" }}
        scrollWheelZoom
      >
        <TileLayer
          attribution='&copy; OpenStreetMap contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <ClickHandler value={value} onChange={onChange} />
        <RecenterMap value={value} />
      </MapContainer>
    </div>
  );
}
