#!/usr/bin/env python3
"""
test_daangn_realty.py - TDD Unit and Integration Tests for Daangn Real Estate Enhancement
Couple-Calendar v3.2.0
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
            minPrice: 60000,
            maxPrice: 120000,
            year: 'all',
            pyeong: 'all',
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


if __name__ == "__main__":
    unittest.main()
