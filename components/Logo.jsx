import Link from "next/link";

export default function Logo({ size = "normal", href = "/", showSubtitle = true, light = false }) {
  const isLarge = size === "large";
  const isSmall = size === "small";

  return (
    <Link href={href} className="inline-flex items-center gap-3 group select-none transition-transform duration-200 hover:scale-[1.02]">
      {/* 🟢 3D Glossy Sprout Icon (Matching Reference Mockup) */}
      <div
        className={`relative flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:rotate-[-4deg] ${
          isLarge ? "w-16 h-16" : isSmall ? "w-10 h-10" : "w-13 h-13"
        }`}
      >
        <svg
          viewBox="0 0 100 100"
          className="w-full h-full drop-shadow-[0_6px_10px_rgba(20,80,40,0.3)] filter"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            {/* 3D Leaf Gradients */}
            <linearGradient id="leafGradMain" x1="20%" y1="0%" x2="80%" y2="100%">
              <stop offset="0%" stopColor="#86efac" />
              <stop offset="35%" stopColor="#22c55e" />
              <stop offset="80%" stopColor="#15803d" />
              <stop offset="100%" stopColor="#14532d" />
            </linearGradient>

            <linearGradient id="leafGradSecond" x1="10%" y1="10%" x2="90%" y2="90%">
              <stop offset="0%" stopColor="#bbf7d0" />
              <stop offset="40%" stopColor="#4ade80" />
              <stop offset="85%" stopColor="#16a34a" />
              <stop offset="100%" stopColor="#166534" />
            </linearGradient>

            <linearGradient id="stemGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#4ade80" />
              <stop offset="50%" stopColor="#15803d" />
              <stop offset="100%" stopColor="#052e16" />
            </linearGradient>

            <filter id="softShadow" x="-10%" y="-10%" width="130%" height="130%">
              <feDropShadow dx="0" dy="4" stdDeviation="3" floodColor="#0f381e" floodOpacity="0.35" />
            </filter>
          </defs>

          {/* Stem */}
          <path
            d="M50 88C50 68 53 45 68 32"
            stroke="url(#stemGrad)"
            strokeWidth="7"
            strokeLinecap="round"
          />

          {/* Left Leaf (Curved 3D) */}
          <path
            d="M50 70C35 68 18 55 22 36C26 18 48 24 53 42C56 52 52 64 50 70Z"
            fill="url(#leafGradSecond)"
            filter="url(#softShadow)"
          />
          {/* Left Leaf Highlight */}
          <path
            d="M26 36C29 25 43 28 47 38C42 36 34 33 26 36Z"
            fill="#ffffff"
            fillOpacity="0.45"
          />

          {/* Right Leaf (Main Plump 3D Leaf) */}
          <path
            d="M53 58C62 55 86 48 84 26C82 8 58 12 52 30C48 42 50 52 53 58Z"
            fill="url(#leafGradMain)"
            filter="url(#softShadow)"
          />
          {/* Right Leaf Highlight */}
          <path
            d="M58 24C65 16 78 16 80 26C72 24 64 22 58 24Z"
            fill="#ffffff"
            fillOpacity="0.5"
          />

          {/* Center Vein Accent */}
          <path
            d="M54 34C63 32 74 27 78 25"
            stroke="#ffffff"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeOpacity="0.6"
          />
        </svg>
      </div>

      {/* Brand Name & Tagline */}
      <div className="flex flex-col">
        <div className="flex items-center gap-2.5">
          <span
            className={`font-black tracking-tight leading-none ${
              light
                ? "text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.5)]"
                : "text-[#144626] drop-shadow-[0_2px_3px_rgba(20,70,38,0.15)]"
            } ${isLarge ? "text-3xl sm:text-4xl" : isSmall ? "text-xl" : "text-2xl sm:text-3xl"}`}
            style={{
              letterSpacing: "-0.02em",
              textShadow: light
                ? "0 2px 4px rgba(0,0,0,0.4)"
                : "0 2px 0 rgba(255,255,255,0.8), 0 3px 6px rgba(10,50,25,0.12)",
            }}
          >
            ปลูกรัก
          </span>

          {/* 3D Capsule Pill "Pluk Rak" */}
          <span className="bg-gradient-to-b from-[#55c62c] via-[#3cae20] to-[#2a8c14] text-white text-xs sm:text-sm font-extrabold italic px-3.5 py-0.5 rounded-full border border-white/70 shadow-[0_3px_8px_rgba(25,95,20,0.28),inset_0_1px_0_rgba(255,255,255,0.45)] tracking-normal">
            Pluk Rak
          </span>
        </div>

        {showSubtitle && (
          <p
            className={`text-xs sm:text-sm font-bold tracking-tight mt-1 ${
              light ? "text-emerald-100/90" : "text-[#1e613b]"
            }`}
          >
            ตลาดผลผลิตเกษตรชุมชนส่งตรงจากสวน
          </p>
        )}
      </div>
    </Link>
  );
}
