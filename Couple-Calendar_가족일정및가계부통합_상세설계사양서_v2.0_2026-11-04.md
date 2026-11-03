---
title: "달콤살벌 캘린더 v2.0 - 가족 일정 및 가계부(생활비 관리) 통합 상세설계사양서"
date: "2026-11-04"
version: "v2.0.0"
status: "active"
tags: ["couple-calendar", "spec", "v2.0", "ledger", "schedule", "excel", "stats"]
---

> [!NOTE]
> **Active SSOT - 확정 기준 계획서 (v2.0)**
> 본 문서는 '달콤살벌 캘린더'의 주 용도를 단순 음주 티켓 관리에서 **가족 통합 일정 관리 및 가계부(생활비 처리 현황 등록)**로 전면 확장·개편하기 위한 정본 상세설계사양서입니다.

---

# 1. 배경 및 개요

- **개편 목적**:
  1. 기존 메인 상단에 고정되어 있던 **음주티켓 배너(#drink-ticket-banner)**를 **통계 탭(stats-view)** 내부로 이전하여 메인 공간을 확보.
  2. 부부/가족의 **일정 및 약속 관리 강화**: 단일일뿐만 아니라 시작일~종료일 범위의 **기간 지정(Period)**과 **상세 메모**, 그리고 메모의 **쪽지함 즉시 전달 연동** 구현.
  3. **가계부(생활비 처리 현황) 시스템 신설**:
     - 수입/지출 CRUD(등록/수정/삭제/조회) 및 결제자(주니/용이/공동) 분담 체계.
     - **엑셀 데이터 업로드(.xlsx, .csv)** 및 **공유 엑셀(스프레드시트/CSV) 링크 실시간 연결 가져오기**, **가계부 엑셀 내보내기(다운로드)**.
     - **반응형 뷰 & 세련된 통계**: 모바일 화면에는 최적화된 소비 타임라인과 지출 분석 카드를, 웹 대화면(768px 이상)에는 엑셀 스타일 일괄 데이터 그리드 및 대시보드 통계를 제공.
     - 단일 PWA 기반의 Zero-Backend 구조를 유지하며, SheetJS 및 Chart.js를 결합하고 GitHub Gist 2-Way 실시간 무손실 동기화를 지원.

---

# 2. 아키텍처 및 모듈 구성

```mermaid
graph TD
    UI[HTML5 / CSS3 / Vanilla JS SPA]
    State[AppState Engine (LocalStorage + Gist 2-Way Sync)]
    
    subgraph "새로운 탭 구조 (Nav & Tabs)"
        TabCal["📅 달력 (기간 일정 & 메모 전달)"]
        TabLedger["💰 가계부 (생활비 내역 & 엑셀 임포트/익스포트)"]
        TabNotes["💌 쪽지함 (최근 쪽지 & 메모 전달 알림)"]
        TabStats["📊 통계 (가계부 종합 통계 + 이전된 음주티켓 리포트)"]
        TabSettings["⚙️ 설정 (Gist 동기화 & 공유 엑셀 URL 연동)"]
    end
    
    subgraph "Core Engines"
        EngineCal[PeriodScheduleEngine: 기간 계산, 연속 바 렌더링, 메모 전달]
        EngineLedger[LedgerEngine: 트랜잭션 CRUD, 카테고리, 결제자 분담]
        EngineExcel[ExcelLedgerEngine: SheetJS 기반 XLSX/CSV 파서, 공유 시트 Fetch, XLSX 내보내기]
        EngineStats[StatsVisualEngine: Chart.js 기반 도넛/바 차트, 모바일/웹 반응형 뷰]
        EngineSync[SyncEngine: mergeStates 무손실 양방향 병합]
    end

    UI --> TabCal & TabLedger & TabNotes & TabStats & TabSettings
    TabCal --> EngineCal
    TabLedger --> EngineLedger & EngineExcel
    TabStats --> EngineStats
    State --> EngineSync
```

---

# 3. 데이터 모델 사양

### 3.1 AppState 스키마 확장
```javascript
const AppState = {
  version: "2.0.0",
  currentMonth: "2026-11",
  myRole: "user1", // 'user1' (주니) | 'user2' (용이)
  spouseRole: "user2",
  drinks: [ ... ],
  notes: [ ... ],
  
  // 1) 확장된 일정 모델 (기간 및 메모, 쪽지 연동 지원)
  schedules: [
    {
      id: "s-1730700000000",
      date: "2026-11-03",      // 시작일 (하위 호환)
      startDate: "2026-11-03", // YYYY-MM-DD
      endDate: "2026-11-05",   // YYYY-MM-DD (기간 종료일)
      isPeriod: true,          // 단일일(false) 또는 기간(true)
      title: "가평 단풍 힐링 여행 🍁",
      category: "trip",        // date | trip | anniversary | medical | personal
      memo: "준비물: 카메라, 돗자리 / 펜션 입실 15시",
      sharedAsNote: true,      // 쪽지함으로 전달 여부
      createdAt: "2026-11-03T09:00:00.000Z",
      updatedAt: "2026-11-03T09:00:00.000Z"
    }
  ],

  // 2) 신규 가계부 (생활비 처리현황) 모델
  ledger: {
    monthlyBudget: 2500000,    // 이번 달 생활비 예산
    sharedSpreadsheetUrl: "",  // 공유 엑셀 / 구글 스프레드시트 CSV 웹 연동 링크
    transactions: [
      {
        id: "tx-1730700001000",
        date: "2026-11-04",
        type: "expense",       // 'expense' (지출) | 'income' (수입)
        category: "식비",       // 식비, 장보기, 주거/통신, 생활용품, 카페/간식, 교통, 문화/여가, 의료, 기타
        amount: 45000,
        payer: "juni",         // 'juni' (주니) | 'yongi' (용이) | 'together' (공동)
        paymentMethod: "카드",  // 카드 | 현금 | 계좌이체
        memo: "이마트 장보기 (우유, 과일, 계란)",
        isFixed: false,        // 고정비 여부
        createdAt: "2026-11-04T10:00:00.000Z",
        updatedAt: "2026-11-04T10:00:00.000Z"
      }
    ]
  },

  drinkTickets: {
    totalQuota: 8,
    customTickets: {}
  }
};
```

---

# 4. 기능별 상세 사양

### 4.1 음주티켓 배너 통계 탭 이전
- **메인 화면**: `#drink-ticket-banner`를 `calendar-view` 최상단에서 완전히 제거. 캘린더와 최근 쪽지 알림 카드에 시선 집중.
- **통계 탭(`stats-view`)**: 통계 탭 최상단에 `#drink-ticket-banner`를 배치. 음주 리포트 및 절주 현황과 자연스럽게 결합.

### 4.2 가족 캘린더: 기간 일정 및 메모 전달
1. **기간 지정 (Period Range)**:
   - 일정 추가/수정 모달에 '기간 일정' 토글 및 `시작일`, `종료일` 날짜 선택기 제공.
   - 단일일 일정은 `startDate == endDate`.
2. **상세 메모 & 메모 전달**:
   - 일정 상세 메모 입력 필드(`schedule-memo`).
   - "💌 등록 시 상대방에게 쪽지로도 함께 전달하기" 체크박스.
   - 체크 시 `AppState.notes`에 쪽지 타입 `'announcement'` 또는 `'daily'`로 자동 등록되어, 메인 화면 상대방 쪽지 알림 카드 및 쪽지함에 즉시 반영.
3. **달력 연속 시각화**:
   - 기간 일정의 시작일, 중간일, 종료일에 맞추어 달력 셀에 연속 바(Range pill) 스타일 적용.

### 4.3 가계부(생활비 처리현황) CRUD & 엑셀 연동
1. **거래 내역 CRUD**:
   - 수입 / 지출 토글, 일자, 카테고리, 금액(빠른 금액 버튼 지원), 결제자(주니/용이/공동), 결제수단, 메모.
   - 거래 클릭 시 수정/삭제 모달 지원.
2. **엑셀 파일 일괄 임포트 (.xlsx, .csv)**:
   - SheetJS(`xlsx.full.min.js`) 연동.
   - 파일 드롭존 및 파일 선택 버튼.
   - 헤더 자동 매핑:
     - 날짜: `날짜`, `일자`, `Date`, `거래일`
     - 유형: `구분`, `유형`, `Type` (지출/수입 판별)
     - 카테고리: `분류`, `카테고리`, `항목`, `Category`
     - 금액: `금액`, `지출`, `수입`, `Amount` (콤마/통화단위 자동 제거)
     - 결제자: `결제자`, `사용자`, `작성자`, `Payer`
     - 메모: `내용`, `적요`, `메모`, `사용처`, `Memo`
3. **공유 엑셀 (구글 스프레드시트/Web CSV) 링크 연결**:
   - 설정 모달 또는 가계부 상단에 "공유 엑셀 URL 연동" 입력 필드 제공.
   - "🔄 공유 시트에서 가져오기" 클릭 시 `fetch()`로 실시간 수신하여 가계부에 병합.
4. **엑셀 내보내기**:
   - "📥 엑셀로 내보내기" 클릭 시 SheetJS를 이용해 현재 가계부 내역을 `.xlsx` 파일로 원클릭 다운로드.

### 4.4 반응형 웹 & 모바일 세련된 통계
1. **모바일 뷰 (< 768px)**:
   - 한 손 조작에 최적화된 통계 카드:
     - 이번 달 총지출액, 예산 대비 잔여액, 주니 vs 용이 지출 분담 비율 게이지 바.
     - 카테고리별 지출 도넛 차트 (Chart.js 반응형).
     - 일자별 지출 그룹화 타임라인.
2. **웹 대화면 뷰 (≥ 768px)**:
   - 좌우 2분할 대시보드 레이아웃:
     - 좌측: KPI 메트릭 카드 3종(총지출, 일평균, 예산 소진율) + 월별 지출 트렌드 막대 차트 + 카테고리 도넛 차트.
     - 우측: 엑셀 스타일 일괄 데이터 그리드 테이블 (칼럼별 정렬, 빠른 필터, 행별 즉시 수정/삭제).

### 4.5 GitHub Gist 2-Way 무손실 병합 (`mergeStates`)
- `local.ledger.transactions`와 `remote.ledger.transactions`를 ID 기반으로 합집합 병합.
- `updatedAt`이 최신인 레코드를 정본으로 채택.
- `schedules` 역시 기간 및 메모 필드를 포함하여 완전 무손실 병합.

---

# 5. 검증 계획
1. **단위 및 통합 테스트**: `tests/test_couple_calendar_e2e.py`를 확장하여:
   - 음주티켓 배너 통계탭 위치 검증.
   - 기간 일정 등록, 렌더링, 쪽지 전달 연동 검증.
   - 가계부 CRUD 및 엑셀 파싱/익스포트 엔진 검증.
   - 모바일 & 웹 반응형 레이아웃 요소 검증.
2. **브라우저 실측 검증**: `agent-browser`를 통해 모바일(375x667) 및 웹(1200x800)에서 실제 렌더링 스크린샷 및 상호작용 검증.
