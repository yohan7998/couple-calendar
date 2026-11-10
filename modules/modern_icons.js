"use strict";

/**
 * ModernIcons - 세련된 모던 SVG 아이콘 시스템
 * Lucide / SF Symbols 스타일의 벡터 아이콘 제공
 * 이모지 완전 퇴출, 깔끔한 24px 뷰박스, stroke-width: 1.5~2.0
 */

if (typeof window === 'undefined') {
  console.error('ModernIcons: window 객체 없음');
}

window.ModernIcons = (function() {
  // 기본 스타일 상수
  const DEFAULT_STROKE_WIDTH = 1.75;
  const DEFAULT_VIEWBOX = "0 0 24 24";
  const DEFAULT_FILL = "none";

  /**
   * SVG 래퍼 생성
   */
  function createSVG(paths, options = {}) {
    const {
      viewBox = DEFAULT_VIEWBOX,
      fill = DEFAULT_FILL,
      stroke = options.color || "currentColor",
      strokeWidth = options.strokeWidth || DEFAULT_STROKE_WIDTH,
      strokeLinecap = "round",
      strokeLinejoin = "round",
      size = options.size || 24,
      className = "modern-icon",
      ariaHidden = "true"
    } = options;

    const pathStr = Array.isArray(paths) ? paths.join(" ") : paths;

    return `<svg
      class="${className}"
      width="${size}"
      height="${size}"
      viewBox="${viewBox}"
      fill="${fill}"
      stroke="${stroke}"
      stroke-width="${strokeWidth}"
      stroke-linecap="${strokeLinecap}"
      stroke-linejoin="${strokeLinejoin}"
      aria-hidden="${ariaHidden}"
      role="img"
    >
      ${pathStr}
    </svg>`;
  }

  // ============================================================
  // 핵심 네비게이션/액션 아이콘 (13종)
  // ============================================================

  const icons = {
    // 달력 - 캘린더 아이콘
    calendar(color = "currentColor", size = 24) {
      return createSVG([
        '<rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>',
        '<line x1="16" y1="2" x2="16" y2="6"/>',
        '<line x1="8" y1="2" x2="8" y2="6"/>',
        '<line x1="3" y1="10" x2="21" y2="10"/>'
      ], { color, size });
    },

    // 가계부/지갑/영수증 - 원형 지갑 스타일
    ledger(color = "currentColor", size = 24) {
      return createSVG([
        '<path d="M21 12V7H5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v2h4a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2h-5v-2"/>',
        '<path d="M9 12v6"/>',
        '<path d="M15 12v6"/>'
      ], { color, size });
    },

    // 쪽지함/편지봉투
    notes(color = "currentColor", size = 24) {
      return createSVG([
        '<path d="M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z"/>',
        '<polyline points="22,6 12,13 2,6"/>'
      ], { color, size });
    },

    // 통계/바차트
    stats(color = "currentColor", size = 24) {
      return createSVG([
        '<line x1="18" y1="20" x2="18" y2="10"/>',
        '<line x1="12" y1="20" x2="12" y2="4"/>',
        '<line x1="6" y1="20" x2="6" y2="14"/>'
      ], { color, size });
    },

    // 설정/톱니바퀴
    settings(color = "currentColor", size = 24) {
      return createSVG([
        '<circle cx="12" cy="12" r="3"/>',
        '<path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>'
      ], { color, size });
    },

    // 플러스
    plus(color = "currentColor", size = 24) {
      return createSVG([
        '<line x1="12" y1="5" x2="12" y2="19"/>',
        '<line x1="5" y1="12" x2="19" y2="12"/>'
      ], { color, size });
    },

    // 하트 (filled 옵션 지원)
    heart(color = "currentColor", size = 24, filled = false) {
      if (filled) {
        return createSVG([
          '<path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>'
        ], { color, size, fill: color, stroke: "none" });
      }
      return createSVG([
        '<path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>'
      ], { color, size });
    },

    // 휴지통
    trash(color = "currentColor", size = 24) {
      return createSVG([
        '<polyline points="3 6 5 6 21 6"/>',
        '<path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>',
        '<line x1="10" y1="11" x2="10" y2="17"/>',
        '<line x1="14" y1="11" x2="14" y2="17"/>'
      ], { color, size });
    },

    // 연필/수정
    edit(color = "currentColor", size = 24) {
      return createSVG([
        '<path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>',
        '<path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>'
      ], { color, size });
    },

    // 업로드 (엑셀 업로드)
    upload(color = "currentColor", size = 24) {
      return createSVG([
        '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>',
        '<polyline points="17 8 12 3 7 8"/>',
        '<line x1="12" y1="3" x2="12" y2="15"/>',
        '<rect x="3" y="11" width="18" height="4" rx="1" ry="1"/>'
      ], { color, size });
    },

    // 다운로드 (엑셀 다운로드)
    download(color = "currentColor", size = 24) {
      return createSVG([
        '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>',
        '<polyline points="7 10 12 15 17 10"/>',
        '<line x1="12" y1="15" x2="12" y2="3"/>'
      ], { color, size });
    },

    // 동기화
    sync(color = "currentColor", size = 24) {
      return createSVG([
        '<path d="M23 4v6h-6"/>',
        '<path d="M1 20v-6h6"/>',
        '<path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>'
      ], { color, size });
    },

    // 좌측 화살표 (이전 달 등)
    chevronLeft(color = "currentColor", size = 20) {
      return createSVG([
        '<polyline points="15 18 9 12 15 6"/>'
      ], { color, size });
    },

    // 우측 화살표 (다음 달 등)
    chevronRight(color = "currentColor", size = 20) {
      return createSVG([
        '<polyline points="9 18 15 12 9 6"/>'
      ], { color, size });
    },

    // 검색
    search(color = "currentColor", size = 20) {
      return createSVG([
        '<circle cx="11" cy="11" r="8"/>',
        '<line x1="21" y1="21" x2="16.65" y2="16.65"/>'
      ], { color, size });
    },

    // 닫기/취소
    close(color = "currentColor", size = 20) {
      return createSVG([
        '<line x1="18" y1="6" x2="6" y2="18"/>',
        '<line x1="6" y1="6" x2="18" y2="18"/>'
      ], { color, size });
    }
  };

  // ============================================================
  // 카테고리별 아이콘 매핑 (10대 카테고리)
  // ============================================================

  const categoryIcons = {
    // 식비 - 접시/포크나이프
    "식비": '<path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/>',
    // 장보기 - 장바구니
    "장보기": '<circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>',
    // 카페 - 커피잔
    "카페": '<path d="M10 2v2"/><path d="M14 2v2"/><path d="M16 8a1 1 0 0 1 1 1v8a3 3 0 0 1-3 3H7a3 3 0 0 1-3-3V9a1 1 0 0 1 1-1h14"/><path d="M12 4v4"/>',
    "카페/간식": '<path d="M10 2v2"/><path d="M14 2v2"/><path d="M16 8a1 1 0 0 1 1 1v8a3 3 0 0 1-3 3H7a3 3 0 0 1-3-3V9a1 1 0 0 1 1-1h14"/><path d="M12 4v4"/>',
    // 주거 - 집
    "주거": '<path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>',
    "주거/통신": '<path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>',
    // 교통 - 자동차/버스
    "교통": '<path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.3-1.5.7C1.6 8.3 1.3 9 1.3 9s-1.3 1.4-2.2 2.3C-2 10 2.3 10.8 1.5 11.9 1 12.1 1 13 1 13v3c0 .6.4 1 1 1h2"/><circle cx="7" cy="17" r="2"/><circle cx="17" cy="17" r="2"/>',
    // 의료 - 십자가/병원
    "의료": '<path d="M12 2v20"/><path d="M2 12h20"/><circle cx="12" cy="12" r="10"/>',
    "의료/건강": '<path d="M12 2v20"/><path d="M2 12h20"/><circle cx="12" cy="12" r="10"/>',
    // 쇼핑 - 쇼핑백
    "쇼핑": '<path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1 0 8"/>',
    "생활용품": '<path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1 0 8"/>',
    // 문화/여가 - 게임패드/영화
    "문화/여가": '<line x1="2" y1="12" x2="22" y2="12"/><path d="M18 8a6 6 0 0 0-12 0"/><path d="M6 16a10 10 0 0 1 12 0"/>',
    // 급여/수입 - 지폐/달러
    "급여/수입": '<rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="12" cy="12" r="3"/><line x1="6" y1="12" x2="6.01" y2="12"/><line x1="18" y1="12" x2="18.01" y2="12"/>',
    // 교육 - 책/도서관
    "교육": '<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/><path d="M8 12h8"/><path d="M8 16h5"/>',
    // 기타 - 태그/라벨
    "기타": '<path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/>'
  };

  // ============================================================
  // 공개 API
  // ============================================================

  return {
    // 직접 호출 메서드 매핑
    ...icons,

    // 단일 아이콘 반환
    get(name, options = {}) {
      const fn = icons[name];
      if (!fn) {
        console.warn(`ModernIcons: "${name}" 아이콘을 찾을 수 없습니다.`);
        return `<span class="icon-missing">[${name}]</span>`;
      }
      return fn(options.color, options.size, options.filled);
    },

    // 여러 아이콘 일괄 반환
    getAll(names, options = {}) {
      return names.map(name => this.get(name, options)).join("");
    },

    // 카테고리 아이콘 반환
    categoryIcon(categoryName, options = {}) {
      const path = categoryIcons[categoryName] || categoryIcons["기타"];
      return createSVG(path, {
        color: options.color || "currentColor",
        size: options.size || 24,
        className: "modern-icon category-icon"
      });
    },

    // 사용 가능한 아이콘 목록
    list() {
      return Object.keys(icons);
    },

    // 카테고리 목록
    listCategories() {
      return Object.keys(categoryIcons);
    },

    // 인라인 스타일시트 주입 (CSS 변수 등)
    injectStyles() {
      if (document.getElementById('modern-icons-styles')) return;

      const style = document.createElement('style');
      style.id = 'modern-icons-styles';
      style.textContent = `
        .modern-icon {
          display: inline-block;
          vertical-align: middle;
          flex-shrink: 0;
        }
        .modern-icon.category-icon {
          stroke-width: 1.5;
        }
        .icon-missing {
          font-size: 12px;
          color: var(--color-warning, #f59e0b);
          font-family: monospace;
        }
        /* 다크모드 대응 */
        @media (prefers-color-scheme: dark) {
          .modern-icon {
            stroke: currentColor;
          }
        }
        /* Reduced motion 지원 */
        @media (prefers-reduced-motion: reduce) {
          .modern-icon {
            transition: none !important;
          }
        }
      `;
      document.head.appendChild(style);
    }
  };
})();

// 자동 스타일 주입
if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => window.ModernIcons.injectStyles());
  } else {
    window.ModernIcons.injectStyles();
  }
}

// 엔진 초기화 완료
window.ModernIcons.init = function() {
  console.log('ModernIcons v1.0 initialized -', window.ModernIcons.list().length, 'icons ready');
};
window.ModernIcons.init();