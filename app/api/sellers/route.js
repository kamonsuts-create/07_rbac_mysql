import { NextResponse } from "next/server";
import pool from "@/lib/db";

export const runtime = "nodejs";

// GET: ดึงข้อมูลวิสาหกิจชุมชนทั้ง 10 แห่งในจังหวัดปทุมธานี พร้อมใบรับรอง แหล่งที่มา และบัญชีธนาคาร
export async function GET() {
  try {
    const [sellers] = await pool.execute(`
      SELECT s.id, s.smce_code, s.community_name, s.president_name, s.phone, s.email,
             s.story, s.logo_url, s.cover_image_url, s.video_url, s.is_verified, s.created_at,
             loc.location_name, loc.location_type, loc.province, loc.amphoe, loc.tambon,
             loc.origin_address, loc.latitude, loc.longitude, loc.plot_size, loc.water_source, loc.farm_photo_url,
             loc.video_url AS location_video_url,
             cert.cert_name, cert.cert_number, cert.issuing_body, cert.cert_image_url,
             sba.bank_name, sba.bank_account_name, sba.bank_account_number, sba.promptpay_number, sba.seller_phone
      FROM sellers s
      LEFT JOIN production_locations loc ON loc.seller_id = s.id AND loc.is_active = TRUE
      LEFT JOIN seller_certificates cert ON cert.seller_id = s.id AND cert.status = 'valid'
      LEFT JOIN seller_bank_accounts sba ON sba.seller_id = s.id AND sba.is_default = TRUE
      ORDER BY s.id ASC
    `);

    // ดึงสินค้าของแต่ละวิสาหกิจชุมชน
    const [products] = await pool.execute(`
      SELECT p.id, p.seller_id, p.name, p.category, p.description, p.price, p.quantity AS stock,
             p.unit, p.image_url, p.video_url, p.status, hi.batch_lot_code, hi.harvest_process,
             hi.lab_test_result, hi.brix_sweetness
      FROM products p
      LEFT JOIN harvest_inspections hi ON hi.product_id = p.id
      WHERE p.status = 'available'
      ORDER BY p.id ASC
    `);

    // จัดกลุ่มสินค้าเข้ากับแต่ละวิสาหกิจ
    const enrichedSellers = sellers.map((s) => {
      return {
        ...s,
        products: products.filter((p) => p.seller_id === s.id),
      };
    });

    return NextResponse.json({ sellers: enrichedSellers });
  } catch (error) {
    console.error("GET /api/sellers error:", error);
    return NextResponse.json(
      { message: "ไม่สามารถโหลดข้อมูลวิสาหกิจชุมชนได้" },
      { status: 500 }
    );
  }
}

