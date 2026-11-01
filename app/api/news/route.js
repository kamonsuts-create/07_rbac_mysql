
import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { getSession } from "@/lib/auth";
import { hasPermission } from "@/lib/rbac";

// ตรวจสอบ Login และ Permission
async function checkPermission(permission) {
  const session = await getSession();

  if (!session?.userId) {
    return {
      error: NextResponse.json(
        { message: "กรุณาเข้าสู่ระบบก่อน" },
        { status: 401 }
      ),
    };
  }

  const allowed = await hasPermission(
    session.userId,
    permission
  );

  if (!allowed) {
    return {
      error: NextResponse.json(
        { message: "คุณไม่มีสิทธิ์ดำเนินการนี้" },
        { status: 403 }
      ),
    };
  }

  return { session };
}

// GET: ดูข่าวทั้งหมด
export async function GET() {
  try {
    const auth = await checkPermission("news:read");

    if (auth.error) return auth.error;

    const [news] = await pool.execute(`
      SELECT
        n.id,
        n.title,
        n.content,
        n.author_id,
        n.created_at,
        n.updated_at,
        u.full_name AS author_name
      FROM news n
      JOIN users u ON u.id = n.author_id
      ORDER BY n.created_at DESC, n.id DESC
    `);

    return NextResponse.json({ news });
  } catch (error) {
    console.error("GET news error:", error);

    return NextResponse.json(
      { message: "ไม่สามารถโหลดข่าวสารได้" },
      { status: 500 }
    );
  }
}

// POST: เพิ่มข่าวใหม่
export async function POST(request) {
  try {
    const auth = await checkPermission("news:create");

    if (auth.error) return auth.error;

    const body = await request.json();

    const title =
      typeof body.title === "string" ? body.title.trim() : "";

    const content =
      typeof body.content === "string"
        ? body.content.trim()
        : "";

    if (!title || !content) {
      return NextResponse.json(
        { message: "กรุณากรอกหัวข้อและเนื้อหาข่าว" },
        { status: 400 }
      );
    }

    if (title.length > 255) {
      return NextResponse.json(
        { message: "หัวข้อข่าวต้องไม่เกิน 255 ตัวอักษร" },
        { status: 400 }
      );
    }

    const [result] = await pool.execute(
      `INSERT INTO news (title, content, author_id)
       VALUES (?, ?, ?)`,
      [title, content, auth.session.userId]
    );

    return NextResponse.json(
      {
        message: "เพิ่มข่าวสำเร็จ",
        newsId: result.insertId,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST news error:", error);

    return NextResponse.json(
      { message: "ไม่สามารถเพิ่มข่าวได้" },
      { status: 500 }
    );
  }
}

// PATCH: แก้ไขข่าว
export async function PATCH(request) {
  try {
    const auth = await checkPermission("news:update");

    if (auth.error) return auth.error;

    const body = await request.json();
    const newsId = Number(body.id);

    const title =
      typeof body.title === "string" ? body.title.trim() : "";

    const content =
      typeof body.content === "string"
        ? body.content.trim()
        : "";

    if (!Number.isSafeInteger(newsId) || newsId <= 0) {
      return NextResponse.json(
        { message: "รหัสข่าวไม่ถูกต้อง" },
        { status: 400 }
      );
    }

    if (!title || !content) {
      return NextResponse.json(
        { message: "กรุณากรอกหัวข้อและเนื้อหาข่าว" },
        { status: 400 }
      );
    }

    if (title.length > 255) {
      return NextResponse.json(
        { message: "หัวข้อข่าวต้องไม่เกิน 255 ตัวอักษร" },
        { status: 400 }
      );
    }

    const [result] = await pool.execute(
      `UPDATE news
       SET title = ?, content = ?
       WHERE id = ?`,
      [title, content, newsId]
    );

    if (result.affectedRows === 0) {
      const [rows] = await pool.execute(
        "SELECT id FROM news WHERE id = ?",
        [newsId]
      );

      if (rows.length === 0) {
        return NextResponse.json(
          { message: "ไม่พบข่าวที่ต้องการแก้ไข" },
          { status: 404 }
        );
      }
    }

    return NextResponse.json({
      message: "แก้ไขข่าวสำเร็จ",
    });
  } catch (error) {
    console.error("PATCH news error:", error);

    return NextResponse.json(
      { message: "ไม่สามารถแก้ไขข่าวได้" },
      { status: 500 }
    );
  }
}

// DELETE: ลบข่าว
export async function DELETE(request) {
  try {
    const auth = await checkPermission("news:delete");

    if (auth.error) return auth.error;

    const body = await request.json();
    const newsId = Number(body.id);

    if (!Number.isSafeInteger(newsId) || newsId <= 0) {
      return NextResponse.json(
        { message: "รหัสข่าวไม่ถูกต้อง" },
        { status: 400 }
      );
    }

    const [result] = await pool.execute(
      "DELETE FROM news WHERE id = ?",
      [newsId]
    );

    if (result.affectedRows === 0) {
      return NextResponse.json(
        { message: "ไม่พบข่าวที่ต้องการลบ" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: "ลบข่าวสำเร็จ",
    });
  } catch (error) {
    console.error("DELETE news error:", error);

    return NextResponse.json(
      { message: "ไม่สามารถลบข่าวได้" },
      { status: 500 }
    );
  }
}
