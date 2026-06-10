import { pgTable, varchar, text, timestamp } from "drizzle-orm/pg-core";

// ─── content_blocks ──────────────────────────────────────
// 포트폴리오의 모든 편집 가능한 텍스트를 key/value 로 저장합니다.
// DB 에 값이 없으면 컴포넌트의 fallback(기본 텍스트)을 사용합니다.
// EditableText 는 field="content:<key>" 형식으로 이 테이블을 참조합니다.
export const contentBlocks = pgTable("content_blocks", {
  key: varchar("key", { length: 128 }).primaryKey(),
  value: text("value").notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});
