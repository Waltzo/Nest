# 🪺 Nest

벤토그리드 + 글라스모피즘 개인 대시보드 홈페이지. 모눈 그리드 위에 카드를 원하는
위치·크기로 드래그 배치하고, 브라우저에서 편집한 내용을 GitHub에 커밋해 모든
기기에 반영합니다.

**Live:** https://waltzo.github.io/Nest/

## 특징

- **벤토그리드**: `react-grid-layout` 기반 드래그/리사이즈. 모눈(graph-paper) 배경에
  자유 배치(`compactType=null`, 겹침 방지).
- **글라스모피즘**: `backdrop-filter` 블러 + 그라디언트 배경.
- **위젯 6종**: 링크/북마크, 메모(마크다운), 시계, 날씨(open-meteo), 이미지/프로필,
  미니 캘린더(날짜 클릭 → Google Calendar).
- **라이트/다크 테마** 토글 (localStorage 유지).
- **이중 편집 잠금**:
  - 비밀번호 게이트(SHA-256 해시) — 편집 UI 진입.
  - GitHub PAT — 실제 리포 커밋 권한(진짜 잠금).
- **저장**: localStorage 즉시 저장 + Publish 시 GitHub API 커밋 + JSON Export/Import.

## 로컬 개발

```bash
npm install
npm run dev      # http://localhost:5173/Nest/
npm run build    # 타입체크 + 프로덕션 빌드 → dist/
npm run preview  # 빌드 결과 미리보기
```

## 사용법

1. **편집** 버튼 → 최초 실행 시 비밀번호 설정(해시만 저장), 이후엔 비밀번호 입력.
2. 편집 모드에서:
   - 카드 드래그로 이동, 우하단 핸들로 리사이즈.
   - **＋ 카드 추가**로 위젯 삽입, 카드의 ⚙로 속성 편집, ✕로 삭제.
   - **🚀 Publish**로 GitHub에 커밋(토큰 필요).
   - **⬇ Export / ⬆ Import**로 JSON 백업/복원.
   - **↻ 리포에서**로 리포의 최신 config 다시 불러오기.

## GitHub 토큰(PAT) 발급

Publish는 `Waltzo/Nest`의 `public/dashboard.json`에 커밋합니다.

1. GitHub → Settings → Developer settings → **Fine-grained personal access tokens**.
2. Repository access: `Waltzo/Nest`만 선택.
3. Permissions → **Contents: Read and write**.
4. 생성된 토큰을 앱의 **🔑 토큰** 모달에 입력(이 브라우저 localStorage에만 저장).

> ⚠️ 정적 사이트라 비밀번호 게이트는 편집 UI를 가리는 소프트 잠금입니다. 실제
> 쓰기 권한은 PAT가 통제하므로, 토큰이 없으면 누구도 리포에 반영할 수 없습니다.
> 토큰은 본인 기기에서만 쓰고 최소 권한만 부여하세요.

## 배포 (GitHub Pages)

1. 이 코드를 `Waltzo/Nest` 리포에 push.
2. 리포 **Settings → Pages → Source: GitHub Actions**.
3. `main` push 시 `.github/workflows/deploy.yml`가 빌드 후 Pages에 배포.

커스텀 도메인을 루트(`/`)로 붙이면 `vite.config.ts`의 `base`를 `'/'`로 바꾸세요.

## 데이터 모델

`public/dashboard.json` 한 파일이 대시보드 전체 상태입니다.

```ts
interface DashboardConfig {
  version: number
  cards: { id; type; layout: {x,y,w,h}; props }[]
  theme: 'light' | 'dark'
  cols: number       // 모눈 열 수 (기본 12)
  rowHeight: number  // 행 픽셀 (기본 80)
  editPasswordHash?: string // SHA-256 hex, 편집 게이트용
}
```

로드 우선순위: localStorage 편집본 > 리포 `dashboard.json`.

## 기술 스택

Vite · React · TypeScript · react-grid-layout · react-markdown · open-meteo API ·
GitHub Contents API.
