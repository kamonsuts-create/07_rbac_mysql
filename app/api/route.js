import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import pool from "@/lib/db";
import { getRoleByCode } from "@/lib/rbac";
import { setSession } from "@/lib/auth";

export async function POST(request) {
  try {
    const body = await request.json();

    const fullName = String(body.fullName || "").trim();
    const email = String(body.email || "").trim().toLowerCase();
    const password = String(body.password || "");

    // ตรวจสอบข้อมูล
    if (!fullName || !email || !password) {
      return NextResponse.json(
        { message: "กรุณากรอกข้อมูลให้ครบ" },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { message: "รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร" },
        { status: 400 }
      );
    }

    // ตรวจสอบอีเมลซ้ำ
    const [existingUsers] = await pool.execute(
      "SELECT id FROM users WHERE email = ? LIMIT 1",
      [email]
    );

    if (existingUsers.length > 0) {
      return NextResponse.json(
        { message: "อีเมลนี้ถูกใช้งานแล้ว" },
        { status: 409 }
      );
    }

    // กำหนด role เป็น user เสมอ
    const role = await getRoleByCode("user");

    if (!role) {
      return NextResponse.json(
        { message: "ไม่พบ role user ในฐานข้อมูล" },
        { status: 500 }
      );
    }

    // เข้ารหัสรหัสผ่าน
    const passwordHash = await bcrypt.hash(password, 12);

    // เพิ่มผู้ใช้ลงฐานข้อมูล
    const [result] = await pool.execute(
      `INSERT INTO users (full_name, email, password_hash, role_id)
       VALUES (?, ?, ?, ?)`,
      [fullName, email, passwordHash, role.id]
    );

    const newUser = {
      id: result.insertId,
      email,
    };

    // สร้าง Session
    await setSession(newUser);

    return NextResponse.json(
      {
        message: "สมัครสมาชิกสำเร็จ",
        user: {
          id: newUser.id,
          fullName,
          email,
          role: "user",
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Register error:", error);

    return NextResponse.json(
      { message: "เกิดข้อผิดพลาดในการสมัครสมาชิก" },
      { status: 500 }
    );
  }
}
