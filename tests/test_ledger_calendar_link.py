#!/usr/bin/env python3
"""
Test Suite for Ledger-Calendar Bridge and Deduplication Engine
Couple-Calendar v2.2
"""

import unittest
import os
import re

INDEX_PATH = '/Users/yohan/couple-calendar/index.html'
EXCEL_ENGINE_PATH = '/Users/yohan/couple-calendar/modules/excel_ledger_engine.js'

class TestLedgerCalendarLink(unittest.TestCase):

    def setUp(self):
        self.assertTrue(os.path.exists(INDEX_PATH), "index.html이 존재하지 않습니다.")
        self.assertTrue(os.path.exists(EXCEL_ENGINE_PATH), "excel_ledger_engine.js가 존재하지 않습니다.")
        with open(INDEX_PATH, 'r', encoding='utf-8') as f:
            self.index_html = f.read()
        with open(EXCEL_ENGINE_PATH, 'r', encoding='utf-8') as f:
            self.excel_engine_js = f.read()

    # --- Task 1: Deduplication & Fingerprint Tests ---
    def test_fingerprint_functions_in_excel_engine(self):
        """excel_ledger_engine.js에 지문 생성 및 멱등 중복 제거 함수가 정의되어 있는지 확인"""
        self.assertIn("generateTxFingerprint", self.excel_engine_js)
        self.assertIn("deduplicateTransactions", self.excel_engine_js)

    def test_fingerprint_functions_in_index_html(self):
        """index.html 인라인 모듈에도 지문 생성 및 멱등 수집 로직이 정의되어 있는지 확인"""
        self.assertIn("generateTxFingerprint", self.index_html)
        self.assertIn("deduplicateTransactions", self.index_html)
        self.assertIn("ingestTransactionsWithDeduplication", self.index_html)

    def test_shared_sheet_uses_deduplication(self):
        """공유 시트 동기화 및 엑셀 업로드 시 중복 방지 수집기가 적용되어 있는지 확인"""
        self.assertIn("ingestTransactionsWithDeduplication", self.index_html)
        # syncSharedSpreadsheet 함수 내에서 ingestTransactionsWithDeduplication 호출 확인
        sync_match = re.search(r'async function syncSharedSpreadsheet\(\)[\s\S]*?function triggerExcelFileInput', self.index_html)
        self.assertTrue(sync_match, "syncSharedSpreadsheet 함수를 찾을 수 없습니다.")
        self.assertIn("ingestTransactionsWithDeduplication", sync_match.group(0))

    # --- Task 2: Calendar Expense Badges Tests ---
    def test_calendar_render_expense_badge(self):
        """renderCalendar 내에서 일자별 지출을 집계하고 배지를 렌더링하는지 확인"""
        self.assertIn("badge-expense-wrapper", self.index_html)
        self.assertIn("badge-expense-amount", self.index_html)
        self.assertIn("badge-expense-icon", self.index_html)

    def test_calendar_expense_badge_styles(self):
        """지출 배지용 CSS 클래스가 정의되어 있는지 확인"""
        with open('/Users/yohan/couple-calendar/modules/modern_components.css', encoding='utf-8') as f:
            css_content = f.read()
        self.assertTrue(
            ".badge-expense-wrapper" in self.index_html or 
            ".badge-expense-wrapper" in css_content,
            "badge-expense-wrapper CSS 클래스가 정의되지 않았습니다."
        )

    # --- Task 3: Day Detail Modal Ledger Section Tests ---
    def test_day_detail_modal_has_ledger_list(self):
        """#day-detail-modal 내에 #day-ledger-list 섹션이 존재하는지 확인"""
        self.assertIn('id="day-ledger-list"', self.index_html)

    def test_open_day_detail_populates_ledger(self):
        """openDayDetail 함수에서 당일 생활비 내역을 렌더링하는지 확인"""
        match = re.search(r'function openDayDetail\([^\)]*\)\s*\{([\s\S]*?)\n    \}', self.index_html)
        self.assertTrue(match, "openDayDetail 함수를 찾을 수 없습니다.")
        content = match.group(1)
        self.assertIn("day-ledger-list", content)

    def test_day_detail_quick_action_button(self):
        """날짜 상세 모달에 생활비 등록 버튼 및 핸들러가 존재하는지 확인"""
        self.assertIn("openRecordLedgerForDay", self.index_html)
        self.assertIn("deleteTransactionFromDayDetail", self.index_html)


if __name__ == '__main__':
    unittest.main()
