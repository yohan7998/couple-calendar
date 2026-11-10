---
title: 달콤살벌 캘린더 가계부 엑셀 연동 및 모바일/웹 통계 고도화 원자적 구현 계획서
version: v2.5.0
status: active
applied_in:
  - modules/excel_ledger_engine.js
  - modules/ledger_stats_view.js
  - modules/ledger_stats.css
  - tests/test_ledger_v25.py
  - index.html
created: 2026-11-04
author: 최고 마스터 AI (Antigravity)
tags:
  - ImplementationPlan
  - FreeSession
  - Ledger
  - TDD
---

# [Active SSOT] 가계부 엑셀 연동 및 듀얼 통계 고도화 원자적 구현 계획서 (v2.5.0)

> [!IMPORTANT] **작업자 지침 (Free세션 최우선 할당 체계)**  
> 1. 마스터 AI의 지휘 하에 **Free세션(Claude Code 워커 소켓)**이 본 계획서의 각 태스크를 1순위로 담당하여 구현합니다.  
> 2. 워커는 본인에게 할당된 모듈 파일 및 테스트 파일만 작성하며, `index.html` 정본 수정 및 `git push`는 마스터 AI가 수행합니다.

---

### Task 1: 엑셀 연동 엔진 고도화 (`modules/excel_ledger_engine.js`)
**담당**: Free세션 1 (PID 1651)  
**파일**: `modules/excel_ledger_engine.js`  
**목표**:
- 표준 가계부 양식 XLSX 템플릿 생성 API (`generateTemplateXlsx()`) 추가
- 고정비(Fixed Expense) 플래그 및 카테고리 태그 매핑 지원
- 구글 스프레드시트/공유 URL 정규화 및 오류 처리 강화

### Task 2: 모바일/웹 듀얼 통계 뷰 & 반응형 스타일링 (`modules/ledger_stats_view.js`, `modules/ledger_stats.css`)
**담당**: Free세션 2 (PID 1656)  
**파일**: `modules/ledger_stats_view.js`, `modules/ledger_stats.css`  
**목표**:
- 모바일(<=768px): 부부 분담률(주니 vs 용이) 시각화 카드, 카테고리 랭킹 아코디언, 월별 미니 바 차트
- 웹(>768px): 대화면 피벗 테이블 (월별 x 카테고리 교차 매트릭스), 일별 누적 추이 차트
- 현대적 글래스모피즘 & 부드러운 전환 애니메이션

### Task 3: TDD 전용 단위 테스트 스위트 (`tests/test_ledger_v25.py`)
**담당**: Free세션 3 (PID 1685)  
**파일**: `tests/test_ledger_v25.py`  
**목표**:
- 엑셀 파싱, 중복 제거, 템플릿 생성, 통계 집계(월별 요약, 결제자 분배, 피벗 데이터) 15개 이상 검증
- `python3 -m unittest tests/test_ledger_v25.py` 전 항목 PASS

### Task 4: 마스터 AI 최종 통합 및 실측 검증
**담당**: 최고 마스터 AI (Antigravity)  
**파일**: `index.html`, `_ACTIVE_PLANS.md`, `CHANGELOG.md`  
**목표**:
- `index.html` 내 가계부 탭과 통계 탭에 Free세션 산출물 바인딩
- `agent-browser`를 통한 모바일(375px) 및 웹(1280px) 뷰포트 실측 검증 및 스크린샷 캡처
- Git Commit & Push 배포

