---
title: Couple-Calendar(달콤살벌 캘린더) 상세 설계 사양서
version: v1.1
status: active
created: 2026-11-02
updated: 2026-11-02
author: 마스터 AI
applied_in:
  - Ob_Business/apps/couple-calendar/index.html
tags:
  - 아키텍처사양서
  - CoupleCalendar
  - GitHubSync
  - Superpowers
  - SSOT
---

# Couple-Calendar(달콤살벌 캘린더) 상세 설계 사양서 (v1.1)

> [!IMPORTANT] **문서 상태: ACTIVE v1.1 (주니·용이 2인 쪽지함 분리 및 새 쪽지 알림·차임벨 시스템 탑재)**  
> **공식 프로젝트 명칭**: `Couple-Calendar` (`달콤살벌 캘린더 💖⚔️`)  
> **부부 프로필**: 남편: `주니 (🐻)` / 아내: `용이 (🐰)`  
> **총괄 지휘**: Antigravity 마스터 AI  
> **앱 공식 로고**: 생활영어 프로젝트 공식 로고 에셋 통합 (`icon-192.png`, `icon-512.png` Base64 임베딩)  
> **목적**: 부부 2인이 함께 음주 티켓을 설정·차감 관리하고, 일정을 기록하며, 주니와 용이 간 분리된 양방향 쪽지함과 실시간 알람을 지원하는 귀여운 감성의 GitHub 연동 무설치 웹 캘린더  
> **타깃 플랫폼**: 모바일(스마트폰 PWA/홈화면 앱) 및 데스크톱 웹 브라우저 (100% 반응형 단일 파일)

---

## 1. 개정 이력 (Changelog)

| 버전 | 일자 | 주요 변경 사항 | 승인 상태 |
| :---: | :---: | :--- | :---: |
| **v1.0** | 2026-11-02 | 초기 정본 승인: 음주 티켓 차감 관리, 단일 쪽지함, GitHub Gist 동기화 | Superseded |
| **v1.1** | 2026-11-02 | • **음주 주종별 선호도 분석 기능 전면 제거**: 음주 여부/누가 마셨는지/티켓 차감만 직관적으로 단순화<br/>• **달력 일자별 음주 횟수 표기**: 음주 아이콘 밑에 '1회, 2회, 3회' 직관적 카운트 뱃지 표시<br/>• **쪽지함 2분할**: `[주니 ➔ 용이]` 및 `[용이 ➔ 주니]` 전용 탭/수신함 분리<br/>• **새 쪽지 도착 알림 및 알람 시스템 신설**: Web Notification API 푸시, Web Audio API 맑은 차임벨 소리, 인앱 상단 토스트, 안 읽은 쪽지 뱃지 탑재 | **ACTIVE** |

---

## 2. 사용자 핵심 요구사항 및 아키텍처 사양

### 2.1. 음주 관리 단순화 및 달력 횟수 배지
- **주종 구분 제거**: 맥주/소주/와인 등 복잡한 주종별 선호도 선택 및 통계 그래프를 과감히 제거.
- **달력 내 음주 횟수 시각화**: 달력 그리드 셀 내 음주 아이콘(🍺 / 🥂) 바로 밑에 당일 음주 횟수(`1회`, `2회`, `3회`...)를 귀여운 미니 뱃지로 명확히 표기.
- **기록 최소화**:
  - 날짜 선택
  - 누가 마셨나요? (`🐻 주니`, `🐰 용이`, `🥂 함께`)
  - 간단 메모(선택 사항)
- **티켓 차감 엔진 유지**:
  - 월간 목표 티켓(기본 8장)에서 마실 때마다 1장씩 차감.
  - 리포트 화면: `주니 음주 횟수`, `용이 음주 횟수`, `함께 마신 횟수`, `총 음주 횟수 & 남은 티켓`만 깔끔하게 노출.

---

### 2.2. 쪽지함 2분할 (주니 ➔ 용이 / 용이 ➔ 주니)
부부 간 대화 흐름과 수신함을 명확히 구분하기 위해 쪽지함을 2개의 전용 탭으로 분리:
1. **`🐻 주니 ➔ 용이 쪽지함`** (`notes-tab-juni-to-yongi`):
   - 발신자: 주니 (🐻) / 수신자: 용이 (🐰)
   - 주니가 용이에게 보낸 사랑의 한마디, 심부름, 음주 조르기 등.
2. **`🐰 용이 ➔ 주니 쪽지함`** (`notes-tab-yongi-to-juni`):
   - 발신자: 용이 (🐰) / 수신자: 주니 (🐻)
   - 용이가 주니에게 보낸 잔소리/응원/메모 등.
3. **편의 기능**:
   - 상단 서브 탭으로 원클릭 전환 (`[🐻 주니 ➔ 용이 (N)]` | `[🐰 용이 ➔ 주니 (N)]`).
   - 현재 보고 있는 탭에 맞춰 새 쪽지 작성 모달 진입 시 발신자/수신자 자동 프리셋.
   - 각 쪽지함별 하트(💖) 리액션 및 티켓 허가(+1장) 버튼 독립 유지.

---

### 2.3. 새 쪽지 도착 알림 및 사운드 알람 시스템
웹 애플리케이션 환경에서 부부가 서로 쪽지를 보냈을 때 즉시 인지할 수 있도록 4중 알림 체계 구축:

```
[원격 GitHub Gist 동기화 / 30초 주기 폴링]
                │
                ▼
      새 쪽지 수신 감지 (newNote)
                │
    ┌───────────┼───────────┬───────────┐
    ▼           ▼           ▼           ▼
[시스템 푸시] [오디오 알람] [인앱 토스트] [하단 뱃지]
Web Notif     Web Audio      상단 배너      미열람 개수
권한 허용 시   맑은 차임벨    원클릭 이동    (N) 빨간 점
```

1. **브라우저 웹 알림 (Web Notification API)**:
   - 권한 요청: 상단 헤더 및 쪽지함 상단에 `[🔔 알림 켜기]` 버튼 제공.
   - 권한이 허용(`granted`)된 경우, 백그라운드 탭 상태에서도 OS 레벨 시스템 알림 배너 발송:
     - 타이틀: `💌 달콤살벌 캘린더 쪽지 도착!`
     - 내용: `[주니/용이]님이 새 쪽지를 보냈어요: "..."`
2. **맑은 멜로디 차임벨 알람 (Web Audio API)**:
   - 외부 오디오 파일 다운로드 없이 브라우저 자체 합성(Synthesizer)으로 4음계 챠임벨 재생:
     - C5(523Hz) ➔ E5(659Hz) ➔ G5(784Hz) ➔ C6(1046Hz) 부드러운 아르페지오.
   - 사용자가 원할 때 언제든 들을 수 있는 오디오 테스트 버튼 설정 모달에 탑재.
3. **인앱 상단 알림 배너 (In-App Notification Banner)**:
   - 앱이 열려 있을 때 화면 상단에서 부드럽게 슬라이드 다운되는 핑크 뱃지 알림.
   - 터치 시 바로 해당 쪽지함 탭으로 화면 전환 및 스크롤.
4. **미열람(Unread) 뱃지 & 동기화 감지**:
   - `lastSeenNoteTime` 기준으로 새로운 쪽지 개수 카운트.
   - 하단 내비게이션 `💌 쪽지함` 아이콘 위에 빨간색 안 읽은 알림 점 표시.

---

## 3. 데이터 스키마 및 상태 구조 (v1.1)

```typescript
interface AppState {
  version: "1.1.0";
  lastUpdated: string;
  couple: {
    user1: { name: "주니"; nickname: "주니"; avatar: "🐻" };
    user2: { name: "용이"; nickname: "용이"; avatar: "🐰" };
    anniversary: string;
    monthlyDrinkQuota: number; // 기본 8
  };
  drinks: Array<{
    id: string;
    date: string; // YYYY-MM-DD
    drinker: "user1" | "user2" | "together"; // 주니 | 용이 | 둘이 함께
    memo?: string;
  }>;
  schedules: Array<{
    id: string;
    date: string;
    title: string;
    category: "date" | "trip" | "anniversary" | "medical" | "personal";
  }>;
  notes: Array<{
    id: string;
    author: "user1" | "user2"; // user1: 주니, user2: 용이
    target: "user2" | "user1"; // user2: 용이, user1: 주니
    content: string;
    date: string;
    type: "love" | "errand" | "health" | "ticket-request";
    reactions: number;
    isGranted?: boolean;
    createdAt: string; // ISO 8601
  }>;
  sync: {
    githubToken: string;
    gistId: string;
    lastSynced: string | null;
  };
  notification: {
    enabled: boolean;
    lastSeenNoteId: string | null;
  };
}
```

---

## 4. 검증 계획 (TDD / Acceptance Criteria)
1. **음주 주종 필드 제거 확인**:
   - 술 기록 모달 및 통계 카드에서 주종(맥주, 소주 등) 선택/선호도 차트가 제거되고, '주니/용이/함께' 및 잔여 티켓만 노출되는지 검증.
2. **쪽지함 2분할 렌더링 확인**:
   - 쪽지함 서브 탭 2개(`notes-subtab-juni-to-yongi`, `notes-subtab-yongi-to-juni`)가 렌더링되고 각각 올바른 발신자 쪽지만 격리 표시되는지 검증.
3. **알림 및 차임벨 엔진 확인**:
   - `playNewNoteChime` 함수 존재 확인.
   - `Notification` API 권한 요청 로직 및 `notifyNewNote` 트리거 로직 무결성 검증.
   - 자동화 E2E 테스트 스위트 100% 통과.
