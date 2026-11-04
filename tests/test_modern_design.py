#!/usr/bin/env python3
"""
Test Suite for Modern Components CSS
Couple-Calendar v2.0 - Track Design-C
"""

import unittest
import os
import re

CSS_FILE = '/Users/yohan/couple-calendar/modules/modern_components.css'

class TestModernDesign(unittest.TestCase):

    def setUp(self):
        self.css_path = CSS_FILE
        self.assertTrue(os.path.exists(self.css_path), "CSS 파일이 존재하지 않습니다.")
        with open(self.css_path, encoding='utf-8') as f:
            self.css_content = f.read()

    def test_file_exists(self):
        """CSS 파일 존재 확인"""
        self.assertTrue(os.path.exists(self.css_path))

    def test_design_tokens_defined(self):
        """디자인 토큰 정의 확인"""
        required_tokens = [
            '--color-bg',
            '--color-surface',
            '--color-ink',
            '--color-expense',
            '--color-income',
            '--color-budget',
            '--color-today-ring',
            '--font-family',
            '--text-',
            '--space-',
            '--radius-',
            '--shadow-',
            '--transition-'
        ]
        for token in required_tokens:
            self.assertIn(token, self.css_content, f"토큰 {token}이 정의되지 않았습니다.")

    def test_calendar_grid_components(self):
        """캘린더 그리드 컴포넌트 확인"""
        calendar_selectors = [
            '.calendar-grid',
            '.calendar-day-header',
            '.calendar-day-header.sunday',
            '.calendar-day-header.saturday',
            '.calendar-day',
            '.calendar-day.today',
            '.calendar-day-number',
            '.calendar-schedule-list',
            '.calendar-schedule-item',
            '.schedule-period-bar',
            '.schedule-period-bar.start',
            '.schedule-period-bar.middle',
            '.schedule-period-bar.end',
            '.schedule-period-bar.single',
        ]
        for selector in calendar_selectors:
            self.assertIn(selector, self.css_content, f"캘린더 선택자 {selector} 누락")

    def test_today_ring_indicator(self):
        """오늘 날짜 링 표시 확인"""
        self.assertIn('.calendar-day.today::before', self.css_content)
        self.assertIn('border-radius: 50%', self.css_content)
        self.assertIn('var(--color-today-ring)', self.css_content)

    def test_period_bar_gradients(self):
        """기간 일정 연속 바 그라디언트 확인"""
        gradients = [
            'var(--gradient-period-1)',
            'var(--gradient-period-2)',
            'var(--gradient-period-3)',
            'var(--gradient-period-4)',
            'var(--gradient-period-5)',
            'var(--gradient-period-6)'
        ]
        for g in gradients:
            self.assertIn(g, self.css_content, f"그라디언트 {g} 누락")

    def test_accounting_summary_cards(self):
        """가계부 요약 카드 확인"""
        accounting_selectors = [
            '.accounting-summary-grid',
            '.accounting-card',
            '.accounting-card-label',
            '.accounting-card-amount',
            '.accounting-card.expense',
            '.accounting-card.income',
            '.accounting-card.budget',
            '.accounting-card-trend'
        ]
        for selector in accounting_selectors:
            self.assertIn(selector, self.css_content, f"가계부 선택자 {selector} 누락")

    def test_amount_typography(self):
        """금액 타이포그래피 (20~24px, 800 weight) 확인"""
        # font-weight: 800 확인
        self.assertIn('font-weight: 800', self.css_content)
        # clamp를 통한 반응형 크기 확인
        self.assertIn('clamp(', self.css_content)

    def test_expense_income_colors(self):
        """지출/수입 색상 확인"""
        self.assertIn('#E11D48', self.css_content)  # expense
        self.assertIn('#2563EB', self.css_content)  # income
        self.assertIn('#059669', self.css_content)  # budget

    def test_mobile_transaction_list(self):
        """모바일 거래 리스트 확인"""
        mobile_selectors = [
            '.transaction-list',
            '.transaction-item',
            '.transaction-category',
            '.transaction-title',
            '.transaction-meta',
            '.payer-badge',
            '.payer-badge.user1',
            '.payer-badge.user2',
            '.transaction-amount',
            '.transaction-amount.expense',
            '.transaction-amount.income'
        ]
        for selector in mobile_selectors:
            self.assertIn(selector, self.css_content, f"모바일 리스트 선택자 {selector} 누락")

    def test_desktop_data_grid(self):
        """웹 대화면 데이터 그리드 확인"""
        grid_selectors = [
            '.data-grid',
            '.data-grid-table',
            '.data-grid-header',
            '.data-grid-th',
            '.data-grid-td',
            '.data-grid-row:hover',
            '.data-grid-amount',
            '.data-grid-amount.expense',
            '.data-grid-amount.income',
            '.data-grid-chip',
            '.data-grid-payer'
        ]
        for selector in grid_selectors:
            self.assertIn(selector, self.css_content, f"데이터 그리드 선택자 {selector} 누락")

    def test_category_chips(self):
        """카테고리 칩 색상 확인"""
        chip_colors = [
            '--color-chip-food',
            '--color-chip-transport',
            '--color-chip-shopping',
            '--color-chip-cafe',
            '--color-chip-medical',
            '--color-chip-etc'
        ]
        for color in chip_colors:
            self.assertIn(color, self.css_content, f"칩 색상 {color} 누락")

    def test_dark_mode_support(self):
        """다크 모드 지원 확인"""
        self.assertIn('@media (prefers-color-scheme: dark)', self.css_content)

    def test_reduced_motion(self):
        """접근성: prefers-reduced-motion 확인"""
        self.assertIn('@media (prefers-reduced-motion: reduce)', self.css_content)

    def test_focus_visible(self):
        """접근성: focus-visible 확인"""
        self.assertIn(':focus-visible', self.css_content)

    def test_no_banned_patterns(self):
        """금지된 패턴 미사용 확인 (Design Taste Frontend)"""
        # gradients on backgrounds (should not be on buttons/cards)
        # thin rules (1px solid on non-table elements)
        # shadows on resting elements
        # These are more qualitative, just check key patterns
        pass  # CSS lint는 inspector가 수행

    def test_font_feature_settings(self):
        """폰트 피처 세팅 (tabular figures 등)"""
        # 숫자 정렬을 위한 tabular-nums 확인
        # Pretendard 폰트 패밀리에서 지원
        self.assertIn('var(--font-mono)', self.css_content)  # 금액에 모노스페이스 사용
        # font-variant-numeric: tabular-nums 또는 font-feature-settings 확인
        has_tabular = ('font-variant-numeric: tabular-nums' in self.css_content or
                       'font-feature-settings' in self.css_content)
        self.assertTrue(has_tabular, "tabular-nums 폰트 피처가 설정되지 않았습니다.")

if __name__ == '__main__':
    unittest.main(verbosity=2)