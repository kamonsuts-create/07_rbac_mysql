"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";

const STORY_CHAPTERS = [
  {
    id: 0,
    title: "1. ยินดีต้อนรับสู่ปลูกรัก",
    subtitle: "สดใหม่จากสวนสู่มือคุณ",
    tag: "แนะนำแพลตฟอร์ม",
    videoSrc: "/videos/farm-nature.mp4",
    speech: "สวัสดีครับคุณลูกค้าทุกท่าน! ผม 'น้องปลูกรัก' ยินดีต้อนรับสู่ตลาดผลผลิตเกษตรชุมชนส่งตรงจากสวนแท้ๆ ในจังหวัดปทุมธานีครับ!",
    highlight: "ไม่ผ่านพ่อค้าคนกลาง ตัดสดใหม่รอบเช้าทุกวัน",
  },
  {
    id: 1,
    title: "2. ปลอดภัย 100% แล็บ 0.00 ppm",
    subtitle: "ตรวจสารเคมีตกค้างก่อนเก็บเกี่ยว",
    tag: "มาตรฐานความปลอดภัย",
    videoSrc: "/videos/farm-crops.mp4",
    speech: "ผลผลิตทุกแปลงของพวกเรา ปลูกในระบบเกษตรปลอดภัยและอินทรีย์ ผ่านการตรวจ Rapid Test ยืนยันสารเคมีตกค้าง 0.00 ppm ทุกรอบการเก็บเกี่ยวครับ!",
    highlight: "มีใบรับรองมาตรฐาน GAP และ Organic Thailand รับประกัน",
  },
  {
    id: 2,
    title: "3. เครือข่าย 10 วิสาหกิจปทุมธานี",
    subtitle: "แปลงปลูกจริง ครอบคลุม 5 อำเภอ",
    tag: "วิสาหกิจชุมชน SMCE",
    videoSrc: "/videos/farm-field.mp4",
    speech: "รวมพลัง 10 วิสาหกิจชุมชนที่มีอยู่จริง มีรหัสทะเบียน SMCE ชัดเจน ทั้งกล้วยหอมทอง, เตยหอม, เมลอน, ข้าวหอมปทุม และพืชผักไฮโดรโปนิกส์ครับ!",
    highlight: "ตรวจสอบย้อนกลับถึงหน้าแปลง พร้อมพิกัดดาวเทียม GPS",
  },
  {
    id: 3,
    title: "4. โอนตรงถึงเกษตรกร 100%",
    subtitle: "ชื่อบัญชีตรงผู้ขาย ป้องกันบัญชีม้า",
    tag: "การชำระเงินโดยตรง",
    videoSrc: "/videos/farm-greenhouse.mp4",
    speech: "เงินทุกบาทโอนเข้าบัญชีเกษตรกรผู้ปลูกโดยตรง 100% ไม่ถูกหักหัวคิว และระบบตรวจสอบชื่อบัญชีตรงกับผู้จดทะเบียน ปลอดภัย สบายใจแน่นอนครับ!",
    highlight: "สนับสนุนเศรษฐกิจฐานราก ชุมชนเติบโตอย่างยั่งยืน",
  },
];

const USER_JOURNEY_STEPS = [
  {
    step: "01",
    title: "เลือกชมผลผลิต",
    desc: "ค้นหาผัก ผลไม้ ข้าว ธัญพืช และสินค้าแปรรูปจากเกษตรกรตัวจริง",
    icon: "🥬",
    linkText: "เริ่มค้นหาสินค้า",
    targetId: "marketplace",
  },
  {
    step: "02",
    title: "ตรวจสอบหน้าแปลง",
    desc: "ดูวิดีโอหน้าแปลงจริง พิกัด GPS ผลตรวจแล็บ และใบรับรองมาตรฐาน",
    icon: "🔬",
    linkText: "ดูวิสาหกิจชุมชน",
    targetId: "smce-network",
  },
  {
    step: "03",
    title: "โอนเงินตรงสู่ผู้ขาย",
    desc: "โอนเงินผ่าน QR / เลขบัญชีเกษตรกรโดยตรง ไม่ผ่านคนกลาง",
    icon: "💳",
    linkText: "เรียนรู้ระบบความปลอดภัย",
    targetId: "trust-center",
  },
  {
    step: "04",
    title: "รับความสดถึงบ้าน",
    desc: "ผลผลิตตัดสดรอบเช้า บรรจุควบคุมความสด ส่งตรงถึงมือคุณอย่างรวดเร็ว",
    icon: "📦",
    linkText: "เช็คสถานะคำสั่งซื้อ",
    targetId: "tracking-section",
  },
];

export default function CartoonIntroHero({ onExploreMarketplace }) {
  const [activeChapter, setActiveChapter] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [speechBubbleText, setSpeechBubbleText] = useState(STORY_CHAPTERS[0].speech);
  const [showFullVideoModal, setShowFullVideoModal] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const videoRef = useRef(null);

  // Play gentle web audio chime effect
  const playChime = () => {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15); // A5

      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.35);
    } catch {
      // AudioContext not allowed before interaction
    }
  };

  // Change chapter
  const handleSelectChapter = (index) => {
    setActiveChapter(index);
    setIsTyping(true);
    setSpeechBubbleText(STORY_CHAPTERS[index].speech);
    playChime();

    if (videoRef.current) {
      videoRef.current.currentTime = 0;
      videoRef.current.play().catch(() => {});
      setIsPlaying(true);
    }

    setTimeout(() => setIsTyping(false), 300);
  };

  const handleTogglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current.play().catch(() => {});
      setIsPlaying(true);
    }
    playChime();
  };

  const handleToggleMute = () => {
    if (!videoRef.current) return;
    const nextMute = !isMuted;
    videoRef.current.muted = nextMute;
    setIsMuted(nextMute);
    setSoundEnabled(!nextMute);
    playChime();
  };

  const scrollToSection = (id) => {
    playChime();
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    } else if (onExploreMarketplace && id === "marketplace") {
      onExploreMarketplace();
    }
  };

  // Ensure muted autoplay works smoothly across iOS/Chrome
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    video.defaultMuted = true;
    video.muted = true;
    video.playsInline = true;

    const promise = video.play();
    if (promise !== undefined) {
      promise.catch(() => {
        setIsPlaying(false);
      });
    }
  }, [activeChapter]);

  const currentStory = STORY_CHAPTERS[activeChapter];

  return (
    <section className="relative z-30 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6 sm:-mt-8 mb-12">
      {/* 🎪 CARTOON STORY & VIDEO INTRO CONTAINER */}
      <div className="bg-white rounded-[32px] sm:rounded-[38px] p-5 sm:p-8 lg:p-10 shadow-[0_20px_60px_rgba(46,125,50,0.14)] border-4 border-[#e0ecd8] relative overflow-hidden">
        
        {/* Decorative Nature Leaf Background Stamps */}
        <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full bg-[#f1f8ee] pointer-events-none opacity-80" />
        <div className="absolute -bottom-16 -left-16 w-56 h-56 rounded-full bg-[#fbf6ea] pointer-events-none opacity-80" />

        {/* Section Header: Mascot Speech Intro Badge */}
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#eef5eb]">
          <div className="flex items-center gap-3">
            <span className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#2f8239] to-[#1f5d27] text-white flex items-center justify-center text-xl shadow-md shrink-0">
              🎬
            </span>
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#edf7eb] text-[#2f8239] text-xs font-black">
                <span className="w-2 h-2 rounded-full bg-[#2f8239] animate-ping" />
                <span>วิดีโอกาตูนแนะนำแพลตฟอร์ม</span>
              </div>
              <h2 className="text-xl sm:text-2xl lg:text-3xl font-black text-[#152e1c] mt-1">
                ทำความรู้จัก &quot;ปลูกรัก&quot; ก่อนเริ่มเลือกซื้อผลผลิต
              </h2>
            </div>
          </div>

          {/* Quick Skip Button to Marketplace */}
          <button
            type="button"
            onClick={() => scrollToSection("marketplace")}
            className="self-start sm:self-center inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#f2f7f0] hover:bg-[#e4efe0] text-[#1b4b24] font-black text-xs sm:text-sm transition cursor-pointer active:scale-95 border border-[#d6e7d0]"
          >
            <span>เข้าสู่ตลาดซื้อขายทันที</span>
            <span>➔</span>
          </button>
        </div>

        {/* 🎬 MAIN STAGE: Cartoon Mascot + Video Theater */}
        <div className="relative z-10 mt-6 grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-center">
          
          {/* Left Column (5 Cols): Cartoon Farmer Mascot & Dialogue Speech Balloon */}
          <div className="lg:col-span-5 flex flex-col items-center lg:items-start text-center lg:text-left">
            
            {/* Friendly Speech Balloon */}
            <div className="w-full relative bg-gradient-to-br from-[#fffdf8] to-[#f8fcf5] border-2 border-[#d5e7ce] rounded-3xl p-5 sm:p-6 shadow-[0_8px_24px_rgba(46,125,50,0.08)] mb-4">
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-[#2f8239] text-white text-[11px] font-black">
                  <span>🧑‍🌾</span> น้องปลูกรัก เล่าเรื่อง
                </span>
                <span className="text-[11px] font-mono font-bold text-stone-400">
                  ตอนที่ {activeChapter + 1}/4
                </span>
              </div>

              <p className={`text-stone-800 text-sm sm:text-base font-semibold leading-relaxed transition-opacity duration-300 ${isTyping ? "opacity-40" : "opacity-100"}`}>
                &ldquo;{speechBubbleText}&rdquo;
              </p>

              <div className="mt-3 pt-3 border-t border-[#eaf2e7] flex items-center justify-between text-xs text-[#2f8239] font-bold">
                <span className="flex items-center gap-1.5">
                  <span>✨</span> {currentStory.highlight}
                </span>
              </div>

              {/* Balloon Arrow Pointer */}
              <div className="absolute -bottom-2.5 left-12 w-5 h-5 bg-[#f8fcf5] border-b-2 border-r-2 border-[#d5e7ce] rotate-45 transform" />
            </div>

            {/* Mascot Image + Friendly Greetings */}
            <div className="flex items-center gap-4 mt-2">
              <div
                onClick={playChime}
                className="relative w-28 h-36 sm:w-32 sm:h-40 shrink-0 cursor-pointer group select-none transition-transform hover:scale-105 active:scale-95"
                title="คลิกเพื่อน้องปลูกรักทักทาย!"
              >
                <img
                  src="/images/farmer-mascot.png"
                  alt="มาสคอตน้องปลูกรัก"
                  className="w-full h-full object-contain drop-shadow-[0_10px_20px_rgba(30,80,25,0.22)]"
                />
                <span className="absolute -bottom-1 -right-1 bg-amber-400 text-stone-900 text-[10px] font-black px-2 py-0.5 rounded-full border border-white shadow-sm group-hover:animate-bounce">
                  ทักทาย 👋
                </span>
              </div>

              <div className="space-y-1 text-left">
                <h3 className="text-base sm:text-lg font-black text-[#152e1c]">
                  น้องปลูกรัก (Pluk Rak Mascot)
                </h3>
                <p className="text-xs text-stone-600 font-medium">
                  ผู้ช่วยแนะนำตลาดเกษตรชุมชนปทุมธานี
                </p>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                    ✓ วิสาหกิจแท้
                  </span>
                  <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-amber-50 text-amber-900 border border-amber-200">
                    ✓ 0.00 ppm
                  </span>
                  <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-blue-50 text-blue-800 border border-blue-200">
                    ✓ โอนตรง 100%
                  </span>
                </div>
              </div>
            </div>

            {/* Interactive Chapter Buttons */}
            <div className="w-full grid grid-cols-2 gap-2 mt-5">
              {STORY_CHAPTERS.map((ch, idx) => (
                <button
                  key={ch.id}
                  type="button"
                  onClick={() => handleSelectChapter(idx)}
                  className={`p-2.5 rounded-2xl text-left transition cursor-pointer border ${
                    activeChapter === idx
                      ? "bg-[#2f8239] text-white border-[#246b2d] shadow-md shadow-[#2f8239]/20 font-black scale-[1.02]"
                      : "bg-[#f8fbf6] hover:bg-[#edf5e9] text-stone-700 border-[#e1ece0] font-bold"
                  }`}
                >
                  <span className="block text-[11px] opacity-80 leading-tight">ตอนที่ {idx + 1}</span>
                  <span className="block text-xs truncate mt-0.5">{ch.title.split(". ")[1]}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Right Column (7 Cols): Custom Video Theater Screen */}
          <div className="lg:col-span-7">
            <div className="relative rounded-[28px] overflow-hidden bg-stone-950 border-4 border-[#2f8239] shadow-2xl group">
              
              {/* Screen Top Bar */}
              <div className="absolute top-0 inset-x-0 z-20 bg-gradient-to-b from-black/80 via-black/40 to-transparent p-4 flex items-center justify-between text-white">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-rose-500 animate-pulse" />
                  <span className="text-xs font-black tracking-wide text-emerald-300">
                    {currentStory.tag}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <button
                    type="button"
                    onClick={handleToggleMute}
                    className="px-3 py-1 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-md text-white font-bold transition flex items-center gap-1 cursor-pointer"
                  >
                    <span>{isMuted ? "🔇 เปิดเสียง" : "🔊 ปิดเสียง"}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowFullVideoModal(true)}
                    className="px-3 py-1 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-md text-white font-bold transition flex items-center gap-1 cursor-pointer"
                  >
                    <span>⛶ จอใหญ่</span>
                  </button>
                </div>
              </div>

              {/* HTML5 Video Player */}
              <div className="relative aspect-video max-h-[380px] w-full flex items-center justify-center bg-black">
                <video
                  ref={videoRef}
                  src={currentStory.videoSrc}
                  loop
                  playsInline
                  autoPlay
                  muted={isMuted}
                  className="w-full h-full object-cover"
                />

                {/* Subtitle Caption Overlay */}
                <div className="absolute bottom-14 inset-x-4 z-20 pointer-events-none text-center">
                  <div className="inline-block bg-black/75 backdrop-blur-md text-white text-xs sm:text-sm font-bold px-4 py-1.5 rounded-xl border border-white/20 shadow-lg">
                    {currentStory.subtitle} · {currentStory.highlight}
                  </div>
                </div>

                {/* Center Play/Pause Overlay when Paused */}
                {!isPlaying && (
                  <button
                    type="button"
                    onClick={handleTogglePlay}
                    className="absolute z-20 w-16 h-16 rounded-full bg-[#2f8239]/90 hover:bg-[#2f8239] text-white flex items-center justify-center text-2xl shadow-2xl transition-transform hover:scale-110 cursor-pointer"
                    aria-label="เล่นวิดีโอ"
                  >
                    ▶
                  </button>
                )}
              </div>

              {/* Bottom Control Bar */}
              <div className="p-3 bg-stone-900 border-t border-stone-800 flex items-center justify-between text-white text-xs font-semibold">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={handleTogglePlay}
                    className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-sm cursor-pointer"
                  >
                    {isPlaying ? "❚❚" : "▶"}
                  </button>
                  <span className="font-bold text-stone-300 truncate max-w-[200px] sm:max-w-none">
                    {currentStory.title}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-stone-400 font-mono text-[11px]">
                    ตอนที่ {activeChapter + 1} จาก {STORY_CHAPTERS.length}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleSelectChapter((activeChapter + 1) % STORY_CHAPTERS.length)}
                    className="px-2.5 py-1 rounded-lg bg-[#2f8239] hover:bg-[#256c2e] text-white text-xs font-bold transition cursor-pointer"
                  >
                    ตอนต่อไป ➔
                  </button>
                </div>
              </div>

            </div>
          </div>

        </div>

        {/* 🚀 QUICK ACTION GATEWAY BUTTONS: ปุ่มไปหน้าต่อจัดเรียงอย่างเป็นระบบ */}
        <div className="relative z-10 mt-8 pt-6 border-t-2 border-[#eef5eb]">
          <div className="text-center mb-5">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#f8faf7] text-stone-600 text-xs font-black border border-[#e2ede0]">
              <span>🧭</span> ขั้นตอนต่อไป: เลือกโซนที่ต้องการเข้าใช้งาน
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
            
            {/* 1. ปุ่มหลัก: เข้าสู่ตลาดเลือกซื้อผลผลิต (เริ่มช้อปเลย) */}
            <button
              type="button"
              onClick={() => scrollToSection("marketplace")}
              className="p-4 rounded-2xl bg-gradient-to-br from-[#2f8239] via-[#287731] to-[#1a5622] hover:brightness-105 active:scale-[0.98] text-white text-left transition shadow-md hover:shadow-xl cursor-pointer flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-2xl">🛒</span>
                  <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-full font-black">
                    แนะนำยอดนิยม
                  </span>
                </div>
                <h4 className="font-extrabold text-sm sm:text-base leading-snug">
                  เข้าสู่ตลาดผลผลิต
                </h4>
                <p className="text-xs text-emerald-100/80 mt-1 line-clamp-2">
                  เลือกซื้อผักสด ผลไม้ ข้าว ธัญพืช ส่งตรงจากสวน
                </p>
              </div>
              <div className="mt-3 flex items-center justify-between text-xs font-black text-amber-300">
                <span>เริ่มช้อปทันที</span>
                <span className="group-hover:translate-x-1 transition-transform">➔</span>
              </div>
            </button>

            {/* 2. สำรวจ 10 วิสาหกิจชุมชนปทุมธานี (SMCE) */}
            <button
              type="button"
              onClick={() => scrollToSection("smce-network")}
              className="p-4 rounded-2xl bg-white hover:bg-[#f8fcf6] border-2 border-[#d5e7ce] hover:border-[#2f8239] active:scale-[0.98] text-stone-800 text-left transition shadow-xs hover:shadow-md cursor-pointer flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-2xl">🌱</span>
                  <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-black">
                    10 วิสาหกิจ
                  </span>
                </div>
                <h4 className="font-extrabold text-sm sm:text-base text-[#152e1c] leading-snug">
                  10 วิสาหกิจชุมชน
                </h4>
                <p className="text-xs text-stone-500 mt-1 line-clamp-2">
                  ดูวิดีโอหน้าแปลงจริง พิกัด GPS และขั้นตอนการผลิต
                </p>
              </div>
              <div className="mt-3 flex items-center justify-between text-xs font-black text-[#2f8239]">
                <span>สำรวจหน้างานจริง</span>
                <span className="group-hover:translate-x-1 transition-transform">➔</span>
              </div>
            </button>

            {/* 3. ข่าวสาร & ปฏิทินผลผลิตชุมชน */}
            <Link
              href="/news"
              className="p-4 rounded-2xl bg-white hover:bg-[#fbfbf9] border-2 border-[#e6ebe3] hover:border-[#2f8239] active:scale-[0.98] text-stone-800 text-left transition shadow-xs hover:shadow-md cursor-pointer flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-2xl">📰</span>
                  <span className="text-[10px] bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full font-black">
                    อัปเดตสม่ำเสมอ
                  </span>
                </div>
                <h4 className="font-extrabold text-sm sm:text-base text-[#152e1c] leading-snug">
                  ข่าวสารและปฏิทิน
                </h4>
                <p className="text-xs text-stone-500 mt-1 line-clamp-2">
                  ติดตามรอบเก็บเกี่ยว ฤดูกาลผลไม้ และกิจกรรมชุมชน
                </p>
              </div>
              <div className="mt-3 flex items-center justify-between text-xs font-black text-[#2f8239]">
                <span>อ่านข่าวสารชุมชน</span>
                <span className="group-hover:translate-x-1 transition-transform">➔</span>
              </div>
            </Link>

            {/* 4. เกษตรกรผู้ขาย / เปิดร้านค้า */}
            <Link
              href="/login"
              className="p-4 rounded-2xl bg-white hover:bg-[#fbfbf9] border-2 border-[#e6ebe3] hover:border-[#2f8239] active:scale-[0.98] text-stone-800 text-left transition shadow-xs hover:shadow-md cursor-pointer flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-2xl">🧑‍🌾</span>
                  <span className="text-[10px] bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full font-black">
                    สำหรับเกษตรกร
                  </span>
                </div>
                <h4 className="font-extrabold text-sm sm:text-base text-[#152e1c] leading-snug">
                  เข้าสู่ระบบเกษตรกร
                </h4>
                <p className="text-xs text-stone-500 mt-1 line-clamp-2">
                  จัดการผลผลิต แปลงปลูก และคำสั่งซื้อของคุณ
                </p>
              </div>
              <div className="mt-3 flex items-center justify-between text-xs font-black text-[#2f8239]">
                <span>เข้าสู่แดชบอร์ด</span>
                <span className="group-hover:translate-x-1 transition-transform">➔</span>
              </div>
            </Link>

          </div>
        </div>

        {/* 🗺️ USER JOURNEY ROADMAP: เรียงหน้าและลำดับการเข้าใช้งานให้เข้าใจง่าย */}
        <div className="relative z-10 mt-8 pt-6 border-t border-[#eef5eb]">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
            <h4 className="text-xs sm:text-sm font-black text-[#152e1c] uppercase tracking-wider flex items-center gap-2">
              <span>🧭</span> แผนผังขั้นตอนการเข้าใช้งาน ปลูกรัก (User Journey Roadmap)
            </h4>
            <span className="text-xs text-stone-500 font-medium">
              เข้าใจง่ายใน 4 ขั้นตอน มั่นใจได้ผลผลิตสด 100%
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {USER_JOURNEY_STEPS.map((s) => (
              <div
                key={s.step}
                onClick={() => scrollToSection(s.targetId)}
                className="p-3.5 bg-[#fbfdfa] rounded-2xl border border-[#e4efe0] hover:border-[#2f8239] hover:bg-white transition shadow-xs cursor-pointer group"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xl">{s.icon}</span>
                  <span className="font-mono text-xs font-black text-[#2f8239] bg-[#eef7ec] px-2 py-0.5 rounded-full">
                    STEP {s.step}
                  </span>
                </div>
                <h5 className="font-extrabold text-xs sm:text-sm text-[#152e1c] group-hover:text-[#2f8239] transition-colors">
                  {s.title}
                </h5>
                <p className="text-[11px] text-stone-500 mt-1 leading-relaxed">
                  {s.desc}
                </p>
                <span className="inline-block mt-2.5 text-[11px] text-[#2f8239] font-bold group-hover:underline">
                  {s.linkText} ➔
                </span>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Fullscreen Video Modal if clicked ⛶ จอใหญ่ */}
      {showFullVideoModal && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="relative w-full max-w-4xl bg-black rounded-3xl overflow-hidden border-2 border-emerald-500 shadow-2xl">
            <button
              onClick={() => setShowFullVideoModal(false)}
              className="absolute top-4 right-4 z-30 w-10 h-10 rounded-full bg-white/20 hover:bg-white/40 text-white font-bold flex items-center justify-center cursor-pointer"
            >
              ✕
            </button>
            <div className="aspect-video w-full">
              <video
                src={currentStory.videoSrc}
                controls
                autoPlay
                className="w-full h-full object-contain"
              />
            </div>
            <div className="p-4 bg-stone-900 text-white flex items-center justify-between text-xs sm:text-sm">
              <span className="font-bold">{currentStory.title}</span>
              <button
                onClick={() => setShowFullVideoModal(false)}
                className="px-4 py-1.5 rounded-xl bg-[#2f8239] font-bold cursor-pointer"
              >
                ปิดหน้าต่าง
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
