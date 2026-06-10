// POST /api/list  body: { list: string, action: "add" } | { list, action: "delete", id: string }
// 반복되는 "항목 카드"(데모 카드, 역량, 러닝 카드, 스킬, 경력 미니/항목)의
// 순서 목록을 content_blocks 의 "<list>.order" 키에 JSON 배열로 저장합니다.
// 각 항목의 텍스트/이미지는 "<list-item-prefix>.<id>.*" 키로 content/update 에 저장됩니다.
import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { contentBlocks } from "@/db/schema";
import { isAdminRequest } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

// 허용된 리스트와 기본 순서(화이트리스트). 여기 없는 list 는 거부.
const LISTS: Record<string, string[]> = {
  "demo.cards": ["1", "2", "3", "4", "5", "6"],
  "projects.feats": ["1", "2", "3"],
  "learning.cards": ["1", "2"],
  "skills.cards": ["1", "2", "3", "4"],
  "career.minis": ["1", "2", "3", "4"],
  "career.entries": ["r2"],
};
const MAX_ITEMS = 60;

async function readOrder(list: string): Promise<string[]> {
  const key = `${list}.order`;
  const rows = await db.select().from(contentBlocks).where(eq(contentBlocks.key, key));
  if (!rows.length) return [...LISTS[list]];
  try {
    const parsed = JSON.parse(rows[0].value);
    if (Array.isArray(parsed)) {
      // 페이지와 동일하게: 모두 문자열로 강제 변환 + 빈 값 제거 (null/숫자 섞여도 안전)
      const arr = parsed.map((x) => String(x)).filter((s) => s.length > 0 && s !== "null" && s !== "undefined");
      if (arr.length) return arr;
    }
  } catch {
    /* fallthrough */
  }
  return [...LISTS[list]];
}

async function writeOrder(list: string, order: string[]) {
  const key = `${list}.order`;
  const value = JSON.stringify(order);
  await db
    .insert(contentBlocks)
    .values({ key, value, updatedAt: new Date() })
    .onConflictDoUpdate({ target: contentBlocks.key, set: { value, updatedAt: new Date() } });
}

export async function POST(req: NextRequest) {
  if (!isAdminRequest()) {
    return NextResponse.json({ ok: false, error: "관리자 권한이 필요합니다." }, { status: 403 });
  }

  let body: { list?: string; action?: string; id?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "잘못된 JSON 형식입니다." }, { status: 400 });
  }

  const list = body.list;
  if (typeof list !== "string" || !(list in LISTS)) {
    return NextResponse.json({ ok: false, error: `허용되지 않은 list: ${list}` }, { status: 400 });
  }

  try {
    const order = await readOrder(list);

    if (body.action === "add") {
      if (order.length >= MAX_ITEMS) {
        return NextResponse.json({ ok: false, error: `항목은 최대 ${MAX_ITEMS}개까지 가능합니다.` }, { status: 400 });
      }
      const newId = `c${Date.now().toString(36)}`; // 영문+숫자 → content key 규칙 충족
      order.push(newId);
      await writeOrder(list, order);
      return NextResponse.json({ ok: true, id: newId });
    }

    if (body.action === "delete") {
      const id = body.id;
      if (typeof id !== "string" || !id) {
        return NextResponse.json({ ok: false, error: "삭제할 항목 id 가 필요합니다." }, { status: 400 });
      }
      await writeOrder(list, order.filter((x) => x !== id));
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ ok: false, error: "알 수 없는 action 입니다." }, { status: 400 });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ ok: false, error: `처리 실패: ${message}` }, { status: 500 });
  }
}
