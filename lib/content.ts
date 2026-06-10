import { db } from "@/db";
import { contentBlocks } from "@/db/schema";

export type ContentMap = Record<string, string>;

// DB 의 content_blocks 전체를 key→value 맵으로 로드.
// DB 가 아직 설정되지 않았거나 오류가 나도 빈 맵을 반환해
// 페이지는 항상 fallback(기본 텍스트)으로 렌더링됩니다.
export async function getContentMap(): Promise<ContentMap> {
  try {
    const rows = await db.select().from(contentBlocks);
    const map: ContentMap = {};
    for (const r of rows) map[r.key] = r.value;
    return map;
  } catch {
    return {};
  }
}
