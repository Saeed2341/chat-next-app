import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";

const SECRET = new TextEncoder().encode("secret123");
const MAX_SIZE = 8 * 1024 * 1024;

async function saveFile(file: File, uploadsDir: string, suffix = "") {
  const ext = file.type === "image/png" ? "png" : "jpg";
  const fileName = `${randomUUID()}${suffix}.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(uploadsDir, fileName), buffer);
  return { url: `/uploads/${fileName}`, fileSize: file.size, mimeType: file.type };
}

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get("token")?.value;
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await jwtVerify(token, SECRET);

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const preview = formData.get("preview") as File | null;

    if (!file || !file.type.startsWith("image/")) {
      return NextResponse.json({ error: "Invalid file" }, { status: 400 });
    }

    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: "File too large" }, { status: 400 });
    }

    const uploadsDir = path.join(process.cwd(), "public", "uploads");
    await mkdir(uploadsDir, { recursive: true });

    const saved = await saveFile(file, uploadsDir);

    let previewUrl: string | undefined;
    let previewFileSize: number | undefined;

    if (preview && preview.type.startsWith("image/")) {
      const savedPreview = await saveFile(preview, uploadsDir, "-preview");
      previewUrl = savedPreview.url;
      previewFileSize = savedPreview.fileSize;
    }

    return NextResponse.json({
      url: saved.url,
      previewUrl,
      fileName: file.name,
      fileSize: saved.fileSize,
      previewFileSize,
      mimeType: saved.mimeType,
    });
  } catch {
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
