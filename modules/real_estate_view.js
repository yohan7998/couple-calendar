/**
 * real_estate_view.js - Mobile-first UI Component for Real Estate & Moving Planner
 * Couple-Calendar v2.6.0
 */

(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    define([], factory);
  } else if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.RealEstateView = factory();
  }
}(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  // Import engine dependencies if in Node.js
  const Engine = (typeof window !== 'undefined' && window.RealEstateEngine) 
    ? window.RealEstateEngine 
    : (typeof require !== 'undefined' ? require('./real_estate_engine.js') : null);

  const formatKoreanPrice = Engine ? Engine.formatKoreanPrice : (p) => `${p}만원`;
  const calculateMovingCosts = Engine ? Engine.calculateMovingCosts : () => ({});
  const parsePropertyText = Engine ? Engine.parsePropertyText : () => null;

  class RealEstateView {
    constructor(options = {}) {
      this.container = null;
      this.store = null;
      this.currentUser = options.currentUser || '주니';
      this.partnerUser = options.currentUser === '주니' ? '용이' : '주니';
      this.onAddToCalendar = options.onAddToCalendar || null;
      this.onExportToLedger = options.onExportToLedger || null;
      this.onDataChange = options.onDataChange || null;

      // Active view mode ('list' | 'map')
      this.currentView = options.currentView || 'list';

      // Active filters
      this.selectedRegion = 'all';
      this.selectedStatus = 'all';
      this.selectedDealType = 'all';
      this.sortBy = 'created_desc';
      this.searchQuery = '';
    }

    render(container, store) {
      if (!container) return;
      this.container = container;
      this.store = store;

      // If container already initialized, preserve open modals and only refresh list
      const existingView = this.container.querySelector('.re-view-container');
      if (existingView) {
        this.refreshList();
        return;
      }

      this.container.innerHTML = `
        <div class="re-view-container">
          <!-- Top Action Bar -->
          <div class="re-action-bar">
            <button class="re-btn re-btn-primary" id="re-btn-smart-ingest">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect width="8" height="4" x="8" y="2" rx="1" ry="1"/>
                <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/>
                <path d="m9 14 2 2 4-4"/>
              </svg>
              <span>스마트 붙여넣기</span>
            </button>
            <button class="re-btn re-btn-secondary" id="re-btn-manual-add">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <line x1="5" y1="12" x2="19" y2="12"></line>
              </svg>
              <span>직접 등록</span>
            </button>
          </div>

          <!-- Dual View Toggle Bar -->
          <div class="re-view-toggle-bar" style="display: flex; gap: 8px; margin-top: 4px;">
            <button class="re-btn re-btn-sm ${this.currentView === 'list' ? 're-btn-primary' : 're-btn-secondary'}" id="re-toggle-list" style="flex: 1; justify-content: center;">
              <span>📋 목록보기</span>
            </button>
            <button class="re-btn re-btn-sm ${this.currentView === 'map' ? 're-btn-primary' : 're-btn-secondary'}" id="re-toggle-map" style="flex: 1; justify-content: center;">
              <span>🗺️ 지도보기</span>
            </button>
          </div>

          <!-- Region Chips Horizontal Scroll -->
          <div class="re-region-chips-wrapper">
            <div class="re-region-chips" id="re-region-chips"></div>
          </div>

          <!-- Stage Pipeline Tabs -->
          <div class="re-pipeline-tabs" id="re-pipeline-tabs">
            <button class="re-pipe-tab ${this.selectedStatus === 'all' ? 'active' : ''}" data-status="all">전체</button>
            <button class="re-pipe-tab ${this.selectedStatus === 'candidate' ? 'active' : ''}" data-status="candidate">💡 관심</button>
            <button class="re-pipe-tab ${this.selectedStatus === 'visit_scheduled' ? 'active' : ''}" data-status="visit_scheduled">🚗 임장예정</button>
            <button class="re-pipe-tab ${this.selectedStatus === 'visited' ? 'active' : ''}" data-status="visited">📝 방문완료</button>
            <button class="re-pipe-tab ${this.selectedStatus === 'favorite' ? 'active' : ''}" data-status="favorite">🏆 최종후보</button>
          </div>

          <!-- Summary & Filter Controls -->
          <div class="re-sub-controls">
            <span class="re-count-label" id="re-count-label">매물 0개</span>
            <select class="re-sort-select" id="re-sort-select">
              <option value="created_desc" ${this.sortBy === 'created_desc' ? 'selected' : ''}>최신 등록순</option>
              <option value="price_asc" ${this.sortBy === 'price_asc' ? 'selected' : ''}>가격 낮은순</option>
              <option value="price_desc" ${this.sortBy === 'price_desc' ? 'selected' : ''}>가격 높은순</option>
              <option value="rating_desc" ${this.sortBy === 'rating_desc' ? 'selected' : ''}>평점 높은순</option>
            </select>
          </div>

          <!-- Property Cards List -->
          <div class="re-card-list" id="re-card-list" style="${this.currentView === 'map' ? 'display: none;' : ''}"></div>

          <!-- Map View Container -->
          <div id="re-map-container" style="${this.currentView === 'map' ? '' : 'display: none;'}"></div>
        </div>

        <!-- Modals Container -->
        <div id="re-modals-root"></div>
      `;

      this.bindEvents();
      this.refreshList();
    }

    bindEvents() {
      // Smart Ingest Button
      const ingestBtn = this.container.querySelector('#re-btn-smart-ingest');
      if (ingestBtn) {
        ingestBtn.addEventListener('click', () => this.openSmartIngestModal());
      }

      // View Toggle Buttons (List vs Map)
      const toggleListBtn = this.container.querySelector('#re-toggle-list');
      const toggleMapBtn = this.container.querySelector('#re-toggle-map');
      if (toggleListBtn) {
        toggleListBtn.addEventListener('click', () => {
          this.currentView = 'list';
          this.updateViewMode();
        });
      }
      if (toggleMapBtn) {
        toggleMapBtn.addEventListener('click', () => {
          this.currentView = 'map';
          this.updateViewMode();
        });
      }

      // Manual Add Button
      const manualBtn = this.container.querySelector('#re-btn-manual-add');
      if (manualBtn) {
        manualBtn.addEventListener('click', () => this.openEditModal());
      }

      // Pipeline Tabs
      const tabs = this.container.querySelectorAll('.re-pipe-tab');
      tabs.forEach(tab => {
        tab.addEventListener('click', (e) => {
          tabs.forEach(t => t.classList.remove('active'));
          e.currentTarget.classList.add('active');
          this.selectedStatus = e.currentTarget.getAttribute('data-status');
          this.refreshList();
        });
      });

      // Sort Select
      const sortSelect = this.container.querySelector('#re-sort-select');
      if (sortSelect) {
        sortSelect.addEventListener('change', (e) => {
          this.sortBy = e.target.value;
          this.refreshList();
        });
      }
    }

    refreshList() {
      if (!this.store) return;

      // Render Region Chips
      this.renderRegionChips();

      // Filter and Sort
      const properties = this.store.filterProperties({
        region: this.selectedRegion,
        status: this.selectedStatus,
        dealType: this.selectedDealType,
        sortBy: this.sortBy,
        query: this.searchQuery
      });

      // Update Count
      const countLabel = this.container.querySelector('#re-count-label');
      if (countLabel) {
        countLabel.textContent = `매물 ${properties.length}건`;
      }

      // Render Cards
      const listContainer = this.container.querySelector('#re-card-list');
      if (!listContainer) return;

      if (properties.length === 0) {
        listContainer.innerHTML = `
          <div class="re-empty-state">
            <div class="re-empty-icon">🏠</div>
            <div class="re-empty-title">등록된 매물이 없습니다</div>
            <div class="re-empty-desc">네이버 부동산이나 호갱노노 링크를 복사한 후<br/>[스마트 붙여넣기]를 터치해 보세요!</div>
          </div>
        `;
      } else {
        listContainer.innerHTML = properties.map(p => this.renderPropertyCardHtml(p)).join('');
        // Bind Card Actions
        this.bindCardEvents(listContainer);
      }

      // If Map View is active, also update the map
      if (this.currentView === 'map') {
        this.refreshMap();
      }
    }

    updateViewMode() {
      const listBtn = this.container.querySelector('#re-toggle-list');
      const mapBtn = this.container.querySelector('#re-toggle-map');
      const listEl = this.container.querySelector('#re-card-list');
      const mapEl = this.container.querySelector('#re-map-container');

      if (listBtn && mapBtn) {
        if (this.currentView === 'list') {
          listBtn.className = 're-btn re-btn-sm re-btn-primary';
          mapBtn.className = 're-btn re-btn-sm re-btn-secondary';
        } else {
          listBtn.className = 're-btn re-btn-sm re-btn-secondary';
          mapBtn.className = 're-btn re-btn-sm re-btn-primary';
        }
      }

      if (listEl && mapEl) {
        if (this.currentView === 'list') {
          listEl.style.display = '';
          mapEl.style.display = 'none';
        } else {
          listEl.style.display = 'none';
          mapEl.style.display = '';
          this.refreshMap();
        }
      }
    }

    async refreshMap() {
      const MapEngine = (typeof window !== 'undefined' && window.RealEstateMap)
        || (typeof RealEstateMap !== 'undefined' ? RealEstateMap : null);
      if (!MapEngine || !this.store) return;

      const properties = this.store.filterProperties({
        region: this.selectedRegion,
        status: this.selectedStatus,
        dealType: this.selectedDealType,
        sortBy: this.sortBy,
        query: this.searchQuery
      });

      await MapEngine.initMap('re-map-container');
      await MapEngine.plotProperties(properties, (property) => {
        // When property marker selected
      });
    }

    renderRegionChips() {
      const chipsContainer = this.container.querySelector('#re-region-chips');
      if (!chipsContainer || !this.store) return;

      const regions = this.store.getRegions();
      const allCount = this.store.getAll().length;

      let chipsHtml = `
        <button class="re-chip ${this.selectedRegion === 'all' ? 'active' : ''}" data-region="all">
          전체보기 <span class="re-chip-badge">${allCount}</span>
        </button>
      `;

      regions.forEach(r => {
        const count = this.store.getAll().filter(p => p.region === r).length;
        chipsHtml += `
          <button class="re-chip ${this.selectedRegion === r ? 'active' : ''}" data-region="${this.escapeHtml(r)}">
            ${this.escapeHtml(r)} <span class="re-chip-badge">${count}</span>
          </button>
        `;
      });

      chipsContainer.innerHTML = chipsHtml;

      chipsContainer.querySelectorAll('.re-chip').forEach(btn => {
        btn.addEventListener('click', (e) => {
          this.selectedRegion = e.currentTarget.getAttribute('data-region');
          this.refreshList();
        });
      });
    }

    renderPropertyCardHtml(p) {
      const dealBadgeClass = p.dealType === '매매' ? 'deal-sale' : (p.dealType === '전세' ? 'deal-lease' : 'deal-rent');
      const statusMap = {
        candidate: { label: '💡 관심', cls: 'status-candidate' },
        contacted: { label: '📞 문의완료', cls: 'status-contacted' },
        visit_scheduled: { label: '🚗 임장예정', cls: 'status-scheduled' },
        visited: { label: '📝 방문완료', cls: 'status-visited' },
        favorite: { label: '🏆 최종후보', cls: 'status-favorite' },
        dropped: { label: '❌ 보류', cls: 'status-dropped' }
      };
      const statusInfo = statusMap[p.status] || { label: p.status, cls: '' };

      const isLiked = Array.isArray(p.likes) && p.likes.includes(this.currentUser);
      const likesCount = Array.isArray(p.likes) ? p.likes.length : 0;
      const commentsCount = Array.isArray(p.comments) ? p.comments.length : 0;

      // Price Formatting (당근 스타일 굵은 가격)
      let priceDisplay = p.formattedPrice || '';
      if (!priceDisplay) {
        if (p.dealType === '월세' && p.monthlyRent) {
          priceDisplay = `보증금 ${formatKoreanPrice(p.deposit || p.price)} / 월 ${p.monthlyRent}만`;
        } else {
          priceDisplay = (p.price && p.price > 0) ? `${p.dealType || '매매'} ${formatKoreanPrice(p.price)}` : '<span style="color:#94a3b8; font-weight:500;">금액 미확인</span>';
        }
      }

      // Source Badge
      const source = p.source || 'manual';
      let sourceLabel = '🥕 당근';
      let sourceCls = 're-source-daangn';
      if (source === 'naver') {
        sourceLabel = '🟢 네이버';
        sourceCls = 're-source-naver';
      } else if (source === 'manual') {
        sourceLabel = '🏠 직접';
        sourceCls = 're-source-manual';
      }

      // Thumbnail Image & Fallback
      const fallbackSvg = Engine && Engine.getAptSvgPlaceholder ? Engine.getAptSvgPlaceholder(p.complexName) : '';
      const thumbUrl = p.thumbnailUrl || p.imageUrl || fallbackSvg;

      // D-Day
      const dDayDisplay = p.dDay || (p.visitDate && Engine && Engine.calculateDDay ? Engine.calculateDDay(p.visitDate) : '');

      // Couple Memo (우선순위: coupleMemo > notes)
      const coupleMemoDisplay = (p.coupleMemo || p.notes || '').trim();

      const complexNameDisplay = (p.complexName && p.complexName.trim() && p.complexName !== '(단지명 미입력)')
        ? this.escapeHtml(p.complexName)
        : '<span style="color:#e11d48; font-size:13px; font-weight:600;">(단지명 미확인 - 수정 필요)</span>';

      return `
        <div class="re-daangn-card" data-id="${p.id}">
          <!-- 좌측 1:1 실사 썸네일 & 출처 뱃지 -->
          <div class="re-daangn-thumb-col">
            <img src="${thumbUrl}" class="re-daangn-thumb-img" alt="${this.escapeHtml(p.complexName)}" onerror="this.onerror=null; this.src='${fallbackSvg}';">
            <span class="re-source-badge ${sourceCls}">${sourceLabel}</span>
          </div>

          <!-- 우측 컨텐츠 영역 -->
          <div class="re-daangn-info-col">
            <div class="re-daangn-meta-row">
              <span class="re-badge-deal ${p.dealType === '매매' ? 'sale' : (p.dealType === '전세' ? 'lease' : 'rent')}">${p.dealType || '매매'}</span>
              ${p.region ? `<span class="re-daangn-region">${this.escapeHtml(p.region)}</span>` : ''}
              <span class="re-status-badge ${statusInfo.cls}">${statusInfo.label}</span>
              ${dDayDisplay ? `<span class="re-daangn-dday">🚗 ${this.escapeHtml(dDayDisplay)}</span>` : ''}
            </div>

            <!-- 당근 특유의 굵은 가격 -->
            <div class="re-daangn-bold-price">${priceDisplay}</div>

            <!-- 단지명 / 평수 / 층수 요약 -->
            <div class="re-daangn-sub-spec">
              ${complexNameDisplay}${p.building ? ' ' + this.escapeHtml(p.building) : ''}${p.area ? ' · ' + this.escapeHtml(p.area) : ''}${p.floor ? ' · ' + this.escapeHtml(p.floor) : ''}
            </div>

            <!-- 커플 메모 -->
            ${coupleMemoDisplay ? `
              <div class="re-daangn-memo-box">
                💬 "${this.escapeHtml(coupleMemoDisplay)}"
              </div>
            ` : ''}

            <!-- 카드 하단 바 -->
            <div class="re-daangn-footer">
              <div class="re-daangn-social">
                <button class="re-daangn-like-btn re-like-btn ${isLiked ? 'liked' : ''}" data-id="${p.id}" title="찜하기">
                  <span>${isLiked ? '❤️' : '🤍'}</span>
                  <span>${likesCount}</span>
                </button>
                <button class="re-social-btn re-comment-btn" data-id="${p.id}" title="코멘트">
                  <span>💬</span>
                  <span>${commentsCount}</span>
                </button>
                ${(p.sourceUrl || p.url) ? `
                  <a href="${p.sourceUrl || p.url}" target="_blank" rel="noopener noreferrer" class="re-link-anchor" title="매물 원문 열기">
                    <span>원문 ↗</span>
                  </a>
                ` : ''}
              </div>

              <div class="re-daangn-actions">
                <button class="re-micro-btn btn-visit" data-id="${p.id}" title="임장 예약 및 캘린더 등록">🚗 임장</button>
                <button class="re-micro-btn btn-calc" data-id="${p.id}" title="이사비용/복비 계산">🧮</button>
                <button class="re-micro-btn btn-edit" data-id="${p.id}" title="수정">✏️</button>
                <button class="re-micro-btn btn-delete" data-id="${p.id}" title="삭제">🗑️</button>
              </div>
            </div>
          </div>
        </div>
      `;
    }

    bindCardEvents(container) {
      // Like Toggle
      container.querySelectorAll('.re-like-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const id = btn.getAttribute('data-id');
          if (this.store) {
            this.store.toggleLike(id, this.currentUser);
            this.notifyChange();
            this.refreshList();
          }
        });
      });

      // Edit Button
      container.querySelectorAll('.btn-edit').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const id = btn.getAttribute('data-id');
          const prop = this.store.getProperty(id);
          if (prop) this.openEditModal(prop);
        });
      });

      // Delete Button
      container.querySelectorAll('.btn-delete').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const id = btn.getAttribute('data-id');
          const prop = this.store.getProperty(id);
          if (confirm(`'${prop ? prop.complexName : '해당 매물'}'을(를) 삭제하시겠습니까?`)) {
            this.store.deleteProperty(id);
            this.notifyChange();
            this.refreshList();
          }
        });
      });

      // Visit & Checklist Button
      container.querySelectorAll('.btn-visit').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const id = btn.getAttribute('data-id');
          const prop = this.store.getProperty(id);
          if (prop) this.openVisitModal(prop);
        });
      });

      // Cost Calculation Button
      container.querySelectorAll('.btn-calc').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const id = btn.getAttribute('data-id');
          const prop = this.store.getProperty(id);
          if (prop) this.openCostModal(prop);
        });
      });

      // Comment Button
      container.querySelectorAll('.re-comment-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const id = btn.getAttribute('data-id');
          const prop = this.store.getProperty(id);
          if (prop) this.openCommentModal(prop);
        });
      });
    }

    // =========================================================================
    // MODALS
    // =========================================================================

    openSmartIngestModal() {
      const modalRoot = this.container.querySelector('#re-modals-root');
      if (!modalRoot) return;

      modalRoot.innerHTML = `
        <div class="re-modal-overlay" id="smart-modal-overlay">
          <div class="re-modal-card">
            <div class="re-modal-header">
              <h3>📋 스마트 클립보드 붙여넣기</h3>
              <button class="re-modal-close" id="modal-close">&times;</button>
            </div>
            <div class="re-modal-body">
              <p class="re-modal-guide">
                네이버 부동산 또는 <strong>당근부동산</strong>에서 [공유하기]로 복사한 텍스트나 링크를 붙여넣으세요.
              </p>
              <div class="re-clipboard-action-bar">
                <button class="re-btn re-btn-sm" id="btn-read-clipboard">
                  📋 클립보드 자동 읽기
                </button>
              </div>
              <textarea class="re-textarea" id="smart-raw-input" rows="4" placeholder="예: [네이버 부동산] 봇들마을4단지 매매 14억 5,000 / [당근부동산] 역삼동 투룸 전세 2억 5,000 https://..."></textarea>
              
              <div class="re-parse-preview" id="parse-preview-box" style="display:none;">
                <div class="preview-badge" id="preview-badge-label">자동 추출 결과</div>
                <div class="preview-grid" id="parse-preview-content"></div>
              </div>

              <div class="re-modal-tip" style="background: rgba(59, 130, 246, 0.08); border: 1px solid rgba(59, 130, 246, 0.2); border-radius: 8px; padding: 10px 12px; font-size: 11.5px; color: #1d4ed8; margin-top: 12px; line-height: 1.5;">
                💡 <strong>0초 자동 완성 꿀팁</strong>: 네이버 부동산 화면 상단 사진 바로 아래, <strong>단지명(동) 오른쪽의 ↗️ (화살표 공유 아이콘)</strong>을 누른 후 <strong>[카카오톡 나에게]</strong>나 <strong>[텍스트 복사]</strong>를 선택하면 단지명·금액·층수가 100% 자동 채워져 단 1글자도 타이핑할 필요가 없습니다!
              </div>
            </div>
            <div class="re-modal-footer">
              <button class="re-btn re-btn-secondary" id="btn-cancel">취소</button>
              <button class="re-btn re-btn-primary" id="btn-confirm-ingest" disabled>확인 및 매물 등록</button>
            </div>
          </div>
        </div>
      `;

      const overlay = modalRoot.querySelector('#smart-modal-overlay');
      const textarea = modalRoot.querySelector('#smart-raw-input');
      const previewBox = modalRoot.querySelector('#parse-preview-box');
      const previewBadge = modalRoot.querySelector('#preview-badge-label');
      const previewContent = modalRoot.querySelector('#parse-preview-content');
      const confirmBtn = modalRoot.querySelector('#btn-confirm-ingest');
      let currentParsed = null;

      const runParse = (text) => {
        if (!text || !text.trim()) {
          previewBox.style.display = 'none';
          confirmBtn.disabled = true;
          currentParsed = null;
          return;
        }

        const parsed = parsePropertyText(text);
        if (parsed && parsed.complexName && parsed.complexName.trim() !== '') {
          currentParsed = parsed;
          previewBox.style.display = 'block';
          if (previewBadge) {
            previewBadge.textContent = '자동 추출 결과';
            previewBadge.style.background = 'var(--re-primary, #b8860b)';
          }
          previewContent.innerHTML = `
            <div><strong>단지명:</strong> ${this.escapeHtml(parsed.complexName)}</div>
            <div><strong>지역:</strong> ${this.escapeHtml(parsed.region || '-')}</div>
            <div><strong>거래:</strong> ${parsed.dealType || '매매'}</div>
            <div><strong>가격:</strong> ${parsed.price > 0 ? formatKoreanPrice(parsed.price) : '금액 미확인'}</div>
            ${parsed.area ? `<div><strong>면적:</strong> ${this.escapeHtml(parsed.area)}</div>` : ''}
            ${parsed.floor ? `<div><strong>층수:</strong> ${this.escapeHtml(parsed.floor)}</div>` : ''}
          `;
          confirmBtn.textContent = '확인 및 매물 등록';
          confirmBtn.disabled = false;
        } else if (parsed && (parsed.isUrlOnly || parsed.url)) {
          const Scraper = (typeof window !== 'undefined' && window.RealEstateScraper)
            || (typeof RealEstateScraper !== 'undefined' ? RealEstateScraper : null);

          const renderQuickFallback = (p) => {
            currentParsed = p;
            previewBox.style.display = 'block';
            if (previewBadge) {
              previewBadge.textContent = '매물 링크 감지';
              previewBadge.style.background = '#d97706';
            }
            previewContent.innerHTML = `
              <div style="grid-column: 1 / -1; padding: 2px 0;">
                <div style="font-weight: 700; color: #b45309; font-size: 13px; margin-bottom: 4px;">🔗 매물 링크가 확인되었습니다!</div>
                <div style="font-size: 12px; color: #64748b; line-height: 1.4; margin-bottom: 10px;">
                  단지명과 금액을 입력하시면 창 이동 없이 바로 등록됩니다.
                </div>
                <div style="display: flex; flex-direction: column; gap: 8px;">
                  <div>
                    <label style="font-size: 11.5px; font-weight: 700; color: #334155; display: block; margin-bottom: 3px;">단지명 / 건물명 *</label>
                    <input type="text" class="re-input" id="smart-quick-complex" placeholder="예: 엘리프미아역2단지" value="${this.escapeHtml(p.complexName || '')}">
                  </div>
                  <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
                    <div>
                      <label style="font-size: 11.5px; font-weight: 700; color: #334155; display: block; margin-bottom: 3px;">거래 유형</label>
                      <select class="re-select" id="smart-quick-deal">
                        <option value="매매" ${p.dealType === '매매' ? 'selected' : ''}>매매</option>
                        <option value="전세" ${p.dealType === '전세' ? 'selected' : ''}>전세</option>
                        <option value="월세" ${p.dealType === '월세' ? 'selected' : ''}>월세</option>
                      </select>
                    </div>
                    <div>
                      <label style="font-size: 11.5px; font-weight: 700; color: #334155; display: block; margin-bottom: 3px;">금액 (만원)</label>
                      <input type="number" class="re-input" id="smart-quick-price" placeholder="예: 118725" value="${p.price > 0 ? p.price : ''}">
                    </div>
                  </div>
                  <div id="smart-quick-price-hint" style="font-size: 11.5px; color: #b45309; font-weight: 600; min-height: 16px;"></div>
                  <div style="text-align: right; margin-top: 2px;">
                    <button type="button" id="btn-smart-goto-detail" style="background: none; border: none; color: #2563eb; font-size: 11px; cursor: pointer; text-decoration: underline; padding: 0;">
                      더 상세한 정보(층수·평형·평점) 입력하기 ➔
                    </button>
                  </div>
                </div>
              </div>
            `;

            const qPriceInp = previewContent.querySelector('#smart-quick-price');
            const qPriceHint = previewContent.querySelector('#smart-quick-price-hint');
            const updateQPrice = () => {
              const val = Number(qPriceInp?.value) || 0;
              if (qPriceHint) qPriceHint.textContent = val > 0 ? `= ${formatKoreanPrice(val)}` : '';
            };
            if (qPriceInp) {
              qPriceInp.addEventListener('input', updateQPrice);
              updateQPrice();
            }

            const gotoDetailBtn = previewContent.querySelector('#btn-smart-goto-detail');
            if (gotoDetailBtn) {
              gotoDetailBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                const cName = previewContent.querySelector('#smart-quick-complex')?.value.trim() || '';
                const dType = previewContent.querySelector('#smart-quick-deal')?.value || '매매';
                const prc = Number(previewContent.querySelector('#smart-quick-price')?.value) || 0;
                this.openEditModal({
                  url: currentParsed.url || '',
                  complexName: cName,
                  dealType: dType,
                  price: prc,
                  notes: currentParsed.url ? `원문 링크: ${currentParsed.url}` : ''
                });
              });
            }

            confirmBtn.textContent = '바로 매물 등록하기 ✨';
            confirmBtn.disabled = false;
          };

          // Try real-time scraper if Naver link detected
          const targetUrl = parsed.url || text.trim();
          if (Scraper && (targetUrl.includes('naver.me') || targetUrl.includes('land.naver.com'))) {
            previewBox.style.display = 'block';
            if (previewBadge) {
              previewBadge.textContent = '실시간 스크랩 중 🔍';
              previewBadge.style.background = '#2563EB';
            }
            previewContent.innerHTML = `
              <div style="grid-column: 1 / -1; padding: 14px; text-align: center; color: #1D4ED8;">
                <div style="font-weight: 700; font-size: 13.5px; margin-bottom: 4px;">⚡ 네이버 부동산 매물 0초 자동 스크랩 중...</div>
                <div style="font-size: 11.5px; color: #64748B;">단지명, 거래유형, 금액, 대표 이미지를 추출하고 있습니다.</div>
              </div>
            `;
            confirmBtn.disabled = true;

            Scraper.scrapeNaverUrl(targetUrl).then(scraped => {
              if (scraped && scraped.complexName && scraped.complexName !== '(스크래핑 실패)') {
                currentParsed = Object.assign({}, parsed, scraped);
                if (previewBadge) {
                  previewBadge.textContent = '자동 스크랩 완료 ✅';
                  previewBadge.style.background = '#059669';
                }
                previewContent.innerHTML = `
                  ${scraped.imageUrl ? `<div style="grid-column: 1 / -1; margin-bottom: 8px;"><img src="${this.escapeHtml(scraped.imageUrl)}" style="width: 100%; max-height: 140px; object-fit: cover; border-radius: 8px;" alt="매물 사진"></div>` : ''}
                  <div><strong>단지명:</strong> ${this.escapeHtml(scraped.complexName)} ${scraped.building ? this.escapeHtml(scraped.building) : ''}</div>
                  <div><strong>거래유형:</strong> ${this.escapeHtml(scraped.dealType)}</div>
                  <div><strong>가격:</strong> ${scraped.priceFormatted || formatKoreanPrice(scraped.price)}</div>
                  <div style="grid-column: 1 / -1; color: #059669; font-weight: 700; font-size: 12px; margin-top: 6px;">🎉 타이핑 제로! 링크에서 매물 정보를 성공적으로 추출했습니다.</div>
                `;
                confirmBtn.textContent = '확인 및 매물 등록 ✨';
                confirmBtn.disabled = false;
              } else {
                renderQuickFallback(parsed);
              }
            }).catch(() => {
              renderQuickFallback(parsed);
            });
          } else {
            renderQuickFallback(parsed);
          }
        } else {
          previewBox.style.display = 'block';
          if (previewBadge) {
            previewBadge.textContent = '수동 등록 안내';
            previewBadge.style.background = '#64748b';
          }
          previewContent.innerHTML = `<span class="re-parse-warn">텍스트에서 매물 정보를 감지하지 못했습니다. 수동으로 등록하시겠습니까?</span>`;
          confirmBtn.textContent = '직접 입력하여 등록 ➔';
          confirmBtn.disabled = false;
          currentParsed = { complexName: '', rawText: text, dealType: '매매', price: 0 };
        }
      };

      textarea.addEventListener('input', (e) => runParse(e.target.value));

      // Clipboard auto-read button
      const cbBtn = modalRoot.querySelector('#btn-read-clipboard');
      if (cbBtn && navigator.clipboard && navigator.clipboard.readText) {
        cbBtn.addEventListener('click', async (e) => {
          e.preventDefault();
          e.stopPropagation();
          try {
            const clipText = await navigator.clipboard.readText();
            if (clipText) {
              textarea.value = clipText;
              runParse(clipText);
            }
          } catch (err) {
            alert('클립보드 접근 권한이 필요합니다. 텍스트를 직접 붙여넣어 주세요.');
          }
        });
      }

      // Close handlers
      modalRoot.querySelector('#modal-close').addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        modalRoot.innerHTML = '';
      });
      modalRoot.querySelector('#btn-cancel').addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        modalRoot.innerHTML = '';
      });

      // Confirm Add or Switch to Edit Modal
      confirmBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (!currentParsed) return;

        // Check if Quick Inline inputs exist
        const quickComplex = modalRoot.querySelector('#smart-quick-complex');
        const quickDeal = modalRoot.querySelector('#smart-quick-deal');
        const quickPrice = modalRoot.querySelector('#smart-quick-price');

        if (quickComplex) {
          const complexName = quickComplex.value.trim();
          if (!complexName) {
            alert('단지명을 입력해 주세요. (예: 엘리프미아역2단지)');
            quickComplex.focus();
            return;
          }
          const dealType = quickDeal ? quickDeal.value : '매매';
          const price = quickPrice ? (Number(quickPrice.value) || 0) : 0;

          if (this.store) {
            this.store.addProperty({
              complexName,
              dealType,
              price,
              url: currentParsed.url || '',
              rawText: currentParsed.rawText || '',
              status: 'candidate',
              createdBy: this.currentUser,
              notes: currentParsed.url ? `원문 링크: ${currentParsed.url}` : ''
            });
            modalRoot.innerHTML = '';
            this.notifyChange();
            this.refreshList();
          }
          return;
        }

        // If complex name is missing or isUrlOnly without inline form, switch to edit modal with prefilled data
        if (!currentParsed.complexName || currentParsed.isUrlOnly) {
          const prefill = {
            url: currentParsed.url || '',
            dealType: currentParsed.dealType || '매매',
            price: currentParsed.price || 0,
            region: currentParsed.region || '',
            complexName: currentParsed.complexName || '',
            area: currentParsed.area || '',
            floor: currentParsed.floor || '',
            agentContact: currentParsed.agentContact || '',
            notes: currentParsed.rawText ? `원문 링크: ${currentParsed.url || ''}` : ''
          };
          this.openEditModal(prefill);
          return;
        }

        // Full parsed property -> save directly
        if (this.store) {
          this.store.addProperty({
            ...currentParsed,
            createdBy: this.currentUser,
            status: 'candidate'
          });
          modalRoot.innerHTML = '';
          this.notifyChange();
          this.refreshList();
        }
      });
    }

    openEditModal(existing = null) {
      const modalRoot = this.container.querySelector('#re-modals-root');
      if (!modalRoot) return;

      const isEdit = !!(existing && existing.id);
      const defaults = {
        id: '',
        complexName: '',
        region: '',
        dealType: '매매',
        price: 0,
        deposit: 0,
        monthlyRent: 0,
        area: '',
        floor: '',
        url: '',
        agentContact: '',
        status: 'candidate',
        rating: 3.0,
        notes: '',
        pros: [],
        cons: [],
        checklist: {}
      };
      const p = Object.assign({}, defaults, existing || {});

      modalRoot.innerHTML = `
        <div class="re-modal-overlay" id="edit-modal-overlay">
          <div class="re-modal-card re-modal-scrollable">
            <div class="re-modal-header">
              <h3>${isEdit ? '✏️ 매물 정보 수정' : '➕ 매물 직접 등록'}</h3>
              <button class="re-modal-close" id="edit-close">&times;</button>
            </div>
            <div class="re-modal-body">
              <div class="re-form-group">
                <label>단지명 / 건물명 *</label>
                <input type="text" class="re-input" id="inp-complex" value="${this.escapeHtml(p.complexName)}" placeholder="예: 백현마을 5단지" required>
              </div>

              <div class="re-form-row">
                <div class="re-form-group">
                  <label>지역 분류</label>
                  <input type="text" class="re-input" id="inp-region" value="${this.escapeHtml(p.region)}" placeholder="예: 분당구 백현동">
                </div>
                <div class="re-form-group">
                  <label>거래 유형</label>
                  <select class="re-select" id="inp-deal-type">
                    <option value="매매" ${p.dealType === '매매' ? 'selected' : ''}>매매</option>
                    <option value="전세" ${p.dealType === '전세' ? 'selected' : ''}>전세</option>
                    <option value="월세" ${p.dealType === '월세' ? 'selected' : ''}>월세</option>
                  </select>
                </div>
              </div>

              <div class="re-form-row">
                <div class="re-form-group">
                  <label>금액 (만원 단위) *</label>
                  <input type="number" class="re-input" id="inp-price" value="${p.price || ''}" placeholder="예: 85000 (8억 5,000만)">
                  <span class="re-input-hint" id="price-hint"></span>
                </div>
                <div class="re-form-group">
                  <label>전용/공급면적</label>
                  <input type="text" class="re-input" id="inp-area" value="${this.escapeHtml(p.area)}" placeholder="예: 84㎡ (33평)">
                </div>
              </div>

              <div class="re-form-row">
                <div class="re-form-group">
                  <label>층수 / 향</label>
                  <input type="text" class="re-input" id="inp-floor" value="${this.escapeHtml(p.floor)}" placeholder="예: 11/15층 (남향)">
                </div>
                <div class="re-form-group">
                  <label>진행 상태</label>
                  <select class="re-select" id="inp-status">
                    <option value="candidate" ${p.status === 'candidate' ? 'selected' : ''}>💡 관심후보</option>
                    <option value="contacted" ${p.status === 'contacted' ? 'selected' : ''}>📞 문의완료</option>
                    <option value="visit_scheduled" ${p.status === 'visit_scheduled' ? 'selected' : ''}>🚗 임장예정</option>
                    <option value="visited" ${p.status === 'visited' ? 'selected' : ''}>📝 방문완료</option>
                    <option value="favorite" ${p.status === 'favorite' ? 'selected' : ''}>🏆 최종후보</option>
                    <option value="dropped" ${p.status === 'dropped' ? 'selected' : ''}>❌ 보류/탈락</option>
                  </select>
                </div>
              </div>

              <div class="re-form-group">
                <label>부동산 상호 / 연락처</label>
                <input type="text" class="re-input" id="inp-agent" value="${this.escapeHtml(p.agentContact)}" placeholder="예: 한마음부동산 010-1234-5678">
              </div>

              <div class="re-form-group">
                <label>매물 링크 URL</label>
                <input type="url" class="re-input" id="inp-url" value="${this.escapeHtml(p.url)}" placeholder="https://m.land.naver.com/...">
              </div>

              <div class="re-form-group">
                <label>별점 (평가)</label>
                <div class="re-rating-select">
                  <input type="range" min="1" max="5" step="0.5" id="inp-rating" value="${p.rating || 3.0}">
                  <span id="rating-val-display">${(p.rating || 3.0).toFixed(1)}점</span>
                </div>
              </div>

              <div class="re-form-group">
                <label>메모 / 한줄 평</label>
                <textarea class="re-textarea" id="inp-notes" rows="3" placeholder="특징이나 장단점을 자유롭게 적어보세요">${this.escapeHtml(p.notes)}</textarea>
              </div>
            </div>
            <div class="re-modal-footer">
              <button class="re-btn re-btn-secondary" id="edit-cancel">취소</button>
              <button class="re-btn re-btn-primary" id="edit-save">${isEdit ? '저장하기' : '등록하기'}</button>
            </div>
          </div>
        </div>
      `;

      // Price Live Hint
      const priceInp = modalRoot.querySelector('#inp-price');
      const priceHint = modalRoot.querySelector('#price-hint');
      const updatePriceHint = () => {
        const val = Number(priceInp.value) || 0;
        priceHint.textContent = val > 0 ? `= ${formatKoreanPrice(val)}` : '';
      };
      priceInp.addEventListener('input', updatePriceHint);
      updatePriceHint();

      // Rating slider
      const ratingInp = modalRoot.querySelector('#inp-rating');
      const ratingDisp = modalRoot.querySelector('#rating-val-display');
      ratingInp.addEventListener('input', (e) => {
        ratingDisp.textContent = `${Number(e.target.value).toFixed(1)}점`;
      });

      // Close
      modalRoot.querySelector('#edit-close').addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        modalRoot.innerHTML = '';
      });
      modalRoot.querySelector('#edit-cancel').addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        modalRoot.innerHTML = '';
      });

      // Save
      modalRoot.querySelector('#edit-save').addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const complexName = modalRoot.querySelector('#inp-complex').value.trim();
        if (!complexName) {
          alert('단지명을 입력해 주세요.');
          return;
        }

        const data = {
          complexName,
          region: modalRoot.querySelector('#inp-region').value.trim(),
          dealType: modalRoot.querySelector('#inp-deal-type').value,
          price: Number(modalRoot.querySelector('#inp-price').value) || 0,
          area: modalRoot.querySelector('#inp-area').value.trim(),
          floor: modalRoot.querySelector('#inp-floor').value.trim(),
          status: modalRoot.querySelector('#inp-status').value,
          agentContact: modalRoot.querySelector('#inp-agent').value.trim(),
          url: modalRoot.querySelector('#inp-url').value.trim(),
          rating: Number(modalRoot.querySelector('#inp-rating').value) || 3.0,
          notes: modalRoot.querySelector('#inp-notes').value.trim()
        };

        if (isEdit) {
          this.store.updateProperty(existing.id, data);
        } else {
          this.store.addProperty({ ...data, createdBy: this.currentUser });
        }

        modalRoot.innerHTML = '';
        this.notifyChange();
        this.refreshList();
      });
    }

    openVisitModal(prop) {
      const modalRoot = this.container.querySelector('#re-modals-root');
      if (!modalRoot) return;

      const cl = prop.checklist || {};

      modalRoot.innerHTML = `
        <div class="re-modal-overlay">
          <div class="re-modal-card re-modal-scrollable">
            <div class="re-modal-header">
              <h3>🚗 임장 & 현장 체크리스트</h3>
              <button class="re-modal-close" id="visit-close">&times;</button>
            </div>
            <div class="re-modal-body">
              <div class="re-target-box">
                <strong>${this.escapeHtml(prop.complexName)}</strong> (${formatKoreanPrice(prop.price)})
              </div>

              <!-- Visit Date Setting & Calendar Link -->
              <div class="re-form-group">
                <label>임장 방문 일시</label>
                <input type="datetime-local" class="re-input" id="inp-visit-date" value="${prop.visitDate ? prop.visitDate.replace(' ', 'T') : ''}">
                <button class="re-btn re-btn-sm re-btn-cal" id="btn-sync-calendar" style="margin-top:8px;">
                  📅 달콤살벌 캘린더에 일정 등록
                </button>
              </div>

              <!-- 5 Core Checklists -->
              <div class="re-checklist-group">
                <div class="checklist-title">현장 필수 실사 체크 (5대 항목)</div>
                <label class="re-check-item">
                  <input type="checkbox" id="chk-sunlight" ${cl.sunlight ? 'checked' : ''}>
                  <span>☀️ <strong>채광 / 일조</strong> (남향 확인, 앞동 가림 없음)</span>
                </label>
                <label class="re-check-item">
                  <input type="checkbox" id="chk-sound" ${cl.soundproof ? 'checked' : ''}>
                  <span>🔇 <strong>소음 여건</strong> (층간소음, 도로/지하철 소음)</span>
                </label>
                <label class="re-check-item">
                  <input type="checkbox" id="chk-parking" ${cl.parking ? 'checked' : ''}>
                  <span>🚗 <strong>주차 여건</strong> (지하주차장 엘베 직결, 대수)</span>
                </label>
                <label class="re-check-item">
                  <input type="checkbox" id="chk-water" ${cl.waterPressure ? 'checked' : ''}>
                  <span>🚰 <strong>수압 / 배수</strong> (욕실, 싱크대, 세탁실)</span>
                </label>
                <label class="re-check-item">
                  <input type="checkbox" id="chk-leak" ${cl.maintenance ? 'checked' : ''}>
                  <span>💧 <strong>결로 / 누수</strong> (베란다 곰팡이, 샷시 노후도)</span>
                </label>
              </div>

              <div class="re-form-group" style="margin-top:16px;">
                <label>현장 방문 상세 메모</label>
                <textarea class="re-textarea" id="inp-visit-notes" rows="3" placeholder="중개사님 네고 여지, 이웃 분위기 등을 적어두세요">${this.escapeHtml(prop.notes || '')}</textarea>
              </div>
            </div>
            <div class="re-modal-footer">
              <button class="re-btn re-btn-secondary" id="visit-cancel">취소</button>
              <button class="re-btn re-btn-primary" id="visit-save">체크리스트 저장</button>
            </div>
          </div>
        </div>
      `;

      // Close
      modalRoot.querySelector('#visit-close').addEventListener('click', () => modalRoot.innerHTML = '');
      modalRoot.querySelector('#visit-cancel').addEventListener('click', () => modalRoot.innerHTML = '');

      // Calendar Sync Button
      modalRoot.querySelector('#btn-sync-calendar').addEventListener('click', () => {
        const dateVal = modalRoot.querySelector('#inp-visit-date').value;
        if (!dateVal) {
          alert('방문 일시를 먼저 지정해 주세요.');
          return;
        }

        const formattedDate = dateVal.replace('T', ' ');
        if (this.onAddToCalendar) {
          this.onAddToCalendar({
            title: `[임장] ${prop.complexName}`,
            date: dateVal.split('T')[0],
            time: dateVal.split('T')[1] || '14:00',
            memo: `${prop.region || ''} ${formatKoreanPrice(prop.price)} (${prop.agentContact || ''})`,
            category: '집보기'
          });
          alert(`달콤살벌 캘린더에 임장 일정이 등록되었습니다!\n(${formattedDate})`);
        } else {
          alert(`캘린더 연동 준비 완료: ${formattedDate} [임장] ${prop.complexName}`);
        }
      });

      // Save
      modalRoot.querySelector('#visit-save').addEventListener('click', () => {
        const rawDate = modalRoot.querySelector('#inp-visit-date').value;
        const visitDate = rawDate ? rawDate.replace('T', ' ') : '';
        const checklist = {
          sunlight: modalRoot.querySelector('#chk-sunlight').checked,
          soundproof: modalRoot.querySelector('#chk-sound').checked,
          parking: modalRoot.querySelector('#chk-parking').checked,
          waterPressure: modalRoot.querySelector('#chk-water').checked,
          maintenance: modalRoot.querySelector('#chk-leak').checked
        };
        const notes = modalRoot.querySelector('#inp-visit-notes').value.trim();

        // Update status to visit_scheduled or visited
        let nextStatus = prop.status;
        if (visitDate && prop.status === 'candidate') {
          nextStatus = 'visit_scheduled';
        }

        this.store.updateProperty(prop.id, {
          visitDate,
          checklist,
          notes,
          status: nextStatus
        });

        modalRoot.innerHTML = '';
        this.notifyChange();
        this.refreshList();
      });
    }

    openCostModal(prop) {
      const modalRoot = this.container.querySelector('#re-modals-root');
      if (!modalRoot) return;

      const costs = calculateMovingCosts(prop);

      modalRoot.innerHTML = `
        <div class="re-modal-overlay">
          <div class="re-modal-card">
            <div class="re-modal-header">
              <h3>🧮 이사 부대비용 및 복비 시뮬레이터</h3>
              <button class="re-modal-close" id="cost-close">&times;</button>
            </div>
            <div class="re-modal-body">
              <div class="re-target-box">
                <strong>${this.escapeHtml(prop.complexName)}</strong> (${prop.dealType} ${formatKoreanPrice(prop.price)})
              </div>

              <div class="re-cost-breakdown">
                <div class="re-cost-item">
                  <span class="cost-name">부동산 중개보수 (법정상한)</span>
                  <span class="cost-val highlight">${(costs.brokerageFee || 0).toLocaleString()}원</span>
                </div>
                ${costs.acquisitionTax > 0 ? `
                  <div class="re-cost-item">
                    <span class="cost-name">취득세 및 지방교육세 (매매추정)</span>
                    <span class="cost-val">${costs.acquisitionTax.toLocaleString()}원</span>
                  </div>
                ` : ''}
                <div class="re-cost-item">
                  <span class="cost-name">포장이사 견적 (추정치)</span>
                  <span class="cost-val">${(costs.movingFee || 0).toLocaleString()}원</span>
                </div>
                <div class="re-cost-item">
                  <span class="cost-name">입주 청소비 (평당 13,000원 기준)</span>
                  <span class="cost-val">${(costs.cleaningFee || 0).toLocaleString()}원</span>
                </div>
                <div class="re-cost-divider"></div>
                <div class="re-cost-total">
                  <span>총 예상 부대비용</span>
                  <span class="total-val">${(costs.totalEstimatedCost || 0).toLocaleString()}원</span>
                </div>
              </div>

              <div class="re-cost-actions">
                <button class="re-btn re-btn-sm re-btn-ledger" id="btn-export-ledger">
                  💰 가계부 [이사준비] 지출 예산에 추가
                </button>
              </div>
            </div>
            <div class="re-modal-footer">
              <button class="re-btn re-btn-secondary" id="cost-close-btn">닫기</button>
            </div>
          </div>
        </div>
      `;

      // Close
      modalRoot.querySelector('#cost-close').addEventListener('click', () => modalRoot.innerHTML = '');
      modalRoot.querySelector('#cost-close-btn').addEventListener('click', () => modalRoot.innerHTML = '');

      // Export to Ledger
      modalRoot.querySelector('#btn-export-ledger').addEventListener('click', () => {
        if (this.onExportToLedger) {
          this.onExportToLedger({
            title: `[이사부대비용] ${prop.complexName} 복비/청소비`,
            amount: costs.totalEstimatedCost,
            category: '주거/통신',
            memo: `복비: ${(costs.brokerageFee || 0).toLocaleString()}원, 이사비: ${(costs.movingFee || 0).toLocaleString()}원`,
            payer: 'together'
          });
          alert('가계부에 이사 부대비용이 정상 등록되었습니다!');
        } else {
          alert(`가계부 연계 완료: 총 ${(costs.totalEstimatedCost || 0).toLocaleString()}원`);
        }
      });
    }

    openCommentModal(prop) {
      const modalRoot = this.container.querySelector('#re-modals-root');
      if (!modalRoot) return;

      const comments = Array.isArray(prop.comments) ? prop.comments : [];

      modalRoot.innerHTML = `
        <div class="re-modal-overlay">
          <div class="re-modal-card re-modal-scrollable">
            <div class="re-modal-header">
              <h3>💬 부부 코멘트 스레드</h3>
              <button class="re-modal-close" id="cmt-close">&times;</button>
            </div>
            <div class="re-modal-body">
              <div class="re-target-box">
                <strong>${this.escapeHtml(prop.complexName)}</strong>
              </div>

              <div class="re-comment-list" id="re-comment-list">
                ${comments.length === 0 ? `
                  <div class="re-empty-comments">아직 등록된 의견이 없습니다. 서로의 생각을 남겨보세요!</div>
                ` : comments.map(c => `
                  <div class="re-comment-bubble ${c.author === this.currentUser ? 'mine' : 'partner'}">
                    <div class="cmt-author">${this.escapeHtml(c.author)}</div>
                    <div class="cmt-text">${this.escapeHtml(c.text)}</div>
                    <div class="cmt-time">${(c.createdAt || '').slice(5, 16)}</div>
                  </div>
                `).join('')}
              </div>

              <div class="re-comment-input-bar">
                <input type="text" class="re-input" id="inp-new-comment" placeholder="${this.currentUser}님의 한마디 남기기..." maxlength="200">
                <button class="re-btn re-btn-primary" id="btn-submit-comment">등록</button>
              </div>
            </div>
          </div>
        </div>
      `;

      modalRoot.querySelector('#cmt-close').addEventListener('click', () => modalRoot.innerHTML = '');

      const submitComment = () => {
        const inp = modalRoot.querySelector('#inp-new-comment');
        const text = inp.value.trim();
        if (!text) return;

        this.store.addComment(prop.id, {
          author: this.currentUser,
          text
        });

        inp.value = '';
        this.notifyChange();
        this.openCommentModal(this.store.getProperty(prop.id));
        this.refreshList();
      };

      modalRoot.querySelector('#btn-submit-comment').addEventListener('click', submitComment);
      modalRoot.querySelector('#inp-new-comment').addEventListener('keydown', (e) => {
        if (e.key === 'Enter') submitComment();
      });
    }

    notifyChange() {
      if (this.onDataChange && this.store) {
        this.onDataChange(this.store.getAll());
      }
    }

    escapeHtml(str) {
      if (!str) return '';
      return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
    }

    renderFavoriteSummaryWidget(containerId = 'calendar-fav-property-widget') {
      const widget = document.getElementById(containerId);
      if (!widget) return;

      const myRole = (typeof getMyRole === 'function') ? getMyRole() : 'user2';
      const properties = (this.store && this.store.getAll) ? this.store.getAll() : (window.AppState?.realEstates || []);
      const favProperties = properties.filter(p => {
        if (!p || p.status === 'archived') return false;
        return (p.favorite && (p.favorite[myRole] || p.favorite.together || (p.favorite.user1 && p.favorite.user2)));
      });

      if (favProperties.length === 0) {
        widget.style.display = 'none';
        widget.innerHTML = '';
        return;
      }

      widget.style.display = 'block';

      let leaseCount = 0;
      let leaseDepositSum = 0;
      let saleCount = 0;
      let saleDepositSum = 0;
      let nextVisit = null;

      const now = new Date();
      favProperties.forEach(p => {
        if (p.tradeType === 'lease') {
          leaseCount++;
          leaseDepositSum += (p.priceDeposit || 0);
        } else if (p.tradeType === 'sale') {
          saleCount++;
          saleDepositSum += (p.priceDeposit || 0);
        }

        if (p.visitDate) {
          const vd = new Date(p.visitDate);
          if (vd >= new Date(now.getFullYear(), now.getMonth(), now.getDate())) {
            if (!nextVisit || vd < new Date(nextVisit.date)) {
              const diffTime = vd.getTime() - new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
              const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
              nextVisit = {
                title: p.title,
                date: p.visitDate,
                dDay: diffDays === 0 ? 'D-Day' : `D-${diffDays}`,
                propertyId: p.id
              };
            }
          }
        }
      });

      const avgLeaseStr = leaseCount > 0 ? (typeof formatKoreanPrice === 'function' ? formatKoreanPrice(Math.round(leaseDepositSum / leaseCount)) : (Math.round(leaseDepositSum / leaseCount / 100000000) + '억')) : '0원';
      const avgSaleStr = saleCount > 0 ? (typeof formatKoreanPrice === 'function' ? formatKoreanPrice(Math.round(saleDepositSum / saleCount)) : (Math.round(saleDepositSum / saleCount / 100000000) + '억')) : '0원';

      const miniCardsHtml = favProperties.map(p => {
        const thumbUrl = (p.images && p.images.length > 0) ? p.images[0] : (typeof getAptSvgPlaceholder === 'function' ? getAptSvgPlaceholder(p.title || '매물') : '');
        const sourceBadge = p.source === 'daangn' ? '🥕 당근' : '🟢 네이버';
        const sourceClass = p.source === 'daangn' ? 'source-daangn' : 'source-naver';
        const tradeBadge = p.tradeType === 'sale' ? '매매' : (p.tradeType === 'lease' ? '전세' : '월세');
        const priceStr = p.priceRaw || (typeof formatKoreanPrice === 'function' ? formatKoreanPrice(p.priceDeposit, p.priceMonthly) : `${p.priceDeposit}`);
        const visitBadge = p.visitDate ? (typeof calculateDDay === 'function' ? `<span class="re-mini-dday">${calculateDDay(p.visitDate)}</span>` : `<span class="re-mini-dday">${p.visitDate}</span>`) : '';

        return `
          <div class="re-fav-mini-card" onclick="openFavPropertyDetail('${p.id}')">
            <div class="re-mini-thumb-wrap">
              <img src="${thumbUrl}" alt="${this.escapeHtml(p.title)}" class="re-mini-thumb" onerror="this.src='data:image/svg+xml;utf8,<svg xmlns=\\'http://www.w3.org/2000/svg\\' width=\\'80\\' height=\\'80\\' fill=\\'%23CBD5E1\\'><rect width=\\'100%\\' height=\\'100%\\' fill=\\'%23F1F5F9\\'/><text x=\\'50%\\' y=\\'50%\\' dominant-baseline=\\'middle\\' text-anchor=\\'middle\\' font-size=\\'24\\'>🏠</text></svg>'">
              ${visitBadge}
            </div>
            <div class="re-mini-info">
              <div class="re-mini-tags">
                <span class="re-source-chip ${sourceClass}">${sourceBadge}</span>
                <span class="re-trade-chip">${tradeBadge}</span>
              </div>
              <div class="re-mini-price">${this.escapeHtml(priceStr)}</div>
              <div class="re-mini-title">${this.escapeHtml(p.title)}</div>
            </div>
          </div>
        `;
      }).join('');

      widget.innerHTML = `
        <div class="re-fav-widget-card">
          <div class="re-fav-widget-header">
            <div class="re-fav-widget-title-group">
              <span class="re-fav-widget-icon">💖</span>
              <span class="re-fav-widget-title">내 관심(♥) 매물 요약</span>
              <span class="re-fav-count-badge">${favProperties.length}건</span>
            </div>
            <button type="button" class="re-fav-link-btn" onclick="switchView('realestate')">전체보기 ➔</button>
          </div>

          <div class="re-fav-kpi-grid">
            <div class="re-fav-kpi-item">
              <span class="kpi-label">전세 평균</span>
              <span class="kpi-val">${avgLeaseStr}</span>
            </div>
            <div class="re-fav-kpi-item">
              <span class="kpi-label">매매 평균</span>
              <span class="kpi-val">${avgSaleStr}</span>
            </div>
            <div class="re-fav-kpi-item visit">
              <span class="kpi-label">다가오는 임장</span>
              <span class="kpi-val highlight">${nextVisit ? `${nextVisit.dDay} (${nextVisit.date.slice(5)})` : '일정 미정'}</span>
            </div>
          </div>

          <div class="re-fav-slider-wrap">
            <div class="re-fav-slider">
              ${miniCardsHtml}
            </div>
          </div>
        </div>
      `;
    }
  }

  if (typeof window !== 'undefined') {
    window.renderFavoriteSummaryWidget = function(containerId) {
      if (!window.realEstateViewInstance && typeof renderRealEstateView === 'function') {
        renderRealEstateView();
      }
      if (window.realEstateViewInstance && typeof window.realEstateViewInstance.renderFavoriteSummaryWidget === 'function') {
        window.realEstateViewInstance.renderFavoriteSummaryWidget(containerId);
      }
    };
    window.openFavPropertyDetail = function(propId) {
      if (typeof switchView === 'function') switchView('realestate');
      if (window.realEstateViewInstance && typeof window.realEstateViewInstance.openDetailModal === 'function') {
        window.realEstateViewInstance.openDetailModal(propId);
      }
    };

    window.SEOUL_DISTRICTS = [
      '강남구', '서초구', '송파구', '강동구',
      '마포구', '용산구', '성동구', '광진구',
      '영등포구', '양천구', '강서구', '구로구', '동작구', '관악구', '금천구',
      '종로구', '중구', '서대문구', '은평구', '동대문구', '중랑구', '성북구', '강북구', '도봉구', '노원구'
    ];

    window.DAANGN_SEOUL_LISTINGS = [
      {
            "id": "dg-4508864",
            "articleId": "4508864",
            "district": "마포구",
            "dong": "염리동",
            "propertyType": "apt",
            "propertyTypeKor": "아파트",
            "priceWon": 1900000000,
            "priceDeposit": 1900000000,
            "priceManwon": 190000,
            "priceRaw": "매매 19억원",
            "areaPyeong": 26,
            "areaSquareMeter": 84.96,
            "buildYear": 2001,
            "floorInfo": "중/고층 로얄",
            "title": "[당근실매물] 염리동 26평 아파트 매매 19억원",
            "address": "서울특별시 마포구 염리동",
            "rawUrl": "https://realty.daangn.com/articles/4508864",
            "imageUrl": "https://img.kr.gcp-karroter.net/realty/article/4508864/01M72E0X1QW984B39P8Q8EYK3B.png?q=95&s=1440x1440&t=inside&service=realty",
            "commute": "🏢 LG유플러스 18분 (3.4km)",
            "changeStatus": "🥕 당근실매물",
            "history": [
                  "2026-11-11: 매매 19억원 (당근부동산 실시간)"
            ],
            "memo": "규모: 총 574세대 / 총 9개 동 / 최고 17층 준공년도: 2001년 3월 준공 (삼성물산 시공) 주차대수: 총"
      },
      {
            "id": "dg-4508946",
            "articleId": "4508946",
            "district": "마포구",
            "dong": "염리동",
            "propertyType": "apt",
            "propertyTypeKor": "아파트",
            "priceWon": 1680000000,
            "priceDeposit": 1680000000,
            "priceManwon": 168000,
            "priceRaw": "매매 16억 8,000만원",
            "areaPyeong": 18,
            "areaSquareMeter": 59.76,
            "buildYear": 2001,
            "floorInfo": "중/고층 로얄",
            "title": "[당근실매물] 염리동 18평 아파트 매매 16억 8,000만원",
            "address": "서울특별시 마포구 염리동",
            "rawUrl": "https://realty.daangn.com/articles/4508946",
            "imageUrl": "https://img.kr.gcp-karroter.net/realty/article/4508946/01M488FV6JTY0PKEJ9P27V51YX.png?q=95&s=1440x1440&t=inside&service=realty",
            "commute": "🏢 LG유플러스 18분 (3.4km)",
            "changeStatus": "🥕 당근실매물",
            "history": [
                  "2026-11-11: 매매 16억 8,000만원 (당근부동산 실시간)"
            ],
            "memo": "규모: 총 574세대 / 총 9개 동 / 최고 17층 준공년도: 2001년 3월 준공 (삼성물산 시공) 주차대수: 총"
      },
      {
            "id": "dg-4756337",
            "articleId": "4756337",
            "district": "용산구",
            "dong": "이촌동",
            "propertyType": "apt",
            "propertyTypeKor": "아파트",
            "priceWon": 2310000000,
            "priceDeposit": 2310000000,
            "priceManwon": 231000,
            "priceRaw": "매매 23억 1,000만원",
            "areaPyeong": 18,
            "areaSquareMeter": 59.88,
            "buildYear": 2022,
            "floorInfo": "중/고층 로얄",
            "title": "[당근실매물] 이촌동 18평 직거래 아파트 매매 23억 1,000만원",
            "address": "서울특별시 용산구 이촌동",
            "rawUrl": "https://realty.daangn.com/articles/4756337",
            "imageUrl": "https://img.kr.gcp-karroter.net/realty/article/4756337/01M6JH6ZTMD356HPN57A6DWHW1.png?q=95&s=1440x1440&t=inside&service=realty",
            "commute": "🏢 LG유플러스 8분 (1.2km)",
            "changeStatus": "🥕 당근실매물",
            "history": [
                  "2026-11-11: 매매 23억 1,000만원 (당근부동산 실시간)"
            ],
            "memo": "집주인 대출 1억 (매도인 근저당) 가능합니다 . 207동 남향 로얄동이고 이촌역 도보 3분 이촌 한강 고수부지 도보"
      },
      {
            "id": "dg-3527915",
            "articleId": "3527915",
            "district": "용산구",
            "dong": "한남동",
            "propertyType": "apt",
            "propertyTypeKor": "아파트",
            "priceWon": 18800000000,
            "priceDeposit": 18800000000,
            "priceManwon": 1880000,
            "priceRaw": "매매 188억원",
            "areaPyeong": 83,
            "areaSquareMeter": 273.74,
            "buildYear": 2018,
            "floorInfo": "중/고층 로얄",
            "title": "[당근실매물] 한남동 83평 아파트 매매 188억원",
            "address": "서울특별시 용산구 한남동",
            "rawUrl": "https://realty.daangn.com/articles/3527915",
            "imageUrl": "https://img.kr.gcp-karroter.net/realty/article/3527915/01KRBZ68YXP6K9KY9SF3SGFF1V.png?q=95&s=1440x1440&t=inside&service=realty",
            "commute": "🏢 LG유플러스 8분 (1.2km)",
            "changeStatus": "🥕 당근실매물",
            "history": [
                  "2026-11-11: 매매 188억원 (당근부동산 실시간)"
            ],
            "memo": "사전예약시에만 방문가능합니다. 한강뷰 전원세대 신축 첫입주 입니다."
      },
      {
            "id": "dg-4684653",
            "articleId": "4684653",
            "district": "성동구",
            "dong": "행당동",
            "propertyType": "apt",
            "propertyTypeKor": "아파트",
            "priceWon": 2900000000,
            "priceDeposit": 2900000000,
            "priceManwon": 290000,
            "priceRaw": "매매 29억원",
            "areaPyeong": 35,
            "areaSquareMeter": 114.55,
            "buildYear": 2002,
            "floorInfo": "중/고층 로얄",
            "title": "[당근실매물] 행당동 35평 아파트 매매 29억원",
            "address": "서울특별시 성동구 행당동",
            "rawUrl": "https://realty.daangn.com/articles/4684653",
            "imageUrl": "https://img.kr.gcp-karroter.net/realty/article/4684653/01M5K4FE59DFVTZRNYK0NAJYRJ.png?q=95&s=1440x1440&t=inside&service=realty",
            "commute": "🏢 LG유플러스 24분 (5.1km)",
            "changeStatus": "🥕 당근실매물",
            "history": [
                  "2026-11-11: 매매 29억원 (당근부동산 실시간)"
            ],
            "memo": "관심 가져주시고 클릭해 주셔서 감사합니다! 정직과 안전을 최우선으로 하는 부동산중개청량입니다. 저희는 당장의 이익보다"
      },
      {
            "id": "dg-2857192",
            "articleId": "2857192",
            "district": "성동구",
            "dong": "하왕십리동",
            "propertyType": "apt",
            "propertyTypeKor": "아파트",
            "priceWon": 2500000000,
            "priceDeposit": 2500000000,
            "priceManwon": 250000,
            "priceRaw": "매매 25억원",
            "areaPyeong": 39,
            "areaSquareMeter": 129.34,
            "buildYear": 2014,
            "floorInfo": "중/고층 로얄",
            "title": "[당근실매물] 하왕십리동 39평 아파트 매매 25억원",
            "address": "서울특별시 성동구 하왕십리동",
            "rawUrl": "https://realty.daangn.com/articles/2857192",
            "imageUrl": "https://img.kr.gcp-karroter.net/realty/article/2857192/01M1K7B3W1RJ8D6NEHZBDFJJNV.png?q=95&s=1440x1440&t=inside&service=realty",
            "commute": "🏢 LG유플러스 24분 (5.1km)",
            "changeStatus": "🥕 당근실매물",
            "history": [
                  "2026-11-11: 매매 25억원 (당근부동산 실시간)"
            ],
            "memo": "클릭해 주셔서 감사합니다. 365일 24시간 연락 주세요. * 당근 문의보다 하단에 있는 문자, 전화로 연락 주시면 "
      },
      {
            "id": "dg-4984782",
            "articleId": "4984782",
            "district": "강남구",
            "dong": "개포동",
            "propertyType": "apt",
            "propertyTypeKor": "아파트",
            "priceWon": 5000000000,
            "priceDeposit": 5000000000,
            "priceManwon": 500000,
            "priceRaw": "매매 50억원",
            "areaPyeong": 38,
            "areaSquareMeter": 126.92,
            "buildYear": 2002,
            "floorInfo": "중/고층 로얄",
            "title": "[당근실매물] 개포동 38평 아파트 매매 50억원",
            "address": "서울특별시 강남구 개포동",
            "rawUrl": "https://realty.daangn.com/articles/4984782",
            "imageUrl": "https://img.kr.gcp-karroter.net/realty/article/4984782/01M729AHF0PBXY0P8BHH038PVS.png?q=95&s=1440x1440&t=inside&service=realty",
            "commute": "🏢 LG유플러스 28분 (6.8km)",
            "changeStatus": "🥕 당근실매물",
            "history": [
                  "2026-11-11: 매매 50억원 (당근부동산 실시간)"
            ],
            "memo": "[ 가치를 연결하는 파트너 &quot;하이엔드부동산중개&quot; ] ━━━━━━━━━━━━━━━━━━━━━━━━━ "
      },
      {
            "id": "dg-4983668",
            "articleId": "4983668",
            "district": "강남구",
            "dong": "개포동",
            "propertyType": "apt",
            "propertyTypeKor": "아파트",
            "priceWon": 2680000000,
            "priceDeposit": 2680000000,
            "priceManwon": 268000,
            "priceRaw": "매매 26억 8,000만원",
            "areaPyeong": 18,
            "areaSquareMeter": 59.92,
            "buildYear": 2018,
            "floorInfo": "중/고층 로얄",
            "title": "[당근실매물] 개포동 18평 아파트 매매 26억 8,000만원",
            "address": "서울특별시 강남구 개포동",
            "rawUrl": "https://realty.daangn.com/articles/4983668",
            "imageUrl": "https://img.kr.gcp-karroter.net/realty/article/4983668/01M726W3C12TSNS4T3WW39QEE6.png?q=95&s=1440x1440&t=inside&service=realty",
            "commute": "🏢 LG유플러스 28분 (6.8km)",
            "changeStatus": "🥕 당근실매물",
            "history": [
                  "2026-11-11: 매매 26억 8,000만원 (당근부동산 실시간)"
            ],
            "memo": "급매 구룡초 학군 편안한 정원뷰 숲세권 대중교통 이용편리"
      },
      {
            "id": "dg-4685845",
            "articleId": "4685845",
            "district": "서초구",
            "dong": "서초동",
            "propertyType": "apt",
            "propertyTypeKor": "아파트",
            "priceWon": 1400000000,
            "priceDeposit": 1400000000,
            "priceManwon": 140000,
            "priceRaw": "매매 14억원",
            "areaPyeong": 26,
            "areaSquareMeter": 84.97,
            "buildYear": 2022,
            "floorInfo": "중/고층 로얄",
            "title": "[당근실매물] 서초동 26평 아파트 매매 14억원",
            "address": "서울특별시 서초구 서초동",
            "rawUrl": "https://realty.daangn.com/articles/4685845",
            "imageUrl": "https://img.kr.gcp-karroter.net/realty/article/4685845/01M4JCZA3RDWT2258BTGWQ7F39.png?q=95&s=1440x1440&t=inside&service=realty",
            "commute": "🏢 LG유플러스 25분 (5.9km)",
            "changeStatus": "🥕 당근실매물",
            "history": [
                  "2026-11-11: 매매 14억원 (당근부동산 실시간)"
            ],
            "memo": "토지거래허가 미해당 지역으로 실거주 의무 없이 즉시 임대 (갭투자) 가능합니다. 전,월세 임대차 수요 많은 부동산입니"
      },
      {
            "id": "dg-4686072",
            "articleId": "4686072",
            "district": "서초구",
            "dong": "서초동",
            "propertyType": "apt",
            "propertyTypeKor": "아파트",
            "priceWon": 850000000,
            "priceDeposit": 850000000,
            "priceManwon": 85000,
            "priceRaw": "매매 8억 5,000만원",
            "areaPyeong": 17,
            "areaSquareMeter": 54.7,
            "buildYear": 2018,
            "floorInfo": "중/고층 로얄",
            "title": "[당근실매물] 서초동 17평 아파트 매매 8억 5,000만원",
            "address": "서울특별시 서초구 서초동",
            "rawUrl": "https://realty.daangn.com/articles/4686072",
            "imageUrl": "https://img.kr.gcp-karroter.net/realty/article/4686072/01M4J3P438K213F63FWTNNKH3W.png?q=95&s=1440x1440&t=inside&service=realty",
            "commute": "🏢 LG유플러스 25분 (5.9km)",
            "changeStatus": "🥕 당근실매물",
            "history": [
                  "2026-11-11: 매매 8억 5,000만원 (당근부동산 실시간)"
            ],
            "memo": "남부터미널역 도보 약 1~2분으로 역세권입니다. 신혼부부 또는 1인 실거주하기에 좋으며, 임대 수요 또한 많은 위치입"
      },
      {
            "id": "dg-4952679",
            "articleId": "4952679",
            "district": "송파구",
            "dong": "가락동",
            "propertyType": "apt",
            "propertyTypeKor": "아파트",
            "priceWon": 2490000000,
            "priceDeposit": 2490000000,
            "priceManwon": 249000,
            "priceRaw": "매매 24억 9,000만원",
            "areaPyeong": 26,
            "areaSquareMeter": 84.88,
            "buildYear": 2002,
            "floorInfo": "중/고층 로얄",
            "title": "[당근실매물] 가락동 26평 직거래 아파트 매매 24억 9,000만원",
            "address": "서울특별시 송파구 가락동",
            "rawUrl": "https://realty.daangn.com/articles/4952679",
            "imageUrl": "https://img.kr.gcp-karroter.net/realty/article/4952679/01M72NEC8A2FB31NTWTKK6YPZ0.png?q=95&s=1440x1440&t=inside&service=realty",
            "commute": "🏢 LG유플러스 35분 (9.5km)",
            "changeStatus": "🥕 당근실매물",
            "history": [
                  "2026-11-11: 매매 24억 9,000만원 (당근부동산 실시간)"
            ],
            "memo": "* 앞 : 남한산성, 뒤 : 롯데타워 멋진 전망 (매일 뷰보며 행복해요!!) * 거실, 주방 및 작은 방 확장, 바닥"
      },
      {
            "id": "dg-4986718",
            "articleId": "4986718",
            "district": "송파구",
            "dong": "송파동",
            "propertyType": "apt",
            "propertyTypeKor": "아파트",
            "priceWon": 800000000,
            "priceDeposit": 800000000,
            "priceManwon": 80000,
            "priceRaw": "매매 8억원",
            "areaPyeong": 16,
            "areaSquareMeter": 53.0,
            "buildYear": 2022,
            "floorInfo": "중/고층 로얄",
            "title": "[당근실매물] 송파동 16평 직거래 아파트 매매 8억원",
            "address": "서울특별시 송파구 송파동",
            "rawUrl": "https://realty.daangn.com/articles/4986718",
            "imageUrl": "https://img.kr.gcp-karroter.net/realty/article/4986718/01M72J4E04DBVKJQ6884WFNCAX.png?q=95&s=1440x1440&t=inside&service=realty",
            "commute": "🏢 LG유플러스 35분 (9.5km)",
            "changeStatus": "🥕 당근실매물",
            "history": [
                  "2026-11-11: 매매 8억원 (당근부동산 실시간)"
            ],
            "memo": "[송리단길 메인길] 석촌호수 인근 호수A 저층 매매 (63㎡, 롯데월드뷰) 송파동 38번지, 석촌호수 인근 송리단길 "
      },
      {
            "id": "dg-4758830",
            "articleId": "4758830",
            "district": "영등포구",
            "dong": "당산동1가",
            "propertyType": "apt",
            "propertyTypeKor": "아파트",
            "priceWon": 1900000000,
            "priceDeposit": 1900000000,
            "priceManwon": 190000,
            "priceRaw": "매매 19억원",
            "areaPyeong": 49,
            "areaSquareMeter": 161.9,
            "buildYear": 2002,
            "floorInfo": "중/고층 로얄",
            "title": "[당근실매물] 당산동1가 49평 직거래 아파트 매매 19억원",
            "address": "서울특별시 영등포구 당산동1가",
            "rawUrl": "https://realty.daangn.com/articles/4758830",
            "imageUrl": "https://img.kr.gcp-karroter.net/realty/article/4758830/01M572F0CH04TM4W5VKDDF74YG.png?q=95&s=1440x1440&t=inside&service=realty",
            "commute": "🏢 LG유플러스 19분 (4.2km)",
            "changeStatus": "🥕 당근실매물",
            "history": [
                  "2026-11-11: 매매 19억원 (당근부동산 실시간)"
            ],
            "memo": "1. 사통팔달 최고의 위치 (여의도·영등포·목동 생활권) 여의도, 영등포, 목동 주요 지역으로 이동이 매우 편리하여 "
      },
      {
            "id": "dg-4880189",
            "articleId": "4880189",
            "district": "영등포구",
            "dong": "영등포동1가",
            "propertyType": "apt",
            "propertyTypeKor": "아파트",
            "priceWon": 107000000,
            "priceDeposit": 107000000,
            "priceManwon": 10700,
            "priceRaw": "매매 1억 700만원",
            "areaPyeong": 5,
            "areaSquareMeter": 14.89,
            "buildYear": 2018,
            "floorInfo": "중/고층 로얄",
            "title": "[당근실매물] 영등포동1가 5평 직거래 아파트 매매 1억 700만원",
            "address": "서울특별시 영등포구 영등포동1가",
            "rawUrl": "https://realty.daangn.com/articles/4880189",
            "imageUrl": "https://img.kr.gcp-karroter.net/realty/article/4880189/01M72FQR5EZHZFMWRGTXE5V3XF.png?q=95&s=1440x1440&t=inside&service=realty",
            "commute": "🏢 LG유플러스 19분 (4.2km)",
            "changeStatus": "🥕 당근실매물",
            "history": [
                  "2026-11-11: 매매 1억 700만원 (당근부동산 실시간)"
            ],
            "memo": "사진은 실사진. 베란다확장으로 실평수 훨씬넓습니다. 탁트인 뻥뷰. 옆건물들과 시공년도가 거의 동일하며 영구적 뻥뷰. "
      },
      {
            "id": "dg-4803523",
            "articleId": "4803523",
            "district": "강동구",
            "dong": "성내동",
            "propertyType": "apt",
            "propertyTypeKor": "아파트",
            "priceWon": 1000000000,
            "priceDeposit": 1000000000,
            "priceManwon": 100000,
            "priceRaw": "매매 10억원",
            "areaPyeong": 26,
            "areaSquareMeter": 84.61,
            "buildYear": 2022,
            "floorInfo": "중/고층 로얄",
            "title": "[당근실매물] 성내동 26평 아파트 매매 10억원",
            "address": "서울특별시 강동구 성내동",
            "rawUrl": "https://realty.daangn.com/articles/4803523",
            "imageUrl": "https://img.kr.gcp-karroter.net/realty/article/4803523/01M5HBDF7F6EB25YP7CNQVPZTY.png?q=95&s=1440x1440&t=inside&service=realty",
            "commute": "🏢 LG유플러스 42분 (12.8km)",
            "changeStatus": "🥕 당근실매물",
            "history": [
                  "2026-11-11: 매매 10억원 (당근부동산 실시간)"
            ],
            "memo": "성내동 대성유니드 매매 10억원 천호역 도보 5분! 전용 84타입 내 집 마련 기회! 매매가 10억원 전용 84㎡ ·"
      },
      {
            "id": "dg-4802265",
            "articleId": "4802265",
            "district": "강동구",
            "dong": "상일동",
            "propertyType": "apt",
            "propertyTypeKor": "아파트",
            "priceWon": 1980000000,
            "priceDeposit": 1980000000,
            "priceManwon": 198000,
            "priceRaw": "매매 19억 8,000만원",
            "areaPyeong": 26,
            "areaSquareMeter": 84.92,
            "buildYear": 2018,
            "floorInfo": "중/고층 로얄",
            "title": "[당근실매물] 상일동 26평 아파트 매매 19억 8,000만원",
            "address": "서울특별시 강동구 상일동",
            "rawUrl": "https://realty.daangn.com/articles/4802265",
            "imageUrl": "https://img.kr.gcp-karroter.net/realty/article/4802265/01M5H7YT2YDGWCF4SK3B4459YW.png?q=95&s=1440x1440&t=inside&service=realty",
            "commute": "🏢 LG유플러스 42분 (12.8km)",
            "changeStatus": "🥕 당근실매물",
            "history": [
                  "2026-11-11: 매매 19억 8,000만원 (당근부동산 실시간)"
            ],
            "memo": "♧정원 뷰, 상일동산 뷰, 버스 도보5분 ♧1층 장점: 지하주차장, 커뮤니티, 분리수거 등 유리 ♧생활인프라 다수 ♧"
      },
      {
            "id": "dg-4987908",
            "articleId": "4987908",
            "district": "동작구",
            "dong": "사당동",
            "propertyType": "apt",
            "propertyTypeKor": "아파트",
            "priceWon": 1450000000,
            "priceDeposit": 1450000000,
            "priceManwon": 145000,
            "priceRaw": "매매 14억 5,000만원",
            "areaPyeong": 14,
            "areaSquareMeter": 46.75,
            "buildYear": 2002,
            "floorInfo": "중/고층 로얄",
            "title": "[당근실매물] 사당동 14평 아파트 매매 14억 5,000만원",
            "address": "서울특별시 동작구 사당동",
            "rawUrl": "https://realty.daangn.com/articles/4987908",
            "imageUrl": "https://img.kr.gcp-karroter.net/realty/article/4987908/01M735ZBSN3E0TYXG30W1PP2Y8.png?q=95&s=1440x1440&t=inside&service=realty",
            "commute": "🏢 LG유플러스 15분 (2.8km)",
            "changeStatus": "🥕 당근실매물",
            "history": [
                  "2026-11-11: 매매 14억 5,000만원 (당근부동산 실시간)"
            ],
            "memo": "서울특별시 동작구 사당동 · 아파트 · 매매 14억 5,000만원 · 전용면적 46.75㎡"
      },
      {
            "id": "dg-4987371",
            "articleId": "4987371",
            "district": "동작구",
            "dong": "본동",
            "propertyType": "apt",
            "propertyTypeKor": "아파트",
            "priceWon": 1300000000,
            "priceDeposit": 1300000000,
            "priceManwon": 130000,
            "priceRaw": "매매 13억원",
            "areaPyeong": 14,
            "areaSquareMeter": 46.75,
            "buildYear": 2022,
            "floorInfo": "중/고층 로얄",
            "title": "[당근실매물] 본동 14평 직거래 아파트 매매 13억원",
            "address": "서울특별시 동작구 본동",
            "rawUrl": "https://realty.daangn.com/articles/4987371",
            "imageUrl": "https://img.kr.gcp-karroter.net/realty/article/4987371/01M72TCHABYTG6X2GEDZA4Q7TH.png?q=95&s=1440x1440&t=inside&service=realty",
            "commute": "🏢 LG유플러스 15분 (2.8km)",
            "changeStatus": "🥕 당근실매물",
            "history": [
                  "2026-11-11: 매매 13억원 (당근부동산 실시간)"
            ],
            "memo": "1년 전 올수리 완료 * 거실, 베란다, 방 포함 집 전체 kcc 샷시 * lx 무광 보드 싱크대, 인덕션 * lx "
      },
      {
            "id": "dg-4752164",
            "articleId": "4752164",
            "district": "광진구",
            "dong": "자양동",
            "propertyType": "apt",
            "propertyTypeKor": "아파트",
            "priceWon": 1400000000,
            "priceDeposit": 1400000000,
            "priceManwon": 140000,
            "priceRaw": "매매 14억원",
            "areaPyeong": 18,
            "areaSquareMeter": 59.96,
            "buildYear": 2002,
            "floorInfo": "중/고층 로얄",
            "title": "[당근실매물] 자양동 18평 아파트 매매 14억원",
            "address": "서울특별시 광진구 자양동",
            "rawUrl": "https://realty.daangn.com/articles/4752164",
            "imageUrl": "https://img.kr.gcp-karroter.net/realty/article/4752164/01M53ZWCFZG9HV97XM7JRD94QE.png?q=95&s=1440x1440&t=inside&service=realty",
            "commute": "🏢 LG유플러스 30분 (7.5km)",
            "changeStatus": "🥕 당근실매물",
            "history": [
                  "2026-11-11: 매매 14억원 (당근부동산 실시간)"
            ],
            "memo": "한강변 수리 잘되어있는 25평형 동향 바로앞 자양한강도서관, 자양한강공원 주차공간 좋아요"
      },
      {
            "id": "dg-4075838",
            "articleId": "4075838",
            "district": "광진구",
            "dong": "자양동",
            "propertyType": "apt",
            "propertyTypeKor": "아파트",
            "priceWon": 2000000000,
            "priceDeposit": 2000000000,
            "priceManwon": 200000,
            "priceRaw": "매매 20억원",
            "areaPyeong": 24,
            "areaSquareMeter": 78.8,
            "buildYear": 2018,
            "floorInfo": "중/고층 로얄",
            "title": "[당근실매물] 자양동 24평 아파트 매매 20억원",
            "address": "서울특별시 광진구 자양동",
            "rawUrl": "https://realty.daangn.com/articles/4075838",
            "imageUrl": "https://img.kr.gcp-karroter.net/realty/article/4075838/01KY6XP3YRE82H1ZVWVD1HHYJT.png?q=95&s=1440x1440&t=inside&service=realty",
            "commute": "🏢 LG유플러스 30분 (7.5km)",
            "changeStatus": "🥕 당근실매물",
            "history": [
                  "2026-11-11: 매매 20억원 (당근부동산 실시간)"
            ],
            "memo": "매매가 20억원 남향 특한강조망 자양역 역세권 입주협의"
      }
];

window.daangnFilterState = window.daangnFilterState || {
      districts: ['all'],  // 다중 선택 지원: ['all'] 또는 ['마포구', '용산구', ...]
      minPriceWon: 100000000,
      maxPriceWon: 5000000000,
      minAge: 0,
      maxAge: 35,
      minPyeong: 5,
      maxPyeong: 70,
      types: { apt: true, house: true, villa: true }
    };

window.renderDaangnCrawlerView = function(containerId) {
      const root = document.getElementById(containerId);
      if (!root) return;

      const st = window.daangnFilterState;
      const currentYear = new Date().getFullYear();

      const filtered = window.DAANGN_SEOUL_LISTINGS.filter(item => {
        // 자치구 필터 (다중 선택 지원)
        const selectedDistricts = Array.isArray(st.districts) ? st.districts : [st.district || 'all'];
        const districtMatch = selectedDistricts.includes('all') || selectedDistricts.includes(item.district);
        if (!districtMatch) return false;

        // 형태 필터
        if (!st.types[item.propertyType]) return false;
        // 가격 범위 필터 (만원 단위)
        const priceManwon = item.priceManwon;
        const minPriceManwon = st.minPriceWon / 10000;
        const maxPriceManwon = st.maxPriceWon / 10000;
        if (priceManwon < minPriceManwon || priceManwon > maxPriceManwon) return false;

        // 건물 연식 필터 (최소/최대 연식)
        const age = currentYear - item.buildYear;
        if (age < (st.minAge || 0) || age > st.maxAge) return false;

        // 평수 범위 필터
        const py = item.areaPyeong;
        if (py < st.minPyeong || py > st.maxPyeong) return false;

        return true;
      });

      // 서울 10대 핵심 구 + 전체 (칩 UI용)
      const TOP_10_DISTRICTS = ['전체', '마포구', '용산구', '성동구', '강남구', '서초구', '송파구', '영등포구', '강동구', '동작구', '광진구'];
      const selectedDistricts = Array.isArray(st.districts) ? st.districts : [st.district || 'all'];
      const isAllSelected = selectedDistricts.includes('all') || selectedDistricts.length === 0;

      const districtChipsHtml = TOP_10_DISTRICTS.map(d => {
        const isSelected = isAllSelected ? (d === '전체') : selectedDistricts.includes(d);
        const count = window.DAANGN_SEOUL_LISTINGS.filter(item => item.district === d).length;
        const activeCls = isSelected ? 'active' : '';
        const bg = isSelected ? '#EA580C' : '#F1F5F9';
        const color = isSelected ? '#FFF' : '#475569';
        const border = isSelected ? '#C2410C' : '#CBD5E1';
        return `<button type="button" class="dg-district-chip ${activeCls}" data-district="${d}" style="background:${bg}; color:${color}; border:1px solid ${border}; border-radius:16px; padding:6px 12px; font-size:12.5px; font-weight:${isSelected ? '700' : '600'}; cursor:pointer; transition:all 0.15s ease; white-space:nowrap;" onclick="toggleDaangnDistrict('${d}')">${d} <span style="font-size:11px; font-weight:600; opacity:0.8;">(${count})</span></button>`;
      }).join('');

      // 실시간 배지 텍스트
      const minPriceEok = Math.round(st.minPriceWon / 100000000);
      const maxPriceEok = Math.round(st.maxPriceWon / 100000000);
      const yearAfter = currentYear - st.maxAge;

      const cardsHtml = filtered.map(item => {
        const isAlreadySaved = (window.AppState?.realEstates || []).some(p => p.id === item.id || p.title === item.title);
        const thumbSvg = (typeof RealEstateEngine !== 'undefined' && RealEstateEngine.getAptSvgPlaceholder)
          ? RealEstateEngine.getAptSvgPlaceholder(item.district + ' ' + item.propertyTypeKor)
          : '';
        const displayThumb = item.imageUrl || thumbSvg;
        const buildingAge = currentYear - item.buildYear;

        return `
          <div class="re-daangn-card" style="background:#FFF; border:1px solid #E2E8F0; border-radius:14px; overflow:hidden; box-shadow:0 2px 8px rgba(0,0,0,0.04); display:flex; flex-direction:column; transition:transform 0.15s ease;">
            <!-- 썸네일 박스: 표준 <a> 태그로 팝업 차단 없이 당근 매물 직결 (앱 유니버설 링크 지원) -->
            <a href="${item.rawUrl}" target="_blank" rel="noopener noreferrer" class="re-daangn-thumb-link" style="text-decoration:none; display:block; position:relative; width:100%; height:190px; background:#0F172A; cursor:pointer; overflow:hidden;">
              <img src="${displayThumb}" alt="${item.title}" class="re-daangn-thumb-img" style="width:100%; height:100%; object-fit:cover; display:block;" onerror="this.onerror=null; this.src='${thumbSvg}';">
              <span class="re-daangn-source-tag daangn" style="position:absolute; top:10px; left:10px; background:rgba(234, 88, 12, 0.95); color:#FFF; font-size:11.5px; font-weight:700; padding:3px 9px; border-radius:6px; backdrop-filter:blur(4px); box-shadow:0 2px 4px rgba(0,0,0,0.2);">
                🥕 당근실매물 · ${item.buildYear}년 (${buildingAge}년차)
              </span>
              <span style="position:absolute; bottom:10px; right:10px; background:rgba(15, 23, 42, 0.85); color:#FFF; font-size:11px; padding:3px 8px; border-radius:6px; font-weight:600;">
                당근앱/웹 직결 ↗
              </span>
            </a>

            <div class="re-daangn-card-body" style="padding:14px 16px; flex:1; display:flex; flex-direction:column;">
              <div class="re-daangn-top-row" style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
                <span class="re-daangn-region" style="font-size:12.5px; color:#64748B;">${item.district} ${item.dong} · <b style="color:#334155;">${item.propertyTypeKor}</b></span>
                <span style="font-size:11px; font-weight:700; padding:2px 8px; border-radius:8px; background:#FFF7ED; color:#EA580C; border:1px solid #FFEDD5;">${item.changeStatus}</span>
              </div>

              <!-- 가격 & 제목: 표준 <a> 태그로 클릭 시 해당 매물 고유 상세 페이지로 직결 -->
              <a href="${item.rawUrl}" target="_blank" rel="noopener noreferrer" class="re-daangn-price-title" style="text-decoration:none; display:block; cursor:pointer; margin-bottom:4px;">
                <span class="re-daangn-deal-type" style="background:#EA580C; color:#FFF; font-size:11.5px; font-weight:800; padding:2px 6px; border-radius:4px; margin-right:4px;">매매</span>
                <span class="re-daangn-price-bold" style="font-size:19px; font-weight:800; color:#0F172A;">${item.priceRaw}</span>
              </a>
              
              <a href="${item.rawUrl}" target="_blank" rel="noopener noreferrer" class="re-daangn-Complex-name" style="text-decoration:none; display:block; font-weight:700; font-size:13.5px; color:#1E293B; margin-bottom:6px; cursor:pointer; line-height:1.4;">
                ${item.title}
              </a>

              <div class="re-daangn-specs-line" style="font-size:12px; color:#475569; margin-bottom:8px; line-height:1.4;">
                <b>${item.areaPyeong}평</b> (${item.areaSquareMeter}㎡) · <b>${item.buildYear}년 준공</b> · ${item.floorInfo} · ${item.commute}
              </div>

              <div class="re-daangn-memo-box" style="margin-top:auto; padding:8px 10px; background:#F8FAFC; border-radius:8px; font-size:11.5px; color:#334155; line-height:1.4;">
                <div style="color:#64748B; margin-bottom:2px;"><b>형상이력:</b> ${item.history.join(' ➔ ')}</div>
                <div style="color:#0284C7; font-weight:600;">💡 ${item.memo}</div>
              </div>
            </div>

            <div class="re-daangn-card-footer" style="padding:10px 16px; background:#FAFAFA; border-top:1px solid #F1F5F9; display:flex; justify-content:space-between; align-items:center; gap:8px;">
              <a href="${item.rawUrl}" target="_blank" rel="noopener noreferrer" class="re-footer-btn" style="text-decoration:none; display:inline-block; background:#FFF; border:1px solid #CBD5E1; border-radius:8px; padding:6px 12px; font-size:12px; font-weight:700; color:#334155; cursor:pointer; text-align:center;">
                🥕 당근 원문 ↗
              </a>
              <button type="button" class="re-footer-btn primary" style="flex:1; background:${isAlreadySaved ? '#64748B' : '#F43F5E'}; color:#FFF; border:none; padding:7px 12px; border-radius:8px; font-size:12px; font-weight:700; cursor:pointer; text-align:center;" onclick="syncDaangnItemToCalendar('${item.id}')">
                ${isAlreadySaved ? '✓ 캘린더 연동됨' : '💖 관심등록 & 캘린더 자동연동'}
              </button>
            </div>
          </div>
        `;
      }).join('');

      root.innerHTML = `
        <div class="re-daangn-container" style="max-width:1280px; width:100%; margin:0 auto; padding:0 12px;">
          <!-- 1. 상단 타이틀 & 5대 복합 조건 필터 박스 -->
          <div style="background:linear-gradient(135deg, #FFF7ED 0%, #FFF1F2 100%); border:1.5px solid #FED7AA; border-radius:16px; padding:18px; margin-bottom:20px; box-shadow:0 2px 10px rgba(234,88,12,0.06);">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:14px; flex-wrap:wrap; gap:8px;">
              <div>
                <span style="font-size:17px; font-weight:800; color:#9A3412;">🥕 당근부동산 서울 매매 실거래 수집기</span>
                <div style="font-size:12px; color:#C2410C; margin-top:3px;">서울 25개구 · 매매 전용 · 연식 & 평수 다차원 교차 필터링 완비</div>
              </div>
              <div style="font-size:12px; color:#7C2D12; background:#FFEDD5; padding:4px 10px; border-radius:12px; font-weight:700;">
                총 <b style="color:#EA580C;">${filtered.length}</b>건 검색됨
              </div>
            </div>

            <!-- v3.4.0: Dual-Thumb Single-Track Range Sliders -->
            <div class="filter-grid" style="display:grid; grid-template-columns:repeat(auto-fit, minmax(280px, 1fr)); gap:16px; margin-bottom:12px;">
              <!-- 1) 서울 세부 지역 (다중 선택 칩 UI) -->
              <div class="filter-item filter-item--full">
                <label style="font-size:11.5px; font-weight:700; color:#7C2D12; display:block; margin-bottom:8px;">📍 서울 세부 지역 (다중 선택 가능)</label>
                <div style="display:flex; flex-wrap:wrap; gap:6px;">
                  ${districtChipsHtml}
                </div>
              </div>

              <!-- 2) 매매가 구간 (Dual-Thumb Slider: 1~50억) -->
              <div class="filter-item filter-item--full">
                <div class="filter-label">
                  <span>💰 매매가 구간</span>
                  <span id="dg-badge-price" class="dg-badge dg-badge--price">${minPriceEok}억 ~ ${maxPriceEok}억</span>
                </div>
                <div class="filter-slider-wrapper">
                  <div class="dual-slider dual-slider--price" id="dg-slider-price" data-min="1" data-max="50" data-step="1" data-unit="억">
                    <div class="dual-slider__track"></div>
                    <div class="dual-slider__range" id="dg-slider-price-range"></div>
                    <div class="dual-slider__thumb dual-slider__thumb--min" id="dg-slider-price-min" role="slider" aria-label="최소 매매가" aria-valuemin="1" aria-valuemax="50" aria-valuenow="${minPriceEok}" tabindex="0">
                      <span class="dual-slider__tooltip" id="dg-slider-price-min-tooltip">${minPriceEok}억</span>
                    </div>
                    <div class="dual-slider__thumb dual-slider__thumb--max" id="dg-slider-price-max" role="slider" aria-label="최대 매매가" aria-valuemin="1" aria-valuemax="50" aria-valuenow="${maxPriceEok}" tabindex="0">
                      <span class="dual-slider__tooltip" id="dg-slider-price-max-tooltip">${maxPriceEok}억</span>
                    </div>
                  </div>
                  <div class="dual-slider__labels">
                    <span>1억</span>
                    <span>50억</span>
                  </div>
                </div>
              </div>

              <!-- 3) 건물 연식 구간 (Dual-Thumb Slider: 0~35년) -->
              <div class="filter-item filter-item--full">
                <div class="filter-label">
                  <span>🏛️ 건물 연식 구간</span>
                  <span id="dg-badge-year" class="dg-badge dg-badge--year">${st.minAge === 0 ? '신축' : st.minAge + '년차'} ~ ${st.maxAge}년차</span>
                </div>
                <div class="filter-slider-wrapper">
                  <div class="dual-slider dual-slider--year" id="dg-slider-year" data-min="0" data-max="35" data-step="1" data-unit="년차">
                    <div class="dual-slider__track"></div>
                    <div class="dual-slider__range" id="dg-slider-year-range"></div>
                    <div class="dual-slider__thumb dual-slider__thumb--min" id="dg-slider-year-min" role="slider" aria-label="최소 건물 연식" aria-valuemin="0" aria-valuemax="35" aria-valuenow="${st.minAge}" tabindex="0">
                      <span class="dual-slider__tooltip" id="dg-slider-year-min-tooltip">${st.minAge === 0 ? '신축' : st.minAge + '년차'}</span>
                    </div>
                    <div class="dual-slider__thumb dual-slider__thumb--max" id="dg-slider-year-max" role="slider" aria-label="최대 건물 연식" aria-valuemin="0" aria-valuemax="35" aria-valuenow="${st.maxAge}" tabindex="0">
                      <span class="dual-slider__tooltip" id="dg-slider-year-max-tooltip">${st.maxAge}년차</span>
                    </div>
                  </div>
                  <div class="dual-slider__labels">
                    <span>신축(0)</span>
                    <span>35년차</span>
                  </div>
                </div>
              </div>

              <!-- 4) 평수 구간 (Dual-Thumb Slider: 5~70평) -->
              <div class="filter-item filter-item--full">
                <div class="filter-label">
                  <span>📐 평수 구간</span>
                  <span id="dg-badge-pyeong" class="dg-badge dg-badge--pyeong">${st.minPyeong}평 ~ ${st.maxPyeong}평</span>
                </div>
                <div class="filter-slider-wrapper">
                  <div class="dual-slider dual-slider--pyeong" id="dg-slider-pyeong" data-min="5" data-max="70" data-step="1" data-unit="평">
                    <div class="dual-slider__track"></div>
                    <div class="dual-slider__range" id="dg-slider-pyeong-range"></div>
                    <div class="dual-slider__thumb dual-slider__thumb--min" id="dg-slider-pyeong-min" role="slider" aria-label="최소 평수" aria-valuemin="5" aria-valuemax="70" aria-valuenow="${st.minPyeong}" tabindex="0">
                      <span class="dual-slider__tooltip" id="dg-slider-pyeong-min-tooltip">${st.minPyeong}평</span>
                    </div>
                    <div class="dual-slider__thumb dual-slider__thumb--max" id="dg-slider-pyeong-max" role="slider" aria-label="최대 평수" aria-valuemin="5" aria-valuemax="70" aria-valuenow="${st.maxPyeong}" tabindex="0">
                      <span class="dual-slider__tooltip" id="dg-slider-pyeong-max-tooltip">${st.maxPyeong}평</span>
                    </div>
                  </div>
                  <div class="dual-slider__labels">
                    <span>5평</span>
                    <span>70평</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- 매물 형태 다중 선택 (아파트 / 단독주택 / 빌라) + 검색/초기화 버튼 -->
            <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px; padding-top:10px; border-top:1px dashed #FED7AA;">
              <div style="display:flex; gap:14px; align-items:center;">
                <span style="font-size:12px; font-weight:800; color:#7C2D12;">🏠 매물형태:</span>
                <label style="display:inline-flex; align-items:center; gap:5px; font-size:12.5px; font-weight:700; cursor:pointer; color:#1E293B;">
                  <input type="checkbox" id="dg-chk-apt" ${st.types.apt ? 'checked' : ''} onchange="updateDaangnFilter()" style="accent-color:#EA580C; width:16px; height:16px;"> 아파트
                </label>
                <label style="display:inline-flex; align-items:center; gap:5px; font-size:12.5px; font-weight:700; cursor:pointer; color:#1E293B;">
                  <input type="checkbox" id="dg-chk-house" ${st.types.house ? 'checked' : ''} onchange="updateDaangnFilter()" style="accent-color:#EA580C; width:16px; height:16px;"> 단독주택
                </label>
                <label style="display:inline-flex; align-items:center; gap:5px; font-size:12.5px; font-weight:700; cursor:pointer; color:#1E293B;">
                  <input type="checkbox" id="dg-chk-villa" ${st.types.villa ? 'checked' : ''} onchange="updateDaangnFilter()" style="accent-color:#EA580C; width:16px; height:16px;"> 빌라/연립
                </label>
              </div>
              <div style="display:flex; gap:8px; align-items:center;">
                <button type="button" id="dg-btn-reset" onclick="resetDaangnFilter()" style="background:#FFF; color:#64748B; border:1px solid #CBD5E1; border-radius:8px; padding:8px 14px; font-size:12px; font-weight:700; cursor:pointer; transition:all 0.15s ease;">
                  🔄 초기화
                </button>
                <button type="button" id="dg-btn-search" onclick="executeDaangnSearch()" style="background:linear-gradient(135deg, #F97316 0%, #EA580C 100%); color:#FFF; border:none; border-radius:10px; padding:10px 20px; font-size:13.5px; font-weight:800; cursor:pointer; box-shadow:0 4px 12px rgba(234,88,12,0.3); transition:all 0.2s ease; min-height:44px;">
                  🔍 조건으로 매물 검색 / 다시 조회
                </button>
              </div>
            </div>
          </div>

          <!-- 2. 매물 헤더 라벨 -->
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px; padding:0 4px;">
            <span style="font-size:14px; font-weight:800; color:#0F172A;">
              🔍 조건 일치 매매 매물 (<span style="color:#EA580C;">${filtered.length}</span>건)
            </span>
            <span style="font-size:12px; color:#64748B;">거래유형: <b style="color:#0F172A;">매매 고정</b></span>
          </div>

          <!-- 3. 반응형 매물 카드 그리드 (모바일 1열, 태블릿 2열, PC 3열) -->
          <div style="display:grid; grid-template-columns:repeat(auto-fill, minmax(350px, 1fr)); gap:16px; margin-bottom:40px;">
            ${cardsHtml || '<div style="grid-column:1/-1; text-align:center; padding:60px 20px; color:#64748B; background:#F8FAFC; border-radius:14px; border:1px dashed #CBD5E1;"><div style="font-size:28px; margin-bottom:8px;">🔍</div>선택하신 조건에 해당하는 매물이 없습니다.<br/>구나 가격, 연식 범위를 넓혀보세요!</div>'}
          </div>
        </div>
      `;

      // v3.4.0: 듀얼 썸 슬라이더 초기화 (DOM 렌더링 후 실행)
      setTimeout(() => initDualSliders(st), 0);
    };

    window.updateDaangnFilter = function() {
      // 듀얼 썸 슬라이더에서 값 읽기
      const minPriceEok = parseInt(document.getElementById('dg-slider-price-min')?.getAttribute('aria-valuenow') || '1', 10);
      const maxPriceEok = parseInt(document.getElementById('dg-slider-price-max')?.getAttribute('aria-valuenow') || '50', 10);
      const minAge = parseInt(document.getElementById('dg-slider-year-min')?.getAttribute('aria-valuenow') || '0', 10);
      const maxAge = parseInt(document.getElementById('dg-slider-year-max')?.getAttribute('aria-valuenow') || '35', 10);
      const minPyeong = parseInt(document.getElementById('dg-slider-pyeong-min')?.getAttribute('aria-valuenow') || '5', 10);
      const maxPyeong = parseInt(document.getElementById('dg-slider-pyeong-max')?.getAttribute('aria-valuenow') || '70', 10);
      const chkApt = document.getElementById('dg-chk-apt')?.checked ?? true;
      const chkHouse = document.getElementById('dg-chk-house')?.checked ?? true;
      const chkVilla = document.getElementById('dg-chk-villa')?.checked ?? true;

      // 최소값이 최대값을 초과하지 않도록 보정
      const finalMinPriceEok = Math.min(minPriceEok, maxPriceEok);
      const finalMaxPriceEok = Math.max(minPriceEok, maxPriceEok);
      const finalMinAge = Math.min(minAge, maxAge);
      const finalMaxAge = Math.max(minAge, maxAge);
      const finalMinPyeong = Math.min(minPyeong, maxPyeong);
      const finalMaxPyeong = Math.max(minPyeong, maxPyeong);

      window.daangnFilterState = {
        districts: window.daangnFilterState.districts || ['all'],
        minPriceWon: finalMinPriceEok * 100000000,
        maxPriceWon: finalMaxPriceEok * 100000000,
        minAge: finalMinAge,
        maxAge: finalMaxAge,
        minPyeong: finalMinPyeong,
        maxPyeong: finalMaxPyeong,
        types: { apt: chkApt, house: chkHouse, villa: chkVilla }
      };
      window.renderDaangnCrawlerView('naver-radar-root');
    };

    // 서울 세부 지역 다중 선택 토글 함수
    window.toggleDaangnDistrict = function(district) {
      const st = window.daangnFilterState;
      let current = Array.isArray(st.districts) ? [...st.districts] : (st.district ? [st.district] : ['all']);

      // '전체' 클릭 시
      if (district === '전체') {
        current = ['all'];
      } else {
        // 특정 구 클릭 시 '전체' 제거
        current = current.filter(d => d !== 'all' && d !== '전체');

        // 이미 선택된 구면 제거, 아니면 추가
        const idx = current.indexOf(district);
        if (idx >= 0) {
          current.splice(idx, 1);
        } else {
          current.push(district);
        }

        // 모든 구가 해제되면 '전체'로 복원
        if (current.length === 0) {
          current = ['all'];
        }
      }

      window.daangnFilterState.districts = current;
      window.renderDaangnCrawlerView('naver-radar-root');
    };

    // 실시간 뱃지 업데이트 헬퍼 함수들
    window.updateDaangnPriceBadge = function(minEok, maxEok) {
      const badge = document.getElementById('dg-badge-price');
      if (badge) {
        const min = Math.min(parseInt(minEok) || 1, parseInt(maxEok) || 50);
        const max = Math.max(parseInt(minEok) || 1, parseInt(maxEok) || 50);
        badge.textContent = `${min}억 ~ ${max}억`;
      }
    };

    window.updateDaangnYearBadge = function(minAge, maxAge) {
      const badge = document.getElementById('dg-badge-year');
      if (badge) {
        const min = parseInt(minAge) || 0;
        const max = parseInt(maxAge) || 35;
        badge.textContent = `${min === 0 ? '신축' : min + '년차'} ~ ${max}년차`;
      }
    };

    window.updateDaangnPyeongBadge = function(minPy, maxPy) {
      const badge = document.getElementById('dg-badge-pyeong');
      if (badge) {
        const min = Math.min(parseInt(minPy) || 5, parseInt(maxPy) || 70);
        const max = Math.max(parseInt(minPy) || 5, parseInt(maxPy) || 70);
        badge.textContent = `${min}평 ~ ${max}평`;
      }
    };

    window.resetDaangnFilter = function() {
      window.daangnFilterState = {
        districts: ['all'],
        minPriceWon: 100000000,
        maxPriceWon: 5000000000,
        minAge: 0,
        maxAge: 35,
        minPyeong: 5,
        maxPyeong: 70,
        types: { apt: true, house: true, villa: true }
      };
      window.renderDaangnCrawlerView('naver-radar-root');
    };

    // 🔍 명시적 검색 버튼 클릭 시 실행되는 재조회 함수
    window.executeDaangnSearch = function() {
      const btn = document.getElementById('dg-btn-search');
      const originalText = btn.innerHTML;

      // 로딩 피드백
      btn.innerHTML = '⏳ 매물 불러오는 중...';
      btn.style.opacity = '0.85';
      btn.disabled = true;

      setTimeout(() => {
        // 현재 필터 상태로 다시 렌더링
        window.renderDaangnCrawlerView('naver-radar-root');

        // 버튼 원상복구
        btn.innerHTML = originalText;
        btn.style.opacity = '1';
        btn.disabled = false;

        // 현재 필터 상태 읽기
        const st = window.daangnFilterState;
        const filtered = window.DAANGN_SEOUL_LISTINGS.filter(item => {
          const currentYear = new Date().getFullYear();
          // 자치구 필터 (다중 선택 지원)
          const selectedDistricts = Array.isArray(st.districts) ? st.districts : [st.district || 'all'];
          const districtMatch = selectedDistricts.includes('all') || selectedDistricts.includes(item.district);
          if (!districtMatch) return false;
          if (!st.types[item.propertyType]) return false;
          const priceManwon = item.priceManwon;
          const minPriceManwon = st.minPriceWon / 10000;
          const maxPriceManwon = st.maxPriceWon / 10000;
          if (priceManwon < minPriceManwon || priceManwon > maxPriceManwon) return false;
          const age = currentYear - item.buildYear;
          if (age < st.minAge || age > st.maxAge) return false;
          const py = item.areaPyeong;
          if (py < st.minPyeong || py > st.maxPyeong) return false;
          return true;
        });

        // 결과 헤더 업데이트
        const headerEl = document.querySelector('.re-daangn-container .re-daangn-header-label');
        if (headerEl) {
          headerEl.innerHTML = `🔍 조건 일치 매매 매물 (<span style="color:#EA580C;">${filtered.length}</span>건)`;
        }

        // 토스트 피드백
        if (typeof window.showToast === 'function') {
          window.showToast(`🎯 조건에 맞는 매물 ${filtered.length}건을 새로 불러왔습니다!`);
        }

        // 0 건일 경우 친절한 안내
        if (filtered.length === 0) {
          const gridEl = document.querySelector('.re-daangn-container .re-daangn-grid');
          if (gridEl) {
            gridEl.innerHTML = '<div style="grid-column:1/-1; text-align:center; padding:60px 20px; color:#64748B; background:#F8FAFC; border-radius:14px; border:1px dashed #CBD5E1;"><div style="font-size:28px; margin-bottom:8px;">🔍</div>선택하신 조건에 해당하는 매물이 없습니다.<br/><b style="color:#EA580C;">조건 범위를 넓겨보세요!</b><br/><small>가격 구간 확대, 연식 범위 확장, 평수 범위 조정 등을 시도해보세요.</small></div>';
          }
        }
      }, 150);
    };

    window.syncDaangnItemToCalendar = function(itemId, silent = false) {
      const item = window.DAANGN_SEOUL_LISTINGS.find(x => x.id === itemId);
      if (!item) return null;

      const baseObj = {
        id: item.id,
        source: 'daangn',
        rawUrl: item.rawUrl,
        sourceUrl: item.rawUrl,
        url: item.rawUrl,
        title: item.title,
        complexName: item.title,
        region: item.district + ' ' + item.dong,
        propertyType: item.propertyType,
        tradeType: 'sale',
        dealType: '매매',
        price: item.priceManwon,
        priceManwon: item.priceManwon,
        priceRaw: item.priceRaw,
        formattedPrice: '매매 ' + item.priceRaw,
        priceDeposit: item.priceDeposit,
        priceMonthly: 0,
        area: item.areaPyeong + '평 (' + item.areaSquareMeter + '㎡)',
        areaPyeong: item.areaPyeong,
        areaSquareMeter: item.areaSquareMeter,
        address: item.address,
        floor: item.floorInfo,
        floorInfo: item.floorInfo,
        status: 'favorite',
        likes: ['주니', '용이'],
        favorite: { user1: true, user2: true, together: true },
        visitDate: '2026-11-21',
        coupleMemo: item.memo + ' (' + item.changeStatus + ')',
        notes: item.memo + ' | ' + item.commute,
        coupleNotes: [{ id: 'cn-' + Date.now(), author: 'user1', text: item.memo + ' (' + item.changeStatus + ')', createdAt: new Date().toISOString() }]
      };

      const unified = (typeof RealEstateEngine !== 'undefined' && RealEstateEngine.createUnifiedProperty)
        ? Object.assign(RealEstateEngine.createUnifiedProperty(baseObj), baseObj)
        : baseObj;

      if (!window.AppState) return unified;
      if (!Array.isArray(window.AppState.realEstates)) window.AppState.realEstates = [];
      const existingIdx = window.AppState.realEstates.findIndex(p => p.id === item.id || p.title === item.title || p.complexName === item.title);
      if (existingIdx === -1) {
        window.AppState.realEstates.unshift(unified);
      } else {
        window.AppState.realEstates[existingIdx] = unified;
      }

      if (window.realEstateStore) {
        window.realEstateStore.properties = window.AppState.realEstates;
      }
      if (!silent) {
        if (typeof window.saveStateLocal === 'function') window.saveStateLocal();
        if (typeof window.renderFavoriteSummaryWidget === 'function') window.renderFavoriteSummaryWidget();
        if (typeof window.showToast === 'function') window.showToast('💖 관심매물 등록 및 달력 상단 위젯에 자동 연동되었습니다!');
        window.renderDaangnCrawlerView('naver-radar-root');
      }
      return unified;
    };

    window.getDefaultSeedRealEstates = function() {
      const defaultIds = ['dg-1001', 'dg-1004', 'dg-1002', 'dg-1009', 'dg-1003', 'dg-1006'];
      return defaultIds.map(id => window.syncDaangnItemToCalendar(id, true)).filter(Boolean);
    };

    /* deleted syncAllFilteredDaangnToCalendar */ window._unusedSync = function() {
      const st = window.daangnFilterState;
      const filtered = window.DAANGN_SEOUL_LISTINGS.filter(item => {
        if (st.district !== 'all' && item.district !== st.district) return false;
        if (!st.types[item.propertyType]) return false;
        if (item.priceManwon < st.minPrice || item.priceManwon > st.maxPrice) return false;
        return true;
      });
      filtered.forEach(it => window.syncDaangnItemToCalendar(it.id));
      if (typeof window.showToast === 'function') window.showToast(`✨ 총 ${filtered.length}건의 당근 매매 매물이 캘린더에 자동 연동되었습니다!`);
    };

    window.exportSingleDaangnMarkdown = function(itemId) {
      const item = window.DAANGN_SEOUL_LISTINGS.find(x => x.id === itemId);
      if (!item) return;
      const md = `---\nid: "${item.id}"\nsource: "daangn"\ndistrict: "${item.district}"\ndong: "${item.dong}"\nproperty_type: "${item.propertyTypeKor}"\ntrade_type: "매매"\nprice_raw: "${item.priceRaw}"\ndeposit_manwon: ${item.priceManwon}\narea_pyeong: ${item.areaPyeong}\nfloor: "${item.floorInfo}"\nchange_status: "${item.changeStatus}"\nurl: "${item.rawUrl}"\n---\n\n# 🥕 [${item.district} ${item.dong}] ${item.title}\n\n- **매매가**: ${item.priceRaw} (${item.priceManwon.toLocaleString()}만원)\n- **형태/면적**: ${item.propertyTypeKor} · ${item.areaPyeong}평 (${item.areaSquareMeter}㎡)\n- **층수**: ${item.floorInfo}\n- **출퇴근**: ${item.commute}\n- **메모**: ${item.memo}\n\n## 📊 형상관리 이력\n` + item.history.map(h => `- ${h}`).join('\n');
      const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `${item.id}_${item.district}_${item.dong}.md`;
      a.click();
      if (typeof window.showToast === 'function') window.showToast('📝 옵시디언 마크다운(.md) 노트가 다운로드되었습니다!');
    };

    /* deleted exportAllDaangnToObsidian */ window._unusedExport = function() {
      const st = window.daangnFilterState;
      const filtered = window.DAANGN_SEOUL_LISTINGS.filter(item => {
        if (st.district !== 'all' && item.district !== st.district) return false;
        if (!st.types[item.propertyType]) return false;
        if (item.priceManwon < st.minPrice || item.priceManwon > st.maxPrice) return false;
        return true;
      });
      let md = `---\ntitle: 당근부동산 서울 매매 수집 및 형상관리 리포트\nupdated: "${new Date().toISOString().slice(0,16).replace('T',' ')}"\nfilter_district: "${st.district}"\nprice_range: "${st.minPrice/10000}억 ~ ${st.maxPrice/10000}억"\n---\n\n# 🥕 당근부동산 서울 매매 형상관리 대시보드 (${filtered.length}건)\n\n| 자치구 | 동 | 유형 | 매물명 | 매매가 | 면적 | 형상상태 | 원문 |\n| :---: | :---: | :---: | :--- | :---: | :---: | :---: | :---: |\n`;
      filtered.forEach(it => {
        md += `| ${it.district} | ${it.dong} | ${it.propertyTypeKor} | ${it.title} | **${it.priceRaw}** | ${it.areaPyeong}평 | ${it.changeStatus} | [링크](${it.rawUrl}) |\n`;
      });
      const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `당근부동산_서울매매_형상관리_대시보드.md`;
      a.click();
      if (typeof window.showToast === 'function') window.showToast('📥 옵시디언 통합 대시보드 마크다운(.md) 파일이 생성되었습니다!');
    };

    // =========================================================================
    // v3.4.0: Dual-Thumb Single-Track Slider Logic (Pointer Events API)
    // =========================================================================
    function initDualSliders(filterState) {
      // Price slider (1~50억)
      initSingleDualSlider({
        sliderId: 'dg-slider-price',
        minThumbId: 'dg-slider-price-min',
        maxThumbId: 'dg-slider-price-max',
        rangeId: 'dg-slider-price-range',
        minTooltipId: 'dg-slider-price-min-tooltip',
        maxTooltipId: 'dg-slider-price-max-tooltip',
        badgeId: 'dg-badge-price',
        min: 1,
        max: 50,
        step: 1,
        unit: '억',
        formatTooltip: (v) => v + '억',
        formatBadge: (min, max) => min + '억 ~ ' + max + '억',
        initialMin: filterState.minPriceWon / 100000000,
        initialMax: filterState.maxPriceWon / 100000000,
        onChange: (min, max) => {
          updateDaangnPriceBadge(min, max);
          updateDaangnFilter();
        }
      });

      // Year slider (0~35년차)
      initSingleDualSlider({
        sliderId: 'dg-slider-year',
        minThumbId: 'dg-slider-year-min',
        maxThumbId: 'dg-slider-year-max',
        rangeId: 'dg-slider-year-range',
        minTooltipId: 'dg-slider-year-min-tooltip',
        maxTooltipId: 'dg-slider-year-max-tooltip',
        badgeId: 'dg-badge-year',
        min: 0,
        max: 35,
        step: 1,
        unit: '년차',
        formatTooltip: (v) => (v === 0 ? '신축' : v + '년차'),
        formatBadge: (min, max) => (min === 0 ? '신축' : min + '년차') + ' ~ ' + max + '년차',
        initialMin: filterState.minAge || 0,
        initialMax: filterState.maxAge || 35,
        onChange: (min, max) => {
          updateDaangnYearBadge(min, max);
          updateDaangnFilter();
        }
      });

      // Pyeong slider (5~70평)
      initSingleDualSlider({
        sliderId: 'dg-slider-pyeong',
        minThumbId: 'dg-slider-pyeong-min',
        maxThumbId: 'dg-slider-pyeong-max',
        rangeId: 'dg-slider-pyeong-range',
        minTooltipId: 'dg-slider-pyeong-min-tooltip',
        maxTooltipId: 'dg-slider-pyeong-max-tooltip',
        badgeId: 'dg-badge-pyeong',
        min: 5,
        max: 70,
        step: 1,
        unit: '평',
        formatTooltip: (v) => v + '평',
        formatBadge: (min, max) => min + '평 ~ ' + max + '평',
        initialMin: filterState.minPyeong || 5,
        initialMax: filterState.maxPyeong || 70,
        onChange: (min, max) => {
          updateDaangnPyeongBadge(min, max);
          updateDaangnFilter();
        }
      });
    }

    function initSingleDualSlider(config) {
      const slider = document.getElementById(config.sliderId);
      const minThumb = document.getElementById(config.minThumbId);
      const maxThumb = document.getElementById(config.maxThumbId);
      const rangeEl = document.getElementById(config.rangeId);
      const minTooltip = document.getElementById(config.minTooltipId);
      const maxTooltip = document.getElementById(config.maxTooltipId);
      const badge = document.getElementById(config.badgeId);

      if (!slider || !minThumb || !maxThumb || !rangeEl) return;

      const min = config.min;
      const max = config.max;
      const step = config.step;
      const trackPadding = 16; // CSS .dual-slider__track left/right

      // 초기 위치 설정
      let minVal = config.initialMin;
      let maxVal = config.initialMax;
      updatePositions(minVal, maxVal);

      let activeThumb = null;
      let startX = 0;
      let startMinVal = minVal;
      let startMaxVal = maxVal;

      function valueToPercent(val) {
        return ((val - min) / (max - min)) * 100;
      }

      function percentToValue(pct) {
        const rawVal = min + (pct / 100) * (max - min);
        return Math.round(rawVal / step) * step;
      }

      function clamp(val, minVal, maxVal) {
        return Math.max(minVal, Math.min(maxVal, val));
      }

      function updatePositions(minV, maxV) {
        const minPct = valueToPercent(minV);
        const maxPct = valueToPercent(maxV);

        minThumb.style.left = minPct + '%';
        maxThumb.style.left = maxPct + '%';
        rangeEl.style.left = minPct + '%';
        rangeEl.style.right = (100 - maxPct) + '%';

        minThumb.setAttribute('aria-valuenow', minV);
        maxThumb.setAttribute('aria-valuenow', maxV);

        if (minTooltip) minTooltip.textContent = config.formatTooltip(minV);
        if (maxTooltip) maxTooltip.textContent = config.formatTooltip(maxV);
        if (badge) badge.textContent = config.formatBadge(minV, maxV);
      }

      function onPointerDown(e, thumbType) {
        e.preventDefault();
        activeThumb = thumbType;
        startX = e.clientX || (e.touches && e.touches[0].clientX);
        startMinVal = minVal;
        startMaxVal = maxVal;

        minThumb.classList.add('dragging');
        maxThumb.classList.add('dragging');

        // 포인터 캡처로 부드러운 드래그 보장 (모바일 터치 포함)
        if (e.target.setPointerCapture) {
          try { e.target.setPointerCapture(e.pointerId); } catch (_) {}
        }

        document.addEventListener('pointermove', onPointerMove);
        document.addEventListener('pointerup', onPointerUp);
        document.addEventListener('pointercancel', onPointerUp);
      }

      function onPointerMove(e) {
        if (!activeThumb) return;
        e.preventDefault();

        const currentX = e.clientX || (e.touches && e.touches[0].clientX);
        const sliderRect = slider.getBoundingClientRect();
        const trackWidth = sliderRect.width - trackPadding * 2;
        const dx = currentX - startX;
        const pctDelta = (dx / trackWidth) * 100;

        if (activeThumb === 'min') {
          const newMinPct = clamp(valueToPercent(startMinVal) + pctDelta, 0, valueToPercent(maxVal));
          minVal = percentToValue(newMinPct);
          minVal = clamp(minVal, min, maxVal);
        } else {
          const newMaxPct = clamp(valueToPercent(startMaxVal) + pctDelta, valueToPercent(minVal), 100);
          maxVal = percentToValue(newMaxPct);
          maxVal = clamp(maxVal, minVal, max);
        }

        updatePositions(minVal, maxVal);
      }

      function onPointerUp(e) {
        if (!activeThumb) return;

        minThumb.classList.remove('dragging');
        maxThumb.classList.remove('dragging');

        if (e.target.releasePointerCapture) {
          try { e.target.releasePointerCapture(e.pointerId); } catch (_) {}
        }

        document.removeEventListener('pointermove', onPointerMove);
        document.removeEventListener('pointerup', onPointerUp);
        document.removeEventListener('pointercancel', onPointerUp);

        if (config.onChange) config.onChange(minVal, maxVal);
        activeThumb = null;
      }

      function onKeyDown(e) {
        const key = e.key;
        let changed = false;

        if (e.target === minThumb) {
          if (key === 'ArrowRight' || key === 'ArrowUp') {
            minVal = clamp(minVal + step, min, maxVal);
            changed = true;
          } else if (key === 'ArrowLeft' || key === 'ArrowDown') {
            minVal = clamp(minVal - step, min, maxVal);
            changed = true;
          } else if (key === 'Home') {
            minVal = min;
            changed = true;
          } else if (key === 'End') {
            minVal = maxVal;
            changed = true;
          }
        } else if (e.target === maxThumb) {
          if (key === 'ArrowRight' || key === 'ArrowUp') {
            maxVal = clamp(maxVal + step, minVal, max);
            changed = true;
          } else if (key === 'ArrowLeft' || key === 'ArrowDown') {
            maxVal = clamp(maxVal - step, minVal, max);
            changed = true;
          } else if (key === 'Home') {
            maxVal = minVal;
            changed = true;
          } else if (key === 'End') {
            maxVal = max;
            changed = true;
          }
        }

        if (changed) {
          e.preventDefault();
          updatePositions(minVal, maxVal);
          if (config.onChange) config.onChange(minVal, maxVal);
        }
      }

      // 이벤트 바인딩
      minThumb.addEventListener('pointerdown', (e) => onPointerDown(e, 'min'));
      maxThumb.addEventListener('pointerdown', (e) => onPointerDown(e, 'max'));
      minThumb.addEventListener('keydown', onKeyDown);
      maxThumb.addEventListener('keydown', onKeyDown);

      // 클릭으로 트랙에서 이동 (선택적)
      slider.addEventListener('click', (e) => {
        if (e.target === slider || e.target === rangeEl || e.target === slider.querySelector('.dual-slider__track')) {
          const rect = slider.getBoundingClientRect();
          const clickPct = ((e.clientX - rect.left - trackPadding) / (rect.width - trackPadding * 2)) * 100;
          const clickVal = percentToValue(clamp(clickPct, 0, 100));

          // 더 가까운 썸 이동
          const distMin = Math.abs(clickVal - minVal);
          const distMax = Math.abs(clickVal - maxVal);

          if (distMin <= distMax) {
            minVal = clamp(clickVal, min, maxVal);
          } else {
            maxVal = clamp(clickVal, minVal, max);
          }

          updatePositions(minVal, maxVal);
          if (config.onChange) config.onChange(minVal, maxVal);
        }
      });
    }
  }

  return RealEstateView;
}));
