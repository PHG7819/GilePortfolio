"use client";
// 편집 모드일 때 이미지를 클릭하면 파일을 골라 Vercel Blob 에 업로드하고,
// 반환된 URL 을 pendingChanges 에 등록합니다(텍스트 편집과 동일하게 "저장" 시 DB 반영).
// 레이아웃을 깨지 않도록 래퍼 없이 <img> (또는 배경 div) 그대로 렌더링합니다.

import { useState, type CSSProperties } from "react";
import { useAdmin } from "./AdminProvider";

interface Props {
  k: string;
  value: string; // 현재 URL(또는 fallback 플레이스홀더)
  alt?: string;
  className?: string;
  /** true 면 <img> 대신 background-image 를 쓰는 div 로 렌더 (예: portrait). */
  bg?: boolean;
  /** bg 모드에서 이미지가 없을 때 표시할 라벨/자식. */
  bgLabel?: React.ReactNode;
  loading?: "lazy" | "eager";
}

export function EditableImage({ k, value, alt = "", className = "", bg = false, bgLabel, loading }: Props) {
  const { isEditMode, registerChange, pendingChanges } = useAdmin();
  const field = `content:${k}`;
  const current = pendingChanges.get(field) ?? value;
  const [uploading, setUploading] = useState(false);

  function pickFile() {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;
      if (file.size > 8 * 1024 * 1024) {
        alert("이미지는 8MB 이하만 가능합니다.");
        return;
      }
      setUploading(true);
      try {
        const fd = new FormData();
        fd.append("file", file);
        const res = await fetch("/api/upload", { method: "POST", body: fd });
        const data = await res.json().catch(() => ({}));
        if (!res.ok || !data.ok) throw new Error(data.error ?? `업로드 실패 (HTTP ${res.status})`);
        registerChange(field, data.url);
      } catch (err) {
        alert(err instanceof Error ? err.message : String(err));
      } finally {
        setUploading(false);
      }
    };
    input.click();
  }

  const onClickEdit = (e: React.MouseEvent) => {
    e.preventDefault(); // 링크(<a>)/카드 클릭으로 인한 이동·모달 방지
    e.stopPropagation();
    pickFile();
  };

  const editStyle: CSSProperties = isEditMode
    ? { cursor: "pointer", outline: "2px dashed #ffffff", outlineOffset: "-2px", opacity: uploading ? 0.5 : 1 }
    : {};

  if (bg) {
    const bgStyle: CSSProperties = current
      ? { background: `center/cover no-repeat url(${current})` }
      : {};
    return (
      <div
        className={className}
        style={{ ...bgStyle, ...editStyle }}
        title={isEditMode ? "클릭해서 이미지 변경" : undefined}
        onClick={isEditMode ? onClickEdit : undefined}
      >
        {current ? null : bgLabel}
      </div>
    );
  }

  return (
    <img
      src={current}
      alt={alt}
      className={className}
      loading={loading}
      title={isEditMode ? "클릭해서 이미지 변경" : undefined}
      onClick={isEditMode ? onClickEdit : undefined}
      style={editStyle}
    />
  );
}
