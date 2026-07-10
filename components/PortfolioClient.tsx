"use client";
// 포트폴리오의 모든 인터랙션(헤더 블러, 날짜/방문자, 스냅 스크롤, 영상 모달,
// 경력 팝업, 스킬 hover 전환)을 담당. 정적 HTML 의 <script> 를 그대로 옮긴 버전.
// 편집 모드(<html data-edit="1">)에서는 스냅 스크롤/모달 열기/스킬 전환을 멈춥니다.

import { useEffect } from "react";

// 다른 사이트와 겹치지 않게 본인 고유값으로 변경하세요.
const SITE_KEY = "gile-devlog-portfolio";

function isEditing() {
  return typeof document !== "undefined" && document.documentElement.dataset.edit === "1";
}

export function PortfolioClient() {
  useEffect(() => {
    const header = document.querySelector<HTMLElement>(".site-header");
    const dateEl = document.querySelector<HTMLElement>("#today-date");
    const reelShowcase = document.querySelector<HTMLElement>("#reel-showcase");
    if (!header || !reelShowcase) return;

    /* 헤더/모달 블러 동기화 */
    function syncHeaderState() {
      const isScrolled = window.scrollY > 12;
      header!.classList.toggle("is-scrolled", isScrolled);
      reelShowcase!.classList.toggle("is-scrolled", isScrolled);
    }

    /* 서울 기준 날짜 유틸 */
    function getSeoulParts() {
      const parts = new Intl.DateTimeFormat("ko-KR", {
        timeZone: "Asia/Seoul",
        year: "numeric", month: "2-digit", day: "2-digit", weekday: "long",
      }).formatToParts(new Date());
      const pick = (t: string) => parts.find((p) => p.type === t)?.value || "";
      return { year: pick("year"), month: pick("month"), day: pick("day"), weekday: pick("weekday") };
    }
    function getSeoulDateKey() {
      return new Intl.DateTimeFormat("en-CA", {
        timeZone: "Asia/Seoul", year: "numeric", month: "2-digit", day: "2-digit",
      }).format(new Date());
    }
    function syncDate() {
      if (!dateEl) return;
      const { year, month, day, weekday } = getSeoulParts();
      dateEl.textContent = `${year}년 ${month}월 ${day}일 ${weekday}`;
    }

    /* 오늘 방문자 — "Today 숫자" */
    async function syncVisitors() {
      const el = document.querySelector<HTMLElement>("#today-visitors");
      if (!el) return;
      const dateKey = getSeoulDateKey();
      const ns = `portfolio-${SITE_KEY}`;
      const key = `today-${dateKey}`;
      const base = "https://abacus.jasoncameron.dev";
      const storageKey = `visited-${dateKey}`;
      const already = localStorage.getItem(storageKey);
      try {
        let res = await fetch(`${base}/${already ? "get" : "hit"}/${ns}/${key}`);
        if (already && !res.ok) res = await fetch(`${base}/hit/${ns}/${key}`);
        const data = await res.json();
        if (!already) localStorage.setItem(storageKey, "1");
        el.textContent = `Today ${data.value ?? 0}`;
      } catch {
        el.textContent = "Today -";
      }
    }

    /* 네비게이션 활성 표시 */
    const navLinks = Array.from(document.querySelectorAll<HTMLAnchorElement>(".nav-links a[href^='#']"));
    const navSections = navLinks.map((l) => document.querySelector<HTMLElement>(l.getAttribute("href")!)).filter(Boolean) as HTMLElement[];
    function syncActiveNav() {
      if (!navLinks.length || !navSections.length) return;
      const current = navSections.reduce<{ id: string; distance: number } | null>((active, section) => {
        const distance = Math.abs(section.getBoundingClientRect().top - 96);
        if (!active || distance < active.distance) return { id: section.id, distance };
        return active;
      }, null);
      navLinks.forEach((link) => {
        link.classList.toggle("is-active", link.getAttribute("href") === `#${current?.id}`);
      });
    }

    /* 휠 스냅 스크롤 */
    const snapSections = ["#demo", "#projects", "#learning", "#about", "#skills"]
      .map((s) => document.querySelector<HTMLElement>(s)).filter(Boolean) as HTMLElement[];
    let targetSnapIndex: number | null = null;
    const wheelStepSize = 72;
    const maxStepPerWheel = 2;
    let wheelBuffer = 0;
    let frameId = 0;

    function getCurrentSnapIndex() {
      return snapSections.reduce<{ index: number; distance: number } | null>((active, section, index) => {
        const distance = Math.abs(section.getBoundingClientRect().top - 72);
        if (!active || distance < active.distance) return { index, distance };
        return active;
      }, null)?.index ?? 0;
    }
    function animateScrollTo(targetTop: number, duration = 140) {
      if (frameId) cancelAnimationFrame(frameId);
      const startTop = window.scrollY;
      const distance = targetTop - startTop;
      const startTime = performance.now();
      const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);
      function step(now: number) {
        const progress = Math.min((now - startTime) / duration, 1);
        window.scrollTo(0, startTop + distance * easeOutCubic(progress));
        if (progress < 1) frameId = requestAnimationFrame(step);
      }
      frameId = requestAnimationFrame(step);
    }
    // 섹션의 콘텐츠(.wrap)를 "헤더 아래 가시 영역"의 정중앙에 오게 하는 스크롤 위치를 계산.
    // CSS 중앙정렬에 의존하지 않고 실제 렌더 높이를 측정하므로, 콘텐츠가 어떤 높이든 항상 정중앙.
    function centerScrollTop(section: HTMLElement) {
      const wrap = section.querySelector<HTMLElement>(".wrap") ?? section;
      const headerHeight = header!.offsetHeight || 64;
      const rect = wrap.getBoundingClientRect();
      const wrapTopDoc = rect.top + window.scrollY;
      const avail = window.innerHeight - headerHeight;
      const desiredViewportTop = headerHeight + Math.max(0, (avail - rect.height) / 2);
      return Math.max(0, Math.round(wrapTopDoc - desiredViewportTop));
    }
    function scrollToSnapSection(index: number) {
      targetSnapIndex = Math.max(0, Math.min(index, snapSections.length - 1));
      const target = snapSections[targetSnapIndex];
      if (!target) return;
      animateScrollTo(centerScrollTop(target));
      window.setTimeout(() => { targetSnapIndex = null; syncActiveNav(); }, 160);
    }
    function onWheel(event: WheelEvent) {
      if (isEditing()) return; // 편집 중엔 일반 스크롤 허용
      if (!snapSections.length) return;
      if ((event.target as Element)?.closest(".reel-showcase, .career-showcase")) return;
      if (Math.abs(event.deltaY) < 10) { event.preventDefault(); return; }
      wheelBuffer += event.deltaY;
      const rawSteps = Math.trunc(wheelBuffer / wheelStepSize);
      const clampedSteps = Math.max(-maxStepPerWheel, Math.min(maxStepPerWheel, rawSteps));
      if (clampedSteps === 0) { event.preventDefault(); return; }
      wheelBuffer = 0;
      const currentIndex = targetSnapIndex ?? getCurrentSnapIndex();
      const nextIndex = currentIndex + clampedSteps;
      if (nextIndex < 0 || nextIndex >= snapSections.length) return;
      event.preventDefault();
      scrollToSnapSection(nextIndex);
    }

    /* 영상 모달 */
    const reelFrame = document.querySelector<HTMLElement>("#reel-panel-frame");
    const reelTitle = document.querySelector<HTMLElement>("#reel-panel-title");
    const reelTags = document.querySelector<HTMLElement>("#reel-panel-tags");
    const reelDescription = document.querySelector<HTMLElement>("#reel-panel-description");
    const reelClose = document.querySelector<HTMLElement>(".reel-close");
    const reelEscapeButton = document.querySelector<HTMLElement>(".reel-escape-button");

    function openReel(card: HTMLElement) {
      if (isEditing()) return; // 편집 중엔 모달 열지 않음
      if (!reelFrame || !reelTitle || !reelTags || !reelDescription) return;
      const imgSrc = card.dataset.img;
      reelTitle.textContent = card.dataset.title || "";
      reelTags.innerHTML = "";
      const fallbackTags = card.querySelector(".card-tags")?.textContent || "";
      (card.dataset.tags || fallbackTags).split(",").map((t) => t.trim()).filter(Boolean).forEach((tag) => {
        const el = document.createElement("span");
        el.textContent = tag;
        reelTags.appendChild(el);
      });
      reelDescription.textContent = card.dataset.description || "";
      if (card.dataset.link) {
        const link = document.createElement("a");
        link.href = card.dataset.link;
        link.target = "_blank";
        link.rel = "noopener noreferrer";
        link.textContent = card.dataset.link;
        reelDescription.appendChild(document.createTextNode("\n참고 링크: "));
        reelDescription.appendChild(link);
      }
      reelFrame.innerHTML = `<img src="${imgSrc || ""}" alt="${card.dataset.title || "Work highlight"}" />`;
      reelShowcase!.classList.remove("is-closing");
      reelShowcase!.classList.add("is-open");
      reelShowcase!.setAttribute("aria-hidden", "false");
      document.body.style.overflow = "hidden";
      reelClose?.focus();
    }
    function closeReel() {
      if (!reelShowcase!.classList.contains("is-open")) return;
      reelShowcase!.classList.remove("is-open");
      reelShowcase!.classList.add("is-closing");
      reelShowcase!.setAttribute("aria-hidden", "true");
      document.body.style.overflow = "";
    }
    function onReelAnimEnd() {
      if (reelShowcase!.classList.contains("is-closing")) {
        reelShowcase!.classList.remove("is-closing");
        if (reelFrame) reelFrame.innerHTML = "";
      }
    }
    function onReelBackdrop(event: MouseEvent) {
      if (event.target === reelShowcase) closeReel();
    }

    const cards = Array.from(document.querySelectorAll<HTMLElement>(".video-card[data-img]"));
    const cardClick = (card: HTMLElement) => () => openReel(card);
    const cardKey = (card: HTMLElement) => (event: KeyboardEvent) => {
      if (event.key === "Enter" || event.key === " ") { event.preventDefault(); openReel(card); }
    };
    const cardHandlers = cards.map((card) => {
      const ch = cardClick(card);
      const kh = cardKey(card);
      card.addEventListener("click", ch);
      card.addEventListener("keydown", kh as EventListener);
      return { card, ch, kh };
    });

    /* Highlight 편집 팝업 — 편집 모드에서 카드 클릭 시 오버레이로 열기 */
    const highlightPanels = Array.from(document.querySelectorAll<HTMLElement>(".highlight-panel[data-edit-target]"));
    const highlightEditModals = Array.from(document.querySelectorAll<HTMLElement>(".highlight-edit-modal"));
    function openHighlightEdit(panel: HTMLElement) {
      const id = panel.dataset.editTarget;
      const modal = id ? document.getElementById(id) : null;
      if (!modal) return;
      modal.classList.add("is-open");
      modal.setAttribute("aria-hidden", "false");
      document.body.style.overflow = "hidden";
      modal.querySelector<HTMLElement>(".highlight-edit-close")?.focus();
    }
    function closeHighlightEdit(modal: HTMLElement) {
      modal.classList.remove("is-open");
      modal.setAttribute("aria-hidden", "true");
      document.body.style.overflow = "";
    }
    function closeAllHighlightEdit() {
      highlightEditModals.forEach((m) => { if (m.classList.contains("is-open")) closeHighlightEdit(m); });
    }
    const highlightPanelHandlers = highlightPanels.map((panel) => {
      const onClick = (event: MouseEvent) => {
        if (!isEditing()) return; // 일반 모드는 기존 상세 모달(openReel) 유지
        event.preventDefault();
        event.stopPropagation();
        openHighlightEdit(panel);
      };
      const onKey = (event: KeyboardEvent) => {
        if (!isEditing()) return;
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          event.stopPropagation();
          openHighlightEdit(panel);
        }
      };
      panel.addEventListener("click", onClick);
      panel.addEventListener("keydown", onKey as EventListener);
      return { panel, onClick, onKey };
    });
    const highlightModalHandlers = highlightEditModals.map((modal) => {
      const closeBtn = modal.querySelector<HTMLElement>(".highlight-edit-close");
      const onClose = () => closeHighlightEdit(modal);
      const onBackdrop = (event: MouseEvent) => { if (event.target === modal) closeHighlightEdit(modal); };
      closeBtn?.addEventListener("click", onClose);
      modal.addEventListener("click", onBackdrop);
      return { modal, closeBtn, onClose, onBackdrop };
    });

    /* 경력 팝업 */
    const careerShowcase = document.querySelector<HTMLElement>("#career-showcase");
    const careerTrigger = document.querySelector<HTMLElement>(".career-trigger");
    const careerClose = careerShowcase?.querySelector<HTMLElement>(".career-close") ?? null;
    function openCareer() {
      if (!careerShowcase) return;
      careerShowcase.style.display = "flex";
      careerShowcase.classList.remove("is-closing");
      careerShowcase.classList.add("is-open");
      careerShowcase.setAttribute("aria-hidden", "false");
      document.body.style.overflow = "hidden";
      careerClose?.focus();
    }
    function closeCareer() {
      if (!careerShowcase || !careerShowcase.classList.contains("is-open")) return;
      careerShowcase.classList.remove("is-open");
      careerShowcase.classList.add("is-closing");
      careerShowcase.setAttribute("aria-hidden", "true");
      document.body.style.overflow = "";
    }
    function onCareerAnimEnd() {
      if (careerShowcase && careerShowcase.classList.contains("is-closing")) {
        careerShowcase.classList.remove("is-closing");
        careerShowcase.style.display = "none";
      }
    }

    /* 스킬 카드 hover 시 한국어 ↔ 영문 전환 */
    const skillCards = Array.from(document.querySelectorAll<HTMLElement>(".skill-card"));
    const skillHandlers = skillCards.map((card) => {
      const title = card.querySelector("h3");
      const body = card.querySelector("p");
      const originalTitle = title?.textContent ?? "";
      const originalBody = body?.textContent ?? "";
      const showKorean = () => {
        if (isEditing() || !title || !body) return;
        title.textContent = card.dataset.koTitle || originalTitle;
        body.textContent = card.dataset.koText || originalBody;
      };
      const showEnglish = () => {
        if (isEditing() || !title || !body) return;
        title.textContent = originalTitle;
        body.textContent = originalBody;
      };
      card.addEventListener("mouseenter", showKorean);
      card.addEventListener("focusin", showKorean);
      card.addEventListener("mouseleave", showEnglish);
      card.addEventListener("focusout", showEnglish);
      return { card, showKorean, showEnglish };
    });

    /* 전역 키/스크롤 핸들러 */
    function onKeydown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        if (reelShowcase!.classList.contains("is-open")) closeReel();
        if (careerShowcase?.classList.contains("is-open")) closeCareer();
        closeAllHighlightEdit();
      }
    }

    /* 네비(헤더/사이드) 클릭도 기본 앵커 점프 대신 콘텐츠를 화면 중앙에 맞춰 이동 */
    const navAnchors = Array.from(
      document.querySelectorAll<HTMLAnchorElement>(".nav-links a[href^='#'], .side-nav a[href^='#']")
    );
    const navAnchorHandlers = navAnchors.map((a) => {
      const onClick = (event: MouseEvent) => {
        if (isEditing()) return;
        const id = a.getAttribute("href");
        if (!id || id === "#top" || id.length < 2) return;
        const section = document.querySelector<HTMLElement>(id);
        if (!section) return;
        event.preventDefault();
        animateScrollTo(centerScrollTop(section));
        window.setTimeout(syncActiveNav, 180);
      };
      a.addEventListener("click", onClick);
      return { a, onClick };
    });

    // 초기 실행 + 리스너 등록
    syncHeaderState();
    syncDate();
    syncVisitors();
    syncActiveNav();
    // 첫 진입 섹션도 폰트/레이아웃 안정화 후 정중앙으로 맞춤
    const initialCenter = window.setTimeout(() => {
      if (isEditing()) return;
      const hash = window.location.hash;
      const section = (hash && hash.length > 1 ? document.querySelector<HTMLElement>(hash) : null) ?? snapSections[0];
      if (section) window.scrollTo(0, centerScrollTop(section));
    }, 180);
    const dateTimer = window.setInterval(syncDate, 60 * 1000);
    window.addEventListener("scroll", syncHeaderState, { passive: true });
    window.addEventListener("scroll", syncActiveNav, { passive: true });
    window.addEventListener("wheel", onWheel, { passive: false });
    window.addEventListener("keydown", onKeydown);
    reelShowcase.addEventListener("animationend", onReelAnimEnd);
    reelShowcase.addEventListener("click", onReelBackdrop);
    reelClose?.addEventListener("click", closeReel);
    reelEscapeButton?.addEventListener("click", closeReel);
    careerTrigger?.addEventListener("click", openCareer);
    careerClose?.addEventListener("click", closeCareer);
    careerShowcase?.addEventListener("animationend", onCareerAnimEnd);

    return () => {
      window.clearInterval(dateTimer);
      window.clearTimeout(initialCenter);
      navAnchorHandlers.forEach(({ a, onClick }) => a.removeEventListener("click", onClick));
      if (frameId) cancelAnimationFrame(frameId);
      window.removeEventListener("scroll", syncHeaderState);
      window.removeEventListener("scroll", syncActiveNav);
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("keydown", onKeydown);
      reelShowcase.removeEventListener("animationend", onReelAnimEnd);
      reelShowcase.removeEventListener("click", onReelBackdrop);
      reelClose?.removeEventListener("click", closeReel);
      reelEscapeButton?.removeEventListener("click", closeReel);
      careerTrigger?.removeEventListener("click", openCareer);
      careerClose?.removeEventListener("click", closeCareer);
      careerShowcase?.removeEventListener("animationend", onCareerAnimEnd);
      cardHandlers.forEach(({ card, ch, kh }) => {
        card.removeEventListener("click", ch);
        card.removeEventListener("keydown", kh as EventListener);
      });
      highlightPanelHandlers.forEach(({ panel, onClick, onKey }) => {
        panel.removeEventListener("click", onClick);
        panel.removeEventListener("keydown", onKey as EventListener);
      });
      highlightModalHandlers.forEach(({ modal, closeBtn, onClose, onBackdrop }) => {
        closeBtn?.removeEventListener("click", onClose);
        modal.removeEventListener("click", onBackdrop);
      });
      skillHandlers.forEach(({ card, showKorean, showEnglish }) => {
        card.removeEventListener("mouseenter", showKorean);
        card.removeEventListener("focusin", showKorean);
        card.removeEventListener("mouseleave", showEnglish);
        card.removeEventListener("focusout", showEnglish);
      });
    };
  }, []);

  return null;
}
