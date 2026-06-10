// 관리자 인증 유틸리티. (가이드와 동일한 방식)
// 단일 ADMIN_PASSWORD 환경변수로 운영하는 경량 인증 시스템.
// - 로그인 성공 시 SHA256(ADMIN_PASSWORD) 를 HttpOnly 쿠키로 발급
// - 이후 요청에서 쿠키 값을 재계산한 SHA256 과 timing-safe 비교
import crypto from "crypto";
import { cookies } from "next/headers";

const COOKIE_NAME = "portfolio_admin";
const COOKIE_MAX_AGE_SECONDS = 30 * 24 * 60 * 60; // 30일

function adminToken(): string {
  const password = process.env.ADMIN_PASSWORD;
  if (!password) throw new Error("ADMIN_PASSWORD 환경변수가 설정되지 않았습니다.");
  return crypto.createHash("sha256").update(password).digest("hex");
}

// timing attack 방지용 안전 비교.
function timingSafeEquals(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

export function verifyPassword(input: string): boolean {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) return false;
  return timingSafeEquals(input, expected);
}

export function setAdminCookie() {
  cookies().set(COOKIE_NAME, adminToken(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: COOKIE_MAX_AGE_SECONDS,
  });
}

export function clearAdminCookie() {
  cookies().delete(COOKIE_NAME);
}

// 현재 요청이 관리자 권한을 가지고 있는지 검증.
export function isAdminRequest(): boolean {
  if (!process.env.ADMIN_PASSWORD) return false;
  const cookie = cookies().get(COOKIE_NAME);
  if (!cookie) return false;
  return timingSafeEquals(cookie.value, adminToken());
}
