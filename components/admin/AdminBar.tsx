"use client";
// 헤더 우측에 표시되는 관리자 컨트롤.
// - 비로그인:  "관리자" 버튼
// - 로그인(뷰): "편집" + "로그아웃"
// - 편집 모드:  변경 수 + "취소" + "저장"

import { useState } from "react";
import { useAdmin } from "./AdminProvider";
import { AdminLoginDialog } from "./AdminLoginDialog";

export function AdminBar() {
  const {
    isAdmin,
    isEditMode,
    setEditMode,
    pendingCount,
    saveChanges,
    cancelChanges,
    isSaving,
    lastError,
    logout,
  } = useAdmin();
  const [showLogin, setShowLogin] = useState(false);

  if (!isAdmin) {
    return (
      <>
        <button className="admin-btn-ghost" onClick={() => setShowLogin(true)}>
          관리자
        </button>
        {showLogin && <AdminLoginDialog onClose={() => setShowLogin(false)} />}
      </>
    );
  }

  if (!isEditMode) {
    return (
      <div className="admin-bar">
        <button className="admin-btn-primary" onClick={() => setEditMode(true)}>
          편집
        </button>
        <button className="admin-btn-ghost" onClick={logout}>
          로그아웃
        </button>
      </div>
    );
  }

  return (
    <div className="admin-bar">
      <span className="admin-count">{pendingCount > 0 ? `${pendingCount}개 변경됨` : "변경 없음"}</span>
      {lastError && (
        <span className="admin-error" title={lastError}>
          저장 실패
        </span>
      )}
      <button className="admin-btn-ghost" onClick={cancelChanges} disabled={isSaving}>
        취소
      </button>
      <button className="admin-btn-primary" onClick={saveChanges} disabled={isSaving || pendingCount === 0}>
        {isSaving ? "저장 중…" : "저장"}
      </button>
    </div>
  );
}
