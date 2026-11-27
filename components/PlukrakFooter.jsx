import Link from "next/link";
import Logo from "./Logo";

export default function PlukrakFooter() {
  return (
    <footer className="mt-16 bg-[#163820] text-emerald-100/90 relative overflow-hidden border-t-4 border-[#256c33]">
      {/* Decorative leaf watermarks */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-10 -left-10 w-64 h-64 bg-amber-400/5 rounded-full blur-2xl pointer-events-none" />

      {/* Top Trust Pillars Banner */}
      <div className="border-b border-emerald-900/60 bg-[#0f2817]/70 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div className="flex flex-col items-center p-2">
            <span className="text-2xl sm:text-3xl mb-1">🥬</span>
            <p className="font-extrabold text-white text-xs sm:text-sm">ตัดสดจากแปลงเช้าตรู่</p>
            <p className="text-[11px] text-emerald-300/80">รักษาคุณค่าทางอาหารและความสดสูงสุด</p>
          </div>
          <div className="flex flex-col items-center p-2">
            <span className="text-2xl sm:text-3xl mb-1">🔬</span>
            <p className="font-extrabold text-white text-xs sm:text-sm">ตรวจ Rapid Test 0.00 ppm</p>
            <p className="text-[11px] text-emerald-300/80">ผ่านเกณฑ์มาตรฐานความปลอดภัย</p>
          </div>
          <div className="flex flex-col items-center p-2">
            <span className="text-2xl sm:text-3xl mb-1">💳</span>
            <p className="font-extrabold text-white text-xs sm:text-sm">โอนเงินตรงสู่ชาวสวน</p>
            <p className="text-[11px] text-emerald-300/80">ระบบ Direct P2P ไม่หักค่าธรรมเนียม</p>
          </div>
          <div className="flex flex-col items-center p-2">
            <span className="text-2xl sm:text-3xl mb-1">🚚</span>
            <p className="font-extrabold text-white text-xs sm:text-sm">รถขนส่งควบคุมอุณหภูมิ</p>
            <p className="text-[11px] text-emerald-300/80">จัดส่งตรงถึงหน้าประตูบ้านในวันเดียว</p>
          </div>
        </div>
      </div>

      {/* Main Footer Links */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
          {/* Brand Info */}
          <div className="md:col-span-5 space-y-4">
            <Logo size="normal" showSubtitle={true} light={true} />
            <p className="text-xs sm:text-sm text-emerald-200/80 leading-relaxed max-w-sm">
              แพลตฟอร์มตลาดผลผลิตเกษตรชุมชน ส่งเสริมวิสาหกิจชุมชนไทยและเกษตรกรตัวจริง เชื่อมโยงผลผลิตอินทรีย์ ปลอดสารเคมี จากแปลงเพาะปลูกสู่ครัวผู้บริโภคโดยตรง
            </p>
            <div className="flex items-center gap-2 pt-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-900/60 border border-emerald-600/40 text-amber-300 text-xs font-bold">
                ⭐ ได้รับการรับรอง GAP & GI ชุมชน
              </span>
            </div>
          </div>

          {/* Quick Links */}
          <div className="md:col-span-3 space-y-3">
            <h4 className="font-extrabold text-white text-sm sm:text-base tracking-wide">สำรวจตลาด</h4>
            <ul className="space-y-2 text-xs sm:text-sm">
              <li>
                <Link href="/" className="hover:text-white transition">🌾 ตลาดผลผลิตสดจากสวน</Link>
              </li>
              <li>
                <Link href="/news" className="hover:text-white transition">📰 ข่าวสารเกษตรอินทรีย์</Link>
              </li>
              <li>
                <Link href="/login" className="hover:text-white transition">🧑‍🌾 แผงร้านค้าเกษตรกร</Link>
              </li>
              <li>
                <Link href="/register" className="hover:text-white transition">📝 สมัครสมาชิกเครือข่าย</Link>
              </li>
            </ul>
          </div>

          {/* Contact / Location */}
          <div className="md:col-span-4 space-y-3">
            <h4 className="font-extrabold text-white text-sm sm:text-base tracking-wide">เครือข่ายวิสาหกิจชุมชน</h4>
            <p className="text-xs sm:text-sm text-emerald-200/80 leading-relaxed">
              📍 ศูนย์ประสานงานตลาดผลผลิตเกษตรชุมชนปลูกรัก (ปทุมธานี & นครปฐม)<br />
              📞 โทรศัพท์ติดต่อฝ่ายบริการสมาชิก: 081-817-9418<br />
              🕒 เวลาทำการ: จันทร์ - เสาร์ 07:00 - 18:00 น.
            </p>
          </div>
        </div>

        {/* Bottom copyright */}
        <div className="mt-10 pt-6 border-t border-emerald-900/60 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-emerald-300/70">
          <p>© 2026 ปลูกรัก Pluk Rak. ตลาดผลผลิตเกษตรชุมชนส่งตรงจากสวน สงวนลิขสิทธิ์</p>
          <p className="text-[11px]">พัฒนาด้วย Next.js • รองรับการใช้งานออนไลน์บน Cloud</p>
        </div>
      </div>
    </footer>
  );
}
