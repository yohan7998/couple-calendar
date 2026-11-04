---
title: 달콤살벌 캘린더 쪽지 및 메모 읽음/안읽음 분리 표현 원자적 구현 계획서
version: v2.2.0
status: active
created: 2026-11-04
updated: 2026-11-04
author: 마스터 AI
tags:
  - CoupleCalendar
  - ImplementationPlan
  - TDD
  - FreeSessionWorkers
---

# [Active SSOT] 쪽지 및 메모 읽음/안읽음 분리 표현 원자적 구현 계획서 (v2.2.0)

> [!NOTE] **Superpowers 프레임워크 (Writing-Plans & TDD) 준수**  
> 본 계획서는 Free세션 워커 3개 트랙에게 명확하고 구체적인 단일 책임 업무를 하달하고, 마스터 AI가 최종 통합 및 검증을 완료하기 위한 2~5분 단위 원자적 스텝을 규정합니다.

---

## 1. 워커별 작업 패키지 및 프롬프트 명세

### 1.1 Track Read-A (워커 1651): `modules/read_status_engine.js`
- **목표**: 순수 자바스크립트 엔진으로 읽음 상태 판정, 변경, 집계 및 직렬화 로직 구현.
- **제공 API**:
  - `isNoteRead(note, userRole)`: 수신자가 본인일 때 해당 사용자가 읽었는지 여부 판정 (작성자는 기본 true, 수신자는 `read` 또는 `readBy.includes(userRole)` 확인)
  - `markNoteAsRead(note, userRole)`: 쪽지를 읽음 상태로 갱신 (`read: true`, `readAt: ISOString`, `readBy` 추가)
  - `markNoteAsUnread(note, userRole)`: 읽지 않음으로 되돌리기
  - `getUnreadNotesCount(notes, userRole)`: 수신된 쪽지 중 아직 읽지 않은 개수 반환
  - `markAllNotesAsRead(notes, userRole)`: 수신된 모든 미확인 쪽지를 일괄 읽음 처리
  - `isScheduleMemoRead(schedule, userRole)`: 상대방이 등록한 메모의 읽음 여부 판정
  - `markScheduleMemoAsRead(schedule, userRole)`: 일정 메모 읽음 처리
  - `getUnreadMemoCountForDate(schedules, dateStr, userRole)`: 특정 일자에 미확인 메모가 있는지 여부 및 개수 반환
  - `mergeReadStatus(localItem, remoteItem)`: 양방향 동기화 시 최신 읽음 상태 병합

### 1.2 Track Read-B (워커 1656): `modules/read_status.css`
- **목표**: Apple/Toss 스타일의 모던 UI 컴포넌트 스타일 작성.
- **포함 클래스**:
  - `.note-card.unread`: 볼드 폰트, 미세 테두리 강조, 섀도우
  - `.note-card.read`: 차분한 슬레이트 폰트, 톤다운 배경
  - `.badge-unread-new`: 산뜻한 핫핑크/로즈 마이크로 뱃지
  - `.dot-unread-pulse`: 6px 펄스 애니메이션 도트
  - `.read-status-label`: `✓ 읽음` 또는 `✓ 10:24 확인` 텍스트 레이블
  - `.btn-mark-all-read`: 상단에 배치되는 깔끔한 모두 읽음 버튼
  - `.badge-memo-unread`: 캘린더 날짜 셀 내 메모 미확인 인디케이터
  - `.schedule-memo-box.unread`: 모달 내 미확인 메모 강조 박스

### 1.3 Track Read-C (워커 1685): `tests/test_read_status.py`
- **목표**: Python unittest 기반 완벽한 TDD 테스트 스위트 작성.
- **테스트 항목**:
  1. 쪽지 작성자가 볼 때 vs 수신자가 볼 때 읽음 판정
  2. 쪽지 읽음 처리 시 `read: true`, `readAt`, `readBy` 업데이트 검증
  3. 쪽지 읽지않음 수동 토글 검증
  4. 수신함별 읽지 않은 쪽지 개수(`getUnreadNotesCount`) 정확도
  5. 일괄 모두 읽음(`markAllNotesAsRead`) 처리 검증
  6. 일정 메모(`schedule.memo`) 읽음 상태 및 특정 날짜 미확인 메모 판정
  7. 양방향 동기화(`mergeReadStatus`) 시 상태 보존 검증
  8. CSS 선택자 무결성 검증

---

## 2. 실행 일정 및 마스터 AI 통합 계획

1. **Step 1: 워커 디스패치 (즉시)**  
   - 마스터 AI가 파이썬 소켓 디스패처(`dispatch_read_workers.py`)를 통해 3개 워커에게 각자 프롬프트 전송.
2. **Step 2: 워커 작업 산출 대기 & 단위 테스트 검증**  
   - `python3 tests/test_read_status.py` 실행하여 통과 확인.
3. **Step 3: 마스터 AI 단일 파일 통합 (`index.html`)**  
   - `read_status_engine.js` 및 `read_status.css` 모듈을 `index.html`에 인라인 및 링크 적용.
   - 쪽지함 렌더링(`renderNotes`), 캘린더 일자 렌더링(`renderCalendar`), 최신 쪽지 카드(`renderLatestNoteAlertCard`), 상단 뱃지 갱신(`updateNotesBadge`) 로직에 통합.
4. **Step 4: 브라우저 실측 및 E2E 회귀 검증**  
   - 56개 기존 테스트 + 신규 테스트 전체 통과 확인.
   - agent-browser 실측으로 모바일/웹 뷰포트에서 읽음/안읽음 시각 차이 확인.
5. **Step 5: 옵시디언 vault 동기화, CHANGELOG 갱신, Git 커밋/푸시 배포**

