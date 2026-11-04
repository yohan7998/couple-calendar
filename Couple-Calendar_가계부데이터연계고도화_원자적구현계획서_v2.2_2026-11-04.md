# 달콤살벌 캘린더 v2.2 - 가계부 캘린더 일체화 및 스마트 지문 멱등성 연계 원자적구현계획서

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 캘린더 날짜 셀 지출 배지 및 상세 모달 가계부 리스트 바인딩, 그리고 엑셀/구글시트 임포트 시 스마트 지문(Fingerprint) 기반 멱등성(Idempotency) 중복 방지 엔진을 완벽 구현한다.

**Architecture:** 캘린더 엔진(`renderCalendar`, `openDayDetail`)과 가계부 상태(`AppState.ledger.transactions`) 간의 반응형 양방향 바인딩을 구축하고, `ExcelLedgerEngine`에 지문 기반 중복 판별 알고리즘을 탑재하여 Zero-Backend 환경에서 데이터 무결성을 보장한다.

**Tech Stack:** HTML5, CSS3, Vanilla JavaScript ES2022, SheetJS, Python unittest Playwright/DOM parser.

## Global Constraints
- 마스터 AI 총괄 지휘 및 메뉴판 나열 금지 (완성된 단일 실행안 제시).
- Obsidian SSOT 원칙: 모든 설계와 산출물은 옵시디언 vault 및 프로젝트 루트에 동기화.
- 한국어 출력 정규화.
- 하위 호환성 유지: 기존 v2.1 데이터(음주, 쪽지, 일정, 가계부, Gist 토큰 등) 100% 무손실 유지.
- PWA 및 오프라인 구동 유지.

---

### Task 1: 스마트 지문(Fingerprint) 기반 멱등성 중복 방지 엔진 구현 (TDD)

**Files:**
- Modify: `modules/excel_ledger_engine.js`
- Modify: `index.html` (Module 2 인라인 및 수집 함수 연계)
- Test: `tests/test_ledger_calendar_link.py`

**Interfaces:**
- Consumes: `tx` 객체 (`date`, `amount`, `type`, `category`, `memo`), `AppState.ledger.transactions`
- Produces: `ExcelLedgerEngine.generateTxFingerprint(tx)`, `ExcelLedgerEngine.deduplicateTransactions(existing, incoming)`, `ingestTransactionsWithDeduplication(incoming)`

- [ ] **Step 1: 실패하는 단위 테스트 작성**
  - 동일한 거래(날짜, 금액, 유형, 카테고리, 메모 동일) 수신 시 중복이 정확히 제외되고 신규 항목만 반환되는지 검증하는 테스트 작성.
- [ ] **Step 2: 테스트 실행 및 실패 확인 (RED)**
- [ ] **Step 3: `ExcelLedgerEngine` 및 `index.html`에 지문 생성 및 멱등 필터 구현**
  - `generateTxFingerprint` 및 `deduplicateTransactions` 구현.
  - `syncSharedSpreadsheet()` 및 파일 업로드 핸들러에 적용하여 중복 건 스킵 및 사용자 토스트 안내 구현.
- [ ] **Step 4: 테스트 실행 및 통과 확인 (GREEN)**
- [ ] **Step 5: 커밋**

---

### Task 2: 캘린더 날짜 셀 지출 배지 및 금액 단축 표출 구현 (TDD)

**Files:**
- Modify: `index.html:3270-3330` (`renderCalendar` 내 배지 수집 블록)
- Modify: `modules/modern_components.css` / CSS 스타일 블록 (지출 배지 스타일링)
- Test: `tests/test_ledger_calendar_link.py`

**Interfaces:**
- Consumes: `AppState.ledger.transactions`, `currentYear`, `currentMonth`, `day`
- Produces: `.badge-expense-wrapper`, `.badge-expense-icon`, `.badge-expense-amount`

- [ ] **Step 1: 실패하는 단위 테스트 작성**
  - 특정 일자에 지출이 있을 때 해당 날짜 셀에 `.badge-expense-wrapper`와 포맷팅된 금액(예: `5.6만`, `8,000원`)이 렌더링되는지 검증.
- [ ] **Step 2: 테스트 실행 및 실패 확인 (RED)**
- [ ] **Step 3: `renderCalendar()` 내 지출 배지 렌더링 및 CSS 구현**
  - 당일 지출 합계 계산 및 가독성 높은 지출 배지 마크업 주입.
  - 미니멀 칩 스타일 CSS 적용.
- [ ] **Step 4: 테스트 실행 및 통과 확인 (GREEN)**
- [ ] **Step 5: 커밋**

---

### Task 3: 날짜 상세 모달(`openDayDetail`) 가계부 섹션 및 퀵 등록 버튼 구현 (TDD)

**Files:**
- Modify: `index.html:2240-2300` (`#day-detail-modal` HTML 구조)
- Modify: `index.html:3840-3980` (`openDayDetail`, `deleteTransactionFromDayDetail`, `openRecordLedgerForDay`)
- Test: `tests/test_ledger_calendar_link.py`

**Interfaces:**
- Consumes: `selectedDate`, `AppState.ledger.transactions`
- Produces: `#day-ledger-list`, `deleteTransactionFromDayDetail(id)`, `openRecordLedgerForDay()`

- [ ] **Step 1: 실패하는 단위 테스트 작성**
  - `#day-ledger-list` 존재 여부, 당일 거래 내역 표출, 삭제 함수 호출 시 정상 삭제 및 리렌더링 검증.
- [ ] **Step 2: 테스트 실행 및 실패 확인 (RED)**
- [ ] **Step 3: 날짜 상세 모달 마크업 및 핸들러 구현**
  - `#day-ledger-list` 마크업 주입.
  - `openDayDetail()`에서 당일 수입/지출 내역 바인딩.
  - 모달 하단 `[💰 생활비 등록]` 버튼 추가 및 `selectedDate` 기본값 연동.
  - 모달 내 즉시 삭제 `deleteTransactionFromDayDetail()` 구현.
- [ ] **Step 4: 테스트 실행 및 통과 확인 (GREEN)**
- [ ] **Step 5: 커밋**

---

### Task 4: 통합 E2E 검증, Obsidian SSOT 정본 동기화 및 라이브 배포

**Files:**
- Modify: `_ACTIVE_PLANS.md`
- Modify: `Couple-Calendar_버전기록_CHANGELOG.md`
- Output: `index.html`, `/Users/yohan/Downloads/Couple-Calendar.html`, `yohan7998.github.io/couple-calendar`

- [ ] **Step 1: 전체 60+개 테스트 스위트 일괄 실행 (All Green)**
- [ ] **Step 2: 옵시디언 vault 디렉토리로 신규 사양서, 계획서 및 산출물 파일 동기화**
- [ ] **Step 3: `/Users/yohan/Downloads/Couple-Calendar.html` 단일 배포본 갱신**
- [ ] **Step 4: Git 커밋 & 푸시 (GitHub Pages 실시간 배포)**
