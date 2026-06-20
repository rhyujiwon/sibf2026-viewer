# SIBF 2026 참가사 뷰어

**서울국제도서전 2026** 참가사 정보를 목록과 배치도로 탐색하는 웹 앱입니다.

🔗 **[배포 URL](https://sibf2026-viewer.vercel.app)**

---

## 주요 기능

**목록 뷰**
- 참가사명 · 부스번호 · 출판분야 · 메모 내용으로 통합 검색
- SNS 채널별 필터 (Instagram / X / Facebook / YouTube / Blog)
- 즐겨찾기 · 메모 필터
- 참가사별 굿즈 및 관심도서 메모 (로컬 저장)

**배치도 뷰**
- SVG 플로어맵 팬 · 줌 (마우스 휠 / 핀치줌)
- 참가사명 · 부스번호 검색 후 해당 부스로 애니메이션 이동
- 즐겨찾기 ⭐ · 메모 오버레이 표시
- 부스 탭으로 참가사 상세 패널 열기
- 복수 참가사 공유 부스 목록 선택 지원

---

## 기술 스택

| 항목 | 내용 |
|------|------|
| 빌드 | [Vite](https://vite.dev/) |
| 언어 | Vanilla JS (ES Modules) |
| 스타일 | CSS + Tailwind CDN |
| 지도 | 인라인 SVG + Pointer Events API |
| 상태 | localStorage (`sibf_fav`, `sibf_memo`) |
| 배포 | Vercel (main 브랜치 자동 배포) |

---

## 로컬 개발

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # dist/ 프로덕션 빌드
```

---

## 프로젝트 구조

```
sibf2026-viewer/
├── index.html              # HTML 셸
├── public/
│   └── floormap.svg        # 배치도 SVG (fetch로 지연 로드)
├── src/
│   ├── data/
│   │   ├── booths.json         # 참가사 428개 데이터
│   │   └── searchIndex.json    # 배치도 검색 인덱스
│   ├── styles/
│   │   └── main.css            # 커스텀 스타일
│   └── js/
│       ├── main.js             # 진입점 · 탭 전환 · 초기화
│       ├── store.js            # 공유 상태 (favorites, memos, BOOTHS)
│       ├── utils.js            # $(), esc() 헬퍼
│       ├── sns.js              # SNS 설정
│       ├── list.js             # 목록 뷰 렌더링 · 필터
│       ├── memo.js             # 메모 모달
│       ├── map.js              # 배치도 · 핀치줌 · 툴팁
│       └── modal.js            # 부스 상세 패널
└── vercel.json             # Vercel 빌드 설정
```
