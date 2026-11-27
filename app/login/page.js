"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import PlukrakNavbar from "@/components/PlukrakNavbar";
import PlukrakFooter from "@/components/PlukrakFooter";
import Logo from "@/components/Logo";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (loading) return;

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "เข้าสู่ระบบไม่สำเร็จ กรุณาตรวจสอบอีเมลหรือรหัสผ่าน");
      }

      const role = data.user?.role || data.role;

      if (role === "farmer") {
        router.push("/farmer/products");
      } else if (role === "admin") {
        router.push("/admin");
      } else {
        router.push("/dashboard");
      }
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  const fillDemoAccount = (demoEmail) => {
    setEmail(demoEmail);
    setPassword("12345678");
    setError("");
  };

  return (
    <div className="min-h-screen flex flex-col justify-between bg-[#f6f4eb] text-[#152e1c]">
      <PlukrakNavbar />

      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8 relative">
        {/* Soft background ambient leaves */}
        <div className="absolute top-10 left-10 w-72 h-72 bg-emerald-400/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-10 right-10 w-72 h-72 bg-amber-400/10 rounded-full blur-3xl pointer-events-none" />

        {/* Unified Pluk Rak Card */}
        <div className="w-full max-w-4xl bg-white rounded-[28px] sm:rounded-[36px] overflow-hidden shadow-[0_12px_36px_rgba(20,60,25,0.08)] border border-[#e2ead8] grid grid-cols-1 lg:grid-cols-12 relative z-10">
          
          {/* Left Column: Farm Branding & Mascot Atmosphere */}
          <div className="lg:col-span-5 bg-gradient-to-br from-[#1b5e20] via-[#236b28] to-[#164e1c] text-white p-7 sm:p-9 flex flex-col justify-between relative overflow-hidden">
            {/* Background Sprout Silhouette */}
            <div className="absolute -right-10 -bottom-10 opacity-10 pointer-events-none">
              <svg viewBox="0 0 200 200" className="w-72 h-72 text-white" fill="currentColor">
                <path d="M100 180C100 140 106 90 136 64C120 74 100 90 98 120C80 90 60 70 30 70C20 110 50 140 100 180Z" />
              </svg>
            </div>

            <div>
              <div className="mb-6">
                <Logo size="normal" showSubtitle={false} light={true} />
              </div>

              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 backdrop-blur-xs border border-white/20 text-xs font-black text-amber-300 mb-3">
                <span>🌱 ตลาดเกษตรกรวิถีชุมชน</span>
              </div>

              <h2 className="text-2xl sm:text-3xl font-black leading-tight text-white drop-shadow-sm">
                ยินดีต้อนรับสู่ <br />
                <span className="text-[#a7f375]">ปลูกรัก Pluk Rak</span>
              </h2>

              <p className="text-xs sm:text-sm text-emerald-100/90 mt-3 leading-relaxed font-medium">
                เข้าสู่ระบบเพื่อจัดการสั่งซื้อ ติดตามผลผลิตจากแปลง หรือลงขายผลผลิตสดใหม่ส่งตรงจากสวนถึงมือคุณ
              </p>
            </div>

            {/* Farm Trust Board Plaque */}
            <div className="my-6 bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-4 space-y-2.5">
              <div className="flex items-center gap-3">
                <span className="w-6 h-6 rounded-full bg-[#a7f375] text-[#164e1c] font-black text-xs flex items-center justify-center shrink-0">
                  ✓
                </span>
                <span className="text-xs sm:text-sm font-bold text-white">ผลผลิตสดใหม่ ตัดสดจากแปลง</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="w-6 h-6 rounded-full bg-[#a7f375] text-[#164e1c] font-black text-xs flex items-center justify-center shrink-0">
                  ✓
                </span>
                <span className="text-xs sm:text-sm font-bold text-white">ตรวจสอบ Rapid Test 0.00 ppm</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="w-6 h-6 rounded-full bg-[#a7f375] text-[#164e1c] font-black text-xs flex items-center justify-center shrink-0">
                  ✓
                </span>
                <span className="text-xs sm:text-sm font-bold text-white">รายได้ส่งตรงถึงเกษตรกร 100%</span>
              </div>
            </div>

            <div className="text-[11px] text-emerald-200/80">
              💚 ร่วมสนับสนุนกลุ่มวิสาหกิจชุมชนไทยอย่างยั่งยืน
            </div>
          </div>

          {/* Right Column: Clean Login Form */}
          <div className="lg:col-span-7 p-7 sm:p-10 flex flex-col justify-between bg-white">
            <div>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h1 className="text-2xl sm:text-3xl font-black text-[#143d1a] tracking-tight">
                    เข้าสู่ระบบ
                  </h1>
                  <p className="text-xs sm:text-sm text-[#5d6e5a] font-medium mt-0.5">
                    กรอกข้อมูลเพื่อเข้าใช้งานระบบปลูกรัก
                  </p>
                </div>

                <Link
                  href="/"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-[#236b28] hover:text-[#164e1c] bg-[#edf6ea] hover:bg-[#e2f0dd] px-3.5 py-1.5 rounded-full transition"
                >
                  ← ตลาดผลผลิต
                </Link>
              </div>

              {/* Error Alert */}
              {error && (
                <div className="mb-5 p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs sm:text-sm flex items-start gap-2.5">
                  <span className="text-rose-600 text-base leading-none mt-0.5">⚠️</span>
                  <div className="flex-1 font-bold">{error}</div>
                </div>
              )}

              {/* Google Login Button */}
              <a
                href="/api/auth/google"
                className="w-full flex items-center justify-center gap-3 h-12 rounded-full border border-[#d6e0ce] bg-white hover:bg-[#f6fbf4] text-[#1b4323] text-xs sm:text-sm font-extrabold shadow-xs transition active:scale-98"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
                <span>เข้าสู่ระบบด้วย Google</span>
              </a>

              {/* Divider */}
              <div className="relative my-5 flex items-center justify-center">
                <div className="border-t border-[#e2ead8] w-full" />
                <span className="bg-white text-[#5d6e5a] px-3 text-xs font-semibold absolute">
                  หรือใช้อีเมลและรหัสผ่าน
                </span>
              </div>

              {/* Email Form */}
              <form onSubmit={handleLogin} className="space-y-3.5">
                <div>
                  <label
                    htmlFor="login-email"
                    className="block text-xs font-bold text-[#2e4732] mb-1.5"
                  >
                    อีเมลผู้ใช้งาน
                  </label>
                  <input
                    id="login-email"
                    type="email"
                    autoComplete="email"
                    required
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full h-11 px-4 text-sm font-medium rounded-2xl border border-[#d2dec8] bg-[#fbfdf9] focus:bg-white focus:border-[#2f8239] focus:ring-3 focus:ring-[#2f8239]/20 outline-none transition"
                  />
                </div>

                <div>
                  <label
                    htmlFor="login-password"
                    className="block text-xs font-bold text-[#2e4732] mb-1.5"
                  >
                    รหัสผ่าน
                  </label>
                  <div className="relative">
                    <input
                      id="login-password"
                      type={showPassword ? "text" : "password"}
                      autoComplete="current-password"
                      required
                      placeholder="กรอกรหัสผ่านของคุณ"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full h-11 pl-4 pr-16 text-sm font-medium rounded-2xl border border-[#d2dec8] bg-[#fbfdf9] focus:bg-white focus:border-[#2f8239] focus:ring-3 focus:ring-[#2f8239]/20 outline-none transition"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-[#2f8239] hover:text-[#1b5e20] px-2 py-0.5 rounded-lg bg-[#eef7ec] transition"
                    >
                      {showPassword ? "ซ่อน" : "แสดง"}
                    </button>
                  </div>
                </div>

                {/* Submit Button (Matching Mockup Vibrant Green) */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full h-12 mt-2 rounded-full bg-gradient-to-b from-[#2f8239] to-[#1a5622] hover:brightness-105 text-white font-black text-sm sm:text-base shadow-[0_6px_18px_rgba(18,60,25,0.22)] active:scale-98 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>กำลังเข้าสู่ระบบ...</span>
                    </>
                  ) : (
                    <span>เข้าสู่ระบบ ➔</span>
                  )}
                </button>
              </form>

              {/* Demo Account Quick-Fill Buttons */}
              <div className="mt-5 p-3.5 rounded-2xl bg-[#f4f9f2] border border-[#dbe8d6]">
                <p className="text-[11px] font-extrabold text-[#256c33] mb-2 flex items-center gap-1.5">
                  <span>⚡</span>
                  <span>ทดสอบเข้าสู่ระบบแบบด่วน (คลิกเลือกบทบาท):</span>
                </p>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => fillDemoAccount("kamonsut.s68@rsu.ac.th")}
                    className="p-1.5 rounded-xl bg-white hover:bg-[#eaf4e6] border border-[#cfdfc8] text-center text-xs font-bold text-[#1e4825] transition active:scale-95"
                  >
                    🛡️ แอดมิน
                  </button>
                  <button
                    type="button"
                    onClick={() => fillDemoAccount("farmer01@example.com")}
                    className="p-1.5 rounded-xl bg-white hover:bg-[#eaf4e6] border border-[#cfdfc8] text-center text-xs font-bold text-[#1e4825] transition active:scale-95"
                  >
                    🧑‍🌾 เกษตรกร
                  </button>
                  <button
                    type="button"
                    onClick={() => fillDemoAccount("testuser03@example.com")}
                    className="p-1.5 rounded-xl bg-white hover:bg-[#eaf4e6] border border-[#cfdfc8] text-center text-xs font-bold text-[#1e4825] transition active:scale-95"
                  >
                    👤 ผู้ซื้อ/สมาชิก
                  </button>
                </div>
              </div>
            </div>

            {/* Footer Links */}
            <div className="mt-5 pt-4 border-t border-[#e2ead8] text-center text-xs sm:text-sm font-bold">
              <p className="text-[#5d6e5a]">
                ยังไม่มีบัญชีผู้ใช้งาน?{" "}
                <Link
                  href="/register"
                  className="text-[#236b28] hover:text-[#164e1c] underline underline-offset-2 ml-1"
                >
                  สมัครสมาชิกใหม่ฟรี
                </Link>
              </p>
            </div>
          </div>
        </div>
      </main>

      <PlukrakFooter />
    </div>
  );
}
