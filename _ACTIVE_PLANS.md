---
title: 달콤살벌 캘린더 활성 계획서 및 설계 정본 색인 (SSOT Registry)
version: v2.2.0
status: active
created: 2026-11-02
updated: 2026-11-04
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

## 1. 현재 적용 중인 정본 계획서 목록 (Active Plans — v2.2.0)

| 구분 | 문서명 (버전 및 일자) | 상태 | 핵심 내용 및 역할 | 연계 구현 산출물 |
| :---: | :--- | :---: | :--- | :--- |
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
