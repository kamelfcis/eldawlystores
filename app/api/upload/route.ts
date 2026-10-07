import { NextRequest, NextResponse } from "next/server";
import { getSessionRole } from "@/lib/auth";
import { isR2Configured, uploadBuffer } from "@/lib/storage";

const FOLDERS = new Set(["products", "banners", "brands", "categories"]);
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

function sanitizeFileName(name: string): string {
  return name.replace(/[^\w.-]+/g, "_") || "image";
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSessionRole();
    if (!session) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
    }
    if (session.role !== "admin") {
      return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
    }

    if (!isR2Configured()) {
      return NextResponse.json({ status: "not-configured" }, { status: 503 });
    }

    const contentLength = Number(request.headers.get("content-length") ?? "0");
    if (Number.isFinite(contentLength) && contentLength > MAX_IMAGE_BYTES + 64 * 1024) {
      return NextResponse.json({ error: "حجم الملف أكبر من 5 ميغابايت" }, { status: 413 });
    }

    const formData = await request.formData();
    const file = formData.get("file");
    if (!(file instanceof File) || file.size === 0) {
      return NextResponse.json({ error: "الملف مطلوب" }, { status: 400 });
    }
    if (file.size > MAX_IMAGE_BYTES) {
      return NextResponse.json({ error: "حجم الملف أكبر من 5 ميغابايت" }, { status: 413 });
    }
    if (!file.type.startsWith("image/")) {
      return NextResponse.json({ error: "يُقبل فقط ملفات الصور" }, { status: 415 });
    }

    const rawFolder = formData.get("folder");
    const folder = typeof rawFolder === "string" && FOLDERS.has(rawFolder) ? rawFolder : "products";
    const key = `${folder}/${crypto.randomUUID()}-${sanitizeFileName(file.name)}`;
    const buffer = Buffer.from(await file.arrayBuffer());
    const result = await uploadBuffer(key, buffer, file.type);

    if (result.status === "not-configured") {
      return NextResponse.json({ status: "not-configured" }, { status: 503 });
    }
    if (result.status === "failed" || result.status === "skipped") {
      return NextResponse.json(
        { status: "failed", error: "فشل رفع الملف" },
        { status: 500 }
      );
    }

    return NextResponse.json({ status: "uploaded", publicUrl: result.url });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
