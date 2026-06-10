// POST /api/admin/login  body: { password: string }
import { NextRequest, NextResponse } from "next/server";
import { setAdminCookie, verifyPassword } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "잘못된 요청 형식입니다." }, { status: 400 });
  }

  const password = (body as { password?: unknown })?.password;
  if (typeof password !== "string" || password.length === 0) {
    return NextResponse.json({ ok: false, error: "비밀번호가 필요합니다." }, { status: 400 });
  }

  if (!verifyPassword(password)) {
    // 실패 시 의도적 지연(brute-force 완화)
    await new Promise((r) => setTimeout(r, 500));
    return NextResponse.json({ ok: false, error: "비밀번호가 일치하지 않습니다." }, { status: 401 });
  }

  setAdminCookie();
  return NextResponse.json({ ok: true });
}
