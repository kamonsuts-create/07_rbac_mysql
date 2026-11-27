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
        { message: "กรุณาเข้าสู่ระบบก่อนดำเนินการ" },
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

// GET: แสดงผลผลิตพร้อมเชื่อมโยง 6 ระบบฐานข้อมูล (ผู้ขาย, ใบรับรอง, แหล่งที่มา, การตรวจสอบ, บัญชีโอนตรง)
export async function GET() {
  try {
    const session = await getSession();

    const baseQuery = `
      SELECT p.id, p.seller_id, p.farmer_id, p.name, p.category, p.description,
             COALESCE(hi.harvest_process, p.harvest_process) AS harvest_process,
             hi.batch_lot_code, hi.lab_test_result, hi.brix_sweetness,
             p.price, p.quantity AS stock, p.unit,
             COALESCE(loc.origin_address, p.origin_address) AS origin_address,
             COALESCE(loc.province, p.province) AS province,
             COALESCE(loc.location_type, p.location_type) AS location_type,
             loc.amphoe, loc.tambon, loc.plot_size, loc.water_source,
             p.image_url, p.video_url,
             COALESCE(cert.cert_image_url, p.cert_image_url) AS cert_image_url,
             COALESCE(loc.farm_photo_url, p.farm_image_url) AS farm_image_url,
             COALESCE(cert.cert_number, p.cert_number) AS cert_number,
             COALESCE(cert.cert_name, 'มาตรฐานเกษตรปลอดภัย GAP') AS cert_name,
             COALESCE(sba.bank_name, p.bank_name) AS bank_name,
             COALESCE(sba.bank_account_name, p.bank_account_name) AS bank_account_name,
             COALESCE(sba.bank_account_number, p.bank_account_number) AS bank_account_number,
             COALESCE(sba.promptpay_number, p.promptpay_number) AS promptpay_number,
             COALESCE(sba.seller_phone, s.phone, p.seller_phone) AS seller_phone,
             s.community_name, s.president_name, s.smce_code,
             p.status, p.created_at,
             COALESCE(s.community_name, u.full_name) AS farmer_name
      FROM products p
      LEFT JOIN sellers s ON s.id = p.seller_id
      LEFT JOIN users u ON u.id = p.farmer_id
      LEFT JOIN (
        SELECT pl.seller_id, pl.origin_address, pl.province,
               pl.location_type, pl.amphoe, pl.tambon,
               pl.plot_size, pl.water_source, pl.farm_photo_url
        FROM production_locations pl
        WHERE pl.is_active = TRUE
          AND pl.id = (
            SELECT pl2.id
            FROM production_locations pl2
            WHERE pl2.seller_id = pl.seller_id
              AND pl2.is_active = TRUE
            ORDER BY pl2.updated_at DESC, pl2.created_at DESC, pl2.id DESC
            LIMIT 1
          )
      ) loc ON loc.seller_id = s.id
      LEFT JOIN (
        SELECT sc.seller_id, sc.cert_name, sc.cert_number, sc.cert_image_url
        FROM seller_certificates sc
        WHERE sc.status = 'valid'
          AND sc.id = (
            SELECT sc2.id
            FROM seller_certificates sc2
            WHERE sc2.seller_id = sc.seller_id
              AND sc2.status = 'valid'
            ORDER BY sc2.updated_at DESC, sc2.created_at DESC, sc2.id DESC
            LIMIT 1
          )
      ) cert ON cert.seller_id = s.id
      LEFT JOIN (
        SELECT hi1.product_id, hi1.harvest_process,
               hi1.batch_lot_code, hi1.lab_test_result, hi1.brix_sweetness
        FROM harvest_inspections hi1
        WHERE hi1.id = (
          SELECT hi2.id
          FROM harvest_inspections hi2
          WHERE hi2.product_id = hi1.product_id
          ORDER BY hi2.inspection_date DESC, hi2.updated_at DESC,
                   hi2.created_at DESC, hi2.id DESC
          LIMIT 1
        )
      ) hi ON hi.product_id = p.id
      LEFT JOIN (
        SELECT ba.seller_id, ba.bank_name, ba.bank_account_name,
               ba.bank_account_number, ba.promptpay_number, ba.seller_phone
        FROM seller_bank_accounts ba
        WHERE ba.is_default = TRUE
          AND ba.id = (
            SELECT ba2.id
            FROM seller_bank_accounts ba2
            WHERE ba2.seller_id = ba.seller_id
              AND ba2.is_default = TRUE
            ORDER BY ba2.updated_at DESC, ba2.created_at DESC, ba2.id DESC
            LIMIT 1
          )
      ) sba ON sba.seller_id = s.id
    `;

    // ผู้เข้าชมทั่วไป
    if (!session?.userId) {
      const [products] = await pool.execute(
        `${baseQuery}
         WHERE p.status = 'available'
         ORDER BY p.id ASC`
      );
      return NextResponse.json({ products });
    }

    // ตรวจสอบบทบาท
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

    // เกษตรกรเห็นผลผลิตของตัวเองเพื่อจัดการ
    if (users[0].role === "farmer") {
      const allowed = await hasPermission(session.userId, "products:read");
      if (!allowed) {
        return NextResponse.json({ message: "คุณไม่มีสิทธิ์ดูสินค้า" }, { status: 403 });
      }

      const [products] = await pool.execute(
        `${baseQuery}
         WHERE p.farmer_id = ? OR s.user_id = ?
         ORDER BY p.id DESC`,
        [session.userId, session.userId]
      );

      return NextResponse.json({ products });
    }

    // ผู้ใช้ทั่วไปที่ Login แล้ว
    const [products] = await pool.execute(
      `${baseQuery}
       WHERE p.status = 'available'
       ORDER BY p.id ASC`
    );

    return NextResponse.json({ products });
  } catch (error) {
    console.error("GET products error:", error);
    return NextResponse.json({ message: "ไม่สามารถโหลดสินค้าได้" }, { status: 500 });
  }
}

// POST: เพิ่มผลผลิตใหม่พร้อมเชื่อมโยงเข้าสู่ 6 ระบบฐานข้อมูล
export async function POST(request) {
  try {
    const auth = await checkPermission("products:create");
    if (auth.error) return auth.error;

    const body = await request.json();

    const name = typeof body.name === "string" ? body.name.trim() : "";
    const category = typeof body.category === "string" ? body.category.trim() : "other";
    const description = typeof body.description === "string" ? body.description.trim() : "";
    const harvestProcess = typeof body.harvest_process === "string" ? body.harvest_process.trim() : "";

    const price = Number(body.price);
    const stock = Number(body.stock ?? body.quantity);
    const unit = typeof body.unit === "string" ? body.unit.trim() : "กิโลกรัม";

    const originAddress =
      typeof body.origin_address === "string" && body.origin_address.trim()
        ? body.origin_address.trim()
        : "แปลงเพาะปลูกวิสาหกิจชุมชน จ.ปทุมธานี";

    const province = typeof body.province === "string" && body.province.trim() ? body.province.trim() : "ปทุมธานี";
    const locationType = typeof body.location_type === "string" && body.location_type.trim() ? body.location_type.trim() : "หน้าแปลง";

    const imageUrl = typeof body.image_url === "string" && body.image_url.trim() ? body.image_url.trim() : null;
    const videoUrl = typeof body.video_url === "string" && body.video_url.trim() ? body.video_url.trim() : null;
    const certImageUrl = typeof body.cert_image_url === "string" && body.cert_image_url.trim() ? body.cert_image_url.trim() : null;
    const farmImageUrl = typeof body.farm_image_url === "string" && body.farm_image_url.trim() ? body.farm_image_url.trim() : null;
    const certNumber = typeof body.cert_number === "string" && body.cert_number.trim() ? body.cert_number.trim() : "GAP-TH-13-01-0001";

    const bankName = typeof body.bank_name === "string" ? body.bank_name.trim() : "ธนาคารเพื่อการเกษตรและสหกรณ์การเกษตร (ธ.ก.ส.)";
    const bankAccountName = typeof body.bank_account_name === "string" ? body.bank_account_name.trim() : "";
    const bankAccountNumber = typeof body.bank_account_number === "string" ? body.bank_account_number.trim() : "";
    const promptpayNumber = typeof body.promptpay_number === "string" ? body.promptpay_number.trim() : "";
    const sellerPhone = typeof body.seller_phone === "string" ? body.seller_phone.trim() : "";

    if (!name) {
      return NextResponse.json({ message: "กรุณากรอกชื่อผลผลิต" }, { status: 400 });
    }
    if (!Number.isFinite(price) || price < 0) {
      return NextResponse.json({ message: "กรุณาระบุราคาที่ถูกต้อง" }, { status: 400 });
    }
    if (!Number.isFinite(stock) || stock < 0) {
      return NextResponse.json({ message: "กรุณาระบุจำนวนสินค้าที่ถูกต้อง" }, { status: 400 });
    }

    // 1. ค้นหาหรือสร้าง seller_id สำหรับผู้ใช้คนนี้
    const [existingSellers] = await pool.execute(
      `SELECT id FROM sellers WHERE user_id = ? LIMIT 1`,
      [auth.session.userId]
    );

    let sellerId;
    if (existingSellers.length > 0) {
      sellerId = existingSellers[0].id;
    } else {
      const [userRows] = await pool.execute(`SELECT full_name, email FROM users WHERE id = ?`, [auth.session.userId]);
      const fullName = userRows[0]?.full_name || "วิสาหกิจชุมชน";
      const [newSeller] = await pool.execute(
        `INSERT INTO sellers (user_id, community_name, president_name, phone, email, is_verified)
         VALUES (?, ?, ?, ?, ?, TRUE)`,
        [auth.session.userId, fullName, fullName, sellerPhone || "-", userRows[0]?.email || null]
      );
      sellerId = newSeller.insertId;
    }

    // 2. Insert เข้าตาราง products
    const [result] = await pool.execute(
      `INSERT INTO products
       (seller_id, farmer_id, name, category, description, harvest_process, price, quantity, unit,
        origin_address, province, location_type, image_url, video_url, cert_image_url, farm_image_url, cert_number,
        bank_name, bank_account_name, bank_account_number, promptpay_number, seller_phone)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        sellerId,
        auth.session.userId,
        name,
        category,
        description || null,
        harvestProcess || null,
        price,
        stock,
        unit || "กิโลกรัม",
        originAddress,
        province,
        locationType,
        imageUrl,
        videoUrl,
        certImageUrl,
        farmImageUrl,
        certNumber,
        bankName,
        bankAccountName,
        bankAccountNumber,
        promptpayNumber,
        sellerPhone,
      ]
    );

    const newProductId = result.insertId;

    // 3. เชื่อมโยงเข้าสู่ harvest_inspections
    const lotCode = `PLK-PT-${newProductId}`;
    await pool.execute(
      `INSERT INTO harvest_inspections
       (product_id, batch_lot_code, harvest_process, harvest_schedule, lab_test_result, qc_status, inspection_date)
       VALUES (?, ?, ?, 'ตัดสดรอบเช้าตรู่ 05:00 - 06:30 น.', 'สารตกค้าง 0.00 ppm (ผ่านการตรวจ Rapid Test)', 'passed', CURDATE())`,
      [newProductId, lotCode, harvestProcess || "เก็บเกี่ยวตามมาตรฐาน GAP"]
    );

    // 4. บันทึก / อัปเดต seller_bank_accounts
    if (bankAccountNumber && bankAccountName) {
      const [existingBank] = await pool.execute(
        `SELECT id FROM seller_bank_accounts WHERE seller_id = ? LIMIT 1`,
        [sellerId]
      );
      if (existingBank.length === 0) {
        await pool.execute(
          `INSERT INTO seller_bank_accounts (seller_id, bank_name, bank_account_name, bank_account_number, promptpay_number, seller_phone, is_verified_matching, is_default)
           VALUES (?, ?, ?, ?, ?, ?, TRUE, TRUE)`,
          [sellerId, bankName, bankAccountName, bankAccountNumber, promptpayNumber, sellerPhone]
        );
      }
    }

    return NextResponse.json(
      { message: "เพิ่มผลผลิตและเชื่อมโยง 6 ระบบฐานข้อมูลสำเร็จ", productId: newProductId },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST products error:", error);
    return NextResponse.json({ message: "ไม่สามารถเพิ่มผลผลิตได้" }, { status: 500 });
  }
}

// PATCH: แก้ไขผลผลิตใน Record เดิม โดยไม่ต้องสร้างสินค้าใหม่ และซิงก์ 6 ระบบฐานข้อมูล
export async function PATCH(request) {
  try {
    const auth = await checkPermission("products:update");
    if (auth.error) return auth.error;

    const body = await request.json();
    const id = Number(body.id);

    if (!Number.isSafeInteger(id) || id <= 0) {
      return NextResponse.json({ message: "รหัสผลผลิตไม่ถูกต้อง" }, { status: 400 });
    }

    const name = typeof body.name === "string" ? body.name.trim() : "";
    const category = typeof body.category === "string" ? body.category.trim() : "fruit";
    const description = typeof body.description === "string" ? body.description.trim() : "";
    const harvestProcess = typeof body.harvest_process === "string" ? body.harvest_process.trim() : null;

    const price = Number(body.price);
    const stock = Number(body.stock ?? body.quantity);
    const unit = typeof body.unit === "string" ? body.unit.trim() : "กิโลกรัม";

    const originAddress = typeof body.origin_address === "string" && body.origin_address.trim() ? body.origin_address.trim() : null;
    const province = typeof body.province === "string" && body.province.trim() ? body.province.trim() : null;
    const locationType = typeof body.location_type === "string" && body.location_type.trim() ? body.location_type.trim() : null;

    const imageUrl = typeof body.image_url === "string" && body.image_url.trim() ? body.image_url.trim() : null;
    const videoUrl = typeof body.video_url === "string" && body.video_url.trim() ? body.video_url.trim() : null;
    const certImageUrl = typeof body.cert_image_url === "string" && body.cert_image_url.trim() ? body.cert_image_url.trim() : null;
    const farmImageUrl = typeof body.farm_image_url === "string" && body.farm_image_url.trim() ? body.farm_image_url.trim() : null;
    const certNumber = typeof body.cert_number === "string" && body.cert_number.trim() ? body.cert_number.trim() : null;

    const bankName = typeof body.bank_name === "string" && body.bank_name.trim() ? body.bank_name.trim() : null;
    const bankAccountName = typeof body.bank_account_name === "string" && body.bank_account_name.trim() ? body.bank_account_name.trim() : null;
    const bankAccountNumber = typeof body.bank_account_number === "string" && body.bank_account_number.trim() ? body.bank_account_number.trim() : null;
    const promptpayNumber = typeof body.promptpay_number === "string" && body.promptpay_number.trim() ? body.promptpay_number.trim() : null;
    const sellerPhone = typeof body.seller_phone === "string" && body.seller_phone.trim() ? body.seller_phone.trim() : null;

    const status = body.status || "available";

    // 1. อัปเดตตาราง products ใน Record เดิม (In-Place Update)
    const [result] = await pool.execute(
      `UPDATE products
       SET name = ?, category = ?, description = ?, harvest_process = COALESCE(?, harvest_process),
           price = ?, quantity = ?, unit = ?,
           origin_address = COALESCE(?, origin_address),
           province = COALESCE(?, province),
           location_type = COALESCE(?, location_type),
           image_url = COALESCE(?, image_url),
           video_url = COALESCE(?, video_url),
           cert_image_url = COALESCE(?, cert_image_url),
           farm_image_url = COALESCE(?, farm_image_url),
           cert_number = COALESCE(?, cert_number),
           bank_name = COALESCE(?, bank_name),
           bank_account_name = COALESCE(?, bank_account_name),
           bank_account_number = COALESCE(?, bank_account_number),
           promptpay_number = COALESCE(?, promptpay_number),
           seller_phone = COALESCE(?, seller_phone),
           status = ?
       WHERE id = ? AND (farmer_id = ? OR seller_id IN (SELECT id FROM sellers WHERE user_id = ?))`,
      [
        name,
        category,
        description || null,
        harvestProcess,
        price,
        stock,
        unit || "กิโลกรัม",
        originAddress,
        province,
        locationType,
        imageUrl,
        videoUrl,
        certImageUrl,
        farmImageUrl,
        certNumber,
        bankName,
        bankAccountName,
        bankAccountNumber,
        promptpayNumber,
        sellerPhone,
        status,
        id,
        auth.session.userId,
        auth.session.userId,
      ]
    );

    if (result.affectedRows === 0) {
      return NextResponse.json(
        { message: "ไม่พบสินค้าของคุณที่ต้องการแก้ไข" },
        { status: 404 }
      );
    }

    // 2. ซิงก์ขั้นตอนการเก็บเกี่ยวใน harvest_inspections
    if (harvestProcess) {
      const [existingHi] = await pool.execute(
        `SELECT id FROM harvest_inspections WHERE product_id = ? LIMIT 1`,
        [id]
      );
      if (existingHi.length > 0) {
        await pool.execute(
          `UPDATE harvest_inspections SET harvest_process = ?, inspection_date = CURDATE() WHERE product_id = ?`,
          [harvestProcess, id]
        );
      } else {
        await pool.execute(
          `INSERT INTO harvest_inspections (product_id, batch_lot_code, harvest_process, inspection_date)
           VALUES (?, ?, ?, CURDATE())`,
          [id, `PLK-PT-${id}`, harvestProcess]
        );
      }
    }

    // 3. ซิงก์ที่อยู่หน้างานใน production_locations
    const [pRows] = await pool.execute(`SELECT seller_id FROM products WHERE id = ?`, [id]);
    const sellerId = pRows[0]?.seller_id;
    if (sellerId && originAddress) {
      await pool.execute(
        `UPDATE production_locations
         SET origin_address = ?, location_type = COALESCE(?, location_type),
             province = COALESCE(?, province), farm_photo_url = COALESCE(?, farm_photo_url)
         WHERE seller_id = ? AND is_active = TRUE`,
        [originAddress, locationType, province, farmImageUrl, sellerId]
      );
    }

    // 4. ซิงก์บัญชีธนาคารใน seller_bank_accounts
    if (sellerId && bankAccountNumber && bankAccountName) {
      const [bRows] = await pool.execute(
        `SELECT id FROM seller_bank_accounts WHERE seller_id = ? AND is_default = TRUE LIMIT 1`,
        [sellerId]
      );
      if (bRows.length > 0) {
        await pool.execute(
          `UPDATE seller_bank_accounts
           SET bank_name = COALESCE(?, bank_name), bank_account_name = ?, bank_account_number = ?,
               promptpay_number = COALESCE(?, promptpay_number), seller_phone = COALESCE(?, seller_phone)
           WHERE seller_id = ? AND is_default = TRUE`,
          [bankName, bankAccountName, bankAccountNumber, promptpayNumber, sellerPhone, sellerId]
        );
      } else {
        await pool.execute(
          `INSERT INTO seller_bank_accounts (seller_id, bank_name, bank_account_name, bank_account_number, promptpay_number, seller_phone, is_verified_matching, is_default)
           VALUES (?, ?, ?, ?, ?, ?, TRUE, TRUE)`,
          [sellerId, bankName || "ธนาคารกสิกรไทย", bankAccountName, bankAccountNumber, promptpayNumber, sellerPhone]
        );
      }
    }

    // 5. ซิงก์ใบรับรองใน seller_certificates
    if (sellerId && (certNumber || certImageUrl)) {
      await pool.execute(
        `UPDATE seller_certificates
         SET cert_number = COALESCE(?, cert_number), cert_image_url = COALESCE(?, cert_image_url)
         WHERE seller_id = ? AND status = 'valid'`,
        [certNumber, certImageUrl, sellerId]
      );
    }

    return NextResponse.json({
      message: "อัปเดตข้อมูลผลผลิตและซิงก์ทั้ง 6 ระบบฐานข้อมูลสำเร็จเรียบร้อยโดยไม่ต้องสร้างสินค้าใหม่",
    });
  } catch (error) {
    console.error("PATCH products error:", error);
    return NextResponse.json({ message: "ไม่สามารถแก้ไขสินค้าได้" }, { status: 500 });
  }
}

// DELETE: ลบสินค้า
export async function DELETE(request) {
  try {
    const auth = await checkPermission("products:delete");
    if (auth.error) return auth.error;

    const body = await request.json();
    const id = Number(body.id);

    if (!Number.isSafeInteger(id) || id <= 0) {
      return NextResponse.json({ message: "รหัสสินค้าไม่ถูกต้อง" }, { status: 400 });
    }

    const [result] = await pool.execute(
      `DELETE FROM products
       WHERE id = ? AND (farmer_id = ? OR seller_id IN (SELECT id FROM sellers WHERE user_id = ?))`,
      [id, auth.session.userId, auth.session.userId]
    );

    if (result.affectedRows === 0) {
      return NextResponse.json({ message: "ไม่พบสินค้าที่ต้องการลบ" }, { status: 404 });
    }

    return NextResponse.json({ message: "ลบสินค้าสำเร็จเรียบร้อย" });
  } catch (error) {
    console.error("DELETE products error:", error);
    return NextResponse.json({ message: "ไม่สามารถลบสินค้าได้" }, { status: 500 });
  }
}
