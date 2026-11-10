---
title: Couple-Calendar(달콤살벌 캘린더) 원자적 구현 계획서 (WBS)
version: v1.0
status: active
created: 2026-11-02
updated: 2026-11-02
author: 마스터 AI
applied_in:
  - Ob_Business/apps/couple-calendar/index.html
tags:
  - 구현계획서
  - WBS
  - TDD
  - CoupleCalendar
  - SSOT
---

# Couple-Calendar(달콤살벌 캘린더) 원자적 구현 계획서 (WBS)

> [!IMPORTANT] **문서 상태: ACTIVE v1.0 (사용자 승인 및 확정된 정본 실행 계획서)**  
> **총괄 지휘**: Antigravity 마스터 AI  
> **기준 사양서**: [`Couple-Calendar_상세설계사양서_v1.0_2026-11-02.md`](file:///Users/yohan/Library/CloudStorage/OneDrive-개인/02.Obsidian_Business/Ob_Business/apps/couple-calendar/Couple-Calendar_%EC%83%81%EC%84%B8%EC%84%A4%EA%B3%84%EC%82%AC%EC%96%91%EC%84%9C_v1.0_2026-11-02.md)  
> **최종 목표 산출물**: `Ob_Business/apps/couple-calendar/index.html` (단일 자가완결 실행 파일)

---

## 1. 개요 및 구현 전략

본 계획서는 부부 2인이 함께 음주 티켓을 관리하고, 일정을 기록하며, 쪽지를 교환할 수 있는 귀여운 감성의 반응형 웹 캘린더를 단일 자립형(Zero-Dependency Single HTML) 파일로 구축하는 원자적 단위 실행 계획입니다.

- **원칙**:
  - 외부 빌드 도구(npm/webpack) 없이 브라우저에서 즉시 열리는 단일 HTML.
  - GitHub Secret Gist API를 활용한 영구 무료 실시간 2인 동기화.
  - TDD 원칙에 입각하여 핵심 상태 로직 및 동기화 무결성을 자동화 테스트로 철저히 검증.

---

## 2. 원자적 작업 분해 (Bite-Sized Tasks)

### Task 1: 전역 상태 저장소 및 GitHub Gist 동기화 엔진 구축
- **파일**: `Ob_Business/apps/couple-calendar/index.html` (State Engine 스크립트)
- **책임**:
  - `AppState` 초기화 및 기본값(부부 프로필, 기본 티켓 수, 데모 데이터) 정의
  - `localStorage` 로컬 캐싱 및 낙관적 UI 업데이트
  - GitHub Secret Gist API 통신 (`GET`, `PATCH`)
  - URL 해시(`syncKey`) 기반 아내 원클릭 자동 연동 파서
- **검증**: `test_sync_engine.py` (JSON 직렬화 및 Gist 페이로드 정합성 검증)

### Task 2: 음주 티켓(Quota) 차감 및 심플 음주 트래커 엔진 구현 (주종 선택 제외)
- **파일**: `Ob_Business/apps/couple-calendar/index.html` (Drink Module)
- **책임**:
  - 월별 음주 목표 티켓 수 설정 (기본 8장)
  - 음주 기록 추가 시 티켓 -1장 실시간 차감 (공동 음주 시 1회 차감)
  - 남은 티켓 수 연산 및 4단계 상태 전이 (여유 🟢, 주의 🟡, 소진 🔴, 초과 💥)
  - 귀여운 맥주잔 차오름 프로그레스 게이지 UI 및 소진 시 특별 허가권 조르기 인터랙션
- **검증**: `test_drink_quota.py` (티켓 차감, 소진, 초과 상태 연산 알고리즘 단위 테스트)

### Task 3: 월간 캘린더 및 일정 관리 모듈 구현
- **파일**: `Ob_Business/apps/couple-calendar/index.html` (Calendar Module)
- **책임**:
  - 월간 달력 그리드 생성 (이전 달, 다음 달 탐색)
  - 날짜 셀에 파스텔 도트, 음주 스티커(함께 🥂 / 개인 🍺), 쪽지 뱃지(💌) 표시
  - 날짜 클릭 시 부드럽게 나타나는 바텀시트/상세 모달
  - 일정 추가/수정/삭제 및 기념일 D-Day 카운터
- **검증**: 월별 날짜 정합성 및 일정 매핑 테스트

### Task 4: 부부 사랑의 교환 쪽지함 (Sticky Notes) 모듈 구현
- **파일**: `Ob_Business/apps/couple-calendar/index.html` (Notes Module)
- **책임**:
  - 몽글몽글 파스텔 포스트잇 카드 레이아웃
  - 작성자 선택(🐻 남편 / 🐰 아내) 및 쪽지 카테고리(💌 사랑, 🛒 심부름, 💊 약챙기기)
  - 하트 리액션(💖) 카운터 증가 및 할 일 완료 토글
  - 음주 티켓 소진 시 "티켓 조르기 쪽지" 생성 및 상대방 원클릭 승인(+1장 충전)
- **검증**: 메모 추가 및 하트 리액션 상태 전이 검증

### Task 5: Kawaii 비주얼 스타일링 및 모바일 PWA 최적화
- **파일**: `Ob_Business/apps/couple-calendar/index.html` (CSS & Audio)
- **책임**:
  - 파스텔 소프트 컬러 팔레트 & 둥근 모서리 UI 디자인
  - 부드러운 스프링 애니메이션 (Emil Kowalski 스타일)
  - Web Audio API를 활용한 귀여운 터치 팝 효과음 (옵션 토글)
  - 설정 모달: GitHub 토큰/Gist ID 입력 & `[카카오톡으로 아내 초대하기]` 원클릭 링크 복사
  - 모바일 홈 화면 바로가기(PWA 메타태그) 완벽 지원
- **검증**: 모바일 뷰포트 레이아웃 및 브라우저 호환성 검증

### Task 6: E2E 통합 테스트 및 패키징 검증
- **파일**: `Ob_Business/apps/couple-calendar/tests/test_couple_calendar_e2e.py`
- **책임**:
  - HTML 구문 오류 및 브라우저 파싱 무결성 검증
  - 모든 핵심 기능(티켓 차감, 캘린더 렌더링, 쪽지 교환, Gist 페이로드) E2E 테스트 통과
  - 사용 가이드(GitHub Gist 토큰 생성 및 아내 초대법) 매뉴얼 작성

