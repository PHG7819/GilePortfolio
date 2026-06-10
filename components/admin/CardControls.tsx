"use client";
// 리스트(데모 카드/역량/러닝/스킬/경력 등) 항목 추가·삭제 버튼. 편집 모드에서만 보입니다.

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
  if (!isEditMode) return null;
  return (
    <button type="button" className="card-del-btn" onClick={() => deleteItem(list, id)}>
      {label}
    </button>
  );
}
