#!/usr/bin/env python3
"""
test_daangn_realty.py - TDD Unit and Integration Tests for Daangn Real Estate Enhancement
Couple-Calendar v3.1.0
"""

import json
import os
import subprocess
import unittest

REPO_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
REAL_ESTATE_VIEW_JS = os.path.join(REPO_ROOT, "modules", "real_estate_view.js")


def run_node_eval(script: str) -> str:
    """Helper to run JS code inside node with mock environment."""
    wrapper = f"""
    const window = {{
        AppState: {{ realEstates: [] }},
        SEOUL_DISTRICTS: ['마포구', '용산구', '성동구', '동작구', '영등포구', '서대문구', '송파구', '강북구', '양천구', '광진구', '은평구', '종로구', '노원구'],
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

            # 3. rawUrl 검증 (전체 페이지가 아닌 개별 매물 상세 직결 URL)
            self.assertIn("rawUrl", item)
            self.assertNotEqual(item["rawUrl"], "https://www.daangn.com/kr/realty/", "전체 페이지가 아니어야 함")
            self.assertIn("/articles/", item["rawUrl"], "개별 매물 아티클 경로가 포함되어야 함")

    def test_03_year_filtering_logic(self):
        """Verify buildYear filtering (under5, under10, over20)."""
        script = """
        const listings = window.DAANGN_SEOUL_LISTINGS;
        const currentYear = new Date().getFullYear();

        const under5 = listings.filter(i => (currentYear - i.buildYear) <= 5);
        const over20 = listings.filter(i => (currentYear - i.buildYear) > 20);
        console.log(JSON.stringify({ under5Count: under5.length, over20Count: over20.length }));
        """
        data = json.loads(run_node_eval(script))
        self.assertGreater(data["under5Count"], 0, "5년 이내 신축 매물이 존재해야 함")
        self.assertGreater(data["over20Count"], 0, "20년 이상 구축 매물이 존재해야 함")

    def test_04_pyeong_filtering_logic(self):
        """Verify areaPyeong filtering (20s, 30s)."""
        script = """
        const listings = window.DAANGN_SEOUL_LISTINGS;
        const p20s = listings.filter(i => i.areaPyeong >= 20 && i.areaPyeong < 30);
        const p30s = listings.filter(i => i.areaPyeong >= 30 && i.areaPyeong < 40);
        console.log(JSON.stringify({ p20sCount: p20s.length, p30sCount: p30s.length }));
        """
        data = json.loads(run_node_eval(script))
        self.assertGreater(data["p20sCount"], 0, "20평대 매물이 존재해야 함")
        self.assertGreater(data["p30sCount"], 0, "30평대 매물이 존재해야 함")

    def test_05_deleted_buttons_removal(self):
        """Verify '캘린더 일괄 연동' and '옵시디언 전체 내보내기' buttons are completely removed."""
        with open(REAL_ESTATE_VIEW_JS, "r", encoding="utf-8") as f:
            content = f.read()

        self.assertNotIn("옵시디언 전체 내보내기", content, "옵시디언 전체 내보내기 버튼은 삭제되어야 함")
        self.assertNotIn("캘린더 일괄 연동", content, "캘린더 일괄 연동 버튼은 삭제되어야 함")


if __name__ == "__main__":
    unittest.main()
