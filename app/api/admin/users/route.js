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

// GET: แสดงรายชื่อผู้ใช้ทั้งหมด พร้อมสิทธิ์และวันที่สมัคร
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
        u.created_at,
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
        { message: "กรุณากรอกข้อมูลให้ครบถ้วน" },
        { status: 400 }
      );
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { message: "รูปแบบอีเมลไม่ถูกต้อง" },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { message: "รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร" },
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
        { message: "อีเมลนี้มีผู้ใช้งานในระบบแล้ว" },
        { status: 409 }
      );
    }

    const [roleRows] = await pool.execute(
      "SELECT id FROM roles WHERE code = ? LIMIT 1",
      [roleCode]
    );

    if (roleRows.length === 0) {
      return NextResponse.json(
        { message: "ไม่พบบทบาทที่ระบุในระบบ" },
        { status: 400 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const [result] = await pool.execute(
      `INSERT INTO users
        (full_name, email, password_hash, role_id, is_active)
       VALUES (?, ?, ?, ?, TRUE)`,
      [fullName, email, passwordHash, roleRows[0].id]
    );

    return NextResponse.json(
      {
        message: "สร้างสมาชิกใหม่สำเร็จ",
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
      { message: "ไม่สามารถสร้างสมาชิกได้: " + (error.message || "เกิดข้อผิดพลาด"), },
      { status: 500 }
    );
  }
}

// PATCH: เปลี่ยนบทบาท, แก้ไขชื่อ, แก้ไขอีเมล, รีเซ็ตรหัสผ่าน, หรือเปิด/ปิดการใช้งาน
export async function PATCH(request) {
  const auth = await checkAdminPermission();
  if (auth.error) return auth.error;

  let connection;

  try {
    const body = await request.json();
    const userId = Number(body.userId);
    const { roleCode, fullName, email, newPassword, isActive } = body;

    if (!Number.isInteger(userId) || userId <= 0) {
      return NextResponse.json(
        { message: "รหัสผู้ใช้ไม่ถูกต้อง" },
        { status: 400 }
      );
    }

    connection = await pool.getConnection();
    await connection.beginTransaction();

    const [targetRows] = await connection.execute(
      `SELECT u.id, u.full_name, u.email, u.role_id, u.is_active, r.code AS role_code
       FROM users u
       JOIN roles r ON r.id = u.role_id
       WHERE u.id = ?
       FOR UPDATE`,
      [userId]
    );

    if (targetRows.length === 0) {
      await connection.rollback();
      return NextResponse.json(
        { message: "ไม่พบบัญชีผู้ใช้" },
        { status: 404 }
      );
    }

    const targetUser = targetRows[0];

    // 1. เปลี่ยนบทบาท (Role)
    if (roleCode && roleCode !== targetUser.role_code) {
      if (!["admin", "staff", "user", "farmer"].includes(roleCode)) {
        await connection.rollback();
        return NextResponse.json(
          { message: "บทบาทที่ระบุไม่ถูกต้อง" },
          { status: 400 }
        );
      }

      // ป้องกันการลดสิทธิ์ของตนเอง
      if (userId === auth.session.userId) {
        await connection.rollback();
        return NextResponse.json(
          { message: "ไม่สามารถเปลี่ยนบทบาทของบัญชีตนเองที่กำลังล็อกอินอยู่ได้" },
          { status: 400 }
        );
      }

      // ป้องกันการลดสิทธิ์ admin คนสุดท้าย
      if (targetUser.role_code === "admin" && roleCode !== "admin") {
        const [adminRows] = await connection.execute(
          `SELECT COUNT(*) AS total
           FROM users u
           JOIN roles r ON r.id = u.role_id
           WHERE r.code = 'admin' AND u.is_active = TRUE`
        );

        if (Number(adminRows[0].total) <= 1) {
          await connection.rollback();
          return NextResponse.json(
            { message: "ไม่สามารถลดสิทธิ์ Admin คนสุดท้ายของระบบได้" },
            { status: 400 }
          );
        }
      }

      const [roleRows] = await connection.execute(
        "SELECT id FROM roles WHERE code = ? LIMIT 1",
        [roleCode]
      );

      if (roleRows.length > 0) {
        await connection.execute(
          "UPDATE users SET role_id = ? WHERE id = ?",
          [roleRows[0].id, userId]
        );
      }
    }

    // 2. แก้ไขชื่อ-นามสกุล
    if (fullName && typeof fullName === "string" && fullName.trim() !== targetUser.full_name) {
      await connection.execute(
        "UPDATE users SET full_name = ? WHERE id = ?",
        [fullName.trim(), userId]
      );
    }

    // 3. แก้ไขอีเมล
    if (email && typeof email === "string" && email.trim().toLowerCase() !== targetUser.email.toLowerCase()) {
      const cleanEmail = email.trim().toLowerCase();
      const [emailCheck] = await connection.execute(
        "SELECT id FROM users WHERE email = ? AND id != ? LIMIT 1",
        [cleanEmail, userId]
      );
      if (emailCheck.length > 0) {
        await connection.rollback();
        return NextResponse.json(
          { message: "อีเมลนี้มีผู้ใช้งานอื่นใช้อยู่แล้ว" },
          { status: 409 }
        );
      }
      await connection.execute(
        "UPDATE users SET email = ? WHERE id = ?",
        [cleanEmail, userId]
      );
    }

    // 4. รีเซ็ตรหัสผ่าน (Reset Password)
    if (newPassword && typeof newPassword === "string" && newPassword.length >= 6) {
      const newHash = await bcrypt.hash(newPassword, 10);
      await connection.execute(
        "UPDATE users SET password_hash = ? WHERE id = ?",
        [newHash, userId]
      );
    }

    // 5. เปิด/ปิดการใช้งาน (Active/Inactive)
    if (typeof isActive === "boolean") {
      if (userId === auth.session.userId && !isActive) {
        await connection.rollback();
        return NextResponse.json(
          { message: "ไม่สามารถปิดการใช้งานบัญชีตนเองได้" },
          { status: 400 }
        );
      }
      await connection.execute(
        "UPDATE users SET is_active = ? WHERE id = ?",
        [isActive ? 1 : 0, userId]
      );
    }

    await connection.commit();

    return NextResponse.json({
      message: "อัปเดตข้อมูลผู้ใช้งานสำเร็จเรียบร้อย",
    });
  } catch (error) {
    if (connection) await connection.rollback();
    console.error("PATCH users error:", error);
    return NextResponse.json(
      { message: "ไม่สามารถอัปเดตข้อมูลผู้ใช้ได้: " + error.message },
      { status: 500 }
    );
  } finally {
    if (connection) connection.release();
  }
}

// DELETE: ลบสมาชิกออกจากระบบ พร้อมจัดการ foreign key อย่างปลอดภัย
export async function DELETE(request) {
  const auth = await checkAdminPermission();
  if (auth.error) return auth.error;

  let connection;

  try {
    const body = await request.json();
    const userId = Number(body.userId);

    if (!Number.isInteger(userId) || userId <= 0) {
      return NextResponse.json(
        { message: "รหัสผู้ใช้ไม่ถูกต้อง" },
        { status: 400 }
      );
    }

    if (userId === Number(auth.session.userId)) {
      return NextResponse.json(
        { message: "ไม่สามารถลบบัญชีของตนเองได้" },
        { status: 400 }
      );
    }

    connection = await pool.getConnection();
    await connection.beginTransaction();

    const [rows] = await connection.execute(
      `SELECT u.id, u.full_name, u.is_active, r.code AS role_code
       FROM users u
       JOIN roles r ON r.id = u.role_id
       WHERE u.id = ?
       FOR UPDATE`,
      [userId]
    );

    if (rows.length === 0) {
      await connection.rollback();
      return NextResponse.json(
        { message: "ไม่พบบัญชีผู้ใช้" },
        { status: 404 }
      );
    }

    const target = rows[0];

    if (target.role_code === "admin" && target.is_active) {
      const [admins] = await connection.execute(
        `SELECT COUNT(*) AS total
         FROM users u
         JOIN roles r ON r.id = u.role_id
         WHERE r.code = 'admin' AND u.is_active = TRUE`
      );

      if (Number(admins[0].total) <= 1) {
        await connection.rollback();
        return NextResponse.json(
          { message: "ไม่สามารถปิดใช้งาน Admin คนสุดท้ายได้" },
          { status: 400 }
        );
      }
    }

    await connection.execute(
      "UPDATE users SET is_active = 0 WHERE id = ?",
      [userId]
    );

    await connection.commit();

    return NextResponse.json({
      message: `ปิดใช้งานบัญชี "${target.full_name}" สำเร็จ โดยเก็บข้อมูลเดิมไว้`,
      softDeleted: true
    });

  } catch (error) {
    if (connection) await connection.rollback();
    console.error("DELETE user error:", error);

    return NextResponse.json(
      { message: "ไม่สามารถปิดใช้งานบัญชีได้" },
      { status: 500 }
    );
  } finally {
    if (connection) connection.release();
  }
}
