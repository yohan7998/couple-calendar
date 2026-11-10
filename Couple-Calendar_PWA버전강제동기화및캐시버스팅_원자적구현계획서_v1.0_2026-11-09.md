---
status: active
version: v1.0
date: 2026-11-09
project: couple-calendar
category: Atomic Implementation Plan
author: 최고 마스터 AI (Antigravity) & Free Worker Sessions
---

# Couple-Calendar PWA 버전 강제 동기화 및 캐시 버스팅 원자적 구현계획서 (v1.0)

> [!IMPORTANT]
> **Active SSOT Plan**: 본 문서는 모바일 및 PC 브라우저에서 최신 버전(v2.9.2)이 즉각 내려받아지도록 에셋 캐시 버스팅, 서비스워커 수명주기 훅, 원격 버전 감시 엔드포인트를 구현하기 위한 원자적 작업 분담 및 실행 계획서입니다.

---

## 1. 분기별 워커 태스크 분담 (WBS)

| 태스크 ID | 담당 세션 | 목표 파일 | 주요 구현 내용 |
|:---|:---|:---|:---|
| **TASK-PWA-1** | Free Worker 1 (PID 62984) | `version.json`, `sw.js` | 1. `version.json` 신설 (v2.9.2, timestamp, description)<br>2. `sw.js` 캐시명을 `couple-calendar-v2.9.2`로 승격<br>3. `sw.js` fetch 이벤트 핸들러에서 `/version.json`을 `no-store` 네트워크 직통으로 우회 |
| **TASK-PWA-2** | Free Worker 2 (PID 95842) | `index.html` | 1. 상단 타이틀, 메타 태그, 헤더 뱃지, 설정 화면, 버튼 전면 `v2.9.2` 동기화<br>2. 전체 CSS/JS 로컬 모듈 링크에 `?v=2.9.2` 쿼리스트링 부착<br>3. `forcePurgeAppCache()` 및 DOM 로드 시 자동 캐시 버스팅 로직을 `v2.9.2`로 승격<br>4. PWA Service Worker 등록 시 `updateViaCache: 'none'`, `reg.update()`, `controllerchange` 자동 리로드 추가<br>5. `visibilitychange` 이벤트 기반 원격 `version.json` 감시 트리거 연결 |
| **TASK-PWA-3** | Free Worker 3 (PID 4877) | `tests/test_pwa_cache_sync.py` | 1. PWA 버전 동기화 및 캐시 버스팅 단위 테스트 스위트 작성<br>2. `index.html`, `sw.js`, `version.json` 간의 버전 무결성 검증 (6개 항목) |

---

## 2. 세부 실행 순서 (2~5분 단위 원자적 단계)

### Step 1: 워커 작업 지시서 작성 및 소켓 하달
- `_FREE_WORKER_TASKS.json` 업데이트
- `/tmp/cc-socks/` 소켓을 통해 각 워커(PID 62984, 95842, 4877)에게 작업 페이로드 발송

### Step 2: `version.json` 및 `sw.js` 배포 (Free Worker 1)
- `version.json` 생성
- `sw.js`의 `CACHE_NAME` 승격 및 `version.json` 캐시 바이패스 추가

### Step 3: `index.html` 전방위 버전 및 쿼리스트링 동기화 (Free Worker 2)
- 타이틀, 메타, UI 뱃지, 버전 텍스트, 스크립트/스타일 태그 쿼리스트링 일괄 갱신
- 자동 캐시 삭제, PWA 등록 훅 및 visibilitychange 감시 함수 연결

### Step 4: 단위 테스트 작성 및 전수 회귀 테스트 (Free Worker 3 & Master AI)
- `test_pwa_cache_sync.py` 작성
- 전체 162개 기존 테스트 + 신규 테스트 통합 실행 (전체 통과 확인)

### Step 5: 형상 관리 및 라이브 배포 실측 검증
- Git 커밋 및 GitHub 원격 저장소(`main`) Push
- `curl`을 통해 `https://yohan7998.github.io/couple-calendar/` 및 `version.json`의 실시간 응답 상태 및 헤더 검증
