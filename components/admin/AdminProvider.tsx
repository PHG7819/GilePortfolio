"use client";
// 관리자 상태(로그인 여부 + 편집 모드 + 변경사항) 글로벌 컨텍스트.
// 모든 EditableText 와 AdminBar 가 이 컨텍스트를 사용합니다.

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";

interface AdminContextValue {
  isAdmin: boolean;
  isEditMode: boolean;
  setEditMode: (v: boolean) => void;

  pendingChanges: Map<string, string>;
  registerChange: (field: string, value: string) => void;
  pendingCount: number;

  saveChanges: () => Promise<void>;
  cancelChanges: () => void;
  isSaving: boolean;
  lastError: string | null;

  /** 리스트 항목 추가 — 성공 시 새로고침. (list 예: "demo.cards", "skills.cards") */
  addItem: (list: string) => Promise<void>;
  /** 리스트 항목 삭제 — 성공 시 새로고침. */
  deleteItem: (list: string, id: string) => Promise<void>;

  login: (password: string) => Promise<{ ok: boolean; error?: string }>;
  logout: () => Promise<void>;
}

const AdminContext = createContext<AdminContextValue | null>(null);

export function useAdmin() {
  const ctx = useContext(AdminContext);
  if (!ctx) throw new Error("useAdmin 은 <AdminProvider> 내부에서만 사용 가능합니다.");
  return ctx;
}

export function AdminProvider({ children }: { children: ReactNode }) {
  const [isAdmin, setIsAdmin] = useState(false);
  const [isEditMode, setEditModeState] = useState(false);
  const [pendingChanges, setPendingChanges] = useState<Map<string, string>>(() => new Map());
  const [isSaving, setIsSaving] = useState(false);
  const [lastError, setLastError] = useState<string | null>(null);

  // 마운트 시 현재 admin 상태 확인.
  useEffect(() => {
    let cancelled = false;
    fetch("/api/admin/status", { cache: "no-store" })
      .then((r) => r.json())
      .then((d: { isAdmin: boolean }) => {
        if (!cancelled) setIsAdmin(Boolean(d.isAdmin));
      })
      .catch(() => {
        if (!cancelled) setIsAdmin(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // 편집 모드를 <html data-edit="1"> 로 노출 — PortfolioClient(순수 DOM 스크립트)가
  // 편집 중에는 스냅 스크롤/모달 열기/스킬 hover 전환을 멈추도록 사용.
  const setEditMode = useCallback((v: boolean) => {
    setEditModeState(v);
    if (typeof document !== "undefined") {
      document.documentElement.dataset.edit = v ? "1" : "";
    }
  }, []);

  const registerChange = useCallback((field: string, value: string) => {
    setPendingChanges((prev) => {
      const next = new Map(prev);
      next.set(field, value);
      return next;
    });
  }, []);

  const cancelChanges = useCallback(() => {
    if (pendingChanges.size > 0 && !confirm("변경사항을 모두 취소하시겠어요? 입력한 내용은 사라집니다.")) {
      return;
    }
    setPendingChanges(new Map());
    setEditMode(false);
    setLastError(null);
    window.location.reload();
  }, [pendingChanges.size, setEditMode]);

  const saveChanges = useCallback(async () => {
    if (pendingChanges.size === 0) {
      setEditMode(false);
      return;
    }
    setIsSaving(true);
    setLastError(null);
    try {
      const changes = Array.from(pendingChanges, ([field, value]) => ({ field, value }));
      const res = await fetch("/api/content/update", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ changes }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) {
        throw new Error(data.error ?? `저장에 실패했습니다 (HTTP ${res.status}).`);
      }
      setPendingChanges(new Map());
      setEditMode(false);
      window.location.reload(); // 서버에서 새 데이터를 받아오기 위해 새로고침.
    } catch (err) {
      setLastError(err instanceof Error ? err.message : String(err));
    } finally {
      setIsSaving(false);
    }
  }, [pendingChanges, setEditMode]);

  const addItem = useCallback(async (list: string) => {
    try {
      const res = await fetch("/api/list", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ list, action: "add" }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) throw new Error(data.error ?? `HTTP ${res.status}`);
      window.location.reload();
    } catch (err) {
      setLastError(err instanceof Error ? err.message : String(err));
    }
  }, []);

  const deleteItem = useCallback(async (list: string, id: string) => {
    // 삭제는 항상 진행(가드/confirm 없음). 저장 안 된 텍스트 편집이 있으면 함께 폐기될 수 있음.
    try {
      const res = await fetch("/api/list", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ list, action: "delete", id }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) throw new Error(data.error ?? `HTTP ${res.status}`);
      window.location.reload();
    } catch (err) {
      setLastError(err instanceof Error ? err.message : String(err));
    }
  }, []);

  const login = useCallback(async (password: string): Promise<{ ok: boolean; error?: string }> => {
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.ok) {
        setIsAdmin(true);
        return { ok: true };
      }
      return { ok: false, error: data.error ?? "로그인 실패" };
    } catch (err) {
      return { ok: false, error: err instanceof Error ? err.message : String(err) };
    }
  }, []);

  const logout = useCallback(async () => {
    await fetch("/api/admin/logout", { method: "POST" }).catch(() => {});
    setIsAdmin(false);
    setEditMode(false);
    setPendingChanges(new Map());
    setLastError(null);
  }, [setEditMode]);

  return (
    <AdminContext.Provider
      value={{
        isAdmin,
        isEditMode,
        setEditMode,
        pendingChanges,
        registerChange,
        pendingCount: pendingChanges.size,
        saveChanges,
        cancelChanges,
        isSaving,
        lastError,
        addItem,
        deleteItem,
        login,
        logout,
      }}
    >
      {children}
    </AdminContext.Provider>
  );
}
