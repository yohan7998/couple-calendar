/**
 * real_estate_engine.js - Unified Real Estate Engine & Multi-Source Normalization Layer
 * Couple-Calendar v2.9.0
 * Supports: UnifiedPropertyCard schema, NaverPropertyAdapter, DaangnPropertyAdapter, RealEstateStore
 */

(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    define([], factory);
  } else if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.RealEstateEngine = factory();
  }
}(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  // ============================================================
  // 1. 유틸리티 함수 (가격 포맷팅, D-Day, 부대비용 등)
  // ============================================================

  function formatKoreanPrice(priceInTenThousand) {
    if (!priceInTenThousand || priceInTenThousand <= 0) return '금액 미확인';
    const num = Math.round(Number(priceInTenThousand));
    const eok = Math.floor(num / 10000);
    const man = num % 10000;
    if (eok > 0) {
      return man > 0 ? `${eok}억 ${man.toLocaleString()}만원` : `${eok}억원`;
    }
    return `${man.toLocaleString()}만원`;
  }

  function parseKoreanPrice(text) {
    if (!text) return { price: 0, deposit: 0, monthlyRent: 0 };
    const clean = String(text).replace(/,/g, '').trim();
    const res = { price: 0, deposit: 0, monthlyRent: 0 };

    // 월세: 보증금/월세 (예: 1억/80, 5000/60, 3000만/50)
    const mMatch = clean.match(/(?:보증금\s*)?(\d+(?:\.\d+)?)\s*(?:억|만)?\s*\/\s*(?:월(?:세)?\s*)?(\d+)/);
    if (mMatch) {
      let depRaw = parseFloat(mMatch[1]);
      if (clean.includes('억') && !clean.includes('만/')) {
        depRaw = depRaw * 10000;
      }
      res.deposit = Math.round(depRaw);
      res.monthlyRent = parseInt(mMatch[2], 10);
      res.price = res.deposit;
      return res;
    }

    let total = 0;
    const eokMatch = clean.match(/(\d+(?:\.\d+)?)\s*억/);
    if (eokMatch) {
      total += parseFloat(eokMatch[1]) * 10000;
    }
    const remain = clean.replace(/.*억\s*/, '').trim();
    const manMatch = remain.match(/(\d+)\s*만/);
    if (manMatch) {
      total += parseInt(manMatch[1], 10);
    } else if (eokMatch) {
      const numMatch = remain.match(/^(\d+)/);
      if (numMatch) total += parseInt(numMatch[1], 10);
    } else {
      const pureNum = clean.match(/^(\d+)$/);
      if (pureNum) total = parseInt(pureNum[1], 10);
    }
    res.price = Math.round(total);
    return res;
  }

  function calculateDDay(dateStr) {
    if (!dateStr) return null;
    try {
      const target = new Date(dateStr.replace(' ', 'T').slice(0, 10));
      if (isNaN(target.getTime())) return null;
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      target.setHours(0, 0, 0, 0);
      const diffMs = target.getTime() - today.getTime();
      const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
      if (diffDays === 0) return 'D-DAY';
      if (diffDays > 0) return `D-${diffDays}`;
      return `D+${Math.abs(diffDays)}`;
    } catch (e) {
      return null;
    }
  }

  function calculateMovingCosts(prop) {
    if (!prop || !prop.price) return { totalEstimatedCost: 0, brokerageFee: 0, movingFee: 0, cleaningFee: 0, acquisitionTax: 0 };
    const priceWon = (prop.price || 0) * 10000;
    const dealType = prop.dealType || '매매';

    // 중개보수 상한요율
    let rate = 0.004;
    let limit = Infinity;
    if (dealType === '매매') {
      if (priceWon < 50000000) { rate = 0.006; limit = 250000; }
      else if (priceWon < 200000000) { rate = 0.005; limit = 800000; }
      else if (priceWon < 900000000) { rate = 0.004; }
      else if (priceWon < 1200000000) { rate = 0.005; }
      else if (priceWon < 1500000000) { rate = 0.006; }
      else { rate = 0.007; }
    } else {
      if (priceWon < 50000000) { rate = 0.005; limit = 200000; }
      else if (priceWon < 100000000) { rate = 0.004; limit = 300000; }
      else if (priceWon < 600000000) { rate = 0.003; }
      else { rate = 0.004; }
    }
    let brokerageFee = Math.min(Math.round(priceWon * rate), limit);

    // 취득세 (매매 한정)
    let acquisitionTax = 0;
    if (dealType === '매매') {
      let taxRate = 0.011; // 6억 이하 지방세 포함
      if (priceWon > 600000000 && priceWon <= 900000000) taxRate = 0.022;
      else if (priceWon > 900000000) taxRate = 0.033;
      acquisitionTax = Math.round(priceWon * taxRate);
    }

    const movingFee = 1200000; // 포장이사 견적
    const cleaningFee = 350000; // 입주청소
    const totalEstimatedCost = brokerageFee + acquisitionTax + movingFee + cleaningFee;

    return {
      brokerageFee,
      acquisitionTax,
      movingFee,
      cleaningFee,
      totalEstimatedCost
    };
  }

  function getAptSvgPlaceholder(name) {
    const initial = (name || '집').trim().slice(0, 2);
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200">` +
      `<defs><linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">` +
      `<stop offset="0%" stop-color="#FFE4E8"/>` +
      `<stop offset="100%" stop-color="#FFCCD6"/>` +
      `</linearGradient></defs>` +
      `<rect width="200" height="200" rx="24" fill="url(#g)"/>` +
      `<path d="M50 140V85l50-35 50 35v55H50z" fill="#FFFFFF" opacity="0.9"/>` +
      `<rect x="75" y="95" width="18" height="18" rx="3" fill="#F43F5E" opacity="0.75"/>` +
      `<rect x="107" y="95" width="18" height="18" rx="3" fill="#F43F5E" opacity="0.75"/>` +
      `<rect x="90" y="120" width="20" height="20" rx="2" fill="#E11D48"/>` +
      `<text x="100" y="175" font-family="sans-serif" font-size="16" font-weight="bold" fill="#9F1239" text-anchor="middle">${initial}</text>` +
      `</svg>`;
    return 'data:image/svg+xml;utf8,' + encodeURIComponent(svg);
  }

  // ============================================================
  // 2. UnifiedPropertyCard 공통 스키마 생성 팩토리
  // ============================================================

  function createUnifiedProperty(data = {}) {
    const now = new Date().toISOString();
    const price = Number(data.price) || 0;
    const dealType = data.dealType || '매매';
    const deposit = Number(data.deposit) || 0;
    const monthlyRent = Number(data.monthlyRent) || 0;

    let formattedPrice = '';
    if (dealType === '월세' && monthlyRent > 0) {
      formattedPrice = `보증금 ${formatKoreanPrice(deposit || price)} / 월 ${monthlyRent}만`;
    } else {
      formattedPrice = `${dealType} ${formatKoreanPrice(price)}`;
    }

    const complexName = (data.complexName || data.title || '').trim() || '(단지명 미입력)';
    const visitDate = data.visitDate || '';
    const dDay = visitDate ? calculateDDay(visitDate) : null;

    let thumb = data.thumbnailUrl || data.imageUrl || '';
    if (!thumb || thumb.includes('land.pstatic.net') || thumb.includes('placeholder')) {
      thumb = getAptSvgPlaceholder(complexName);
    }

    return {
      id: data.id || `prop_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      source: data.source || 'manual', // 'naver' | 'daangn' | 'manual'
      sourceUrl: data.sourceUrl || data.url || '',
      sourceId: data.sourceId || '',
      complexName: complexName,
      building: data.building || '',
      dealType: dealType,
      price: price,
      deposit: deposit,
      monthlyRent: monthlyRent,
      formattedPrice: formattedPrice,
      region: (data.region || '').trim(),
      area: (data.area || '').trim(),
      floor: (data.floor || '').trim(),
      thumbnailUrl: thumb,
      coupleMemo: data.coupleMemo || data.notes || '',
      visitDate: visitDate,
      dDay: dDay,
      likes: Array.isArray(data.likes) ? data.likes : (data.likes ? [data.likes] : []),
      comments: Array.isArray(data.comments) ? data.comments : [],
      status: data.status || 'candidate',
      rating: Number(data.rating) || 3.0,
      checklist: data.checklist || {},
      agentContact: data.agentContact || '',
      rawText: data.rawText || '',
      createdAt: data.createdAt || now,
      updatedAt: now
    };
  }

  // ============================================================
  // 3. NaverPropertyAdapter & DaangnPropertyAdapter
  // ============================================================

  const NaverPropertyAdapter = {
    matches(input) {
      if (!input || typeof input !== 'string') return false;
      const lower = input.toLowerCase();
      return lower.includes('naver.me') || lower.includes('land.naver.com') || input.includes('네이버 부동산') || input.includes('네이버부동산');
    },

    parse(input) {
      const text = String(input).trim();
      const res = {
        source: 'naver',
        sourceUrl: '',
        complexName: '',
        building: '',
        dealType: '매매',
        price: 0,
        deposit: 0,
        monthlyRent: 0,
        region: '',
        area: '',
        floor: '',
        coupleMemo: ''
      };

      // URL 추출
      const urlMatch = text.match(/https?:\/\/(?:naver\.me|m\.land\.naver\.com|fin\.land\.naver\.com|land\.naver\.com)[^\s)]+/);
      if (urlMatch) {
        res.sourceUrl = urlMatch[0];
      }

      // 거래유형 파악
      if (text.includes('전세')) res.dealType = '전세';
      else if (text.includes('월세')) res.dealType = '월세';
      else if (text.includes('매매')) res.dealType = '매매';

      // 가격 파싱
      const priceParsed = parseKoreanPrice(text);
      res.price = priceParsed.price;
      res.deposit = priceParsed.deposit;
      res.monthlyRent = priceParsed.monthlyRent;

      // 단지명 및 동정보 추출
      const clean = text
        .replace(/\[네이버\s*부동산\]/gi, '')
        .replace(/https?:\/\/[^\s)]+/g, '')
        .trim();

      const dongMatch = clean.match(/([가-힣A-Za-z0-9()]+(?:단지|아파트|오피스텔|빌라|팰리스|아이파크|자이|푸르지오|더샵|e편한세상|원베일리|그랑블|푸르지오그랑블|파크리오|트리지움|엘스|리센츠)?)\s*(\d+동|[가-힣]동)?/);
      if (dongMatch && dongMatch[1]) {
        res.complexName = dongMatch[1].trim();
        if (dongMatch[2]) res.building = dongMatch[2].trim();
      }

      // 면적 추출
      const areaMatch = clean.match(/(\d+(?:\.\d+)?[A-Za-z]?\s*(?:㎡|평))/);
      if (areaMatch) res.area = areaMatch[1];

      // 층수 추출
      const floorMatch = clean.match(/(\d+\/\d+층|고\/\d+층|중\/\d+층|저\/\d+층|\d+층)/);
      if (floorMatch) res.floor = floorMatch[1];

      return createUnifiedProperty(res);
    }
  };

  const DaangnPropertyAdapter = {
    matches(input) {
      if (!input || typeof input !== 'string') return false;
      const lower = input.toLowerCase();
      return lower.includes('daangn.com') || input.includes('당근마켓') || input.includes('당근부동산') || input.includes('당근 부동산');
    },

    parse(input) {
      const text = String(input).trim();
      const res = {
        source: 'daangn',
        sourceUrl: '',
        complexName: '',
        building: '',
        dealType: '전세',
        price: 0,
        deposit: 0,
        monthlyRent: 0,
        region: '',
        area: '',
        floor: '',
        coupleMemo: ''
      };

      // URL 추출
      const urlMatch = text.match(/https?:\/\/(?:www\.)?(?:daangn\.com|kr\.karrotmarket\.com)[^\s)]+/);
      if (urlMatch) {
        res.sourceUrl = urlMatch[0];
      }

      // 거래유형
      if (text.includes('월세')) res.dealType = '월세';
      else if (text.includes('매매')) res.dealType = '매매';
      else res.dealType = '전세';

      // 가격 파싱
      const priceParsed = parseKoreanPrice(text);
      res.price = priceParsed.price;
      res.deposit = priceParsed.deposit;
      res.monthlyRent = priceParsed.monthlyRent;

      // 동네/지역 추출
      const dongMatch = text.match(/([가-힣]{2,4}[동|읍|면|리])/);
      if (dongMatch) {
        res.region = dongMatch[1];
      }

      // 매물명
      const clean = text
        .replace(/\[당근\s*부동산\]/gi, '')
        .replace(/\[당근마켓\]/gi, '')
        .replace(/https?:\/\/[^\s)]+/g, '')
        .trim();

      const nameMatch = clean.match(/(?:매물[:\s]*)?([^,\n]+?)(?:\s+전세|\s+월세|\s+매매|\s+\d+억|\s+\d+만|$)/);
      if (nameMatch && nameMatch[1]) {
        res.complexName = nameMatch[1].trim();
      } else {
        res.complexName = (res.region ? `${res.region} ` : '') + '당근 매물';
      }

      // 면적
      const areaMatch = clean.match(/(\d+(?:\.\d+)?\s*(?:㎡|평))/);
      if (areaMatch) res.area = areaMatch[1];

      // 층수
      const floorMatch = clean.match(/(\d+\/\d+층|\d+층|반지하|옥탑)/);
      if (floorMatch) res.floor = floorMatch[1];

      return createUnifiedProperty(res);
    }
  };

  function parsePropertyText(text) {
    if (!text || typeof text !== 'string') return null;
    const clean = text.trim();
    if (!clean) return null;

    if (DaangnPropertyAdapter.matches(clean)) {
      return DaangnPropertyAdapter.parse(clean);
    }
    if (NaverPropertyAdapter.matches(clean)) {
      return NaverPropertyAdapter.parse(clean);
    }

    // 기본 일반 텍스트 파싱
    const isUrl = clean.startsWith('http://') || clean.startsWith('https://');
    const p = NaverPropertyAdapter.parse(clean);
    p.source = 'manual';
    if (isUrl) p.isUrlOnly = true;
    return p;
  }

  // ============================================================
  // 4. RealEstateStore v2.0 (CRUD, 통계 계산, 필터/정렬)
  // ============================================================

  class RealEstateStore {
    constructor(initialProperties = []) {
      this.properties = (Array.isArray(initialProperties) ? initialProperties : []).map(p => createUnifiedProperty(p));
    }

    getAll() {
      return this.properties;
    }

    getProperty(id) {
      return this.properties.find(p => p.id === id) || null;
    }

    addProperty(propData) {
      const unified = createUnifiedProperty(propData);
      this.properties.unshift(unified);
      return unified;
    }

    updateProperty(id, updateData) {
      const idx = this.properties.findIndex(p => p.id === id);
      if (idx === -1) return null;
      const updated = createUnifiedProperty(Object.assign({}, this.properties[idx], updateData));
      this.properties[idx] = updated;
      return updated;
    }

    deleteProperty(id) {
      const idx = this.properties.findIndex(p => p.id === id);
      if (idx !== -1) {
        this.properties.splice(idx, 1);
        return true;
      }
      return false;
    }

    toggleLike(id, userName) {
      const prop = this.getProperty(id);
      if (!prop) return false;
      if (!Array.isArray(prop.likes)) prop.likes = [];
      const user = userName || '나';
      const idx = prop.likes.indexOf(user);
      if (idx !== -1) {
        prop.likes.splice(idx, 1);
      } else {
        prop.likes.push(user);
      }
      prop.updatedAt = new Date().toISOString();
      return true;
    }

    addComment(id, commentObj) {
      const prop = this.getProperty(id);
      if (!prop) return null;
      if (!Array.isArray(prop.comments)) prop.comments = [];
      const newComment = {
        id: `cmt_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
        author: commentObj.author || '부부',
        text: (commentObj.text || '').trim(),
        createdAt: new Date().toISOString()
      };
      prop.comments.push(newComment);
      prop.coupleMemo = newComment.text; // 최신 코멘트를 카드 대표 메모로 승격
      prop.updatedAt = new Date().toISOString();
      return newComment;
    }

    getRegions() {
      const set = new Set();
      this.properties.forEach(p => {
        if (p.region && p.region.trim()) set.add(p.region.trim());
      });
      return Array.from(set);
    }

    filterProperties(options = {}) {
      const {
        region = 'all',
        status = 'all',
        dealType = 'all',
        sortBy = 'created_desc',
        query = '',
        likedOnly = false,
        likedBy = null
      } = options;

      let list = [...this.properties];

      if (region && region !== 'all') {
        list = list.filter(p => p.region === region);
      }
      if (status && status !== 'all') {
        list = list.filter(p => p.status === status);
      }
      if (dealType && dealType !== 'all') {
        list = list.filter(p => p.dealType === dealType);
      }
      if (likedOnly) {
        list = list.filter(p => Array.isArray(p.likes) && p.likes.length > 0);
      }
      if (likedBy) {
        list = list.filter(p => Array.isArray(p.likes) && p.likes.includes(likedBy));
      }
      if (query && query.trim()) {
        const q = query.trim().toLowerCase();
        list = list.filter(p =>
          (p.complexName && p.complexName.toLowerCase().includes(q)) ||
          (p.region && p.region.toLowerCase().includes(q)) ||
          (p.coupleMemo && p.coupleMemo.toLowerCase().includes(q)) ||
          (p.building && p.building.toLowerCase().includes(q))
        );
      }

      // 정렬
      list.sort((a, b) => {
        if (sortBy === 'price_asc') return (a.price || 0) - (b.price || 0);
        if (sortBy === 'price_desc') return (b.price || 0) - (a.price || 0);
        if (sortBy === 'rating_desc') return (b.rating || 0) - (a.rating || 0);
        if (sortBy === 'visit_asc') {
          if (!a.visitDate) return 1;
          if (!b.visitDate) return -1;
          return a.visitDate.localeCompare(b.visitDate);
        }
        // 기본 최신순
        return (b.createdAt || '').localeCompare(a.createdAt || '');
      });

      return list;
    }

    /**
     * 캘린더 메인 상단 위젯을 위한 찜(♥) 매물 요약 통계 계산
     * @param {string} [currentUser]
     * @returns {Object} { count, saleAvgPrice, leaseAvgPrice, nearestVisit, favorites }
     */
    getFavoriteSummary(currentUser) {
      // 찜한 매물 (사용자 지정 시 해당 사용자, 없으면 1명이라도 찜한 매물)
      let favs = this.properties.filter(p => {
        if (Array.isArray(p.likes) && p.likes.length > 0) {
          if (currentUser) return p.likes.includes(currentUser) || p.likes.length > 0;
          return true;
        }
        return p.status === 'favorite' || p.status === 'candidate';
      });

      // 만약 찜 매물이 전혀 없다면 전체 매물 중 최신 4개를 후보로 제공
      if (favs.length === 0 && this.properties.length > 0) {
        favs = this.properties.slice(0, 4);
      }

      const sales = favs.filter(p => p.dealType === '매매' && p.price > 0);
      const leases = favs.filter(p => p.dealType === '전세' && p.price > 0);

      const saleAvg = sales.length > 0
        ? Math.round(sales.reduce((sum, p) => sum + p.price, 0) / sales.length)
        : 0;
      const leaseAvg = leases.length > 0
        ? Math.round(leases.reduce((sum, p) => sum + p.price, 0) / leases.length)
        : 0;

      // 가장 가까운 다가오는 임장일 찾기
      const today = new Date().toISOString().slice(0, 10);
      const upcomingVisits = favs
        .filter(p => p.visitDate && p.visitDate.slice(0, 10) >= today)
        .sort((a, b) => a.visitDate.localeCompare(b.visitDate));

      const nearest = upcomingVisits.length > 0 ? {
        property: upcomingVisits[0],
        date: upcomingVisits[0].visitDate,
        dDay: calculateDDay(upcomingVisits[0].visitDate),
        complexName: upcomingVisits[0].complexName
      } : null;

      return {
        count: favs.length,
        saleAvgPrice: saleAvg,
        leaseAvgPrice: leaseAvg,
        saleAvgFormatted: saleAvg > 0 ? formatKoreanPrice(saleAvg) : '-',
        leaseAvgFormatted: leaseAvg > 0 ? formatKoreanPrice(leaseAvg) : '-',
        nearestVisit: nearest,
        favorites: favs.map(p => ({
          ...p,
          dDay: p.visitDate ? calculateDDay(p.visitDate) : null
        }))
      };
    }
  }

  // ============================================================
  // 내보내기
  // ============================================================
  return {
    createUnifiedProperty,
    NaverPropertyAdapter,
    DaangnPropertyAdapter,
    RealEstateStore,
    parsePropertyText,
    formatKoreanPrice,
    parseKoreanPrice,
    calculateDDay,
    calculateMovingCosts,
    getAptSvgPlaceholder
  };
}));
