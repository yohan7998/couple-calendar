/**
 * Excel Ledger Engine (SheetJS 기반)
 * 프로젝트: couple-calendar
 * 기능: XLSX/CSV 파싱, 자동 헤더 정규화, 금액 정제, 공유 시트 연동, 내보내기, 결제자 지능적 판별
 */
window.ExcelLedgerEngine = (function() {

    /**
     * 한글/영문/일칭 다양한 헤더 이름을 정규화된 필드로 매핑
     * @param {string} header - 원본 헤더 문자열
     * @returns {string} 표준 필드명: date | type | category | amount | payer | memo
     */
    function normalizeHeaders(header) {
        const h = (header || '').trim().toLowerCase();
        if (/날짜|일자|date|거래일/.test(h)) return 'date';
        if (/구분|type|유형|수입|지출/.test(h)) return 'type';
        if (/분류|category|항목|카테고리/.test(h)) return 'category';
        if (/금액|amount|지출|수입/.test(h)) return 'amount';
        if (/결제자|payer|사용자|작성자/.test(h)) return 'payer';
        if (/메모|적요|내용|memo|usage/.test(h)) return 'memo';
        return (header || '').trim().toLowerCase();
    }

    /**
     * 금액 문자열 정제: 쉼표, 원화 기호, 달러 기호, 공백 제거 및 부호 처리
     * @param {string} value - 금액 문자열(예: "1,250원", "$25.50", "  800  ")
     * @returns {number} 정제된 숫자(음수 포함 가능)
     */
    function parseAmount(value) {
        if (value == null || value === '') return 0;
        let str = String(value).trim();
        let sign = 1;
        if (str.startsWith('-') || str.includes('-')) {
            sign = -1;
            str = str.replace(/^(-)+/, '');
        } else if (str.startsWith('+')) {
            str = str.slice(1);
        }
        // 통화 기호, ₩, ₩, $, 쉼표, 공백 제거
        str = str.replace(/[,\s$원₩]/g, '');
        const num = parseFloat(str);
        return !isNaN(num) ? sign * num : 0;
    }

    /**
     * 거래 유형 정규화 (수입/지출 -> income/expense)
     * @param {string} typeStr - 원본 유형 문자열
     * @returns {string} 'income' 또는 'expense'
     */
    function normalizeType(typeStr) {
        const t = (typeStr || '').trim().toLowerCase();
        if (/수입|income|\+/.test(t)) return 'income';
        if (/지출|expense|\-/.test(t)) return 'expense';
        return 'expense'; // 기본값
    }

    /**
     * 결제자 문자열 지능적 판별
     * @param {string} payer - 원본 결제자 문자열(예: "주니", "yongi", "공동")
     * @returns {string} 정규화된 결제자: 'juni', 'yongi', 'together'
     */
    function normalizePayer(payer) {
        if (!payer) return 'together';
        const p = String(payer).trim().toLowerCase();
        if (/주니|juni/.test(p)) return 'juni';
        if (/용이|yongi/.test(p)) return 'yongi';
        if (/공동|together/.test(p)) return 'together';
        return p;
    }

    /**
     * CSV 라인 파싱 (따옴표로 묶인 쉼표 처리 지원)
     */
    function parseCsvLine(textLine) {
        const result = [];
        let inQuotes = false;
        let current = '';
        for (let i = 0; i < textLine.length; i++) {
            const char = textLine[i];
            if (char === '"') {
                inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
                result.push(current.trim());
                current = '';
            } else {
                current += char;
            }
        }
        result.push(current.trim());
        return result.map(s => s.replace(/^["']|["']$/g, ''));
    }

    /**
     * CSV 텍스트 파싱 → 정규화된 트랜잭션 배열
     * @param {string} csvText - CSV 형식 텍스트(첫 번째 행은 헤더)
     * @returns {Array<object>} 트랜잭션 객체 배열
     */
    function parseCsvString(csvText) {
        if (!csvText) return [];
        const lines = csvText.split(/\n|\r\n/);
        if (lines.length < 2) return [];

        const headers = parseCsvLine(lines[0]).map(h => normalizeHeaders(h));
        const transactions = [];

        for (let i = 1; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue;
            const values = parseCsvLine(line);
            const rowObj = {};
            for (let j = 0; j < Math.max(headers.length, values.length); j++) {
                const h = headers[j];
                if (h && h !== '') {
                    rowObj[h] = values[j] !== undefined ? values[j] : '';
                }
            }

            const tx = {
                id: `tx-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                date: rowObj.date || '',
                type: normalizeType(rowObj.type),
                category: rowObj.category || '',
                amount: parseAmount(rowObj.amount),
                payer: normalizePayer(rowObj.payer),
                memo: rowObj.memo || rowObj.usage || rowObj.content || ''
            };

            if (tx.date && tx.category) {
                transactions.push(tx);
            }
        }
        return transactions;
    }

    /**
     * SheetJS XLSX 워크북에서 첫 번째 시트 파싱
     * @param {object} workbook - SheetJS 워크북 객체
     * @returns {Array<object>} 트랜잭션 배열
     */
    function parseExcelWorkbook(workbook) {
        if (!workbook || !workbook.SheetNames || workbook.SheetNames.length === 0) return [];
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        if (!worksheet) return [];
        const csvData = XLSX.utils.sheet_to_csv(worksheet);
        return parseCsvString(csvData);
    }

    /**
     * 트랜잭션 배열을 SheetJS 호환 2차원 배열로 변환(엑셀 내보내기용)
     * @param {Array<object>} transactions - 트랜잭션 객체 배열
     * @returns {Array<Array>} 2차원 배열(헤더 포함)
     */
    function exportToExcelData(transactions) {
        const headers = ['날짜', '유형', '분류', '금액', '결제자', '메모'];
        const rows = [headers];
        transactions.forEach(tx => {
            rows.push([
                tx.date || '',
                tx.type === 'income' ? '수입' : '지출',
                tx.category || '',
                tx.amount.toString(),
                tx.payer === 'juni' ? '주니' : tx.payer === 'yongi' ? '용이' : '공동',
                tx.memo || ''
            ]);
        });
        return rows;
    }

    /**
     * 비동기 공개 구글 스프레드시트 CSV URL에서 데이터 Fetch 및 파싱
     * @param {string} url - 구글 시트 CSV 내보내기 URL
     * @returns {Promise<Array<object>>} 트랜잭션 배열(Promise)
     */
    function fetchSharedCsv(url) {
        return fetch(url)
            .then(res => {
                if (!res.ok) throw new Error(`Failed to fetch ${url}: ${res.status}`);
                return res.text();
            })
            .then(text => parseCsvString(text))
            .catch(err => {
                console.error('Shared CSV fetch error:', err);
                return [];
            });
    }

    return {
        normalizeHeaders,
        parseAmount,
        normalizeType,
        normalizePayer,
        parseCsvLine,
        parseCsvString,
        parseExcelWorkbook,
        exportToExcelData,
        fetchSharedCsv
    };
})();