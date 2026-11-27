"use client";

import { useEffect, useRef, useState } from "react";

export default function FarmVideoPlayer({
  src,
  poster,
  title = "วิดีโอบันทึกหน้าแปลงจริง & ขั้นตอนการดูแลผลผลิต",
  subtitle = "บันทึกสดจากหน้างาน จ.ปทุมธานี",
}) {
  const videoRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Fallback video path if external URL is unreachable
  const videoSrc = src || "/videos/farm-crops.mp4";

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // Fix for React muted bug
    video.defaultMuted = true;
    video.muted = true;

    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    const onLoadedData = () => {
      setIsLoading(false);
      setHasError(false);
      // Attempt autoplay muted
      video.play().catch(() => {
        setIsPlaying(false);
      });
    };
    const onError = () => {
      setIsLoading(false);
      setHasError(true);
    };

    video.addEventListener("play", onPlay);
    video.addEventListener("pause", onPause);
    video.addEventListener("loadeddata", onLoadedData);
    video.addEventListener("error", onError);

    return () => {
      video.removeEventListener("play", onPlay);
      video.removeEventListener("pause", onPause);
      video.removeEventListener("loadeddata", onLoadedData);
      video.removeEventListener("error", onError);
    };
  }, [videoSrc]);

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      video.play().catch(() => {});
    } else {
      video.pause();
    }
  };

  const toggleMute = (e) => {
    e.stopPropagation();
    const video = videoRef.current;
    if (!video) return;
    video.muted = !video.muted;
    setIsMuted(video.muted);
  };

  const toggleFullscreen = (e) => {
    e.stopPropagation();
    const video = videoRef.current;
    if (!video) return;
    if (document.fullscreenElement) {
      document.exitFullscreen?.();
    } else if (video.requestFullscreen) {
      video.requestFullscreen();
    }
  };

  return (
    <div className="rounded-2xl overflow-hidden bg-[#0c1f13] border border-[#2f8239]/40 text-white shadow-lg relative group">
      {/* Top Header Bar */}
      <div className="p-3 sm:p-4 bg-gradient-to-b from-black/80 to-transparent absolute top-0 inset-x-0 z-20 flex items-center justify-between pointer-events-none">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs sm:text-sm font-black text-emerald-300 drop-shadow-md">
            🎥 {title}
          </span>
        </div>
        <span className="text-[11px] text-emerald-100/80 font-mono bg-black/40 backdrop-blur-xs px-2.5 py-0.5 rounded-full border border-white/10">
          {subtitle}
        </span>
      </div>

      {/* Video Container */}
      <div className="relative w-full aspect-video max-h-80 bg-black flex items-center justify-center cursor-pointer" onClick={togglePlay}>
        {hasError ? (
          <div className="flex flex-col items-center justify-center p-6 text-center space-y-3">
            <span className="text-4xl">🌾</span>
            <p className="text-sm font-bold text-emerald-200">
              กำลังเชื่อมต่อสัญญาณวิดีโอสดหน้าแปลง...
            </p>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setHasError(false);
                setIsLoading(true);
                if (videoRef.current) {
                  videoRef.current.src = "/videos/farm-crops.mp4";
                  videoRef.current.load();
                }
              }}
              className="px-4 py-1.5 rounded-full bg-[#2f8239] text-xs font-bold text-white hover:brightness-110 cursor-pointer"
            >
              🔄 เล่นคลิปหน้าแปลงสำรอง
            </button>
          </div>
        ) : (
          <>
            <video
              ref={videoRef}
              src={videoSrc}
              poster={poster || "https://images.unsplash.com/photo-1500937386664-56d1dfef3854?w=800"}
              playsInline
              loop
              preload="auto"
              className="w-full h-full object-cover"
            />

            {/* Center Big Play / Pause Overlay */}
            {!isPlaying && (
              <div className="absolute inset-0 bg-black/35 flex items-center justify-center z-10 transition-opacity">
                <div className="w-16 h-16 rounded-full bg-[#2f8239]/90 hover:bg-[#2f8239] text-white flex items-center justify-center shadow-2xl border-2 border-white/60 transition transform hover:scale-110">
                  <svg viewBox="0 0 24 24" className="w-8 h-8 fill-current ml-1">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </div>
              </div>
            )}

            {/* Bottom Controls Bar */}
            <div className="absolute bottom-0 inset-x-0 p-3 bg-gradient-to-t from-black/80 via-black/40 to-transparent flex items-center justify-between z-20 opacity-90 group-hover:opacity-100 transition-opacity">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    togglePlay();
                  }}
                  className="text-xs font-black px-2.5 py-1 rounded-md bg-white/20 hover:bg-white/30 backdrop-blur-xs text-white"
                >
                  {isPlaying ? "⏸️ พัก" : "▶️ เล่น"}
                </button>

                <button
                  type="button"
                  onClick={toggleMute}
                  className="text-xs font-bold px-2 py-1 rounded-md bg-white/20 hover:bg-white/30 backdrop-blur-xs text-white"
                >
                  {isMuted ? "🔇 เปิดเสียง" : "🔊 ปิดเสียง"}
                </button>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[11px] font-mono text-emerald-300 bg-emerald-950/60 px-2 py-0.5 rounded-md border border-emerald-500/30">
                  1080p HD • สดจากแปลง
                </span>
                <button
                  type="button"
                  onClick={toggleFullscreen}
                  className="text-xs p-1 px-2 rounded-md bg-white/20 hover:bg-white/30 text-white"
                  title="ขยายเต็มจอ"
                >
                  ⛶
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
