import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import pool from "@/lib/db";
import { setSession } from "@/lib/auth";

export async function POST(request) {
  try {
    const body = await request.json();

    const email = String(body.email || "").trim().toLowerCase();
    const password = String(body.password || "");

    if (!email || !password) {
      return NextResponse.json(
        { message: "กรุณากรอกอีเมลและรหัสผ่าน" },
        { status: 400 }
      );
    }

    // ค้นหาผู้ใช้พร้อมข้อมูล Role
    const [rows] = await pool.execute(
      `SELECT
         u.id,
         u.full_name,
         u.email,
         u.password_hash,
         u.is_active,
         r.code AS role
       FROM users u
       JOIN roles r ON r.id = u.role_id
       WHERE u.email = ?
       LIMIT 1`,
      [email]
    );

    if (rows.length === 0) {
      return NextResponse.json(
        { message: "อีเมลหรือรหัสผ่านไม่ถูกต้อง" },
        { status: 401 }
      );
    }

    const user = rows[0];

    // ตรวจสอบสถานะบัญชี
    if (!user.is_active) {
      return NextResponse.json(
        { message: "บัญชีนี้ถูกระงับการใช้งาน" },
        { status: 403 }
      );
    }

    // ตรวจสอบรหัสผ่าน
    const passwordMatch = await bcrypt.compare(
      password,
      user.password_hash
    );

    if (!passwordMatch) {
      return NextResponse.json(
        { message: "อีเมลหรือรหัสผ่านไม่ถูกต้อง" },
        { status: 401 }
      );
    }

    // สร้าง Session
    await setSession({
      id: user.id,
      email: user.email,
    });

    return NextResponse.json({
      message: "เข้าสู่ระบบสำเร็จ",
      user: {
        id: user.id,
        fullName: user.full_name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Login error:", error);

    return NextResponse.json(
      { message: "เกิดข้อผิดพลาดในการเข้าสู่ระบบ" },
      { status: 500 }
    );
  }
}
