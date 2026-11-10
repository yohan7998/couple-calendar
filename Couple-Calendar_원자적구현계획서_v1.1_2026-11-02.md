---
title: Couple-Calendar(달콤살벌 캘린더) 원자적 구현 계획서 (WBS)
version: v1.1
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

# Couple-Calendar(달콤살벌 캘린더) 원자적 구현 계획서 (v1.1)

> [!IMPORTANT] **문서 상태: ACTIVE v1.1 (사용자 승인 및 확정된 정본 실행 계획서)**  
> **총괄 지휘**: Antigravity 마스터 AI  
> **기준 사양서**: [[Couple-Calendar_상세설계사양서_v1.1_2026-11-02]]  
> **최종 목표 산출물**: `Ob_Business/apps/couple-calendar/index.html` (단일 자가완결 실행 파일)

---

## 1. 개요 및 구현 목표
사용자 요구에 따라:
1. **음주 주종별 선호도/선택 필드 전면 제거**: 음주 여부, 음주자(주니/용이/함께), 티켓 차감에 집중.
2. **쪽지함 2분할**: `주니 ➔ 용이`, `용이 ➔ 주니` 2개 전용 수신 탭 및 카드 렌더링.
3. **새 쪽지 도착 알림 & 알람 시스템**: 브라우저 Web Notification API, Web Audio API 맑은 차임벨 소리, 인앱 상단 토스트 알림 배너 및 안 읽은 뱃지 추가.

---

## 2. 작업 분해 구조 (WBS) 및 TDD 단계

### - [x] Task 1: 테스트 스위트 확장 (Test-Driven Development)
- **대상 파일**: `Ob_Business/apps/couple-calendar/tests/test_couple_calendar_e2e.py`
- **구현 내용**:
  - `test_drink_simplification_and_calendar_counts`: 주종 선택 UI 제거, 달력 음주 횟수(1회/2회) 렌더링, 주니/용이 통계 검증.
  - `test_split_notes_mailboxes`: 주니 ➔ 용이, 용이 ➔ 주니 분리 탭 및 컨테이너 존재 검증.
  - `test_notification_and_chime_engine`: 웹 알림 API, 차임벨 오디오 엔진, 인앱 배너 스크립트 검증.
- **검증 결과**: 초기 4건 실패(RED) 확인 후 구현 착수.

### - [x] Task 2: 음주 주종 선호도 제거, 달력 음주 횟수 표기 및 주니·용이 프로필
- **대상 파일**: `Ob_Business/apps/couple-calendar/index.html`
- **구현 내용**:
  - `AppState.couple` 기본값: `user1: 주니(🐻)`, `user2: 용이(🐰)`.
  - 기록 모달 내 주종 선택 UI 완전 제거 (누가 마셨나요: `🥂 둘이 함께`, `🐻 주니`, `🐰 용이`).
  - **달력 내 음주 횟수 표기**: 달력 일자별 음주 뱃지에 아이콘(🍺 / 🥂) 밑으로 `1회`, `2회`, `3회` 미니 횟수 뱃지(`.badge-drink-count`) 렌더링 완료.
  - 통계 뷰: 주종 선호도 없이 `주니 🐻`, `용이 🐰`, `함께 🥂` 음주 횟수 및 잔여 티켓 상태 직관적 표시.

### - [x] Task 3: 쪽지함 2분할 UI 및 렌더러 구축
- **대상 파일**: `Ob_Business/apps/couple-calendar/index.html`
- **구현 내용**:
  - 쪽지함 뷰에 상단 2분할 서브 탭 추가:
    - `[🐻 주니 ➔ 용이에게 (<span id="count-juni-to-yongi">0</span>)]`
    - `[🐰 용이 ➔ 주니에게 (<span id="count-yongi-to-juni">0</span>)]`
  - 각 탭에 따른 필터링된 쪽지 목록 렌더링 함수(`renderNotes()`, `renderNoteCardList()`).
  - 쪽지 작성 모달: 발신자 라벨을 `🐻 주니가 용이에게` / `🐰 용이가 주니에게`로 명확히 선택할 수 있도록 개편.

### - [x] Task 4: 새 쪽지 도착 알림 & 멜로디 차임벨 알람 엔진 구현
- **대상 파일**: `Ob_Business/apps/couple-calendar/index.html`
- **구현 내용**:
  - Web Audio API 기반 청아한 4음계(C5-E5-G5-C6) 챠임벨 사운드 합성 함수 `playNewNoteChime()`.
  - Web Notification API 권한 요청 버튼 및 알림 발송 함수 `requestNotificationPermission()`, `showSystemNotification(note)`.
  - 화면 상단 인앱 슬라이드 다운 알림 배너 (`#new-note-toast`).
  - 새 쪽지 수신 감지 비교 로직 (`checkNewNotesReceived(oldNotes, newNotes)`).
  - 쪽지함 상단 및 설정 모달 내 알림 테스트 및 알림 켜기 버튼 배치.
  - 30초 백그라운드 폴링 및 탭 복귀(`visibilitychange`) 실시간 동기화.

### - [x] Task 5: 전체 회귀 검증 및 프로덕션 동기화
- **실행 명령**: `python3 Ob_Business/apps/couple-calendar/tests/test_couple_calendar_e2e.py`
  - 결과: **9/9 (100% 통과, GREEN)**
- **동기화**: `/Users/yohan/Downloads/Couple-Calendar.html` 복사 및 MD5 일치 확인 (`84e73e26cc8cc09039bf12bad7c34f08`).
- **SSOT 등록**: `_ACTIVE_PLANS.md` 정본 색인 v1.1 업데이트 완료.
