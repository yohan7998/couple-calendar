/**
 * Ledger Stats Engine & Responsive Dual Views (Couple-Calendar v2.5.0)
 * 모바일(터치 친화 게이지, 부부 분담률, 카테고리 랭킹, 미니 바) vs 웹(대화면 피벗 매트릭스, 일별 추이) 듀얼 통계 엔진
 * UMD / IIFE 패턴
 */
(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    define([], factory);
  } else if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.LedgerStatsEngine = factory();
    if (typeof window !== 'undefined') window.LedgerStatsEngine = root.LedgerStatsEngine;
  }
}(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  /**
   * 월별 요약 계산 (수입, 지출, 예산 잔액, 사용률, 고정비 비중)
   */
  function calculateMonthlySummary(transactions, targetMonth, budget) {
    if (!Array.isArray(transactions)) return null;
    const monthStr = String(targetMonth);
    const mtx = transactions.filter(t => (t.date || '').substring(0, 7) === monthStr);

    let totalExpense = 0;
    let totalIncome = 0;
    let fixedExpense = 0;

    mtx.forEach(t => {
      const amt = Number(t.amount || 0);
      if (t.type === 'expense') {
        totalExpense += amt;
        if (t.isFixed) fixedExpense += amt;
      } else if (t.type === 'income') {
        totalIncome += amt;
      }
    });

    const b = Number(budget) || 0;
    const remainBudget = b > 0 ? b - totalExpense : 0;
    const budgetUsedRate = b > 0 ? (totalExpense / b) * 100 : 0;
    const fixedRate = totalExpense > 0 ? (fixedExpense / totalExpense) * 100 : 0;

    return {
      month: monthStr,
      totalExpense: Math.round(totalExpense),
      totalIncome: Math.round(totalIncome),
      fixedExpense: Math.round(fixedExpense),
      variableExpense: Math.round(totalExpense - fixedExpense),
      fixedRate: Math.round(fixedRate * 10) / 10,
      budget: b,
      remainBudget: Math.round(remainBudget),
      budgetUsedRate: Math.round(budgetUsedRate * 10) / 10,
      dailyAverageExpense: Math.round(totalExpense / 30),
      transactionCount: mtx.length
    };
  }

  /**
   * 결제자별 분배 계산 (주니 vs 용이 vs 공동)
   */
  function calculatePayerDistribution(transactions, targetMonth) {
    if (!Array.isArray(transactions)) return null;
    const monthStr = String(targetMonth);
    const mtx = transactions.filter(t => (t.date || '').substring(0, 7) === monthStr && t.type === 'expense');

    const dist = { juni: 0, yongi: 0, together: 0 };
    mtx.forEach(t => {
      const amt = Number(t.amount || 0);
      const p = t.payer || 'together';
      if (dist.hasOwnProperty(p)) dist[p] += amt;
      else dist.together += amt;
    });

    const total = dist.juni + dist.yongi + dist.together;
    return {
      juni: Math.round(dist.juni),
      yongi: Math.round(dist.yongi),
      together: Math.round(dist.together),
      total: Math.round(total),
      juniPercent: total > 0 ? Math.round((dist.juni / total) * 1000) / 10 : 0,
      yongiPercent: total > 0 ? Math.round((dist.yongi / total) * 1000) / 10 : 0,
      togetherPercent: total > 0 ? Math.round((dist.together / total) * 1000) / 10 : 0
    };
  }

  /**
   * 카테고리별 요약 (내림차순 정렬 및 비율 계산)
   */
  function calculateCategorySummary(transactions, targetMonth) {
    if (!Array.isArray(transactions)) return [];
    const monthStr = String(targetMonth);
    const mtx = transactions.filter(t => (t.date || '').substring(0, 7) === monthStr && t.type === 'expense');

    const catTotals = {};
    let total = 0;
    mtx.forEach(t => {
      const c = t.category || '기타';
      const amt = Number(t.amount || 0);
      catTotals[c] = (catTotals[c] || 0) + amt;
      total += amt;
    });

    const summary = Object.entries(catTotals).map(([category, amount]) => ({
      category,
      amount: Math.round(amount),
      percentage: total > 0 ? Math.round((amount / total) * 1000) / 10 : 0
    }));

    return summary.sort((a, b) => b.amount - a.amount);
  }

  /**
   * 최근 N개월 월별 지출 트렌드 계산
   */
  function calculateMonthlyTrends(transactions, count = 6) {
    if (!Array.isArray(transactions)) return [];
    const expenseTx = transactions.filter(t => t.type === 'expense');
    const monthMap = {};

    expenseTx.forEach(t => {
      const m = (t.date || '').substring(0, 7);
      if (m && m.length === 7) {
        monthMap[m] = (monthMap[m] || 0) + Number(t.amount || 0);
      }
    });

    const sortedMonths = Object.keys(monthMap).sort();
    const recentMonths = sortedMonths.slice(-count);

    return recentMonths.map(m => ({
      month: m,
      monthLabel: `${parseInt(m.substring(5, 7), 10)}월`,
      amount: Math.round(monthMap[m])
    }));
  }

  /**
   * 대화면용 피벗 매트릭스 계산 (월별 x 카테고리 교차 테이블)
   */
  function calculatePivotMatrix(transactions, monthCount = 6) {
    if (!Array.isArray(transactions)) return { months: [], categories: [], matrix: {}, totals: {} };
    const expenseTx = transactions.filter(t => t.type === 'expense');

    const allMonths = [...new Set(expenseTx.map(t => (t.date || '').substring(0, 7)).filter(Boolean))].sort().slice(-monthCount);
    const allCategories = [...new Set(expenseTx.map(t => t.category || '기타'))].sort();

    const matrix = {}; // { category: { month: amount } }
    const colTotals = {}; // { month: total }
    const rowTotals = {}; // { category: total }
    let grandTotal = 0;

    allCategories.forEach(c => {
      matrix[c] = {};
      allMonths.forEach(m => { matrix[c][m] = 0; });
      rowTotals[c] = 0;
    });
    allMonths.forEach(m => { colTotals[m] = 0; });

    expenseTx.forEach(t => {
      const m = (t.date || '').substring(0, 7);
      const c = t.category || '기타';
      const amt = Number(t.amount || 0);
      if (allMonths.includes(m) && matrix[c]) {
        matrix[c][m] += amt;
        rowTotals[c] += amt;
        colTotals[m] += amt;
        grandTotal += amt;
      }
    });

    return {
      months: allMonths,
      categories: allCategories,
      matrix,
      colTotals,
      rowTotals,
      grandTotal: Math.round(grandTotal)
    };
  }

  /**
   * SVG 기반 가벼운 미니 바 차트 HTML 렌더러
   */
  function renderMiniBarChartSvg(trends) {
    if (!trends || trends.length === 0) return '<div class="stats-empty">트렌드 데이터 없음</div>';
    const maxVal = Math.max(...trends.map(t => t.amount), 1);
    const height = 90;
    const barWidth = 28;
    const gap = 16;
    const width = trends.length * (barWidth + gap);

    const bars = trends.map((t, i) => {
      const barH = Math.max(4, Math.round((t.amount / maxVal) * (height - 30)));
      const x = i * (barWidth + gap) + 6;
      const y = height - 20 - barH;
      const amtLabel = t.amount >= 10000 ? `${Math.round(t.amount / 10000)}만` : `${t.amount}`;
      return `
        <g class="bar-group">
          <text x="${x + barWidth / 2}" y="${y - 4}" text-anchor="middle" font-size="9" fill="#64748B">${amtLabel}</text>
          <rect x="${x}" y="${y}" width="${barWidth}" height="${barH}" rx="4" fill="url(#barGradient)" />
          <text x="${x + barWidth / 2}" y="${height - 6}" text-anchor="middle" font-size="10" font-weight="600" fill="#334155">${t.monthLabel}</text>
        </g>
      `;
    }).join('');

    return `
      <svg class="stats-trend-svg" viewBox="0 0 ${width} ${height}" width="100%" height="${height}">
        <defs>
          <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#F43F5E" />
            <stop offset="100%" stop-color="#FB7185" />
          </linearGradient>
        </defs>
        ${bars}
      </svg>
    `;
  }

  /**
   * 모바일 최적화 통계 렌더러 (HTML 문자열 생성)
   */
  function renderMobileStatsHtml(transactions, targetMonth, budget) {
    const summary = calculateMonthlySummary(transactions, targetMonth, budget);
    const dist = calculatePayerDistribution(transactions, targetMonth);
    const cats = calculateCategorySummary(transactions, targetMonth);
    const trends = calculateMonthlyTrends(transactions, 5);

    if (!summary || summary.transactionCount === 0) {
      return `
        <div class="stats-empty-card">
          <div class="empty-icon">📊</div>
          <h3>${targetMonth}월 지출 내역이 없습니다</h3>
          <p>가계부에서 첫 지출을 등록하거나 엑셀을 업로드해보세요!</p>
        </div>
      `;
    }

    const catRows = cats.slice(0, 5).map((c, idx) => `
      <div class="stat-cat-row">
        <span class="cat-rank">${idx + 1}</span>
        <span class="cat-name">${c.category}</span>
        <div class="cat-bar-track">
          <div class="cat-bar-fill" style="width: ${c.percentage}%;"></div>
        </div>
        <span class="cat-amt">${c.amount.toLocaleString()}원</span>
        <span class="cat-pct">${c.percentage}%</span>
      </div>
    `).join('');

    return `
      <div class="mobile-stats-container">
        <!-- 1. 이번달 총 지출 & 예산 카드 -->
        <div class="stats-summary-card">
          <div class="summary-top">
            <span class="summary-month-chip">📅 ${targetMonth}월 현황</span>
            ${summary.budget > 0 ? `<span class="budget-badge ${summary.budgetUsedRate > 100 ? 'over' : ''}">${summary.budgetUsedRate}% 소진</span>` : ''}
          </div>
          <div class="summary-main-amt">
            <span class="amt-label">총 지출</span>
            <span class="amt-value">${summary.totalExpense.toLocaleString()}<small>원</small></span>
          </div>
          ${summary.budget > 0 ? `
            <div class="budget-progress-track">
              <div class="budget-progress-bar ${summary.budgetUsedRate > 100 ? 'over' : ''}" style="width: ${Math.min(100, summary.budgetUsedRate)}%;"></div>
            </div>
            <div class="summary-sub-info">
              <span>예산 ${summary.budget.toLocaleString()}원</span>
              <span>잔액 ${summary.remainBudget.toLocaleString()}원</span>
            </div>
          ` : `
            <div class="summary-sub-info">
              <span>수입 ${summary.totalIncome.toLocaleString()}원</span>
              <span>하루 평균 ${summary.dailyAverageExpense.toLocaleString()}원</span>
            </div>
          `}
          <!-- 고정비 비중 칩 -->
          <div class="fixed-expense-pill">
            <span>🔒 고정비: ${summary.fixedExpense.toLocaleString()}원 (${summary.fixedRate}%)</span>
            <span>⚡ 변동비: ${summary.variableExpense.toLocaleString()}원</span>
          </div>
        </div>

        <!-- 2. 부부 분담률 카드 (주니 vs 용이) -->
        <div class="stats-payer-card">
          <div class="card-title">💑 부부 지출 분담률</div>
          <div class="payer-split-bar">
            <div class="payer-bar juni" style="width: ${dist.juniPercent}%;" title="주니 ${dist.juniPercent}%"></div>
            <div class="payer-bar together" style="width: ${dist.togetherPercent}%;" title="공동 ${dist.togetherPercent}%"></div>
            <div class="payer-bar yongi" style="width: ${dist.yongiPercent}%;" title="용이 ${dist.yongiPercent}%"></div>
          </div>
          <div class="payer-legend">
            <div class="legend-item"><span class="dot juni"></span>🐻 주니: ${dist.juni.toLocaleString()}원 (${dist.juniPercent}%)</div>
            <div class="legend-item"><span class="dot yongi"></span>🐰 용이: ${dist.yongi.toLocaleString()}원 (${dist.yongiPercent}%)</div>
            <div class="legend-item"><span class="dot together"></span>🤝 공동: ${dist.together.toLocaleString()}원 (${dist.togetherPercent}%)</div>
          </div>
        </div>

        <!-- 3. 카테고리별 지출 Top 5 -->
        <div class="stats-category-card">
          <div class="card-title">🏷️ 카테고리별 지출 Top 5</div>
          <div class="cat-list-wrap">
            ${catRows}
          </div>
        </div>

        <!-- 4. 최근 5개월 지출 트렌드 -->
        <div class="stats-trend-card">
          <div class="card-title">📈 월별 지출 트렌드</div>
          ${renderMiniBarChartSvg(trends)}
        </div>
      </div>
    `;
  }

  /**
   * 웹(대화면) 피벗 매트릭스 테이블 HTML 렌더러
   */
  function renderWebPivotTableHtml(transactions, monthCount = 6) {
    const pivot = calculatePivotMatrix(transactions, monthCount);
    if (!pivot.months || pivot.months.length === 0) return '';

    const thCols = pivot.months.map(m => `<th>${m.substring(5, 7)}월</th>`).join('');
    const trRows = pivot.categories.map(cat => {
      const cells = pivot.months.map(m => {
        const val = pivot.matrix[cat][m] || 0;
        return `<td class="${val > 0 ? 'has-val' : 'zero-val'}">${val > 0 ? val.toLocaleString() : '-'}</td>`;
      }).join('');
      return `
        <tr>
          <td class="cat-label">${cat}</td>
          ${cells}
          <td class="row-total">${pivot.rowTotals[cat].toLocaleString()}원</td>
        </tr>
      `;
    }).join('');

    const totalCells = pivot.months.map(m => `<td class="col-total">${(pivot.colTotals[m] || 0).toLocaleString()}원</td>`).join('');

    return `
      <div class="web-pivot-card">
        <div class="pivot-header">
          <div class="card-title">📑 [웹 전용] 월별 × 카테고리 피벗 분석 매트릭스</div>
          <span class="pivot-badge">최근 ${pivot.months.length}개월 교차 집계</span>
        </div>
        <div class="pivot-table-scroll">
          <table class="pivot-table">
            <thead>
              <tr>
                <th>분류</th>
                ${thCols}
                <th>카테고리 합계</th>
              </tr>
            </thead>
            <tbody>
              ${trRows}
            </tbody>
            <tfoot>
              <tr>
                <th>월별 총합계</th>
                ${totalCells}
                <th class="grand-total">${pivot.grandTotal.toLocaleString()}원</th>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    `;
  }

  function getChartConfigForDoughnut(categorySummary) {
    return {
      type: 'doughnut',
      data: {
        labels: (categorySummary || []).map(c => c.category),
        datasets: [{
          data: (categorySummary || []).map(c => c.amount),
          backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF'],
          borderColor: '#ffffff',
          borderWidth: 2
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: true },
          tooltip: { enabled: true }
        }
      }
    };
  }

  function getChartConfigForMonthlyTrend(trends) {
    return {
      type: 'bar',
      data: {
        labels: (trends || []).map(t => t.month),
        datasets: [
          { label: '지출', data: (trends || []).map(t => t.expense), backgroundColor: 'rgba(255, 107, 107, 0.8)' },
          { label: '수입', data: (trends || []).map(t => t.income), backgroundColor: 'rgba(74, 206, 196, 0.8)' }
        ]
      },
      options: {
        animation: { duration: 500 },
        plugins: { legend: { display: true } },
        scales: {
          x: { grid: { display: false } },
          y: { beginAtZero: true }
        }
      }
    };
  }

  function renderWebDataGridHtml(transactions) {
    return `
      <style>
        .ledger-data-grid { width: 100%; overflow-x: auto; }
        .ledger-data-grid table { border-collapse: collapse; width: 100%; }
        .ledger-data-grid th { position: sticky; top: 0; }
        @media (max-width: 768px) { .ledger-data-grid { display: none; } }
      </style>
      <div class="ledger-data-grid">
        <table>
          <thead>
            <tr>
              <th>날짜</th><th>항목</th><th>카테고리</th><th>결제자</th><th>금액</th><th>유형</th><th>메모</th>
            </tr>
          </thead>
          <tbody>
            ${(transactions || []).map(t => `
              <tr>
                <td>${t.date}</td><td>${t.category}</td><td>${t.category}</td><td>${t.payer}</td><td>${t.amount}</td><td>${t.type}</td><td>${t.memo || ''}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  }

  return {
    calculateMonthlySummary,
    calculatePayerDistribution,
    calculateCategorySummary,
    calculateMonthlyTrends,
    calculatePivotMatrix,
    renderMiniBarChartSvg,
    renderMobileStatsHtml,
    renderWebPivotTableHtml,
    getChartConfigForDoughnut,
    getChartConfigForMonthlyTrend,
    renderWebDataGridHtml
  };
}));
