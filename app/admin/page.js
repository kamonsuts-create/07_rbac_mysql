"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import PlukrakNavbar from "@/components/PlukrakNavbar";
import PlukrakFooter from "@/components/PlukrakFooter";

export default function AdminPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function checkAdmin() {
      try {
        const res = await fetch("/api/me", { cache: "no-store" });
        const data = await res.json();

        if (!res.ok) {
          router.replace("/login");
          return;
        }

        const permissions = data.permissions || [];
        const allowed =
          permissions.includes("*") ||
          permissions.includes("user:manage");

        if (!allowed) {
          setError("บัญชีนี้ไม่มีสิทธิ์เข้าถึงระบบผู้ดูแล (ต้องเป็น Admin หรือมีสิทธิ์ user:manage)");
          return;
        }

        setUser(data.user);
      } catch {
        setError("ไม่สามารถเชื่อมต่อระบบได้ กรุณาลองใหม่อีกครั้ง");
      } finally {
        setLoading(false);
      }
    }

    checkAdmin();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col justify-between bg-[#f6f4eb]">
        <PlukrakNavbar />
        <main className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="w-10 h-10 border-4 border-[#2f8239] border-t-transparent rounded-full animate-spin" />
            <p className="text-sm font-bold text-[#2e4732]">กำลังตรวจสอบสิทธิ์ผู้ดูแลระบบปลูกรัก...</p>
          </div>
        </main>
        <PlukrakFooter />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col justify-between bg-[#f6f4eb]">
        <PlukrakNavbar />
        <main className="flex-1 flex items-center justify-center p-6">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full text-center border border-rose-200 shadow-lg">
            <span className="text-5xl block mb-3">🚫</span>
            <h1 className="text-xl font-black text-rose-900">ไม่สามารถเข้าถึงได้</h1>
            <p className="mt-2 text-xs sm:text-sm text-stone-600 font-medium leading-relaxed">{error}</p>
            <div className="mt-6 flex flex-col gap-3">
              <Link
                href="/dashboard"
                className="px-5 py-2.5 rounded-full bg-[#2f8239] hover:bg-[#236b28] text-white text-xs font-bold transition"
              >
                กลับสู่แดชบอร์ดสมาชิก
              </Link>
              <Link
                href="/"
                className="px-5 py-2.5 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold transition"
              >
                กลับสู่หน้าร้านค้า
              </Link>
            </div>
          </div>
        </main>
        <PlukrakFooter />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col justify-between bg-[#f6f4eb] text-[#152e1c]">
      <PlukrakNavbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 flex-1 w-full space-y-8">
        
        {/* Welcome Header */}
        <section className="bg-gradient-to-r from-[#1b5e20] via-[#236b28] to-[#164e1c] text-white rounded-[28px] sm:rounded-[36px] p-8 sm:p-10 shadow-md relative overflow-hidden">
          <div className="relative z-10 max-w-2xl space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 border border-white/20 text-xs font-black text-amber-300">
              <span>🛡️ ศูนย์ควบคุมผู้ดูแลระบบ</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-black tracking-tight leading-tight">
              ยินดีต้อนรับ, {user?.fullName || "ผู้ดูแลระบบ"} 👋
            </h1>
            <p className="text-xs sm:text-sm text-emerald-100/90 leading-relaxed font-medium">
              ศูนย์กลางการจัดการหลังบ้านระบบตลาดปลูกรัก ควบคุมสิทธิ์สมาชิก (RBAC) ตรวจสอบข้อมูลข่าวสาร และดูแลความเรียบร้อยของตลาด
            </p>
          </div>
        </section>

        {/* Management Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
          {/* Card 1: Users */}
          <Link
            href="/admin/users"
            className="bg-white rounded-3xl p-7 border border-[#e2ead8] shadow-[0_8px_24px_rgba(20,60,25,0.05)] hover:shadow-[0_12px_32px_rgba(20,60,25,0.1)] transition-all duration-300 flex flex-col justify-between group"
          >
            <div>
              <div className="w-14 h-14 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center text-2xl shadow-xs group-hover:scale-110 transition-transform">
                👥
              </div>
              <h2 className="text-lg sm:text-xl font-black text-[#152e1c] mt-5 group-hover:text-[#236f2b] transition-colors">
                จัดการสมาชิก (RBAC)
              </h2>
              <p className="text-xs sm:text-sm text-[#5d6e5a] mt-2 font-medium leading-relaxed">
                ดูรายชื่อผู้ใช้งาน เพิ่มบัญชีใหม่ ค้นหาสมาชิก และปรับเปลี่ยนบทบาท (Admin, Farmer, Staff, User)
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-[#e2ead8] flex items-center justify-between text-xs font-black text-[#2f8239]">
              <span>เข้าสู่หน้าจัดการสมาชิก</span>
              <span className="group-hover:translate-x-1 transition-transform">➔</span>
            </div>
          </Link>

          {/* Card 2: News */}
          <Link
            href="/admin/news"
            className="bg-white rounded-3xl p-7 border border-[#e2ead8] shadow-[0_8px_24px_rgba(20,60,25,0.05)] hover:shadow-[0_12px_32px_rgba(20,60,25,0.1)] transition-all duration-300 flex flex-col justify-between group"
          >
            <div>
              <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-[#1b5e20] flex items-center justify-center text-2xl shadow-xs group-hover:scale-110 transition-transform">
                📰
              </div>
              <h2 className="text-lg sm:text-xl font-black text-[#152e1c] mt-5 group-hover:text-[#236f2b] transition-colors">
                จัดการข่าวสารและบทความ
              </h2>
              <p className="text-xs sm:text-sm text-[#5d6e5a] mt-2 font-medium leading-relaxed">
                สร้างบทความใหม่ เผยแพร่ข่าวประชาสัมพันธ์ชุมชน และแก้ไขหรือลบข่าวสารที่มีอยู่ในระบบ
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-[#e2ead8] flex items-center justify-between text-xs font-black text-[#2f8239]">
              <span>เข้าสู่หน้าจัดการข่าวสาร</span>
              <span className="group-hover:translate-x-1 transition-transform">➔</span>
            </div>
          </Link>

          {/* Card 3: Storefront View */}
          <Link
            href="/"
            className="bg-white rounded-3xl p-7 border border-[#e2ead8] shadow-[0_8px_24px_rgba(20,60,25,0.05)] hover:shadow-[0_12px_32px_rgba(20,60,25,0.1)] transition-all duration-300 flex flex-col justify-between group"
          >
            <div>
              <div className="w-14 h-14 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center text-2xl shadow-xs group-hover:scale-110 transition-transform">
                🌾
              </div>
              <h2 className="text-lg sm:text-xl font-black text-[#152e1c] mt-5 group-hover:text-[#236f2b] transition-colors">
                หน้าร้านค้าปลูกรัก
              </h2>
              <p className="text-xs sm:text-sm text-[#5d6e5a] mt-2 font-medium leading-relaxed">
                ดูผลลัพธ์ของระบบหน้าร้านจริง ตลาดผลผลิตเกษตรอินทรีย์สำหรับผู้ซื้อ และตรวจสอบการแสดงผล
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-[#e2ead8] flex items-center justify-between text-xs font-black text-[#2f8239]">
              <span>เปิดดูหน้าร้านค้าจริง</span>
              <span className="group-hover:translate-x-1 transition-transform">↗</span>
            </div>
          </Link>
        </div>

        {/* System Status Card */}
        <div className="bg-white rounded-3xl p-6 border border-[#e2ead8] shadow-xs flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="relative flex h-3.5 w-3.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500"></span>
            </span>
            <div>
              <h3 className="font-extrabold text-[#152e1c] text-sm">ระบบฐานข้อมูลพร้อมทำงาน</h3>
              <p className="text-xs text-[#5d6e5a]">เชื่อมต่อ MySQL และระบบควบคุมสิทธิ์ RBAC ใช้งานได้จริง</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full bg-[#edf6ea] text-[#1b5e20] text-xs font-black border border-[#cbe1c3]">
              Database: MySQL 8.0+
            </span>
            <span className="px-3 py-1 rounded-full bg-purple-50 text-purple-800 text-xs font-black border border-purple-200">
              Role: Administrator
            </span>
          </div>
        </div>

      </main>

      <PlukrakFooter />
    </div>
  );
}
