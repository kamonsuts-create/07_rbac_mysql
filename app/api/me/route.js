import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { getSession } from "@/lib/auth";
import { getUserPermissions } from "@/lib/rbac";

export async function GET() {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json(
        { message: "กรุณาเข้าสู่ระบบก่อน" },
        { status: 401 }
      );
    }

    const [rows] = await pool.execute(
      `SELECT
         u.id,
         u.full_name,
         u.email,
         u.google_sub,
         r.code AS role,
         r.name AS role_name
       FROM users u
       JOIN roles r ON r.id = u.role_id
       WHERE u.id = ? AND u.is_active = TRUE
       LIMIT 1`,
      [session.userId]
    );

    if (rows.length === 0) {
      return NextResponse.json(
        { message: "ไม่พบบัญชีผู้ใช้หรือบัญชีถูกระงับ" },
        { status: 401 }
      );
    }

    const user = rows[0];
    const permissions = await getUserPermissions(user.id);

    return NextResponse.json({
      user: {
        id: user.id,
        fullName: user.full_name,
        email: user.email,
        role: user.role,
        roleName: user.role_name,
        googleLinked: Boolean(user.google_sub),
      },
      permissions,
    });
  } catch (error) {
    console.error("Me API error:", error);

    return NextResponse.json(
      { message: "ไม่สามารถตรวจสอบข้อมูลผู้ใช้ได้" },
      { status: 500 }
    );
  }
}
