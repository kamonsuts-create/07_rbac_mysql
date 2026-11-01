
import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { getSession } from "@/lib/auth";
import { hasPermission } from "@/lib/rbac";

export const runtime = "nodejs";

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

  const allowed = await hasPermission(session.userId, permission);

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

// GET: แสดงสินค้า
// บุคคลทั่วไปเห็นสินค้า available
// เกษตรกรเห็นสินค้าของตัวเอง
// ลูกค้าที่ Login ต้องมี products:read
export async function GET() {
  try {
    const session = await getSession();

    // ผู้เข้าชมทั่วไปที่ยังไม่ได้ Login
    if (!session?.userId) {
      const [products] = await pool.execute(
        `SELECT p.id, p.farmer_id, p.name, p.description,
                p.price, p.quantity, p.unit, p.image_url,
                p.status, p.created_at,
                u.full_name AS farmer_name
         FROM products p
         JOIN users u ON u.id = p.farmer_id
         WHERE p.status = "available"
           AND u.is_active = TRUE
         ORDER BY p.created_at DESC`
      );

      return NextResponse.json({ products });
    }

    // ตรวจสอบบัญชีผู้ใช้และบทบาท
    const [users] = await pool.execute(
      `SELECT r.code AS role
       FROM users u
       JOIN roles r ON r.id = u.role_id
       WHERE u.id = ? AND u.is_active = TRUE
       LIMIT 1`,
      [session.userId]
    );

    if (users.length === 0) {
      return NextResponse.json(
        { message: "ไม่พบบัญชีผู้ใช้หรือบัญชีถูกระงับ" },
        { status: 401 }
      );
    }

    // เกษตรกรเห็นสินค้าของตัวเอง
    if (users[0].role === "farmer") {
      const allowed = await hasPermission(
        session.userId,
        "products:read"
      );

      if (!allowed) {
        return NextResponse.json(
          { message: "คุณไม่มีสิทธิ์ดูสินค้า" },
          { status: 403 }
        );
      }

      const [products] = await pool.execute(
        `SELECT id, farmer_id, name, description, price,
                quantity, unit, image_url, status, created_at
         FROM products
         WHERE farmer_id = ?
         ORDER BY created_at DESC`,
        [session.userId]
      );

      return NextResponse.json({ products });
    }

    // ผู้ใช้ทั่วไปที่ Login แล้วต้องมีสิทธิ์อ่านสินค้า
    const allowed = await hasPermission(
      session.userId,
      "products:read"
    );

    if (!allowed) {
      return NextResponse.json(
        { message: "คุณไม่มีสิทธิ์ดูสินค้า" },
        { status: 403 }
      );
    }

    // แสดงเฉพาะสินค้าที่พร้อมขาย
    const [products] = await pool.execute(
      `SELECT p.id, p.farmer_id, p.name, p.description,
              p.price, p.quantity, p.unit, p.image_url,
              p.status, p.created_at,
              u.full_name AS farmer_name
       FROM products p
       JOIN users u ON u.id = p.farmer_id
       WHERE p.status = "available"
         AND u.is_active = TRUE
       ORDER BY p.created_at DESC`
    );

    return NextResponse.json({ products });
  } catch (error) {
    console.error("GET products error:", error);

    return NextResponse.json(
      { message: "ไม่สามารถโหลดสินค้าได้" },
      { status: 500 }
    );
  }
}

// POST: เพิ่มสินค้า
export async function POST(request) {
  try {
    const auth = await checkPermission("products:create");
    if (auth.error) return auth.error;

    const body = await request.json();

    const name =
      typeof body.name === "string" ? body.name.trim() : "";

    const description =
      typeof body.description === "string"
        ? body.description.trim()
        : "";

    const price = Number(body.price);
    const quantity = Number(body.quantity);

    const unit =
      typeof body.unit === "string" ? body.unit.trim() : "กิโลกรัม";

    const imageUrl =
      typeof body.image_url === "string" && body.image_url.trim()
        ? body.image_url.trim()
        : null;

    if (!name) {
      return NextResponse.json(
        { message: "กรุณากรอกชื่อสินค้า" },
        { status: 400 }
      );
    }

    if (name.length > 255 || unit.length > 50) {
      return NextResponse.json(
        { message: "ชื่อสินค้าหรือหน่วยสินค้ายาวเกินกำหนด" },
        { status: 400 }
      );
    }

    if (!Number.isFinite(price) || price < 0 || price > 99999999.99) {
      return NextResponse.json(
        { message: "กรุณาระบุราคาที่ถูกต้อง" },
        { status: 400 }
      );
    }

    if (
      !Number.isFinite(quantity) ||
      quantity < 0 ||
      quantity > 99999999.99
    ) {
      return NextResponse.json(
        { message: "กรุณาระบุจำนวนสินค้าที่ถูกต้อง" },
        { status: 400 }
      );
    }

    if (imageUrl && imageUrl.length > 500) {
      return NextResponse.json(
        { message: "URL รูปภาพยาวเกินกำหนด" },
        { status: 400 }
      );
    }

    const [result] = await pool.execute(
      `INSERT INTO products
       (farmer_id, name, description, price, quantity, unit, image_url)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        auth.session.userId,
        name,
        description || null,
        price,
        quantity,
        unit || "กิโลกรัม",
        imageUrl,
      ]
    );

    return NextResponse.json(
      {
        message: "เพิ่มสินค้าสำเร็จ",
        productId: result.insertId,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST products error:", error);

    return NextResponse.json(
      { message: "ไม่สามารถเพิ่มสินค้าได้" },
      { status: 500 }
    );
  }
}

// PATCH: แก้ไขสินค้าของตัวเอง
export async function PATCH(request) {
  try {
    const auth = await checkPermission("products:update");
    if (auth.error) return auth.error;

    const body = await request.json();
    const id = Number(body.id);

    if (!Number.isSafeInteger(id) || id <= 0) {
      return NextResponse.json(
        { message: "รหัสสินค้าไม่ถูกต้อง" },
        { status: 400 }
      );
    }

    const name =
      typeof body.name === "string" ? body.name.trim() : "";

    const description =
      typeof body.description === "string"
        ? body.description.trim()
        : "";

    const price = Number(body.price);
    const quantity = Number(body.quantity);

    const unit =
      typeof body.unit === "string" ? body.unit.trim() : "กิโลกรัม";

    const imageUrl =
      typeof body.image_url === "string" && body.image_url.trim()
        ? body.image_url.trim()
        : null;

    const status = body.status || "available";

    if (!name || name.length > 255 || unit.length > 50) {
      return NextResponse.json(
        { message: "กรุณาตรวจสอบชื่อสินค้าและหน่วยสินค้า" },
        { status: 400 }
      );
    }

    if (
      !Number.isFinite(price) ||
      price < 0 ||
      price > 99999999.99 ||
      !Number.isFinite(quantity) ||
      quantity < 0 ||
      quantity > 99999999.99
    ) {
      return NextResponse.json(
        { message: "ราคาและจำนวนสินค้าไม่ถูกต้อง" },
        { status: 400 }
      );
    }

    if (!["available", "sold_out", "inactive"].includes(status)) {
      return NextResponse.json(
        { message: "สถานะสินค้าไม่ถูกต้อง" },
        { status: 400 }
      );
    }

    if (imageUrl && imageUrl.length > 500) {
      return NextResponse.json(
        { message: "URL รูปภาพยาวเกินกำหนด" },
        { status: 400 }
      );
    }

    const [result] = await pool.execute(
      `UPDATE products
       SET name = ?, description = ?, price = ?,
           quantity = ?, unit = ?, image_url = ?, status = ?
       WHERE id = ? AND farmer_id = ?`,
      [
        name,
        description || null,
        price,
        quantity,
        unit || "กิโลกรัม",
        imageUrl,
        status,
        id,
        auth.session.userId,
      ]
    );

    if (result.affectedRows === 0) {
      return NextResponse.json(
        { message: "ไม่พบสินค้าของคุณที่ต้องการแก้ไข" },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: "แก้ไขสินค้าสำเร็จ" });
  } catch (error) {
    console.error("PATCH products error:", error);

    return NextResponse.json(
      { message: "ไม่สามารถแก้ไขสินค้าได้" },
      { status: 500 }
    );
  }
}

// DELETE: ลบสินค้าของตัวเอง
export async function DELETE(request) {
  try {
    const auth = await checkPermission("products:delete");
    if (auth.error) return auth.error;

    const body = await request.json();
    const id = Number(body.id);

    if (!Number.isSafeInteger(id) || id <= 0) {
      return NextResponse.json(
        { message: "รหัสสินค้าไม่ถูกต้อง" },
        { status: 400 }
      );
    }

    const [result] = await pool.execute(
      `DELETE FROM products
       WHERE id = ? AND farmer_id = ?`,
      [id, auth.session.userId]
    );

    if (result.affectedRows === 0) {
      return NextResponse.json(
        { message: "ไม่พบสินค้าของคุณที่ต้องการลบ" },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: "ลบสินค้าสำเร็จ" });
  } catch (error) {
    console.error("DELETE products error:", error);

    return NextResponse.json(
      { message: "ไม่สามารถลบสินค้าได้" },
      { status: 500 }
    );
  }
}
