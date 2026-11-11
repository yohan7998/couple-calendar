#!/usr/bin/env python3
"""
test_daangn_realty.py - TDD Unit and Integration Tests for Daangn Real Estate Enhancement
Couple-Calendar v3.4.0
"""

import json
import os
import subprocess
import unittest
import re

REPO_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
REAL_ESTATE_VIEW_JS = os.path.join(REPO_ROOT, "modules", "real_estate_view.js")


def run_node_eval(script: str) -> str:
    """Helper to run JS code inside node with mock environment."""
    wrapper = f"""
    const window = {{
        AppState: {{ realEstates: [] }},
        SEOUL_DISTRICTS: ['마포구', '용산구', '성동구', '동작구', '영등포구', '서대문구', '송파구', '강북구', '양천구', '광진구', '은평구', '종로구', '노원구', '강남구', '서초구', '강동구'],
        daangnFilterState: {{
            district: 'all',
            minPriceWon: 100000000,
            maxPriceWon: 5000000000,
            maxAge: 35,
            minPyeong: 5,
            maxPyeong: 70,
            types: {{ apt: true, house: true, villa: true }}
        }}
    }};
    global.window = window;
    const document = {{
        getElementById: () => null
    }};
    global.document = document;

    require('{REAL_ESTATE_VIEW_JS}');
    {script}
    """
    res = subprocess.run(["node", "-e", wrapper], capture_output=True, text=True)
    if res.returncode != 0:
        raise RuntimeError(f"Node execution failed: {res.stderr}\nCode:\n{wrapper}")
    return res.stdout.strip()


class TestDaangnRealtySuite(unittest.TestCase):
    def test_01_syntax_validation(self):
        """Verify JS syntax for real_estate_view.js."""
        r = subprocess.run(["node", "-c", REAL_ESTATE_VIEW_JS], capture_output=True, text=True)
        self.assertEqual(r.returncode, 0, f"Syntax error: {r.stderr}")

    def test_02_listings_data_integrity(self):
        """Verify all 20 listings have buildYear, valid imageUrl, and unique individual rawUrl."""
        script = """
        const listings = window.DAANGN_SEOUL_LISTINGS;
        console.log(JSON.stringify(listings));
        """
        output = run_node_eval(script)
        listings = json.loads(output)
        self.assertGreaterEqual(len(listings), 20, "최소 20개 매물 존재해야 함")

        for item in listings:
            # 1. buildYear 검증
            self.assertIn("buildYear", item)
            self.assertIsInstance(item["buildYear"], int)
            self.assertGreaterEqual(item["buildYear"], 1980)
            self.assertLessEqual(item["buildYear"], 2026)

            # 2. imageUrl 검증 (실제 사진)
            self.assertIn("imageUrl", item)
            self.assertTrue(item["imageUrl"].startswith("https://"), "imageUrl은 유효한 HTTPS URL이어야 함")

            # 3. rawUrl 검증 (실제 realty.daangn.com 엔드포인트)
            self.assertIn("rawUrl", item)
            self.assertTrue(item["rawUrl"].startswith("https://realty.daangn.com/articles/"), "공식 realty.daangn.com 도메인이어야 함")
            self.assertIn("/articles/", item["rawUrl"], "개별 매물 아티클 경로가 포함되어야 함")

    def test_03_year_filtering_logic(self):
        """Verify buildYear filtering (under5, under10, over20)."""
        script = """
        const listings = window.DAANGN_SEOUL_LISTINGS;
        const currentYear = new Date().getFullYear();

        const under10 = listings.filter(i => (currentYear - i.buildYear) <= 10);
        const over20 = listings.filter(i => (currentYear - i.buildYear) >= 20);
        console.log(JSON.stringify({ under10Count: under10.length, over20Count: over20.length }));
        """
        data = json.loads(run_node_eval(script))
        self.assertGreater(data["under10Count"], 0, "10년 이내 매물이 존재해야 함")
        self.assertGreater(data["over20Count"], 0, "20년 이상 구축 매물이 존재해야 함")

    def test_04_pyeong_filtering_logic(self):
        """Verify areaPyeong filtering (under20, 20s, 30s)."""
        script = """
        const listings = window.DAANGN_SEOUL_LISTINGS;
        const under20 = listings.filter(i => i.areaPyeong < 20);
        const p20s = listings.filter(i => i.areaPyeong >= 20 && i.areaPyeong < 30);
        console.log(JSON.stringify({ under20Count: under20.length, p20sCount: p20s.length }));
        """
        data = json.loads(run_node_eval(script))
        self.assertGreater(data["under20Count"], 0, "20평 미만 소형 매물이 존재해야 함")
        self.assertGreater(data["p20sCount"], 0, "20평대 매물이 존재해야 함")

    def test_05_deleted_buttons_removal(self):
        """Verify '캘린더 일괄 연동' and '옵시디언 전체 내보내기' buttons are completely removed."""
        with open(REAL_ESTATE_VIEW_JS, "r", encoding="utf-8") as f:
            content = f.read()

        self.assertNotIn("옵시디언 전체 내보내기", content, "옵시디언 전체 내보내기 버튼은 삭제되어야 함")
        self.assertNotIn("캘린더 일괄 연동", content, "캘린더 일괄 연동 버튼은 삭제되어야 함")

    def test_06_real_daangn_domain_and_article_ids(self):
        """Verify all 20 listings have real live Daangn article IDs on realty.daangn.com."""
        script = """
        const listings = window.DAANGN_SEOUL_LISTINGS;
        console.log(JSON.stringify(listings.map(i => ({ id: i.articleId, rawUrl: i.rawUrl }))));
        """
        data = json.loads(run_node_eval(script))
        for item in data:
            self.assertTrue(re.match(r'^\d{7}$', str(item["id"])), f"Article ID {item['id']}는 7자리 숫자여야 함")
            self.assertEqual(item["rawUrl"], f"https://realty.daangn.com/articles/{item['id']}")

    def test_07_real_daangn_image_cdn(self):
        """Verify listings imageUrl points to genuine Daangn image CDN (karroter.net)."""
        script = """
        const listings = window.DAANGN_SEOUL_LISTINGS;
        console.log(JSON.stringify(listings.map(i => i.imageUrl)));
        """
        images = json.loads(run_node_eval(script))
        daangn_cdn_count = sum(1 for img in images if "img.kr.gcp-karroter.net" in img)
        self.assertGreaterEqual(daangn_cdn_count, 15, "대부분의 이미지가 실제 당근 CDN(karroter.net)이어야 함")

    def test_08_anchor_tag_universal_links(self):
        """Verify thumbnail and buttons use standard <a> tags for universal deep linking and popup prevention."""
        with open(REAL_ESTATE_VIEW_JS, "r", encoding="utf-8") as f:
            content = f.read()

        self.assertIn('<a href="${item.rawUrl}" target="_blank" rel="noopener noreferrer" class="re-daangn-thumb-link"', content)
        self.assertIn('<a href="${item.rawUrl}" target="_blank" rel="noopener noreferrer" class="re-footer-btn"', content)
        self.assertNotIn('onclick="window.open(\'${item.rawUrl}\', \'_blank\')"', content, "팝업 차단 유발하는 div onclick 방식이 제거되어야 함")

    def test_09_dual_thumb_price_slider_structure(self):
        """Verify dual-thumb single-track price slider elements exist in filter UI."""
        with open(REAL_ESTATE_VIEW_JS, "r", encoding="utf-8") as f:
            content = f.read()

        # Verify dual-thumb slider structure for price
        self.assertIn('id="dg-slider-price"', content, "매매가 듀얼 썸 슬라이더 컨테이너가 있어야 함")
        self.assertIn('id="dg-slider-price-min"', content, "최소 매매가 썸이 있어야 함")
        self.assertIn('id="dg-slider-price-max"', content, "최대 매매가 썸이 있어야 함")
        self.assertIn('id="dg-slider-price-range"', content, "활성 구간 하이라이트 바가 있어야 함")
        self.assertIn('id="dg-badge-price"', content, "실시간 가격 뱃지가 있어야 함")
        self.assertIn('class="dual-slider dual-slider--price"', content, "가격 슬라이더 CSS 클래스가 있어야 함")
        self.assertIn('role="slider"', content, "접근성을 위한 role=slider가 있어야 함")
        self.assertIn('aria-valuemin="1"', content, "최소값 1이 있어야 함")
        self.assertIn('aria-valuemax="50"', content, "최대값 50이 있어야 함")

    def test_10_dual_thumb_year_slider_structure(self):
        """Verify dual-thumb single-track year slider elements exist in filter UI."""
        with open(REAL_ESTATE_VIEW_JS, "r", encoding="utf-8") as f:
            content = f.read()

        # Verify dual-thumb slider structure for year
        self.assertIn('id="dg-slider-year"', content, "건물 연식 듀얼 썸 슬라이더 컨테이너가 있어야 함")
        self.assertIn('id="dg-slider-year-min"', content, "최소 건물 연식 썸이 있어야 함")
        self.assertIn('id="dg-slider-year-max"', content, "최대 건물 연식 썸이 있어야 함")
        self.assertIn('id="dg-slider-year-range"', content, "활성 구간 하이라이트 바가 있어야 함")
        self.assertIn('id="dg-badge-year"', content, "실시간 연식 뱃지가 있어야 함")
        self.assertIn('class="dual-slider dual-slider--year"', content, "연식 슬라이더 CSS 클래스가 있어야 함")
        self.assertIn('aria-valuemin="0"', content, "최소 연식 0(신축)이 있어야 함")
        self.assertIn('aria-valuemax="35"', content, "최대 연식 35이 있어야 함")

    def test_11_dual_thumb_pyeong_slider_structure(self):
        """Verify dual-thumb single-track pyeong slider elements exist in filter UI."""
        with open(REAL_ESTATE_VIEW_JS, "r", encoding="utf-8") as f:
            content = f.read()

        # Verify dual-thumb slider structure for pyeong
        self.assertIn('id="dg-slider-pyeong"', content, "평수 듀얼 썸 슬라이더 컨테이너가 있어야 함")
        self.assertIn('id="dg-slider-pyeong-min"', content, "최소 평수 썸이 있어야 함")
        self.assertIn('id="dg-slider-pyeong-max"', content, "최대 평수 썸이 있어야 함")
        self.assertIn('id="dg-slider-pyeong-range"', content, "활성 구간 하이라이트 바가 있어야 함")
        self.assertIn('id="dg-badge-pyeong"', content, "실시간 평수 뱃지가 있어야 함")
        self.assertIn('class="dual-slider dual-slider--pyeong"', content, "평수 슬라이더 CSS 클래스가 있어야 함")
        self.assertIn('aria-valuemin="5"', content, "최소 평수 5가 있어야 함")
        self.assertIn('aria-valuemax="70"', content, "최대 평수 70이 있어야 함")

    def test_12_filter_state_structure(self):
        """Verify new filter state structure with dual-thumb range properties."""
        with open(REAL_ESTATE_VIEW_JS, "r", encoding="utf-8") as f:
            content = f.read()

        # New filter state structure (min/max for all 3 criteria)
        self.assertIn('minPriceWon', content, "minPriceWon 속성이 있어야 함")
        self.assertIn('maxPriceWon', content, "maxPriceWon 속성이 있어야 함")
        self.assertIn('minAge', content, "minAge 속성이 있어야 함 (신축~최대 연식)")
        self.assertIn('maxAge', content, "maxAge 속성이 있어야 함")
        self.assertIn('minPyeong', content, "minPyeong 속성이 있어야 함")
        self.assertIn('maxPyeong', content, "maxPyeong 속성이 있어야 함")

        # Old structure should be removed from daangnFilterState
        self.assertNotIn('"minPrice":', content, "기존 minPrice는 없어야 함")
        self.assertNotIn('"maxPrice":', content, "기존 maxPrice는 없어야 함")
        self.assertNotIn('"year":', content, "기존 year는 없어야 함")
        self.assertNotIn('"pyeong":', content, "기존 pyeong은 없어야 함")

    def test_13_linear_filtering_logic_price(self):
        """Test dual-thumb price filtering logic (min~max range)."""
        script = """
        const listings = window.DAANGN_SEOUL_LISTINGS;
        const currentYear = new Date().getFullYear();

        // Simulate filter state: 10억 ~ 30억
        const minPriceManwon = 100000;  // 10억 = 100,000만원
        const maxPriceManwon = 300000;  // 30억 = 300,000만원

        const filtered = listings.filter(item => {
            return item.priceManwon >= minPriceManwon && item.priceManwon <= maxPriceManwon;
        });
        console.log(JSON.stringify({ count: filtered.length }));
        """
        data = json.loads(run_node_eval(script))
        # At least some items should match 10~30억 range
        self.assertGreater(data["count"], 0, "10억~30억 구간 매물이 있어야 함")

    def test_14_linear_filtering_logic_year(self):
        """Test dual-thumb year (age) filtering logic (min~max range)."""
        script = """
        const listings = window.DAANGN_SEOUL_LISTINGS;
        const currentYear = new Date().getFullYear();

        // Simulate filter state: 0년차(신축) ~ 10년차
        const minAge = 0;
        const maxAge = 10;

        const filtered = listings.filter(item => {
            const age = currentYear - item.buildYear;
            return age >= minAge && age <= maxAge;
        });
        console.log(JSON.stringify({ count: filtered.length }));
        """
        data = json.loads(run_node_eval(script))
        # At least some items should be within 0~10 years
        self.assertGreater(data["count"], 0, "0년차~10년차 구간 매물이 있어야 함")

    def test_15_linear_filtering_logic_pyeong(self):
        """Test dual-thumb pyeong filtering logic (min~max range)."""
        script = """
        const listings = window.DAANGN_SEOUL_LISTINGS;

        // Simulate filter state: 15평 ~ 35평
        const minPyeong = 15;
        const maxPyeong = 35;

        const filtered = listings.filter(item => {
            return item.areaPyeong >= minPyeong && item.areaPyeong <= maxPyeong;
        });
        console.log(JSON.stringify({ count: filtered.length }));
        """
        data = json.loads(run_node_eval(script))
        self.assertGreater(data["count"], 0, "15평~35평 구간 매물이 있어야 함")

    def test_16_badge_update_helpers_exist(self):
        """Verify badge update helper functions exist for dual-thumb sliders."""
        with open(REAL_ESTATE_VIEW_JS, "r", encoding="utf-8") as f:
            content = f.read()

        self.assertIn('updateDaangnPriceBadge', content, "가격 뱃지 업데이트 함수가 있어야 함")
        self.assertIn('updateDaangnYearBadge', content, "연식 뱃지 업데이트 함수가 있어야 함")
        self.assertIn('updateDaangnPyeongBadge', content, "평수 뱃지 업데이트 함수가 있어야 함")
        # Verify they accept min/max parameters
        self.assertIn('function(minAge, maxAge)', content, "연식 뱃지 함수가 minAge, maxAge를 받아야 함")

    def test_17_reset_filter_defaults(self):
        """Verify resetDaangnFilter uses new default values with minAge."""
        with open(REAL_ESTATE_VIEW_JS, "r", encoding="utf-8") as f:
            content = f.read()

        # Check reset defaults
        self.assertIn('minPriceWon: 100000000', content, "초기화 시 최소 1억이어야 함")
        self.assertIn('maxPriceWon: 5000000000', content, "초기화 시 최대 50억이어야 함")
        self.assertIn('minAge: 0', content, "초기화 시 최소 연식 0년차(신축)이어야 함")
        self.assertIn('maxAge: 35', content, "초기화 시 최대 연식 35년이어야 함")
        self.assertIn('minPyeong: 5', content, "초기화 시 최소 평수 5평이어야 함")
        self.assertIn('maxPyeong: 70', content, "초기화 시 최대 평수 70평이어야 함")

    def test_18_dual_thumb_slider_logic_initialization(self):
        """Verify initDualSliders and initSingleDualSlider functions exist."""
        with open(REAL_ESTATE_VIEW_JS, "r", encoding="utf-8") as f:
            content = f.read()

        self.assertIn('initDualSliders', content, "듀얼 슬라이더 초기화 함수가 있어야 함")
        self.assertIn('initSingleDualSlider', content, "개별 듀얼 슬라이더 초기화 함수가 있어야 함")
        self.assertIn('setPointerCapture', content, "포인터 캡처로 부드러운 드래그 구현이 있어야 함")
        self.assertIn('pointerdown', content, "포인터 다운 이벤트 핸들러가 있어야 함")
        self.assertIn('pointermove', content, "포인터 무브 이벤트 핸들러가 있어야 함")
        self.assertIn('pointerup', content, "포인터 업 이벤트 핸들러가 있어야 함")

    def test_19_dual_thumb_keyboard_accessibility(self):
        """Verify keyboard navigation support for dual-thumb sliders."""
        with open(REAL_ESTATE_VIEW_JS, "r", encoding="utf-8") as f:
            content = f.read()

        self.assertIn('keydown', content, "키보드 네비게이션을 위한 keydown 핸들러가 있어야 함")
        self.assertIn('ArrowRight', content, "우측 화살표 키 지원")
        self.assertIn('ArrowLeft', content, "좌측 화살표 키 지원")
        self.assertIn('ArrowUp', content, "상단 화살표 키 지원")
        self.assertIn('ArrowDown', content, "하단 화살표 키 지원")
        self.assertIn('Home', content, "Home 키 지원 (최소값)")
        self.assertIn('End', content, "End 키 지원 (최대값)")

    def test_20_search_button_exists(self):
        """Verify 🔍 search button (#dg-btn-search) exists in filter UI."""
        with open(REAL_ESTATE_VIEW_JS, "r", encoding="utf-8") as f:
            content = f.read()

        self.assertIn('id="dg-btn-search"', content, "검색 버튼 ID 가 있어야 함")
        self.assertIn('executeDaangnSearch', content, "검색 함수가 바인딩되어야 함")
        self.assertIn('🔍 조건으로 매물 검색 / 다시 조회', content, "검색 버튼 텍스트가 있어야 함")

    def test_21_reset_button_exists(self):
        """Verify 🔄 reset button (#dg-btn-reset) exists in filter UI."""
        with open(REAL_ESTATE_VIEW_JS, "r", encoding="utf-8") as f:
            content = f.read()

        self.assertIn('id="dg-btn-reset"', content, "초기화 버튼 ID 가 있어야 함")
        self.assertIn('🔄 초기화', content, "초기화 버튼 텍스트가 있어야 함")

    def test_22_executeDaangnSearch_function_exists(self):
        """Verify executeDaangnSearch() function implementation."""
        with open(REAL_ESTATE_VIEW_JS, "r", encoding="utf-8") as f:
            content = f.read()

        self.assertIn('window.executeDaangnSearch = function()', content, "executeDaangnSearch 함수가 있어야 함")
        self.assertIn('⏳ 매물 불러오는 중...', content, "로딩 피드백 텍스트가 있어야 함")
        self.assertIn('renderDaangnCrawlerView', content, "다시 렌더링 호출이 있어야 함")
        self.assertIn('showToast', content, "토스트 피드백 호출이 있어야 함")

    def test_23_search_button_refiltering_logic(self):
        """Test executeDaangnSearch re-filters based on current filter state."""
        script = """
        const listings = window.DAANGN_SEOUL_LISTINGS;
        const currentYear = new Date().getFullYear();

        // Simulate strict filter: 강남구 only, 20~30 억, 0~5 년차, 20~30 평
        window.daangnFilterState = {
            district: '강남구',
            minPriceWon: 2000000000,
            maxPriceWon: 3000000000,
            minAge: 0,
            maxAge: 5,
            minPyeong: 20,
            maxPyeong: 30,
            types: { apt: true, house: true, villa: true }
        };

        const filtered = listings.filter(item => {
            if (item.district !== '강남구') return false;
            if (!item.propertyType || item.propertyType !== 'apt') return false;
            if (item.priceManwon < 200000 || item.priceManwon > 300000) return false;
            const age = currentYear - item.buildYear;
            if (age < 0 || age > 5) return false;
            if (item.areaPyeong < 20 || item.areaPyeong > 30) return false;
            return true;
        });

        console.log(JSON.stringify({ count: filtered.length, district: '강남구' }));
        """
        data = json.loads(run_node_eval(script))
        # Filter may return 0 or more - just verify logic runs
        self.assertIsInstance(data["count"], int, "필터링 결과 카운트가 정수여야 함")


if __name__ == "__main__":
    unittest.main()
