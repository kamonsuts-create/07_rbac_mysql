import { NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";
import { getSession } from "@/lib/auth";
import { hasPermission } from "@/lib/rbac";
import fs from "fs/promises";
import path from "path";
import crypto from "crypto";

export const runtime = "nodejs";

if (process.env.CLOUDINARY_CLOUD_NAME) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
}

export async function POST(request) {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json(
        { message: "กรุณาเข้าสู่ระบบก่อนอัปโหลดรูปภาพ" },
        { status: 401 }
      );
    }

    const allowed = await hasPermission(session.userId, "products:create");
    if (!allowed) {
      return NextResponse.json(
        { message: "คุณไม่มีสิทธิ์อัปโหลดรูปสินค้า" },
        { status: 403 }
      );
    }

    const formData = await request.formData();
    const file = formData.get("image");

    if (!file || typeof file === "string") {
      return NextResponse.json(
        { message: "กรุณาเลือกไฟล์รูปภาพที่ต้องการอัปโหลด" },
        { status: 400 }
      );
    }

    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/gif",
      "image/avif",
    ];

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { message: "รองรับเฉพาะไฟล์รูปภาพ JPG, PNG, WEBP, GIF, AVIF" },
        { status: 400 }
      );
    }

    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { message: "ขนาดรูปภาพต้องไม่เกิน 10 MB" },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    // 1. Try Cloudinary if keys exist
    if (
      process.env.CLOUDINARY_CLOUD_NAME &&
      process.env.CLOUDINARY_API_KEY &&
      process.env.CLOUDINARY_API_SECRET
    ) {
      try {
        const result = await new Promise((resolve, reject) => {
          const timeout = setTimeout(() => reject(new Error("Cloudinary timeout")), 6000);
          const stream = cloudinary.uploader.upload_stream(
            {
              folder: "plookrak/products",
              resource_type: "image",
            },
            (error, res) => {
              clearTimeout(timeout);
              if (error) reject(error);
              else resolve(res);
            }
          );
          stream.end(buffer);
        });

        if (result?.secure_url) {
          return NextResponse.json({
            message: "อัปโหลดรูปภาพขึ้นคลาวด์สำเร็จ",
            image_url: result.secure_url,
          });
        }
      } catch (cloudErr) {
        console.warn("Cloudinary upload failed, falling back to local storage:", cloudErr.message);
      }
    }

    // 2. Reliable Local Storage Fallback (/public/uploads/)
    const uploadDir = path.join(process.cwd(), "public", "uploads");
    await fs.mkdir(uploadDir, { recursive: true });

    const ext = file.name ? path.extname(file.name) || ".jpg" : ".jpg";
    const filename = `prod_${Date.now()}_${crypto.randomBytes(4).toString("hex")}${ext}`;
    const filePath = path.join(uploadDir, filename);

    await fs.writeFile(filePath, buffer);

    const localUrl = `/uploads/${filename}`;
    return NextResponse.json({
      message: "อัปโหลดรูปภาพสำเร็จเรียบร้อย",
      image_url: localUrl,
    });
  } catch (error) {
    console.error("Upload image error:", error);
    return NextResponse.json(
      { message: "เกิดข้อผิดพลาดในการอัปโหลดรูปภาพ" },
      { status: 500 }
    );
  }
}
