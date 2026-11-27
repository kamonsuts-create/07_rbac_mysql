import { NextResponse } from "next/server";
import pool from "@/lib/db";
import bcrypt from "bcryptjs";
import { setSession } from "@/lib/auth";
export async function POST(request) {
  try {
    const body = await request.json();
    const email = typeof body.email === "string" ? body.email.trim() : "";
    const password = typeof body.password === "string" ? body.password : "";

    if (!email || !password) {
      return NextResponse.json(
        { message: "กรุณากรอกอีเมลและรหัสผ่านให้ครบถ้วน" },
        { status: 401 }
      );
    }

    // ค้นหาผู้ใช้จากฐานข้อมูล MySQL
    const [users] = await pool.execute(
      `SELECT u.id, u.full_name, u.email, u.password_hash, r.code AS role 
       FROM users u 
       JOIN roles r ON r.id = u.role_id 
       WHERE u.email = ? AND u.is_active = TRUE
       ORDER BY CASE WHEN u.id = 7 THEN 0 ELSE 1 END, u.id ASC
       LIMIT 1`,
      [email]
    );

    if (users.length === 0) {
      return NextResponse.json(
        { message: "ไม่พบบัญชีผู้ใช้หรืออีเมลไม่ถูกต้อง" },
        { status: 401 }
      );
    }

    const user = users[0];

    // ตรวจสอบรหัสผ่าน
    const isMatch = await bcrypt.compare(password, user.password_hash);
  if (!isMatch) {
      return NextResponse.json(
        { message: "รหัสผ่านไม่ถูกต้อง" },
        { status: 401 }
      );
    }
await setSession({
  id: user.id,
  role: user.role,
});
    return NextResponse.json(
      { 
        message: "เข้าสู่ระบบสำเร็จ", 
        user: { id: user.id, name: user.full_name, role: user.role } 
      },
      { status: 200 }
    );

  } catch (error) {
    console.error("Login API Error:", error);
    return NextResponse.json(
      { message: "เกิดข้อผิดพลาดที่เซิร์ฟเวอร์: " + error.message },
      { status: 500 }
    );
  }
}
