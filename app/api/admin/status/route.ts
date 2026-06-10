// GET /api/admin/status — 현재 요청의 관리자 여부. 응답: { isAdmin: boolean }
import { NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(
    { isAdmin: isAdminRequest() },
    { headers: { "Cache-Control": "no-store, no-cache, must-revalidate" } },
  );
}
