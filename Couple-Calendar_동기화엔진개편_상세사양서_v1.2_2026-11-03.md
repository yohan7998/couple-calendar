---
title: 달콤살벌 캘린더 양방향 동기화 엔진 및 온보딩 개편 사양서
version: v1.2
status: active
created: 2026-11-03
updated: 2026-11-03
author: 마스터 AI
tags:
  - CoupleCalendar
  - SyncEngine
  - GitHubGist
  - TwoWayMerge
---

# 달콤살벌 캘린더 양방향 동기화 엔진 및 온보딩 개편 사양서 (v1.2)

> [!NOTE] **배경 및 개요**  
> 사용자와 배우자가 `달콤살벌 캘린더` 웹앱을 설치한 후 발생한 데이터 미동기화 문제의 근본 원인을 진단하고, 양방향 2-Way Merge 알고리즘, Secret Gist 1초 자동 생성기, 카카오톡 인앱 브라우저 감지 안내 배너, 원클릭 동기화 키(SyncKey) 공유 체계를 구축하여 완벽한 데이터 무손실 동기화를 달성합니다.

---

## 1. 동기화 장애 근본 원인 분석 (Root Causes)

1. **Gist 미생성 및 기본 로컬 모드 동작**:
   - 웹앱 최초 진입 시 토큰과 Gist ID가 비어 있어 `로컬 저장` 상태로만 동작함.
   - 사용자가 수동으로 GitHub Gist를 생성하고 파일명을 맞추는 절차가 너무 복잡하여 실질적인 동기화가 활성화되지 못함.
2. **파괴적 덮어쓰기 (Blind Last-Write-Wins Push)**:
   - 기존 `syncWithGist(false)`는 로컬 상태를 원격에 무조건 PATCH하여, 배우자가 작성한 쪽지나 일정을 덮어써 삭제시키는 치명적 레이스 컨디션 발생.
3. **타임스탬프 게이트 오류**:
   - 로컬에서 아무 데이터나 수정하면 `AppState.lastUpdated`가 갱신되어, 원격에서 받아오는 데이터를 타임스탬프 비교로 차단함.
4. **카카오톡 인앱 브라우저 격리**:
   - 카카오톡으로 전송된 `#syncKey=...` 링크 터치 시 카카오톡 인앱 브라우저(웹뷰)에서 열려 사파리/크롬과 로컬스토리지가 분리됨.
   - 사파리로 열었을 때 이미 URL 해시가 지워져 있어 동기화 정보가 전달되지 못함.

---

## 2. v1.2 해결 아키텍처 및 구현 명세

### A. 트랜잭션 양방향 병합 엔진 (Bidirectional 2-Way Merge Engine)
- **Pull-before-Push 원칙**:
  - 데이터를 원격에 PATCH하기 전에 항상 최신 원격 Gist 상태를 먼저 GET으로 조회.
  - 원격과 로컬의 `drinks`, `schedules`, `notes`를 고유 `id` 기준으로 합집합 병합.
  - 병합된 완전한 상태를 로컬에 반영한 후 비로소 원격에 안전하게 PATCH.
- **삭제 툼스톤(Tombstone) 추적 (`AppState.deletedIds`)**:
  - 삭제된 아이템 ID를 최대 300개까지 보관하여, 병합 시 상대방 기기의 이전 데이터로 되살아나는 버그 원천 방지.
- **쪽지 반응(Reaction) 및 승인 상태 누적 병합**:
  - 쪽지 공감 하트(`reactions`)는 양측 중 더 큰 값으로 병합되어 리액션이 증발하지 않음.

### B. 1초 Secret Gist 자동 생성기 (`autoCreateGist`)
- GitHub PAT(Classic 또는 Fine-grained with gist scope)만 입력하고 버튼을 누르면:
  - `POST https://api.github.com/gists`를 호출하여 `couple_calendar_data.json`이 담긴 비공개 Secret Gist 자동 생성.
  - 생성된 Gist ID를 즉시 연결하고 초기 데이터를 동기화.

### C. 강력한 모바일 & 카카오톡 온보딩
- URL 파라미터(`?syncKey=...`) 및 해시(`#syncKey=...`) 동시 지원.
- 카카오톡 브라우저 감지 시 상단에 노란색 가이드 배너 자동 표시:
  - `"📱 카카오톡 브라우저에서 열렸습니다. 영구 보관을 위해 우측 하단 [···] -> [Safari/기본 브라우저로 열기]를 눌러주세요."`
- 설정 모달 내 동기화 키 수동 복사/붙여넣기 지원.

---

## 3. 검증 및 배포 현황

- **GitHub Pages 실시간 배포 완료**: `https://yohan7998.github.io/couple-calendar/`
- **단일 원클릭 동기화 전용 URL 발급**: 토큰 및 Gist ID가 내장된 원클릭 초대 링크 발급
- **E2E 단위 테스트**: `tests/test_couple_calendar_e2e.py` 9개 검증 케이스 100% 통과 (0.005s)
