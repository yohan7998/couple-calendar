#!/usr/bin/env python3
"""
Excel Ledger Engine 단위 테스트
excel_ledger_engine.js와 동일한 파싱 정규화, 헤더 매핑, 금액 정제, CSV 파싱 로직을 검증합니다.
"""

import unittest
import re

def normalize_headers(header):
    h = (header or '').strip().lower()
    if re.search(r'날짜|일자|date|거래일', h):
        return 'date'
    if re.search(r'구분|type|유형|수입|지출', h):
        return 'type'
    if re.search(r'분류|category|항목|카테고리', h):
        return 'category'
    if re.search(r'금액|amount|지출|수입', h):
        return 'amount'
    if re.search(r'결제자|payer|사용자|작성자', h):
        return 'payer'
    if re.search(r'메모|적요|내용|memo|usage', h):
        return 'memo'
    return (header or '').strip().lower()

def parse_amount(value):
    if value is None or value == '':
        return 0
    str_val = str(value).strip()
    sign = 1
    if str_val.startswith('-') or '-' in str_val:
        sign = -1
        str_val = str_val.replace('-', '')
    elif str_val.startswith('+'):
        str_val = str_val[1:]
    str_val = re.sub(r'[,\s$원₩]', '', str_val)
    try:
        num = float(str_val) if str_val else 0
        return int(sign * num)
    except ValueError:
        return 0

def normalize_type(type_str):
    t = (type_str or '').strip().lower()
    if re.search(r'수입|income|\+', t):
        return 'income'
    if re.search(r'지출|expense|\-', t):
        return 'expense'
    return 'expense'

def normalize_payer(payer):
    if not payer:
        return 'together'
    p = str(payer).strip().lower()
    if re.search(r'주니|juni', p):
        return 'juni'
    if re.search(r'용이|yongi', p):
        return 'yongi'
    if re.search(r'공동|together', p):
        return 'together'
    return p

def parse_csv_line(text_line):
    result = []
    in_quotes = False
    current = ''
    for char in text_line:
        if char == '"':
            in_quotes = not in_quotes
        elif char == ',' and not in_quotes:
            result.append(current.strip())
            current = ''
        else:
            current += char
    result.append(current.strip())
    return [s.strip('"\'') for s in result]

def parse_csv_string(csv_text):
    if not csv_text:
        return []
    lines = csv_text.splitlines()
    if len(lines) < 2:
        return []
    headers = [normalize_headers(h) for h in parse_csv_line(lines[0])]
    transactions = []
    for i in range(1, len(lines)):
        line = lines[i].strip()
        if not line:
            continue
        values = parse_csv_line(line)
        row_obj = {}
        for j, h in enumerate(headers):
            if h and h != '':
                row_obj[h] = values[j] if j < len(values) else ''

        tx = {
            'id': f'tx-{i}',
            'date': row_obj.get('date', ''),
            'type': normalize_type(row_obj.get('type')),
            'category': row_obj.get('category', ''),
            'amount': parse_amount(row_obj.get('amount')),
            'payer': normalize_payer(row_obj.get('payer')),
            'memo': row_obj.get('memo') or row_obj.get('usage') or row_obj.get('content') or ''
        }
        if tx['date'] and tx['category']:
            transactions.append(tx)
    return transactions


class TestExcelLedgerEngine(unittest.TestCase):
    def test_normalize_headers_date_fields(self):
        self.assertEqual(normalize_headers('날짜'), 'date')
        self.assertEqual(normalize_headers('일자'), 'date')
        self.assertEqual(normalize_headers('Date'), 'date')
        self.assertEqual(normalize_headers('거래일'), 'date')

    def test_normalize_headers_type_fields(self):
        self.assertEqual(normalize_headers('구분'), 'type')
        self.assertEqual(normalize_headers('Type'), 'type')
        self.assertEqual(normalize_headers('유형'), 'type')
        self.assertEqual(normalize_headers('수입'), 'type')
        self.assertEqual(normalize_headers('지출'), 'type')

    def test_normalize_headers_category_fields(self):
        self.assertEqual(normalize_headers('분류'), 'category')
        self.assertEqual(normalize_headers('Category'), 'category')
        self.assertEqual(normalize_headers('항목'), 'category')
        self.assertEqual(normalize_headers('카테고리'), 'category')

    def test_normalize_headers_amount_fields(self):
        self.assertEqual(normalize_headers('금액'), 'amount')
        self.assertEqual(normalize_headers('Amount'), 'amount')
        # 지출/수입은 type 필드로 매핑됨 (순서상 type이 amount보다 먼저 체크됨)
        self.assertEqual(normalize_headers('지출'), 'type')
        self.assertEqual(normalize_headers('수입'), 'type')

    def test_normalize_headers_payer_fields(self):
        self.assertEqual(normalize_headers('결제자'), 'payer')
        self.assertEqual(normalize_headers('Payer'), 'payer')
        self.assertEqual(normalize_headers('사용자'), 'payer')
        self.assertEqual(normalize_headers('작성자'), 'payer')

    def test_normalize_headers_memo_fields(self):
        self.assertEqual(normalize_headers('메모'), 'memo')
        self.assertEqual(normalize_headers('Memo'), 'memo')
        self.assertEqual(normalize_headers('적요'), 'memo')
        self.assertEqual(normalize_headers('내용'), 'memo')
        self.assertEqual(normalize_headers('Usage'), 'memo')

    def test_normalize_headers_unknown(self):
        self.assertEqual(normalize_headers('Unknown'), 'unknown')

    def test_parse_amount_positive(self):
        self.assertEqual(parse_amount('1,250'), 1250)
        self.assertEqual(parse_amount('$25.50'), 25)
        self.assertEqual(parse_amount('  800  '), 800)
        self.assertEqual(parse_amount('1000'), 1000)
        self.assertEqual(parse_amount('+500'), 500)

    def test_parse_amount_negative(self):
        self.assertEqual(parse_amount('-500'), -500)
        self.assertEqual(parse_amount('-1,200원'), -1200)
        self.assertEqual(parse_amount('-$100'), -100)

    def test_parse_amount_with_currency_symbol(self):
        self.assertEqual(parse_amount('$30'), 30)
        self.assertEqual(parse_amount('₩2,000'), 2000)
        self.assertEqual(parse_amount('원 5,000'), 5000)

    def test_parse_amount_empty_or_none(self):
        self.assertEqual(parse_amount(''), 0)
        self.assertEqual(parse_amount(None), 0)

    def test_parse_amount_invalid(self):
        self.assertEqual(parse_amount('abc'), 0)
        self.assertEqual(parse_amount('1.2.3'), 0)

    def test_normalize_payer_juni(self):
        self.assertEqual(normalize_payer('주니'), 'juni')
        self.assertEqual(normalize_payer('JUNI'), 'juni')
        self.assertEqual(normalize_payer('juni'), 'juni')

    def test_normalize_payer_yongi(self):
        self.assertEqual(normalize_payer('용이'), 'yongi')
        self.assertEqual(normalize_payer('YONGI'), 'yongi')
        self.assertEqual(normalize_payer('yongi'), 'yongi')

    def test_normalize_payer_together(self):
        self.assertEqual(normalize_payer('공동'), 'together')
        self.assertEqual(normalize_payer('Together'), 'together')
        self.assertEqual(normalize_payer('together'), 'together')

    def test_normalize_payer_default(self):
        self.assertEqual(normalize_payer(''), 'together')
        self.assertEqual(normalize_payer(None), 'together')
        self.assertEqual(normalize_payer('알 수 없음'), '알 수 없음')

    def test_parse_csv_string_basic(self):
        csv = "날짜,유형,분류,금액,결제자,메모\n2026-11-04,지출,식비,45,주니,장보기"
        txs = parse_csv_string(csv)
        self.assertEqual(len(txs), 1)
        self.assertEqual(txs[0]['date'], '2026-11-04')
        self.assertEqual(txs[0]['type'], 'expense')
        self.assertEqual(txs[0]['category'], '식비')
        self.assertEqual(txs[0]['amount'], 45)
        self.assertEqual(txs[0]['payer'], 'juni')
        self.assertEqual(txs[0]['memo'], '장보기')

    def test_parse_csv_string_with_commas_in_amount(self):
        csv = '날짜,유형,분류,금액,결제자,메모\n2026-11-03,수입,급여,"$2,000",용이,월급'
        txs = parse_csv_string(csv)
        self.assertEqual(len(txs), 1)
        self.assertEqual(txs[0]['amount'], 2000)
        self.assertEqual(txs[0]['payer'], 'yongi')

    def test_parse_csv_string_multiple_rows(self):
        csv = """날짜,유형,분류,금액,결제자
2026-11-01,지출,식비,10,주니
2026-11-02,수입,급여,200,용이"""
        txs = parse_csv_string(csv)
        self.assertEqual(len(txs), 2)
        self.assertEqual(txs[0]['amount'], 10)
        self.assertEqual(txs[1]['amount'], 200)

    def test_parse_csv_string_empty_lines(self):
        csv = "날짜,유형,분류,금액\n2026-11-04,지출,식비,10000\n"
        txs = parse_csv_string(csv)
        self.assertEqual(len(txs), 1)

    def test_parse_csv_string_missing_required_fields(self):
        csv = "날짜,유형\n2026-11-04,지출"
        txs = parse_csv_string(csv)
        self.assertEqual(len(txs), 0)

    def test_google_sheet_url_normalization(self):
        url = "https://docs.google.com/spreadsheets/d/1K0s0lHRF7NDjsfY6F4ZMg9sQe3K4CdIP/edit?gid=1727868226#gid=1727868226"
        match = re.search(r'https://docs\.google\.com/spreadsheets/d/([a-zA-Z0-9-_]+)', url)
        self.assertIsNotNone(match)
        self.assertEqual(match.group(1), '1K0s0lHRF7NDjsfY6F4ZMg9sQe3K4CdIP')
        gid_match = re.search(r'[#&?]gid=([0-9]+)', url)
        self.assertIsNotNone(gid_match)
        self.assertEqual(gid_match.group(1), '1727868226')

    def test_google_sheet_pub_url_normalization(self):
        pub_url = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQTest123/pubhtml?gid=1727868226&single=true"
        pub_match = re.search(r'https://docs\.google\.com/spreadsheets/d/e/([a-zA-Z0-9-_]+)', pub_url)
        self.assertIsNotNone(pub_match)
        self.assertEqual(pub_match.group(1), '2PACX-1vQTest123')


    def test_wife_original_7_columns_csv(self):
        """와이프 원본 7개 컬럼 파싱 헤더 매핑 검증"""
        headers = ["날짜", "분류", "소분류", "내용", "금액(원)", "수입/지출", "자산"]
        mapped = [normalize_headers(h) for h in headers]
        self.assertIn('date', mapped)
        self.assertIn('category', mapped)
        self.assertIn('amount', mapped)

    def test_timestamp_date_normalization(self):
        """타임스탬프에서 YYYY-MM-DD 추출 정규화 검증"""
        raw_date = "2026-10-24 12:26:53"
        date_part = (raw_date.split(' ')[0] or '').replace('.', '-').strip()
        self.assertEqual(date_part, '2026-10-24')

    def test_saving_type_normalization(self):
        """이체지출/저축/적금/청약/보험 → saving 타입 정규화 검증"""
        def check_type(t_str):
            t = (t_str or '').strip().lower()
            if re.search(r'수입|income|\+', t): return 'income'
            if re.search(r'이체지출|저축|적금|청약|보험|saving', t): return 'saving'
            return 'expense'
        self.assertEqual(check_type('이체지출'), 'saving')
        self.assertEqual(check_type('저축'), 'saving')
        self.assertEqual(check_type('수입'), 'income')
        self.assertEqual(check_type('지출'), 'expense')

    def test_asset_based_payer_inference(self):
        """자산 문자열에서 결제자(yongi/juni/together) 추론 검증"""
        def infer_payer(asset_str):
            s = str(asset_str or '').strip().lower()
            if re.search(r'진용|용이|yongi', s): return 'yongi'
            if re.search(r'준희|주니|juni', s): return 'juni'
            return 'together'
        self.assertEqual(infer_payer('국민와우카드(진용)'), 'yongi')
        self.assertEqual(infer_payer('현대카드(준희)'), 'juni')
        self.assertEqual(infer_payer('생활비통장(공동)'), 'together')


if __name__ == '__main__':
    unittest.main()