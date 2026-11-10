/**
 * real_estate_scraper.js - Naver Land 실시간 스크래퍼 및 OpenGraph 파서 엔진
 * UMD 패턴: window.RealEstateScraper (브라우저) / module.exports (Node.js)
 */

(function (root, factory) {
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = factory();
  } else {
    root.RealEstateScraper = factory();
  }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  /**
   * 한국어 가격 문자열을 만원 단위 정수로 파싱
   * 예: "11억 8,725" -> 118725, "5억 5,000" -> 55000, "1억/120" -> deposit: 10000, monthlyRent: 120
   */
  function parseKoreanPrice(text) {
    if (!text) return { price: 0, deposit: 0, monthlyRent: 0 };

    const cleanText = text.replace(/,/g, '').trim();
    const result = { price: 0, deposit: 0, monthlyRent: 0 };

    // 월세 패턴: "보증금/월세" 또는 "X억/Y"
    const monthlyMatch = cleanText.match(/(\d+(?:\.\d+)?)\s*억\s*\/\s*(\d+)/);
    if (monthlyMatch) {
      result.deposit = Math.round(parseFloat(monthlyMatch[1]) * 10000);
      result.monthlyRent = parseInt(monthlyMatch[2], 10);
      result.price = result.deposit; // 가격 필드에는 보증금 저장
      return result;
    }

    // 월세 패턴: "X만/Y만" 또는 "X만/Y"
    const monthlyMatch2 = cleanText.match(/(\d+)\s*만\s*\/\s*(\d+)\s*만?/);
    if (monthlyMatch2) {
      result.deposit = parseInt(monthlyMatch2[1], 10);
      result.monthlyRent = parseInt(monthlyMatch2[2], 10);
      result.price = result.deposit;
      return result;
    }

    // 억 단위 파싱
    const eokMatch = cleanText.match(/(\d+(?:\.\d+)?)\s*억/);
    if (eokMatch) {
      result.price += Math.round(parseFloat(eokMatch[1]) * 10000);
    }

    // 만 단위 파싱
    const manMatch = cleanText.match(/(\d+(?:\.\d+)?)\s*만/);
    if (manMatch) {
      result.price += Math.round(parseFloat(manMatch[1]));
    } else if (eokMatch) {
      // "11억 8725" 형태에서 억 뒤의 숫자 처리
      const remain = cleanText.replace(/.*억\s*/, '').trim();
      const numMatch = remain.match(/^(\d+)/);
      if (numMatch) {
        result.price += parseInt(numMatch[1], 10);
      }
    } else {
      // 순수 숫자만 있는 경우
      const numMatch = cleanText.match(/^(\d+)$/);
      if (numMatch) {
        result.price += parseInt(numMatch[1], 10);
      }
    }

    return result;
  }

  /**
   * 금액을 "X억 Y,ZZZ만" 형식으로 포맷팅
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
   * OpenGraph 데이터 파싱
   * @param {Object} ogData - { title, ogTitle, description, ogDescription, image, ogImage, url, ogUrl }
   * @returns {Object} 정제된 매물 객체
   */
  function parseOpenGraphData(ogData) {
    if (!ogData || typeof ogData !== 'object') {
      return null;
    }

    // 유연한 키 지원 (og* 우선, 없으면 기본 키)
    const title = ogData.ogTitle || ogData.title || '';
    const description = ogData.ogDescription || ogData.description || '';
    const image = ogData.ogImage || ogData.image || '';
    const url = ogData.ogUrl || ogData.url || '';

    // 제목 파싱: "단지명 동정보" -> complexName, building 분리
    let complexName = title.trim();
    let building = '';

    // 동 패턴 매칭 (예: "202동", "101동", "A동", "B동")
    const buildingMatch = title.match(/(.+?)\s+(\d+동|[가-힣]동)$/);
    if (buildingMatch) {
      complexName = buildingMatch[1].trim();
      building = buildingMatch[2].trim();
    }

    // 설명에서 거래유형 및 가격 파싱
    let dealType = '매매';
    const priceInfo = parseKoreanPrice(description);

    // 거래유형 감지
    const lowerDesc = description.toLowerCase();
    if (lowerDesc.includes('전세')) {
      dealType = '전세';
    } else if (lowerDesc.includes('월세')) {
      dealType = '월세';
    } else if (lowerDesc.includes('매매')) {
      dealType = '매매';
    }

    return {
      complexName: complexName || '(단지명 미입력)',
      building,
      dealType,
      price: priceInfo.price,
      deposit: priceInfo.deposit,
      monthlyRent: priceInfo.monthlyRent,
      priceFormatted: formatPrice(priceInfo.price),
      imageUrl: image,
      sourceUrl: url,
      scrapedAt: new Date().toISOString()
    };
  }

  /**
   * 네이버 부동산 URL에서 articleId 추출
   * @param {string} url
   * @returns {string|null}
   */
  function extractArticleId(url) {
    if (!url || typeof url !== 'string') return null;

    // fin.land.naver.com/articles/{articleId}
    let match = url.match(/fin\.land\.naver\.com\/articles\/(\d+)/);
    if (match) return match[1];

    // m.land.naver.com/article/info/{articleId}
    match = url.match(/m\.land\.naver\.com\/article\/info\/(\d+)/);
    if (match) return match[1];

    // land.naver.com/article/articleDetail.naver?articleNo={articleId}
    match = url.match(/land\.naver\.com\/article\/articleDetail\.naver\?articleNo=(\d+)/);
    if (match) return match[1];

    // naver.me 단축 URL은 별도 처리 필요 (릴레이로 해결)
    return null;
  }

  /**
   * 네이버 부동산 URL 스크래핑 (비동기)
   * @param {string} url
   * @returns {Promise<Object>}
   */
  async function scrapeNaverUrl(url) {
    if (!url || typeof url !== 'string') {
      return createFallbackResult(url, 'Invalid URL');
    }

    try {
      // naver.me 단축 URL인 경우 릴레이 필요
      if (url.includes('naver.me')) {
        return await scrapeShortUrl(url);
      }

      // articleId 추출 시도
      const articleId = extractArticleId(url);
      if (articleId) {
        // 상세 페이지 URL 구성
        const detailUrl = `https://fin.land.naver.com/articles/${articleId}`;
        return await fetchOpenGraph(detailUrl);
      }

      // 직접 메타 태그 추출 시도
      return await fetchOpenGraph(url);
    } catch (error) {
      console.warn('[RealEstateScraper] scrapeNaverUrl error:', error.message);
      return createFallbackResult(url, error.message);
    }
  }

  /**
   * 단축 URL 처리 (naver.me 등)
   */
  async function scrapeShortUrl(shortUrl) {
    try {
      // 리다이렉트 따라가기
      const response = await fetch(shortUrl, {
        method: 'HEAD',
        redirect: 'follow'
      });
      const finalUrl = response.url;

      // 최종 URL에서 articleId 추출
      const articleId = extractArticleId(finalUrl);
      if (articleId) {
        const detailUrl = `https://fin.land.naver.com/articles/${articleId}`;
        return await fetchOpenGraph(detailUrl);
      }

      // 직접 메타 추출 시도
      return await fetchOpenGraph(finalUrl);
    } catch (error) {
      console.warn('[RealEstateScraper] scrapeShortUrl error:', error.message);
      return createFallbackResult(shortUrl, error.message);
    }
  }

  /**
   * 페이지에서 OpenGraph 메타 태그 추출
   */
  async function fetchOpenGraph(targetUrl) {
    try {
      const response = await fetch(targetUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const html = await response.text();
      const ogData = extractOpenGraphFromHtml(html, targetUrl);
      return parseOpenGraphData({ ...ogData, url: targetUrl });
    } catch (error) {
      console.warn('[RealEstateScraper] fetchOpenGraph error:', error.message);
      return createFallbackResult(targetUrl, error.message);
    }
  }

  /**
   * HTML에서 OpenGraph 메타 태그 파싱
   */
  function extractOpenGraphFromHtml(html, sourceUrl) {
    const ogData = {};

    // og:title
    const titleMatch = html.match(/<meta\s+property=["']og:title["']\s+content=["']([^"']+)["']/i);
    if (titleMatch) ogData.ogTitle = titleMatch[1];

    // og:description
    const descMatch = html.match(/<meta\s+property=["']og:description["']\s+content=["']([^"']+)["']/i);
    if (descMatch) ogData.ogDescription = descMatch[1];

    // og:image
    const imageMatch = html.match(/<meta\s+property=["']og:image["']\s+content=["']([^"']+)["']/i);
    if (imageMatch) ogData.ogImage = imageMatch[1];

    // og:url
    const urlMatch = html.match(/<meta\s+property=["']og:url["']\s+content=["']([^"']+)["']/i);
    if (urlMatch) ogData.ogUrl = urlMatch[1];

    // 일반 title 태그 (fallback)
    if (!ogData.ogTitle) {
      const titleTagMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
      if (titleTagMatch) ogData.title = titleTagMatch[1];
    }

    // meta description (fallback)
    if (!ogData.ogDescription) {
      const metaDescMatch = html.match(/<meta\s+name=["']description["']\s+content=["']([^"']+)["']/i);
      if (metaDescMatch) ogData.description = metaDescMatch[1];
    }

    return ogData;
  }

  /**
   * 실패 시 안전하게 반환할 폴백 객체
   */
  function createFallbackResult(sourceUrl, error) {
    return {
      complexName: '(스크래핑 실패)',
      building: '',
      dealType: '매매',
      price: 0,
      deposit: 0,
      monthlyRent: 0,
      priceFormatted: '0만',
      imageUrl: '',
      sourceUrl,
      scrapedAt: new Date().toISOString(),
      error: error || 'Unknown error'
    };
  }

  // 공개 API
  return {
    parseOpenGraphData,
    extractArticleId,
    scrapeNaverUrl,
    // 내부 함수들도 테스트용으로 노출
    _internal: {
      parseKoreanPrice,
      formatPrice,
      extractOpenGraphFromHtml,
      createFallbackResult
    }
  };
});