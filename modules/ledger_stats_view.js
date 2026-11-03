"use strict";

/**
 * LedgerStatsEngine 모듈
 * 달력 가계부 통계 및 차트 렌더링을 담당하는 Window.LedgerStatsEngine 네임스페이스
 */

if (typeof window === 'undefined') {
  console.error('LedgerStatsEngine: window 객체 없음');
}

window.LedgerStatsEngine = {
  // ------------------------
  // 월별 요약 계산
  // ------------------------
  calculateMonthlySummary(transactions, targetMonth, budget) {
    if (!Array.isArray(transactions)) return null;

    const monthStr = String(targetMonth);
    const monthTransactions = transactions.filter(t => {
      const txMonth = t.date ? t.date.substring(0, 7) : '';
      return txMonth === monthStr;
    });

    const totalExpense = monthTransactions.reduce((sum, t) => t.type === 'expense' ? sum + t.amount : sum, 0);
    const totalIncome = monthTransactions.reduce((sum, t) => t.type === 'income' ? sum + t.amount : sum, 0);
    const remainBudget = budget - totalExpense;
    const budgetUsedRate = budget > 0 ? (totalExpense / budget) * 100 : 0;
    const dailyAverageExpense = totalExpense > 0 ? totalExpense / 30 : 0;

    return {
      totalExpense: Math.round(totalExpense * 100) / 100,
      totalIncome: Math.round(totalIncome * 100) / 100,
      remainBudget: Math.round(remainBudget * 100) / 100,
      budgetUsedRate: Math.round(budgetUsedRate * 100) / 100,
      dailyAverageExpense: Math.round(dailyAverageExpense * 100) / 100,
      transactionCount: monthTransactions.length
    };
  },

  // ------------------------
  // 결제자별 지출 분배
  // ------------------------
  calculatePayerDistribution(transactions, targetMonth) {
    if (!Array.isArray(transactions)) return null;

    const monthStr = String(targetMonth);
    const monthTransactions = transactions.filter(t => {
      const txMonth = t.date ? t.date.substring(0, 7) : '';
      return txMonth === monthStr;
    });

    const payerAmounts = {
      juni: 0,
      yonji: 0,
      together: 0
    };

    monthTransactions.forEach(t => {
      if (t.type === 'expense' && t.payer && payerAmounts.hasOwnProperty(t.payer)) {
        payerAmounts[t.payer] += t.amount;
      }
    });

    const total = payerAmounts.juni + payerAmounts.yonji + payerAmounts.together;
    const distribution = {
      juni: Math.round(payerAmounts.juni * 100) / 100,
      yonji: Math.round(payerAmounts.yonji * 100) / 100,
      together: Math.round(payerAmounts.together * 100) / 100
    };

    if (total > 0) {
      distribution.juniPercent = Math.round((distribution.juni / total) * 10000) / 100;
      distribution.yonjiPercent = Math.round((distribution.yonji / total) * 10000) / 100;
      distribution.togetherPercent = Math.round((distribution.together / total) * 10000) / 100;
    }

    return distribution;
  },

  // ------------------------
  // 카테고리별 요약 (내림차순 정렬)
  // ------------------------
  calculateCategorySummary(transactions, targetMonth) {
    if (!Array.isArray(transactions)) return null;

    const monthStr = String(targetMonth);
    const monthTransactions = transactions.filter(t => {
      const txMonth = t.date ? t.date.substring(0, 7) : '';
      return txMonth === monthStr;
    });

    const categoryTotals = {};
    monthTransactions.forEach(t => {
      if (t.type === 'expense' && t.category) {
        categoryTotals[t.category] = (categoryTotals[t.category] || 0) + t.amount;
      }
    });

    const categorySummary = Object.entries(categoryTotals).map(([category, amount]) => ({
      category,
      amount: Math.round(amount * 100) / 100
    }));

    categorySummary.sort((a, b) => b.amount - a.amount);

    const total = categorySummary.reduce((sum, item) => sum + item.amount, 0);
    if (total > 0) {
      categorySummary.forEach(item => {
        item.percent = Math.round((item.amount / total) * 10000) / 100;
      });
    }

    return categorySummary;
  },

  // ------------------------
  // Chart.js 데이터 및 옵션 생성 - 도넛 차트
  // ------------------------
  getChartConfigForDoughnut(categorySummary) {
    if (!Array.isArray(categorySummary)) return null;

    const labels = categorySummary.map(item => item.category);
    const data = categorySummary.map(item => item.amount);
    const backgroundColors = [
      '#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#ffeaa7',
      '#fdcb6e', '#e17055', '#74b9ff', '#a29bfe', '#fd79a8'
    ];

    return {
      type: 'doughnut',
      data: {
        labels: labels,
        datasets: [{
          data: data,
          backgroundColor: backgroundColors.slice(0, labels.length),
          borderColor: '#ffffff',
          borderWidth: 2
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              padding: 20,
              usePointStyle: true,
              pointStyle: 'circle'
            }
          },
          tooltip: {
            callbacks: {
              label: function(context) {
                let label = context.label || '';
                let value = context.raw || 0;
                let total = context.dataset.data.reduce((a, b) => a + b, 0);
                let percentage = Math.round((value / total) * 10000) / 100;
                return `${label}: ${value.toLocaleString()}원 (${percentage}%)`;
              }
            }
          }
        },
        animation: {
          animateRotate: true,
          animateScale: false
        }
      }
    };
  },

  // ------------------------
  // Chart.js 데이터 및 옵션 생성 - 월별 트렌드 바 차트
  // ------------------------
  getChartConfigForMonthlyTrend(monthlyData) {
    if (!Array.isArray(monthlyData)) return null;

    const labels = monthlyData.map(item => item.month);
    const expenseData = monthlyData.map(item => item.expense);
    const incomeData = monthlyData.map(item => item.income);

    return {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [
          {
            label: '지출',
            data: expenseData,
            backgroundColor: 'rgba(255, 107, 107, 0.8)',
            borderColor: 'rgba(255, 107, 107, 1)',
            borderWidth: 1
          },
          {
            label: '수입',
            data: incomeData,
            backgroundColor: 'rgba(74, 206, 196, 0.8)',
            borderColor: 'rgba(74, 206, 196, 1)',
            borderWidth: 1
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          title: {
            display: true,
            text: '월별 수입/지출 트렌드'
          },
          legend: {
            position: 'top'
          },
          tooltip: {
            mode: 'index',
            intersect: false
          }
        },
        scales: {
          x: {
            stacked: false,
            grid: {
              display: false
            }
          },
          y: {
            stacked: false,
            beginAtZero: true,
            ticks: {
              callback: function(value) {
                return value.toLocaleString() + '원';
              }
            },
            grid: {
              color: 'rgba(0, 0, 0, 0.05)'
            }
          }
        },
        interaction: {
          mode: 'nearest',
          axis: 'x',
          intersect: false
        },
        animation: {
          duration: 750,
          easing: 'easeInOutQuart'
        }
      }
    };
  },

  // ------------------------
  // 웹 대화면 전용 일괄 데이터 그리드 HTML 생성
  // ------------------------
  getTableHeaders(transactions) {
    const basicHeaders = ['날짜', '항목', '카테고리', '결제자', '금액', '유형', '메모'];
    const extraHeaders = [];

    transactions.forEach(t => {
      Object.keys(t).forEach(key => {
        if (!basicHeaders.includes(key) && !extraHeaders.includes(key)) {
          extraHeaders.push(key);
        }
      });
    });

    return [...basicHeaders, ...extraHeaders];
  },

  getTableRowHtml(transaction) {
    const createCell = (content, className = '') => `<td class="${className}">${content || ''}</td>`;

    const basicCells = [
      createCell(transaction.date ? transaction.date.substring(0, 10) : ''),
      createCell(transaction.item || ''),
      createCell(transaction.category || ''),
      createCell(transaction.payer || ''),
      createCell(transaction.amount ? transaction.amount.toLocaleString() : '0'),
      createCell(transaction.type || ''),
      createCell(transaction.memo || '')
    ];

    const extraCells = [];
    this.getTableHeaders([transaction]).forEach((header, index) => {
      if (!['날짜', '항목', '카테고리', '결제자', '금액', '유형', '메모'].includes(header)) {
        extraCells.push(createCell(transaction[header] || '', 'extra'));
      }
    });

    return `<tr>${[...basicCells, ...extraCells].join('')}</tr>`;
  },

  renderWebDataGridHtml(transactions) {
    if (!Array.isArray(transactions)) return '';

    const headers = this.getTableHeaders(transactions);
    const headerRow = headers.map(h => `<th>${h}</th>`).join('');
    const bodyRows = transactions.map(t => this.getTableRowHtml(t)).join('');

    const style = `
      <style>
        .ledger-data-grid {
          width: '100%',
          border-collapse: collapse,
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif,
          font-size: 14px,
          color: #333,
          background-color: #fff,
          border: 1px solid #ddd,
          border-radius: 8px,
          overflow: hidden,
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }
        .ledger-data-grid th, .ledger-data-grid td {
          padding: 12px 16px,
          text-align: left,
          border-bottom: 1px solid #eee,
        }
        .ledger-data-grid th {
          background-color: #f8f9fa,
          font-weight: 600,
          color: #495057,
          position: sticky,
          top: 0,
          z-index: 10,
        }
        .ledger-data-grid tr:hover {
          background-color: #f1f3f5,
        }
        .ledger-data-grid tr:last-child td {
          border-bottom: none,
        }
        .amount-cell {
          font-family: 'Monaco', 'Menlo', 'Consolas', monospace,
          text-align: right,
          font-size: 13px,
        }
        .type-cell {
          font-weight: 500,
          textAlign: 'center',
        }
        .extra {
          background-color: #f8f9fa,
          font-size: 12px,
          color: #6c757d,
        }
        @media (max-width: 768px) {
          .ledger-data-grid {
            font-size: 12px,
          }
          .ledger-data-grid th, .ledger-data-grid td {
            padding: 8px 10px,
          }
        }
      </style>
    `;

    const tableHtml = `
      <div class="ledger-data-grid-wrapper" style="overflow: auto; max-height: 600px;">
        <table class="ledger-data-grid">
          <thead>
            <tr>${headerRow}</tr>
          </thead>
          <tbody>
            ${bodyRows}
          </tbody>
        </table>
      </div>
    `;

    return style + tableHtml;
  }
};

// 엔진 초기화
window.LedgerStatsEngine.init && window.LedgerStatsEngine.init();
