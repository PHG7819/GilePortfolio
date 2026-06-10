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

  // 데모 카드 — 순서는 "demo.cards.order"(JSON 배열), 각 카드는 id 기반 키로 저장.
  const cardDefaults: Record<string, { video: string; title: string; tags: string; desc: string }> = {
    "1": { video: "dQw4w9WgXcQ", title: "대표 작업물 01", tags: "2026.06,Tag A,Tag B,Tag C", desc: "- 작업 개요를 여기에 적으세요.\n- 사용한 도구나 접근 방식을 설명하세요." },
    "2": { video: "dQw4w9WgXcQ", title: "대표 작업물 02", tags: "2026.05,Tag A,Tag B", desc: "- 작업 개요를 여기에 적으세요.\n- 두 번째 줄 설명." },
    "3": { video: "dQw4w9WgXcQ", title: "대표 작업물 03", tags: "2026.04,Tag A,Tag B", desc: "- 작업 개요를 여기에 적으세요." },
    "4": { video: "dQw4w9WgXcQ", title: "대표 작업물 04", tags: "2026.03,Tag A,Tag B", desc: "- 작업 개요를 여기에 적으세요." },
    "5": { video: "dQw4w9WgXcQ", title: "대표 작업물 05", tags: "2026.02,Tag A,Tag B", desc: "- 작업 개요를 여기에 적으세요." },
    "6": { video: "dQw4w9WgXcQ", title: "대표 작업물 06", tags: "2026.01,Tag A,Tag B", desc: "- 작업 개요를 여기에 적으세요." },
  };
  const cardOrder = readOrder(map, "demo.cards", ["1", "2", "3", "4", "5", "6"]);
  const newCardDefault = { video: "dQw4w9WgXcQ", title: "새 작업물", tags: "New", desc: "- 내용을 적으세요." };
  const demoCards = cardOrder.map((id) => {
    const d = cardDefaults[id] ?? newCardDefault;
    return {
      id,
      video: c(map, `demo.card.${id}.video`, d.video),
      title: c(map, `demo.card.${id}.title`, d.title),
      tags: c(map, `demo.card.${id}.tags`, d.tags),
      desc: c(map, `demo.card.${id}.desc`, d.desc),
    };
  });

  // 다른 반복 섹션들의 순서 목록
  const featOrder = readOrder(map, "projects.feats", ["1", "2", "3"]);
  const learnOrder = readOrder(map, "learning.cards", ["1", "2"]);
  const skillOrder = readOrder(map, "skills.cards", ["1", "2", "3", "4"]);
  const miniOrder = readOrder(map, "career.minis", ["1", "2", "3", "4"]);
  const entryOrder = readOrder(map, "career.entries", ["r2"]);
  const miniTitles = ["Education", "Certifications", "Tools", "Etc."];
  const entryDefaults: Record<string, { period: string; company: string; title: string; summary: string }> = {
    r2: { period: "2017.04 - 2022.01", company: "이전 회사명", title: "이전 직무 제목", summary: "담당 업무 요약을 적으세요.\n- 핵심 기여 내용 1\n- 핵심 기여 내용 2" },
  };

  // 내비게이션 라벨 (헤더·왼쪽 사이드바·푸터가 공유)
  const navDemo = c(map, "nav.demo", "Demo Reel");
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
            <p className="section-kicker"><EditableText k="demo.kicker" value={c(map, "demo.kicker", "Demo Reel")} inline /></p>
            <h1><EditableText k="demo.title" value={c(map, "demo.title", "Portfolio")} inline /></h1>
            <div className="reel-grid">
              {demoCards.map((card) => (
                <article
                  key={card.id}
                  className="video-card is-featured"
                  tabIndex={0}
                  role="button"
                  data-video={card.video}
                  data-title={card.title}
                  data-tags={card.tags}
                  data-description={card.desc}
                >
                  <div className="video-frame">
                    <img src={`https://img.youtube.com/vi/${card.video}/hqdefault.jpg`} alt={card.title} />
                  </div>
                  <div className="video-meta">
                    <strong><EditableText k={`demo.card.${card.id}.title`} value={card.title} inline /></strong>
                    <div className="card-tags">
                      {card.tags.split(",").map((t, i) => (
                        <span key={i}>{t.trim()}</span>
                      ))}
                    </div>
                    <div className="card-edit-fields">
                      <label>YouTube ID</label>
                      <EditableText k={`demo.card.${card.id}.video`} value={card.video} inline />
                      <label>태그 (콤마로 구분)</label>
                      <EditableText k={`demo.card.${card.id}.tags`} value={card.tags} inline />
                      <label>설명 (모달에 표시)</label>
                      <EditableText k={`demo.card.${card.id}.desc`} value={card.desc} multiline />
                      <DeleteItemButton list="demo.cards" id={card.id} label="이 카드 삭제" />
                    </div>
                  </div>
                </article>
              ))}
            </div>
            <AddItemButton list="demo.cards" label="+ 작업물 카드 추가" />
            <div className="center-action"><a className="button no-arrow" href="#projects"><span className="btn-label"><EditableText k="demo.cta" value={c(map, "demo.cta", "더 많은 작업물 보기")} inline /></span></a></div>
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
                <p><EditableText k="projects.intro" value={c(map, "projects.intro", "대표 프로젝트에 대한 한두 문단 소개를 적으세요. 역할, 기여, 사용 기술, 성과 등을 담습니다.")} multiline /></p>
                {featOrder.map((id, idx) => (
                  <div className="feature-item" key={id}>
                    <EditableImage k={`projects.feat${id}.icon`} value={c(map, `projects.feat${id}.icon`, IMG_FEAT)} className="feature-icon" alt="" />
                    <div>
                      <h3><EditableText k={`projects.feat${id}.title`} value={c(map, `projects.feat${id}.title`, `역량 ${idx + 1}`)} inline /></h3>
                      <p><EditableText k={`projects.feat${id}.desc`} value={c(map, `projects.feat${id}.desc`, "이 역량에 대한 짧은 설명을 적으세요.")} multiline /></p>
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
                <h2><EditableText k="learning.title" value={c(map, "learning.title", "What I keep studying")} inline /></h2>
              </div>
            </div>
            <div className="learning-grid">
              {learnOrder.map((id, idx) => (
                <article className="learning-card" key={id}>
                  <div className="learning-image-frame">
                    <EditableImage k={`learning.card${id}.img`} value={c(map, `learning.card${id}.img`, IMG_LEARN)} className="learning-image" alt="" />
                  </div>
                  <p><EditableText k={`learning.card${id}.desc`} value={c(map, `learning.card${id}.desc`, "학습/연구 주제에 대한 요약을 적으세요.")} multiline /></p>
                  <strong><EditableText k={`learning.card${id}.title`} value={c(map, `learning.card${id}.title`, `연구 주제 0${idx + 1}`)} inline /></strong>
                  <a className="button" href="#" target="_blank" rel="noopener noreferrer"><span className="btn-label">Read More</span></a>
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
              <h2><EditableText k="about.title" value={c(map, "about.title", "Your Name")} inline /></h2>
            </div>
            <div className="profile-copy">
              {[1, 2, 3, 4, 5, 6].map((i) => {
                const fallback = [
                  "한두 문단으로 본인을 소개하세요. 전문 분야, 강점, 지향점 등을 담습니다.",
                  "두 번째 문단입니다. 어떤 일을 하는 사람인지, 어떤 환경/문제에 흥미를 느끼는지 적어보세요.",
                  "세 번째 문단입니다. 특히 관심 있는 세부 분야나, 그것을 통해 만들어내고자 하는 결과를 설명하세요.",
                  "네 번째 문단입니다. 현재 소속과 진행 중인 일을 요약하세요.",
                  "다섯 번째 문단입니다. 과거 경력에서의 주요 경험과 배운 점을 정리하세요.",
                  "여섯 번째 문단입니다. 협업·커뮤니케이션 등 사람과 관련된 강점이나 가치관을 적어 마무리하세요.",
                ][i - 1];
                return (
                  <p key={i}><EditableText k={`about.p${i}`} value={c(map, `about.p${i}`, fallback)} multiline /></p>
                );
              })}
            </div>
            <EditableImage k="about.portrait" value={c(map, "about.portrait", "")} className="portrait" bg bgLabel="PORTRAIT" />
          </div>
        </section>

        {/* Stack band */}
        <div className="stack-band">
          <div className="stack-row">
            <div className="stack-title">
              <span><EditableText k="stack.label" value={c(map, "stack.label", "TOOLS")} inline /></span>
              <strong><EditableText k="stack.title" value={c(map, "stack.title", "주요 사용 도구")} inline /></strong>
            </div>
            <div className="stack-list">
              {[1, 2, 3, 4, 5].map((i) => (
                <span key={i}><EditableText k={`stack.tool${i}`} value={c(map, `stack.tool${i}`, `Tool ${i}`)} inline /></span>
              ))}
            </div>
          </div>
        </div>

        {/* Skills */}
        <section id="skills" className="paper-section">
          <div className="wrap">
            <p className="section-kicker"><EditableText k="skills.kicker" value={c(map, "skills.kicker", "Skills")} inline /></p>
            <h2><EditableText k="skills.title" value={c(map, "skills.title", "핵심 역량")} inline /></h2>
            <div className="skills-grid">
              {skillOrder.map((id, idx) => (
                <div className="skill-card" tabIndex={0} key={id}>
                  <h3><EditableText k={`skills.card${id}.title`} value={c(map, `skills.card${id}.title`, `Skill ${idx + 1}`)} inline /></h3>
                  <p><EditableText k={`skills.card${id}.desc`} value={c(map, `skills.card${id}.desc`, "이 역량에 대한 영문/요약 설명입니다.")} multiline /></p>
                  <DeleteItemButton list="skills.cards" id={id} label="삭제" />
                </div>
              ))}
            </div>
            <AddItemButton list="skills.cards" label="+ 스킬 추가" />
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
                  <strong><EditableText k="career.r1.period" value={c(map, "career.r1.period", "2022.01 - 재직 중")} inline /></strong>
                  <span><EditableText k="career.r1.company" value={c(map, "career.r1.company", "회사명")} inline /></span>
                </div>
                <div>
                  <h3><EditableText k="career.r1.title" value={c(map, "career.r1.title", "대표 프로젝트 / 직무 제목")} inline /></h3>
                  <p><EditableText k="career.r1.summary" value={c(map, "career.r1.summary", "이 시기에 담당한 핵심 업무를 한두 문장으로 요약하세요.")} multiline /></p>
                  <h4><EditableText k="career.r1.h4a" value={c(map, "career.r1.h4a", "<프로젝트 A>")} inline /></h4>
                  <ul>
                    <li><EditableText k="career.r1.a1" value={c(map, "career.r1.a1", "핵심 기여 내용 1")} inline /></li>
                    <li><EditableText k="career.r1.a2" value={c(map, "career.r1.a2", "핵심 기여 내용 2")} inline /></li>
                    <li><EditableText k="career.r1.a3" value={c(map, "career.r1.a3", "핵심 기여 내용 3")} inline /></li>
                  </ul>
                  <h4><EditableText k="career.r1.h4b" value={c(map, "career.r1.h4b", "<프로젝트 B>")} inline /></h4>
                  <ul>
                    <li><EditableText k="career.r1.b1" value={c(map, "career.r1.b1", "핵심 기여 내용 1")} inline /></li>
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
                      {c(map, "career.notion.tags", "2022~2024,Implementation,Tone & manner,Combat").split(",").map((t, i) => (
                        <span key={i}>{t.trim()}</span>
                      ))}
                    </span>
                    <span className="career-edit-only">
                      <EditableText k="career.notion.tags" value={c(map, "career.notion.tags", "2022~2024,Implementation,Tone & manner,Combat")} inline placeholder="태그 (콤마로 구분)" />
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
                    <p><EditableText k={`career.mini${id}`} value={c(map, `career.mini${id}`, "내용을 적으세요.")} multiline /></p>
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
            <span className="footer-brand-name"><EditableText k="footer.name" value={c(map, "footer.name", "Your Name")} inline /></span>
            <p className="footer-contact"><EditableText k="footer.contact" value={c(map, "footer.contact", "your@email.com\nPhone : 010-0000-0000")} multiline /></p>
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
              <a href="#demo"><EditableText k="footer.link.demo" value={c(map, "footer.link.demo", "DEMO REEL")} inline /></a>
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
            <form className="contact-form" action="mailto:your@email.com" method="post" encType="text/plain">
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
