---
title: 달콤살벌 캘린더 상대방 최신 쪽지 알림 카드 원자적 구현 계획서
version: v1.3
status: active
created: 2026-11-03
updated: 2026-11-03
author: 마스터 AI
tags:
  - CoupleCalendar
  - ImplementationPlan
  - TDD
  - BiteSized
---

# 달콤살벌 캘린더 상대방 최신 쪽지 알림 카드 원자적 구현 계획서 (v1.3)

> [!IMPORTANT] **TDD & 원자적 실행 원칙**  
> 모든 작업은 2~5분 단위의 원자적 스텝으로 분해되며, 테스트 작성 ➔ 실패 확인(Red) ➔ 구현(Green) ➔ 리팩터링 및 동기화 배포 주기로 수행됩니다.

---

## 작업 단위 분해 (Bite-Sized Tasks)

### Task 1: 테스트 케이스 확장 (Red Phase)
- **대상 파일**: `tests/test_couple_calendar_e2e.py`
- **세부 스텝**:
  1. `test_spouse_latest_note_alert_card` 테스트 메서드 추가:
     - HTML 내 `id="latest-note-alert-card"` 존재 검증.
     - `renderLatestNoteAlertCard` 함수 선언 검증.
     - `toggleMyRole`, `quickReactLatestNote`, `quickReplyLatestNote` 함수 및 관련 요소 검증.
  2. 테스트 실행하여 실패(Red) 확인.

### Task 2: CSS 스타일링 작성
- **대상 파일**: `index.html` (`<style>`)
- **세부 스텝**:
  1. `.latest-note-alert-card` 및 `.is-new` 글로우 애니메이션 스타일 추가.
  2. 발신자 헤더, 카테고리 칩, 펄스 뱃지, 말풍선 본문 스타일 추가.
  3. 원터치 액션 버튼 그룹(`.note-alert-actions`) 스타일링.
  4. 헤더의 내 프로필 전환 칩(`.my-role-toggle-chip`) 스타일링.

### Task 3: HTML 마크업 삽입
- **대상 파일**: `index.html`
- **세부 스텝**:
  1. 헤더(`couple-title` 우측 또는 하단)에 내 프로필 퀵 토글 칩 마크업 추가.
  2. `calendar-view` 최상단(음주 티켓 배너 아래, 캘린더 네비게이션 위)에 `<section id="latest-note-alert-card"></section>` 배치.

### Task 4: 자바스크립트 로직 구현 (Green Phase)
- **대상 파일**: `index.html` (`<script>`)
- **세부 스텝**:
  1. `myRole` 상태 관리:
     - `getMyRole()`, `setMyRole(role)`, `toggleMyRole()` 구현.
     - 로컬 스토리지 `couple_my_role` 연동 (기본값: `'user1'`).
  2. `renderLatestNoteAlertCard()` 구현:
     - 상대방(`myRole === 'user1' ? 'user2' : 'user1'`)의 최신 쪽지 검색.
     - 최신 쪽지 내용, 발신자, 카테고리, 상대 시간, 리액션 수 렌더링.
     - 미확인 여부 확인 및 펄스 뱃지 부착.
     - 엠프티 상태(쪽지 없을 때의 격려 문구 및 작성 버튼) 처리.
  3. 인터랙션 핸들러 구현:
     - `quickReactLatestNote(id)`: 하트 수 즉시 증가, 챠임벨 재생, 동기화 호출.
     - `quickReplyLatestNote()`: 모달 오픈 및 상대방으로 타겟팅 자동 전환.
     - `markLatestNoteAsRead(id)`: 읽음 처리.
  4. 렌더링 파이프라인 연계:
     - `renderAll()` 및 `syncWithGist()` 완료 시점에 `renderLatestNoteAlertCard()` 자동 호출.

### Task 5: 단위 테스트 및 브라우저 검증
- **세부 스텝**:
  1. `python3 tests/test_couple_calendar_e2e.py` 실행하여 Green 확인.
  2. `node`를 통해 JS 문법 완결성 확인.
  3. 워크스페이스 사본과 git 저장소 사본 동기화.

### Task 6: GitHub Pages 배포 및 SSOT 정본 갱신
- **세부 스텝**:
  1. git commit & push to `origin main`.
  2. GitHub Actions Pages 빌드 완료 확인.
  3. `_ACTIVE_PLANS.md` 정본 목록 갱신.
