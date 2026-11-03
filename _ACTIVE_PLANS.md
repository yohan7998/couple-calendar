---
title: 달콤살벌 캘린더 활성 계획서 및 설계 정본 색인 (SSOT Registry)
version: v1.4
status: active
created: 2026-11-02
updated: 2026-11-03
author: 마스터 AI
tags:
  - SSOT
  - ActivePlans
  - CoupleCalendar
---

# 달콤살벌 캘린더 활성 계획서 및 설계 정본 색인 (SSOT Registry)

> [!IMPORTANT] **단일 진실 공급원 (Single Source of Truth) 원칙**  
> 본 문서는 `couple-calendar` 디렉토리 내에서 현재 실제 시스템 및 프로덕션 코드에 확정·반영된 정본 계획서들을 총괄 관리합니다.

---

## 1. 현재 적용 중인 정본 계획서 목록 (Active Plans — v1.4)

| 구분 | 문서명 (버전 및 일자) | 상태 | 핵심 내용 및 역할 | 연계 구현 산출물 |
| :---: | :--- | :---: | :--- | :--- |
| **부부 실루엣 3D 양각 치환** | [[Couple-Calendar_아이콘인물교체_상세보고서_v1.4_2026-11-03]] | `ACTIVE` | • 1번 이미지의 범용 인물을 2번 이미지 실제 부부 실루엣으로 100% 치환<br/>• 동일한 샴페인 골드 브러시드 새틴 양각 릴리프 및 조명 렌더링<br/>• 1024/512/192px 멀티스케일 및 단일 HTML 헤더/파비콘 동기화 | `icon-512.png`<br/>`icon-192.png`<br/>`index.html` |
| **디자인·타이포 개편 사양** | [[Couple-Calendar_디자인및타이포개편_상세보고서_v1.3_2026-11-03]] | `ACTIVE` | • 손글씨 폰트(Gaegu) 전면 영구 퇴출 및 Pretendard 가변 폰트 적용<br/>• 모바일 헤더 2열 위계화 (글자 잘림/줄바꿈 완벽 해소)<br/>• 사용자 지정 3D 샴페인 골드 메달리온 앱 아이콘 및 파비콘 교체 | `index.html`<br/>`icon-512.png`<br/>`icon-192.png` |
| **아이콘 개정 상세 계획** | [[Couple-Calendar_아이콘개정_상세계획서_v1.2_2026-11-03]] | `ACTIVE` | • 중앙 메달리온(부부 실루엣) 1.48배 확대 및 입체 강조<br/>• 더블 코인 베벨 림 및 3D 앰비언트 섀도우 레이어링<br/>• 6대 정제 에디션 및 앱 아이콘 1024/512/192 멀티스케일 동기화 | `icons_curated/`<br/>`icon-512.png`<br/>`index.html` |
| **최신 쪽지 알림 카드 사양** | [[Couple-Calendar_최신쪽지알림카드_상세설계사양서_v1.3_2026-11-03]] | `ACTIVE` | • 메인 캘린더 최상단 상대방 최근 쪽지 알림창 카드<br/>• 내 프로필(주니/용이) 1초 원클릭 토글러<br/>• 카드 내 원터치 하트 리액션 & 즉시 답장 연계 | `index.html` |
| **최신 쪽지 알림 카드 구현 계획** | [[Couple-Calendar_최신쪽지알림카드_원자적구현계획서_v1.3_2026-11-03]] | `ACTIVE` | • TDD 레드-그린-리팩터 실행 태스크<br/>• 알림 카드 렌더러, 빠른 하트/답장, 읽음 상태 추적 | `tests/test_couple_calendar_e2e.py` |
| **양방향 동기화 사양** | [[Couple-Calendar_동기화엔진개편_상세사양서_v1.2_2026-11-03]] | `ACTIVE` | • 2-Way Merge 양방향 무손실 동기화 엔진<br/>• Secret Gist 1초 자동 생성 및 연동기<br/>• 카카오톡 인앱 브라우저 감지 안내 및 URL SyncKey 온보딩 | `index.html`<br/>GitHub Gist 연동 |
| **상세 설계 사양** | [[Couple-Calendar_상세설계사양서_v1.1_2026-11-02]] | `ACTIVE` | • 음주 주종 선호도 제거 및 티켓 중심 단순화<br/>• 주니 ➔ 용이, 용이 ➔ 주니 2분할 전용 쪽지함<br/>• Web Notification + Web Audio 챠임벨 알람 시스템 | `index.html` (배포 본) |
| **원자적 구현 계획** | [[Couple-Calendar_원자적구현계획서_v1.1_2026-11-02]] | `ACTIVE` | • TDD 레드-그린-리팩터 실행 태스크<br/>• 음주 간소화, 2분할 렌더러, 차임벨 오디오 합성, 푸시 알림 | `index.html`<br/>`tests/test_couple_calendar_e2e.py` |

---

## 2. 이전 버전 아카이브 (Superseded Plans)

- `v1.0`: [[Couple-Calendar_상세설계사양서_v1.0_2026-11-02]] (초기 단일 쪽지함 및 기본 설계)
- `v1.0`: [[Couple-Calendar_원자적구현계획서_v1.0_2026-11-02]] (초기 WBS)

---

## 3. 실제 구현 산출물 매핑

- 🌟 **공식 웹 애플리케이션**: [`index.html`](file:///Users/yohan/Library/CloudStorage/OneDrive-개인/02.Obsidian_Business/Ob_Business/apps/couple-calendar/index.html) (단일 자가완결 실행 파일)
- 🚀 **즉시 실행 사본**: [`/Users/yohan/Downloads/Couple-Calendar.html`](file:///Users/yohan/Downloads/Couple-Calendar.html)
- 🐙 **GitHub 공식 저장소**: [https://github.com/yohan7998/couple-calendar](https://github.com/yohan7998/couple-calendar)
- 🌐 **온라인 라이브 웹앱 (GitHub Pages)**: [https://yohan7998.github.io/couple-calendar/](https://yohan7998.github.io/couple-calendar/)
- 📥 **단일 HTML 직접 다운로드 URL**: [https://raw.githubusercontent.com/yohan7998/couple-calendar/main/index.html](https://raw.githubusercontent.com/yohan7998/couple-calendar/main/index.html)
- 🧪 **E2E 검증 테스트 스위트**: [`tests/test_couple_calendar_e2e.py`](file:///Users/yohan/Library/CloudStorage/OneDrive-개인/02.Obsidian_Business/Ob_Business/apps/couple-calendar/tests/test_couple_calendar_e2e.py)
- 📦 **아이콘 스위트 압축팩**: [`/Users/yohan/Downloads/달콤살벌캘린더_정제아이콘_스위트.zip`](file:///Users/yohan/Downloads/달콤살벌캘린더_정제아이콘_스위트.zip)
