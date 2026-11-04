#!/usr/bin/env python3
"""
Test Suite for Ledger & Dual Responsive Stats v2.5.0
프로젝트: couple-calendar
기능: 엑셀 연동 엔진, 템플릿 생성, 카테고리 매핑, 고정비 판별,
     모바일/웹 듀얼 통계 요약, 피벗 매트릭스 집계 전 항목 검증
"""

import unittest
import os
import subprocess
import json

EXCEL_ENGINE_JS = '/Users/yohan/couple-calendar/modules/excel_ledger_engine.js'
STATS_ENGINE_JS = '/Users/yohan/couple-calendar/modules/ledger_stats_view.js'
STATS_CSS = '/Users/yohan/couple-calendar/modules/ledger_stats.css'

class TestLedgerV25(unittest.TestCase):

    def setUp(self):
        self.assertTrue(os.path.exists(EXCEL_ENGINE_JS), "excel_ledger_engine.js 파일 없음")
        self.assertTrue(os.path.exists(STATS_ENGINE_JS), "ledger_stats_view.js 파일 없음")
        self.assertTrue(os.path.exists(STATS_CSS), "ledger_stats.css 파일 없음")

    def run_node_eval(self, js_code):
        cmd = ['node', '-e', js_code]
        res = subprocess.run(cmd, cwd='/Users/yohan/couple-calendar', capture_output=True, text=True)
        self.assertEqual(res.returncode, 0, f"Node eval 실패:\nSTDOUT: {res.stdout}\nSTDERR: {res.stderr}")
        return res.stdout.strip()

    def test_01_excel_engine_import(self):
        """1. excel_ledger_engine.js CommonJS 환경 정상 import 검증"""
        code = """
        const engine = require('./modules/excel_ledger_engine.js');
        if (typeof engine.parseCsvString === 'function') console.log('IMPORT_OK');
        """
        out = self.run_node_eval(code)
        self.assertIn('IMPORT_OK', out)

    def test_02_generate_template_data(self):
        """2. 표준 가계부 엑셀 템플릿 데이터 생성 검증"""
        code = """
        const engine = require('./modules/excel_ledger_engine.js');
        const tpl = engine.generateTemplateData();
        if (Array.isArray(tpl) && tpl.length >= 5 && tpl[0][0] === '날짜') {
            console.log('TEMPLATE_OK_' + tpl.length);
        }
        """
        out = self.run_node_eval(code)
        self.assertIn('TEMPLATE_OK_', out)

    def test_03_normalize_category_mapping(self):
        """3. 카테고리 지능적 매핑 검증 (식비, 카페, 마트 등)"""
        code = """
        const engine = require('./modules/excel_ledger_engine.js');
        const c1 = engine.normalizeCategory('스타벅스 아메리카노');
        const c2 = engine.normalizeCategory('이마트몰 장보기');
        const c3 = engine.normalizeCategory('월세');
        if (c1 === '카페/간식' && c2 === '마트/장보기' && c3 === '주거/통신') {
            console.log('CAT_MAP_OK');
        }
        """
        out = self.run_node_eval(code)
        self.assertIn('CAT_MAP_OK', out)

    def test_04_fixed_expense_detection(self):
        """4. 고정비 키워드 자동 감지 검증"""
        code = """
        const engine = require('./modules/excel_ledger_engine.js');
        const isF1 = engine.isFixedExpense('넷플릭스 4인팟 구독', '기타');
        const isF2 = engine.isFixedExpense('점심 찌개', '식비');
        if (isF1 === true && isF2 === false) {
            console.log('FIXED_DETECT_OK');
        }
        """
        out = self.run_node_eval(code)
        self.assertIn('FIXED_DETECT_OK', out)

    def test_05_normalize_shared_url(self):
        """5. 구글 시트 공유 링크 -> export?format=csv 변환 검증"""
        code = """
        const engine = require('./modules/excel_ledger_engine.js');
        const raw = 'https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit#gid=0';
        const norm = engine.normalizeSharedUrl(raw);
        if (norm.includes('export?format=csv') && norm.includes('1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms')) {
            console.log('URL_NORM_OK');
        }
        """
        out = self.run_node_eval(code)
        self.assertIn('URL_NORM_OK', out)

    def test_06_deduplicate_transactions(self):
        """6. 스마트 멱등성 중복 제거 검증"""
        code = """
        const engine = require('./modules/excel_ledger_engine.js');
        const existing = [
            { date: '2026-11-01', amount: 10000, type: 'expense', category: '식비', memo: '국밥' }
        ];
        const incoming = [
            { date: '2026-11-01', amount: 10000, type: 'expense', category: '식비', memo: '국밥' }, // 중복
            { date: '2026-11-02', amount: 5000, type: 'expense', category: '카페/간식', memo: '커피' } // 신규
        ];
        const res = engine.deduplicateTransactions(existing, incoming);
        if (res.addedCount === 1 && res.skippedCount === 1) {
            console.log('DEDUP_OK');
        }
        """
        out = self.run_node_eval(code)
        self.assertIn('DEDUP_OK', out)

    def test_07_export_to_excel_data(self):
        """7. 엑셀 내보내기 2차원 배열 변환 검증"""
        code = """
        const engine = require('./modules/excel_ledger_engine.js');
        const txs = [
            { date: '2026-11-01', type: 'expense', category: '식비', amount: 20000, payer: 'juni', isFixed: false, memo: '초밥' }
        ];
        const rows = engine.exportToExcelData(txs);
        if (rows.length === 2 && rows[0][0] === '날짜' && rows[1][3] === 20000) {
            console.log('EXPORT_ROWS_OK');
        }
        """
        out = self.run_node_eval(code)
        self.assertIn('EXPORT_ROWS_OK', out)

    def test_08_stats_engine_import(self):
        """8. ledger_stats_view.js CommonJS 환경 정상 import 검증"""
        code = """
        const stats = require('./modules/ledger_stats_view.js');
        if (typeof stats.calculateMonthlySummary === 'function') console.log('STATS_IMPORT_OK');
        """
        out = self.run_node_eval(code)
        self.assertIn('STATS_IMPORT_OK', out)

    def test_09_calculate_monthly_summary(self):
        """9. 월별 수입/지출/예산 요약 및 고정비 비중 연산 검증"""
        code = """
        const stats = require('./modules/ledger_stats_view.js');
        const txs = [
            { date: '2026-11-01', type: 'expense', amount: 30000, isFixed: false },
            { date: '2026-11-02', type: 'expense', amount: 70000, isFixed: true }, // 고정비
            { date: '2026-11-03', type: 'income', amount: 200000 },
            { date: '2026-10-25', type: 'expense', amount: 50000 } // 지난달 (배제)
        ];
        const res = stats.calculateMonthlySummary(txs, '2026-11', 100000);
        if (res.totalExpense === 100000 && res.fixedExpense === 70000 && res.fixedRate === 70 && res.budgetUsedRate === 100) {
            console.log('SUMMARY_OK');
        }
        """
        out = self.run_node_eval(code)
        self.assertIn('SUMMARY_OK', out)

    def test_10_calculate_payer_distribution(self):
        """10. 부부(주니 vs 용이 vs 공동) 분담 비율 연산 검증"""
        code = """
        const stats = require('./modules/ledger_stats_view.js');
        const txs = [
            { date: '2026-11-01', type: 'expense', amount: 60000, payer: 'juni' },
            { date: '2026-11-02', type: 'expense', amount: 40000, payer: 'yongi' }
        ];
        const dist = stats.calculatePayerDistribution(txs, '2026-11');
        if (dist.juni === 60000 && dist.yongi === 40000 && dist.juniPercent === 60 && dist.yongiPercent === 40) {
            console.log('PAYER_DIST_OK');
        }
        """
        out = self.run_node_eval(code)
        self.assertIn('PAYER_DIST_OK', out)

    def test_11_calculate_category_summary(self):
        """11. 카테고리별 합계 내림차순 정렬 검증"""
        code = """
        const stats = require('./modules/ledger_stats_view.js');
        const txs = [
            { date: '2026-11-01', type: 'expense', amount: 20000, category: '식비' },
            { date: '2026-11-02', type: 'expense', amount: 50000, category: '마트/장보기' },
            { date: '2026-11-03', type: 'expense', amount: 30000, category: '식비' }
        ];
        const cats = stats.calculateCategorySummary(txs, '2026-11');
        if (cats.length === 2 && cats[0].category === '식비' && cats[0].amount === 50000 && cats[1].amount === 50000) {
            console.log('CAT_SUMMARY_OK');
        }
        """
        out = self.run_node_eval(code)
        self.assertIn('CAT_SUMMARY_OK', out)

    def test_12_calculate_monthly_trends(self):
        """12. 최근 월별 지출 트렌드 연산 검증"""
        code = """
        const stats = require('./modules/ledger_stats_view.js');
        const txs = [
            { date: '2026-09-10', type: 'expense', amount: 100000 },
            { date: '2026-10-15', type: 'expense', amount: 150000 },
            { date: '2026-11-01', type: 'expense', amount: 80000 }
        ];
        const trends = stats.calculateMonthlyTrends(txs, 3);
        if (trends.length === 3 && trends[0].month === '2026-09' && trends[2].month === '2026-11') {
            console.log('TRENDS_OK');
        }
        """
        out = self.run_node_eval(code)
        self.assertIn('TRENDS_OK', out)

    def test_13_calculate_pivot_matrix(self):
        """13. 대화면 피벗 매트릭스 (월별 x 카테고리) 및 총합계 검증"""
        code = """
        const stats = require('./modules/ledger_stats_view.js');
        const txs = [
            { date: '2026-10-01', type: 'expense', category: '식비', amount: 30000 },
            { date: '2026-11-01', type: 'expense', category: '식비', amount: 40000 },
            { date: '2026-11-02', type: 'expense', category: '교통', amount: 10000 }
        ];
        const pivot = stats.calculatePivotMatrix(txs, 3);
        if (pivot.months.includes('2026-10') && pivot.months.includes('2026-11') &&
            pivot.matrix['식비']['2026-11'] === 40000 &&
            pivot.rowTotals['식비'] === 70000 &&
            pivot.colTotals['2026-11'] === 50000 &&
            pivot.grandTotal === 80000) {
            console.log('PIVOT_MATRIX_OK');
        }
        """
        out = self.run_node_eval(code)
        self.assertIn('PIVOT_MATRIX_OK', out)

    def test_14_render_mobile_stats_html(self):
        """14. 모바일 통계 HTML 컴포넌트 렌더링 검증"""
        code = """
        const stats = require('./modules/ledger_stats_view.js');
        const txs = [
            { date: '2026-11-01', type: 'expense', category: '식비', amount: 45000, payer: 'juni' }
        ];
        const html = stats.renderMobileStatsHtml(txs, '2026-11', 100000);
        if (html.includes('mobile-stats-container') && html.includes('45,000') && html.includes('부부 지출 분담률')) {
            console.log('MOBILE_HTML_OK');
        }
        """
        out = self.run_node_eval(code)
        self.assertIn('MOBILE_HTML_OK', out)

    def test_15_render_web_pivot_table_html(self):
        """15. 웹 피벗 매트릭스 테이블 HTML 렌더링 검증"""
        code = """
        const stats = require('./modules/ledger_stats_view.js');
        const txs = [
            { date: '2026-11-01', type: 'expense', category: '식비', amount: 50000 }
        ];
        const html = stats.renderWebPivotTableHtml(txs, 6);
        if (html.includes('web-pivot-card') && html.includes('pivot-table') && html.includes('카테고리 합계')) {
            console.log('WEB_PIVOT_HTML_OK');
        }
        """
        out = self.run_node_eval(code)
        self.assertIn('WEB_PIVOT_HTML_OK', out)


if __name__ == '__main__':
    unittest.main()
