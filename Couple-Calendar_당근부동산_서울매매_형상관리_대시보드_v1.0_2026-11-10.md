---
title: 당근부동산 서울 매매 수집 및 형상관리 대시보드
version: v2.1.0
status: active
created: 2026-11-10
updated: 2026-11-10
author: 최고 마스터 AI (Antigravity)
tags:
  - CoupleCalendar
  - UnifiedPropertyCard
  - DaangnRealEstate
  - NaverLandCrawler
  - RealEstateAdapter
  - ObsidianSSOT
---

# [Active SSOT] 당근·네이버 통합 부동산 및 캘린더 메인 관심매물 요약 상세설계사양서 (v2.0)

> [!IMPORTANT] **단일 진실 공급원 (Single Source of Truth) 원칙**  
> 본 문서는 달콤살벌 캘린더(Couple-Calendar) 내 부동산 기능을 전면 고도화하여,
> 1) **캘린더 메인 화면 상단**에서 부부가 찜한 관심(♥) 매물 현황(건수, 매매/전세 평균가, 최단 다가오는 임장일 D-day, 미니 사진 카드 슬라이드)을 0초 만에 조망하고,
> 2) **당근부동산**과 **네이버부동산** 링크/공유텍스트를 모두 단일 정규화 계층(UnifiedPropertyCard)으로 통합하여, **당근 특유의 실사 중심 단일 카드 UI(좌측 1:1 사진 + 우측 굵은 가격 + 평수/층수/동네 + 부부 메모 + 임장일 지정)**로 일관되게 관리하는 v2.0 정본 아키텍처 사양서입니다.

---

## 1. 추진 배경 및 기존 한계 분석

### 1.1 기존 구현의 문제점 및 미구현 원인
1. **캘린더 메인과 부동산의 단절 (기능 1 미구현 원인)**:
   - 기존 구조는 부동산 기능이 5번째 독립 탭(realestate-view)으로 격리되어 있어, 부부가 매일 확인하는 달력 메인 화면에서 관심 매물의 시세나 다가오는 임장 일정을 인지할 수 없었습니다.
   - modules/real_estate_engine.js 파일 누락으로 인해 뷰 렌더링 초기화 시 RealEstateEngine undefined 경고가 발생하고 안정적인 스토어 인스턴스가 주입되지 못했습니다.
2. **다종 플랫폼 연동 및 통일된 당근 스타일 뷰의 부재 (기능 2 미구현 원인)**:
   - 기존 스크래퍼는 네이버 URL만 일부 파싱하였으며, 신흥 대세인 **당근부동산(daangn.com)** 매물 공유 링크 및 텍스트를 수용하는 어댑터가 전무했습니다.
   - 기존 카드는 메타 태그, 단지명, 가격, 스펙 테이블이 수직으로 분산되어 모바일 가독성이 낮았고, 당근마켓 특유의 **"좌측 실사 썸네일 + 우측 굵은 가격 및 동네/평수 + 커플 메모"** 일체형 카드 형태가 구현되지 않았습니다.

---

## 2. v2.0 시스템 아키텍처



---

## 3. UnifiedPropertyCard 공통 스키마 규격

- id: 고유 식별자 (prop_timestamp_rand)
- source: 매물 출처 ('naver' | 'daangn' | 'manual')
- sourceUrl: 원문 링크 URL
- sourceId: 원천 매물/아티클 번호
- complexName: 단지명 / 건물명
- building: 동/호 정보 (예: 102동, 3층)
- dealType: 거래 유형 ('매매' | '전세' | '월세')
- price: 매매가 또는 보증금 (만원 단위 정수)
- deposit: 보증금 (월세 시)
- monthlyRent: 월세 금액 (만원 단위)
- formattedPrice: 당근 스타일 굵은 가격 라벨 (예: 매매 11억 8,725만)
- region: 행정동/지역 (예: 마포구 아현동)
- area: 전용/공급 면적 (예: 84㎡ (34평))
- floor: 층수/향 (예: 12/25층 · 남향)
- thumbnailUrl: 매물 실사 이미지 URL (오류 시 SVG 자동 폴백)
- coupleMemo: 부부 전용 코멘트/메모
- visitDate: 임장 방문 일시 (YYYY-MM-DD or YYYY-MM-DD HH:mm)
- dDay: 다가오는 임장일 D-day 계산값 (D-DAY, D-3 등)
- likes: 찜한 사용자 목록 (['주니', '용이'])
- status: 진행 상태 ('candidate', 'visit_scheduled', 'visited', 'favorite', 'dropped')
- rating: 별점 (1.0 ~ 5.0)
- checklist: 5대 현장 실사 체크리스트 (채광, 소음, 주차, 수압, 결로)
- createdAt: 생성 일시 (ISO string)

---

## 4. 정규화 어댑터 상세 규격

### 4.1 NaverPropertyAdapter
- 네이버 모바일 링크 및 공유 텍스트 자동 파싱 및 정규화
- 대표 썸네일 추출 및 404/깨진 이미지 방어

### 4.2 DaangnPropertyAdapter
- 당근부동산 링크 및 앱 공유 텍스트 자동 감지 및 정규화
- 방 개수, 보증금/월세, 동네/위치 파싱 및 실사 이미지 추출

---

## 5. UI 및 인터랙션 상세 사양

### 5.1 [기능 1] 캘린더 메인 상단 관심 매물 요약 위젯 (FavoriteSummaryWidget)
- 관심 매물 총 건수 (♥ X건)
- 매매/전세 평균가 자동 산출 표시
- 가장 가까운 임장일 D-day 뱃지
- 찜 매물 미니 사진 카드 가로 슬라이더 탑재

### 5.2 [기능 2] 당근 스타일 통합 단일 카드 UI (DaangnStylePropertyCard)
- 좌측: 88px × 88px 1:1 실사 썸네일 컨테이너 + 출처 뱃지
- 우측: [거래유형] + 동네 + **굵은 가격** + 평수/층수 + 부부 메모 + 임장 D-day + 찜 버튼
