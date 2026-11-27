# 🚀 คู่มือการนำเว็บไซต์ "ปลูกรัก (Pluk Rak)" ขึ้นใช้งานจริงบนโลกออนไลน์ (Production Deployment Guide)

คู่มือนี้จะแนะนำขั้นตอนการนำเว็บไซต์ **ปลูกรัก (Pluk Rak)** ขึ้นโฮสติ้งออนไลน์เพื่อให้ทุกคนบนอินเทอร์เน็ตสามารถเข้าชม สั่งซื้อผลผลิต และใช้งานระบบแอดมิน/เกษตรกรได้จริง **ฟรี 100%** โดยไม่ต้องเสียค่าใช้จ่าย

---

## 🌟 โครงสร้างระบบสำหรับ Production

```mermaid
flowchart LR
    A["ผู้ใช้งานบนอินเทอร์เน็ต"] --> B["Vercel / Railway\n(Next.js Web App)"]
    B --> C["TiDB Cloud / Aiven / Railway\n(MySQL Cloud DB)"]
    B --> D["Cloudinary CDN\n(จัดเก็บรูปผลผลิต & สลิป)"]
    B --> E["Google OAuth\n(เข้าสู่ระบบด้วย Google)"]
```

---

## 📋 สรุปบัญชีทดสอบในระบบ (Demo Accounts)

ไฟล์ฐานข้อมูลที่เตรียมไว้ (`database/plukrak_schema.sql`) มีบัญชีทดสอบพร้อมใช้งานทันที ทุกบัญชีใช้รหัสผ่านเดียวกันคือ: `12345678`

| บทบาท (Role) | อีเมล (Email) | รหัสผ่าน (Password) | สิทธิ์การเข้าถึง |
|---|---|---|---|
| 🛡️ **ผู้ดูแลระบบ (Admin)** | `kamonsut.s68@rsu.ac.th` | `12345678` | เข้าหน้า `/admin`, จัดการสิทธิ์สมาชิก RBAC, จัดการข่าวสาร |
| 🧑‍🌾 **เกษตรกร (Farmer)** | `farmer01@example.com` | `12345678` | เข้าหน้า `/farmer/products`, จัดการผลผลิต, เลขบัญชีรับโอนตรง |
| 👤 **ผู้ซื้อ/สมาชิก (User)** | `testuser03@example.com` | `12345678` | เข้าหน้า `/dashboard`, สั่งซื้อผลผลิต, ติดตามพัสดุ |

*(บนหน้าเว็บ `/login` มีปุ่มคลิกเลือกบทบาทด่วน เพื่อกรอกข้อมูลให้อัตโนมัติในคลิกเดียว)*

---

## 🛠️ วิธีการที่ 1: ติดตั้งฟรีบน Vercel + TiDB Cloud (แนะนำที่สุด รวดเร็ว & ทรงพลัง)

### ขั้นตอนที่ 1: สร้างฐานข้อมูล MySQL ฟรีบน TiDB Cloud (5GB ฟรีตลอดชีพ)
1. ไปที่เว็บไซต์ [TiDB Cloud](https://tidbcloud.com) แล้วลงทะเบียนด้วย Google/GitHub
2. กดปุ่ม **"Create Cluster"** -> เลือกแพ็กเกจ **"Serverless" (Free Tier 5GB)**
3. เลือก Region เป็น **Singapore (`ap-southeast-1`)** เพื่อความรวดเร็วในการเชื่อมต่อจากประเทศไทย
4. ตั้งชื่อ Cluster เช่น `plukrak-db` แล้วกด **Create**
5. ระบบจะแสดงรหัสผ่านของฐานข้อมูล ให้กด **Copy Password** เก็บไว้
6. ไปที่เมนู **"SQL Editor"** บนแถบซ้ายมือของ TiDB Cloud:
   - เปิดไฟล์ `database/plukrak_schema.sql` ในโฟลเดอร์โปรเจกต์นี้
   - คัดลอกคำสั่ง SQL ทั้งหมดแล้ววางลงในช่อง Query
   - กดปุ่ม **Run** เพื่อสร้างตารางทั้งหมด 17 ตาราง พร้อมข้อมูล 10 วิสาหกิจชุมชน
7. ไปที่หน้า **Overview** -> กดปุ่ม **"Connect"**:
   - เลือก Connect Type เป็น **Next.js** หรือ **MySQL Client**
   - คัดลอก Connection String (URL) จะได้ในรูปแบบ:
     ```env
     DATABASE_URL="mysql://<username>:<password>@gateway01.ap-southeast-1.prod.aws.tidbcloud.com:4000/rbac_mysql?ssl={"rejectUnauthorized":true}"
     ```

---

### ขั้นตอนที่ 2: นำโค้ดขึ้น GitHub
1. เปิด Terminal ในโฟลเดอร์โปรเจกต์:
   ```bash
   git add .
   git commit -m "feat: complete plukrak farm theme and production readiness"
   ```
2. สร้าง Repository ใหม่บน [GitHub.com](https://github.com/new) ตั้งชื่อ เช่น `plukrak-store`
3. เชื่อมต่อและ Push โค้ด:
   ```bash
   git remote add origin https://github.com/<your-username>/plukrak-store.git
   git branch -M main
   git push -u origin main
   ```

---

### ขั้นตอนที่ 3: Deploy ขึ้น Vercel
1. ไปที่เว็บไซต์ [Vercel](https://vercel.com) แล้วล็อกอินด้วย GitHub
2. กดปุ่ม **"Add New..."** -> เลือก **"Project"**
3. เลือก Repository `plukrak-store` แล้วกด **"Import"**
4. ในส่วน **"Environment Variables"** ให้เพิ่มตัวแปรต่อไปนี้:

| Key | Value | คำอธิบาย |
|---|---|---|
| `DATABASE_URL` | `mysql://user:pass@host:4000/rbac_mysql?ssl={"rejectUnauthorized":true}` | URL จาก TiDB Cloud ในขั้นตอนที่ 1 |
| `JWT_SECRET` | `c3d7eb8d1e6d118961b1b7f7d03365756a89399bf129ca2ad347376a8ee24739` | รหัสเข้ารหัสเซสชัน |
| `CLOUDINARY_CLOUD_NAME` | `of6fmiyb` | อัปโหลดรูปผลผลิต & สลิป |
| `CLOUDINARY_API_KEY` | `868871672887885` | API Key ของ Cloudinary |
| `CLOUDINARY_API_SECRET` | `IFLeB6jG3jXB8bW_sx2BEwFlEEE` | API Secret ของ Cloudinary |
| `GOOGLE_CLIENT_ID` | *(Client ID ของคุณ)* | สำหรับ Google Login |
| `GOOGLE_CLIENT_SECRET` | *(Client Secret ของคุณ)* | สำหรับ Google Login |
| `GOOGLE_REDIRECT_URI` | `https://<ชื่อโปรเจกต์ของคุณ>.vercel.app/api/auth/google/callback` | ลิงก์ Callback เมื่อขึ้นโดเมนจริง |

5. กดปุ่ม **"Deploy"**
6. รอประมาณ 1-2 นาที Vercel จะสร้างโดเมนจริงให้ เช่น `https://plukrak-store.vercel.app` 🎉

---

## 🚂 วิธีการที่ 2: ติดตั้งบน Railway (รวมทั้งเว็บและ MySQL ในที่เดียว)

1. ไปที่ [Railway.app](https://railway.app)
2. กดปุ่ม **"New Project"** -> เลือก **"Provision MySQL"**
3. ในบริการ MySQL ที่สร้างขึ้น:
   - ไปที่แท็บ **Connect** -> คัดลอก `MYSQL_URL`
   - ใช้โปรแกรมต่อ MySQL (เช่น DBeaver, TablePlus) หรือรันผ่าน Railway CLI เพื่อนำเข้าไฟล์ `database/plukrak_schema.sql`
4. กดปุ่ม **"New Service"** -> เลือก **"GitHub Repo"** -> เลือกโปรเจกต์นี้
5. ไปที่แท็บ **Variables** ของ Web Service แล้วใส่:
   - `DATABASE_URL` = `${{MySQL.MYSQL_URL}}`
   - `JWT_SECRET` = `c3d7eb8d1e6d118961b1b7f7d03365756a89399bf129ca2ad347376a8ee24739`
   - `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`
6. ไปที่แท็บ **Settings** -> ในหัวข้อ **Networking** กด **"Generate Domain"**
7. เว็บไซต์พร้อมใช้งานทันที!

---

## 🔒 การตั้งค่า Google Login ให้ใช้งานบนโดเมนออนไลน์
เมื่อมีโดเมนจริงแล้ว (เช่น `https://plukrak.vercel.app`):
1. เข้าไปที่ [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. คลิกเลือก OAuth 2.0 Client IDs ของโปรเจกต์คุณ
3. ในช่อง **Authorized JavaScript origins** ให้เพิ่ม:
   - `https://plukrak.vercel.app`
4. ในช่อง **Authorized redirect URIs** ให้เพิ่ม:
   - `https://plukrak.vercel.app/api/auth/google/callback`
5. บันทึก (Save) — ผู้ใช้ทุกคนจะสามารถล็อกอินด้วย Google ได้ทันที!

---

## ✅ ตรวจสอบความพร้อมของระบบ (Verification Checklist)

- [x] **Next.js Production Build**: รัน `npm run build` ผ่าน 100% ไม่มีข้อผิดพลาด
- [x] **Universal Database Driver**: `lib/db.js` รองรับทั้ง `DATABASE_URL` (Cloud MySQL), SSL Auto-detection, และ Local TCP
- [x] **Security**: ใช้ `jose` SignJWT แบบ HTTP-Only Secure Cookie และ `bcryptjs` แบบ Pure JS ที่เข้ากันได้กับทุก Linux Serverless
- [x] **Database Schema Ready**: มีไฟล์ `database/plukrak_schema.sql` พร้อม 17 ตาราง และข้อมูลสินค้าจริง
- [x] **Responsive & Cohesive UI**: หน้าเว็บทุกหน้า (หน้าร้าน, เข้าสู่ระบบ, สมัครสมาชิก, ข่าวสาร, แดชบอร์ด, จัดการผลผลิต, ผู้ดูแล) สอดคล้องตามธีม "ปลูกรัก Pluk Rak" สวยงามเป็นเอกภาพ
