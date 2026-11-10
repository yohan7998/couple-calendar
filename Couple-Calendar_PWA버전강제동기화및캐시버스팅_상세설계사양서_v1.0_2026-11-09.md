---
status: active
version: v1.0
date: 2026-11-09
project: couple-calendar
category: PWA Version Sync & Multi-Platform Cache Busting
author: 최고 마스터 AI (Antigravity) & Free Worker Sessions
---

# Couple-Calendar PWA 버전 강제 동기화 및 캐시 버스팅 상세설계사양서 (v1.0)

> [!IMPORTANT]
> **Active SSOT**: 본 문서는 모바일(iOS Safari/PWA Standalone, 안드로이드 Chrome) 및 데스크톱 PC 브라우저에서 신규 버전(v2.9.1 / v2.9.2)이 캐시 및 PWA Service Worker로 인해 즉시 반영되지 않고 구버전(v2.8.9 / v2.8.7)으로 표시되던 현상을 원천 차단하기 위한 전방위 캐시 버스팅 및 능동적 버전 자동 갱신 아키텍처의 정본 사양서입니다.

---

## 1. 문제 분석 및 근본 원인 (Root Cause Analysis)

### 1.1 하드코딩된 구버전 UI 표기
- `index.html` 상단 `<title>`: `달콤살벌 캘린더 💖⚔️ (v2.8.9)`로 고정
- `<meta name="version" content="v2.8.9">`
- 헤더 버전 뱃지: `<span class="app-version-badge">v2.8.9 ⚡</span>`
- 설정 탭 정보: `달콤살벌 캘린더 정본 v2.8.7`
- 강제 업데이트 버튼 텍스트: `최신 버전 강제 업데이트 (v2.8.9)`
- `forcePurgeAppCache()` 내 토스트 및 리다이렉트: `?v=2.7.0`으로 구버전 파라미터 전달

### 1.2 정적 에셋(CSS/JS) 쿼리스트링 고정 및 누락
- `modules/real_estate.*.js`, `modules/naver_radar.*.js` 등 핵심 모듈이 `?v=2.8.0`으로 고정되어 브라우저/CDN 디스크 캐시에서 구버전 JS가 계속 로드됨.
- `modern_components.css`, `read_status.*`, `brush_reveal.*`, `realtime_sync.*` 등은 버전 쿼리스트링조차 없어 캐시 갱신 지연 발생.

### 1.3 Service Worker 수명주기 및 PWA 자동 갱신 트리거 결여
- `sw.js` 등록 시 `updateViaCache: 'none'` 옵션 누락으로 인한 브라우저의 `sw.js` 자체 캐싱.
- 페이지 로드 시 `reg.update()` 미실행 (모바일 Safari PWA 특성상 수동 백그라운드 체크 지연).
- `navigator.serviceWorker.oncontrollerchange` 이벤트 리스너 부재: 신규 SW가 `skipWaiting()` 및 `claim()` 하더라도 열려있는 클라이언트 탭이 즉시 리로드되지 않음.
- 서버 상의 최신 버전을 감지할 수 있는 독립 메타데이터(`version.json`) 부재.

---

## 2. 해결 아키텍처 설계

### 2.1 단일 진실 공급원 버전 메타데이터 (`version.json`) 신설
- 루트 경로에 `version.json`을 배치하고, 브라우저 및 Service Worker에서 절대 캐시되지 않도록 `cache: 'no-store'` 및 SW Fetch 우회 적용.
- 구조:
  ```json
  {
    "version": "v2.9.2",
    "build": "20261109-1705",
    "description": "PWA 전방위 캐시 버스팅 및 모바일/PC 자동 업데이트 동기화",
    "timestamp": 1794211500000
  }
  ```

### 2.2 전방위 버전 명시 및 쿼리스트링 동기화 (`v2.9.2`)
- `index.html`의 모든 타이틀, 메타 태그, 버전 뱃지, 설정 화면 텍스트를 `v2.9.2`로 전면 일치.
- 모든 로컬 스크립트 및 스타일시트에 `?v=2.9.2` 쿼리스트링을 명시하여 브라우저 HTTP/디스크 캐시를 즉시 버스팅.

### 2.3 지능형 3단계 능동적 버전 체크 & PWA 자가 치유(Self-Healing)
1. **1단계 (DOM 진입 시 빌드 버전 불일치 감지)**:
   - `localStorage.getItem('couple_app_build_v') !== 'v2.9.2'` 감지 시 전체 `caches.delete()`, 로컬스토리지 갱신, 서비스워커 강제 업데이트(`reg.update()`) 및 갱신 토스트 표출.
2. **2단계 (PWA 컨트롤러 전환 감지 - Controller Change Reload)**:
   - `navigator.serviceWorker.addEventListener('controllerchange')`를 등록하여 신규 서비스워커 활성화 즉시 자동 새로고침.
3. **3단계 (원격 버전 감시 및 포커스 복귀 시 체크 - Visibility Change Check)**:
   - 모바일 홈 화면 PWA에서 앱으로 복귀(`visibilitychange: visible`)하거나 주기적으로 `version.json`을 `fetch(..., { cache: 'no-store' })`하여 서버의 최신 버전과 불일치할 경우 즉시 최신 버전으로 캐시를 비우고 새로고침.

---

## 3. 컴포넌트별 상세 변경 규격

### 3.1 `version.json` (신규)
- 파일 경로: `/Users/yohan/couple-calendar/version.json`
- 배포 시 항상 버전 번호와 빌드 타임스탬프 갱신.

### 3.2 `sw.js` (수정)
- `CACHE_NAME = 'couple-calendar-v2.9.2'`
- `version.json` 요청 시 캐시 우회(`no-store`) 처리.

### 3.3 `index.html` (수정)
- 메타/타이틀/UI 뱃지/설정 텍스트 -> `v2.9.2` 동기화.
- CSS/JS 20여 종 에셋 URL -> `?v=2.9.2` 파라미터 적용.
- `forcePurgeAppCache()` -> 리다이렉트 URL `?v=2.9.2&t=Date.now()` 반영.
- `serviceWorker.register('./sw.js?v=2.9.2', { updateViaCache: 'none' })` 및 `controllerchange` 리스너 추가.
- `visibilitychange` 이벤트에 원격 버전 체크 연결.

### 3.4 `tests/test_pwa_cache_sync.py` (신규)
- 버전 불일치 회귀 방지를 위한 6개 핵심 단언 단위 테스트 구현.
