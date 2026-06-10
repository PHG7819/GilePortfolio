// POST /api/upload  (multipart/form-data, field "file")
// 관리자만 가능. 이미지를 Vercel Blob 에 업로드하고 공개 URL 을 반환.
// 반환된 URL 은 EditableImage 가 content_blocks 에 저장합니다.
import { NextRequest, NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { isAdminRequest } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

const MAX_BYTES = 8 * 1024 * 1024; // 8MB

export async function POST(req: NextRequest) {
  if (!isAdminRequest()) {
    return NextResponse.json({ ok: false, error: "관리자 권한이 필요합니다." }, { status: 403 });
  }

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ ok: false, error: "잘못된 요청 형식입니다." }, { status: 400 });
  }

  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ ok: false, error: "파일이 필요합니다." }, { status: 400 });
  }
  if (!file.type.startsWith("image/")) {
    return NextResponse.json({ ok: false, error: "이미지 파일만 업로드할 수 있습니다." }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ ok: false, error: "이미지는 8MB 이하만 가능합니다." }, { status: 400 });
  }

  try {
    const ext = (file.name.split(".").pop() || "png").toLowerCase().replace(/[^a-z0-9]/g, "");
    const name = `portfolio/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext || "png"}`;
    const blob = await put(name, file, { access: "public", contentType: file.type });
    return NextResponse.json({ ok: true, url: blob.url });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    // 대개 BLOB_READ_WRITE_TOKEN 미설정(로컬) 또는 Blob 스토어 미연결(Vercel)일 때 발생.
    return NextResponse.json(
      { ok: false, error: `업로드 실패: ${message} (Vercel Blob 연결/토큰을 확인하세요)` },
      { status: 500 },
    );
  }
}
