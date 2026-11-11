# 당근 찜 매물 일괄 가져오기 및 출처별 분리 필터링 구현 계획서 (v3.9.0)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 당근 앱에서 [공유하기] ➔ [링크 복사]한 URL들을 일괄 등록하여 '내 찜·임장 관리'에 추가하고, [전체], [🥕 당근 찜만], [🟢 네이버 관심만] 출처별 토글 칩으로 집중 비교·관리하는 기능을 구현한다.

**Architecture:** 
1. `real_estate_view.js`의 `re-action-bar`에 `#btn-import-daangn-favs` 버튼을 신설하고, `#daangn-import-modal` 모달 UI를 렌더링하여 다중 줄바꿈 URL을 안전하게 파싱 및 실매물/템플릿 등록한다.
2. `re-sub-controls` (또는 검색/정렬 상단)에 출처별 칩 필터 (`#re-source-filter-tabs`)를 신설하여 `this.selectedSource = 'all' | 'daangn' | 'naver'` 상태를 관리하고, `RealEstateStore.filterProperties` 및 뷰 렌더링에서 필터링 적용한다.
3. 실사 이미지 및 딥링크 원문 버튼의 보존성을 유지하고 테스트 3종(`test_40_import_modal_exists`, `test_41_batch_url_import`, `test_42_source_filter_tabs`)을 추가하여 100% 검증한다.
4. `index.html`, `sw.js`, `CHANGELOG.md`의 버전을 `v3.9.0`으로 갱신하고 모듈을 일치 동기화한다.

**Tech Stack:** JavaScript (ES6+), Vanilla Web Components, HTML5, CSS3, Service Worker (PWA), Python unittest

## Global Constraints
- **동기화 의무**: `modules/real_estate_view.js` <-> `real_estate_view.js`, `modules/real_estate_engine.js` <-> `real_estate_engine.js` 100% 동일 유지.
- **버전 정합성**: `index.html`, `sw.js`, `CHANGELOG.md` 모두 `v3.9.0`.
- **D-Day 뱃지 미표시 유지**: 카드에 D-Day 배지 복구 금지.
- **모든 테스트 패스**: `python3 -m unittest discover tests` 100% 통과.

---

### Task 1: 당근 찜 매물 일괄 가져오기 모달 및 파싱 로직 구현

**Files:**
- Modify: `real_estate_view.js` & `modules/real_estate_view.js`
- Test: `tests/test_daangn_realty.py`

- [ ] **Step 1: Write the failing tests**
`tests/test_daangn_realty.py`에 다음 테스트 추가:
- `test_40_import_modal_exists`: `#btn-import-daangn-favs` 및 `#daangn-import-modal` 템플릿/함수 존재 확인
- `test_41_batch_url_import`: 다중 줄바꿈 당근 URL (기존 실매물 ID 및 신규 외부 ID) 일괄 파싱 및 등록 로직 검증

- [ ] **Step 2: Run test to verify it fails**
Run: `python3 -m unittest tests/test_daangn_realty.py -k "test_40|test_41"`

- [ ] **Step 3: Implement [🥕 당근 찜 가져오기] 버튼 및 모달 UI, 파싱 로직**
1. `real_estate_view.js`의 `re-action-bar`에 `#btn-import-daangn-favs` 추가:
```html
<button class="re-btn re-btn-daangn-import" id="btn-import-daangn-favs" style="background:#ea580c; color:#fff; border:none; font-weight:700;">
  <span>🥕 당근 찜 가져오기</span>
</button>
```
2. `openDaangnImportModal()` 구현:
- 모달 내 textarea `#daangn-import-urls`
- `btn-submit-daangn-import` 클릭 시:
  - 줄바꿈으로 분리
  - 정규식 `(?:https?:\/\/)?(?:realty\.daangn\.com\/articles\/|daangn\.com\/[^\s]*\/)?(\d{5,10})` 등으로 articleId 추출
  - `window.DAANGN_SEOUL_LISTINGS` 매칭 확인
  - 미매칭 시 기본 당근 템플릿 객체 안전 생성
  - `window.AppState.realEstates` 및 `window.realEstateStore`에 unshift 등록
  - `window.saveStateLocal()` 호출
  - `showToast` 및 뷰 리프레시

- [ ] **Step 4: Run test to verify it passes**
Run: `python3 -m unittest tests/test_daangn_realty.py -k "test_40|test_41"`

---

### Task 2: 출처별 분리 필터 탭 (Source Filter Tabs) 신설

**Files:**
- Modify: `real_estate_view.js` & `modules/real_estate_view.js`
- Modify: `real_estate_engine.js` & `modules/real_estate_engine.js`
- Test: `tests/test_daangn_realty.py`

- [ ] **Step 1: Write failing test**
`tests/test_daangn_realty.py`에 `test_42_source_filter_tabs` 추가:
- [전체], [🥕 당근 찜만], [🟢 네이버 관심만] 탭 존재 및 `filterProperties({ source: 'daangn' })` 로직 검증

- [ ] **Step 2: Run test to verify it fails**
Run: `python3 -m unittest tests/test_daangn_realty.py -k "test_42"`

- [ ] **Step 3: Implement 출처별 분리 필터 탭 UI 및 필터 로직**
1. `real_estate_engine.js`: `filterProperties`에 `source` 옵션 지원 (`all`, `daangn`, `naver`)
2. `real_estate_view.js`:
- `this.selectedSource = 'all';`
- 찜 매물 상단(정렬/검색 바 위 또는 아래)에 출처별 칩 추가:
```html
<div class="re-source-filter-tabs" id="re-source-filter-tabs">
  <button class="re-source-tab active" data-source="all">전체 (${total})</button>
  <button class="re-source-tab" data-source="daangn">🥕 당근 찜만 (${daangnCount})</button>
  <button class="re-source-tab" data-source="naver">🟢 네이버 관심만 (${naverCount})</button>
</div>
```
- 클릭 시 active 토글 및 `this.selectedSource` 갱신 후 `refreshList()` 호출.

- [ ] **Step 4: Run test to verify it passes**
Run: `python3 -m unittest tests/test_daangn_realty.py -k "test_42"`

---

### Task 3: 버전 업데이트 및 전체 테스트 검증 동기화

**Files:**
- Modify: `index.html` (v3.9.0)
- Modify: `sw.js` (v3.9.0)
- Modify: `Couple-Calendar_버전기록_CHANGELOG.md` (v3.9.0 릴리즈 노트)
- Sync: `modules/` <-> root 파일 복제 및 외부 디렉토리 동기화

- [ ] **Step 1: Version bump index.html, sw.js, CHANGELOG.md**
- [ ] **Step 2: Run full test suite**
Run: `python3 -m unittest discover tests`
- [ ] **Step 3: Verify git status and diff**
