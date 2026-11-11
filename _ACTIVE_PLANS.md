---
title: 달콤살벌 캘린더 활성 계획서 및 설계 정본 색인 (SSOT Registry)
version: v2.9.8
status: active
created: 2026-11-02
updated: 2026-11-09
author: 마스터 AI
tags:
  - SSOT
  - ActivePlans
  - CoupleCalendar
---

# 달콤살벌 캘린더 활성 계획서 및 설계 정본 색인 (SSOT Registry)

> [!IMPORTANT] **단일 진실 공급원 (Single Source of Truth) 원칙**  
> 본 문서는 `couple-calendar` 디렉토리 내에서 현재 실제 시스템 및 프로덕션 코드에 확정·반영된 정본 계획서들을 총괄 관리합니다.

---

## 1. 현재 적용 중인 정본 계획서 목록 (Active Plans — v2.9.8)

| 구분 | 문서명 (버전 및 일자) | 상태 | 핵심 내용 및 역할 | 연계 구현 산출물 |
| :---: | :--- | :---: | :--- | :--- |
| **당근부동산 고도화 및 반응형 개편 (v3.1.0)** | [[Couple-Calendar_당근부동산고도화및반응형개편_상세설계사양서_v1.0_2026-11-11]] | `ACTIVE` | • 건물연식(5년/10년/20년) 및 평수(20평미만/20평대/30평대/40평이상) 5대 조건 필터 완성<br/>• 고해상도 실물 썸네일 이미지 및 듀얼 onerror 방어<br/>• 불필요한 '현재조건 캘린더 일괄연동' 및 '옵시디언 전체 내보내기' 영구 삭제<br/>• 모바일(1열) & PC(1200px+ 3열 그리드) 완벽 반응형 레이아웃 피팅<br/>• 썸네일/제목/버튼 클릭 시 당근 개별 매물 상세 페이지 100% 직결 | `real_estate_view.js`<br/>`index.html`<br/>`tests/test_daangn_realty.py` |
| **스마트 클립보드 구조개선 및 사진·단지명 정상화 (v2.9.8)** | [[Couple-Calendar_스마트클립보드_구조개선및사진단지명정상화_상세설계사양서_v1.0_2026-11-10]] | `ACTIVE` | • 깨진 이미지 엑스박스 원천 차단 (모던 아파트 SVG 플레이스홀더 탑재)<br/>• 가짜 단지명('네이버 부동산 매물 101동') 영구 퇴출 & 단지명 미확인 안내<br/>• [⚡ 서울 인기 단지 1클릭 칩] (마포래미안, 엘리프미아, 반포자이 등 8종) 탭 1번으로 호가/평형/LG유플러스 출근길 0초 완성<br/>• 인라인 단지명 입력 및 정석 텍스트 복사 가이드 탑재 | `modules/naver_radar_engine.js`<br/>`modules/real_estate_scraper.js`<br/>`modules/real_estate_view.js`<br/>`tests/test_naver_radar.py`<br/>`tests/test_real_estate.py` |
| **스마트 클립보드 구조개선 원자적 구현계획서 (v1.0)** | [[Couple-Calendar_스마트클립보드_구조개선및사진단지명정상화_원자적구현계획서_v1.0_2026-11-10]] | `ACTIVE` | • Superpowers 기반 WBS 및 Free Worker 3개 세션 분담 TDD 구현 계획<br/>• 깨진 이미지 방어, 가짜 더미명 퇴출 및 1클릭 단지 칩 TDD 검증 스위트 완비 | `tests/test_naver_radar.py`<br/>`tests/test_real_estate.py` |
| **스마트 클립보드 URL 0초 자동 인제스트 (v2.9.7)** | [[Couple-Calendar_스마트클립보드URL자동인제스트_상세설계사양서_v1.0_2026-11-10]] | `ACTIVE` | • 수기 입력 강제 모달(renderQuickFallback) 전면 퇴출<br/>• Zero-Fail 지능형 URL 파서 (`resolvePropertyByUrl`) 탑재<br/>• 단지/매물/단축/검색 URL 전 규격 100% 자동 추출 및 LG유플러스(한강대로 32) 출근 정보 자동 산출<br/>• `[확인 및 매물 등록 ✨]` 1클릭 다이렉트 저장 | `modules/naver_radar_engine.js`<br/>`modules/real_estate_scraper.js`<br/>`modules/real_estate_view.js`<br/>`tests/test_naver_radar.py`<br/>`tests/test_real_estate.py` |
| **스마트 클립보드 URL 자동인제스트 원자적 구현계획서 (v1.0)** | [[Couple-Calendar_스마트클립보드URL자동인제스트_원자적구현계획서_v1.0_2026-11-10]] | `ACTIVE` | • Superpowers 기반 WBS 및 Free Worker 3개 세션 분담 TDD 구현 계획<br/>• Zero-Fail 단축키/합성 폴백 및 회귀 방지 테스트 스위트 완비 | `tests/test_naver_radar.py`<br/>`tests/test_real_estate.py` |
| **네이버 단축링크 0초 자동 스크랩 & 2단 정제 탭 (v2.8.6)** | [[Couple-Calendar_부동산지도및자동스크래핑_상세설계사양서_v2.0_2026-11-09]] | `ACTIVE` | • `https://naver.me/...` 단축 URL 입력 시 단지명·동·층수·가격·평형·특징 100% 자동 스크랩 완성<br/>• `RealEstateScraper` + `NaverRadarEngine.findArticleById` 연동으로 엘리프미아역2단지 등 실매물 0초 자동 완성<br/>• 수동 입력 강제 모달 전환 버그 원천 해결 (`isUrlOnly: false` 및 1-클릭 영속 저장)<br/>• 난잡했던 3-Way 메뉴(부동산 1, 2, 3) 전면 퇴출 및 `[📌 내 찜·임장 관리]` vs `[🛰️ 네이버 실시간 레이더]` 정본 확립 | `modules/real_estate_scraper.js`<br/>`modules/naver_radar_engine.js`<br/>`modules/real_estate_view.js`<br/>`modules/real_estate_map.js`<br/>`index.html`<br/>`sw.js`<br/>`tests/test_naver_radar.py` |
| :---: | :--- | :---: | :--- | :--- |
| **카카오 지도 Web SDK & 네이버 0초 자동 스크랩 (v2.0)** | [[Couple-Calendar_부동산지도및자동스크래핑_상세설계사양서_v2.0_2026-11-09]] | `ACTIVE` | • 카카오 지도 Web SDK 연동 & [📋 목록] ⇄ [🗺️ 지도] 듀얼 뷰 토글<br/>• 상태별 커스텀 마커(앰버/블루/퍼플/골드) 및 모바일 전용 스프링 바텀시트<br/>• 네이버 단축URL(naver.me) 0초 자동 스크랩 & OpenGraph 메타데이터 추출 엔진<br/>• 오프라인/로컬 환경 인터랙티브 폴백 맵 뷰 및 원클릭 길찾기/원문 링크 브리지 | `modules/real_estate_map.js`<br/>`modules/real_estate_scraper.js`<br/>`modules/real_estate_view.js`<br/>`modules/real_estate.css`<br/>`tests/test_real_estate.py` |
| :---: | :--- | :---: | :--- | :--- |
| **네이버 부동산 실시간 시세·단지 레이더 (v1.0)** | [[Couple-Calendar_네이버부동산실시간레이더_상세설계사양서_v1.0_2026-11-09]] | `ACTIVE` | • `jissp/naver-land-crawler` 레퍼런스 기반 비공개 API 경량 포팅<br/>• 기존 매물관리와 완전 분리된 독립 실시간 시장 레이더 카테고리 신설<br/>• Cluster/Front API 쿼리 빌더 & 정제 정규화 파서<br/>• 실시간 단지/지역 검색, 거래유형 칩, 평단가 산출 & 원클릭 관심매물 담기 브리지 | `modules/naver_radar_engine.js`<br/>`modules/naver_radar_view.js`<br/>`modules/naver_radar.css`<br/>`tests/test_naver_radar.py` |
| **모바일 부동산 매물 관리 및 이사 플래너 (v1.2)** | [[Couple-Calendar_부동산매물관리_상세설계사양서_v1.2_2026-11-09]] | `ACTIVE` | • 네이버 단축URL(naver.me) 인라인 퀵 등록(Inline Quick Ingest) 구축<br/>• 모바일 터치 이벤트 버블링 차단 및 모달 창 닫힘 버그 근본 해결<br/>• 단독 URL(Bare URL) 숫자 오인식(5만원 버그) 및 공백 단지명 원천 차단<br/>• 지역별 칩 필터 & 4단계 라이프사이클 파이프라인 (후보/임장/방문/계약)<br/>• 법정 복비·취득세·이사비 자동 산출 및 가계부 예산 연동 | `modules/real_estate_engine.js`<br/>`modules/real_estate_view.js`<br/>`modules/real_estate.css`<br/>`tests/test_real_estate.py`<br/>`index.html`<br/>`sw.js` |
| **부동산 매물관리 원자적 구현계획서 (v1.1)** | [[Couple-Calendar_부동산매물관리_원자적구현계획서_v1.1_2026-11-09]] | `ACTIVE` | • URL 선행 격리 및 쿼리 파라미터 디코딩 TDD 구현 계획<br/>• 스마트 인제스트 모달 지능형 브리지 및 매물 카드 방어 렌더링 | `modules/real_estate_engine.js`<br/>`modules/real_estate_view.js`<br/>`tests/test_real_estate.py` |
| **가계부 엑셀 연동 & 듀얼 통계 고도화** | [[Couple-Calendar_가계부엑셀통계고도화_상세설계사양서_v2.5_2026-11-04]] | `ACTIVE` | • 엑셀(XLSX/CSV) 드래그앤드롭 업로드 & 공개 구글시트/웹 링크 자동 연동<br/>• 가계부 전체 CRUD, 카테고리 태그, 고정비 자동 등록, 표준 양식 엑셀 다운로드<br/>• 모바일(터치 카드, 부부 분담률 게이지, 미니 바) vs 웹(대화면 피벗 테이블) 듀얼 통계 | `modules/excel_ledger_engine.js`<br/>`modules/ledger_stats_view.js`<br/>`modules/ledger_stats.css`<br/>`tests/test_ledger_v25.py` |
| **실시간 초고속 듀얼 동기화** | [[Couple-Calendar_실시간초고속동기화_상세설계사양서_v2.4_2026-11-04]] | `ACTIVE` | • Gist 20초 폴링 지연 한계 극복 ➔ 0.05초(50ms) 양방향 WebSocket 실시간 푸시<br/>• 델타(Delta) 단위 실시간 스트리밍 & 트래픽 98% 절감<br/>• Firebase RTDB 실시간 계층 + GitHub Gist 영구 백업 듀얼 하이브리드 아키텍처 | `modules/realtime_sync_engine.js`<br/>`modules/realtime_sync.css`<br/>`tests/test_realtime_sync.py` |
| **다중 세션 총괄 거버넌스 규약** | [[_MULTI_AGENT_PROTOCOL]] | `ACTIVE` | • 최고 마스터 AI(Antigravity) 총괄 지휘 및 세션 간 작업 충돌 방지<br/>• `index.html` 단일 통합 책임 & 워커 세션 파일 경계(`modules/`, `tests/`) 잠금<br/>• 실시간 작업 잠금 레지스트리(`_SESSION_LOCK.json`) 운영 및 TDD 의무화 | `_SESSION_LOCK.json`<br/>`_MULTI_AGENT_PROTOCOL.md` |
| **안 읽은 쪽지 브러시 언베일 인터랙션** | [[Couple-Calendar_안읽은쪽지브러시언베일_상세설계사양서_v2.3_2026-11-04]] | `ACTIVE` | • 기계적 깜빡임 전면 배제 및 감성적 수채화 브러시 스위프 & 스크래치 언베일<br/>• 블러(8px) 펄 오버레이 가림막 및 원터치 붓터치 개봉 & 스파클 파티클(✨💕)<br/>• 개봉 완결 시 자동 읽음 전환 & [안읽음] 수동 재봉인 토글 지원 | `modules/brush_reveal_effect.js`<br/>`modules/brush_reveal.css`<br/>`index.html`<br/>`sw.js`<br/>`tests/test_brush_reveal.py` |
| **쪽지 및 메모 읽음/안읽음 분리 표현** | [[Couple-Calendar_쪽지및메모읽음구분_상세설계사양서_v2.2_2026-11-04]] | `ACTIVE` | • 쪽지 및 캘린더 일정 메모의 확인(읽음/안읽음) 상태 분리 표현<br/>• NEW 마이크로 뱃지, 미확인 펄스 닷, 차분한 읽음 라벨 및 타임스탬프<br/>• 미확인 개수 실시간 뱃지 연동 및 원클릭 '모두 읽음' 지원<br/>• Gist 동기화 시 읽음 상태 무손실 양방향 머지 보장 | `modules/read_status_engine.js`<br/>`modules/read_status.css`<br/>`index.html` |
| **가계부 캘린더 일체화 & 스마트 멱등성** | [[Couple-Calendar_가계부데이터연계고도화_상세설계사양서_v2.2_2026-11-04]] | `ACTIVE` | • 캘린더 날짜 셀 지출 배지 표출 (💰 금액 단축 표기)<br/>• 날짜 상세 모달 내 가계부 지출 리스트 및 퀵 등록 버튼 연계<br/>• 엑셀/구글 시트 임포트 시 스마트 지문(Fingerprint) 기반 멱등성 중복 방지 | `index.html`<br/>`modules/excel_ledger_engine.js`<br/>E2E 테스트 스위트 |
| **모던 디자인 & 가독성 대폭 향상** | [[Couple-Calendar_모던디자인및가독성개편_상세설계사양서_v2.1_2026-11-04]] | `ACTIVE` | • WCAG AAA 고대비 타이포그래피 & 뉴트럴 배경 (`#0F172A`, `#F8FAFC`)<br/>• 올드한 이모지 ➔ Lucide 스타일 정밀 SVG 인라인 아이콘 체계<br/>• 3D 메달리온 로고 완벽 보존 & 애플/토스 감성의 모던 카드 보더<br/>• 숫자 고정폭 정렬(`tnum, cv05`)로 가계부/날짜 가독성 극대화 | `index.html`<br/>`Couple-Calendar.html` |
| **가족 일정 & 가계부 통합** | [[Couple-Calendar_가족일정및가계부통합_상세설계사양서_v2.0_2026-11-04]] | `ACTIVE` | • 음주티켓 배너 통계 탭 내부 이전<br/>• 캘린더 기간(시작~종료일) 일정 및 메모 쪽지함 즉시 전달 연동<br/>• 가계부(생활비) CRUD, 엑셀 업로드/공유링크연동/내보내기<br/>• 모바일 맞춤 통계 및 웹 대화면 엑셀 스타일 데이터 그리드 | `index.html`<br/>`Couple-Calendar.html`<br/>E2E 테스트 스위트 |

| **원자적 구현 계획서** | [[Couple-Calendar_가족일정및가계부통합_원자적구현계획서_v2.0_2026-11-04]] | `ACTIVE` | • Superpowers 기반 WBS 및 6단계 원자적 TDD 구현 계획<br/>• Free세션 워커 분담 및 마스터 통합 체계 정의 | 구현 및 테스트 스위트 |
| **버전 이력 & CHANGELOG** | [[Couple-Calendar_버전기록_CHANGELOG]] | `ACTIVE` | • v1.0.0부터 v2.0.0까지의 전체 기획, 설계, 버그픽스 및 기술 의사결정 누적 기록 | `index.html`<br/>`sw.js`<br/>`manifest.json` |
| **쪽지 개인화 & 하트 단일 반응** | [[Couple-Calendar_쪽지개인화및하트단일반응_상세설계사양서_v1.8_2026-11-03]] | `ACTIVE` | • 메인 화면 상대방 쪽지만 엄격 필터링 (내가 쓴 글 배제)<br/>• 쪽지함 내 프로필(`myRole`) 기준 `[📬 나에게 온 쪽지]` 1순위 자동 열림<br/>• 하트 반응 1인 1회 제한 및 토글 지원 (`likedBy` 배열 연동) | `index.html`<br/>E2E 테스트 스위트 |
| **PWA Service Worker & 설치 안정화** | [[Couple-Calendar_버전기록_CHANGELOG#v172-2026-11-03--pwa-service-worker-완비--안드로이드-앱을-열-수-없음-원천-해결]] | `ACTIVE` | • `sw.js` 신설 (Network-First 캐시 & 완벽한 오프라인/설치 지원)<br/>• `manifest.json` 규격 정비 (`id`, `scope` 명시 & 쿼리스트링 제거)<br/>• 설정 모달 내 1-클릭 PWA 설치 버튼 & 안드로이드 이전 버전 충돌 해결 팁 탑재 | `sw.js`<br/>`manifest.json`<br/>`index.html` |
| **모바일 레이아웃 & 로고 복원** | [[Couple-Calendar_버전기록_CHANGELOG#v171-2026-11-03--모바일-레이아웃-붕괴-긴급-복구--base64-로고-독립-렌더링-복원]] | `ACTIVE` | • Body flex row 형제 분할 버그 원천 차단 (안내 블록 모달 내부 수납)<br/>• 3D 샴페인 골드 중앙태양 로고 Base64 인라인 임베딩으로 오프라인 완전 자가완결성 보장 | `index.html`<br/>`Couple-Calendar.html` |
| **실측 0.0px 좌우대칭 개편** | [[Couple-Calendar_버전기록_CHANGELOG#v170-2026-11-03--실측-00px-좌우대칭-완결--포아송-왜곡-제거]] | `ACTIVE` | • OpenCV seamlessClone 포아송 블렌딩 수축 왜곡(397px➔14px) 원천 규명<br/>• Direct Alpha-Masking 엔진 전면 개편으로 수평/수직 편차 0.0px & 면적 100% 일치<br/>• 8대 모노그램 전 에디션 1024/512/192px 일괄 재생성 & 캐시 무효화 (`?v=20261103e`) | `icons_curated/`<br/>`달콤살벌캘린더_정제아이콘_스위트.zip` |
| **디자인·타이포 개편 사양** | [[Couple-Calendar_디자인및타이포개편_상세보고서_v1.3_2026-11-03]] | `ACTIVE` | • 손글씨 폰트(Gaegu) 전면 영구 퇴출 및 Pretendard 가변 폰트 적용<br/>• 모바일 헤더 2열 위계화 (글자 잘림/줄바꿈 완벽 해소)<br/>• 사용자 지정 3D 샴페인 골드 메달리온 앱 아이콘 및 파비콘 교체 | `index.html`<br/>`icon-512.png`<br/>`icon-192.png` |
| **양방향 동기화 사양** | [[Couple-Calendar_동기화엔진개편_상세사양서_v1.2_2026-11-03]] | `ACTIVE` | • 2-Way Merge 양방향 무손실 동기화 엔진<br/>• Secret Gist 1초 자동 생성 및 연동기<br/>• 카카오톡 인앱 브라우저 감지 안내 및 URL SyncKey 온보딩 | `index.html`<br/>GitHub Gist 연동 |

---

## 2. 이전 버전 아카이브 (Superseded Plans)

- `v1.0`: [[Couple-Calendar_부동산매물관리_상세설계사양서_v1.0_2026-11-09]] & [[Couple-Calendar_부동산매물관리_원자적구현계획서_v1.0_2026-11-09]]
- `v1.8`: [[Couple-Calendar_쪽지개인화및하트단일반응_상세설계사양서_v1.8_2026-11-03]]
- `v1.6`: 모노그램 우측 하단 곡선 1차 대칭 시도 (포아송 블렌딩 수축 오차로 대체됨)
- `v1.2`: [[Couple-Calendar_아이콘개정_상세계획서_v1.2_2026-11-03]]
- `v1.0`: [[Couple-Calendar_상세설계사양서_v1.0_2026-11-02]]
- `v1.0`: [[Couple-Calendar_원자적구현계획서_v1.0_2026-11-02]]

---

## 3. 실제 구현 산출물 매핑

- 🌟 **공식 웹 애플리케이션**: [`index.html`](file:///Users/yohan/Library/CloudStorage/OneDrive-개인/02.Obsidian_Business/Ob_Business/apps/couple-calendar/index.html) (단일 자가완결 실행 파일)
- 🚀 **즉시 실행 사본**: [`/Users/yohan/Downloads/Couple-Calendar.html`](file:///Users/yohan/Downloads/Couple-Calendar.html)
- 🐙 **GitHub 공식 저장소**: [https://github.com/yohan7998/couple-calendar](https://github.com/yohan7998/couple-calendar)
- 🌐 **온라인 라이브 웹앱 (GitHub Pages)**: [https://yohan7998.github.io/couple-calendar/](https://yohan7998.github.io/couple-calendar/)
- 📥 **단일 HTML 직접 다운로드 URL**: [https://raw.githubusercontent.com/yohan7998/couple-calendar/main/index.html](https://raw.githubusercontent.com/yohan7998/couple-calendar/main/index.html)
- 🧪 **E2E 검증 테스트 스위트**: [`tests/test_couple_calendar_e2e.py`](file:///Users/yohan/Library/CloudStorage/OneDrive-개인/02.Obsidian_Business/Ob_Business/apps/couple-calendar/tests/test_couple_calendar_e2e.py)
