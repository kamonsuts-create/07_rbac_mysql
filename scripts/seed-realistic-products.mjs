import mysql from "mysql2/promise";

async function main() {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST || "localhost",
    user: process.env.DB_USER || process.env.DB_USERNAME || "root",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || process.env.DB_DATABASE || "rbac_mysql",
    port: Number(process.env.DB_PORT) || 3306,
  });

  console.log("Connected to MySQL database.");

  // 1. Update Farmer 4
  await conn.execute(
    `UPDATE users 
     SET full_name = 'วิสาหกิจชุมชนเกษตรอินทรีย์ลุ่มน้ำท่าจีน (แปลงนครปฐม)', is_active = TRUE 
     WHERE id = 4`
  );

  // 2. Update Farmer 2
  const [existingFarmer2] = await conn.execute(
    `SELECT id FROM users WHERE email = 'farmer02@plukrak.local'`
  );
  let farmer2Id;
  if (existingFarmer2.length > 0) {
    farmer2Id = existingFarmer2[0].id;
    await conn.execute(
      `UPDATE users SET full_name = 'สหกรณ์ชาวสวนผักปลอดสารวิถีธรรมชาติ (แปลงเชียงใหม่)', is_active = TRUE WHERE id = ?`,
      [farmer2Id]
    );
  } else {
    const [res] = await conn.execute(
      `INSERT INTO users (full_name, email, password_hash, role_id, is_active)
       VALUES ('สหกรณ์ชาวสวนผักปลอดสารวิถีธรรมชาติ (แปลงเชียงใหม่)', 'farmer02@plukrak.local', 'placeholder_hash', 5, TRUE)`
    );
    farmer2Id = res.insertId;
  }

  // 3. Products with explicit origin address, videos, farm photos, certificates, harvest processes & direct payment
  const products = [
    {
      farmer_id: 4,
      name: "เมลอนมัสค์ญี่ปุ่นคราวน์พรีเมียม (Crown Musk Melon)",
      category: "fruit",
      price: 320.0,
      quantity: 35.0,
      unit: "ลูก (1.5-1.8 กก.)",
      province: "นครปฐม",
      location_type: "หน้าแปลง",
      origin_address: "แปลงที่ 04 วิสาหกิจชุมชน ต.คลองใหม่ อ.สามพราน จ.นครปฐม 73110",
      harvest_process:
        "1. ดูแลในโรงเรือนควบคุมระบบปิด ไร้สารเคมีและสารเร่งโต\n2. ใช้น้ำแร่ใต้บาดาลหมุนเวียนและปุ๋ยหมักชีวภาพอินทรีย์\n3. สุ่มตรวจวิเคราะห์สารตกค้างก่อนเก็บเกี่ยว 2 วัน ด้วยชุดตรวจแล็บ (0.00 ppm)\n4. ตัดผลสดช่วงเวลา 05:30 น. ในช่วงที่รสหวานธรรมชาติสะสมสูงสุด 14-16 Brix\n5. ขัดทำความสะอาดเปลือก บรรจุกล่องกันกระแทกพร้อมส่งตรงจากหน้าแปลง",
      image_url:
        "https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=800&auto=format&fit=crop&q=80",
      video_url:
        "https://assets.mixkit.co/videos/preview/mixkit-farmer-walking-in-a-greenhouse-with-fresh-crops-42618-large.mp4",
      farm_image_url:
        "https://images.unsplash.com/photo-1500937386664-56d1dfef3854?w=800&auto=format&fit=crop&q=80",
      cert_image_url:
        "https://images.unsplash.com/photo-1606326608606-aa0b62935f2b?w=800&auto=format&fit=crop&q=80",
      cert_number: "กษ 03-9001-3829-TH",
      bank_name: "ธนาคารเพื่อการเกษตรและสหกรณ์การเกษตร (ธ.ก.ส.)",
      bank_account_name: "วิสาหกิจชุมชนเกษตรอินทรีย์ลุ่มน้ำท่าจีน",
      bank_account_number: "020-1-84920-5",
      promptpay_number: "089-123-4567",
      seller_phone: "089-123-4567",
      description:
        "เมลอนพันธุ์แท้เกรดคัดพิเศษ ลายตาข่ายนูนเด่น เนื้อเขียวเนียนฉ่ำ กลิ่นหอมละมุนตามธรรมชาติ ปลูกในโรงเรือนปิด ปลอดสารพิษ มาตรฐาน GAP ตัดสดพร้อมจำหน่าย",
      status: "available",
    },
    {
      farmer_id: farmer2Id,
      name: "ผักสลัดบัตเตอร์เฮด ไฮโดรโปนิกส์สดกรอบ (Organic Butterhead)",
      category: "vegetable",
      price: 55.0,
      quantity: 110.0,
      unit: "ถุง (300 กรัม)",
      province: "เชียงใหม่",
      location_type: "หน้าสวน",
      origin_address: "แปลงไฮโดรโปนิกส์ 08 สหกรณ์วิถีธรรมชาติ ต.แม่แรม อ.แม่ริม จ.เชียงใหม่ 50180",
      harvest_process:
        "1. เพาะปลูกในรางน้ำหมุนเวียนน้ำแร่ธรรมชาติบนดอยสูง\n2. กรองและฆ่าเชื้อด้วยโอโซนบริสุทธิ์ ไร้ยาฆ่าแมลง 100%\n3. ตัดสดช่วงเช้ามืด 05:00 น. ก่อนแสงแดดออกเพื่อรักษาความกรอบและไม่ให้ผักขม\n4. ล้างน้ำแร่และบรรจุถุงเจาะรูระบายอากาศรักษาความสดชื่น",
      image_url:
        "https://images.unsplash.com/photo-1622206151226-18ca2c9ab4a1?w=800&auto=format&fit=crop&q=80",
      video_url:
        "https://assets.mixkit.co/videos/preview/mixkit-lettuce-growing-in-a-hydroponic-farm-42617-large.mp4",
      farm_image_url:
        "https://images.unsplash.com/photo-1595974482597-4b8da8879bc5?w=800&auto=format&fit=crop&q=80",
      cert_image_url:
        "https://images.unsplash.com/photo-1606326608606-aa0b62935f2b?w=800&auto=format&fit=crop&q=80",
      cert_number: "กษ 03-9001-4412-TH",
      bank_name: "ธนาคารกสิกรไทย",
      bank_account_name: "สหกรณ์ชาวสวนผักปลอดสารวิถีธรรมชาติ",
      bank_account_number: "048-2-93810-1",
      promptpay_number: "081-987-6543",
      seller_phone: "081-987-6543",
      description:
        "ใบนุ่มกรอบหวาน ไร้รสขม ปลูกด้วยน้ำแร่ธรรมชาติใต้บาดาล เก็บเกี่ยวสดใหม่ช่วงเช้าตรู่ก่อนนำส่ง ล้างทำความสะอาดด้วยระบบโอโซน สะอาด ปลอดภัย พร้อมทาน",
      status: "available",
    },
    {
      farmer_id: 4,
      name: "มะเขือเทศเชอร์รี่หวานราชินีสีทอง (Sweet Golden Cherry)",
      category: "vegetable",
      price: 79.0,
      quantity: 80.0,
      unit: "กล่อง (450 กรัม)",
      province: "นครปฐม",
      location_type: "หน้าแปลง",
      origin_address: "แปลงเพาะปลูกอัจฉริยะ 02 ต.บางเลน อ.บางเลน จ.นครปฐม 73130",
      harvest_process:
        "1. บำรุงด้วยปุ๋ยหมักชีวภาพปลาทะเลและแคลเซียมอินทรีย์\n2. สุ่มตรวจระดับความหวานและสารตกค้างก่อนเก็บเกี่ยว\n3. คัดเก็บเฉพาะผลสุกคาต้นระดับ 95% เพื่อให้ได้ไลโคปีนสูงสุด\n4. บรรจุกล่องแข็งแรงเพื่อป้องกันผลช้ำในการขนส่ง",
      image_url:
        "https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=800&auto=format&fit=crop&q=80",
      video_url: null,
      farm_image_url:
        "https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?w=800&auto=format&fit=crop&q=80",
      cert_image_url:
        "https://images.unsplash.com/photo-1606326608606-aa0b62935f2b?w=800&auto=format&fit=crop&q=80",
      cert_number: "กษ 03-9001-3829-TH",
      bank_name: "ธนาคารเพื่อการเกษตรและสหกรณ์การเกษตร (ธ.ก.ส.)",
      bank_account_name: "วิสาหกิจชุมชนเกษตรอินทรีย์ลุ่มน้ำท่าจีน",
      bank_account_number: "020-1-84920-5",
      promptpay_number: "089-123-4567",
      seller_phone: "089-123-4567",
      description:
        "ผลแน่นกรอบ กัดแล้วฉ่ำสดชื่น รสชาติหวานอมเปรี้ยวกลมกล่อม ไลโคปีนสูง คัดเฉพาะผลสุกตามธรรมชาติคาต้น ผ่านมาตรฐานเกษตรปลอดภัย",
      status: "available",
    },
    {
      farmer_id: 4,
      name: "ข้าวหอมมะลิทุ่งกุลาร้องไห้ อินทรีย์ 105 แท้ (Organic Jasmine Rice)",
      category: "grain",
      price: 195.0,
      quantity: 250.0,
      unit: "ถุงสุญญากาศ (5 กิโลกรัม)",
      province: "ร้อยเอ็ด",
      location_type: "ตลาดวิสาหกิจชุมชน",
      origin_address: "แปลงเกษตรอินทรีย์ GI ทุ่งกุลา ต.ทุ่งกุลา อ.สุวรรณภูมิ จ.ร้อยเอ็ด 45130",
      harvest_process:
        "1. ปลูกในนาดินทรายเค็มทุ่งกุลาอันเป็นเอกลักษณ์ทางภูมิศาสตร์ (GI)\n2. เกี่ยวข้าวช่วงพลับพลึง เมล็ดสุกพอดีรักษาความหอมกลิ่นใบเตย\n3. สีข้าวด้วยโรงสีชุมชนระบบชะลอความร้อนเพื่อรักษาคุณค่าจมูกข้าว\n4. บรรจุสุญญากาศทันทีหลังการสี ป้องกันมอดโดยไม่ต้องพ่นยาเคมี",
      image_url:
        "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=800&auto=format&fit=crop&q=80",
      video_url: null,
      farm_image_url:
        "https://images.unsplash.com/photo-1500937386664-56d1dfef3854?w=800&auto=format&fit=crop&q=80",
      cert_image_url:
        "https://images.unsplash.com/photo-1606326608606-aa0b62935f2b?w=800&auto=format&fit=crop&q=80",
      cert_number: "GI-TH-2026-0042",
      bank_name: "ธนาคารเพื่อการเกษตรและสหกรณ์การเกษตร (ธ.ก.ส.)",
      bank_account_name: "วิสาหกิจชุมชนเกษตรอินทรีย์ลุ่มน้ำท่าจีน",
      bank_account_number: "020-1-84920-5",
      promptpay_number: "089-123-4567",
      seller_phone: "089-123-4567",
      description:
        "ข้าวนาปีพันธุ์แท้ สีสดใหม่ บรรจุสุญญากาศรักษาความหอม เมล็ดเรียวยาว หุงขึ้นหม้อ นุ่มเหนียวกำลังดี หอมกรุ่นกลิ่นใบเตยธรรมชาติ การันตี Organic Thailand & GI",
      status: "available",
    },
    {
      farmer_id: farmer2Id,
      name: "อะโวคาโดพันธุ์แฮสส์เชียงใหม่ เกรดคัดพิเศษ (Hass Avocado)",
      category: "fruit",
      price: 149.0,
      quantity: 65.0,
      unit: "กิโลกรัม (3-4 ผล)",
      province: "เชียงใหม่",
      location_type: "หน้าสวน",
      origin_address: "แปลงไม้ผลดอยม่อนแจ่ม สหกรณ์วิถีธรรมชาติ อ.แม่ริม จ.เชียงใหม่ 50180",
      harvest_process:
        "1. ปลูกบนพื้นที่สูงสภาพอากาศหนาวเย็น ดินภูเขาอุดมด้วยแร่ธาตุ\n2. ตัดผลที่มีขนาดแก่จัดตามเกณฑ์เปอร์เซ็นต์น้ำมันธรรมชาติ\n3. ไม่ใช้สารเคมีบ่มแก๊ส ปล่อยให้สุกตามธรรมชาติในอุณหภูมิปกติ",
      image_url:
        "https://images.unsplash.com/photo-1523049673857-eb18f1d7b578?w=800&auto=format&fit=crop&q=80",
      video_url: null,
      farm_image_url:
        "https://images.unsplash.com/photo-1595974482597-4b8da8879bc5?w=800&auto=format&fit=crop&q=80",
      cert_image_url:
        "https://images.unsplash.com/photo-1606326608606-aa0b62935f2b?w=800&auto=format&fit=crop&q=80",
      cert_number: "กษ 03-9001-4412-TH",
      bank_name: "ธนาคารกสิกรไทย",
      bank_account_name: "สหกรณ์ชาวสวนผักปลอดสารวิถีธรรมชาติ",
      bank_account_number: "048-2-93810-1",
      promptpay_number: "081-987-6543",
      seller_phone: "081-987-6543",
      description:
        "เนื้อเนียนละเอียด มันหนึบดั่งเนย กลิ่นหอมนัตตี้ อุดมด้วยกรดไขมันดี ปลูกบนพื้นที่เนินเขาสูงสภาพแวดล้อมบริสุทธิ์ ปราศจากสารเร่งสุก ปล่อยสุกตามวงจรธรรมชาติ",
      status: "available",
    },
    {
      farmer_id: 4,
      name: "น้ำผึ้งดอกลำไยป่าแท้ 100% (Pure Wild Honey)",
      category: "processed",
      price: 260.0,
      quantity: 45.0,
      unit: "ขวดแก้ว (500 กรัม)",
      province: "เชียงใหม่",
      location_type: "ตลาดวิสาหกิจชุมชน",
      origin_address: "สวนป่าผึ้งอินทรีย์ ต.บ้านกาด อ.แม่วาง จ.เชียงใหม่ 50360",
      harvest_process:
        "1. เลี้ยงผึ้งในป่าธรรมชาติและสวนลำไยอินทรีย์ช่วงฤดูออกดอก\n2. เก็บเกี่ยวน้ำผึ้งเดือนห้าแท้ที่มีความชื้นต่ำตามธรรมชาติ\n3. กรองด้วยผ้าขาวบางสะอาด ไม่ผ่านความร้อนเพื่อรักษาเอ็นไซม์ธรรมชาติ",
      image_url:
        "https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=800&auto=format&fit=crop&q=80",
      video_url: null,
      farm_image_url:
        "https://images.unsplash.com/photo-1500937386664-56d1dfef3854?w=800&auto=format&fit=crop&q=80",
      cert_image_url:
        "https://images.unsplash.com/photo-1606326608606-aa0b62935f2b?w=800&auto=format&fit=crop&q=80",
      cert_number: "อย. 50-2-04862-2-0012",
      bank_name: "ธนาคารเพื่อการเกษตรและสหกรณ์การเกษตร (ธ.ก.ส.)",
      bank_account_name: "วิสาหกิจชุมชนเกษตรอินทรีย์ลุ่มน้ำท่าจีน",
      bank_account_number: "020-1-84920-5",
      promptpay_number: "089-123-4567",
      seller_phone: "089-123-4567",
      description:
        "น้ำผึ้งแท้เดือนห้าจากป่าธรรมชาติ ไม่ผ่านกระบวนการความร้อน คงคุณค่าเอ็นไซม์และสารอาหารครบถ้วน สีทองอำพัน ผ่านการตรวจวิเคราะห์แล็บไร้น้ำตาลผสม",
      status: "available",
    },
    {
      farmer_id: farmer2Id,
      name: "เห็ดชิตาเกะสด ดอยอินทนนท์ (Fresh Shiitake Mushrooms)",
      category: "vegetable",
      price: 95.0,
      quantity: 50.0,
      unit: "แพ็ค (350 กรัม)",
      province: "เชียงใหม่",
      location_type: "หน้าสวน",
      origin_address: "โรงเพาะเห็ดขอนโอ๊คอินทนนท์ อ.จอมทอง จ.เชียงใหม่ 50160",
      harvest_process:
        "1. เพาะบนท่อนไม้โอ๊คธรรมชาติในสภาพอากาศเย็นตลอดทั้งปี\n2. ใช้น้ำจากลำธารธรรมชาติที่ผ่านการกรองตะกอน\n3. เก็บดอกเห็ดขณะที่หมวกเห็ดเริ่มบาน 80% ซึ่งเป็นช่วงที่เนื้อแน่นที่สุด",
      image_url:
        "https://images.unsplash.com/photo-1504544750208-dc0358e63f7f?w=800&auto=format&fit=crop&q=80",
      video_url: null,
      farm_image_url:
        "https://images.unsplash.com/photo-1595974482597-4b8da8879bc5?w=800&auto=format&fit=crop&q=80",
      cert_image_url:
        "https://images.unsplash.com/photo-1606326608606-aa0b62935f2b?w=800&auto=format&fit=crop&q=80",
      cert_number: "กษ 03-9001-4412-TH",
      bank_name: "ธนาคารกสิกรไทย",
      bank_account_name: "สหกรณ์ชาวสวนผักปลอดสารวิถีธรรมชาติ",
      bank_account_number: "048-2-93810-1",
      promptpay_number: "081-987-6543",
      seller_phone: "081-987-6543",
      description:
        "ดอกหนา เนื้อนุ่มแน่น กลิ่นหอมเป็นเอกลักษณ์ เพาะบนท่อนไม้ธรรมชาติในโรงเรือนสะอาดบนยอดดอยสูง ไร้สารฟอกขาวและไร้ยาฆ่าเชื้อราทุกชนิด",
      status: "available",
    },
    {
      farmer_id: 4,
      name: "มัลเบอร์รี่สดคัดผลโต (Fresh Organic Mulberry)",
      category: "fruit",
      price: 75.0,
      quantity: 40.0,
      unit: "กล่อง (250 กรัม)",
      province: "นครปฐม",
      location_type: "หน้าสวน",
      origin_address: "แปลงหม่อนมัลเบอร์รี่ปลอดภัย ต.ลำเหย อ.ดอนตูม จ.นครปฐม 73150",
      harvest_process:
        "1. ปลูกในร่องสวนยกร่อง ระบายน้ำดี ใช้ปุ๋ยคอกหมักธรรมชาติ\n2. ตัดแต่งกิ่งและห่อผลป้องกันแมลงวันทองโดยไม่ฉีดยา\n3. เก็บเกี่ยวด้วยมือคัดเฉพาะผลสีดำสุกจัด รสหวานอมเปรี้ยวชุ่มคอ",
      image_url:
        "https://images.unsplash.com/photo-1563227812-0ea4c22e6cc8?w=800&auto=format&fit=crop&q=80",
      video_url: null,
      farm_image_url:
        "https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?w=800&auto=format&fit=crop&q=80",
      cert_image_url:
        "https://images.unsplash.com/photo-1606326608606-aa0b62935f2b?w=800&auto=format&fit=crop&q=80",
      cert_number: "กษ 03-9001-3829-TH",
      bank_name: "ธนาคารเพื่อการเกษตรและสหกรณ์การเกษตร (ธ.ก.ส.)",
      bank_account_name: "วิสาหกิจชุมชนเกษตรอินทรีย์ลุ่มน้ำท่าจีน",
      bank_account_number: "020-1-84920-5",
      promptpay_number: "089-123-4567",
      seller_phone: "089-123-4567",
      description:
        "ลูกหม่อนสุกจัดสีม่วงเข้ม รสชาติหวานอมเปรี้ยวชุ่มคอ มีสารต้านอนุมูลอิสระแอนโทไซยานินสูง คัดผลสดมือต่อมือในยามเช้า บรรจุกล่องรักษาความสด",
      status: "available",
    },
  ];

  await conn.execute("DELETE FROM products");

  for (const prod of products) {
    await conn.execute(
      `INSERT INTO products 
       (farmer_id, name, category, price, quantity, unit, province, location_type, origin_address,
        harvest_process, image_url, video_url, farm_image_url, cert_image_url, cert_number,
        bank_name, bank_account_name, bank_account_number, promptpay_number, seller_phone, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        prod.farmer_id,
        prod.name,
        prod.category,
        prod.price,
        prod.quantity,
        prod.unit,
        prod.province,
        prod.location_type,
        prod.origin_address,
        prod.harvest_process,
        prod.image_url,
        prod.video_url,
        prod.farm_image_url,
        prod.cert_image_url,
        prod.cert_number,
        prod.bank_name,
        prod.bank_account_name,
        prod.bank_account_number,
        prod.promptpay_number,
        prod.seller_phone,
        prod.status,
      ]
    );
  }

  console.log("Seeded products with video, certificates, harvest process, and direct bank payment successfully!");
  await conn.end();
}

main().catch((err) => {
  console.error("Seed error:", err);
  process.exit(1);
});
