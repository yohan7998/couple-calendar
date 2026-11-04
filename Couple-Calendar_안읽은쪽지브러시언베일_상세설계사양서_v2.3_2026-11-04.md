---
title: 안 읽은 쪽지 브러시 언베일(Brush Reveal) 인터랙션 상세설계사양서 (v2.3.0)
version: v2.3.0
status: active
created: 2026-11-04
author: 최고 마스터 AI (Antigravity)
tags:
  - CoupleCalendar
  - BrushReveal
  - MicroInteraction
  - CanvasEngine
  - EmilDesignEng
  - ObsidianSSOT
---

# [Active SSOT] 안 읽은 쪽지 브러시 언베일(Brush Reveal) 인터랙션 상세설계사양서 (v2.3.0)

> [!IMPORTANT] **설계 철학 및 감성적 가치 (Delight & Anticipation)**  
> 단순한 기계적 깜빡임(Pulse blink) 알림을 전면 배제하고, 부부 간 쪽지를 열어볼 때의 **설렘과 기대감(Anticipation)**을 극대화하는 **수채화 브러시 스위프(Brush Sweep) & 인터랙티브 스크래치(Scratch-to-reveal)** 감성 인터랙션을 구현합니다.

---

## 1. 기존 깜빡임 방식 vs 브러시 언베일 혁신 비교

| 비교 항목 | 기존 깜빡임 (v2.2.0) | 혁신 브러시 언베일 (v2.3.0) | 사용자 경험적 차별점 |
| :--- | :--- | :--- | :--- |
| **시각적 첫인상** | 붉은색 펄스 뱃지 반복 깜빡임 (`pulseUnread`) | 은은한 샴페인 펄 수채화 캔버스로 신비롭게 블라인드 | 시스템 경고 느낌 ➔ 선물 포장지 같은 설렘 |
| **본문 노출 시점** | 쪽지함 진입 즉시 텍스트가 모두 노출됨 | 블러(8px) + 수채화 오버레이로 감춰진 채 기대감 유발 | "무슨 말이 적혀있을까?" 호기심 자극 |
| **개봉 인터랙션** | 카드 클릭 시 즉시 읽음 플래그만 변경 | 붓터치로 스윽 지워지며 텍스트가 극적으로 드러남 | 실제 종이 쪽지를 펼쳐보는 물리적 감성 |
| **상호작용 옵션** | 단순 탭 클릭 1회 | ① 원터치 붓터치 스위프<br/>② 손가락 문지르기(스크래치) | 취향과 디바이스에 맞춘 다채로운 개봉 경험 |
| **청각 및 파티클** | 단순 클릭음 | 산뜻한 챠임 팝(`playCutePop`) + 스파클(✨💖) 방출 | 시각·청각·촉각이 어우러지는 공감각적 쾌감 |

---

## 2. 브러시 언베일 시스템 아키텍처 (System Architecture)

```
┌────────────────────────────────────────────────────────────────────────┐
│                        Brush Reveal Interaction Flow                   │
└────────────────────────────────────────────────────────────────────────┘
                                 │
           [1. 미확인 쪽지 카드 렌더링 (State: Unrevealed)]
                                 │
           ┌─────────────────────┴─────────────────────┐
           ▼                                           ▼
   [모바일/터치 디바이스]                        [원클릭 / 데스크톱]
   • 손가락으로 사각사각 문지름                     • 카드 살포시 원터치 탭
   • Canvas 2D destination-out                  • SVG / CSS 브러시 패스 자동 스위프
   • 스크래치 면적 실시간 계산 (50% 도달 시)        • 0.55초 베지에 곡선 스무스 트윈
           │                                           │
           └─────────────────────┬─────────────────────┘
                                 │
                    [2. 언베일 완결 애니메이션]
                    • 남은 오버레이 부드러운 페이드아웃
                    • 스파클 파티클(✨💕) 8개 방출 버스트
                    • 귀여운 Web Audio 팝 사운드 재생
                                 │
                    [3. 상태 전환 및 동기화]
                    • ReadStatusEngine.markNoteAsRead() 호출
                    • 탭 및 하단바 미확인 뱃지 카운트 실시간 차감
                    • 언제든 다시 감추는 [안읽음] 토글 지원
```

---

## 3. 핵심 기술 명세 및 모듈 규격

### 3.1 `modules/brush_reveal_effect.js` (UMD 단독 엔진)
- **책임**: HTML5 Canvas 및 DOM 오버레이를 생성하고, 터치/마우스 이벤트 리스너를 바인딩하여 긁힘 비율 계산 및 자동 스위프 트윈을 실행.
- **핵심 메서드 API**:
  1. `BrushRevealEngine.attach(containerElement, options)`: 대상 카드에 캔버스/브러시 오버레이 주입.
  2. `BrushRevealEngine.sweepReveal(canvas, callback)`: 원터치 탭 시 부드러운 곡선 브러시 자동 스위프.
  3. `BrushRevealEngine.createSparkles(x, y, count)`: 마이크로 스파클 파티클 DOM 생성 및 물리 애니메이션 후 자동 소멸.
  4. `BrushRevealEngine.reset(containerElement)`: 안 읽음으로 되돌릴 때 오버레이 재구성.

### 3.2 `modules/brush_reveal.css` (스타일 가이드)
- **블러 마스크**:
  ```css
  .note-content.unrevealed {
    filter: blur(8px);
    opacity: 0.15;
    user-select: none;
    pointer-events: none;
    transition: filter 400ms cubic-bezier(0.16, 1, 0.3, 1), opacity 400ms ease;
  }
  .note-content.revealed {
    filter: blur(0px);
    opacity: 1;
    user-select: text;
    pointer-events: auto;
  }
  ```
- **수채화 캔버스 오버레이**:
  - 부드러운 샴페인 로즈 그라데이션(`linear-gradient(135deg, rgba(255,241,242,0.95), rgba(254,226,226,0.92))`)
  - 미세한 노이즈 텍스처 및 미러 쉬머(Shimmer) 광택
- **스파클 파티클 버스트**:
  - 8방향 방사형 확산 후 350ms 내 페이드아웃.

---

## 4. 모바일 터치 최적화 및 접근성 (a11y)

1. **Passive Touch Listeners**: 터치 스크롤과의 간섭을 방지하기 위해 드래그 시작 시에만 `preventDefault()`를 조건부 처리하고 `passive: false` 플래그 관리.
2. **원터치 폴백(Tap-to-reveal Guarantee)**: 문지르지 않고 툭 터치하기만 해도 0.55초 안에 완벽한 브러시 스위프 애니메이션으로 본문이 열리므로 남녀노소 누구나 스트레스 없이 사용 가능.
3. **`prefers-reduced-motion` 지원**: 모션 민감 사용자의 경우 브러시 애니메이션 없이 즉각적인 크로스페이드로 전환.

---

## 5. 다중 세션 워커 협업 분장

- **워커 세션 (Claude Code / 옆세션)**:
  - `modules/brush_reveal_effect.js` 구축
  - `modules/brush_reveal.css` 구축
  - `tests/test_brush_reveal.py` 단위 테스트 작성 및 100% PASS 검증
- **최고 마스터 AI (Antigravity)**:
  - 전체 사양서 및 아키텍처 확정 (`_MULTI_AGENT_PROTOCOL.md`)
  - `index.html` 내 카드 렌더링(`renderNoteCardList`)과 브러시 엔진 바인딩
  - PWA `sw.js` 캐시 v2.3.0 갱신, E2E 실측 검증 및 GitHub 최종 릴리즈

