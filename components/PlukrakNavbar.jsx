"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import Logo from "./Logo";

export default function PlukrakNavbar({ cartCount = 0, onCartClick, variant = "default" }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    async function checkUser() {
      try {
        const res = await fetch("/api/me", { cache: "no-store" });
        if (res.ok) {
          const data = await res.json();
          if (data?.user) {
            setUser(data.user);
          }
        }
      } catch {
        // Not logged in
      } finally {
        setLoading(false);
      }
    }
    checkUser();
  }, []);

  // ปิด mobile menu เมื่อเปลี่ยนหน้า
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  async function handleLogout() {
    try {
      await fetch("/api/logout", { method: "POST" });
      setUser(null);
      setMobileOpen(false);
      router.push("/login");
      router.refresh();
    } catch {
      router.push("/login");
    }
  }

  const roleDashboardHref =
    user?.role === "admin"
      ? "/admin"
      : user?.role === "farmer"
      ? "/farmer/products"
      : "/dashboard";

  const roleLabel =
    user?.role === "admin"
      ? "ผู้ดูแลระบบ"
      : user?.role === "farmer"
      ? "จัดการสวน"
      : "บัญชีของฉัน";

  const isTransparent = variant === "hero";

  const navLinks = [
    { href: "/", label: "🌾 ตลาดผลผลิต" },
    { href: "/news", label: "📰 ข่าวสารชุมชน" },
  ];

  return (
    <>
      <header
        className={`relative z-40 w-full transition-all duration-200 ${
          isTransparent
            ? "pt-3.5 sm:pt-5"
            : "bg-white/95 backdrop-blur-md border-b border-[#e5edd9] sticky top-0 shadow-[0_4px_16px_rgba(20,60,25,0.04)]"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5 sm:py-3.5 flex items-center justify-between gap-3">
          {/* Logo */}
          <div
            className={
              isTransparent
                ? "bg-white/93 backdrop-blur-md rounded-[28px] px-4 sm:px-5 py-2 sm:py-2.5 shadow-[0_8px_24px_rgba(16,65,28,0.14)] border border-white"
                : ""
            }
          >
            <Logo size="normal" showSubtitle={true} href="/" />
          </div>

          {/* Desktop Nav */}
          <nav aria-label="เมนูหลัก" className="hidden md:flex items-center gap-2 sm:gap-3">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`inline-flex items-center gap-1.5 rounded-full px-4 py-2 font-bold text-xs sm:text-sm transition ${
                  pathname === link.href
                    ? "bg-[#256c33] text-white shadow-sm"
                    : "bg-white/80 hover:bg-white text-[#1f4c27] border border-[#dce8d0]"
                }`}
              >
                <span>{link.label}</span>
              </Link>
            ))}

            {/* Cart */}
            <button
              type="button"
              onClick={
                onCartClick
                  ? onCartClick
                  : () => {
                      if (pathname === "/") {
                        window.scrollTo({ top: 400, behavior: "smooth" });
                      } else {
                        router.push("/?cart=open");
                      }
                    }
              }
              className="relative inline-flex items-center gap-2 rounded-full bg-white hover:bg-[#f6fcf4] text-[#1a331e] font-extrabold text-xs sm:text-sm px-4 sm:px-5 py-2 sm:py-2.5 shadow-[0_4px_14px_rgba(15,55,25,0.12)] border border-[#dce8d0] cursor-pointer transition active:scale-95"
              aria-label="เปิดตะกร้าสินค้า"
            >
              <svg viewBox="0 0 24 24" className="w-4 h-4 sm:w-5 sm:h-5 text-[#227730] shrink-0" fill="currentColor" aria-hidden="true">
                <path d="M7 18c-1.1 0-1.99.9-1.99 2S5.9 22 7 22s2-.9 2-2-.9-2-2-2zm10 0c-1.1 0-1.99.9-1.99 2s.89 2 1.99 2 2-.9 2-2-.9-2-2-2zM7.17 14.75l.03-.12.9-1.63h7.45c.75 0 1.41-.41 1.75-1.03l3.58-6.49A1.003 1.003 0 0 0 20 4H5.21l-.94-2H1v2h2l3.6 7.59-1.35 2.44C4.52 15.37 5.48 17 7 17h12v-2H7.42c-.14 0-.25-.11-.25-.25z" />
              </svg>
              <span>ตะกร้า</span>
              {cartCount > 0 && (
                <span className="absolute -top-2 -right-1.5 min-w-5 h-5 sm:min-w-6 sm:h-6 px-1.5 rounded-full bg-[#ef233c] text-white text-[11px] sm:text-xs font-black flex items-center justify-center shadow-md border-2 border-white">
                  {cartCount}
                </span>
              )}
            </button>

            {/* User / Login */}
            {loading ? (
              <div className="w-24 h-9 rounded-full bg-emerald-100/50 animate-pulse" />
            ) : user ? (
              <div className="flex items-center gap-2">
                <Link
                  href={roleDashboardHref}
                  className="inline-flex items-center gap-1.5 sm:gap-2 rounded-full bg-gradient-to-b from-[#2f8239] to-[#1a5622] hover:brightness-105 text-white font-extrabold text-xs sm:text-sm px-3.5 sm:px-4 py-2 sm:py-2.5 shadow-[0_4px_14px_rgba(14,52,22,0.22)] border border-white/40 transition active:scale-95"
                >
                  <span>{user.role === "admin" ? "🛡️" : user.role === "farmer" ? "🧑‍🌾" : "👤"}</span>
                  <span className="max-w-[120px] truncate">{user.fullName || user.name || roleLabel}</span>
                </Link>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="inline-flex items-center justify-center rounded-full bg-stone-100 hover:bg-rose-50 hover:text-rose-700 text-stone-600 font-bold text-xs px-3 py-2 transition border border-stone-200"
                  title="ออกจากระบบ"
                >
                  ออก
                </button>
              </div>
            ) : (
              <Link
                href="/login"
                className="inline-flex items-center gap-1.5 sm:gap-2 rounded-full bg-gradient-to-b from-[#2f8239] to-[#1a5622] hover:brightness-105 text-white font-extrabold text-xs sm:text-sm px-4 sm:px-5 py-2 sm:py-2.5 shadow-[0_4px_14px_rgba(14,52,22,0.22)] border border-white/40 transition active:scale-95"
              >
                <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 text-white shrink-0" fill="currentColor">
                  <path d="M12 12c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm0 2c-3.33 0-10 1.67-10 5v3h20v-3c0-3.33-6.67-5-10-5z" />
                </svg>
                <span>เข้าสู่ระบบ</span>
              </Link>
            )}
          </nav>

          {/* Mobile Right: Cart + Hamburger */}
          <div className="flex md:hidden items-center gap-2">
            {/* Mobile Cart */}
            <button
              type="button"
              onClick={
                onCartClick
                  ? onCartClick
                  : () => {
                      if (pathname === "/") {
                        window.scrollTo({ top: 400, behavior: "smooth" });
                      } else {
                        router.push("/?cart=open");
                      }
                    }
              }
              className="relative inline-flex items-center gap-1.5 rounded-full bg-white hover:bg-[#f6fcf4] text-[#1a331e] font-extrabold text-xs px-3 py-2 shadow-[0_4px_14px_rgba(15,55,25,0.12)] border border-[#dce8d0] cursor-pointer transition active:scale-95"
              aria-label="ตะกร้าสินค้า"
            >
              <svg viewBox="0 0 24 24" className="w-4 h-4 text-[#227730] shrink-0" fill="currentColor" aria-hidden="true">
                <path d="M7 18c-1.1 0-1.99.9-1.99 2S5.9 22 7 22s2-.9 2-2-.9-2-2-2zm10 0c-1.1 0-1.99.9-1.99 2s.89 2 1.99 2 2-.9 2-2-.9-2-2-2zM7.17 14.75l.03-.12.9-1.63h7.45c.75 0 1.41-.41 1.75-1.03l3.58-6.49A1.003 1.003 0 0 0 20 4H5.21l-.94-2H1v2h2l3.6 7.59-1.35 2.44C4.52 15.37 5.48 17 7 17h12v-2H7.42c-.14 0-.25-.11-.25-.25z" />
              </svg>
              {cartCount > 0 && (
                <span className="absolute -top-1.5 -right-1 min-w-4 h-4 px-1 rounded-full bg-[#ef233c] text-white text-[10px] font-black flex items-center justify-center shadow border-2 border-white">
                  {cartCount}
                </span>
              )}
            </button>

            {/* Hamburger */}
            <button
              type="button"
              onClick={() => setMobileOpen(!mobileOpen)}
              className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-white border border-[#dce8d0] shadow-sm text-[#1a331e] transition hover:bg-[#f0fdf4] active:scale-95"
              aria-label={mobileOpen ? "ปิดเมนู" : "เปิดเมนู"}
              aria-expanded={mobileOpen}
            >
              {mobileOpen ? (
                <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <path d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileOpen && (
          <div className="md:hidden bg-white border-t border-[#e5edd9] shadow-lg">
            <nav className="max-w-7xl mx-auto px-4 py-4 flex flex-col gap-2">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center gap-2 rounded-2xl px-4 py-3 font-bold text-sm transition ${
                    pathname === link.href
                      ? "bg-[#256c33] text-white"
                      : "bg-[#f6fdf5] text-[#1f4c27] hover:bg-[#eaf7e8] border border-[#dce8d0]"
                  }`}
                >
                  {link.label}
                </Link>
              ))}

              <div className="border-t border-[#e5edd9] pt-2 mt-1">
                {loading ? (
                  <div className="w-full h-11 rounded-2xl bg-emerald-100/50 animate-pulse" />
                ) : user ? (
                  <div className="flex flex-col gap-2">
                    <Link
                      href={roleDashboardHref}
                      className="flex items-center gap-2 rounded-2xl bg-gradient-to-b from-[#2f8239] to-[#1a5622] text-white font-extrabold text-sm px-4 py-3 shadow-sm border border-white/40 transition"
                    >
                      <span>{user.role === "admin" ? "🛡️" : user.role === "farmer" ? "🧑‍🌾" : "👤"}</span>
                      <span className="truncate">{user.fullName || user.name || roleLabel}</span>
                    </Link>
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="flex items-center justify-center rounded-2xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-sm px-4 py-3 transition border border-rose-200"
                    >
                      🚪 ออกจากระบบ
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col gap-2">
                    <Link
                      href="/login"
                      className="flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-b from-[#2f8239] to-[#1a5622] text-white font-extrabold text-sm px-4 py-3 shadow-sm border border-white/40 transition"
                    >
                      👤 เข้าสู่ระบบ
                    </Link>
                    <Link
                      href="/register"
                      className="flex items-center justify-center gap-2 rounded-2xl bg-[#f6fdf5] text-[#1f4c27] font-bold text-sm px-4 py-3 border border-[#dce8d0] transition hover:bg-[#eaf7e8]"
                    >
                      📝 สมัครสมาชิกฟรี
                    </Link>
                  </div>
                )}
              </div>
            </nav>
          </div>
        )}
      </header>
    </>
  );
}
