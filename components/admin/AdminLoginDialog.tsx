"use client";

import { useState } from "react";
import { useAdmin } from "./AdminProvider";

export function AdminLoginDialog({ onClose }: { onClose: () => void }) {
  const { login } = useAdmin();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(e?: React.FormEvent) {
    e?.preventDefault();
    if (!password) return;
    setLoading(true);
    setError(null);
    const res = await login(password);
    setLoading(false);
    if (res.ok) onClose();
    else setError(res.error ?? "로그인에 실패했습니다.");
  }

  return (
    <div className="admin-modal-overlay" onClick={onClose}>
      <form className="admin-login" onClick={(e) => e.stopPropagation()} onSubmit={submit}>
        <h3>관리자 로그인</h3>
        <p>포트폴리오 내용을 편집하려면 비밀번호를 입력하세요.</p>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoFocus
          placeholder="비밀번호"
        />
        {error && <p className="admin-error">{error}</p>}
        <div className="admin-login-actions">
          <button type="button" onClick={onClose} disabled={loading} className="admin-btn-ghost">
            취소
          </button>
          <button type="submit" disabled={loading || password.length === 0} className="admin-btn-primary">
            {loading ? "확인 중…" : "로그인"}
          </button>
        </div>
      </form>
    </div>
  );
}
