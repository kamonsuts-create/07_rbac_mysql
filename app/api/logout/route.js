import { NextResponse } from "next/server";
import { clearSession } from "@/lib/auth";

export async function POST() {
  try {
    await clearSession();

    return NextResponse.json({
      message: "ออกจากระบบสำเร็จ",
    });
  } catch (error) {
    console.error("Logout error:", error);

    return NextResponse.json(
      { message: "ไม่สามารถออกจากระบบได้" },
      { status: 500 }
    );
  }
}
