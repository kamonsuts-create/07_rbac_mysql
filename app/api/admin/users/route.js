import bcrypt from "bcryptjs";

import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { getSession } from "@/lib/auth";
import { hasPermission } from "@/lib/rbac";

async function checkAdminPermission() {
  const session = await getSession();

  if (!session?.userId) {
    return {
      error: NextResponse.json(
        { message: "กรุณาเข้าสู่ระบบ" },
        { status: 401 }
      ),
    };
  }

  const allowed = await hasPermission(session.userId, "user:manage");

  if (!allowed) {
    return {
      error: NextResponse.json(
        { message: "คุณไม่มีสิทธิ์จัดการผู้ใช้" },
        { status: 403 }
      ),
    };
  }

  return { session };
}

// GET: แสดงรายชื่อผู้ใช้
export async function GET() {
  try {
    const auth = await checkAdminPermission();
    if (auth.error) return auth.error;

    const [users] = await pool.execute(`
      SELECT
        u.id,
        u.full_name,
        u.email,
        u.is_active,
        r.code AS role_code,
        r.name AS role_name
      FROM users u
      JOIN roles r ON r.id = u.role_id
      ORDER BY u.id ASC
    `);

    return NextResponse.json({ users });
  } catch (error) {
    console.error("GET users error:", error);
    return NextResponse.json(
      { message: "ไม่สามารถดึงข้อมูลผู้ใช้ได้" },
      { status: 500 }
    );
  }
}

// POST: Admin สร้างสมาชิกใหม่
export async function POST(request) {
  try {
    const auth = await checkAdminPermission();
    if (auth.error) return auth.error;

    const body = await request.json();

    const fullName = String(body.fullName || "").trim();
    const email = String(body.email || "").trim().toLowerCase();
    const password = String(body.password || "");
    const roleCode = String(body.roleCode || "user");

    if (!fullName || !email || !password) {
      return NextResponse.json(
        { message: "กรุณากรอกข้อมูลให้ครบ" },
        { status: 400 }
      );
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { message: "รูปแบบอีเมลไม่ถูกต้อง" },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { message: "รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร" },
        { status: 400 }
      );
    }

    if (!["admin", "staff", "user", "farmer"].includes(roleCode)) {
      return NextResponse.json(
        { message: "บทบาทที่ระบุไม่ถูกต้อง" },
        { status: 400 }
      );
    }

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

    const [roleRows] = await pool.execute(
      "SELECT id FROM roles WHERE code = ? LIMIT 1",
      [roleCode]
    );

    if (roleRows.length === 0) {
      return NextResponse.json(
        { message: "ไม่พบบทบาทที่ระบุ" },
        { status: 400 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const [result] = await pool.execute(
      `INSERT INTO users
        (full_name, email, password_hash, role_id)
       VALUES (?, ?, ?, ?)`,
      [fullName, email, passwordHash, roleRows[0].id]
    );

    return NextResponse.json(
      {
        message: "สร้างสมาชิกสำเร็จ",
        user: {
          id: result.insertId,
          fullName,
          email,
          role: roleCode,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST users error:", error);

    if (error.code === "ER_DUP_ENTRY") {
      return NextResponse.json(
        { message: "อีเมลนี้ถูกใช้งานแล้ว" },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { message: "ไม่สามารถสร้างสมาชิกได้" },
      { status: 500 }
    );
  }
}

// PATCH: เปลี่ยนบทบาทผู้ใช้
export async function PATCH(request) {
  const auth = await checkAdminPermission();
  if (auth.error) return auth.error;

  let connection;

  try {
    const body = await request.json();
    const userId = Number(body.userId);
    const roleCode = body.roleCode;

    if (!Number.isInteger(userId) || userId <= 0) {
      return NextResponse.json(
        { message: "รหัสผู้ใช้ไม่ถูกต้อง" },
        { status: 400 }
      );
    }

    if (!["admin", "staff", "user", "farmer"].includes(roleCode)) {
      return NextResponse.json(
        { message: "บทบาทที่ระบุไม่ถูกต้อง" },
        { status: 400 }
      );
    }

    if (userId === auth.session.userId) {
      return NextResponse.json(
        { message: "ไม่สามารถเปลี่ยนบทบาทบัญชีของตนเองได้" },
        { status: 400 }
      );
    }

    connection = await pool.getConnection();
    await connection.beginTransaction();

    const [targetRows] = await connection.execute(
      `SELECT u.id, u.role_id, r.code AS role_code
       FROM users u
       JOIN roles r ON r.id = u.role_id
       WHERE u.id = ?
       FOR UPDATE`,
      [userId]
    );

    if (targetRows.length === 0) {
      await connection.rollback();
      return NextResponse.json(
        { message: "ไม่พบผู้ใช้" },
        { status: 404 }
      );
    }

    const [roleRows] = await connection.execute(
      "SELECT id FROM roles WHERE code = ? LIMIT 1",
      [roleCode]
    );

    if (roleRows.length === 0) {
      await connection.rollback();
      return NextResponse.json(
        { message: "ไม่พบบทบาทที่ระบุ" },
        { status: 400 }
      );
    }

    if (targetRows[0].role_code === "admin" && roleCode !== "admin") {
      const [adminRows] = await connection.execute(
        `SELECT COUNT(*) AS total
         FROM users u
         JOIN roles r ON r.id = u.role_id
         WHERE r.code = 'admin' AND u.is_active = TRUE`
      );

      if (Number(adminRows[0].total) <= 1) {
        await connection.rollback();
        return NextResponse.json(
          { message: "ไม่สามารถลดสิทธิ์ Admin คนสุดท้ายได้" },
          { status: 400 }
        );
      }
    }

    await connection.execute(
      "UPDATE users SET role_id = ? WHERE id = ?",
      [roleRows[0].id, userId]
    );

    await connection.commit();

    return NextResponse.json({
      message: "เปลี่ยนบทบาทผู้ใช้สำเร็จ",
    });
  } catch (error) {
    if (connection) await connection.rollback();

    console.error("PATCH users error:", error);
    return NextResponse.json(
      { message: "ไม่สามารถเปลี่ยนบทบาทผู้ใช้ได้" },
      { status: 500 }
    );
  } finally {
    if (connection) connection.release();
  }
}

// POST: สร้างสมาชิกใหม่โดย Admin
