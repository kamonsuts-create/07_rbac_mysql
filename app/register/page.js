"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import PlukrakNavbar from "@/components/PlukrakNavbar";
import PlukrakFooter from "@/components/PlukrakFooter";
import Logo from "@/components/Logo";

export default function RegisterPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("user");
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleRegister(event) {
    event.preventDefault();
    if (loading) return;

    setError("");
    setMessage("");

    // Frontend validation — รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร
    if (password.length < 8) {
      setError("รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullName, email, password, role }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "สมัครสมาชิกไม่สำเร็จ กรุณาลองใหม่อีกครั้ง");
      }

      setMessage("สมัครสมาชิกสำเร็จเรียบร้อย! กำลังพาคุณเข้าสู่ระบบ...");
      setTimeout(() => {
        router.push("/login");
      }, 1200);
    } catch (err) {
      setError(err.message || "เกิดข้อผิดพลาดในการสมัครสมาชิก");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col justify-between bg-[#f6f4eb] text-[#152e1c]">
      <PlukrakNavbar />

      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8 relative">
        {/* Soft background ambient leaves */}
        <div className="absolute top-10 left-10 w-72 h-72 bg-emerald-400/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-10 right-10 w-72 h-72 bg-amber-400/10 rounded-full blur-3xl pointer-events-none" />

        {/* Unified Pluk Rak Card */}
        <div className="w-full max-w-4xl bg-white rounded-[28px] sm:rounded-[36px] overflow-hidden shadow-[0_12px_36px_rgba(20,60,25,0.08)] border border-[#e2ead8] grid grid-cols-1 lg:grid-cols-12 relative z-10">
          
          {/* Left Column: Farm Community Welcome */}
          <div className="lg:col-span-5 bg-gradient-to-br from-[#1b5e20] via-[#236b28] to-[#164e1c] text-white p-7 sm:p-9 flex flex-col justify-between relative overflow-hidden">
            <div>
              <div className="mb-6">
                <Logo size="normal" showSubtitle={false} light={true} />
              </div>

              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 backdrop-blur-xs border border-white/20 text-xs font-black text-amber-300 mb-3">
                <span>🌱 เครือข่ายเกษตรอินทรีย์ไทย</span>
              </div>

              <h2 className="text-2xl sm:text-3xl font-black leading-tight text-white drop-shadow-sm">
                ร่วมเติบโต <br />
                <span className="text-[#a7f375]">ไปด้วยกันกับเรา</span>
              </h2>

              <p className="text-xs sm:text-sm text-emerald-100/90 mt-3 leading-relaxed font-medium">
                ร่วมเป็นส่วนหนึ่งของเครือข่ายเกษตรกรชุมชน และผู้บริโภคที่ใส่ใจสุขภาพ ส่งตรงผลผลิตสดใหม่ ปลอดสารเคมี จากแปลงสู่ครัวคุณ
              </p>
            </div>

            {/* Value Highlights */}
            <div className="my-6 space-y-3">
              <div className="flex items-center gap-3.5 bg-white/10 backdrop-blur-sm border border-white/20 px-4 py-3 rounded-2xl">
                <span className="text-2xl">🥬</span>
                <div className="text-xs">
                  <p className="font-extrabold text-white">ผลผลิตสดแท้จากสวน</p>
                  <p className="text-emerald-200/90">ตัดสดเช้าตรู่ ส่งตรงไม่ผ่านคนกลาง</p>
                </div>
              </div>
              <div className="flex items-center gap-3.5 bg-white/10 backdrop-blur-sm border border-white/20 px-4 py-3 rounded-2xl">
                <span className="text-2xl">🌾</span>
                <div className="text-xs">
                  <p className="font-extrabold text-white">สนับสนุนชุมชนชาวสวนไทย</p>
                  <p className="text-emerald-200/90">รายได้ตรงสู่กลุ่มเกษตรกรอย่างยั่งยืน</p>
                </div>
              </div>
            </div>

            <div className="text-[11px] text-emerald-200/80">
              💚 มั่นใจในทุกคำสั่งซื้อด้วยระบบตรวจสอบย้อนกลับ GAP & GI
            </div>
          </div>

          {/* Right Column: Register Form */}
          <div className="lg:col-span-7 p-7 sm:p-10 flex flex-col justify-between bg-white">
            <div>
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h1 className="text-2xl sm:text-3xl font-black text-[#143d1a] tracking-tight">
                    สมัครสมาชิกใหม่
                  </h1>
                  <p className="text-xs sm:text-sm text-[#5d6e5a] font-medium mt-0.5">
                    ลงทะเบียนเข้าเป็นส่วนหนึ่งของตลาดปลูกรัก
                  </p>
                </div>

                <Link
                  href="/login"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-[#236b28] hover:text-[#164e1c] bg-[#edf6ea] hover:bg-[#e2f0dd] px-3.5 py-1.5 rounded-full transition"
                >
                  เข้าสู่ระบบ ➔
                </Link>
              </div>

              {/* Status Alert */}
              {error && (
                <div className="mb-4 p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs sm:text-sm flex items-start gap-2.5">
                  <span className="text-rose-600 text-base leading-none mt-0.5">⚠️</span>
                  <div className="flex-1 font-bold">{error}</div>
                </div>
              )}

              {message && (
                <div className="mb-4 p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs sm:text-sm flex items-start gap-2.5">
                  <span className="text-emerald-600 text-base leading-none mt-0.5">✅</span>
                  <div className="flex-1 font-bold">{message}</div>
                </div>
              )}

              {/* Register Form */}
              <form onSubmit={handleRegister} className="space-y-3.5">
                <div>
                  <label
                    htmlFor="reg-name"
                    className="block text-xs font-bold text-[#2e4732] mb-1"
                  >
                    ชื่อ-นามสกุล หรือชื่อวิสาหกิจชุมชน
                  </label>
                  <input
                    id="reg-name"
                    type="text"
                    required
                    placeholder="เช่น สมชาย ใจดี หรือ สวนสุขใจ ปทุมธานี"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full h-11 px-4 text-sm font-medium rounded-2xl border border-[#d2dec8] bg-[#fbfdf9] focus:bg-white focus:border-[#2f8239] focus:ring-3 focus:ring-[#2f8239]/20 outline-none transition"
                  />
                </div>

                <div>
                  <label
                    htmlFor="reg-email"
                    className="block text-xs font-bold text-[#2e4732] mb-1"
                  >
                    อีเมล
                  </label>
                  <input
                    id="reg-email"
                    type="email"
                    required
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full h-11 px-4 text-sm font-medium rounded-2xl border border-[#d2dec8] bg-[#fbfdf9] focus:bg-white focus:border-[#2f8239] focus:ring-3 focus:ring-[#2f8239]/20 outline-none transition"
                  />
                </div>

                <div>
                  <label
                    htmlFor="reg-password"
                    className="block text-xs font-bold text-[#2e4732] mb-1"
                  >
                    กำหนดรหัสผ่าน <span className="text-rose-600">(อย่างน้อย 8 ตัวอักษร)</span>
                  </label>
                  <div className="relative">
                    <input
                      id="reg-password"
                      type={showPassword ? "text" : "password"}
                      required
                      minLength={8}
                      placeholder="สร้างรหัสผ่านที่ปลอดภัย (อย่างน้อย 8 ตัวอักษร)"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className={`w-full h-11 pl-4 pr-16 text-sm font-medium rounded-2xl border bg-[#fbfdf9] focus:bg-white focus:ring-3 outline-none transition ${
                        password.length > 0 && password.length < 8
                          ? "border-rose-400 focus:border-rose-500 focus:ring-rose-200"
                          : "border-[#d2dec8] focus:border-[#2f8239] focus:ring-[#2f8239]/20"
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-[#2f8239] hover:text-[#1b5e20] px-2 py-0.5 rounded-lg bg-[#eef7ec] transition"
                    >
                      {showPassword ? "ซ่อน" : "แสดง"}
                    </button>
                  </div>
                  {/* Password strength hint */}
                  {password.length > 0 && (
                    <p className={`mt-1.5 text-[11px] font-semibold ${password.length < 8 ? "text-rose-500" : "text-emerald-600"}`}>
                      {password.length < 8
                        ? `⚠ ต้องการอีก ${8 - password.length} ตัวอักษร (ขั้นต่ำ 8 ตัว)`
                        : "✓ รหัสผ่านได้มาตรฐาน"}
                    </p>
                  )}
                </div>

                {/* Role Selection */}
                <div>
                  <label className="block text-xs font-bold text-[#2e4732] mb-1.5">
                    ประเภทการใช้งาน
                  </label>
                  <div className="grid grid-cols-2 gap-2.5">
                    <button
                      type="button"
                      onClick={() => setRole("user")}
                      className={`p-2.5 rounded-2xl border text-left transition flex items-center gap-2.5 ${
                        role === "user"
                          ? "bg-[#edf6ea] border-[#2f8239] text-[#1b5e20] ring-2 ring-[#2f8239]/30 font-extrabold"
                          : "bg-[#fbfdf9] border-[#d2dec8] text-[#556952] hover:bg-white font-medium"
                      }`}
                    >
                      <span className="text-xl">👤</span>
                      <div>
                        <p className="text-xs font-extrabold">ผู้ซื้อทั่วไป</p>
                        <p className="text-[10px] text-[#5d6e5a]">เลือกซื้อผลผลิตส่งถึงบ้าน</p>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setRole("farmer")}
                      className={`p-2.5 rounded-2xl border text-left transition flex items-center gap-2.5 ${
                        role === "farmer"
                          ? "bg-[#edf6ea] border-[#2f8239] text-[#1b5e20] ring-2 ring-[#2f8239]/30 font-extrabold"
                          : "bg-[#fbfdf9] border-[#d2dec8] text-[#556952] hover:bg-white font-medium"
                      }`}
                    >
                      <span className="text-xl">🧑‍🌾</span>
                      <div>
                        <p className="text-xs font-extrabold">เกษตรกร / สวน</p>
                        <p className="text-[10px] text-[#5d6e5a]">ลงขายผลผลิตและจัดการแปลง</p>
                      </div>
                    </button>
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full h-12 mt-3 rounded-full bg-gradient-to-b from-[#2f8239] to-[#1a5622] hover:brightness-105 text-white font-black text-sm sm:text-base shadow-[0_6px_18px_rgba(18,60,25,0.22)] active:scale-98 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>กำลังสร้างบัญชี...</span>
                    </>
                  ) : (
                    <span>+ ยืนยันการสมัครสมาชิก</span>
                  )}
                </button>
              </form>
            </div>

            {/* Footer Links */}
            <div className="mt-5 pt-4 border-t border-[#e2ead8] text-center text-xs sm:text-sm font-bold">
              <p className="text-[#5d6e5a]">
                มีบัญชีผู้ใช้งานอยู่แล้ว?{" "}
                <Link
                  href="/login"
                  className="text-[#236b28] hover:text-[#164e1c] underline underline-offset-2 ml-1"
                >
                  เข้าสู่ระบบที่นี่
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
