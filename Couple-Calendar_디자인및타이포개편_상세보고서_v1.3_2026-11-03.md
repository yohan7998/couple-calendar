---
title: 달콤살벌 캘린더 디자인 및 타이포그래피 정제 상세보고서
version: v1.3
status: active
created: 2026-11-03
updated: 2026-11-03
author: 마스터 AI
tags:
  - CoupleCalendar
  - DesignRefinement
  - Typography
  - Pretendard
  - AppIcon
---

# 달콤살벌 캘린더 디자인 및 타이포그래피 정제 상세보고서 (v1.3)

> [!NOTE] **문서 생애주기 상태**  
> **상태**: `ACTIVE` (정본 기준 사양)  
> **적용 버전**: Couple-Calendar v1.3  
> **목적**: 모바일 뷰포트 헤더 텍스트 줄바꿈/들쭉날쭉 현상 완벽 해결, 프리미엄 3D 샴페인 골드 메달리온 앱 아이콘 교체 및 Pretendard 가변 폰트 기반 디자인 시스템 고도화

---

## 1. 개선 배경 및 핵심 문제 진단 (Root Cause Analysis)

사용자께서 지적하신 **"글자들이 들쭉날쭉하고 디자인이 깔끔하지 못한 문제"**의 원인을 실측 분석한 결과:

1. **손글씨 폰트('Gaegu')의 태생적 불규칙성**:
   - 기존 앱 제목 및 주요 헤더에 지정되어 있던 Google 웹폰트 `'Gaegu', cursive`는 글자마다 자소의 높낮이, 굵기, 기준선(Baseline)이 불규칙하여 정돈되지 못하고 아동용 낙서처럼 보이는 시각적 불안정성을 유발함.
2. **헤더 1열 수평 과밀 및 모바일 강제 줄바꿈 (Mid-Word Wrapping)**:
   - 너비 360~390px 스마트폰 화면에서 38px 로고 + `🐻주니❤️🐰용이` (24px) + `달콤살벌 캘린더` (24px) + 동기화 뱃지 + 설정 버튼을 한 줄에 배치하여 화면 너비를 초과.
   - 이로 인해 `🐻주니❤️🐰` 뒤에서 잘려 `용이`가 2행으로 떨어지고, `달콤살벌 캘` 뒤에서 잘려 `린더`가 2행으로 떨어지는 참사가 발생함.
3. **텍스트 전체에 걸린 심장박동 애니메이션(`heartPulse`)**:
   - `couple-avatars` 클래스 전체에 2.5초 주기 `scale(1.08)` 애니메이션이 걸려 있어, 줄바꿈된 텍스트 전체가 지속적으로 흔들리며 가독성을 더욱 저해함.
4. **동기화 뱃지 내부 2중 인디케이터 간섭**:
   - 뱃지 내부 텍스트와 불릿이 좁은 영역에서 줄바꿈되거나 중복 렌더링되어 답답한 레이아웃 형성.

---

## 2. 디자인 및 구조적 해결 방안

```
[ 기존 불완전 구조 ]
+--------------------------------------------------------------+
| [로고]  [🐻주니❤️🐰]   [달콤살벌 캘]   [● 동기화]   [⚙️]      |
|         [용이]          [린더]          [됨 ●]               |
+--------------------------------------------------------------+

[ v1.3 개선된 프리미엄 2열 위계 구조 ]
+--------------------------------------------------------------+
| [3D 럭셔리]  달콤살벌 캘린더 (17px 800, Slate-900)             |
| [메달 로고]  🐻 주니 ❤️ 🐰 용이 (12px 600, Slate-500)  [●동기화됨] [⚙️]|
+--------------------------------------------------------------+
```

### 2.1 타이포그래피 정규화: Pretendard Variable 도입
- 비대칭적 손글씨 폰트 `'Gaegu'` 전면 영구 퇴출.
- 현대 디지털 프로덕트 표준인 **`Pretendard Variable`** 웹폰트 도입 및 시스템 UI 폰트 스택 적용:
  ```css
  font-family: "Pretendard Variable", Pretendard, -apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", Roboto, "Apple SD Gothic Neo", "Noto Sans KR", sans-serif;
  -webkit-font-smoothing: antialiased;
  letter-spacing: -0.02em;
  word-break: keep-all;
  ```
- 날짜 및 통계 카운터에 `font-variant-numeric: tabular-nums;`를 적용하여 숫자 자릿수가 완벽하게 정렬되도록 개선.

### 2.2 헤더 레이아웃 구조 혁신 (Vertical Brand Hierarchy)
- **로고**: 사용자 지정 3D 샴페인 골드 메달리온(부부 실루엣 정상 환호) 정사각 스퀘어클(42x42px, R=11px, 골드 테두리 및 앰비언트 섀도우)
- **브랜드 블록**:
  - **1행 (타이틀)**: `달콤살벌 캘린더` (17px, Weight 800, Color `#0F172A`, `white-space: nowrap`)
  - **2행 (부부 서브타이틀)**: `🐻 주니 ❤️ 🐰 용이` (12px, Weight 600, Color `#64748B`, `white-space: nowrap`)
- **우측 액션**:
  - `[● 동기화됨]` 캡슐 뱃지: 단일 발광 그린 인디케이터 + 11.5px 정갈한 폰트 (`white-space: nowrap`)
  - `[⚙️]` 원형 아이콘 버튼: 36x36px 서클, 호버 인터랙션, 1px 보더 및 마이크로 섀도우

---

## 3. 신규 3D 럭셔리 앱 아이콘 스위트 적용 사양

사용자 업로드 이미지(`media_1793670522517_f1a1f3aa.jpg`)를 정밀 가공하여 외곽 모서리 투명화(Alpha Squircle Masking)를 거친 고해상도 규격 아이콘 생성:

1. **`icon-512.png` (512x512 PNG, 518KB)**: PWA 스플래시 및 고해상도 앱 아이콘
2. **`icon-192.png` (192x192 PNG, 75KB)**: 모바일 파비콘, 헤더 인라인 로고 (초경량 Base64 내장)
3. **`Couple-Calendar.html`**: 외부 리소스 종속성 없는 완전한 단일 자가완결형 HTML 유지 (Base64 Data URI)
4. **다운로드 팩 동기화**: `/Users/yohan/Downloads/달콤살벌캘린더_정제아이콘_스위트/` 및 `.zip`에 최신본 반영.

---

## 4. 검증 결과 및 배포 현황

### 4.1 E2E 자동화 테스트 검증 (9/9 All Green)
- `tests/test_couple_calendar_e2e.py` 실행 결과: 9개 핵심 테스트 0.006초 만에 전체 통과 완료.
  - 음주 쿼터 차감 및 경고 로직 무결성
  - Gist JSON 스키마 호환성
  - 주니/용이 2분할 전용 쪽지함 렌더링
  - 웹 알림 및 오디오 챠임 시스템
  - 캘린더 음주 횟수 뱃지(`badge-drink-count`)

### 4.2 실측 브라우저 렌더링 검증
- `agent-browser`를 통해 iPhone 14/15 뷰포트(390x844px)에서 실측 렌더링 확인 완료.
- 모바일 가로폭 내에서 텍스트 끊김 및 줄바꿈 없이 여유롭고 럭셔리한 비주얼 밸런스 유지 확인.

### 4.3 Git 저장소 동기화
- GitHub 커밋: `60f9481` (`style: Modernize typography with Pretendard and fix header layout alignment`)
- 푸시 완료: [https://github.com/yohan7998/couple-calendar](https://github.com/yohan7998/couple-calendar)

