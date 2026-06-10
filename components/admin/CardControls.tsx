"use client";
// 리스트(데모 카드/역량/러닝/스킬/경력 등) 항목 추가·삭제 버튼. 편집 모드에서만 보입니다.

import { useState } from "react";
import { useAdmin } from "./AdminProvider";

export function AddItemButton({ list, label }: { list: string; label: string }) {
  const { isEditMode, addItem } = useAdmin();
  if (!isEditMode) return null;
  return (
    <div className="add-card-row">
      <button type="button" className="add-card-btn" onClick={() => addItem(list)}>
        {label}
      </button>
    </div>
  );
}

export function DeleteItemButton({ list, id, label = "이 항목 삭제" }: { list: string; id: string; label?: string }) {
  const { isEditMode, deleteItem } = useAdmin();
  const [armed, setArmed] = useState(false);
  if (!isEditMode) return null;
  // 한 번 누르면 "정말 삭제?"로 바뀌고, 한 번 더 누르면 실제 삭제 (실수 방지, 브라우저 확인창 미사용)
  return (
    <button
      type="button"
      className={`card-del-btn${armed ? " is-armed" : ""}`}
      onClick={() => (armed ? deleteItem(list, id) : setArmed(true))}
      onMouseLeave={() => setArmed(false)}
    >
      {armed ? "정말 삭제? (한 번 더 클릭)" : label}
    </button>
  );
}
