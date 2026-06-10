import "dotenv/config";
import type { Config } from "drizzle-kit";

// drizzle-kit (db:push / db:generate) 가 사용하는 설정.
// DATABASE_URL 은 .env.local 에서 읽습니다.
export default {
  schema: "./db/schema.ts",
  out: "./db/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: (process.env.DATABASE_URL ||
      process.env.DATABASE_DATABASE_URL ||
      process.env.DATABASE_POSTGRES_URL ||
      process.env.POSTGRES_URL)!,
  },
} satisfies Config;
