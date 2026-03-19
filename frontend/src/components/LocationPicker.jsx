import React, { useEffect, useRef } from "react";

export default function LocationPicker({ value, onChange }) {
  const mapRef = useRef(null);
  const markerRef = useRef(null);

  useEffect(() => {
    if (!window.google) return;

    const defaultLocation = value || { lat: 31.9539, lng: 35.9106 }; // عمان

    const map = new window.google.maps.Map(mapRef.current, {
      center: defaultLocation,
      zoom: 13,
    });

    const marker = new window.google.maps.Marker({
      position: defaultLocation,
      map,
      draggable: true,
    });

    markerRef.current = marker;

    marker.addListener("dragend", () => {
      const pos = marker.getPosition();
      const newLocation = {
        lat: pos.lat(),
        lng: pos.lng(),
      };

      onChange && onChange(newLocation);
    });

    map.addListener("click", (e) => {
      const newLocation = {
        lat: e.latLng.lat(),
        lng: e.latLng.lng(),
      };

      marker.setPosition(newLocation);
      onChange && onChange(newLocation);
    });
  }, []);

  return (
    <div
      ref={mapRef}
      style={{
        width: "100%",
        height: "300px",
        borderRadius: "12px",
        border: "1px solid #ddd",
      }}
    />
  );
}
