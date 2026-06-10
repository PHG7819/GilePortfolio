"use client";
// 편집 모드 ON 일 때 텍스트를 input/textarea 로 전환.
// 사용: <h2><EditableText k="about.title" value={c(map,"about.title","Your Name")} /></h2>
//   - k:     content key (저장 시 field="content:<k>")
//   - value: DB 값 또는 fallback 으로 미리 해석된 현재 표시값
//
// value 는 pendingChanges 에서 직접 읽는 derived state. 별도 useState 를 두면
// 한글 IME 조합이 끊기므로 두지 않습니다. (가이드 EditableText 와 동일한 패턴)

import { useAdmin } from "./AdminProvider";

interface Props {
  k: string;
  value: string;
  multiline?: boolean;
  inline?: boolean;
  className?: string;
  placeholder?: string;
}

/** 한글 등 비-ASCII 는 ASCII 의 약 2배 폭 — input size 계산용. */
function approxDisplayWidth(s: string): number {
  let w = 0;
  for (const ch of s) w += ch.charCodeAt(0) > 127 ? 2 : 1;
  return w;
}

export function EditableText({ k, value, multiline = false, inline = false, className = "", placeholder }: Props) {
  const { isEditMode, registerChange, pendingChanges } = useAdmin();
  const field = `content:${k}`;
  const current = pendingChanges.get(field) ?? value;

  if (!isEditMode) {
    return multiline ? <span style={{ whiteSpace: "pre-line" }}>{current}</span> : <>{current}</>;
  }

  const onChange = (v: string) => registerChange(field, v);
  // 입력칸이 <a>/카드 안에 있을 때 클릭이 링크 이동·모달로 새지 않도록 차단.
  const stop = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
  };

  if (multiline) {
    return (
      <textarea
        className={`edit-field ${className}`}
        value={current}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        onClick={stop}
        rows={Math.max(2, current.split("\n").length)}
        style={{ display: "block", width: "100%", resize: "vertical" }}
      />
    );
  }

  if (inline) {
    return (
      <input
        type="text"
        className={`edit-field ${className}`}
        value={current}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        onClick={stop}
        size={Math.max(approxDisplayWidth(current) + 2, 4)}
        style={{ display: "inline-block", maxWidth: "100%", verticalAlign: "baseline" }}
      />
    );
  }

  return (
    <input
      type="text"
      className={`edit-field ${className}`}
      value={current}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      onClick={stop}
      style={{ display: "block", width: "100%" }}
    />
  );
}
