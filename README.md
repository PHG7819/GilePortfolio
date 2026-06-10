# 웹 포트폴리오 (관리자 편집 기능 포함)

가이드(빌드 가이드)와 **동일한 방식**으로 만든, 관리자 로그인 → 내용 편집 → DB 저장이 가능한 Next.js 포트폴리오입니다.

- **프론트엔드**: Next.js 14 (App Router) — 기존 정적 포트폴리오 디자인 그대로
- **인증**: `ADMIN_PASSWORD` 환경변수 + SHA256 HttpOnly 쿠키 (`/api/admin/*`)
- **저장**: Neon Postgres `content_blocks` 테이블 (key/value) — 모든 방문자에게 즉시 반영
- **편집 UX**: 헤더의 `관리자` → 로그인 → `편집` → 텍스트가 입력칸으로 → `저장`

> 정적 버전(GitHub Pages용 단일 HTML)은 `_legacy-static/` 폴더에 백업되어 있습니다.

---

## 1. 로컬 실행

```bash
npm install
cp .env.local.example .env.local   # 값 채우기 (아래 참고)
npm run db:push                    # DB 에 content_blocks 테이블 생성
npm run dev                        # http://localhost:3000
```

### `.env.local` 값
```
DATABASE_URL="postgresql://...:...@.../...?sslmode=require"   # Neon 연결 문자열
ADMIN_PASSWORD="원하는_관리자_비밀번호"
BLOB_READ_WRITE_TOKEN="vercel_blob_rw_..."                    # 이미지 업로드용(선택)
```

> DB 없이도 페이지는 기본 텍스트(fallback)로 그대로 보입니다. 편집/저장 기능만 DB가 필요합니다.

---

## 2. Vercel 배포 (가이드와 동일)

1. 이 폴더를 GitHub 저장소에 push
2. [vercel.com](https://vercel.com) → New Project → 저장소 import
3. **Storage 탭에서 Neon Postgres 연결** (Marketplace) → `DATABASE_URL` 자동 주입
   - 또는 Settings → Environment Variables 에 직접 `DATABASE_URL` 추가
4. Settings → Environment Variables 에 **`ADMIN_PASSWORD`** 추가
5. **Storage 탭에서 Blob 스토어 연결** → `BLOB_READ_WRITE_TOKEN` 자동 주입 (이미지 업로드용)
6. Deploy
7. 배포 후 최초 1회 테이블 생성: 로컬에서 같은 `DATABASE_URL`로 `npm run db:push`
   (또는 Neon SQL 콘솔에서 직접 생성)

배포되면 누구나 포트폴리오를 볼 수 있고, **본인만 `관리자`로 로그인해 내용을 수정**할 수 있습니다.

---

## 3. 편집 방법

1. 헤더 우측 **`관리자`** 클릭 → 비밀번호 입력
2. **`편집`** 클릭 → 텍스트가 입력칸으로 바뀜
   - 데모 카드: 제목은 카드 위에서, **YouTube ID / 태그 / 설명**은 카드 하단 편집 패널에서 수정
   - **이미지 변경**: 편집 모드에서 이미지(초록 점선 표시)를 클릭 → 파일 선택 → Vercel Blob 업로드 → 자동 반영
   - **항목 추가/삭제**: 데모 카드뿐 아니라 **Projects 역량 · Learning 카드 · Skills · 경력 항목 · 경력 미니카드**도 각 섹션의 `+ 추가` 버튼과 `삭제` 버튼으로 관리
     (추가·삭제는 즉시 저장됩니다. 저장 안 한 변경사항이 있으면 먼저 저장/취소하라고 안내합니다.)
3. **`저장`** → DB 반영 후 새로고침. 모든 방문자에게 적용됩니다.
4. `취소`로 되돌리기, `로그아웃`으로 종료.

---

## 4. 편집 가능한 콘텐츠 키

모든 텍스트는 `content_blocks` 테이블에 `content:<key>` 로 저장됩니다. 주요 키:

| 영역 | 키 예시 |
|------|---------|
| Demo | `demo.kicker`, `demo.title`, `demo.cta`, `demo.card.1~6.{title,video,tags,desc}` |
| Projects | `projects.{kicker,title,intro,careerBtn}`, `projects.feat1~3.{title,desc}` |
| Learning | `learning.{kicker,title}`, `learning.card1~2.{desc,title}` |
| About | `about.{kicker,title}`, `about.p1~6` |
| Stack | `stack.{label,title}`, `stack.tool1~5` |
| Skills | `skills.{kicker,title}`, `skills.card1~4.{title,desc}` |
| Career | `career.r1/r2.{period,company,title,summary}`, `career.mini1~4` |
| Footer | `footer.{name,contact}`, `footer.social.{instagram,linkedin,youtube,notion}`(링크), `footer.social.*.img`(아이콘) |
| 이미지 | `project.img.{wide,1~4}`, `projects.feat1~3.icon`, `learning.card1~2.img`, `about.portrait`, `career.img.{top1~3,row1~4}`, `career.notion.img` |
| 항목 목록(추가·삭제) | `<list>.order` (JSON 배열, `/api/list`가 관리). list: `demo.cards`, `projects.feats`, `learning.cards`, `skills.cards`, `career.minis`, `career.entries` |

> 이미지는 **편집 모드에서 클릭 → 업로드**로 교체합니다(Vercel Blob). 업로드된 URL이 위 키에 저장되어 모든 방문자에게 보입니다. Blob 미연결 시에는 기본 플레이스홀더가 그대로 표시됩니다.

---

## 5. 방문자 카운터 / 날짜

- 상단바 날짜: 서울 기준 `yyyy년 mm월 dd일 X요일` 자동 표시
- `Today N`: 무료 카운터 API(Abacus). `components/PortfolioClient.tsx` 의 `SITE_KEY` 를 본인 고유값으로 변경하세요.
