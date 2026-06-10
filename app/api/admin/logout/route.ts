// POST /api/admin/logout — 관리자 쿠키 제거.
import { NextResponse } from "next/server";
import { clearAdminCookie } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

export async function POST() {
  clearAdminCookie();
  return NextResponse.json({ ok: true });
}
