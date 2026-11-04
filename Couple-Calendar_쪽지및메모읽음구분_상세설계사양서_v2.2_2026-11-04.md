---
title: 달콤살벌 캘린더 쪽지 및 메모 읽음/안읽음 분리 표현 상세 설계 사양서
version: v2.2.0
status: active
created: 2026-11-04
updated: 2026-11-04
author: 마스터 AI
tags:
  - CoupleCalendar
  - Notes
  - Schedules
  - ReadStatus
  - ObsidianSSOT
---

# [Active SSOT] 달콤살벌 캘린더 쪽지 및 메모 읽음/안읽음 분리 표현 상세 설계 사양서 (v2.2.0)

> [!IMPORTANT] **단일 진실 공급원 (Single Source of Truth) 원칙**  
> 본 문서는 쪽지(Notes) 및 일정 메모(Schedule Memos) 기능에서 배우자 간 메시지 확인 여부를 직관적이고 세련되게 시각화하기 위한 데이터 모델, UI 컴포넌트, 인터랙션 및 Gist 동기화 표준을 정의합니다.

---

## 1. 배경 및 요구사항

### 1.1 사용자 요청
> "쪽지와 메모기능에 읽음과 읽지않음 표시를 분리표현해줘. 당연히 너가 하지말고 free세션 시켜라."

### 1.2 핵심 목적
1. **확인 여부의 즉각적 인지**: 배우자가 보낸 사랑/응원/약속 쪽지 및 일정에 등록된 주요 메모를 상대방이 확인했는지 여부를 시각적으로 명확히 분리 표현.
2. **세련된 모던 인디케이터 (Apple/Toss 감성)**: 촌스러운 텍스트 남발 대신, 미확인 도트(Unread Pulse Dot), `NEW` 마이크로 뱃지, 읽은 시각 타임스탬프(`10:24 읽음`), 차분한 뉴트럴 톤 다운을 통해 고품격 UI 구현.
3. **캘린더-쪽지 유기적 브릿지**: 캘린더 일자에 부착된 일정 메모에도 읽음 상태를 추적하여 달력 셀에서 미확인 메모 여부를 즉시 파악 가능.
4. **무손실 양방향 동기화**: GitHub Gist 연동 시 읽음 상태(`read`, `readAt`, `readBy`)가 충돌 없이 보존되는 데이터 머지 보장.

---

## 2. 데이터 모델 및 스키마 확장

### 2.1 쪽지 모델 (`Note`)
```typescript
interface Note {
  id: string;               // 예: "n-1793700000000"
  date: string;             // 작성일 (YYYY-MM-DD)
  time?: string;            // 작성 시각 (HH:mm)
  author: 'user1' | 'user2';// 작성자 (user1: 주니 🐻, user2: 용이 🐰)
  content: string;          // 쪽지 본문 내용
  tag?: string;             // 태그 (사랑/응원, 약속, 장보기, 비밀 등)
  reactions: number;        // 하트 수 (0 또는 1)
  likedBy?: string[];       // 하트 누른 사용자 목록
  read?: boolean;           // 수신자 확인 여부 (true | false, 기본 false)
  readAt?: string;          // 읽은 시각 (ISO 8601 문자열 또는 HH:mm)
  readBy?: string[];        // 읽은 사용자 ID 배열 (예: ['user2'])
}
```

### 2.2 일정 메모 모델 (`Schedule`)
```typescript
interface Schedule {
  id: string;               // 예: "s-1793700000000"
  date?: string;            // 단일 일정일 (YYYY-MM-DD)
  startDate?: string;       // 시작일 (YYYY-MM-DD)
  endDate?: string;         // 종료일 (YYYY-MM-DD)
  title: string;            // 일정 제목
  memo?: string;            // 상세 메모 (장소, 준비물, 약속 내용 등)
  sharedAsNote?: boolean;   // 쪽지함 전달 여부
  category?: string;        // 카테고리 (데이트, 기념일, 가족, 개인 등)
  author?: 'user1' | 'user2';
  memoRead?: boolean;       // 배우자의 메모 확인 여부 (기본 false)
  memoReadAt?: string;      // 메모 확인 시각
}
```

---

## 3. UI/UX 디자인 및 시각화 명세

### 3.1 쪽지함(Notes View)의 읽음/안읽음 분리 표현
1. **읽지 않은 쪽지 (Unread Card)**:
   - **배경**: 화이트 서피스 + 미세 로즈 글로우 테두리 (`border: 1.5px solid rgba(244, 63, 94, 0.4)`)
   - **인디케이터**: 좌측 상단 `NEW` 뱃지 (`background: #F43F5E; color: #FFF; font-size: 10px; font-weight: 800; border-radius: 4px; padding: 2px 5px;`)
   - **상태 도트**: 부드럽게 반짝이는 펄스 도트 (`animation: unreadPulse 2s infinite ease-in-out;`)
   - **타이포**: 본문 굵기 볼드(`font-weight: 700; color: #0F172A;`)
2. **읽은 쪽지 (Read Card)**:
   - **배경**: 뉴트럴 슬레이트 서피스 (`background: #FFFFFF; border: 1px solid #E2E8F0;`)
   - **상태 라벨**: 우측 하단 또는 상단에 `✓ 읽음` 또는 `✓ 10:24 확인` (컬러: `#64748B`, 폰트 11px)
   - **타이포**: 차분한 정돈 톤 (`font-weight: 500; color: #334155;`)
3. **편의 기능 액션바**:
   - `[✓ 모두 읽음]` 원클릭 버튼 제공 (수신함 상단에 배치하여 밀린 쪽지 일괄 정리).
   - 쪽지 개별 카드에 읽음/안읽음 수동 토글 스위치 제공.

### 3.2 캘린더 및 일정 메모(Schedule Memos)의 읽음 분리 표현
1. **캘린더 일자 그리드 셀**:
   - 일정에 미확인 메모가 있을 경우: 보라색/인디고 메모 뱃지 옆에 미확인 알림 닷(`dot-memo-unread`, 6px 로즈 도트) 표기.
2. **일정 상세 바텀시트 (`day-detail-modal`)**:
   - 메모 본문 상단에 `[미확인 메모]` 뱃지 표시.
   - 모달을 열어 메모를 확인하는 즉시 `memoRead: true`로 자동 전환되며 `✓ 확인 완료` 상태로 전환.

### 3.3 뱃지 카운트 실시간 정합성
- 상단 탭: `💌 쪽지함 (N)` — 전체 개수가 아닌 **내가 아직 읽지 않은 쪽지 개수(Unread Count)**를 표시. 모두 읽으면 뱃지 숨김.
- 하단 네비게이션: `#nav-notes` 우측 상단 미확인 붉은 닷(Red Dot Badge) 표시.

---

## 4. Free세션 워커 분담 WBS (Work Breakdown Structure)

| 트랙 | 담당 워커 | 산출 파일 | 핵심 업무 범위 |
| :---: | :---: | :--- | :--- |
| **Track Read-A** | `PID 1651` | `modules/read_status_engine.js` | • `ReadStatusEngine` 모듈 구현<br/>• `isNoteRead(note, myRole)`<br/>• `markNoteAsRead(noteId, readerRole)`<br/>• `markAllNotesAsRead(notes, myRole)`<br/>• `getUnreadNotesCount(notes, myRole)`<br/>• `isScheduleMemoRead(schedule, myRole)`<br/>• `markScheduleMemoAsRead(scheduleId, readerRole)`<br/>• Gist 동기화 무손실 병합 호환성 지원 |
| **Track Read-B** | `PID 1656` | `modules/read_status.css` | • Apple/Toss 모던 읽음/안읽음 시각화 스타일링<br/>• `.note-card.unread`, `.note-card.read`<br/>• `.badge-new`, `.dot-pulse`, `.read-timestamp`<br/>• `.schedule-memo-unread-indicator`<br/>• 다크모드 및 접근성(`prefers-reduced-motion`) 지원 |
| **Track Read-C** | `PID 1685` | `tests/test_read_status.py` | • TDD 전용 테스트 스위트 작성 (12개 이상 검증 항목)<br/>• 쪽지 읽음 판정 및 타임스탬프 기록 검증<br/>• 미확인 개수 집계 정확도 검증<br/>• 일정 메모 읽음 토글 및 캘린더 인디케이터 검증<br/>• Gist 동기화 데이터 왕복 직렬화 검증 |

---

## 5. 검증 및 릴리즈 기준
1. `python3 tests/test_read_status.py` 100% 통과 (All Green).
2. 기존 회귀 테스트 (`test_couple_calendar_e2e.py`, `test_modern_design.py` 등 56개) 100% 통과 유지.
3. agent-browser 실측: 모바일/웹에서 읽음/안읽음 시각적 차이 및 뱃지 숫자 갱신 확인.
4. 옵시디언 vault 동기화 및 `Couple-Calendar_버전기록_CHANGELOG.md` v2.2.0 기록.
