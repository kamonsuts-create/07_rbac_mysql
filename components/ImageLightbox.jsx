"use client";

import { useEffect, useState } from "react";

export default function ImageLightbox({ image, onClose }) {
  const [zoom, setZoom] = useState(1);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  if (!image) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex flex-col items-center justify-between p-4 sm:p-6 animate-in fade-in duration-200"
      onClick={onClose}
    >
      {/* Top Bar */}
      <div
        className="w-full max-w-5xl flex items-center justify-between text-white pb-3 z-10"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3">
          <span className="w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center text-sm font-black">
            🔍
          </span>
          <div>
            <h3 className="font-black text-sm sm:text-base leading-snug">
              {image.title || "ดูภาพขยายความคมชัดสูง"}
            </h3>
            {image.subtitle && (
              <p className="text-xs text-emerald-300 font-medium">{image.subtitle}</p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Zoom controls */}
          <button
            type="button"
            onClick={() => setZoom((z) => Math.min(z + 0.25, 2.5))}
            className="px-2.5 py-1 rounded-lg bg-white/20 hover:bg-white/30 text-xs font-bold transition cursor-pointer"
            title="ซูมเข้า"
          >
            + ซูม
          </button>
          <button
            type="button"
            onClick={() => setZoom((z) => Math.max(z - 0.25, 0.75))}
            className="px-2.5 py-1 rounded-lg bg-white/20 hover:bg-white/30 text-xs font-bold transition cursor-pointer"
            title="ซูมออก"
          >
            - ซูม
          </button>
          <button
            type="button"
            onClick={() => setZoom(1)}
            className="px-2.5 py-1 rounded-lg bg-white/20 hover:bg-white/30 text-xs font-bold transition cursor-pointer"
            title="รีเซ็ตขนาด"
          >
            100%
          </button>

          {/* Close button */}
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-white/20 hover:bg-rose-600 text-white font-black text-sm flex items-center justify-center transition cursor-pointer ml-2"
          >
            ✕
          </button>
        </div>
      </div>

      {/* Main Image Display */}
      <div
        className="flex-1 w-full max-w-5xl flex items-center justify-center overflow-hidden my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <img
          src={image.url}
          alt={image.title || "ภาพขยาย"}
          style={{ transform: `scale(${zoom})` }}
          className="max-h-[80vh] max-w-full object-contain rounded-2xl shadow-2xl transition-transform duration-200 cursor-zoom-in"
          onClick={() => setZoom((z) => (z === 1 ? 1.5 : 1))}
        />
      </div>

      {/* Bottom Hint */}
      <div
        className="text-center text-xs text-stone-400 pt-2 z-10"
        onClick={(e) => e.stopPropagation()}
      >
        💡 คลิกที่รูปเพื่อซูมเข้า/ออก หรือกดปุ่ม ✕ หรือปุ่ม ESC เพื่อปิด
      </div>
    </div>
  );
}
