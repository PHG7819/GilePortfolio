import { unstable_noStore as noStore } from "next/cache";
import { getContentMap, type ContentMap } from "@/lib/content";
import { EditableText } from "@/components/admin/EditableText";
import { EditableImage } from "@/components/admin/EditableImage";
import { AdminBar } from "@/components/admin/AdminBar";
import { AddItemButton, DeleteItemButton } from "@/components/admin/CardControls";
import { PortfolioClient } from "@/components/PortfolioClient";
import { SideNav } from "@/components/SideNav";

// DB 값이 매 요청마다 반영되도록 정적 캐시 비활성화.
export const dynamic = "force-dynamic";

function c(map: ContentMap, key: string, fallback: string) {
  return map[key] ?? fallback;
}

// "<list>.order" (JSON 배열) 을 읽어 항목 순서를 돌려준다. 없으면 기본값.
function readOrder(map: ContentMap, list: string, def: string[]): string[] {
  try {
    const parsed = JSON.parse(map[`${list}.order`] ?? "");
    if (Array.isArray(parsed)) {
      const arr = parsed.map((x) => String(x)).filter((s) => s.length > 0 && s !== "null" && s !== "undefined");
      if (arr.length) return arr;
    }
  } catch {
    /* fallthrough */
  }
  return def;
}

// ── 플레이스홀더 이미지(data URI) ─────────────────────────
const IMG_WIDE =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='640' height='300'%3E%3Crect width='100%25' height='100%25' fill='%23c2c5ca'/%3E%3Ctext x='50%25' y='50%25' fill='%237b8290' font-family='sans-serif' font-size='22' text-anchor='middle' dominant-baseline='middle'%3EPROJECT IMAGE%3C/text%3E%3C/svg%3E";
const IMG_SQ =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='160'%3E%3Crect width='100%25' height='100%25' fill='%23cacdd2'/%3E%3C/svg%3E";
const IMG_FEAT =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='52' height='52'%3E%3Crect width='100%25' height='100%25' rx='12' fill='%237d8997'/%3E%3C/svg%3E";
const IMG_LEARN =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='225'%3E%3Crect width='100%25' height='100%25' fill='%23c2c5ca'/%3E%3C/svg%3E";
const IMG_C3 =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='540' height='300'%3E%3Crect width='100%25' height='100%25' fill='%23a9adb3'/%3E%3C/svg%3E";
const IMG_C4 =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='240'%3E%3Crect width='100%25' height='100%25' fill='%23a9adb3'/%3E%3C/svg%3E";
const IMG_NOTIONCARD =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='382' height='215'%3E%3Crect width='100%25' height='100%25' fill='%231a2740'/%3E%3C/svg%3E";
const IMG_NBADGE =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='52' height='52'%3E%3Crect width='100%25' height='100%25' rx='10' fill='%23ffffff'/%3E%3Ctext x='50%25' y='54%25' fill='%23111' font-family='sans-serif' font-size='30' font-weight='700' text-anchor='middle' dominant-baseline='middle'%3EN%3C/text%3E%3C/svg%3E";
const soc = (label: string) =>
  `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='40'%3E%3Crect width='40' height='40' rx='11' fill='%23b8c1ce'/%3E%3Ctext x='50%25' y='55%25' fill='%23151b28' font-family='sans-serif' font-size='14' font-weight='700' text-anchor='middle' dominant-baseline='middle'%3E${label}%3C/text%3E%3C/svg%3E`;

export default async function Page() {
  noStore(); // 모든 캐싱 비활성화 — 항상 최신 DB 반영
  const map = await getContentMap();

  // Work Highlights — PM 을 중심으로 펼쳐지는 단일 허브형 도식.
  // Jira 고도화/AI 자동화는 별도 섹션에서 다루기 위해 Highlights 에서는 제외한다.
  const highlightItems = [
    {
      id: "milestone",
      key: "1",
      className: "is-milestone",
      label: "마일스톤",
      eyebrow: "Cycle",
      img: "/diagrams/01-milestone-cycle.svg",
      title: c(map, "demo.card.1.title", "마일스톤 개발 사이클"),
      tags: c(map, "demo.card.1.tags", "일정관리,WBS,프로세스"),
      desc: c(map, "demo.card.1.desc", "마일스톤 시작부터 코드 마감(D-14)·폴리싱/QA·최종 마감까지, 최종 마감에서 역산해 일정을 설계합니다.\n각 단계에서 PM이 챙기는 로드맵·공지·이슈 트래킹을 정리했습니다."),
    },
    {
      id: "codefreeze",
      key: "4",
      className: "is-codefreeze",
      label: "코드 마감",
      eyebrow: "D-day",
      img: "/diagrams/02-codefreeze-timeline.svg",
      title: c(map, "demo.card.4.title", "코드 마감 D-day 오퍼레이션"),
      tags: c(map, "demo.card.4.tags", "빌드,마감,TeamCity"),
      desc: c(map, "demo.card.4.desc", "D-1 스트림 분리·빌드 세팅, D-day 코드 마감, D+1 풀 머지·빌드 발행·QA BVT로 이어지는 마감 타임라인.\nTeamCity로 데일리·마감·테스트·핫픽스 빌드를 발행·버전 관리합니다."),
    },
    {
      id: "communication",
      key: "5",
      className: "is-communication",
      label: "커뮤니케이션",
      eyebrow: "Hub",
      img: "/diagrams/03-collab-hub.svg",
      title: c(map, "demo.card.5.title", "PM 중심 크로스팀 커뮤니케이션"),
      tags: c(map, "demo.card.5.tags", "커뮤니케이션,Slack,Jira"),
      desc: c(map, "demo.card.5.desc", "기획·프로그램·아트·QA·퍼블리셔 사이의 논의를 Slack 채널과 Jira로 일원화하고, 개발 중 발생하는 이슈를 시작~종결까지 추적·전파합니다."),
    },
    {
      id: "quality",
      key: "6",
      className: "is-quality",
      label: "품질 게이트",
      eyebrow: "QA",
      img: "/diagrams/04-qa-gate.svg",
      title: c(map, "demo.card.6.title", "품질 게이트 & 버그 관리"),
      tags: c(map, "demo.card.6.tags", "QA,품질,버그"),
      desc: c(map, "demo.card.6.desc", "구현 확인 → 단위 QA → BVT → 릴리즈로 이어지는 품질 게이트.\n버그는 빌드 리비전별 에픽으로 분류해 머지·수정 현황을 관리합니다."),
    },
  ];

  // 다른 반복 섹션들의 순서 목록
  const featOrder = readOrder(map, "projects.feats", ["1", "2", "3", "4"]);
  const learnOrder = readOrder(map, "learning.cards", ["1", "2", "3", "4"]);
  const skillOrder = readOrder(map, "skills.cards", ["1", "2", "3", "4"]);
  const miniOrder = readOrder(map, "career.minis", ["1", "2", "3", "4"]);
  // 신입 — 이전 회사 항목 없음(기본 비노출). 필요 시 편집 UI의 '+ 경력 항목 추가'로 생성.
  const entryOrder = readOrder(map, "career.entries", []);
  const miniTitles = ["Education", "Certifications", "Tools", "Etc."];
  const entryDefaults: Record<string, { period: string; company: string; title: string; summary: string }> = {
    r2: { period: "2017.04 - 2022.01", company: "이전 회사명", title: "이전 직무 제목", summary: "담당 업무 요약을 적으세요.\n- 핵심 기여 내용 1\n- 핵심 기여 내용 2" },
  };

  // 내비게이션 라벨 (헤더·왼쪽 사이드바·푸터가 공유)
  const navDemo = c(map, "nav.demo", "Highlights");
  const navProjects = c(map, "nav.projects", "Projects");
  const navLearning = c(map, "nav.learning", "Learning");
  const navAbout = c(map, "nav.about", "About");
  const navSkills = c(map, "nav.skills", "Skills");

  return (
    <>
      <SideNav
        items={[
          { href: "#demo", k: "nav.demo", value: navDemo },
          { href: "#projects", k: "nav.projects", value: navProjects },
          { href: "#learning", k: "nav.learning", value: navLearning },
          { href: "#about", k: "nav.about", value: navAbout },
          { href: "#skills", k: "nav.skills", value: navSkills },
        ]}
      />
      <header className="site-header">
        <div className="nav-wrap">
          <div className="nav-left">
            <a className="logo" href="#top" aria-label="gile.devlog">
              <img className="logo-mark" src="/tistory-logo.png" alt="" />
              <span className="logo-text">gile.devlog</span>
            </a>
            <nav className="nav-links" aria-label="Main navigation">
              <a href="#demo"><EditableText k="nav.demo" value={navDemo} inline /></a>
              <a href="#projects"><EditableText k="nav.projects" value={navProjects} inline /></a>
              <a href="#learning"><EditableText k="nav.learning" value={navLearning} inline /></a>
              <a href="#about"><EditableText k="nav.about" value={navAbout} inline /></a>
              <a href="#skills"><EditableText k="nav.skills" value={navSkills} inline /></a>
            </nav>
          </div>
          <div className="header-meta">
            <span className="date-pill" id="today-date" />
            <span className="date-pill visitor-pill" id="today-visitors" title="오늘 방문자 수 (서울 자정 기준 초기화)">Today --</span>
            <AdminBar />
          </div>
        </div>
      </header>

      <main id="top">
        {/* 영상 모달 */}
        <section className="reel-showcase" id="reel-showcase" aria-hidden="true">
          <div className="reel-panel">
            <button className="reel-close" type="button" aria-label="닫기">×</button>
            <div className="reel-panel-frame" id="reel-panel-frame" />
            <div className="reel-panel-copy">
              <h3 id="reel-panel-title" />
              <div className="reel-tags" id="reel-panel-tags" aria-label="Tags" />
              <p id="reel-panel-description" />
              <button className="reel-escape-button" type="button"><span className="btn-label">ESC 눌러 닫기</span></button>
            </div>
          </div>
        </section>

        {/* Demo Reel */}
        <section id="demo" className="dark-section">
          <div className="wrap">
            <p className="section-kicker"><EditableText k="demo.kicker" value={c(map, "demo.kicker", "Work Highlights")} inline /></p>
            <h1><EditableText k="demo.title" value={c(map, "demo.title", "프로세스 & 성과 하이라이트")} inline /></h1>
            <div className="highlight-map" aria-label="PM 업무 프로세스 하이라이트">
              <div className="highlight-orbit" aria-hidden="true" />
              <div className="highlight-axis highlight-axis--vertical" aria-hidden="true" />
              <div className="highlight-axis highlight-axis--horizontal" aria-hidden="true" />
              <div className="highlight-core">
                <span>PM</span>
                <strong>Process Hub</strong>
              </div>
              {highlightItems.map((item) => (
                <article
                  key={item.id}
                  className={`highlight-node video-card is-featured ${item.className}`}
                  tabIndex={0}
                  role="button"
                  data-img={item.img}
                  data-title={item.title}
                  data-tags={item.tags}
                  data-description={item.desc}
                >
                  <span className="highlight-node-eyebrow">{item.eyebrow}</span>
                  <strong>{item.label}</strong>
                  <span className="highlight-node-hint">Click to expand</span>
                  <div className="card-tags">
                    {item.tags.split(",").map((t, i) => (
                      <span key={i}>{t.trim()}</span>
                    ))}
                  </div>
                  <div className="card-edit-fields">
                    <label>팝업 제목</label>
                    <EditableText k={`demo.card.${item.key}.title`} value={item.title} inline />
                    <label>태그 (콤마로 구분)</label>
                    <EditableText k={`demo.card.${item.key}.tags`} value={item.tags} inline />
                    <label>설명 (모달에 표시)</label>
                    <EditableText k={`demo.card.${item.key}.desc`} value={item.desc} multiline />
                  </div>
                </article>
              ))}
            </div>
            <div className="center-action"><a className="button no-arrow" href="#projects"><span className="btn-label"><EditableText k="demo.cta" value={c(map, "demo.cta", "프로젝트 자세히 보기")} inline /></span></a></div>
          </div>
        </section>

        {/* Projects */}
        <section id="projects" className="paper-section">
          <div className="wrap">
            <p className="section-kicker"><EditableText k="projects.kicker" value={c(map, "projects.kicker", "Projects")} inline /></p>
            <h2><EditableText k="projects.title" value={c(map, "projects.title", "주요 프로젝트")} inline /></h2>
            <div className="project-layout">
              <div className="project-collage">
                <EditableImage k="project.img.wide" value={c(map, "project.img.wide", IMG_WIDE)} className="wide" alt="프로젝트 대표 이미지" />
                <EditableImage k="project.img.1" value={c(map, "project.img.1", IMG_SQ)} alt="" />
                <EditableImage k="project.img.2" value={c(map, "project.img.2", IMG_SQ)} alt="" />
                <EditableImage k="project.img.3" value={c(map, "project.img.3", IMG_SQ)} alt="" />
                <EditableImage k="project.img.4" value={c(map, "project.img.4", IMG_SQ)} alt="" />
              </div>
              <div className="project-copy">
                <p><EditableText k="projects.intro" value={c(map, "projects.intro", "매드엔진 프론티어 스튜디오에서 개발 중인 나이트크로우 후속작 '나이트크로우W' MMORPG의 개발 PM으로, 프로젝트 상황에 맞춘 마일스톤 전반의 일정·커뮤니케이션·빌드 마감을 담당합니다. 스튜디오의 개발 커뮤니케이션 허브 역할을 맡으면서, 반복 업무를 데이터·AI 기반 도구로 자동화하고 스튜디오 안팎을 잇는 문서를 제작·배포해 왔습니다.")} multiline /></p>
                {featOrder.map((id, idx) => (
                  <div className="feature-item" key={id}>
                    <EditableImage k={`projects.feat${id}.icon`} value={c(map, `projects.feat${id}.icon`, IMG_FEAT)} className="feature-icon" alt="" />
                    <div>
                      <h3><EditableText k={`projects.feat${id}.title`} value={c(map, `projects.feat${id}.title`, ["스튜디오 개발 커뮤니케이션", "데이터 기반 현황 관리 · Jira 고도화", "AI 활용 업무 자동화 툴 개발", "빌드 발행 & 문서 제작·배포"][idx] ?? `역량 ${idx + 1}`)} inline /></h3>
                      <p><EditableText k={`projects.feat${id}.desc`} value={c(map, `projects.feat${id}.desc`, [
                        "마일스톤·일정 관리와 직군 간 조율을 담당하고, 개발 중 발생하는 버그·QA·일정 이슈를 시작부터 종결까지 추적·전파합니다. 빌드 테스트 가이드도 배포합니다.",
                        "엑셀 대시보드를 Jira Cloud 네이티브로 이관하고 JQL 저장 필터·오토메이션으로 지라 사용을 고도화했습니다. 지라 상태 현황 문서와 일괄 연결 스크립트로 현황을 관리합니다.",
                        "스튜디오 전용 AI 에이전트를 직접 개발했습니다. 회의록 에이전트(로컬 faster-whisper STT + 기획서 대조)로 개발 리뷰 회의록 정리 2~3시간→20분, 퍼포스 서밋 추출 기반 주간보고 자동화(7개 서브에이전트 오케스트레이션)로 2시간→20분 단축. 지라 다중 릴레이트 자동화, 마일스톤 빌드 플레이 테스트 웹 가이드(HTML)도 제작·배포.",
                        "TeamCity로 데일리·마감·테스트·핫픽스 빌드를 발행·버전 관리하고, 플레이 가이드·AION2 라이브 요약본·퍼블리셔 피칭덱 등 안팎을 잇는 문서를 제작·배포합니다.",
                      ][idx] ?? "이 역량에 대한 짧은 설명을 적으세요.")} multiline /></p>
                      <DeleteItemButton list="projects.feats" id={id} label="역량 삭제" />
                    </div>
                  </div>
                ))}
                <AddItemButton list="projects.feats" label="+ 역량 추가" />
                <button className="button career-trigger" type="button"><span className="btn-label"><EditableText k="projects.careerBtn" value={c(map, "projects.careerBtn", "경력 기술서 보기")} inline /></span></button>
              </div>
            </div>
          </div>
        </section>

        {/* Learning */}
        <section id="learning" className="green-section">
          <div className="wrap">
            <div className="learning-head">
              <div className="learning-title">
                <p className="section-kicker"><EditableText k="learning.kicker" value={c(map, "learning.kicker", "Learning")} inline /></p>
                <h2><EditableText k="learning.title" value={c(map, "learning.title", "공부하고, 만들고, 기록한 것들")} inline /></h2>
              </div>
            </div>
            <div className="learning-grid">
              {learnOrder.map((id, idx) => (
                <article className="learning-card" key={id}>
                  <div className="learning-image-frame">
                    <EditableImage k={`learning.card${id}.img`} value={c(map, `learning.card${id}.img`, IMG_LEARN)} className="learning-image" alt="" />
                  </div>
                  <p><EditableText k={`learning.card${id}.desc`} value={c(map, `learning.card${id}.desc`, [
                    "신입 개발 PM으로 입사해 겪은 첫 도전과 배움을 기록한 회고. 직무를 어떻게 이해하고 적응해 갔는지 정리했습니다.",
                    "Perforce 스트림(브랜치)의 개념과, 코드 마감·빌드 안정성을 위해 스트림을 어떻게 분리·운용하는지 정리한 업무 일지.",
                    "AI 에이전트가 실수를 반복하지 않도록 '환경 자체를 설계'하는 하네스 엔지니어링 개념을 정리해 웹으로 배포한 학습 자료.",
                    "게임 개발 빌드 프로세스(D-14~D+7)를 6단계 타임라인·체크리스트·템플릿으로 정리해 배포한 스튜디오 실무 가이드 웹.",
                  ][idx] ?? "학습/연구 주제에 대한 요약을 적으세요.")} multiline /></p>
                  <strong><EditableText k={`learning.card${id}.title`} value={c(map, `learning.card${id}.title`, ["[회고] 쌩신입 개발 PM 도전기 : 넥토리얼", "[업무 일지] 스트림(브랜치)의 개념과 전략", "하네스 엔지니어링 (Harness Engineering)", "빌드 과정 실무 가이드 (Web)"][idx] ?? `연구 주제 0${idx + 1}`)} inline /></strong>
                  <a className="button" href={c(map, `learning.card${id}.link`, ["https://imgile.tistory.com/1", "https://imgile.tistory.com/5", "https://harness-engineering-ashy.vercel.app", "https://build-guide-txiz.vercel.app"][idx] ?? "#")} target="_blank" rel="noopener noreferrer"><span className="btn-label">Read More</span></a>
                  <DeleteItemButton list="learning.cards" id={id} label="이 카드 삭제" />
                </article>
              ))}
            </div>
            <AddItemButton list="learning.cards" label="+ 러닝 카드 추가" />
          </div>
        </section>

        {/* About */}
        <section id="about" className="dark-section">
          <div className="wrap profile">
            <div className="profile-head">
              <p className="section-kicker"><EditableText k="about.kicker" value={c(map, "about.kicker", "About")} inline /></p>
              <h2><EditableText k="about.title" value={c(map, "about.title", "박한길")} inline /></h2>
            </div>
            <div className="profile-copy">
              {[1, 2, 3, 4, 5, 6].map((i) => {
                const fallback = [
                  "게임 개발 현장에서 기획·프로그램·아트·QA를 하나의 흐름으로 연결하는 개발 PM 박한길입니다.",
                  "PM의 일을 다섯 가지로 정의합니다 — 놓친 업무를 다시 짚는 상기(Reminding), 빠른 최선의 결정을 돕는 결정 지원(Decision Making), 히스토리를 밀도 있게 전하는 공유(Messaging), 병목을 푸는 분배(Load Balancing), 변수를 줄이는 문서화(Documentation).",
                  "특히 반복되는 수작업을 도구로 바꾸는 데 관심이 많습니다. 스튜디오 전용 AI 회의록 에이전트로 개발 리뷰 회의록 정리를 2~3시간에서 20분으로, 퍼포스 서밋 기반 주간보고 자동화로 작성 시간을 2시간에서 20분으로 줄였고, 엑셀 대시보드를 Jira Cloud 네이티브로 이관했습니다.",
                  "현재 매드엔진 프론티어 스튜디오에서 나이트크로우 후속작 '나이트크로우W'(개발 중)의 개발 PM으로, 마일스톤 일정·크로스팀 커뮤니케이션·빌드 마감·문서 제작 및 배포를 담당하고 있습니다.",
                  "2025년 3월 신입으로 합류해 PM 업무 가이드와 온보딩·프로세스 문서를 정리하며 팀의 일하는 방식을 빠르게 표준화했고, 플레이 가이드·경쟁작 요약·퍼블리셔 피칭덱 등 스튜디오 안팎을 잇는 문서를 만들어 왔습니다.",
                  "PM은 결정권자가 아니라 '결정이 제때 내려지고 정확히 전파되도록 돕는 사람'이라 생각합니다. 모르는 채로 스스로를 두지 않고, 먼저 다가가 묻고, 모든 작업이 열린 채널에서 이뤄지도록 하는 커뮤니케이션을 지향합니다.",
                ][i - 1];
                return (
                  <p key={i}><EditableText k={`about.p${i}`} value={c(map, `about.p${i}`, fallback)} multiline /></p>
                );
              })}
            </div>
            <EditableImage k="about.portrait" value={c(map, "about.portrait", "")} className="portrait" bg bgLabel="PORTRAIT" />
          </div>
        </section>

        {/* Skills */}
        <section id="skills" className="paper-section">
          <div className="wrap">
            <p className="section-kicker"><EditableText k="skills.kicker" value={c(map, "skills.kicker", "Skills")} inline /></p>
            <h2><EditableText k="skills.title" value={c(map, "skills.title", "핵심 역량")} inline /></h2>
            <div className="skills-grid">
              {skillOrder.map((id, idx) => (
                <div className="skill-card" tabIndex={0} key={id}>
                  <h3><EditableText k={`skills.card${id}.title`} value={c(map, `skills.card${id}.title`, ["마일스톤 · 일정 관리", "크로스팀 커뮤니케이션 · 조율", "데이터 · AI 활용 자동화", "빌드 · 마감 & 문서화"][idx] ?? `Skill ${idx + 1}`)} inline /></h3>
                  <p><EditableText k={`skills.card${id}.desc`} value={c(map, `skills.card${id}.desc`, [
                    "프로젝트 상황에 맞춘 마일스톤 로드맵을 설계·동기화하고, 최종 마감에서 역산해 코드 마감을 잡습니다. 엑셀 대시보드를 Jira Cloud로 이관하고 JQL 저장 필터로 현황을 관리합니다.",
                    "기획·프로그램·아트·QA·퍼블리셔 사이의 논의를 Slack·Jira로 일원화하고, 개발 중 발생하는 버그·QA·일정 이슈를 시작~종결까지 추적·전파합니다.",
                    "스튜디오 전용 AI 에이전트를 직접 개발합니다. 회의록 에이전트(로컬 STT + 기획서 대조)로 개발 리뷰 회의록 정리를 2~3시간→20분, 주간보고 자동화(퍼포스 서밋 분석)로 2시간→20분으로 단축했고, 지라 다중 릴레이트·빌드 테스트 웹 가이드 툴도 만들었습니다.",
                    "TeamCity로 데일리·마감·테스트·핫픽스 빌드를 발행·버전 관리하고, 플레이 가이드·프로세스 문서를 제작·배포해 팀의 기준을 표준화합니다.",
                  ][idx] ?? "이 역량에 대한 요약 설명입니다.")} multiline /></p>
                  <DeleteItemButton list="skills.cards" id={id} label="삭제" />
                </div>
              ))}
            </div>
            <AddItemButton list="skills.cards" label="+ 스킬 추가" />

            {/* Tools — Skills 섹션에 포함(스킬 박스 아래에 배치) */}
            <div className="stack-band">
              <div className="stack-row">
                <div className="stack-title">
                  <span><EditableText k="stack.label" value={c(map, "stack.label", "TOOLS")} inline /></span>
                  <strong><EditableText k="stack.title" value={c(map, "stack.title", "주요 사용 도구")} inline /></strong>
                </div>
                <div className="stack-list">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <span key={i}><EditableText k={`stack.tool${i}`} value={c(map, `stack.tool${i}`, ["Jira", "Perforce", "TeamCity", "Slack", "Gemini (GWS)"][i - 1] ?? `Tool ${i}`)} inline /></span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 경력 기술서 팝업 */}
        <section className="career-showcase" id="career-showcase" aria-hidden="true">
          <div className="career-panel">
            <button className="career-close" type="button" aria-label="경력 기술서 닫기"><span className="btn-label">ESC 눌러 닫기</span></button>
            <div className="career-panel-head">
              <p className="section-kicker"><EditableText k="career.kicker" value={c(map, "career.kicker", "Career Profile")} inline /></p>
              <h2><EditableText k="career.heading" value={c(map, "career.heading", "경력 기술서")} inline /></h2>
            </div>

            <div className="career-document">
              <div className="career-image-row cols-3">
                <EditableImage k="career.img.top1" value={c(map, "career.img.top1", IMG_C3)} alt="대표 프로젝트 1" loading="lazy" />
                <EditableImage k="career.img.top2" value={c(map, "career.img.top2", IMG_C3)} alt="대표 프로젝트 2" loading="lazy" />
                <EditableImage k="career.img.top3" value={c(map, "career.img.top3", IMG_C3)} alt="대표 프로젝트 3" loading="lazy" />
              </div>

              <article className="career-resume-card career-resume-card--warhaven">
                <div className="career-resume-meta">
                  <strong><EditableText k="career.r1.period" value={c(map, "career.r1.period", "2025.03 - 재직 중")} inline /></strong>
                  <span><EditableText k="career.r1.company" value={c(map, "career.r1.company", "매드엔진 · 프론티어 스튜디오")} inline /></span>
                </div>
                <div>
                  <h3><EditableText k="career.r1.title" value={c(map, "career.r1.title", "개발 PM")} inline /></h3>
                  <p><EditableText k="career.r1.summary" value={c(map, "career.r1.summary", "나이트크로우 후속작 '나이트크로우W' MMORPG 개발 프로젝트의 개발 PM. 마일스톤 일정 관리, 크로스팀 커뮤니케이션, 빌드·마감 오퍼레이션, AI 기반 업무 자동화를 담당.")} multiline /></p>
                  <h4><EditableText k="career.r1.h4a" value={c(map, "career.r1.h4a", "<개발 커뮤니케이션 · 일정 · 빌드>")} inline /></h4>
                  <ul>
                    <li><EditableText k="career.r1.a1" value={c(map, "career.r1.a1", "마일스톤·일정 관리, 직군 간 조율 및 버그·QA·일정 이슈 트래킹, 빌드 테스트 가이드 배포")} inline /></li>
                    <li><EditableText k="career.r1.a2" value={c(map, "career.r1.a2", "코드 마감~최종 마감 타임라인 설계, 스트림 분리·머지, TeamCity 빌드 발행·버전 관리(데일리/마감/테스트/핫픽스)")} inline /></li>
                    <li><EditableText k="career.r1.a3" value={c(map, "career.r1.a3", "엑셀 대시보드 → Jira Cloud 네이티브 이관, JQL 저장 필터·오토메이션으로 지라 고도화 및 상태 현황 문서 관리")} inline /></li>
                  </ul>
                  <h4><EditableText k="career.r1.h4b" value={c(map, "career.r1.h4b", "<자동화 · 문서 · 아트/외주>")} inline /></h4>
                  <ul>
                    <li><EditableText k="career.r1.b1" value={c(map, "career.r1.b1", "AI 에이전트 개발: 회의록 에이전트(로컬 STT+기획서 대조, 회의록 정리 2~3h→20m), 주간보고 자동화(퍼포스 서밋 분석, 2h→20m), 지라 다중 릴레이트 자동화, 빌드 플레이 테스트 웹 가이드(HTML)")} inline /></li>
                    <li><EditableText k="career.r1.b2" value={c(map, "career.r1.b2", "플레이 가이드·아이온2(AION2) 라이브 요약본·퍼블리셔 발표용 게임 소개 피칭덱(PD·유관부서 팀장 협업) 제작·배포")} inline /></li>
                    <li><EditableText k="career.r1.b3" value={c(map, "career.r1.b3", "아트 리소스 리스트 양식 제작·관리, 아트 모델링 외주 계약 관리(계약서 검토·작업자 커뮤니케이션·비용 처리), 개발실 Gemini(GWS) AI 라이선스 지급")} inline /></li>
                  </ul>
                </div>
                <a className="career-warhaven-card" href="#" target="_blank" rel="noopener noreferrer">
                  <span className="career-warhaven-card-frame">
                    <EditableImage k="career.notion.img" value={c(map, "career.notion.img", IMG_NOTIONCARD)} alt="프로젝트 기술 포트폴리오" loading="lazy" />
                    <span className="career-warhaven-card-notion" aria-hidden="true"><img src={IMG_NBADGE} alt="" /></span>
                  </span>
                  <span className="career-warhaven-card-meta">
                    <strong><EditableText k="career.notion.title" value={c(map, "career.notion.title", "프로젝트 기술 포트폴리오")} inline /></strong>
                    <span className="career-warhaven-card-tags">
                      {c(map, "career.notion.tags", "2025~,일정관리,커뮤니케이션,빌드마감").split(",").map((t, i) => (
                        <span key={i}>{t.trim()}</span>
                      ))}
                    </span>
                    <span className="career-edit-only">
                      <EditableText k="career.notion.tags" value={c(map, "career.notion.tags", "2025~,일정관리,커뮤니케이션,빌드마감")} inline placeholder="태그 (콤마로 구분)" />
                    </span>
                  </span>
                </a>
              </article>

              <div className="career-image-row cols-4">
                <EditableImage k="career.img.row1" value={c(map, "career.img.row1", IMG_C4)} alt="" loading="lazy" />
                <EditableImage k="career.img.row2" value={c(map, "career.img.row2", IMG_C4)} alt="" loading="lazy" />
                <EditableImage k="career.img.row3" value={c(map, "career.img.row3", IMG_C4)} alt="" loading="lazy" />
                <EditableImage k="career.img.row4" value={c(map, "career.img.row4", IMG_C4)} alt="" loading="lazy" />
              </div>

              {entryOrder.map((id) => {
                const d = entryDefaults[id] ?? { period: "기간", company: "회사명", title: "직무 제목", summary: "담당 업무 요약을 적으세요." };
                return (
                  <article className="career-info-card" key={id}>
                    <div className="career-resume-meta">
                      <strong><EditableText k={`career.entry.${id}.period`} value={c(map, `career.entry.${id}.period`, d.period)} inline /></strong>
                      <span><EditableText k={`career.entry.${id}.company`} value={c(map, `career.entry.${id}.company`, d.company)} inline /></span>
                    </div>
                    <div>
                      <h3><EditableText k={`career.entry.${id}.title`} value={c(map, `career.entry.${id}.title`, d.title)} inline /></h3>
                      <p><EditableText k={`career.entry.${id}.summary`} value={c(map, `career.entry.${id}.summary`, d.summary)} multiline /></p>
                      <DeleteItemButton list="career.entries" id={id} label="경력 항목 삭제" />
                    </div>
                  </article>
                );
              })}
              <AddItemButton list="career.entries" label="+ 경력 항목 추가" />

              <div className="career-bottom-grid">
                {miniOrder.map((id, idx) => (
                  <article className="career-mini-card" key={id}>
                    <h3><EditableText k={`career.mini${id}.title`} value={c(map, `career.mini${id}.title`, miniTitles[idx] ?? "항목")} inline /></h3>
                    <p><EditableText k={`career.mini${id}`} value={c(map, `career.mini${id}`, [
                      "한국폴리텍V대학 광주캠퍼스 신소재응용학과 (2015.03~2019.02)\n경일게임아카데미 게임기획 6기 (2024.02~2024.11)",
                      "컴퓨터활용능력 2급 (2023.12)\n워드프로세서 (2023.12)\n· 대한상공회의소",
                      "Jira · Confluence · Perforce · TeamCity\nSlack · Milanote · Gemini(GWS) · Unreal Engine",
                      "G-STAR 2024 · Metaverse EXPO 2024 참여\n개발 기록 블로그 운영 (imgile.tistory.com)",
                    ][idx] ?? "내용을 적으세요.")} multiline /></p>
                    <DeleteItemButton list="career.minis" id={id} label="삭제" />
                  </article>
                ))}
              </div>
              <AddItemButton list="career.minis" label="+ 항목 추가" />
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="footer">
        <div className="footer-grid">
          <div>
            <a className="logo footer-brand" href="#top" aria-label="gile.devlog">
              <img className="logo-mark" src="/tistory-logo.png" alt="" style={{ height: "44px" }} />
              <span className="logo-text" style={{ color: "#fff", fontSize: "26px" }}>gile.devlog</span>
            </a>
            <span className="footer-brand-name"><EditableText k="footer.name" value={c(map, "footer.name", "박한길")} inline /></span>
            <p className="footer-contact"><EditableText k="footer.contact" value={c(map, "footer.contact", "gksrlf1199@gmail.com")} multiline /></p>
            <div className="social-row">
              <a href={c(map, "footer.social.instagram", "#")} aria-label="Instagram" target="_blank" rel="noopener noreferrer"><EditableImage k="footer.social.instagram.img" value={c(map, "footer.social.instagram.img", soc("IG"))} alt="Instagram" /></a>
              <a href={c(map, "footer.social.linkedin", "#")} aria-label="LinkedIn" target="_blank" rel="noopener noreferrer"><EditableImage k="footer.social.linkedin.img" value={c(map, "footer.social.linkedin.img", soc("in"))} alt="LinkedIn" /></a>
              <a href={c(map, "footer.social.youtube", "#")} aria-label="YouTube" target="_blank" rel="noopener noreferrer"><EditableImage k="footer.social.youtube.img" value={c(map, "footer.social.youtube.img", soc("YT"))} alt="YouTube" /></a>
              <a href={c(map, "footer.social.notion", "#")} aria-label="Notion" target="_blank" rel="noopener noreferrer"><EditableImage k="footer.social.notion.img" value={c(map, "footer.social.notion.img", soc("N"))} alt="Notion" /></a>
            </div>
          </div>
          <div>
            <h3><EditableText k="footer.quickTitle" value={c(map, "footer.quickTitle", "Quick Links")} inline /></h3>
            <div className="footer-links">
              <a href="#demo"><EditableText k="footer.link.demo" value={c(map, "footer.link.demo", "HIGHLIGHTS")} inline /></a>
              <a href="#projects"><EditableText k="footer.link.projects" value={c(map, "footer.link.projects", "PROJECTS")} inline /></a>
              <a href="#learning"><EditableText k="footer.link.learning" value={c(map, "footer.link.learning", "LEARNING")} inline /></a>
              <a href="#about"><EditableText k="footer.link.about" value={c(map, "footer.link.about", "ABOUT")} inline /></a>
            </div>
          </div>
          <div>
            <h3><EditableText k="footer.resTitle" value={c(map, "footer.resTitle", "Resources")} inline /></h3>
            <div className="footer-links">
              <a href="#"><EditableText k="footer.res1" value={c(map, "footer.res1", "포트폴리오")} inline /></a>
              <a href="#projects"><EditableText k="footer.res2" value={c(map, "footer.res2", "경력기술서")} inline /></a>
            </div>
          </div>
          <div>
            <h3>Contact</h3>
            <form className="contact-form" action="mailto:gksrlf1199@gmail.com" method="post" encType="text/plain">
              <input type="email" name="email" placeholder="name@domain.com" aria-label="Email address" />
              <button type="submit">Send</button>
            </form>
          </div>
        </div>
      </footer>

      <PortfolioClient />
    </>
  );
}
