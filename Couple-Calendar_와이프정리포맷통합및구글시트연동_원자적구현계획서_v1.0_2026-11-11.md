---
title: "달콤살벌 가계부 - 와이프 정리 포맷 통합 및 구글 시트 다중 시트 연동 원자적 구현계획서"
version: "v1.0"
status: "active"
date: "2026-11-11"
author: "마스터 AI"
tags:
  - CoupleCalendar
  - Ledger
  - ImplementationPlan
  - WBS
  - TDD
---

> [!IMPORTANT] **문서 상태: ACTIVE v1.0 (free세션 작업 하달용 원자적 구현계획서)**  
> 본 계획서는 와이프의 원본 정리 방식(`내역(1월)` ~ `내역(12월)`)을 수용하는 엑셀 통합본을 빌드하고,  
> 캘린더 엔진의 파서 및 다중 시트 동기화 로직을 완벽히 업그레이드하기 위한 원자적 WBS 실행 계획서입니다.  
> 본 계획서에 따라 **Claude FreeLLMAPI (Port 3001) 워커 세션**이 작업을 전담 집행합니다.

---

# 1. 작업 개요 및 원자적 WBS (Bite-sized Steps)

### Phase 1: 와이프 원본 데이터 추출 및 통합본 엑셀 생성 (Zero Data Loss)
- **Step 1.1**: AppleScript / Openpyxl을 통해 현재 열려있는 원본 엑셀(`용이주니('26)_261111.xlsx`)에서 `내역(1월)` ~ `내역(10월)`, `출금내역('26)`, `세이프통장`, `적금내역`, `가계부('26)`, `군산,보령여행` 등 전체 시트 데이터를 완전하게 추출.
- **Step 1.2**: 새 통합본 워크북 `달콤살벌_부부공동가계부_2026통합본_v2(1~10월포함).xlsx` 생성:
  1) `📖가계부_작성가이드`: 부부 협업 작성 4대 원칙 기록.
  2) `내역(1월)` ~ `내역(12월)`: 1~10월 실데이터 탑재 + 11~12월 표준 템플릿.
  3) 각 시트 헤더 7개 셀(A1~G1)에 필수 여부 및 규칙 메모(openpyxl `Comment`) 내장.
  4) `전체내역(캘린더연동)`: 가계부 앱에서 한 번에 1~12월 전체 데이터를 가져갈 수 있는 실시간 취합 탭 생성.
- **Step 1.3**: 생성된 XLSX 파일 무결성 및 셀 메모 포함 여부 검증.

### Phase 2: 가계부 앱 엔진(`excel_ledger_engine.js`) 파서 고도화
- **Step 2.1**: 와이프 원본 7개 컬럼 헤더(`['날짜', '분류', '소분류', '내용', '금액(원)', '수입/지출', '자산']`)를 자동 감지하여 `date`, `category`, `subCategory`, `description`, `amount`, `type`, `paymentMethod`로 매핑하는 정규화 로직 구현.
- **Step 2.2**: 로컬 XLSX 파일 로드 시 `내역(`으로 시작하는 모든 월별 시트를 순회하여 일괄 합산하는 다중 시트 파서 기능 구현.
- **Step 2.3**: `자산` 컬럼 기반 결제자(`진용`->`yongi`, `준희`->`juni`, `생활비통장`->`together`) 스마트 판별 및 `이체지출(저축/보험)` 분리 로직 강화.

### Phase 3: 단위 테스트(TDD) 및 전체 정합성 검증
- **Step 3.1**: `tests/test_excel_ledger.py`에 신규 테스트 케이스 추가:
  - 와이프 원본 7개 컬럼 CSV/JSON 파싱 검증.
  - 결제자 자동 추론 및 이체지출(저축) 플래그 검증.
  - 다중 시트 병합 파싱 검증.
- **Step 3.2**: 전체 단위 테스트 스위트(168개+) 100% ALL PASS 확인.

### Phase 4: 버전 갱신 및 라이브 배포 (v3.9.0)
- **Step 4.1**: `index.html`, `sw.js`, `Couple-Calendar_버전기록_CHANGELOG.md` 버전을 `v3.9.0`으로 일괄 동기화.
- **Step 4.2**: `tests/test_version_sync.py` 통과 확인.
- **Step 4.3**: Git 커밋, GitHub `main` 브랜치 푸시 및 GitHub Pages 배포 실측 확인.

---

# 2. 실행 담당자 및 거버넌스 규칙

- **총괄 지휘 및 검증**: 마스터 AI (Antigravity)
- **실제 소스코드/스크립트 구현 담당**: Claude Code (FreeLLMAPI - Port 3001 워커 세션)
- **거버넌스 필수 요구사항**:
  - `Ob_Business/ops/tasks/_WORKER_TASK_BOARD.md`에 지시서 등록 (`[TASK-WIFE-FORMAT-INTEGRATION-008]`).
  - 워커 실행 로그 및 단위 테스트 결과 증빙이 확보된 후에만 마스터가 최종 승인(`COMPLETED`).
