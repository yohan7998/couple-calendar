# 달콤살벌 캘린더 v2.0 - 가족 일정 및 가계부(생활비 관리) 통합 원자적구현계획서

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 음주티켓 배너를 통계 탭으로 이전하고, 가족 일정(기간 및 메모 전달) 및 가계부(생활비 처리현황 등록, 엑셀 임포트/연동/익스포트, 모바일/웹 세련된 반응형 통계)를 완벽히 통합 구현한다.

**Architecture:** 단일 정적 웹 애플리케이션(Single HTML PWA) 내부에 Zero-Backend 원칙을 유지하며, SheetJS(xlsx) 및 Chart.js CDN 라이브러리를 바인딩하고, LocalStorage 및 GitHub Gist 무손실 양방향 동기화(`mergeStates`)를 지원하는 모듈형 아키텍처.

**Tech Stack:** HTML5, CSS3 (모바일 퍼스트 + 데스크톱 그리드), Vanilla JavaScript ES2022, SheetJS (xlsx 0.18.5), Chart.js (4.4.x), Service Worker (PWA), Python Playwright/HTTP e2e 테스트.

## Global Constraints
- 마스터 AI 총괄 지휘 및 메뉴판 나열 금지 (완성된 단일 실행안 제시).
- Obsidian SSOT 원칙: 모든 설계와 산출물은 옵시디언 vault 및 프로젝트 루트에 동기화.
- 한국어 출력 정규화.
- 하위 호환성 유지: 기존 v1.8 데이터(음주 기록, 쪽지함, 일정, Gist 토큰 등) 100% 무손실 마이그레이션.
- PWA 및 오프라인 구동 유지.

---

### Task 1: 음주티켓 배너 통계 탭 이전 및 레이아웃 재구성

**Files:**
- Modify: `index.html:1500-1650` (배너 위치 이동 및 네비게이션 탭 확장)
- Test: `tests/test_couple_calendar_e2e.py`

**Interfaces:**
- Consumes: `#drink-ticket-banner`, `#calendar-view`, `#stats-view`
- Produces: 달력 메인 화면에서 배너 제거 및 통계 뷰 최상단 배치, 신규 '💰 가계부' 탭 네비게이션 버튼 추가

- [ ] **Step 1: 실패하는 단위 테스트 작성**
  - 메인 캘린더 뷰 상단에 `#drink-ticket-banner`가 없고 `#stats-view` 내부에 존재하는지 확인하는 테스트 작성.
- [ ] **Step 2: 테스트 실행 및 실패 확인 (RED)**
- [ ] **Step 3: `index.html` 내 배너 DOM 이동 및 CSS 튜닝**
  - `#drink-ticket-banner`를 `stats-view` 최상단으로 이전.
  - 상단 `.view-tabs` 및 하단 `.bottom-nav`에 `💰 가계부` 탭(`switchView('ledger')`) 추가.
- [ ] **Step 4: 테스트 실행 및 통과 확인 (GREEN)**
- [ ] **Step 5: 커밋**

---

### Task 2: 기간 일정(Period Schedule) & 메모 쪽지함 전달 연동 엔진

**Files:**
- Create: `modules/period_schedule_engine.js` (워커 하달용 또는 인라인 통합용)
- Modify: `index.html` (일정 추가 폼에 기간 날짜 및 메모, 쪽지 연동 체크박스 추가, 캘린더 렌더링 확장)
- Test: `tests/test_period_schedule.py`

**Interfaces:**
- Consumes: `AppState.schedules`, `AppState.notes`
- Produces: `isPeriod`, `startDate`, `endDate`, `memo`, `addScheduleWithPeriod()`, `renderCalendarGrid()` 연속 바 표출

- [ ] **Step 1: 실패하는 단위 테스트 작성**
  - 기간 일정(2026-11-03 ~ 2026-11-05) 등록 시 3일간 연속 렌더링 확인.
  - 메모 등록 및 쪽지함 자동 발행 연동 확인.
- [ ] **Step 2: 테스트 실행 및 실패 확인 (RED)**
- [ ] **Step 3: 일정 모달 UI 및 캘린더 엔진 구현**
  - 시작일/종료일 선택 폼 및 메모 textarea 추가.
  - "💌 상대방에게 쪽지로도 함께 전달" 체크 시 `AppState.notes`에 자동 등록.
  - 달력 셀에 기간 바(Range Bar) 렌더링.
- [ ] **Step 4: 테스트 실행 및 통과 확인 (GREEN)**
- [ ] **Step 5: 커밋**

---

### Task 3: 가계부(생활비 처리현황) CRUD 엔진 및 데이터 모델

**Files:**
- Create: `modules/ledger_engine.js`
- Modify: `index.html` (가계부 탭 뷰 `#ledger-view`, 지출/수입 등록 모달, 목록 렌더링)
- Test: `tests/test_ledger_crud.py`

**Interfaces:**
- Consumes: `AppState.ledger.transactions`
- Produces: `addTransaction()`, `updateTransaction()`, `deleteTransaction()`, `filterTransactions()`, `renderLedgerView()`

- [ ] **Step 1: 실패하는 단위 테스트 작성**
  - 가계부 수입/지출 등록, 수정, 삭제, 월별/결제자별 필터링 테스트.
- [ ] **Step 2: 테스트 실행 및 실패 확인 (RED)**
- [ ] **Step 3: 가계부 CRUD 엔진 및 UI 구현**
  - 거래 등록 모달 (수입/지출 토글, 카테고리, 빠른 금액 버튼, 결제자 선택, 메모).
  - 거래 목록 렌더링 (날짜별 그룹화, 결제자 뱃지, 수정/삭제 팝업).
- [ ] **Step 4: 테스트 실행 및 통과 확인 (GREEN)**
- [ ] **Step 5: 커밋**

---

### Task 4: 엑셀 데이터 업로드 & 공유 스프레드시트 연동 & 엑셀 내보내기

**Files:**
- Create: `modules/excel_ledger_engine.js`
- Modify: `index.html` (SheetJS CDN 연동, 드래그앤드롭 업로드존, 공유 링크 Fetch, 엑셀 다운로드 버튼)
- Test: `tests/test_excel_ledger.py`

**Interfaces:**
- Consumes: `SheetJS (XLSX)`, `AppState.ledger`
- Produces: `ExcelLedgerEngine` 네임스페이스: `normalizeHeaders()`, `parseCsvString()`, `parseExcelWorkbook()`, `exportToExcelData()`, `fetchSharedCsv()`

- [ ] **Step 1: 실패하는 단위 테스트 작성**
  - SheetJS/CSV 파싱 함수로 다양한 열 이름(날짜, 금액, 카테고리, 메모, 결제자) 정상 매핑 검증.
  - 금액 정제 및 결제자 정규화 검증.
  - 엑셀 데이터 생성 및 URL fetch 파싱 검증.
- [ ] **Step 2: 테스트 실행 및 실패 확인 (RED)**
- [ ] **Step 3: 엑셀 파서 및 공유 시트 연동 구현**
  - 모듈 `excel_ledger_engine.js` 파일 생성 및 구현.
  - SheetJS 로드 및 파일 업로드(드래그앤드롭) 이벤트 바인딩.
  - 자동 열 매핑 정규화 로직 구현(`normalizeHeaders`, `parseCsvString`, `parseExcelWorkbook`).
  - "📥 엑셀 내보내기" 및 "🔄 공유 시트 가져오기" 버튼 및 비동기 처리 구현(`exportToExcelData`, `fetchSharedCsv`).
  - 금액 문자열에서 콤마(,), '원', '$', 공백 제거 및 음수 처리 완벽 지원.
  - 결제자('주니'/'juni', '용이'/'yongi', '공동'/'together') 지능적 판별.
- [ ] **Step 4: 테스트 실행 및 통과 확인 (GREEN)**
- [ ] **Step 5: 커밋**

---

### Task 5: 모바일 최적화 & 웹 대화면 반응형 세련된 통계 대시보드

**Files:**
- Create: `modules/ledger_stats_view.js`
- Modify: `index.html` (Chart.js CDN 연동, 반응형 CSS 미디어 쿼리, 통계 뷰 컴포넌트)
- Test: `tests/test_stats_responsive.py`

**Interfaces:**
- Consumes: `Chart.js`, `AppState.ledger.transactions`, `AppState.drinks`
- Produces: `renderLedgerStats()`, `renderWebSpreadsheetGrid()` (웹 대화면 전용)

- [ ] **Step 1: 실패하는 단위 테스트 작성**
  - 총지출, 카테고리별 합계, 결제자별 분담 비율 연산 검증.
  - 모바일 뷰와 데스크톱 뷰 레이아웃 클래스/그리드 검증.
- [ ] **Step 2: 테스트 실행 및 실패 확인 (RED)**
- [ ] **Step 3: 통계 뷰 & 반응형 레이아웃 구현**
  - Chart.js 연동 도넛 차트(카테고리별 지출) 및 바 차트(월별 지출 추이).
  - 모바일: 카드형 요약 + 분담률 게이지 + 소비 타임라인.
  - 웹 대화면 (≥768px): 좌측 통계 대시보드 + 우측 엑셀 스타일 일괄 데이터 그리드 테이블.
- [ ] **Step 4: 테스트 실행 및 통과 확인 (GREEN)**
- [ ] **Step 5: 커밋**

---

### Task 6: Gist 2-Way 무손실 동기화 확장 & 전체 통합 E2E 검증 및 배포

**Files:**
- Modify: `index.html` (mergeStates 함수에 ledger 병합 로직 추가)
- Modify: `tests/test_couple_calendar_e2e.py` (종합 E2E 테스트 스위트)
- Output: `https://yohan7998.github.io/couple-calendar/`, `/Users/yohan/Downloads/Couple-Calendar.html`

- [ ] **Step 1: mergeStates 단위 테스트 작성 및 검증**
  - 로컬과 원격의 가계부 트랜잭션 및 기간 일정이 충돌 없이 양방향 병합되는지 확인.
- [ ] **Step 2: 전체 E2E 테스트 실행 (All Green)**
- [ ] **Step 3: `agent-browser` 모바일(375px) & 웹(1200px) 실측 렌더링 검증**
- [ ] **Step 4: 옵시디언 vault, 다운로드 사본, GitHub Pages 커밋/푸시 배포**
