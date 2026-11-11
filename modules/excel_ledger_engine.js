/**
 * Excel Ledger Engine (SheetJS & Modern CSV 기반)
 * 프로젝트: couple-calendar v2.5.0
 * 기능: XLSX/CSV 파싱, 자동 헤더 정규화, 금액 정제, 공유 시트 연동, 내보내기,
 *       표준 템플릿 생성, 카테고리 지능적 매핑, 고정비 자동 감지, 멱등성 중복 제거
 */
(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        define([], factory);
    } else if (typeof module === 'object' && module.exports) {
        module.exports = factory();
    } else {
        root.ExcelLedgerEngine = factory();
    }
}(typeof self !== 'undefined' ? self : this, function () {
    'use strict';

    // 8대 표준 카테고리 목록
    const STANDARD_CATEGORIES = [
        '식비', '카페/간식', '마트/장보기', '주거/통신',
        '생활용품', '데이트', '교통', '의료/건강', '문화/취미', '기타'
    ];

    /**
     * 한글/영문 다양한 헤더 이름을 정규화된 필드로 매핑 (구글시트 10대 컬럼 정밀 분리)
     * @param {string} header - 원본 헤더 문자열
     * @returns {string} 표준 필드명: date | type | category | subcategory | amount | payer | asset | memo | fixed | note
     */
    function normalizeHeaders(header) {
        const h = (header || '').trim().toLowerCase();
        if (/날짜|일자|date|거래일/.test(h)) return 'date';
        if (/소분류|subcat|세부분류/.test(h)) return 'subcategory';
        if (/대분류|분류|category|항목|카테고리/.test(h)) return 'category';
        if (/고정비|고정|예산구분|fixed|정기/.test(h)) return 'fixed';
        if (/구분|type|유형|수입\/지출/.test(h)) return 'type';
        if (/결제수단|자산|카드|통장/.test(h)) return 'asset';
        if (/결제자|payer|사용자|작성자|담당/.test(h)) return 'payer';
        if (/내용|적요|memo|usage/.test(h)) return 'memo';
        if (/비고|note|remark/.test(h)) return 'note';
        if (/금액|amount|지출금액|수입금액|비용/.test(h)) return 'amount';
        return (header || '').trim().toLowerCase();
    }

    /**
     * 카테고리 지능적 정규화
     * @param {string} rawCat - 원본 카테고리 문자열
     * @returns {string} 표준 카테고리 명칭
     */
    function normalizeCategory(rawCat) {
        if (!rawCat) return '기타';
        const c = String(rawCat).trim().toLowerCase();
        if (/카페|커피|디저트|베이커리|간식|스타벅스/.test(c)) return '카페/간식';
        if (/식비|식사|점심|저녁|배달|외식|밥|맛집/.test(c)) return '식비';
        if (/마트|장보기|쿠팡|이마트|마켓컬리|홈플러스|식료품/.test(c)) return '마트/장보기';
        if (/주거|월세|관리비|통신|인터넷|수도|전기|가스/.test(c)) return '주거/통신';
        if (/생활|다이소|생필품|가구|가전|인테리어/.test(c)) return '생활용품';
        if (/데이트|영화|여행|숙박|호텔|선물|기념일/.test(c)) return '데이트';
        if (/교통|지하철|버스|택시|주유|톨게이트|하이패스|주차/.test(c)) return '교통';
        if (/의료|병원|약국|영양제|치과|건강|비타민/.test(c)) return '의료/건강';
        if (/문화|취미|도서|공연|전시|운동|헬스/.test(c)) return '문화/취미';
        return rawCat.trim() || '기타';
    }

    /**
     * 고정비 자동 판별 (월세, 구독, 관리비, 보험 등)
     * @param {string} memo - 적요/메모
     * @param {string} category - 카테고리
     * @returns {boolean} 고정비 여부
     */
    function isFixedExpense(memo, category) {
        const text = `${memo || ''} ${category || ''}`.toLowerCase();
        return /월세|관리비|넷플릭스|유튜브|구독|보험|통신비|할부|정기결제|적금|대출/.test(text);
    }

    /**
     * 금액 문자열 정제: 쉼표, 원화 기호, 달러 기호, 공백 제거 및 부호 처리
     * @param {string|number} value - 금액 문자열(예: "1,250원", "$25.50", " -800 ")
     * @returns {number} 정제된 정수 숫자(음수 포함 가능)
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
        str = str.replace(/[,\s$원₩]/g, '');
        const num = parseFloat(str);
        return !isNaN(num) ? sign * Math.round(num) : 0;
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
        return 'expense';
    }

    /**
     * 결제자 문자열 지능적 판별
     * @param {string} payer - 원본 결제자 문자열(예: "주니", "용이", "공동")
     * @returns {string} 정규화된 결제자: 'juni', 'yongi', 'together'
     */
    function normalizePayer(payer) {
        if (!payer) return 'together';
        const p = String(payer).trim().toLowerCase();
        if (/주니|juni|남편|오빠|신랑/.test(p)) return 'juni';
        if (/용이|yongi|아내|부인|와이프/.test(p)) return 'yongi';
        if (/공동|together|함께|공통|통장/.test(p)) return 'together';
        return p;
    }

    /**
     * 구글 시트 URL에서 sheetId, gid, pub여부 파싱
     */
    function extractGoogleSheetInfo(rawUrl) {
        if (!rawUrl) return { sheetId: null, gid: null, isPub: false, rawUrl: '' };
        const url = rawUrl.trim();

        // 1) /spreadsheets/d/e/{publishId}/pub 또는 pubhtml
        const pubMatch = url.match(/https:\/\/docs\.google\.com\/spreadsheets\/d\/e\/([a-zA-Z0-9-_]+)/);
        if (pubMatch) {
            const gidMatch = url.match(/[#&?]gid=([0-9]+)/);
            return {
                sheetId: null,
                publishId: pubMatch[1],
                gid: gidMatch ? gidMatch[1] : null,
                isPub: true,
                rawUrl: url
            };
        }

        // 2) 일반 시트 링크: /spreadsheets/d/{sheetId}
        const standardMatch = url.match(/https:\/\/docs\.google\.com\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
        if (standardMatch && standardMatch[1] !== 'e') {
            const gidMatch = url.match(/[#&?]gid=([0-9]+)/);
            return {
                sheetId: standardMatch[1],
                publishId: null,
                gid: gidMatch ? gidMatch[1] : null,
                isPub: false,
                rawUrl: url
            };
        }

        return { sheetId: null, gid: null, isPub: false, rawUrl: url };
    }

    /**
     * 공유 URL 정규화 (구글 스프레드시트 공유 링크를 직접 CSV 다운로드 URL로 자동 변환)
     * @param {string} rawUrl - 사용자가 입력한 구글 시트 또는 공유 URL
     * @returns {string} 정규화된 다운로드 URL
     */
    function normalizeSharedUrl(rawUrl) {
        if (!rawUrl) return '';
        const url = rawUrl.trim();
        const info = extractGoogleSheetInfo(url);

        if (info.isPub && info.publishId) {
            const gidParam = info.gid ? `&gid=${info.gid}&single=true` : '';
            return `https://docs.google.com/spreadsheets/d/e/${info.publishId}/pub?output=csv${gidParam}`;
        }

        if (info.sheetId) {
            const targetGid = info.gid || '1727868226';
            return `https://docs.google.com/spreadsheets/d/${info.sheetId}/export?format=csv&gid=${targetGid}`;
        }

        return url;
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

            const rawCat = rowObj.category || '기타';
            const rawMemo = rowObj.memo || rowObj.usage || rowObj.content || '';
            const fixedExplicit = rowObj.fixed ? /y|yes|true|1|고정/.test(String(rowObj.fixed).toLowerCase()) : false;

            const tx = {
                id: `tx-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                date: (rowObj.date || '').replace(/\./g, '-').trim(),
                type: normalizeType(rowObj.type),
                category: normalizeCategory(rawCat),
                amount: parseAmount(rowObj.amount),
                payer: normalizePayer(rowObj.payer),
                memo: rawMemo,
                isFixed: fixedExplicit || isFixedExpense(rawMemo, rawCat)
            };

            if (tx.date && tx.category && tx.amount > 0) {
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
        if (typeof XLSX !== 'undefined' && XLSX.utils && XLSX.utils.sheet_to_csv) {
            const csvData = XLSX.utils.sheet_to_csv(worksheet);
            return parseCsvString(csvData);
        }
        return [];
    }

    /**
     * 표준 엑셀 가계부 양식 템플릿 데이터 생성 (다운로드용)
     * @returns {Array<Array>} 2차원 배열(헤더 + 샘플 예시 행)
     */
    function generateTemplateData() {
        return [
            ['날짜', '유형', '카테고리', '금액', '결제자', '고정비여부', '메모'],
            ['2026-11-01', '지출', '식비', 35000, '주니', 'N', '주말 저녁 파스타 외식'],
            ['2026-11-02', '지출', '마트/장보기', 48200, '용이', 'N', '이마트 장보기(우유, 과일)'],
            ['2026-11-03', '지출', '주거/통신', 75000, '공동', 'Y', '인터넷 및 관리비'],
            ['2026-11-04', '지출', '카페/간식', 9000, '주니', 'N', '퇴근길 스타벅스 라떼'],
            ['2026-11-05', '수입', '급여', 3500000, '주니', 'N', '11월 급여 입금']
        ];
    }

    /**
     * 트랜잭션 배열을 SheetJS 호환 2차원 배열로 변환(엑셀 내보내기용)
     * @param {Array<object>} transactions - 트랜잭션 객체 배열
     * @returns {Array<Array>} 2차원 배열(헤더 포함)
     */
    function exportToExcelData(transactions) {
        const headers = ['날짜', '유형', '카테고리', '금액', '결제자', '고정비여부', '메모'];
        const rows = [headers];
        (transactions || []).forEach(tx => {
            rows.push([
                tx.date || '',
                tx.type === 'income' ? '수입' : '지출',
                tx.category || '기타',
                tx.amount != null ? Number(tx.amount) : 0,
                tx.payer === 'juni' ? '주니' : tx.payer === 'yongi' ? '용이' : '공동',
                tx.isFixed ? 'Y' : 'N',
                tx.memo || ''
            ]);
        });
        return rows;
    }

    /**
     * Google Visualization API (GViz) 응답 객체 파싱 → 정규화된 트랜잭션 배열
     */
    function parseGvizResponse(resp) {
        if (!resp || !resp.table) return [];
        const cols = resp.table.cols || [];
        const rows = resp.table.rows || [];
        if (rows.length === 0) return [];

        // 컬럼 헤더 매핑
        let headerMap = cols.map(c => normalizeHeaders(c ? c.label : ''));
        let startIndex = 0;
        const hasHeader = headerMap.some(h => /date|type|category|amount|payer|memo/.test(h));
        if (!hasHeader && rows.length > 0) {
            const firstRowCells = (rows[0].c || []).map(cell => cell ? (cell.v !== undefined ? cell.v : cell.f) : '');
            headerMap = firstRowCells.map(h => normalizeHeaders(String(h || '')));
            startIndex = 1;
        }

        const transactions = [];
        for (let i = startIndex; i < rows.length; i++) {
            const row = rows[i];
            if (!row || !row.c) continue;
            const cells = row.c;
            const rowObj = {};
            for (let j = 0; j < Math.max(headerMap.length, cells.length); j++) {
                const h = headerMap[j];
                const cell = cells[j];
                if (h && h !== '') {
                    const val = cell ? (cell.v !== undefined ? cell.v : (cell.f !== undefined ? cell.f : '')) : '';
                    rowObj[h] = val;
                }
            }

            let dateStr = String(rowObj.date || '').trim();
            const dateMatch = dateStr.match(/Date\((\d+),(\d+),(\d+)\)/);
            if (dateMatch) {
                const y = dateMatch[1];
                const m = String(Number(dateMatch[2]) + 1).padStart(2, '0');
                const d = String(dateMatch[3]).padStart(2, '0');
                dateStr = `${y}-${m}-${d}`;
            } else {
                dateStr = dateStr.replace(/\./g, '-').trim();
            }

            const rawCat = String(rowObj.category || '기타');
            const rawMemo = String(rowObj.memo || rowObj.usage || rowObj.content || '');
            const fixedExplicit = rowObj.fixed ? /y|yes|true|1|고정/.test(String(rowObj.fixed).toLowerCase()) : false;

            const tx = {
                id: `tx-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                date: dateStr,
                type: normalizeType(String(rowObj.type || '')),
                category: normalizeCategory(rawCat),
                amount: parseAmount(rowObj.amount),
                payer: normalizePayer(String(rowObj.payer || '')),
                memo: rawMemo,
                isFixed: fixedExplicit || isFixedExpense(rawMemo, rawCat)
            };

            if (tx.date && tx.category && tx.amount > 0) {
                transactions.push(tx);
            }
        }
        return transactions;
    }

    /**
     * 브라우저 환경에서 <script> 태그를 이용해 Google Visualization API를 JSONP로 비동기 호출 (CORS 완전 면제)
     */
    function fetchGvizJsonp(sheetId, gid, timeoutMs = 8000) {
        return new Promise((resolve, reject) => {
            if (typeof document === 'undefined') {
                reject(new Error('Browser DOM document not available'));
                return;
            }
            const callbackName = 'gviz_cb_' + Math.random().toString(36).substring(2, 10);
            let timer = null;
            const script = document.createElement('script');

            const cleanup = () => {
                if (timer) clearTimeout(timer);
                try { delete window[callbackName]; } catch (e) { window[callbackName] = undefined; }
                if (script.parentNode) script.parentNode.removeChild(script);
            };

            window[callbackName] = function (resp) {
                cleanup();
                if (!resp) {
                    reject(new Error('구글 시트 응답이 비어있습니다.'));
                    return;
                }
                if (resp.status === 'error') {
                    const errorMsg = (resp.errors && resp.errors[0] && (resp.errors[0].detailed_message || resp.errors[0].message)) || '구글 시트 조회 에러';
                    reject(new Error(errorMsg));
                    return;
                }
                try {
                    const txs = parseGvizResponse(resp);
                    resolve(txs);
                } catch (err) {
                    reject(err);
                }
            };

            timer = setTimeout(() => {
                cleanup();
                reject(new Error('구글 시트 연결 시간 초과 (8초). 시트 공유 권한을 확인해주세요.'));
            }, timeoutMs);

            script.onerror = function () {
                cleanup();
                reject(new Error('구글 시트 스크립트 로드 차단 또는 네트워크 오류 발생'));
            };

            const targetGid = gid != null ? gid : '1727868226';
            script.src = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=responseHandler:${callbackName}&gid=${targetGid}`;
            document.body.appendChild(script);
        });
    }

    /**
     * 비동기 공개 구글 스프레드시트에서 데이터 Fetch 및 파싱 (GViz JSONP 및 다중 폴백)
     * @param {string} url - 구글 시트 또는 공개 CSV URL
     * @returns {Promise<Array<object>>} 트랜잭션 배열(Promise)
     */
    async function fetchSharedCsv(url) {
        if (!url) throw new Error('공유 시트 URL을 입력해주세요.');
        const info = extractGoogleSheetInfo(url);

        // 1순위: 브라우저 DOM 환경이고 일반 시트 ID가 있는 경우 GViz JSONP 시도 (CORS 및 400 에러 100% 면제!)
        if (typeof document !== 'undefined' && info.sheetId) {
            const candidateGids = [info.gid, '1727868226', '0'].filter((g, i, arr) => g != null && arr.indexOf(g) === i);
            for (const candidateGid of candidateGids) {
                try {
                    const txs = await fetchGvizJsonp(info.sheetId, candidateGid, 6000);
                    if (txs && txs.length > 0) {
                        console.log(`[ExcelLedgerEngine] Successfully fetched ${txs.length} transactions via GViz JSONP (gid: ${candidateGid})`);
                        return txs;
                    }
                } catch (err) {
                    console.warn(`[ExcelLedgerEngine] GViz JSONP failed for gid ${candidateGid}:`, err.message);
                }
            }
        }

        // 2순위: GViz CSV 직접 호출 (gviz/tq?tqx=out:csv)
        if (info.sheetId) {
            const targetGid = info.gid || '1727868226';
            const gvizCsvUrl = `https://docs.google.com/spreadsheets/d/${info.sheetId}/gviz/tq?tqx=out:csv&gid=${targetGid}`;
            try {
                const res = await fetch(gvizCsvUrl);
                if (res.ok) {
                    const text = await res.text();
                    const txs = parseCsvString(text);
                    if (txs.length > 0) return txs;
                }
            } catch (e) {
                console.warn('[ExcelLedgerEngine] GViz CSV fetch failed:', e.message);
            }
        }

        // 3순위: 정규화된 CSV URL 직접 fetch (/export?format=csv 또는 /pub?output=csv)
        const normalizedUrl = normalizeSharedUrl(url);
        try {
            const res = await fetch(normalizedUrl);
            if (res.ok) {
                const text = await res.text();
                const txs = parseCsvString(text);
                if (txs.length > 0) return txs;
            } else {
                console.warn(`[ExcelLedgerEngine] Direct fetch responded status: ${res.status}`);
            }
        } catch (e) {
            console.warn('[ExcelLedgerEngine] Direct fetch failed (likely CORS):', e.message);
        }

        // 4순위: CORS Proxy (allorigins) 폴백
        try {
            const proxyUrl = 'https://api.allorigins.win/raw?url=' + encodeURIComponent(normalizedUrl);
            const res = await fetch(proxyUrl);
            if (res.ok) {
                const text = await res.text();
                const txs = parseCsvString(text);
                if (txs.length > 0) return txs;
            }
        } catch (proxyErr) {
            console.warn('[ExcelLedgerEngine] Proxy fetch failed:', proxyErr.message);
        }

        throw new Error('공유 시트 연결 실패: 구글 시트 우측 상단 [공유] ➔ "링크가 있는 모든 사용자"로 설정되어 있는지 확인해주세요.');
    }

    /**
     * 거래 데이터의 고유 지문(Fingerprint) 생성
     * 동일 날짜, 금액, 유형, 카테고리, 메모의 중복 거래를 식별
     * @param {object} tx - 트랜잭션 객체
     * @returns {string} 고유 지문 문자열
     */
    function generateTxFingerprint(tx) {
        if (!tx) return '';
        const d = (tx.date || '').trim();
        const a = Math.round(Number(tx.amount || 0));
        const t = (tx.type || 'expense').trim().toLowerCase();
        const c = (tx.category || '').trim().toLowerCase();
        const m = (tx.memo || '').trim().toLowerCase();
        return `${d}|${a}|${t}|${c}|${m}`;
    }

    /**
     * 기존 거래 목록과 수신 거래 목록을 비교하여 중복을 제외하고 신규 항목만 추출 (멱등성 보장)
     * @param {Array<object>} existingList - 기존 트랜잭션 배열
     * @param {Array<object>} incomingList - 새로 수신된 트랜잭션 배열
     * @returns {object} { toAdd: Array, addedCount: number, skippedCount: number, total: number }
     */
    function deduplicateTransactions(existingList, incomingList) {
        const existing = Array.isArray(existingList) ? existingList : [];
        const incoming = Array.isArray(incomingList) ? incomingList : [];
        const seenFingerprints = new Set(existing.map(generateTxFingerprint));

        const toAdd = [];
        let skippedCount = 0;

        incoming.forEach(tx => {
            const fp = generateTxFingerprint(tx);
            if (!seenFingerprints.has(fp)) {
                seenFingerprints.add(fp);
                toAdd.push(tx);
            } else {
                skippedCount++;
            }
        });

        return {
            toAdd,
            addedCount: toAdd.length,
            skippedCount,
            total: incoming.length
        };
    }

    return {
        STANDARD_CATEGORIES,
        normalizeHeaders,
        normalizeCategory,
        isFixedExpense,
        parseAmount,
        normalizeType,
        normalizePayer,
        normalizeSharedUrl,
        parseCsvLine,
        parseCsvString,
        parseExcelWorkbook,
        generateTemplateData,
        exportToExcelData,
        extractGoogleSheetInfo,
        parseGvizResponse,
        fetchGvizJsonp,
        fetchSharedCsv,
        generateTxFingerprint,
        deduplicateTransactions
    };
}));
