"use client";

import { useEffect, useRef, useState } from "react";

const DEFAULT_CENTER = [14.0208, 100.525];

export default function DeliveryMap({
  latitude,
  longitude,
  onSelect,
}) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const leafletRef = useRef(null);
  const onSelectRef = useRef(onSelect);
  const [mapReady, setMapReady] = useState(false);

  onSelectRef.current = onSelect;

  const numericLat = Number(latitude);
  const numericLng = Number(longitude);
  const hasMarker =
    latitude !== null &&
    latitude !== undefined &&
    latitude !== "" &&
    longitude !== null &&
    longitude !== undefined &&
    longitude !== "" &&
    Number.isFinite(numericLat) &&
    Number.isFinite(numericLng);

  useEffect(() => {
    let isCancelled = false;
    let resizeObserver = null;

    const initialCenter = hasMarker
      ? [numericLat, numericLng]
      : DEFAULT_CENTER;
    const initialZoom = hasMarker ? 16 : 12;

    import("leaflet").then((leafletModule) => {
      const L = leafletModule.default || leafletModule;
      const container = containerRef.current;

      if (isCancelled || !container || mapRef.current) {
        return;
      }

      if (container._leaflet_id) {
        container._leaflet_id = null;
      }

      leafletRef.current = L;

      const map = L.map(container, {
        center: initialCenter,
        zoom: initialZoom,
        scrollWheelZoom: true,
      });

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      }).addTo(map);

      map.on("click", (event) => {
        onSelectRef.current?.({
          latitude: Number(event.latlng.lat.toFixed(7)),
          longitude: Number(event.latlng.lng.toFixed(7)),
        });
      });

      if (typeof ResizeObserver !== "undefined") {
        resizeObserver = new ResizeObserver(() => {
          map.invalidateSize();
        });
        resizeObserver.observe(container);
      }

      mapRef.current = map;
      setMapReady(true);
    });

    return () => {
      isCancelled = true;
      resizeObserver?.disconnect();

      if (markerRef.current) {
        markerRef.current.remove();
        markerRef.current = null;
      }

      if (mapRef.current) {
        mapRef.current.off();
        mapRef.current.remove();
        mapRef.current = null;
      }

      setMapReady(false);
    };
    // Initialize the Leaflet instance once per mount; coordinate updates are synced below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    const L = leafletRef.current;

    if (!mapReady || !map || !L) {
      return;
    }

    if (!hasMarker) {
      if (markerRef.current) {
        markerRef.current.remove();
        markerRef.current = null;
      }
      return;
    }

    const nextLatLng = [numericLat, numericLng];

    if (!markerRef.current) {
      markerRef.current = L.circleMarker(nextLatLng, {
        radius: 10,
        color: "#ffffff",
        weight: 3,
        fillColor: "#059669",
        fillOpacity: 1,
      })
        .addTo(map)
        .bindPopup("ตำแหน่งจัดส่งของคุณ");
    } else {
      markerRef.current.setLatLng(nextLatLng);
    }

    map.setView(nextLatLng, Math.max(map.getZoom(), 16), { animate: true });
  }, [mapReady, hasMarker, numericLat, numericLng]);

  return (
    <div className="w-full overflow-hidden rounded-2xl border-2 border-emerald-200 shadow-inner">
      <div className="bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-900">
        📍 คลิกบนแผนที่เพื่อเลือกจุดจัดส่งสินค้า
      </div>

      <div
        ref={containerRef}
        style={{ height: "320px", width: "100%" }}
        className="z-0 bg-emerald-50/40"
      />

      <div className="bg-white px-4 py-3 text-xs text-zinc-600">
        {hasMarker ? (
          <div className="space-y-1">
            <p className="font-bold text-emerald-700">
              ✓ เลือกตำแหน่งจัดส่งแล้ว
            </p>
            <p>Latitude: {numericLat.toFixed(7)}</p>
            <p>Longitude: {numericLng.toFixed(7)}</p>
          </div>
        ) : (
          <p>ยังไม่ได้เลือกตำแหน่ง กรุณาคลิกบนแผนที่</p>
        )}
      </div>
    </div>
  );
}
