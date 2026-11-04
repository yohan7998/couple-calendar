---
title: 안 읽은 쪽지 브러시 언베일(Brush Reveal) 인터랙션 원자적구현계획서 (v2.3.0)
version: v2.3.0
status: active
created: 2026-11-04
author: 최고 마스터 AI (Antigravity)
tags:
  - CoupleCalendar
  - AtomicPlan
  - TDD
  - MultiAgent
  - ObsidianSSOT
---

# [Active SSOT] 안 읽은 쪽지 브러시 언베일(Brush Reveal) 인터랙션 원자적구현계획서 (v2.3.0)

> [!IMPORTANT] **마스터-워커 협업 실행 지침**  
> 본 계획서는 `_MULTI_AGENT_PROTOCOL.md` 규약에 따라 워커 세션(옆세션)과 최고 마스터 AI가 충돌 없이 2~5분 단위의 TDD 사이클로 개발할 수 있도록 설계된 실행 계획입니다.

---

## 1. 업무 분담 및 파일 소유권 (Ownership Matrix)

| 트랙 | 담당 세션 | 생성 및 수정 대상 파일 | 산출물 및 완료 기준 |
| :---: | :---: | :--- | :--- |
| **Track Brush-A** | 워커 (옆세션) | `modules/brush_reveal_effect.js` | 캔버스 기반 브러시 터치 & 원터치 스위프 엔진 구현 (`node -c` 무오류) |
| **Track Brush-B** | 워커 (옆세션) | `modules/brush_reveal.css` | 블러 오버레이, 쉬머, 브러시 패스, 스파클 버스트 CSS 스타일 |
| **Track Brush-C** | 워커 (옆세션) | `tests/test_brush_reveal.py` | 10개 이상의 브러시 엔진 런타임 및 수치 검증 TDD 테스트 (100% PASS) |
| **Track Master-M** | 최고 마스터 AI | `index.html`, `sw.js`, 배포 | 워커 산출물 검수, `index.html` 바인딩, 브라우저 실측, git commit & push |

---

## 2. 단계별 원자적 구현 계획 (Atomic Steps)

### Step 1: 워커 세션 락 획득 및 규약 확인 (Worker Check-in)
- 워커(옆세션)는 `_SESSION_LOCK.json`과 `_MULTI_AGENT_PROTOCOL.md`를 확인하고 작업 시작을 선언한다.
- `index.html`을 건드리지 않고 오직 `modules/` 및 `tests/`에서만 작업한다.

### Step 2: Track Brush-A — 브러시 언베일 엔진 개발 (`modules/brush_reveal_effect.js`)
- UMD/IIFE 패턴으로 패키징하여 브라우저와 Node.js 환경 모두 완벽 대응.
- `BrushRevealEngine.attach(cardElement, noteId, onComplete)`:
  - 쪽지 내용 위에 오버레이 캔버스 및 감성 터치 가이드(`🎨 살포시 터치해서 열어보기`) 배치.
  - 마우스/터치 드래그 시 반경 28px의 부드러운 수채화 원형 브러시로 캔버스를 긁어냄 (`globalCompositeOperation = 'destination-out'`).
  - 50% 이상 지워지면 자동으로 전체 페이드아웃 및 완료 콜백 트리거.
- `BrushRevealEngine.sweepReveal(canvas, onComplete)`:
  - 원터치 탭 시 0.55초간 베지에 곡선으로 브러시가 스윽 지나가며 자연스럽게 내용 개봉.
- `BrushRevealEngine.burstSparkles(x, y)`:
  - 8개의 스파클(✨💕) 파티클 생성 및 페이드아웃.

### Step 3: Track Brush-B — 감성 브러시 스타일 구축 (`modules/brush_reveal.css`)
- `.note-content.unrevealed`: 블러(8px) + 불투명도(0.15) + 드래그 방지.
- `.note-content.revealed`: 선명화(0px) + 불투명도(1) + 400ms 부드러운 트랜지션.
- `.brush-cover-overlay`: 샴페인 로즈 펄 글래스모피즘 그라데이션 및 부드러운 쉬머.
- `.sparkle-particle`: 8방향 팝 애니메이션 키프레임.

### Step 4: Track Brush-C — TDD 단위 테스트 스위트 (`tests/test_brush_reveal.py`)
- Python unittest로 Node.js vm을 구동하여 브러시 엔진의 메서드 존재, 계산 로직, CSS 선택자 및 애니메이션 키프레임 존재 여부를 철저히 검증.

### Step 5: Track Master-M — 최고 마스터 AI의 최종 통합 및 배포
- 마스터 AI가 워커의 단위 테스트 통과 보고를 접수.
- `index.html`의 `<head>`에 `brush_reveal.css`와 `brush_reveal_effect.js` 링크.
- 쪽지 카드 렌더러(`renderNoteCardList`)에서 미확인 쪽지에 `BrushRevealEngine.attach()` 바인딩.
- 브라우저 실측 시각화 검증 (`agent-browser` 활용).
- `_SESSION_LOCK.json` 락 해제, CHANGELOG 기록, GitHub 배포.

