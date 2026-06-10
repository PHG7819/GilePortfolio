import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

// 지연 초기화: import 시점이 아니라 실제 쿼리 시점에 연결을 만든다.
// 이렇게 하면 DATABASE_URL 이 없어도 빌드/개발 서버가 뜨고,
// getContentMap 의 try/catch 가 연결 실패를 흡수해 페이지는 fallback 으로 렌더된다.
// Neon-Vercel 통합이 프리픽스(예: DATABASE_)를 붙여 변수를 만들 수 있어,
// 흔한 이름들을 순서대로 탐색한다. 첫 번째로 존재하는 연결 문자열을 사용.
export function resolveDatabaseUrl(): string | undefined {
  return (
    process.env.DATABASE_URL ||
    process.env.DATABASE_DATABASE_URL ||
    process.env.DATABASE_POSTGRES_URL ||
    process.env.POSTGRES_URL ||
    process.env.DATABASE_DATABASE_URL_UNPOOLED ||
    process.env.DATABASE_POSTGRES_URL_NON_POOLING ||
    process.env.POSTGRES_URL_NON_POOLING ||
    undefined
  );
}

function createDb() {
  const url = resolveDatabaseUrl();
  if (!url) throw new Error("DATABASE 연결 문자열 환경변수를 찾을 수 없습니다. (DATABASE_URL 등)");
  const sql = neon(url);
  // neon-http 드라이버는 connection pooling 이 내장되어 Vercel Functions 에 적합.
  return drizzle(sql, { schema });
}

// 진단용: 현재 사용 중인 DB 호스트(일부 마스킹)
export function dbHostMasked(): string {
  const url = resolveDatabaseUrl();
  if (!url) return "(none)";
  try {
    const h = new URL(url).host;
    return h.length > 10 ? h.slice(0, 6) + "…" + h.slice(-8) : h;
  } catch {
    return "(parse-fail)";
  }
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
