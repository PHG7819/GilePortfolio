// PATCH /api/content/update
// body: { changes: [{ field: "content:<key>", value: "..." }, …] }
// 권한: 관리자 쿠키 필수. 비관리자는 403.
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { contentBlocks } from "@/db/schema";
import { isAdminRequest } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

interface IncomingChange {
  field: string;
  value: string;
}

const MAX_VALUE_LENGTH = 5000;
const MAX_CONTENT_KEY_LENGTH = 128;
const CONTENT_KEY_RE = /^[A-Za-z0-9._-]+$/;

function fail(error: string, status: number) {
  return NextResponse.json({ ok: false, error }, { status });
}

export async function PATCH(req: NextRequest) {
  if (!isAdminRequest()) {
    return fail("관리자 권한이 필요합니다.", 403);
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return fail("잘못된 JSON 형식입니다.", 400);
  }

  const changes = (body as { changes?: unknown })?.changes;
  if (!Array.isArray(changes) || changes.length === 0) {
    return fail("changes 배열이 필요합니다.", 400);
  }
  if (changes.length > 500) {
    return fail("한 번에 500개를 초과해 수정할 수 없습니다.", 400);
  }

  // 사전 검증 — DB 작업 전에 형식 오류를 잡아냄.
  for (const c of changes as IncomingChange[]) {
    if (typeof c?.field !== "string" || typeof c?.value !== "string") {
      return fail("각 change 는 {field, value} 형식이어야 합니다.", 400);
    }
    if (c.value.length > MAX_VALUE_LENGTH) {
      return fail(`값이 너무 깁니다 (${MAX_VALUE_LENGTH}자 이하).`, 400);
    }
    if (!c.field.startsWith("content:")) {
      return fail(`지원하지 않는 field 형식: ${c.field}`, 400);
    }
    const key = c.field.slice("content:".length);
    if (key.length === 0 || key.length > MAX_CONTENT_KEY_LENGTH || !CONTENT_KEY_RE.test(key)) {
      return fail(`잘못된 content key: ${c.field}`, 400);
    }
  }

  // 검증 통과 — 순차 upsert (neon-http 는 트랜잭션 제한이 있어 sequential 처리, 멱등).
  let updated = 0;
  for (const c of changes as IncomingChange[]) {
    const key = c.field.slice("content:".length);
    try {
      await db
        .insert(contentBlocks)
        .values({ key, value: c.value, updatedAt: new Date() })
        .onConflictDoUpdate({
          target: contentBlocks.key,
          set: { value: c.value, updatedAt: new Date() },
        });
      updated++;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      return NextResponse.json(
        { ok: false, error: `${c.field} 저장 실패: ${message}`, partial: { updated, of: changes.length } },
        { status: 500 },
      );
    }
  }

  return NextResponse.json({ ok: true, updated });
}
