# 달콤살벌 가계부 - 구글 시트 부부 협업 양식 및 캘린더 연동 원자적 구현 계획서

> **문서 상태: ACTIVE v1.0 (2026-11-11)**  
> **Goal:** 부부 공동 가계부 구글 시트 표준 양식 배포 및 달콤살벌 캘린더 연동 엔진 고도화  
> **Architecture:** 5-Sheet 구글 스프레드시트 양식(모바일 최적화) + SheetJS/CSV 다중 시트 & 다중 헤더 지능형 파서 + 지문 기반 멱등성 인제스트  
> **Tech Stack:** OpenPyXL, SheetJS (xlsx 0.18.5), Vanilla JS, Python pytest

## Global Constraints
- 기존 36개 단위/E2E 테스트 스위트 100% 회귀 통과 유지.
- `용이주니('26).xlsx`의 1,186건 실측 데이터 100% 무손실 이관 및 검증.
- 부부 결제자(진용/용이, 준희/주니, 공동) 자동 감지 100% 정확도 보장.

---

### Task 1: 구글 시트 배포용 표준 양식 및 1,186건 통합 마이그레이션 파일 생성
- **Files:**
  - Create: `달콤살벌_부부공동가계부_표준양식('26).xlsx`
  - Create: `달콤살벌_부부공동가계부_2026통합본(1~9월포함).xlsx`
  - Create: `달콤살벌_부부공동가계부_일일내역(1~9월).csv`
- [x] **Step 1:** openpyxl 기반 5대 시트(`📱일일가계부`, `📊월별요약_대시보드`, `🎯세이프통장`, `💰자산_적금현황`, `⚙️기초설정`) 서식 및 수식 생성
- [x] **Step 2:** `용이주니('26).xlsx`의 1~9월 1,186건 데이터 정제 및 통합본 생성 완료

### Task 2: `modules/excel_ledger_engine.js` 다중 헤더 및 스마트 결제자/저축 파서 고도화
- **Files:**
  - Modify: `modules/excel_ledger_engine.js`
  - Test: `tests/test_excel_ledger.py`
- [ ] **Step 1: Write test for new headers, multi-sheet detection, and smart payer/saving normalization**
- [ ] **Step 2: Run test to verify initial failure**
- [ ] **Step 3: Implement engine enhancements in `modules/excel_ledger_engine.js`**
- [ ] **Step 4: Run tests and ensure 100% PASS**

### Task 3: 캘린더 UI 연동 및 구글 시트 게시 가이드 최적화
- **Files:**
  - Modify: `index.html` (공유 시트 가이드 문구 및 템플릿 다운로드 핸들러 점검)
- [ ] **Step 1: Check `index.html` template download and sync functions**
- [ ] **Step 2: Verify browser operation with sample Google Sheets CSV and integrated XLSX**

### Task 4: SSOT 형상 관리 및 활성 계획서(`_ACTIVE_PLANS.md`) 갱신
- **Files:**
  - Modify: `_ACTIVE_PLANS.md` (Obsidian 및 couple-calendar)
- [ ] **Step 1: Update active plans table and architecture status**
