---
title: 달콤살벌 캘린더 쪽지 개인화 및 하트 단일 반응 원자적 구현 계획서
version: v1.8.0
status: active
created: 2026-11-03
updated: 2026-11-03
author: 마스터 AI
tags:
  - ImplementationPlan
  - TDD
  - CoupleCalendar
---

# 달콤살벌 캘린더 쪽지 개인화 및 하트 단일 반응 원자적 구현 계획서 (v1.8.0)

> **Goal:** 사용자가 주니/용이를 선택했을 때 상대방 메시지만 메인에 표시하고, 쪽지함을 나에게 온 쪽지(수신함) 중심으로 재편하며, 하트 반응을 메시지당 1회로 제한합니다.

## Task Breakdown

### Task 1: TDD 테스트 스위트 확장
- **Files:** `tests/test_couple_calendar_e2e.py`
- [ ] 하트 반응 1인 1회 제한 및 토글 로직 검증 테스트 작성
- [ ] 쪽지함 내 프로필(myRole) 기준 수신/발신 분할 렌더링 검증 테스트 작성
- [ ] 테스트 실행 및 신규 기능 실패 확인 (RED)

### Task 2: 하트 반응 단일화 및 토글 엔진 구현
- **Files:** `index.html`
- [ ] `toggleNoteReaction(id)` 함수 구현 (`likedBy` 배열 관리 및 `reactions` 동기화)
- [ ] 메인 알림 카드(`quickReactLatestNote`) 및 쪽지함 카드(`reactToNote`)를 `toggleNoteReaction`으로 통합
- [ ] 하트 버튼 활성화 CSS (`.is-liked`, 선명한 핑크/레드 및 채워진 하트 UI) 적용

### Task 3: 쪽지함 내 프로필 맞춤 렌더링 개편
- **Files:** `index.html`
- [ ] 쪽지함 서브탭 라벨을 `myRole`에 맞추어 `[📬 나에게 온 쪽지]`, `[📤 내가 보낸 쪽지]`로 동적 렌더링
- [ ] 기본 활성 탭을 항상 `[나에게 온 쪽지]`로 설정하여 접속 즉시 상대방 편지 확인
- [ ] 쪽지 작성 시 작성자를 현재 `myRole`로 자동 선택

### Task 4: 회귀 테스트 및 배포 검증
- **Files:** `tests/test_couple_calendar_e2e.py`, `index.html`
- [ ] E2E 전체 테스트 실행 및 ALL PASS 확인 (GREEN)
- [ ] Downloads 사본 및 옵시디언 vault 동기화
- [ ] GitHub Pages 커밋 & 푸시 후 실서버 배포 검증
