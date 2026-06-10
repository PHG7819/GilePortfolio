import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

// 지연 초기화: import 시점이 아니라 실제 쿼리 시점에 연결을 만든다.
// 이렇게 하면 DATABASE_URL 이 없어도 빌드/개발 서버가 뜨고,
// getContentMap 의 try/catch 가 연결 실패를 흡수해 페이지는 fallback 으로 렌더된다.
function createDb() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL 환경변수가 설정되지 않았습니다. .env.local 을 확인하세요.");
  const sql = neon(url);
  // neon-http 드라이버는 connection pooling 이 내장되어 Vercel Functions 에 적합.
  return drizzle(sql, { schema });
}

type DB = ReturnType<typeof createDb>;
let _db: DB | null = null;

export const db: DB = new Proxy({} as DB, {
  get(_target, prop, receiver) {
    if (!_db) _db = createDb();
    const value = Reflect.get(_db as object, prop, receiver);
    return typeof value === "function" ? value.bind(_db) : value;
  },
});
