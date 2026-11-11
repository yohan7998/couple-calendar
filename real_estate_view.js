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
        id: 'dg-1001',
        articleId: '654819201',
        district: '마포구',
        dong: '공덕동',
        propertyType: 'apt',
        propertyTypeKor: '아파트',
        tradeType: 'sale',
        tradeTypeKor: '매매',
        priceManwon: 98000,
        priceDeposit: 980000000,
        priceRaw: '9억 8,000',
        areaPyeong: 24.5,
        areaSquareMeter: 81.0,
        buildYear: 2015,
        floorInfo: '11층 / 20층',
        title: '[직거래] 공덕역 도보 6분 삼성래미안 24평 올수리 남향',
        address: '서울특별시 마포구 공덕동',
        rawUrl: 'https://www.daangn.com/kr/realty/articles/654819201',
        imageUrl: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=600&q=80',
        commute: '🏢 LG유플러스 18분 (3.4km)',
        changeStatus: '🆕 신규수집',
        history: ['2026-11-10: 매매 9억 8,000 (신규수집)'],
        memo: '공덕역 트리플 역세권 + 직거래 복비 절감 가능'
      },
      {
        id: 'dg-1002',
        articleId: '654819202',
        district: '마포구',
        dong: '연남동',
        propertyType: 'house',
        propertyTypeKor: '단독주택',
        tradeType: 'sale',
        tradeTypeKor: '매매',
        priceManwon: 115000,
        priceDeposit: 1150000000,
        priceRaw: '11억 5,000',
        areaPyeong: 28.0,
        areaSquareMeter: 92.5,
        buildYear: 2020,
        floorInfo: '1~2층 단독',
        title: '연트럴파크 인근 리모델링 단독주택(마당+루프탑)',
        address: '서울특별시 마포구 연남동',
        rawUrl: 'https://www.daangn.com/kr/realty/articles/654819202',
        imageUrl: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=600&q=80',
        commute: '🏢 LG유플러스 26분 (5.8km)',
        changeStatus: '📉 호가하락 (-3,000만)',
        history: ['2026-11-05: 11억 8,000', '2026-11-10: 11억 5,000 (-3,000만)'],
        memo: '작은 정원이랑 루프탑 테라스가 예쁜 단독주택'
      },
      {
        id: 'dg-1003',
        articleId: '654819203',
        district: '마포구',
        dong: '망원동',
        propertyType: 'villa',
        propertyTypeKor: '빌라',
        tradeType: 'sale',
        tradeTypeKor: '매매',
        priceManwon: 68000,
        priceDeposit: 680000000,
        priceRaw: '6억 8,000',
        areaPyeong: 21.5,
        areaSquareMeter: 71.1,
        buildYear: 2023,
        floorInfo: '4층 / 5층',
        title: '망원한강공원 도보 5분 신축급 고급 테라스 빌라 쓰리룸',
        address: '서울특별시 마포구 망원동',
        rawUrl: 'https://www.daangn.com/kr/realty/articles/654819203',
        imageUrl: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=600&q=80',
        commute: '🏢 LG유플러스 29분 (6.5km)',
        changeStatus: '✅ 가격유지',
        history: ['2026-11-10: 매매 6억 8,000 (판매중)'],
        memo: '한강 산책권 + 엘리베이터 및 자주식 주차 완비'
      },
      {
        id: 'dg-1004',
        articleId: '654819204',
        district: '용산구',
        dong: '효창동',
        propertyType: 'apt',
        propertyTypeKor: '아파트',
        tradeType: 'sale',
        tradeTypeKor: '매매',
        priceManwon: 112000,
        priceDeposit: 1120000000,
        priceRaw: '11억 2,000',
        areaPyeong: 25.2,
        areaSquareMeter: 83.3,
        buildYear: 2017,
        floorInfo: '9층 / 15층',
        title: '[집주인직거래] 효창공원앞역 도보 4분 효창파크푸르지오 25평',
        address: '서울특별시 용산구 효창동',
        rawUrl: 'https://www.daangn.com/kr/realty/articles/654819204',
        imageUrl: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=600&q=80',
        commute: '🏢 LG유플러스 12분 (1.8km)',
        changeStatus: '🆕 신규수집',
        history: ['2026-11-10: 매매 11억 2,000 (신규수집)'],
        memo: '회사(한강대로 32)까지 도보 출퇴근도 가능한 최고 입지'
      },
      {
        id: 'dg-1005',
        articleId: '654819205',
        district: '용산구',
        dong: '후암동',
        propertyType: 'house',
        propertyTypeKor: '단독주택',
        tradeType: 'sale',
        tradeTypeKor: '매매',
        priceManwon: 105000,
        priceDeposit: 1050000000,
        priceRaw: '10억 5,000',
        areaPyeong: 26.0,
        areaSquareMeter: 86.0,
        buildYear: 2018,
        floorInfo: '1~2층 단독',
        title: '남산뷰 탁트인 후암동 올리모델링 2층 단독주택',
        address: '서울특별시 용산구 후암동',
        rawUrl: 'https://www.daangn.com/kr/realty/articles/654819205',
        imageUrl: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=600&q=80',
        commute: '🏢 LG유플러스 14분 (1.5km)',
        changeStatus: '✅ 가격유지',
        history: ['2026-11-10: 매매 10억 5,000 (판매중)'],
        memo: '남산 타워 조망 + 용산공원 인접 단독주택'
      },
      {
        id: 'dg-1006',
        articleId: '654819206',
        district: '성동구',
        dong: '행당동',
        propertyType: 'apt',
        propertyTypeKor: '아파트',
        tradeType: 'sale',
        tradeTypeKor: '매매',
        priceManwon: 108000,
        priceDeposit: 1080000000,
        priceRaw: '10억 8,000',
        areaPyeong: 24.8,
        areaSquareMeter: 82.0,
        buildYear: 2002,
        floorInfo: '14층 / 25층',
        title: '[직거래] 왕십리역 역세권 행당대림e편한세상 24평 로얄층',
        address: '서울특별시 성동구 행당동',
        rawUrl: 'https://www.daangn.com/kr/realty/articles/654819206',
        imageUrl: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=600&q=80',
        commute: '🏢 LG유플러스 27분 (7.4km)',
        changeStatus: '🆕 신규수집',
        history: ['2026-11-10: 매매 10억 8,000 (신규수집)'],
        memo: '왕십리역 쿼드러플 역세권 대단지 아파트'
      },
      {
        id: 'dg-1007',
        articleId: '654819207',
        district: '성동구',
        dong: '성수동1가',
        propertyType: 'villa',
        propertyTypeKor: '빌라',
        tradeType: 'sale',
        tradeTypeKor: '매매',
        priceManwon: 89000,
        priceDeposit: 890000000,
        priceRaw: '8억 9,000',
        areaPyeong: 22.5,
        areaSquareMeter: 74.4,
        buildYear: 2022,
        floorInfo: '3층 / 4층',
        title: '서울숲 도보 7분 감성 인테리어 붉은벽돌 고급빌라 쓰리룸',
        address: '서울특별시 성동구 성수동1가',
        rawUrl: 'https://www.daangn.com/kr/realty/articles/654819207',
        imageUrl: 'https://images.unsplash.com/photo-1493809842364-78817add7ffb?auto=format&fit=crop&w=600&q=80',
        commute: '🏢 LG유플러스 31분 (8.2km)',
        changeStatus: '✅ 가격유지',
        history: ['2026-11-10: 매매 8억 9,000 (판매중)'],
        memo: '서울숲 산책권 + 성수동 인프라 최고'
      },
      {
        id: 'dg-1008',
        articleId: '654819208',
        district: '동작구',
        dong: '상도동',
        propertyType: 'apt',
        propertyTypeKor: '아파트',
        tradeType: 'sale',
        tradeTypeKor: '매매',
        priceManwon: 95000,
        priceDeposit: 950000000,
        priceRaw: '9억 5,000',
        areaPyeong: 24.2,
        areaSquareMeter: 80.0,
        buildYear: 2016,
        floorInfo: '10층 / 18층',
        title: '[급매] 7호선 상도역 힐스테이트상도센트럴 24평 남향 탁트인뷰',
        address: '서울특별시 동작구 상도동',
        rawUrl: 'https://www.daangn.com/kr/realty/articles/654819208',
        imageUrl: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=600&q=80',
        commute: '🏢 LG유플러스 21분 (4.6km)',
        changeStatus: '📉 호가하락 (-5,000만)',
        history: ['2026-11-01: 10억', '2026-11-10: 9억 5,000 (-5,000만)'],
        memo: '회사(한강대로 32) 버스 직통 20분대 접근성'
      },
      {
        id: 'dg-1009',
        articleId: '654819209',
        district: '동작구',
        dong: '사당동',
        propertyType: 'house',
        propertyTypeKor: '단독주택',
        tradeType: 'sale',
        tradeTypeKor: '매매',
        priceManwon: 118000,
        priceDeposit: 1180000000,
        priceRaw: '11억 8,000',
        areaPyeong: 31.0,
        areaSquareMeter: 102.5,
        buildYear: 2021,
        floorInfo: '1~2층 단독',
        title: '이수역 도보 6분 신축급 2층 단독주택 (주차 2대 가능)',
        address: '서울특별시 동작구 사당동',
        rawUrl: 'https://www.daangn.com/kr/realty/articles/654819209',
        imageUrl: 'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=600&q=80',
        commute: '🏢 LG유플러스 24분 (6.1km)',
        changeStatus: '🆕 신규수집',
        history: ['2026-11-10: 매매 11억 8,000 (신규수집)'],
        memo: '이수역 더블 역세권 + 주차 편리한 신축급 단독'
      },
      {
        id: 'dg-1010',
        articleId: '654819210',
        district: '영등포구',
        dong: '당산동',
        propertyType: 'apt',
        propertyTypeKor: '아파트',
        tradeType: 'sale',
        tradeTypeKor: '매매',
        priceManwon: 102000,
        priceDeposit: 1020000000,
        priceRaw: '10억 2,000',
        areaPyeong: 25.0,
        areaSquareMeter: 82.6,
        buildYear: 2019,
        floorInfo: '12층 / 22층',
        title: '당산역 더블역세권 당산삼성래미안4차 25평 로얄층 급매',
        address: '서울특별시 영등포구 당산동',
        rawUrl: 'https://www.daangn.com/kr/realty/articles/654819210',
        imageUrl: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=600&q=80',
        commute: '🏢 LG유플러스 23분 (5.9km)',
        changeStatus: '✅ 가격유지',
        history: ['2026-11-10: 매매 10억 2,000 (판매중)'],
        memo: '2·9호선 급행 당산역 인접 환금성 최고 단지'
      },
      {
        id: 'dg-1011',
        articleId: '654819211',
        district: '영등포구',
        dong: '문래동',
        propertyType: 'villa',
        propertyTypeKor: '빌라',
        tradeType: 'sale',
        tradeTypeKor: '매매',
        priceManwon: 65000,
        priceDeposit: 650000000,
        priceRaw: '6억 5,000',
        areaPyeong: 20.8,
        areaSquareMeter: 68.8,
        buildYear: 2023,
        floorInfo: '5층 / 6층',
        title: '문래창작촌 도보 3분 복층형 신축 테라스 빌라 풀옵션',
        address: '서울특별시 영등포구 문래동',
        rawUrl: 'https://www.daangn.com/kr/realty/articles/654819211',
        imageUrl: 'https://images.unsplash.com/photo-1502005229762-ee1b2da97e06?auto=format&fit=crop&w=600&q=80',
        commute: '🏢 LG유플러스 26분 (6.8km)',
        changeStatus: '🆕 신규수집',
        history: ['2026-11-10: 매매 6억 5,000 (신규수집)'],
        memo: '문래 감성 테라스 + 복층 구조 6억 중반대'
      },
      {
        id: 'dg-1012',
        articleId: '654819212',
        district: '서대문구',
        dong: '남가좌동',
        propertyType: 'apt',
        propertyTypeKor: '아파트',
        tradeType: 'sale',
        tradeTypeKor: '매매',
        priceManwon: 93000,
        priceDeposit: 930000000,
        priceRaw: '9억 3,000',
        areaPyeong: 25.0,
        areaSquareMeter: 82.6,
        buildYear: 2014,
        floorInfo: '18층 / 25층',
        title: '[직거래] DMC파크뷰자이 25평 로얄동 판상형 남향',
        address: '서울특별시 서대문구 남가좌동',
        rawUrl: 'https://www.daangn.com/kr/realty/articles/654819212',
        imageUrl: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=600&q=80',
        commute: '🏢 LG유플러스 30분 (7.8km)',
        changeStatus: '📉 호가하락 (-2,000만)',
        history: ['2026-11-03: 9억 5,000', '2026-11-10: 9억 3,000 (-2,000만)'],
        memo: '4,300세대 초대형 랜드마크 브랜드 자이 대단지'
      },
      {
        id: 'dg-1013',
        articleId: '654819213',
        district: '용산구',
        dong: '용문동',
        propertyType: 'house',
        propertyTypeKor: '단독주택',
        tradeType: 'sale',
        tradeTypeKor: '매매',
        priceManwon: 92000,
        priceDeposit: 920000000,
        priceRaw: '9억 2,000',
        areaPyeong: 22.0,
        areaSquareMeter: 72.7,
        buildYear: 2020,
        floorInfo: '1~2층 단독',
        title: '용문시장 인근 도심 속 아늑한 중정형 미니 단독주택',
        address: '서울특별시 용산구 용문동',
        rawUrl: 'https://www.daangn.com/kr/realty/articles/654819213',
        imageUrl: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=600&q=80',
        commute: '🏢 LG유플러스 10분 (1.2km)',
        changeStatus: '🆕 신규수집',
        history: ['2026-11-10: 매매 9억 2,000 (신규수집)'],
        memo: '4호선 신용산역 무환승 직통 + 중정 마당 단독주택'
      },
      {
        id: 'dg-1014',
        articleId: '654819214',
        district: '송파구',
        dong: '석촌동',
        propertyType: 'villa',
        propertyTypeKor: '빌라',
        tradeType: 'sale',
        tradeTypeKor: '매매',
        priceManwon: 76000,
        priceDeposit: 760000000,
        priceRaw: '7억 6,000',
        areaPyeong: 23.0,
        areaSquareMeter: 76.0,
        buildYear: 2024,
        floorInfo: '5층 / 6층',
        title: '석촌호수 도보 6분 9호선 역세권 하이엔드 신축 테라스 빌라',
        address: '서울특별시 송파구 석촌동',
        rawUrl: 'https://www.daangn.com/kr/realty/articles/654819214',
        imageUrl: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=600&q=80',
        commute: '🏢 LG유플러스 32분 (13.4km)',
        changeStatus: '✅ 가격유지',
        history: ['2026-11-10: 매매 7억 6,000 (판매중)'],
        memo: '송파구 석촌호수 생활권 7억 중반대 신축 테라스 빌라'
      },
      {
        id: 'dg-1015',
        articleId: '654819215',
        district: '강북구',
        dong: '미아동',
        propertyType: 'apt',
        propertyTypeKor: '아파트',
        tradeType: 'sale',
        tradeTypeKor: '매매',
        priceManwon: 82000,
        priceDeposit: 820000000,
        priceRaw: '8억 2,000',
        areaPyeong: 33.2,
        areaSquareMeter: 109.7,
        buildYear: 2010,
        floorInfo: '15층 / 24층',
        title: '[직거래] 미아사거리역 도보 5분 래미안트리베라 33평 로얄동',
        address: '서울특별시 강북구 미아동',
        rawUrl: 'https://www.daangn.com/kr/realty/articles/654819215',
        imageUrl: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=600&q=80',
        commute: '🏢 LG유플러스 34분 (11.5km)',
        changeStatus: '🆕 신규수집',
        history: ['2026-11-10: 매매 8억 2,000 (신규수집)'],
        memo: '8억 초반대 33평 브랜드 대단지 + 4호선 직통'
      },
      {
        id: 'dg-1016',
        articleId: '654819216',
        district: '양천구',
        dong: '목동',
        propertyType: 'apt',
        propertyTypeKor: '아파트',
        tradeType: 'sale',
        tradeTypeKor: '매매',
        priceManwon: 119000,
        priceDeposit: 1190000000,
        priceRaw: '11억 9,000',
        areaPyeong: 27.0,
        areaSquareMeter: 89.2,
        buildYear: 1988,
        floorInfo: '7층 / 15층',
        title: '오목교역 인접 목동신시가지 27평 남향 급매물',
        address: '서울특별시 양천구 목동',
        rawUrl: 'https://www.daangn.com/kr/realty/articles/654819216',
        imageUrl: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=600&q=80',
        commute: '🏢 LG유플러스 29분 (9.2km)',
        changeStatus: '📉 호가하락 (-2,000만)',
        history: ['2026-11-01: 12억 1,000', '2026-11-10: 11억 9,000 (-2,000만)'],
        memo: '12억 미만으로 내려온 목동 학군지 급매 아파트'
      },
      {
        id: 'dg-1017',
        articleId: '654819217',
        district: '광진구',
        dong: '자양동',
        propertyType: 'villa',
        propertyTypeKor: '빌라',
        tradeType: 'sale',
        tradeTypeKor: '매매',
        priceManwon: 79000,
        priceDeposit: 790000000,
        priceRaw: '7억 9,000',
        areaPyeong: 22.0,
        areaSquareMeter: 72.7,
        buildYear: 2022,
        floorInfo: '4층 / 5층',
        title: '뚝섬한강공원 도보 5분 자양동 신축급 3룸 고급빌라',
        address: '서울특별시 광진구 자양동',
        rawUrl: 'https://www.daangn.com/kr/realty/articles/654819217',
        imageUrl: 'https://images.unsplash.com/photo-1493809842364-78817add7ffb?auto=format&fit=crop&w=600&q=80',
        commute: '🏢 LG유플러스 35분 (10.5km)',
        changeStatus: '✅ 가격유지',
        history: ['2026-11-10: 매매 7억 9,000 (판매중)'],
        memo: '뚝섬 한강공원 도보권 깔끔한 쓰리룸 빌라'
      },
      {
        id: 'dg-1018',
        articleId: '654819218',
        district: '은평구',
        dong: '녹번동',
        propertyType: 'apt',
        propertyTypeKor: '아파트',
        tradeType: 'sale',
        tradeTypeKor: '매매',
        priceManwon: 94000,
        priceDeposit: 940000000,
        priceRaw: '9억 4,000',
        areaPyeong: 25.0,
        areaSquareMeter: 82.6,
        buildYear: 2015,
        floorInfo: '11층 / 20층',
        title: '녹번역 초역세권 북한산푸르지오 25평 숲세권 매매',
        address: '서울특별시 은평구 녹번동',
        rawUrl: 'https://www.daangn.com/kr/realty/articles/654819218',
        imageUrl: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=600&q=80',
        commute: '🏢 LG유플러스 28분 (8.7km)',
        changeStatus: '🆕 신규수집',
        history: ['2026-11-10: 매매 9억 4,000 (신규수집)'],
        memo: '3호선 초역세권 신축급 브랜드 대단지'
      },
      {
        id: 'dg-1019',
        articleId: '654819219',
        district: '종로구',
        dong: '부암동',
        propertyType: 'house',
        propertyTypeKor: '단독주택',
        tradeType: 'sale',
        tradeTypeKor: '매매',
        priceManwon: 114000,
        priceDeposit: 1140000000,
        priceRaw: '11억 4,000',
        areaPyeong: 29.0,
        areaSquareMeter: 95.8,
        buildYear: 2019,
        floorInfo: '1~2층 단독',
        title: '인왕산 뷰 정원 딸린 부암동 2층 리모델링 단독주택',
        address: '서울특별시 종로구 부암동',
        rawUrl: 'https://www.daangn.com/kr/realty/articles/654819219',
        imageUrl: 'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=600&q=80',
        commute: '🏢 LG유플러스 26분 (6.4km)',
        changeStatus: '✅ 가격유지',
        history: ['2026-11-10: 매매 11억 4,000 (판매중)'],
        memo: '인왕산 조망과 프라이빗 정원이 있는 단독주택'
      },
      {
        id: 'dg-1020',
        articleId: '654819220',
        district: '노원구',
        dong: '중계동',
        propertyType: 'apt',
        propertyTypeKor: '아파트',
        tradeType: 'sale',
        tradeTypeKor: '매매',
        priceManwon: 86000,
        priceDeposit: 860000000,
        priceRaw: '8억 6,000',
        areaPyeong: 32.0,
        areaSquareMeter: 105.7,
        buildYear: 1996,
        floorInfo: '10층 / 15층',
        title: '은행사거리 학군지 중계청구3차 32평 올수리 매매',
        address: '서울특별시 노원구 중계동',
        rawUrl: 'https://www.daangn.com/kr/realty/articles/654819220',
        imageUrl: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=600&q=80',
        commute: '🏢 LG유플러스 42분 (15.8km)',
        changeStatus: '🆕 신규수집',
        history: ['2026-11-10: 매매 8억 6,000 (신규수집)'],
        memo: '강북 최고 학군지 은행사거리 32평 아파트'
      }
    ];

window.daangnFilterState = window.daangnFilterState || {
      district: 'all',
      minPrice: 60000,
      maxPrice: 120000,
      types: { apt: true, house: true, villa: true },
      year: 'all',
      pyeong: 'all'
    };

window.renderDaangnCrawlerView = function(containerId) {
      const root = document.getElementById(containerId);
      if (!root) return;

      const st = window.daangnFilterState;
      const currentYear = new Date().getFullYear();

      const filtered = window.DAANGN_SEOUL_LISTINGS.filter(item => {
        // 자치구 필터
        if (st.district !== 'all' && item.district !== st.district) return false;
        // 형태 필터
        if (!st.types[item.propertyType]) return false;
        // 가격 범위 필터
        if (item.priceManwon < st.minPrice || item.priceManwon > st.maxPrice) return false;
        
        // 건물 연식 필터
        if (st.year && st.year !== 'all') {
          const age = currentYear - item.buildYear;
          if (st.year === 'under5' && age > 5) return false;
          if (st.year === 'under10' && age > 10) return false;
          if (st.year === 'under15' && age > 15) return false;
          if (st.year === 'under20' && age > 20) return false;
          if (st.year === 'over20' && age <= 20) return false;
        }

        // 평수 범위 필터
        if (st.pyeong && st.pyeong !== 'all') {
          const py = item.areaPyeong;
          if (st.pyeong === 'under20' && py >= 20) return false;
          if (st.pyeong === '20s' && (py < 20 || py >= 30)) return false;
          if (st.pyeong === '30s' && (py < 30 || py >= 40)) return false;
          if (st.pyeong === '40s' && py < 40) return false;
        }

        return true;
      });

      const districtOptions = ['<option value="all"' + (st.district === 'all' ? ' selected' : '') + '>서울 25개구 전체</option>']
        .concat(window.SEOUL_DISTRICTS.map(d => `<option value="${d}" ${st.district === d ? 'selected' : ''}>서울 ${d}</option>`))
        .join('');

      const cardsHtml = filtered.map(item => {
        const isAlreadySaved = (window.AppState?.realEstates || []).some(p => p.id === item.id || p.title === item.title);
        const thumbSvg = (typeof RealEstateEngine !== 'undefined' && RealEstateEngine.getAptSvgPlaceholder)
          ? RealEstateEngine.getAptSvgPlaceholder(item.district + ' ' + item.propertyTypeKor)
          : '';
        const displayThumb = item.imageUrl || thumbSvg;
        const buildingAge = currentYear - item.buildYear;

        return `
          <div class="re-daangn-card" style="background:#FFF; border:1px solid #E2E8F0; border-radius:14px; overflow:hidden; box-shadow:0 2px 8px rgba(0,0,0,0.04); display:flex; flex-direction:column; transition:transform 0.15s ease;">
            <!-- 썸네일 박스: 클릭 시 해당 매물 고유 상세 페이지로 직결 -->
            <div class="re-daangn-thumb-box" onclick="window.open('${item.rawUrl}', '_blank')" style="position:relative; width:100%; height:190px; background:#0F172A; cursor:pointer; overflow:hidden;">
              <img src="${displayThumb}" alt="${item.title}" class="re-daangn-thumb-img" style="width:100%; height:100%; object-fit:cover; display:block;" onerror="this.onerror=null; this.src='${thumbSvg}';">
              <span class="re-daangn-source-tag daangn" style="position:absolute; top:10px; left:10px; background:rgba(234, 88, 12, 0.92); color:#FFF; font-size:11.5px; font-weight:700; padding:3px 9px; border-radius:6px; backdrop-filter:blur(4px); box-shadow:0 2px 4px rgba(0,0,0,0.2);">
                🥕 당근매매 · ${item.buildYear}년 (${buildingAge}년차)
              </span>
              <span style="position:absolute; bottom:10px; right:10px; background:rgba(15, 23, 42, 0.8); color:#FFF; font-size:11px; padding:3px 8px; border-radius:6px; font-weight:600;">
                원문 바로가기 ↗
              </span>
            </div>

            <div class="re-daangn-card-body" style="padding:14px 16px; flex:1; display:flex; flex-direction:column;">
              <div class="re-daangn-top-row" style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
                <span class="re-daangn-region" style="font-size:12.5px; color:#64748B;">${item.district} ${item.dong} · <b style="color:#334155;">${item.propertyTypeKor}</b></span>
                <span style="font-size:11px; font-weight:700; padding:2px 8px; border-radius:8px; background:#FFF7ED; color:#EA580C; border:1px solid #FFEDD5;">${item.changeStatus}</span>
              </div>

              <!-- 가격 & 제목: 클릭 시 해당 매물 고유 상세 페이지로 직결 -->
              <div class="re-daangn-price-title" onclick="window.open('${item.rawUrl}', '_blank')" style="cursor:pointer; margin-bottom:4px;">
                <span class="re-daangn-deal-type" style="background:#EA580C; color:#FFF; font-size:11.5px; font-weight:800; padding:2px 6px; border-radius:4px; margin-right:4px;">매매</span>
                <span class="re-daangn-price-bold" style="font-size:19px; font-weight:800; color:#0F172A;">${item.priceRaw}</span>
              </div>
              
              <div class="re-daangn-Complex-name" onclick="window.open('${item.rawUrl}', '_blank')" style="font-weight:700; font-size:13.5px; color:#1E293B; margin-bottom:6px; cursor:pointer; line-height:1.4;">
                ${item.title}
              </div>

              <div class="re-daangn-specs-line" style="font-size:12px; color:#475569; margin-bottom:8px; line-height:1.4;">
                <b>${item.areaPyeong}평</b> (${item.areaSquareMeter}㎡) · <b>${item.buildYear}년 준공</b> · ${item.floorInfo} · ${item.commute}
              </div>

              <div class="re-daangn-memo-box" style="margin-top:auto; padding:8px 10px; background:#F8FAFC; border-radius:8px; font-size:11.5px; color:#334155; line-height:1.4;">
                <div style="color:#64748B; margin-bottom:2px;"><b>형상이력:</b> ${item.history.join(' ➔ ')}</div>
                <div style="color:#0284C7; font-weight:600;">💡 ${item.memo}</div>
              </div>
            </div>

            <div class="re-daangn-card-footer" style="padding:10px 16px; background:#FAFAFA; border-top:1px solid #F1F5F9; display:flex; justify-content:space-between; align-items:center; gap:8px;">
              <button type="button" class="re-footer-btn" style="background:#FFF; border:1px solid #CBD5E1; border-radius:8px; padding:6px 12px; font-size:12px; font-weight:700; color:#334155; cursor:pointer;" onclick="window.open('${item.rawUrl}', '_blank')">
                🥕 당근 원문 ↗
              </button>
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

            <!-- 5대 조건 필터 그리드 (반응형: 모바일 2열, PC 5열 자동 피팅) -->
            <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(160px, 1fr)); gap:10px; margin-bottom:12px;">
              <!-- 1) 서울 세부 지역 -->
              <div>
                <label style="font-size:11.5px; font-weight:700; color:#7C2D12; display:block; margin-bottom:4px;">📍 서울 세부 지역</label>
                <select id="dg-sel-district" onchange="updateDaangnFilter()" style="width:100%; padding:9px 10px; border-radius:8px; border:1px solid #FDBA74; font-size:12.5px; font-weight:700; background:#FFF; color:#1E293B;">
                  ${districtOptions}
                </select>
              </div>

              <!-- 2) 최소 매매가 -->
              <div>
                <label style="font-size:11.5px; font-weight:700; color:#7C2D12; display:block; margin-bottom:4px;">💰 최소 매매가</label>
                <select id="dg-sel-min" onchange="updateDaangnFilter()" style="width:100%; padding:9px 10px; border-radius:8px; border:1px solid #FDBA74; font-size:12.5px; font-weight:700; background:#FFF; color:#1E293B;">
                  <option value="30000" ${st.minPrice === 30000 ? 'selected' : ''}>3억 이상</option>
                  <option value="50000" ${st.minPrice === 50000 ? 'selected' : ''}>5억 이상</option>
                  <option value="60000" ${st.minPrice === 60000 ? 'selected' : ''}>6억 이상 (기본)</option>
                  <option value="70000" ${st.minPrice === 70000 ? 'selected' : ''}>7억 이상</option>
                  <option value="80000" ${st.minPrice === 80000 ? 'selected' : ''}>8억 이상</option>
                  <option value="90000" ${st.minPrice === 90000 ? 'selected' : ''}>9억 이상</option>
                </select>
              </div>

              <!-- 3) 최대 매매가 -->
              <div>
                <label style="font-size:11.5px; font-weight:700; color:#7C2D12; display:block; margin-bottom:4px;">💰 최대 매매가</label>
                <select id="dg-sel-max" onchange="updateDaangnFilter()" style="width:100%; padding:9px 10px; border-radius:8px; border:1px solid #FDBA74; font-size:12.5px; font-weight:700; background:#FFF; color:#1E293B;">
                  <option value="90000" ${st.maxPrice === 90000 ? 'selected' : ''}>9억 이하</option>
                  <option value="100000" ${st.maxPrice === 100000 ? 'selected' : ''}>10억 이하</option>
                  <option value="120000" ${st.maxPrice === 120000 ? 'selected' : ''}>12억 이하 (기본)</option>
                  <option value="150000" ${st.maxPrice === 150000 ? 'selected' : ''}>15억 이하</option>
                  <option value="200000" ${st.maxPrice === 200000 ? 'selected' : ''}>20억 이하</option>
                </select>
              </div>

              <!-- 4) 건물 연식 (신설) -->
              <div>
                <label style="font-size:11.5px; font-weight:700; color:#7C2D12; display:block; margin-bottom:4px;">🏛️ 건물 연식</label>
                <select id="dg-sel-year" onchange="updateDaangnFilter()" style="width:100%; padding:9px 10px; border-radius:8px; border:1px solid #FDBA74; font-size:12.5px; font-weight:700; background:#FFF; color:#1E293B;">
                  <option value="all" ${st.year === 'all' ? 'selected' : ''}>전체 연식</option>
                  <option value="under5" ${st.year === 'under5' ? 'selected' : ''}>5년 이내 (신축급)</option>
                  <option value="under10" ${st.year === 'under10' ? 'selected' : ''}>10년 이내 (준신축)</option>
                  <option value="under15" ${st.year === 'under15' ? 'selected' : ''}>15년 이내</option>
                  <option value="under20" ${st.year === 'under20' ? 'selected' : ''}>20년 이내</option>
                  <option value="over20" ${st.year === 'over20' ? 'selected' : ''}>20년 이상 (구축/재건축)</option>
                </select>
              </div>

              <!-- 5) 평수 (면적) (신설) -->
              <div>
                <label style="font-size:11.5px; font-weight:700; color:#7C2D12; display:block; margin-bottom:4px;">📐 전용/공급 평수</label>
                <select id="dg-sel-pyeong" onchange="updateDaangnFilter()" style="width:100%; padding:9px 10px; border-radius:8px; border:1px solid #FDBA74; font-size:12.5px; font-weight:700; background:#FFF; color:#1E293B;">
                  <option value="all" ${st.pyeong === 'all' ? 'selected' : ''}>전체 평수</option>
                  <option value="under20" ${st.pyeong === 'under20' ? 'selected' : ''}>20평 미만 (소형)</option>
                  <option value="20s" ${st.pyeong === '20s' ? 'selected' : ''}>20평대 (20~29평)</option>
                  <option value="30s" ${st.pyeong === '30s' ? 'selected' : ''}>30평대 (30~39평, 국평)</option>
                  <option value="40s" ${st.pyeong === '40s' ? 'selected' : ''}>40평 이상 (대형)</option>
                </select>
              </div>
            </div>

            <!-- 매물 형태 다중 선택 (아파트 / 단독주택 / 빌라) -->
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
              <button type="button" onclick="resetDaangnFilter()" style="background:#FFF; color:#64748B; border:1px solid #CBD5E1; border-radius:8px; padding:5px 12px; font-size:11.5px; font-weight:700; cursor:pointer;">
                🔄 필터 초기화
              </button>
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
    };

    window.updateDaangnFilter = function() {
      const dist = document.getElementById('dg-sel-district')?.value || 'all';
      const minP = parseInt(document.getElementById('dg-sel-min')?.value || '60000', 10);
      const maxP = parseInt(document.getElementById('dg-sel-max')?.value || '120000', 10);
      const yr = document.getElementById('dg-sel-year')?.value || 'all';
      const py = document.getElementById('dg-sel-pyeong')?.value || 'all';
      const chkApt = document.getElementById('dg-chk-apt')?.checked ?? true;
      const chkHouse = document.getElementById('dg-chk-house')?.checked ?? true;
      const chkVilla = document.getElementById('dg-chk-villa')?.checked ?? true;

      window.daangnFilterState = {
        district: dist,
        minPrice: minP,
        maxPrice: maxP < minP ? minP + 30000 : maxP,
        year: yr,
        pyeong: py,
        types: { apt: chkApt, house: chkHouse, villa: chkVilla }
      };
      window.renderDaangnCrawlerView('naver-radar-root');
    };

    window.resetDaangnFilter = function() {
      window.daangnFilterState = {
        district: 'all',
        minPrice: 60000,
        maxPrice: 120000,
        year: 'all',
        pyeong: 'all',
        types: { apt: true, house: true, villa: true }
      };
      window.renderDaangnCrawlerView('naver-radar-root');
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
  }

  return RealEstateView;
}));
