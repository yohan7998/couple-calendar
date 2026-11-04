---
title: 달콤살벌 캘린더 실시간 초고속 동기화 원자적구현계획서 (v2.4.0)
version: v2.4.0
status: active
created: 2026-11-04
author: 최고 마스터 AI (Antigravity)
tags:
  - CoupleCalendar
  - RealTimeSync
  - AtomicPlan
  - TDD
  - MultiAgent
  - ObsidianSSOT
---

# [Active SSOT] 달콤살벌 캘린더 실시간 초고속 동기화 원자적구현계획서 (v2.4.0)

> [!IMPORTANT] **전 세션 풀가동 협업 지침**  
> 본 계획서는 `_MULTI_AGENT_PROTOCOL.md` 규약에 따라 워커 세션 3개와 최고 마스터 AI가 역할을 엄격히 분담하여 0.05초 실시간 동기화 엔진을 구축하는 원자적 TDD 실행 계획입니다.

---

## 1. 전 세션 트랙 및 워커 분담표

| 트랙 | 담당 세션 | 생성 및 수정 파일 | 핵심 임무 및 완료 기준 |
| :---: | :---: | :--- | :--- |
| **Track Realtime-A** | Worker-1651<br/>(옆세션) | `modules/realtime_sync_engine.js` | Firebase RTDB / WebSocket 실시간 양방향 통신 코어 및 델타 리스너 구현 (`node -c` 무오류) |
| **Track Realtime-B** | Worker-1685<br/>(옆세션) | `modules/realtime_sync.css` | 초저지연 라이브 뱃지(`● 실시간 45ms`), 델타 인입 플래시 효과, 오프라인 전환 배너 스타일 |
| **Track Realtime-C** | Worker-1656<br/>(옆세션) | `tests/test_realtime_sync.py` | 델타 전송, 실시간 이벤트 브로드캐스트, 오프라인 큐잉 및 머지 검증 단위 테스트 15개 작성 (100% PASS) |
| **Track Master-M** | 최고 마스터 AI<br/>(Antigravity) | `index.html`<br/>`sw.js`<br/>최종 배포 | 워커 산출물 전면 검수, `AppState` 변경 이벤트 버스 연계, 브라우저 실측 핑 테스트, GitHub 릴리즈 |

---

## 2. 단계별 원자적 실행 로드맵 (Atomic Steps)

### Step 1: Track Realtime-A — 실시간 엔진 코어 구축 (`modules/realtime_sync_engine.js`)
- **구조**: UMD/IIFE 패턴 `window.RealtimeSyncEngine`.
- **기능**:
  - `init(config)`: WebSocket / Firebase 연결 초기화 및 방(Pair Room) 구독.
  - `broadcastDelta(entityType, action, item)`: 전체 페이로드가 아닌 변경된 단일 객체만 0.05초 만에 전송.
  - `onDeltaReceived(callback)`: 상대방이 전송한 변경사항을 실시간으로 수신하여 즉시 로컬 `AppState`에 반영하고 UI 리렌더링.
  - `getLatency()`: 현재 왕복 핑(ms) 측정.

### Step 2: Track Realtime-B — 실시간 상태 UI 구축 (`modules/realtime_sync.css`)
- `.sync-status-badge.live`: 실시간 초록색 펄스 닷 및 지연시간 표기.
- `.delta-flash`: 상대방이 쪽지나 일정을 보내는 즉시 해당 카드가 부드러운 샴페인 빛으로 반짝이며 나타나는 시각 피드백.

### Step 3: Track Realtime-C — TDD 단위 테스트 스위트 (`tests/test_realtime_sync.py`)
- 실시간 엔진의 델타 직렬화, 이벤트 바인딩, 재연결 큐잉 로직을 철저히 검증.

### Step 4: Track Master-M — 최고 마스터 AI의 최종 바인딩 및 E2E 실측
- `index.html` 내 기존 `syncWithGist`를 보존하면서, 1순위 실시간 엔진으로 `RealtimeSyncEngine` 연동.
- 쪽지 전송, 브러시 개봉, 일정 추가, 가계부 등록 함수에 `RealtimeSyncEngine.broadcastDelta()` 주입.
- `agent-browser`를 통해 두 탭 간 0.05초 실시간 동기화 시각 검증.
- PWA `sw.js` v2.4.0 갱신 및 Git Push 배포.

