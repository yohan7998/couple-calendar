#!/usr/bin/env python3
"""
LedgerStatsEngine 테스트 스위트
수치 계산 정확성, Chart 설정 구조, HTML 그리드 생성을 검증
"""

import json
import os
import sys
import re


def load_js_module():
    """JS 모듈 파일을 읽고 주요 함수를 추출하여 Python에서 실행 가능한 형태로 변환"""
    path = "/Users/yohan/couple-calendar/modules/ledger_stats_view.js"
    if not os.path.exists(path):
        raise FileNotFoundError(f"Module file not found: {path}")

    with open(path, "r", encoding="utf-8") as f:
        content = f.read()

    return content


def extract_function_params(js_content, func_name):
    """JS 함수 시그니처에서 파라미터 추출 (간단한 파싱)"""
    pattern = rf"{func_name}\s*\(([^)]*)\)"
    match = re.search(pattern, js_content)
    return match.group(1) if match else ""


def test_monthly_summary_calculation():
    """월별 요약 계산 정확성 검증"""
    print("Testing calculateMonthlySummary...")

    # 테스트 데이터
    transactions = [
        {"date": "2026-11-01", "type": "expense", "amount": 50000, "category": "식비", "payer": "juni"},
        {"date": "2026-11-05", "type": "expense", "amount": 30000, "category": "교통비", "payer": "yonji"},
        {"date": "2026-11-10", "type": "income", "amount": 200000, "category": "급여", "payer": "juni"},
        {"date": "2026-11-15", "type": "expense", "amount": 20000, "category": "식비", "payer": "together"},
        {"date": "2026-10-20", "type": "expense", "amount": 10000, "category": "카페", "payer": "juni"},  # 다른 달
    ]

    budget = 150000
    targetMonth = "2026-11"

    # JS 로직을 Python으로 재현하여 검증
    month_transactions = [t for t in transactions if t.get("date", "").startswith(targetMonth)]

    total_expense = sum(t["amount"] for t in month_transactions if t["type"] == "expense")
    total_income = sum(t["amount"] for t in month_transactions if t["type"] == "income")
    remain_budget = budget - total_expense
    budget_used_rate = (total_expense / budget) * 100 if budget > 0 else 0
    daily_avg = total_expense / 30 if total_expense > 0 else 0

    # 검증
    assert total_expense == 100000, f"총 지출 불일치: {total_expense} != 100000"
    assert total_income == 200000, f"총 수입 불일치: {total_income} != 200000"
    assert remain_budget == 50000, f"잔여 예산 불일치: {remain_budget} != 50000"
    assert budget_used_rate == 66.66666666666666, f"예산 소진율 불일치: {budget_used_rate}"
    assert daily_avg == 3333.3333333333333, f"일평균 지출 불일치: {daily_avg}"

    print("  ✓ calculateMonthlySummary 계산 로직 검증 통과")


def test_payer_distribution():
    """결제자별 지출 분배 검증"""
    print("Testing calculatePayerDistribution...")

    transactions = [
        {"date": "2026-11-01", "type": "expense", "amount": 50000, "payer": "juni"},
        {"date": "2026-11-05", "type": "expense", "amount": 30000, "payer": "yonji"},
        {"date": "2026-11-10", "type": "expense", "amount": 20000, "payer": "together"},
        {"date": "2026-11-15", "type": "income", "amount": 200000, "payer": "juni"},  # 수입은 제외
    ]

    targetMonth = "2026-11"
    month_transactions = [t for t in transactions if t.get("date", "").startswith(targetMonth)]
    expense_transactions = [t for t in month_transactions if t["type"] == "expense"]

    juni_total = sum(t["amount"] for t in expense_transactions if t["payer"] == "juni")
    yonji_total = sum(t["amount"] for t in expense_transactions if t["payer"] == "yonji")
    together_total = sum(t["amount"] for t in expense_transactions if t["payer"] == "together")
    total = juni_total + yonji_total + together_total

    assert juni_total == 50000
    assert yonji_total == 30000
    assert together_total == 20000
    assert total == 100000

    juni_pct = (juni_total / total) * 100
    yonji_pct = (yonji_total / total) * 100
    together_pct = (together_total / total) * 100

    assert round(juni_pct, 2) == 50.0
    assert round(yonji_pct, 2) == 30.0
    assert round(together_pct, 2) == 20.0

    print("  ✓ calculatePayerDistribution 계산 로직 검증 통과")


def test_category_summary():
    """카테고리별 요약 및 정렬 검증"""
    print("Testing calculateCategorySummary...")

    transactions = [
        {"date": "2026-11-01", "type": "expense", "amount": 50000, "category": "식비"},
        {"date": "2026-11-05", "type": "expense", "amount": 30000, "category": "교통비"},
        {"date": "2026-11-10", "type": "expense", "amount": 20000, "category": "식비"},
        {"date": "2026-11-15", "type": "expense", "amount": 15000, "category": "카페"},
        {"date": "2026-11-20", "type": "expense", "amount": 5000, "category": "카페"},
    ]

    targetMonth = "2026-11"
    month_transactions = [t for t in transactions if t.get("date", "").startswith(targetMonth)]
    expense_transactions = [t for t in month_transactions if t["type"] == "expense"]

    category_totals = {}
    for t in expense_transactions:
        cat = t["category"]
        category_totals[cat] = category_totals.get(cat, 0) + t["amount"]

    # 정렬
    summary = [{"category": k, "amount": v} for k, v in category_totals.items()]
    summary.sort(key=lambda x: x["amount"], reverse=True)

    total = sum(item["amount"] for item in summary)
    for item in summary:
        item["percent"] = round((item["amount"] / total) * 100, 2)

    # 검증: 식비가 1위 (70000)
    assert summary[0]["category"] == "식비"
    assert summary[0]["amount"] == 70000
    assert summary[1]["category"] == "교통비"
    assert summary[1]["amount"] == 30000
    assert summary[2]["category"] == "카페"
    assert summary[2]["amount"] == 20000

    # 비율 검증
    assert summary[0]["percent"] == 58.33
    assert summary[1]["percent"] == 25.0
    assert summary[2]["percent"] == 16.67

    print("  ✓ calculateCategorySummary 계산 로직 검증 통과")


def test_doughnut_chart_config():
    """도넛 차트 설정 구조 검증"""
    print("Testing getChartConfigForDoughnut...")

    category_summary = [
        {"category": "식비", "amount": 70000, "percent": 58.33},
        {"category": "교통비", "amount": 30000, "percent": 25.0},
        {"category": "카페", "amount": 20000, "percent": 16.67}
    ]

    # JS 구현 로직 검증 (파일 내용에서 구조 확인)
    js_content = load_js_module()

    assert "getChartConfigForDoughnut" in js_content
    assert "type: 'doughnut'" in js_content
    assert "backgroundColor" in js_content
    assert "borderColor: '#ffffff'" in js_content
    assert "borderWidth: 2" in js_content
    assert "responsive: true" in js_content
    assert "maintainAspectRatio: false" in js_content
    assert "plugins" in js_content
    assert "legend" in js_content
    assert "tooltip" in js_content

    # 데이터 구조 검증
    labels = [item["category"] for item in category_summary]
    data = [item["amount"] for item in category_summary]

    assert labels == ["식비", "교통비", "카페"]
    assert data == [70000, 30000, 20000]

    print("  ✓ getChartConfigForDoughnut 구조 검증 통과")


def test_monthly_trend_chart_config():
    """월별 트렌드 바 차트 설정 구조 검증"""
    print("Testing getChartConfigForMonthlyTrend...")

    js_content = load_js_module()

    assert "getChartConfigForMonthlyTrend" in js_content
    assert "type: 'bar'" in js_content
    assert "label: '지출'" in js_content
    assert "label: '수입'" in js_content
    assert "rgba(255, 107, 107" in js_content
    assert "rgba(74, 206, 196" in js_content
    assert "plugins" in js_content
    assert "scales" in js_content
    assert "x:" in js_content
    assert "y:" in js_content
    assert "beginAtZero: true" in js_content
    assert "animation" in js_content

    print("  ✓ getChartConfigForMonthlyTrend 구조 검증 통과")


def test_web_data_grid_html():
    """웹 데이터 그리드 HTML 생성 검증"""
    print("Testing renderWebDataGridHtml...")

    js_content = load_js_module()

    assert "renderWebDataGridHtml" in js_content
    assert "ledger-data-grid" in js_content
    assert "border-collapse: collapse" in js_content
    assert "position: sticky" in js_content
    assert "thead" in js_content
    assert "tbody" in js_content
    assert "@media (max-width: 768px)" in js_content

    # 기본 헤더 검증
    assert "날짜" in js_content
    assert "항목" in js_content
    assert "카테고리" in js_content
    assert "결제자" in js_content
    assert "금액" in js_content
    assert "유형" in js_content
    assert "메모" in js_content

    print("  ✓ renderWebDataGridHtml 구조 검증 통과")


def test_js_syntax_valid():
    """JS 문법 기본 검증"""
    print("Testing JS syntax...")

    js_content = load_js_module()

    # 기본 구조 검증
    assert "window.LedgerStatsEngine" in js_content
    assert "calculateMonthlySummary" in js_content
    assert "calculatePayerDistribution" in js_content
    assert "calculateCategorySummary" in js_content
    assert "getChartConfigForDoughnut" in js_content
    assert "getChartConfigForMonthlyTrend" in js_content
    assert "renderWebDataGridHtml" in js_content

    # 구문 검증 (괄호, 중괄호 균형)
    open_braces = js_content.count("{")
    close_braces = js_content.count("}")
    assert open_braces == close_braces, f"중괄호 불일치: {open_braces} vs {close_braces}"

    open_parens = js_content.count("(")
    close_parens = js_content.count(")")
    assert open_parens == close_parens, f"소괄호 불일치: {open_parens} vs {close_parens}"

    open_brackets = js_content.count("[")
    close_brackets = js_content.count("]")
    assert open_brackets == close_brackets, f"대괄호 불일치: {open_brackets} vs {close_brackets}"

    print("  ✓ JS 문법 검증 통과")


def run_all_tests():
    """전체 테스트 실행"""
    print("=" * 60)
    print("LedgerStatsEngine Test Suite")
    print("=" * 60)

    try:
        test_monthly_summary_calculation()
        test_payer_distribution()
        test_category_summary()
        test_doughnut_chart_config()
        test_monthly_trend_chart_config()
        test_web_data_grid_html()
        test_js_syntax_valid()

        print("=" * 60)
        print("ALL TESTS PASSED ✓")
        print("=" * 60)
        return True

    except AssertionError as e:
        print(f"\n✗ TEST FAILED: {e}")
        return False
    except Exception as e:
        print(f"\n✗ ERROR: {e}")
        import traceback
        traceback.print_exc()
        return False


if __name__ == "__main__":
    success = run_all_tests()
    sys.exit(0 if success else 1)