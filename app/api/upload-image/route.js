
import { NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";
import { getSession } from "@/lib/auth";
import { hasPermission } from "@/lib/rbac";

export const runtime = "nodejs";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(request) {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json(
        { message: "กรุณาเข้าสู่ระบบก่อน" },
        { status: 401 }
      );
    }

    const allowed = await hasPermission(
      session.userId,
      "products:create"
    );

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
        { message: "กรุณาเลือกไฟล์รูปภาพ" },
        { status: 400 }
      );
    }

    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
    ];

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { message: "รองรับเฉพาะ JPG, PNG และ WEBP" },
        { status: 400 }
      );
    }

    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { message: "รูปภาพต้องมีขนาดไม่เกิน 5 MB" },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    const result = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: "plookrak/products",
          resource_type: "image",
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );

      stream.end(buffer);
    });

    return NextResponse.json({
      message: "อัปโหลดรูปภาพสำเร็จ",
      image_url: result.secure_url,
    });

  } catch (error) {
    console.error("Upload image error:", error);

    return NextResponse.json(
      { message: "ไม่สามารถอัปโหลดรูปภาพได้" },
      { status: 500 }
    );
  }
}
