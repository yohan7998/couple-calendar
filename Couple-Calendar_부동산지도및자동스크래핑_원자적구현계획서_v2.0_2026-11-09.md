---
title: 달콤살벌 캘린더 모바일 부동산 카카오 지도 및 실시간 자동 스크래핑 원자적 구현계획서
version: v2.0.0
status: active
applied_in:
  - modules/real_estate_scraper.js
  - modules/real_estate_map.js
  - modules/real_estate_view.js
  - modules/real_estate.css
  - tests/test_real_estate.py
  - index.html
created: 2026-11-09
updated: 2026-11-09
author: 최고 마스터 AI (Antigravity)
tags:
  - ImplementationPlan
  - TDD
  - KakaoMaps
  - ScraperRelay
  - CoupleCalendar
---

# [Plan] 부동산 카카오 지도 및 실시간 자동 스크래핑 원자적 구현계획서 (v2.0.0)

> [!NOTE] **원자적 구현 및 TDD 원칙**  
> 모든 작업은 2~5분 단위의 원자적 단위(Atomic step)로 세분화하며, 테스트 작성 ➔ 구현 ➔ 검증(Red-Green-Refactor) 주기를 철저히 준수합니다.

---

## 1. 구현 단계별 실행 태스크

### Phase 1: 실시간 자동 스크래퍼 모듈 구현 (`modules/real_estate_scraper.js`)
- [ ] **Task 1.1**: OpenGraph 기반 네이버 매물 정보 파서 구현
  - `parseOpenGraphData(ogTitle, ogDesc, ogImage, rawUrl)` 함수 구현.
  - `엘리프미아역2단지(주상복합) 202동` ➔ 단지명 `엘리프미아역2단지(주상복합)`, 동 `202동`.
  - `매매 11억 8,725` ➔ 거래유형 `매매`, 금액 `118725` 만원 자동 변환.
- [ ] **Task 1.2**: 릴레이 통신 및 비동기 스크랩 클라이언트
  - `scrapeNaverUrl(url)` 비동기 함수 구현.
  - 로딩 상태(스피너 및 "매물 정보 스크랩 중...") 실시간 표시.
- [ ] **Task 1.3**: TDD 단위 테스트 스위트 작성 (`test_26_og_parser`, `test_27_scraper_flow`)

### Phase 2: 카카오 지도 Web SDK 엔진 구현 (`modules/real_estate_map.js`)
- [ ] **Task 2.1**: 카카오 지도 SDK 비동기 로더 (`loadKakaoMapSdk(appKey)`)
- [ ] **Task 2.2**: 단지명 기반 주소 자동 Geocoding (`searchAddress(complexName, region)`)
- [ ] **Task 2.3**: 커스텀 오버레이 가격 말풍선 마커 렌더러 (`createPriceOverlay(property)`)
- [ ] **Task 2.4**: 모바일 인터랙티브 바텀시트 슬라이드 업 UI (`renderBottomSheet(property)`)

### Phase 3: 뷰 통합 및 듀얼 뷰 토글 (`modules/real_estate_view.js` & CSS)
- [ ] **Task 3.1**: 상단 액션바 듀얼 뷰 토글 버튼 ([ 📋 목록보기 ] | [ 🗺️ 지도보기 ])
- [ ] **Task 3.2**: 스마트 붙여넣기 모달에 스크래퍼 실시간 연동 (URL 입력 ➔ 자동 스크랩 ➔ 0초 완성)
- [ ] **Task 3.3**: 모바일 반응형 지도 컨테이너 및 바텀시트 스타일링 (`modules/real_estate.css`)

### Phase 4: 마스터 AI 통합, 검증 및 GitHub 배포 (v2.7.0)
- [ ] **Task 4.1**: `tests/test_real_estate.py` 전체 통합 테스트 실행 (27개+ ALL PASS)
- [ ] **Task 4.2**: `agent-browser` 기반 모바일 뷰포트 E2E 실측 검증
- [ ] **Task 4.3**: PWA 캐시 무효화 및 GitHub Pages 배포 (`origin/main`)
