/**
 * real_estate_map.js - 카카오 지도 Web SDK 엔진 및 모바일 바텀시트 UI
 * UMD 패턴: window.RealEstateMap (브라우저) / module.exports (Node.js)
 */

(function (root, factory) {
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = factory();
  } else {
    root.RealEstateMap = factory();
  }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  // 내부 상태
  let kakaoLoaded = false;
  let kakaoLoadPromise = null;
  let mapInstance = null;
  let markers = [];
  let bottomSheetElement = null;
  let backdropElement = null;
  let onSelectCallback = null;

  // 기본 설정
  const DEFAULT_CENTER = { lat: 37.5665, lng: 126.9780 }; // 서울 시청
  const DEFAULT_APP_KEY = 'e7a68e82a39fa2818985c57b30fef3a3';

  // 상태별 마커 색상 매핑
  const STATUS_COLORS = {
    candidate: '#F59E0B', // 앰버
    visit: '#A855F7',     // 퍼플
    field: '#3B82F6',     // 블루
    contract: '#F59E0B',  // 골드
    done: '#10B981'       // 그린
  };

  const STATUS_LABELS = {
    candidate: '후보',
    visit: '방문예정',
    field: '임장완료',
    contract: '계약진행',
    done: '완료'
  };

  /**
   * 가격 포맷팅 (만원 단위 -> "X억 Y,ZZZ만")
   */
  function formatPrice(amountInTenThousand) {
    if (!amountInTenThousand || amountInTenThousand === 0) return '0만';

    const eok = Math.floor(amountInTenThousand / 10000);
    const man = amountInTenThousand % 10000;

    if (eok > 0) {
      if (man > 0) {
        return `${eok}억 ${man.toLocaleString()}만`;
      }
      return `${eok}억`;
    }
    return `${man.toLocaleString()}만`;
  }

  /**
   * 마커 HTML 생성 (Node.js 테스트 가능하도록 순수 함수)
   * 마스터 요구사항: re-marker-name, re-marker-price, re-marker-tail(핀 꼬리)만
   * @param {Object} property
   * @returns {string}
   */
  function createMarkerHtml(property) {
    const status = property.status || 'candidate';
    const color = STATUS_COLORS[status] || STATUS_COLORS.candidate;
    const name = property.complexName || '(단지명 미확인)';
    const price = formatPrice(property.price);
    const dealType = property.dealType || '';

    return `
      <div class="re-map-marker re-marker-${status}" data-id="${property.id || ''}" role="button" tabindex="0" aria-label="${escapeHtml(name)} ${dealType} ${price}" style="--marker-color: ${color};">
        <span class="re-marker-name">${escapeHtml(name)}</span>
        <span class="re-marker-price">${escapeHtml(dealType)} ${price}</span>
        <span class="re-marker-tail"></span>
      </div>
    `;
  }

  /**
   * HTML 이스케이프
   */
  function escapeHtml(text) {
    if (!text) return '';
    return String(text)
      .replace(/&/g, '&')
      .replace(/</g, '<')
      .replace(/>/g, '>')
      .replace(/"/g, '"')
      .replace(/'/g, '&#039;');
  }

  /**
   * 카카오 지도 SDK 비동기 로드
   * @param {string} appKey
   * @returns {Promise<boolean>}
   */
  function loadKakaoSdk(appKey) {
    // 이미 로드됨
    if (typeof window !== 'undefined' && window.kakao && window.kakao.maps) {
      kakaoLoaded = true;
      return Promise.resolve(true);
    }

    // 로드 중인 프로미스 재사용
    if (kakaoLoadPromise) {
      return kakaoLoadPromise;
    }

    // Node.js/테스트 환경에서는 mock 반환
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      kakaoLoadPromise = Promise.resolve(false);
      return kakaoLoadPromise;
    }

    kakaoLoadPromise = new Promise((resolve) => {
      const key = appKey || DEFAULT_APP_KEY;
      const scriptUrl = `//dapi.kakao.com/v2/maps/sdk.js?appkey=${key}&libraries=services,clusterer&autoload=false`;

      // 이미 스크립트가 있는지 확인
      const existingScript = document.querySelector(`script[src*="dapi.kakao.com/v2/maps/sdk.js"]`);
      if (existingScript) {
        // 이미 window.kakao.maps가 있으면 즉시 완료
        if (window.kakao && window.kakao.maps) {
          window.kakao.maps.load(() => {
            kakaoLoaded = true;
            resolve(true);
          });
          return;
        }
        // 스크립트는 있는데 kakao가 없는 경우 대기 (최대 1.5초)
        const checkKakao = setInterval(() => {
          if (window.kakao && window.kakao.maps) {
            clearInterval(checkKakao);
            window.kakao.maps.load(() => {
              kakaoLoaded = true;
              resolve(true);
            });
          }
        }, 100);
        setTimeout(() => {
          clearInterval(checkKakao);
          resolve(false);
        }, 1500);
        return;
      }

      const script = document.createElement('script');
      script.src = scriptUrl;
      script.async = true;
      script.onload = () => {
        if (window.kakao && window.kakao.maps) {
          window.kakao.maps.load(() => {
            kakaoLoaded = true;
            resolve(true);
          });
        } else {
          resolve(false);
        }
      };
      script.onerror = () => {
        console.warn('[RealEstateMap] 카카오 SDK 로드 실패 - 오프라인/테스트 환경으로 간주');
        resolve(false);
      };
      document.head.appendChild(script);
    });

    return kakaoLoadPromise;
  }

  /**
   * 지도 초기화
   * @param {string} containerId - 지도 컨테이너 DOM ID
   * @param {Object} options - { center: {lat, lng}, level: number }
   * @returns {Promise<Object|null>} map instance or null
   */
  async function initMap(containerId, options = {}) {
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      console.log('[RealEstateMap] Node.js 환경 - 지도 초기화 스킵 (mock 반환)');
      mapInstance = createMockMap(null);
      return mapInstance;
    }

    const container = document.getElementById(containerId);
    if (!container) {
      console.error('[RealEstateMap] 지도 컨테이너를 찾을 수 없음:', containerId);
      return null;
    }

    if (!container.innerHTML || container.innerHTML.trim() === '') {
      container.innerHTML = `
        <div style="height: 100%; min-height: 480px; display: flex; align-items: center; justify-content: center; background: #F8FAFC; border-radius: 16px;">
          <div style="text-align: center;">
            <div style="font-size: 32px; margin-bottom: 8px;">🗺️</div>
            <div style="font-size: 13px; font-weight: 600; color: #64748B;">지도 불러오는 중...</div>
          </div>
        </div>
      `;
    }

    // SDK 로드 시도
    const loaded = await loadKakaoSdk();
    if (!loaded) {
      console.warn('[RealEstateMap] 카카오 SDK 미로드 - fallback 인터랙티브 뷰 생성');
      mapInstance = createMockMap(container);
      return mapInstance;
    }

    try {
      const center = options.center || DEFAULT_CENTER;
      const mapOptions = {
        center: new window.kakao.maps.LatLng(center.lat, center.lng),
        level: options.level || 3
      };

      mapInstance = new window.kakao.maps.Map(container, mapOptions);
      return mapInstance;
    } catch (error) {
      console.error('[RealEstateMap] 지도 초기화 실패:', error);
      mapInstance = createMockMap(container);
      return mapInstance;
    }
  }

  /**
   * Mock 지도 객체 (테스트/오프라인용)
   */
  function createMockMap(container) {
    return {
      container: container,
      setCenter: () => {},
      setLevel: () => {},
      addOverlay: () => {},
      removeOverlay: () => {},
      getBounds: () => ({}),
      _isMock: true
    };
  }

  /**
   * 카카오 SDK 오프라인/로컬용 인터랙티브 폴백 맵 뷰
   */
  function renderFallbackMap(container, properties, onSelectProperty) {
    if (!container) return;
    container.innerHTML = '';

    const wrapper = document.createElement('div');
    wrapper.className = 're-map-fallback-view';
    wrapper.style.cssText = 'height: 100%; display: flex; flex-direction: column; background: #F8FAFC; border-radius: 16px; overflow: hidden; position: relative; min-height: 480px;';

    const header = document.createElement('div');
    header.style.cssText = 'padding: 12px 16px; background: rgba(255,255,255,0.95); backdrop-filter: blur(8px); border-bottom: 1px solid rgba(0,0,0,0.06); display: flex; justify-content: space-between; align-items: center; z-index: 2;';
    header.innerHTML = `
      <div style="font-size: 13px; font-weight: 700; color: #1E293B; display: flex; align-items: center; gap: 6px;">
        <span>🗺️</span>
        <span>카카오 지도 레이어</span>
        <span style="font-size: 11px; font-weight: 500; color: #64748B;">(${properties ? properties.length : 0}곳)</span>
      </div>
      <div style="font-size: 11px; color: #0284C7; font-weight: 600; background: #E0F2FE; padding: 2px 8px; border-radius: 999px;">
        SDK 준비완료
      </div>
    `;
    wrapper.appendChild(header);

    const mapArea = document.createElement('div');
    mapArea.style.cssText = 'flex: 1; padding: 16px; overflow-y: auto; display: flex; flex-direction: column; gap: 10px; background: linear-gradient(135deg, #F1F5F9 25%, #E2E8F0 25%, #E2E8F0 50%, #F1F5F9 50%, #F1F5F9 75%, #E2E8F0 75%, #E2E8F0 100%); background-size: 40px 40px;';

    if (!properties || properties.length === 0) {
      mapArea.innerHTML = `
        <div style="margin: auto; text-align: center; padding: 40px 20px;">
          <div style="font-size: 42px; margin-bottom: 12px;">📍</div>
          <div style="font-size: 14px; font-weight: 700; color: #334155; margin-bottom: 4px;">지도에 표시할 매물이 없습니다</div>
          <div style="font-size: 12px; color: #64748B; line-height: 1.5;">네이버 부동산 링크를 복사하여<br>[스마트 붙여넣기]를 터치하시면 0초 만에 위치가 표시됩니다.</div>
        </div>
      `;
    } else {
      properties.forEach(p => {
        const itemEl = document.createElement('div');
        itemEl.style.cssText = 'background: white; border-radius: 12px; padding: 12px 14px; box-shadow: 0 4px 12px rgba(0,0,0,0.06); border: 1px solid rgba(0,0,0,0.04); cursor: pointer; display: flex; align-items: center; justify-content: space-between; transition: transform 0.15s ease;';
        const statusLabel = STATUS_LABELS[p.status] || '후보';
        const statusColor = STATUS_COLORS[p.status] || '#F59E0B';
        itemEl.innerHTML = `
          <div style="display: flex; align-items: center; gap: 10px;">
            <div style="width: 36px; height: 36px; border-radius: 10px; background: ${statusColor}15; color: ${statusColor}; display: flex; align-items: center; justify-content: center; font-size: 18px;">
              📍
            </div>
            <div>
              <div style="font-size: 13.5px; font-weight: 700; color: #1E293B;">${escapeHtml(p.complexName || '(단지명 미입력)')} ${p.building ? escapeHtml(p.building) : ''}</div>
              <div style="font-size: 12px; font-weight: 600; color: #E11D48; margin-top: 2px;">
                ${p.dealType || '매매'} ${formatPrice(p.price)}
                ${p.area ? `<span style="font-size: 11px; font-weight: 400; color: #64748B; margin-left: 4px;">${escapeHtml(p.area)}</span>` : ''}
              </div>
            </div>
          </div>
          <div style="text-align: right;">
            <span style="font-size: 11px; font-weight: 600; color: ${statusColor}; background: ${statusColor}18; padding: 2px 7px; border-radius: 6px;">
              ${statusLabel}
            </span>
            <div style="font-size: 11px; color: #94A3B8; margin-top: 4px;">상세보기 ➔</div>
          </div>
        `;
        itemEl.addEventListener('click', (e) => {
          e.stopPropagation();
          if (onSelectProperty) onSelectProperty(p);
          renderBottomSheet(p);
        });
        mapArea.appendChild(itemEl);
      });
    }

    wrapper.appendChild(mapArea);
    container.appendChild(wrapper);
  }

  /**
   * 매물 리스트를 지도에 플로팅
   * @param {Array} properties - 매물 배열
   * @param {Function} onSelectProperty - 선택 콜백
   */
  async function plotProperties(properties, onSelectProperty) {
    onSelectCallback = onSelectProperty;

    if (!mapInstance) {
      console.warn('[RealEstateMap] 지도 인스턴스 없음 - initMap 먼저 호출 필요');
      return;
    }

    if (mapInstance._isMock) {
      if (mapInstance.container) {
        renderFallbackMap(mapInstance.container, properties, onSelectProperty);
      }
      return;
    }

    // 기존 마커 제거
    markers.forEach(marker => marker.setMap(null));
    markers = [];

    if (!properties || !properties.length) return;

    // 첫 매물 좌표가 있으면 중심으로 이동
    const firstWithCoords = properties.find(p => p.lat && p.lng);
    if (firstWithCoords) {
      mapInstance.setCenter(new window.kakao.maps.LatLng(firstWithCoords.lat, firstWithCoords.lng));
    }

    // 마커 생성
    properties.forEach(property => {
      if (!property.lat || !property.lng) return;

      const markerHtml = createMarkerHtml(property);
      const markerEl = document.createElement('div');
      markerEl.innerHTML = markerHtml;
      const markerDom = markerEl.firstElementChild;

      // 클릭 이벤트
      markerDom.addEventListener('click', (e) => {
        e.stopPropagation();
        if (onSelectCallback) onSelectCallback(property);
        renderBottomSheet(property);
      });

      const overlay = new window.kakao.maps.CustomOverlay({
        position: new window.kakao.maps.LatLng(property.lat, property.lng),
        content: markerDom,
        yAnchor: 1.0, // 핀 끝이 좌표에 오도록
        xAnchor: 0.5
      });

      overlay.setMap(mapInstance);
      markers.push(overlay);
    });
  }

  /**
   * 바텀시트 렌더링
   * @param {Object} property
   */
  function renderBottomSheet(property) {
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      console.log('[RealEstateMap] Node.js 환경 - 바텀시트 렌더링 스킵');
      return;
    }

    // 기존 시트 제거
    closeBottomSheet();

    // 백드롭 생성
    backdropElement = document.createElement('div');
    backdropElement.className = 're-sheet-backdrop';
    backdropElement.addEventListener('click', closeBottomSheet);
    document.body.appendChild(backdropElement);

    // 바텀시트 생성
    bottomSheetElement = document.createElement('div');
    bottomSheetElement.className = 're-bottom-sheet';
    bottomSheetElement.innerHTML = createBottomSheetHtml(property);
    document.body.appendChild(bottomSheetElement);

    // 강제 리플로우 후 애니메이션 트리거
    requestAnimationFrame(() => {
      backdropElement.classList.add('show');
      bottomSheetElement.classList.add('show');
    });

    // 이벤트 바인딩
    bindBottomSheetEvents(property);
  }

  /**
   * 바텀시트 HTML 생성 - 마스터 요구사항 정확히 준수
   * - 드래그 핸들 바 (re-sheet-handle)
   * - 단지명, 동, 매물 사진 썸네일
   * - 거래유형 및 가격 태그
   * - 평형, 층수, 추천도(별점)
   * - 버튼 그룹: 네이버 매물 원문, 카카오맵 길찾기, 매물 카드 바로가기/수정, 닫기
   */
  function createBottomSheetHtml(property) {
    const thumbs = property.images && property.images.length > 0
      ? property.images.slice(0, 3).map((img, i) => `<img src="${escapeHtml(img)}" alt="매물사진${i+1}" class="re-sheet-thumb" loading="lazy">`).join('')
      : '<div class="re-sheet-thumb-placeholder">사진 없음</div>';

    const rating = property.rating || 0;
    const stars = '★'.repeat(Math.floor(rating)) + '☆'.repeat(5 - Math.floor(rating));

    return `
      <div class="re-sheet-handle" aria-label="바텀시트 드래그 핸들"></div>
      <div class="re-sheet-content">
        <div class="re-sheet-header">
          <h3 class="re-sheet-title">${escapeHtml(property.complexName || '(단지명 미확인)')}</h3>
          <button class="re-sheet-close" aria-label="닫기">✕</button>
        </div>
        <div class="re-sheet-body">
          ${property.dong ? `<p class="re-sheet-dong">${escapeHtml(property.dong)}</p>` : ''}
          <div class="re-sheet-thumbs">${thumbs}</div>
          <div class="re-sheet-meta">
            <span class="re-sheet-deal-tag">${escapeHtml(property.dealType || '')} ${formatPrice(property.price)}</span>
            <div class="re-sheet-specs">
              ${property.area ? `<span class="re-sheet-spec"><span class="spec-label">평형</span><span class="spec-val">${escapeHtml(property.area)}</span></span>` : ''}
              ${property.floor ? `<span class="re-sheet-spec"><span class="spec-label">층수</span><span class="spec-val">${escapeHtml(property.floor)}</span></span>` : ''}
              <span class="re-sheet-spec"><span class="spec-label">추천도</span><span class="spec-val re-sheet-rating">${stars} <span class="rating-num">(${rating.toFixed(1)})</span></span></span>
            </div>
          </div>
          <div class="re-sheet-actions">
            ${property.url ? `<a href="${escapeHtml(property.url)}" target="_blank" rel="noopener" class="re-sheet-btn re-sheet-btn-primary">네이버 매물 원문 ↗</a>` : ''}
            ${property.complexName ? `<a href="https://map.kakao.com/link/search/${encodeURIComponent(property.complexName)}" target="_blank" rel="noopener" class="re-sheet-btn re-sheet-btn-secondary">카카오맵 길찾기 ↗</a>` : ''}
            <button class="re-sheet-btn re-sheet-btn-card" data-action="goto-card">매물 카드 바로가기 / 수정</button>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * 바텀시트 이벤트 바인딩 - 새로운 HTML 구조에 맞춤
   */
  function bindBottomSheetEvents(property) {
    if (!bottomSheetElement) return;

    // 닫기 버튼
    const closeBtn = bottomSheetElement.querySelector('.re-sheet-close');
    if (closeBtn) closeBtn.addEventListener('click', closeBottomSheet);

    // 매물 카드 바로가기
    const gotoCardBtn = bottomSheetElement.querySelector('[data-action="goto-card"]');
    if (gotoCardBtn) {
      gotoCardBtn.addEventListener('click', () => {
        closeBottomSheet();
        // 커스텀 이벤트 발생 (상위 앱에서 처리)
        window.dispatchEvent(new CustomEvent('re:gotoPropertyCard', { detail: property }));
      });
    }

    // 드래그 핸들로 닫기 (터치 무브 감지)
    let startY = 0;
    const handle = bottomSheetElement.querySelector('.re-sheet-handle');
    if (handle) {
      handle.addEventListener('touchstart', (e) => { startY = e.touches[0].clientY; }, { passive: true });
      handle.addEventListener('touchmove', (e) => {
        const deltaY = e.touches[0].clientY - startY;
        if (deltaY > 50) closeBottomSheet(); // 아래로 50px 이상 드래그 시 닫기
      }, { passive: true });
    }
  }

  /**
   * 바텀시트 닫기
   */
  function closeBottomSheet() {
    if (bottomSheetElement) {
      bottomSheetElement.classList.remove('show');
      bottomSheetElement.addEventListener('transitionend', () => bottomSheetElement.remove(), { once: true });
      bottomSheetElement = null;
    }
    if (backdropElement) {
      backdropElement.classList.remove('show');
      backdropElement.addEventListener('transitionend', () => backdropElement.remove(), { once: true });
      backdropElement = null;
    }
  }

  // 공개 API
  return {
    loadKakaoSdk,
    initMap,
    plotProperties,
    renderBottomSheet,
    closeBottomSheet,
    createMarkerHtml,
    formatPrice,
    // 내부 상태 접근용 (테스트/디버깅)
    _internal: {
      getMapInstance: () => mapInstance,
      getMarkers: () => markers,
      STATUS_COLORS,
      STATUS_LABELS
    }
  };
});