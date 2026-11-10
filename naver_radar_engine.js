/**
 * NaverRadarEngine - 네이버 부동산 실시간 레이더 코어 엔진
 * UMD 모듈 패턴: 브라우저 window.NaverRadarEngine 및 Node.js module.exports 호환
 */
(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    define([], factory);
  } else if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.NaverRadarEngine = factory();
  }
}(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  // ============================================================
  // 상수 및 매핑 테이블
  // ============================================================
  const TRADE_TYPE_MAP = {
    'A1': '매매',
    'B1': '전세',
    'B2': '월세',
    '매매': 'A1',
    '전세': 'B1',
    '월세': 'B2'
  };

  const REAL_ESTATE_TYPE_MAP = {
    'APT': '아파트',
    'OPST': '오피스텔',
    'ABYG': '주상복합',
    '아파트': 'APT',
    '오피스텔': 'OPST',
    '주상복합': 'ABYG'
  };

  const CLUSTER_API_BASE = 'https://m.land.naver.com/cluster/ajax/articleList';
  const FRONT_API_BASE = 'https://fin.land.naver.com/front-api/v1';

  // ============================================================
  // Mock 데이터셋 (3단계 폴백용 고품질 샘플)
  // ============================================================
  const MOCK_COMPLEXES = [
    {
      complexNo: '101905',
      complexName: '마포래미안푸르지오',
      cortarNo: '1168010300',
      address: '서울특별시 마포구 아현동 765',
      totalHouseholds: 3885,
      buildYear: 2014,
      dongCount: 38,
      maxFloor: 25,
      lat: 37.5502,
      lng: 126.9548,
      sampleArticles: generateMockArticles('마포래미안푸르지오', '101905', 15)
    },
    {
      complexNo: '125138',
      complexName: '헬리오시티',
      cortarNo: '1171010500',
      address: '서울특별시 송파구 가락동 479',
      totalHouseholds: 9510,
      buildYear: 2018,
      dongCount: 84,
      maxFloor: 35,
      lat: 37.4917,
      lng: 127.1186,
      sampleArticles: generateMockArticles('헬리오시티', '125138', 20)
    },
    {
      complexNo: '105990',
      complexName: '판교푸르지오그랑블',
      cortarNo: '4113510300',
      address: '경기도 성남시 분당구 판교동 643',
      totalHouseholds: 1224,
      buildYear: 2021,
      dongCount: 12,
      maxFloor: 29,
      lat: 37.3949,
      lng: 127.1112,
      sampleArticles: generateMockArticles('판교푸르지오그랑블', '105990', 12)
    },
    {
      complexNo: '196721',
      complexName: '래미안원베일리',
      cortarNo: '1165010700',
      address: '서울특별시 서초구 반포동 12-1',
      totalHouseholds: 2990,
      buildYear: 2023,
      dongCount: 29,
      maxFloor: 35,
      lat: 37.5044,
      lng: 127.0053,
      sampleArticles: generateMockArticles('래미안원베일리', '196721', 10)
    },
    {
      complexNo: '124278',
      complexName: '과천푸르지오써밋',
      cortarNo: '4129010600',
      address: '경기도 과천시 갈현동 651',
      totalHouseholds: 1571,
      buildYear: 2022,
      dongCount: 17,
      maxFloor: 35,
      lat: 37.4292,
      lng: 127.0082,
      sampleArticles: generateMockArticles('과천푸르지오써밋', '124278', 8)
    },
    {
      complexNo: '153094',
      complexName: '엘리프미아역2단지(주상복합)',
      cortarNo: '1130510100',
      address: '서울특별시 강북구 미아동 195',
      totalHouseholds: 182,
      buildYear: 2026,
      dongCount: 2,
      maxFloor: 24,
      lat: 37.6288,
      lng: 127.0258,
      sampleArticles: [
        {
          atclNo: '2659062699',
          cortarNo: '1130510100',
          rletTpCd: 'ABYG',
          tradTpCd: 'A1',
          atclNm: '엘리프미아역2단지(주상복합) 202동',
          flrInfo: '중/24층',
          spc1: 119,
          spc2: 84,
          prc: 118725,
          dealPrice: 118725,
          rentPrc: 0,
          direction: '남서향',
          atclFetrDesc: '달님, 84A 뻥뷰 확장형 풀에어컨 드레스룸',
          rltrNm: '현장 확인매물 (2026.11.03)',
          buildingName: '202동',
          cplyNm: '엘리프미아역2단지(주상복합)',
          cplxNm: '엘리프미아역2단지(주상복합)',
          complexName: '엘리프미아역2단지(주상복합)',
          complexNo: '153094',
          repImgUrl: 'https://land.pstatic.net/is/default/apt_d.png'
        },
        ...generateMockArticles('엘리프미아역2단지(주상복합)', '153094', 7)
      ]
    }
  ];

  // ============================================================
  // Mock 데이터 생성 헬퍼
  // ============================================================
  function generateMockArticles(complexName, complexNo, count) {
    const articles = [];
    const directions = ['남향', '남동향', '남서향', '동향', '서향', '북향'];
    const features = ['확장형', '올수리', '시스템에어컨', '입주협의', '로열동', '초역세권', '특올수리', '첫입주'];
    const realtors = ['강남부동산', '래미안공인중개사', '푸르지오부동산', '헬리오공인중개사', '판교부동산', '원베일리공인'];

    for (let i = 0; i < count; i++) {
      const dealType = ['A1', 'B1', 'B2'][Math.floor(Math.random() * 3)];
      const area1 = 84 + Math.floor(Math.random() * 40); // 공급면적 84~123
      const area2 = Math.round(area1 * 0.75); // 전용면적 약 75%
      const pyeong = Math.round(area2 / 3.3058 * 10) / 10;
      const floor = Math.floor(Math.random() * 30) + 1;
      const maxFloor = 25 + Math.floor(Math.random() * 10);
      const direction = directions[Math.floor(Math.random() * directions.length)];
      const featureCount = Math.floor(Math.random() * 3) + 1;
      const shuffledFeatures = [...features].sort(() => Math.random() - 0.5);
      const selectedFeatures = shuffledFeatures.slice(0, featureCount);

      let price, rentPrice;
      if (dealType === 'A1') { // 매매
        const basePrice = complexName.includes('래미안원베일리') || complexName.includes('과천푸르지오써밋') ? 250000 :
                          complexName.includes('헬리오시티') ? 180000 : 150000;
        price = basePrice + Math.floor(Math.random() * 50000) - 25000;
        rentPrice = 0;
      } else if (dealType === 'B1') { // 전세
        const basePrice = complexName.includes('래미안원베일리') ? 120000 :
                          complexName.includes('헬리오시티') ? 90000 : 70000;
        price = basePrice + Math.floor(Math.random() * 30000) - 15000;
        rentPrice = 0;
      } else { // 월세
        price = 30000 + Math.floor(Math.random() * 50000); // 보증금
        rentPrice = 100 + Math.floor(Math.random() * 200); // 월세
      }

      articles.push({
        atclNo: `${complexNo}${String(i + 1).padStart(4, '0')}`,
        atclNm: `${complexName} ${Math.floor(Math.random() * 38) + 1}동`,
        cplxNm: complexName,
        cplxNo: complexNo,
        tradTpCd: dealType,
        prc: price.toString(),
        rentPrc: rentPrice.toString(),
        spc1: area1.toString(),
        spc2: area2.toString(),
        flrInfo: `${floor}/${maxFloor}`,
        direction: direction,
        atclFetrDesc: selectedFeatures.join(', '),
        rltorNm: realtors[Math.floor(Math.random() * realtors.length)],
        imgUrl: `https://img.land.naver.net/placeholder/${complexNo}_${i}.jpg`,
        tagList: selectedFeatures.map(f => `#${f}`)
      });
    }
    return articles;
  }

  // ============================================================
  // 공개 API
  // ============================================================

  function parseKoreanPrice(priceText) {
    if (!priceText) return 0;
    if (typeof priceText === 'number') return Math.round(priceText);
    const text = String(priceText).replace(/,/g, '').trim();
    if (!isNaN(text) && text !== '') {
      return parseInt(text, 10);
    }
    let total = 0;
    const eokMatch = text.match(/(\d+(?:\.\d+)?)\s*억/);
    if (eokMatch) {
      total += parseFloat(eokMatch[1]) * 10000;
    }
    const remain = text.replace(/.*억\s*/, '').trim();
    const manMatch = remain.match(/(\d+(?:\.\d+)?)\s*만/);
    if (manMatch) {
      total += parseFloat(manMatch[1]);
    } else if (eokMatch) {
      const numMatch = remain.match(/^(\d+)/);
      if (numMatch) total += parseInt(numMatch[1], 10);
    } else {
      const numMatch = text.match(/^(\d+)/);
      if (numMatch) total += parseInt(numMatch[1], 10);
    }
    return Math.round(total);
  }

  /**
   * 네이버 클러스터 API 요청 URL 빌더
   * @param {Object} options - 요청 옵션
   * @returns {string} 완성된 API 요청 URL
   */
  function buildClusterUrl(options) {
    options = options || {};

    // 1. 단지 번호가 있는 경우 단지 아티클 목록 엔드포인트
    if (options.complexNumber) {
      const cNo = options.complexNumber;
      const params = new URLSearchParams();
      const tradeType = options.tradTpCd || options.tradeType;
      const rletType = options.rletTpCd || options.realEstateType;
      if (tradeType) params.set('tradeType', tradeType);
      if (rletType) params.set('realEstateType', rletType);
      if (options.page) params.set('page', options.page);
      return `https://m.land.naver.com/articles/complex/${cNo}?${params.toString()}`;
    }

    // 2. 지도 바운딩박스/단일 마커 모드
    if (options.bounds || options.zoom || options.cortarNo) {
      const params = new URLSearchParams();
      if (options.cortarNo) params.set('cortarNo', options.cortarNo);
      if (options.zoom !== undefined) params.set('z', options.zoom);
      if (options.bounds) {
        const b = options.bounds;
        if (b.south !== undefined) params.set('btm', b.south);
        if (b.west !== undefined) params.set('lft', b.west);
        if (b.north !== undefined) params.set('top', b.north);
        if (b.east !== undefined) params.set('rgt', b.east);
      }
      return `https://m.land.naver.com/complexes/single-markers?${params.toString()}`;
    }

    // 3. 기본 클러스터 목록 폴백
    const params = new URLSearchParams();
    if (options.tradTpCd) params.set('tradTpCd', options.tradTpCd);
    if (options.rletTpCd) params.set('rletTpCd', options.rletTpCd);
    params.set('page', options.page || 1);
    params.set('order', 'rank_');

    return `${CLUSTER_API_BASE}?${params.toString()}`;
  }

  /**
   * 네이버 Front API - 매물 상세정보 요청 URL 빌더
   * @param {string} articleNo - 매물 번호
   * @returns {string} Front API basicInfo URL
   */
  function buildFrontBasicInfoUrl(articleNo) {
    return `${FRONT_API_BASE}/article/basicInfo?articleNo=${articleNo}`;
  }

  /**
   * 네이버 Front API - 단지 상세정보 요청 URL 빌더
   * @param {string} complexNo - 단지 번호
   * @returns {string} Front API complex URL
   */
  function buildFrontComplexUrl(complexNo) {
    return `${FRONT_API_BASE}/complex?complexNo=${complexNo}`;
  }

  /**
   * 네이버 원문 및 단지 상세 이동 URL 생성
   * @param {string} atclNo - 매물 번호
   * @param {string} [complexNo] - 단지 번호
   * @param {string} [complexName] - 단지명
   * @returns {string} 정상 연결 보장 네이버 URL
   */
  function getNaverArticleUrl(atclNo, complexNo, complexName) {
    // 1. 단지 번호가 있는 경우 네이버 단지 상세 페이지로 직결 (404 방지)
    if (complexNo && /^\d{4,8}$/.test(String(complexNo))) {
      return `https://fin.land.naver.com/complexes/${complexNo}`;
    }
    // 2. 10자리 실제 네이버 매물 번호인 경우 매물 상세 페이지
    if (atclNo && /^\d{10}$/.test(String(atclNo))) {
      return `https://fin.land.naver.com/articles/${atclNo}`;
    }
    // 3. 테스트나 모의 번호인 경우 articles/{atclNo} 호환성 유지
    if (atclNo && String(atclNo).length >= 8) {
      return `https://fin.land.naver.com/articles/${atclNo}`;
    }
    // 4. 단지명이 있는 경우 네이버 부동산 실시간 검색 결과
    if (complexName) {
      return `https://fin.land.naver.com/search?keyword=${encodeURIComponent(complexName)}`;
    }
    return 'https://fin.land.naver.com';
  }

  /**
   * 네이버 원본 매물 JSON을 표준 RadarProperty 객체로 정규화
   * @param {Object} raw - 네이버 클러스터/프론트 API 원본 응답 아이템
   * @returns {Object} 정규화된 RadarProperty 객체
   */
  function normalizeArticle(raw) {
    if (!raw) return null;

    const dealTypeCode = raw.tradTpCd || raw.tradeTypeCode || raw.tradeType || '';
    const dealType = TRADE_TYPE_MAP[dealTypeCode] || dealTypeCode || '알수없음';

    // 면적 파싱 (공급/전용)
    const area1 = parseFloat(raw.spc1 || raw.area1 || 0); // 공급면적
    const area2 = parseFloat(raw.spc2 || raw.area2 || 0); // 전용면적
    const pyeong = area1 > 0 ? Math.round(area1 / 3.30578) : (area2 > 0 ? Math.round(area2 / 3.30578) : 0);

    // 가격 파싱 (만원 단위 정수)
    const rawPrice = raw.dealPrice || raw.dealOrWarrantPrc || raw.prc || raw.price || 0;
    const price = parseKoreanPrice(rawPrice);
    const rentPrice = parseInt(raw.rentPrc || raw.rentPrice || 0, 10);

    const atclNo = String(raw.atclNo || raw.articleNo || '');
    const complexName = raw.cplxNm || raw.complexName || '';
    const complexNo = String(raw.cplxNo || raw.complexNo || '');
    const articleName = raw.atclNm || raw.articleName || (complexName ? `${complexName} 매물` : '');

    // 특징 태그 파싱
    let tags = [];
    if (raw.tagList && Array.isArray(raw.tagList)) {
      tags = raw.tagList.map(t => String(t).replace(/^#/, ''));
    } else if (raw.atclFetrDesc) {
      tags = raw.atclFetrDesc.split(',').map(t => t.trim()).filter(Boolean);
    }

    return {
      atclNo: atclNo,
      atclNm: articleName,
      complexName: complexName,
      complexNo: complexNo,
      dealType: dealType,
      tradTpCd: dealTypeCode,
      price: price,
      rentPrice: rentPrice,
      area1: area1,
      area2: area2,
      pyeong: pyeong,
      floorInfo: raw.flrInfo || raw.floorInfo || '',
      direction: raw.direction || '',
      tags: tags,
      featureDesc: raw.atclFetrDesc || '',
      thumbnailUrl: raw.imgUrl || raw.thumbnailUrl || '',
      realtorName: raw.rltorNm || raw.realtorName || '',
      naverUrl: getNaverArticleUrl(atclNo, complexNo, complexName),
      pricePerPyeong: pyeong > 0 ? Math.round(price / pyeong) : 0
    };
  }

  /**
   * 평단가 계산 (만원 단위 정수)
   * @param {number} price - 가격 (만원)
   * @param {number} pyeong - 전용평형 (평)
   * @returns {number} 평당가 (만원/평, 정수)
   */
  function calcPricePerPyeong(price, pyeong) {
    if (!pyeong || pyeong <= 0) return 0;
    return Math.round(price / pyeong);
  }

  /**
   * 키워드 기반 특징 태그 감지
   * @param {string[]} tags - 특징 태그 배열
   * @param {string} desc - 매물 설명
   * @returns {string[]} 감지된 프리미엄 태그
   */
  function detectKeyFeatures(tags, desc) {
    const keywords = {
      '초역세권': ['역세권', '초역세', '도보', '지하철'],
      '올수리': ['올수리', '전체수리', '풀리모델링'],
      '시스템에어컨': ['시스템에어컨', '천장에어컨', '빌트인에어컨'],
      '로열동': ['로열동', '로얄동', '명당동'],
      '첫입주': ['첫입주', '신축', '첫입주'],
      '입주협의': ['입주협의', '즉시입주', '협의입주'],
      '확장형': ['확장형', '발코니확장', '확장'],
      '특올수리': ['특올수리', '특급올수리']
    };

    const text = [...(tags || []), desc || ''].join(' ').toLowerCase();
    const detected = [];

    for (const [tag, kwList] of Object.entries(keywords)) {
      if (kwList.some(kw => text.includes(kw))) {
        detected.push(tag);
      }
    }
    return detected;
  }

  /**
   * Mock 단지 데이터 전체 조회
   * @returns {Array} Mock 단지 리스트
   */
  function getSampleComplexes() {
    return MOCK_COMPLEXES.map(c => ({
      complexNo: c.complexNo,
      complexName: c.complexName,
      cortarNo: c.cortarNo,
      address: c.address,
      totalHouseholds: c.totalHouseholds,
      buildYear: c.buildYear,
      dongCount: c.dongCount,
      maxFloor: c.maxFloor,
      lat: c.lat,
      lng: c.lng
    }));
  }

  /**
   * 키워드/거래유형으로 Mock 매물 검색 및 필터링
   * @param {string} keyword - 검색어 (단지명, 지역명)
   * @param {string} [dealType] - 거래유형 필터 ('매매'|'전세'|'월세'|'A1'|'B1'|'B2')
   * @param {Object} [options] - 추가 옵션
   * @param {number} [options.limit=50] - 최대 반환 개수
   * @param {string} [options.sortBy='price'] - 정렬 기준 ('price'|'area'|'floor')
   * @param {string} [options.sortOrder='asc'] - 정렬 순서 ('asc'|'desc')
   * @returns {Array} 정규화된 RadarProperty 배열
   */
  function searchSampleComplexes(keyword, dealType, options = {}) {
    const limit = options.limit || 50;
    const sortBy = options.sortBy || 'price';
    const sortOrder = options.sortOrder || 'asc';

    // 거래유형 코드 정규화 (한글 라벨 -> 코드 변환)
    let targetTradCd = null;
    if (dealType && dealType !== 'all' && dealType !== '전체') {
      // dealType이 이미 코드(A1/B1/B2)면 그대로, 라벨(매매/전세/월세)이면 코드로 변환
      targetTradCd = TRADE_TYPE_MAP[dealType] || dealType;
    }

    // 키워드로 단지 필터링
    const keywordLower = (keyword || '').toLowerCase().trim();
    let matchedComplexes = MOCK_COMPLEXES;

    if (keywordLower) {
      matchedComplexes = MOCK_COMPLEXES.filter(c =>
        c.complexName.toLowerCase().includes(keywordLower) ||
        c.address.toLowerCase().includes(keywordLower)
      );
    }

    // 매물 수집 및 정규화
    let allArticles = [];
    for (const complex of matchedComplexes) {
      for (const rawArticle of complex.sampleArticles) {
        // 거래유형 필터
        if (targetTradCd && rawArticle.tradTpCd !== targetTradCd) continue;

        const normalized = normalizeArticle(rawArticle);
        normalized.complexNo = complex.complexNo;
        normalized.cortarNo = complex.cortarNo;
        allArticles.push(normalized);
      }
    }

    // 정렬
    allArticles.sort((a, b) => {
      let valA = a[sortBy];
      let valB = b[sortBy];

      if (sortBy === 'price') {
        valA = a.price;
        valB = b.price;
      } else if (sortBy === 'area') {
        valA = a.area2;
        valB = b.area2;
      } else if (sortBy === 'floor') {
        const floorA = parseInt(a.floorInfo?.split('/')[0] || 0);
        const floorB = parseInt(b.floorInfo?.split('/')[0] || 0);
        valA = floorA;
        valB = floorB;
      } else if (sortBy === 'pricePerPyeong') {
        valA = a.pricePerPyeong;
        valB = b.pricePerPyeong;
      }

      if (typeof valA === 'string') valA = valA.localeCompare(valB);
      if (typeof valA === 'number' && typeof valB === 'number') {
        return sortOrder === 'asc' ? valA - valB : valB - valA;
      }
      return 0;
    });

    return allArticles.slice(0, limit);
  }

  /**
   * 단지명으로 Mock 단지 상세 조회
   * @param {string} complexName - 단지명
   * @returns {Object|null} 단지 정보 + 매물 리스트
   */
  function getComplexDetail(complexName) {
    const complex = MOCK_COMPLEXES.find(c =>
      c.complexName === complexName ||
      c.complexNo === complexName
    );
    if (!complex) return null;

    return {
      ...complex,
      articles: complex.sampleArticles.map(raw => normalizeArticle(raw))
    };
  }

  /**
   * articleId(매물번호)로 실시간 레이더 풀에서 매물 상세 조회
   * @param {string|number} articleId
   * @returns {Object|null}
   */
  function findArticleById(articleId) {
    if (!articleId) return null;
    const targetId = String(articleId).trim();
    for (const complex of MOCK_COMPLEXES) {
      if (!complex.sampleArticles) continue;
      const found = complex.sampleArticles.find(a => String(a.atclNo) === targetId);
      if (found) {
        return normalizeArticle({
          ...found,
          cplxNm: complex.complexName,
          complexName: complex.complexName,
          cplxNo: complex.complexNo,
          complexNo: complex.complexNo,
          lat: complex.lat,
          lng: complex.lng
        });
      }
    }
    return null;
  }

  /**
   * 거래유형 코드 ↔ 한글 변환 유틸
   */
  function getTradeTypeLabel(code) {
    return TRADE_TYPE_MAP[code] || code;
  }

  function getTradeTypeCode(label) {
    return TRADE_TYPE_MAP[label] || label;
  }

  /**
   * 매물유형 코드 ↔ 한글 변환 유틸
   */
  function getRealEstateTypeLabel(code) {
    return REAL_ESTATE_TYPE_MAP[code] || code;
  }

  function getRealEstateTypeCode(label) {
    return REAL_ESTATE_TYPE_MAP[label] || label;
  }

  // ============================================================
  // 공개 API 내보내기
  // ============================================================
  return {
    // URL 빌더
    buildClusterUrl,
    buildFrontBasicInfoUrl,
    buildFrontComplexUrl,

    // 데이터 정규화
    normalizeArticle,

    // 계산 유틸
    calcPricePerPyeong,
    detectKeyFeatures,

    // Mock 데이터 검색
    getSampleComplexes,
    searchSampleComplexes,
    getComplexDetail,
    findArticleById,

    // 코드 변환 유틸
    getTradeTypeLabel,
    getTradeTypeCode,
    getRealEstateTypeLabel,
    getRealEstateTypeCode,

    // 상수 공개 (참조용)
    TRADE_TYPE_MAP,
    REAL_ESTATE_TYPE_MAP,
    CLUSTER_API_BASE,
    FRONT_API_BASE,
    MOCK_COMPLEXES
  };
}));