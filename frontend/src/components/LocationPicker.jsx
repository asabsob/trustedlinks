import React, { useEffect, useRef } from "react";

export default function LocationPicker({ value, onChange, height = 300 }) {
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const markerRef = useRef(null);

  // إنشاء الخريطة أول مرة
  useEffect(() => {
    if (!window.google || mapInstance.current) return;

    const initialLocation = value || { lat: 31.9539, lng: 35.9106 };

    const map = new window.google.maps.Map(mapRef.current, {
      center: initialLocation,
      zoom: 13,
    });

    const marker = new window.google.maps.Marker({
      position: initialLocation,
      map,
      draggable: true,
    });

    mapInstance.current = map;
    markerRef.current = marker;

    // عند سحب الماركر
    marker.addListener("dragend", () => {
      const pos = marker.getPosition();
      const newLocation = {
        lat: pos.lat(),
        lng: pos.lng(),
      };
      onChange && onChange(newLocation);
    });

    // عند الضغط على الخريطة
    map.addListener("click", (e) => {
      const newLocation = {
        lat: e.latLng.lat(),
        lng: e.latLng.lng(),
      };

      marker.setPosition(newLocation);
      onChange && onChange(newLocation);
    });
  }, []);

  // تحديث الموقع إذا تغير من الخارج (مهم جداً)
  useEffect(() => {
    if (!value || !mapInstance.current || !markerRef.current) return;

    markerRef.current.setPosition(value);
    mapInstance.current.panTo(value);
  }, [value]);

  return (
    <div
      ref={mapRef}
      style={{
        width: "100%",
        height: `${height}px`,
        borderRadius: "14px",
        border: "1px solid #e5e7eb",
        overflow: "hidden",
      }}
    />
  );
}
