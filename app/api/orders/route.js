import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { getSession } from "@/lib/auth";

export const runtime = "nodejs";

// GET: แสดงรายการคำสั่งซื้อ
export async function GET() {
  try {
    const session = await getSession();

    let query = `
      SELECT o.id, o.order_code, o.seller_id, o.buyer_name, o.buyer_phone, o.buyer_address,
             o.buyer_latitude, o.buyer_longitude,
             o.total_amount, o.payment_method, o.payment_status, o.order_status,
             o.transfer_slip_url, o.notes, o.created_at,
             s.community_name, s.president_name, s.phone AS seller_phone
      FROM orders o
      JOIN sellers s ON s.id = o.seller_id
    `;
    const params = [];

    if (session?.userId) {
      // ตรวจสอบว่าผู้ใช้เป็น seller หรือไม่
      const [sellers] = await pool.execute(
        `SELECT id FROM sellers WHERE user_id = ? LIMIT 1`,
        [session.userId]
      );
      if (sellers.length > 0) {
        query += ` WHERE o.seller_id = ?`;
        params.push(sellers[0].id);
      }
    }

    query += ` ORDER BY o.created_at DESC LIMIT 50`;
    const [orders] = await pool.execute(query, params);

    // ดึง items สำหรับแต่ละ order
    if (orders.length > 0) {
      const orderIds = orders.map((o) => o.id);
      const placeholders = orderIds.map(() => "?").join(",");
      const [items] = await pool.execute(
        `SELECT id, order_id, product_id, product_name, unit_price, quantity, unit, subtotal
         FROM order_items
         WHERE order_id IN (${placeholders})`,
        orderIds
      );

      const [events] = await pool.execute(
        `SELECT id, order_id, status, description, location_name, created_at
         FROM order_tracking_events
         WHERE order_id IN (${placeholders})
         ORDER BY created_at ASC`,
        orderIds
      );

      orders.forEach((o) => {
        o.items = items.filter((item) => item.order_id === o.id);
        o.tracking_events = events.filter((ev) => ev.order_id === o.id);
      });
    }

    return NextResponse.json({ orders });
  } catch (error) {
    console.error("GET /api/orders error:", error);
    return NextResponse.json({ message: "ไม่สามารถโหลดคำสั่งซื้อได้" }, { status: 500 });
  }
}


// POST: สั่งซื้อผลผลิต แยกคำสั่งซื้อตามผู้ขาย
export async function POST(request) {
  let connection;
  let transactionStarted = false;

  try {
    const body = await request.json();

    const buyerName =
      typeof body.buyer_name === "string" ? body.buyer_name.trim() : "";
    const buyerPhone =
      typeof body.buyer_phone === "string" ? body.buyer_phone.trim() : "";
    const buyerAddress =
      typeof body.buyer_address === "string" ? body.buyer_address.trim() : "";

    if (!buyerName || !buyerPhone || !buyerAddress) {
      return NextResponse.json(
        { message: "กรุณากรอกชื่อ เบอร์โทรศัพท์ และที่อยู่จัดส่งให้ครบถ้วน" },
        { status: 400 }
      );
    }

    const normalizedPhone = buyerPhone.replace(/\D/g, "");

    if (!/^\d{9,10}$/.test(normalizedPhone)) {
      return NextResponse.json(
        { message: "กรุณากรอกเบอร์โทรศัพท์ให้ถูกต้อง 9–10 หลัก" },
        { status: 400 }
      );
    }

    const hasLatitude =
      body.buyer_latitude !== undefined &&
      body.buyer_latitude !== null &&
      body.buyer_latitude !== "";

    const hasLongitude =
      body.buyer_longitude !== undefined &&
      body.buyer_longitude !== null &&
      body.buyer_longitude !== "";

    const buyerLatitude = hasLatitude ? Number(body.buyer_latitude) : null;
    const buyerLongitude = hasLongitude ? Number(body.buyer_longitude) : null;

    if (
      hasLatitude !== hasLongitude ||
      (hasLatitude &&
        (!Number.isFinite(buyerLatitude) ||
          !Number.isFinite(buyerLongitude) ||
          buyerLatitude < -90 ||
          buyerLatitude > 90 ||
          buyerLongitude < -180 ||
          buyerLongitude > 180))
    ) {
      return NextResponse.json(
        { message: "พิกัดจัดส่งไม่ถูกต้อง กรุณาปักหมุดตำแหน่งใหม่" },
        { status: 400 }
      );
    }

    const safeLatitude = buyerLatitude;
    const safeLongitude = buyerLongitude;
    const items = Array.isArray(body.items) ? body.items : [];
    const notes =
      typeof body.notes === "string" ? body.notes.trim() : null;

    if (items.length === 0) {
      return NextResponse.json(
        { message: "กรุณาเลือกผลผลิตในตะกร้าอย่างน้อย 1 รายการ" },
        { status: 400 }
      );
    }

    // ตรวจสอบและรวมสินค้าที่มี product_id ซ้ำกัน
    const requestedItems = new Map();

    for (const item of items) {
      const productId = Number(item.id ?? item.product_id);
      const rawQty = item.qty ?? item.quantity;
      const quantity = rawQty === undefined ? 1 : Number(rawQty);

      if (
        !Number.isSafeInteger(productId) ||
        productId <= 0 ||
        !Number.isFinite(quantity) ||
        quantity <= 0
      ) {
        return NextResponse.json(
          { message: "รหัสสินค้าหรือจำนวนสินค้าไม่ถูกต้อง" },
          { status: 400 }
        );
      }

      const previousQty = requestedItems.get(productId) || 0;
      requestedItems.set(productId, previousQty + quantity);
    }

    const productIds = [...requestedItems.keys()];
    const placeholders = productIds.map(() => "?").join(",");

    connection = await pool.getConnection();
    await connection.beginTransaction();
    transactionStarted = true;

    // ดึงข้อมูลสินค้าจริงและล็อกแถวเพื่อป้องกันการตัดสต็อกซ้ำ
    const [products] = await connection.execute(
      `SELECT
         p.id,
         p.seller_id,
         p.name,
         p.price,
         p.quantity,
         p.unit,
         p.status,
         s.community_name,
         (
           SELECT loc.origin_address
           FROM production_locations loc
           WHERE loc.seller_id = s.id
             AND loc.is_active = TRUE
           LIMIT 1
         ) AS seller_origin
       FROM products p
       INNER JOIN sellers s ON s.id = p.seller_id
       WHERE p.id IN (${placeholders})
       FOR UPDATE`,
      productIds
    );

    if (products.length !== productIds.length) {
      throw new Error("ไม่พบสินค้าบางรายการหรือไม่มีข้อมูลผู้ขาย");
    }

    const productMap = new Map(
      products.map((product) => [Number(product.id), product])
    );

    // ตรวจสอบสถานะและสต็อก พร้อมคำนวณราคาจากฐานข้อมูล
    const groupedOrders = new Map();

    for (const [productId, quantity] of requestedItems) {
      const product = productMap.get(productId);

      if (!product || product.status !== "available") {
        throw new Error(
          `สินค้า ${product?.name || productId} ไม่พร้อมจำหน่าย`
        );
      }

      const stock = Number(product.quantity);
      const price = Number(product.price);
      const sellerId = Number(product.seller_id);

      if (
        !Number.isFinite(stock) ||
        !Number.isFinite(price) ||
        price < 0 ||
        !Number.isInteger(sellerId) ||
        sellerId <= 0
      ) {
        throw new Error(`ข้อมูลสินค้า ${product.name} ไม่ถูกต้อง`);
      }

      if (quantity > stock) {
        throw new Error(
          `สินค้า ${product.name} มีคงเหลือ ${stock} ${product.unit} แต่สั่งซื้อ ${quantity}`
        );
      }

      const subtotal = Number((price * quantity).toFixed(2));

      if (!groupedOrders.has(sellerId)) {
        groupedOrders.set(sellerId, {
          sellerId,
          sellerOrigin:
            product.seller_origin || "แปลงเพาะปลูก จ.ปทุมธานี",
          items: [],
          totalAmount: 0,
        });
      }

      const group = groupedOrders.get(sellerId);

      group.items.push({
        productId,
        productName: product.name,
        unitPrice: price,
        quantity,
        unit: product.unit || "กิโลกรัม",
        subtotal,
      });

      group.totalAmount = Number(
        (group.totalAmount + subtotal).toFixed(2)
      );
    }

    const createdOrders = [];

    // สร้างคำสั่งซื้อแยกตามผู้ขาย
    for (const group of groupedOrders.values()) {
      const orderCode =
        `PLK-PT-${Date.now()}-${Math.floor(10000 + Math.random() * 90000)}`;

      const [orderRes] = await connection.execute(
        `INSERT INTO orders
         (
           order_code, seller_id, buyer_name, buyer_phone, buyer_address,
           buyer_latitude, buyer_longitude, total_amount,
           payment_method, payment_status, order_status,
           transfer_slip_url, notes
         )
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'direct_p2p_transfer',
                 'pending_verification', 'received', NULL, ?)`,
        [
          orderCode,
          group.sellerId,
          buyerName,
          buyerPhone,
          buyerAddress,
          safeLatitude,
          safeLongitude,
          group.totalAmount,
          notes,
        ]
      );

      const orderId = orderRes.insertId;

      // บันทึกรายการสินค้าและตัดสต็อก
      for (const item of group.items) {
        await connection.execute(
          `INSERT INTO order_items
           (order_id, product_id, product_name, unit_price, quantity, unit, subtotal)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [
            orderId,
            item.productId,
            item.productName,
            item.unitPrice,
            item.quantity,
            item.unit,
            item.subtotal,
          ]
        );

        const [stockResult] = await connection.execute(
          `UPDATE products
           SET
             status = CASE
               WHEN quantity - ? <= 0 THEN 'sold_out'
               ELSE status
             END,
             quantity = quantity - ?
           WHERE id = ?
             AND status = 'available'
             AND quantity >= ?`,
          [
            item.quantity,
            item.quantity,
            item.productId,
            item.quantity,
          ]
        );

        if (stockResult.affectedRows !== 1) {
          throw new Error(
            `ไม่สามารถตัดสต็อกสินค้า ${item.productName} ได้`
          );
        }
      }

      // บันทึกประวัติคำสั่งซื้อ
      await connection.execute(
        `INSERT INTO order_tracking_events
         (order_id, status, description, location_name)
         VALUES
         (?, 'received', 'เกษตรกรได้รับคำสั่งซื้อและรอตรวจสอบการชำระเงิน', ?),
         (?, 'preparing_harvest', 'แจ้งแปลงเพาะปลูกเตรียมผลผลิตตามขั้นตอนการเก็บเกี่ยว', ?)`,
        [
          orderId,
          "ระบบสั่งซื้อตรง ปลูกรัก",
          orderId,
          group.sellerOrigin,
        ]
      );

      // บันทึกรายรับให้ผู้ขายของคำสั่งซื้อนี้
      await connection.execute(
        `INSERT INTO seller_ledger
         (seller_id, entry_type, category, amount, description, reference_code, transaction_date)
         VALUES (?, 'revenue', 'ขายผลผลิตโอนตรง', ?, ?, ?, CURDATE())`,
        [
          group.sellerId,
          group.totalAmount,
          `คำสั่งซื้อผลผลิต ${orderCode} จาก ${buyerName}`,
          orderCode,
        ]
      );

      createdOrders.push({
        order_id: orderId,
        order_code: orderCode,
        seller_id: group.sellerId,
        total_amount: group.totalAmount,
      });
    }

    await connection.commit();
    transactionStarted = false;

    const totalAmount = Number(
      createdOrders
        .reduce((sum, order) => sum + order.total_amount, 0)
        .toFixed(2)
    );

    return NextResponse.json(
      {
        message: "บันทึกคำสั่งซื้อและแยกคำสั่งซื้อตามผู้ขายสำเร็จ",
        order_code: createdOrders[0].order_code,
        order_id: createdOrders[0].order_id,
        total_amount: totalAmount,
        orders: createdOrders,
      },
      { status: 201 }
    );
  } catch (error) {
    if (connection && transactionStarted) {
      try {
        await connection.rollback();
      } catch (rollbackError) {
        console.error("Order rollback error:", rollbackError);
      }
    }

    console.error("POST /api/orders error:", error);

    const message = error.message || "ไม่สามารถสร้างคำสั่งซื้อได้";
    const isClientError =
      message.includes("สินค้า") ||
      message.includes("ไม่พบสินค้า") ||
      message.includes("รหัสสินค้า");

    return NextResponse.json(
      {
        message: isClientError
          ? message
          : "ไม่สามารถสร้างคำสั่งซื้อได้ กรุณาลองใหม่อีกครั้ง",
      },
      { status: isClientError ? 400 : 500 }
    );
  } finally {
    if (connection) {
      connection.release();
    }
  }
}
