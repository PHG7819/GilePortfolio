"use client";
// 화면 왼쪽 세로 섹션 내비게이션. 클릭하면 해당 섹션으로 이동하고,
// 스크롤 위치에 따라 현재 섹션을 하이라이트합니다. (모바일에서는 숨김)
// 라벨은 헤더 메뉴와 같은 content 키(nav.*)를 사용해 편집 모드에서 직접 수정 가능.

import { useEffect, useRef } from "react";
import { EditableText } from "@/components/admin/EditableText";

export function SideNav({ items }: { items: { href: string; k: string; value: string }[] }) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const nav = ref.current;
    if (!nav) return;
    const links = Array.from(nav.querySelectorAll<HTMLAnchorElement>("a"));
    const sections = links
      .map((l) => document.querySelector<HTMLElement>(l.getAttribute("href")!))
      .filter(Boolean) as HTMLElement[];

    function onScroll() {
      if (!sections.length) return;
      let active = 0;
      sections.forEach((s, i) => {
        if (s.getBoundingClientRect().top <= 90) active = i;
      });
      links.forEach((l, i) => l.classList.toggle("is-active", i === active));
    }

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <nav className="side-nav" ref={ref} aria-label="Section navigation">
      {items.map((it) => (
        <a key={it.href} href={it.href}>
          <span className="side-nav-label">
            <EditableText k={it.k} value={it.value} inline />
          </span>
        </a>
      ))}
    </nav>
  );
}
