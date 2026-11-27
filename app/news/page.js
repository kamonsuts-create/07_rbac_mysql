"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import PlukrakNavbar from "@/components/PlukrakNavbar";
import PlukrakFooter from "@/components/PlukrakFooter";

export default function NewsPage() {
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("ทั้งหมด");
  const [activeArticle, setActiveArticle] = useState(null);

  async function loadNews() {
    setLoading(true);
    setMessage("");

    try {
      const response = await fetch("/api/news", { cache: "no-store" });
      const data = await response.json();

      if (!response.ok) {
        setMessage(data.message || "ไม่สามารถโหลดข่าวได้");
        setNews([]);
        return;
      }

      setNews(data.news || []);
    } catch {
      setMessage("ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้ กรุณาลองใหม่อีกครั้ง");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadNews();
  }, []);

  function formatDate(dateValue) {
    if (!dateValue) return "-";
    const date = new Date(dateValue);
    if (Number.isNaN(date.getTime())) return "-";
    return date.toLocaleString("th-TH", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  }

  const getArticleMeta = (item) => {
    const text = (item.title + " " + item.content).toLowerCase();
    if (text.includes("เมล่อน") || text.includes("เก็บเกี่ยว") || text.includes("กล้วย")) {
      return {
        image:
          "https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=800&auto=format&fit=crop&q=80",
        category: "ฤดูกาลเก็บเกี่ยว",
        badgeClass: "badge-cat-fruit",
        authorRole: "วิสาหกิจชุมชนเกษตรอินทรีย์",
        avatar: "🌾",
      };
    }
    if (text.includes("ปุ๋ย") || text.includes("ดิน") || text.includes("สัมมนา")) {
      return {
        image:
          "https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?w=800&auto=format&fit=crop&q=80",
        category: "วิชาการ & การบำรุงดิน",
        badgeClass: "badge-cat-grain",
        authorRole: "ศูนย์วิจัยคุณภาพดินอินทรีย์",
        avatar: "🔬",
      };
    }
    if (text.includes("จัดส่ง") || text.includes("คุณภาพ") || text.includes("ขนส่ง")) {
      return {
        image:
          "https://images.unsplash.com/photo-1542838132-92c53300491e?w=800&auto=format&fit=crop&q=80",
        category: "ระบบจัดส่ง",
        badgeClass: "badge-cat-processed",
        authorRole: "ฝ่ายกระจายผลผลิตและโลจิสติกส์",
        avatar: "🚚",
      };
    }
    return {
      image:
        "https://images.unsplash.com/photo-1618160702438-9b02ab6515c9?w=800&auto=format&fit=crop&q=80",
      category: "ข่าวสารชุมชน",
      badgeClass: "badge-cat-veg",
      authorRole: "เครือข่ายวิสาหกิจชุมชนปลูกรัก",
      avatar: "🌱",
    };
  };

  const categories = ["ทั้งหมด", "ฤดูกาลเก็บเกี่ยว", "วิชาการ & การบำรุงดิน", "ระบบจัดส่ง", "ข่าวสารชุมชน"];

  const filteredNews = useMemo(() => {
    if (selectedCategory === "ทั้งหมด") return news;
    return news.filter((item) => {
      const meta = getArticleMeta(item);
      return meta.category === selectedCategory;
    });
  }, [news, selectedCategory]);

  return (
    <div className="min-h-screen flex flex-col justify-between bg-[#f6f4eb] text-[#152e1c]">
      <PlukrakNavbar />

      {/* Hero Banner Section */}
      <section className="relative bg-gradient-to-b from-[#1b5e20] to-[#256c33] text-white py-12 sm:py-16 px-4 overflow-hidden">
        <div className="absolute inset-0 opacity-10 pointer-events-none">
          <svg viewBox="0 0 100 100" className="w-full h-full" preserveAspectRatio="none">
            <path d="M0,0 L100,100 M100,0 L0,100" stroke="white" strokeWidth="0.5" />
          </svg>
        </div>

        <div className="max-w-4xl mx-auto text-center relative z-10 space-y-3">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/15 backdrop-blur-xs border border-white/20 text-xs sm:text-sm font-black text-amber-300">
            <span>📰 ข่าวสารและประกาศวิสาหกิจชุมชน</span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-tight">
            ข่าวสารและองค์ความรู้เกษตรอินทรีย์
          </h1>

          <p className="text-sm sm:text-base text-emerald-100 max-w-2xl mx-auto font-medium">
            ติดตามรอบเก็บเกี่ยวผลผลิต เคล็ดลับการเพาะปลูกวิถีอินทรีย์ และเรื่องราวดี ๆ ส่งตรงจากพี่น้องเกษตรกรในเครือข่ายปลูกรัก
          </p>
        </div>
      </section>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 flex-1 w-full">
        {/* Category Tabs */}
        <div className="flex items-center justify-start sm:justify-center gap-2 sm:gap-3 overflow-x-auto pb-4 scrollbar-none mb-8">
          {categories.map((cat) => {
            const isActive = selectedCategory === cat;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-5 py-2.5 rounded-full text-xs sm:text-sm font-extrabold whitespace-nowrap transition cursor-pointer active:scale-95 ${
                  isActive
                    ? "bg-[#1e5a32] text-white shadow-md"
                    : "bg-white text-[#1f4c27] border border-[#dce8d0] hover:bg-[#f6fcf4]"
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>

        {/* Message Alert */}
        {message && (
          <div className="mb-6 p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-sm font-bold flex items-center justify-between">
            <span>{message}</span>
            <button onClick={loadNews} className="text-xs underline cursor-pointer">ลองใหม่</button>
          </div>
        )}

        {/* Articles Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-3xl border border-[#e2ead8] p-4 animate-pulse space-y-4">
                <div className="h-48 rounded-2xl bg-emerald-100/50" />
                <div className="h-6 w-3/4 bg-stone-200 rounded-lg" />
                <div className="h-4 w-full bg-stone-100 rounded-lg" />
                <div className="h-4 w-2/3 bg-stone-100 rounded-lg" />
              </div>
            ))}
          </div>
        ) : filteredNews.length === 0 ? (
          <div className="bg-white rounded-3xl border border-[#e5e2d5] p-12 text-center shadow-sm max-w-lg mx-auto">
            <span className="text-5xl block mb-3">📰</span>
            <h3 className="text-lg font-black text-[#18331e]">ยังไม่มีข่าวสารในหมวดหมู่นี้</h3>
            <p className="text-xs sm:text-sm text-[#61705d] mt-1">สามารถเลือกหมวดหมู่อื่นเพื่ออ่านบทความที่น่าสนใจได้ครับ</p>
            <button
              onClick={() => setSelectedCategory("ทั้งหมด")}
              className="mt-4 px-5 py-2 rounded-full bg-[#2f8239] text-white text-xs font-bold"
            >
              ดูข่าวทั้งหมด
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {filteredNews.map((item) => {
              const meta = getArticleMeta(item);

              return (
                <article
                  key={item.id}
                  onClick={() => setActiveArticle(item)}
                  className="bg-white rounded-[26px] border border-[#e2ead8] overflow-hidden shadow-[0_8px_24px_rgba(20,60,25,0.05)] hover:shadow-[0_12px_32px_rgba(20,60,25,0.1)] transition-all duration-300 flex flex-col group cursor-pointer"
                >
                  {/* Photo with category badge */}
                  <div className="relative h-48 sm:h-52 overflow-hidden bg-[#edf6ea]">
                    <img
                      src={meta.image}
                      alt={item.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                      loading="lazy"
                    />
                    <span className={`absolute top-3 left-3 text-xs px-3.5 py-1 ${meta.badgeClass}`}>
                      {meta.category}
                    </span>
                  </div>

                  {/* Body */}
                  <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-xs text-[#5d6e5a] font-medium">
                        <span>{meta.avatar}</span>
                        <span className="truncate">{meta.authorRole}</span>
                        <span>•</span>
                        <time className="tabular-nums">{formatDate(item.created_at)}</time>
                      </div>

                      <h2 className="font-black text-[#152e1c] text-lg sm:text-xl group-hover:text-[#236f2b] transition-colors leading-snug line-clamp-2">
                        {item.title}
                      </h2>

                      <p className="text-xs sm:text-sm text-[#5d6e5a] line-clamp-3 leading-relaxed">
                        {item.content}
                      </p>
                    </div>

                    <div className="pt-2 flex items-center justify-between text-xs font-black text-[#2f8239]">
                      <span>อ่านรายละเอียดบทความ</span>
                      <span className="group-hover:translate-x-1 transition-transform">➔</span>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </main>

      {/* Article Detail Modal */}
      {activeArticle && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
          onClick={() => setActiveArticle(null)}
        >
          <div
            className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-[#e2ead8] p-6 sm:p-8"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <span className={`text-xs px-3.5 py-1 inline-block mb-2 ${getArticleMeta(activeArticle).badgeClass}`}>
                  {getArticleMeta(activeArticle).category}
                </span>
                <h2 className="text-xl sm:text-2xl font-black text-[#152e1c] leading-snug">
                  {activeArticle.title}
                </h2>
                <p className="text-xs text-[#5d6e5a] mt-1 font-medium">
                  {getArticleMeta(activeArticle).authorRole} • เผยแพร่เมื่อ {formatDate(activeArticle.created_at)}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setActiveArticle(null)}
                className="w-8 h-8 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-600 font-bold flex items-center justify-center text-sm transition shrink-0"
              >
                ✕
              </button>
            </div>

            <div className="rounded-2xl overflow-hidden my-4 max-h-72">
              <img
                src={getArticleMeta(activeArticle).image}
                alt={activeArticle.title}
                className="w-full h-full object-cover"
              />
            </div>

            <div className="text-sm sm:text-base text-[#2e4732] leading-relaxed whitespace-pre-line py-2">
              {activeArticle.content}
            </div>

            <div className="mt-6 pt-4 border-t border-[#e2ead8] flex justify-end">
              <button
                type="button"
                onClick={() => setActiveArticle(null)}
                className="px-6 py-2.5 rounded-full bg-[#2f8239] hover:bg-[#236b28] text-white font-extrabold text-xs sm:text-sm transition cursor-pointer"
              >
                ปิดหน้าต่าง
              </button>
            </div>
          </div>
        </div>
      )}

      <PlukrakFooter />
    </div>
  );
}
