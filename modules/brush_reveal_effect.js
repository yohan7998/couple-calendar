/**
 * Brush Reveal Effect Engine (Couple-Calendar v2.3.0)
 * 안 읽은 쪽지 브러시 언베일 인터랙션 & 글래스모피즘 스크래치 엔진
 * UMD / IIFE 패턴
 */

(function(root, factory) {
  if (typeof define === 'function' && define.amd) {
    define([], factory);
  } else if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.BrushRevealEngine = factory();
  }
}(typeof self !== 'undefined' ? self : this, function() {
  'use strict';

  /**
   * 8개 스파클 파티클 방출 (✨💕)
   * @param {number} x - 중심 X 좌표
   * @param {number} y - 중심 Y 좌표
   * @param {HTMLElement} container - 파티클이 부착될 컨테이너
   */
  function burstSparkles(x, y, container) {
    if (!container || typeof document === 'undefined') return;

    const emojis = ['✨', '💕', '💖', '✨', '🌸', '✨', '💕', '⭐'];
    const count = 8;
    const angleStep = (Math.PI * 2) / count;

    for (let i = 0; i < count; i++) {
      const angle = i * angleStep + (Math.random() * 0.4 - 0.2);
      const distance = 40 + Math.random() * 45;
      const dx = Math.cos(angle) * distance;
      const dy = Math.sin(angle) * distance;
      const rot = (Math.random() * 60 - 30) + 'deg';

      const particle = document.createElement('span');
      particle.className = 'sparkle-particle';
      particle.textContent = emojis[i % emojis.length];
      particle.style.left = `${x}px`;
      particle.style.top = `${y}px`;
      particle.style.setProperty('--dx', `${dx}px`);
      particle.style.setProperty('--dy', `${dy}px`);
      particle.style.setProperty('--rot', rot);

      container.appendChild(particle);

      // 700ms 후 자동 소멸
      setTimeout(() => {
        if (particle && particle.parentNode) {
          particle.parentNode.removeChild(particle);
        }
      }, 750);
    }
  }

  /**
   * 캔버스 초기 샴페인 로즈 펄 글래스모피즘 배경 채우기
   */
  function initCanvasSurface(canvas, ctx, width, height) {
    const dpr = (typeof window !== 'undefined' && window.devicePixelRatio) || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    ctx.scale(dpr, dpr);

    // 샴페인 로즈 글래스모피즘 그라데이션
    const grad = ctx.createLinearGradient(0, 0, width, height);
    grad.addColorStop(0, 'rgba(255, 244, 244, 0.98)');
    grad.addColorStop(0.5, 'rgba(255, 235, 240, 0.96)');
    grad.addColorStop(1, 'rgba(254, 242, 232, 0.98)');

    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);

    // 미세한 펄 패턴 장식 선
    ctx.strokeStyle = 'rgba(244, 63, 94, 0.08)';
    ctx.lineWidth = 1;
    for (let x = 0; x < width; x += 16) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x + height, height);
      ctx.stroke();
    }
  }

  /**
   * 0.5초 베지에 곡선 자동 스위프 트윈 (원터치 또는 50% 긁힘 시 발동)
   * @param {HTMLCanvasElement} canvas
   * @param {Function} onComplete
   * @param {HTMLElement} container
   */
  function sweepReveal(canvas, onComplete, container) {
    if (!canvas || canvas.dataset.revealing === 'true') return;
    canvas.dataset.revealing = 'true';

    const rect = canvas.getBoundingClientRect();
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    // 가이드 칩 숨기기
    if (container) {
      const guide = container.querySelector('.brush-reveal-guide');
      if (guide) guide.classList.add('hidden');
    }

    // 캔버스 페이드아웃 및 컨텐츠 블러 해제
    canvas.classList.add('fading-out');

    if (container) {
      const noteContent = container.querySelector('.note-content');
      if (noteContent) {
        noteContent.classList.remove('unrevealed');
        noteContent.classList.add('revealed');
      }
      burstSparkles(centerX, centerY, container);
    }

    setTimeout(() => {
      if (canvas && canvas.parentNode) {
        canvas.parentNode.removeChild(canvas);
      }
      if (container) {
        const guide = container.querySelector('.brush-reveal-guide');
        if (guide && guide.parentNode) guide.parentNode.removeChild(guide);
      }
      if (typeof onComplete === 'function') {
        onComplete();
      }
    }, 450);
  }

  /**
   * 긁힘 면적 추산 (Canvas 샘플링)
   */
  function calculateScratchedPercent(ctx, width, height) {
    try {
      const dpr = (typeof window !== 'undefined' && window.devicePixelRatio) || 1;
      const sampleW = Math.floor(width * dpr);
      const sampleH = Math.floor(height * dpr);
      if (sampleW <= 0 || sampleH <= 0) return 0;

      const imgData = ctx.getImageData(0, 0, sampleW, sampleH);
      const data = imgData.data;
      let transparentCount = 0;
      const totalPixels = data.length / 4;
      const step = 8; // 성능 최적화를 위한 8픽셀 간격 샘플링

      for (let i = 3; i < data.length; i += 4 * step) {
        if (data[i] < 30) {
          transparentCount++;
        }
      }

      const sampledTotal = totalPixels / step;
      return sampledTotal > 0 ? (transparentCount / sampledTotal) * 100 : 0;
    } catch (e) {
      // tainted canvas 등 예외 시 0 반환
      return 0;
    }
  }

  /**
   * 미확인 카드에 브러시 언베일 오버레이 부착
   * @param {HTMLElement} cardElement - 쪽지 카드 DOM 요소
   * @param {string} noteId - 쪽지 ID
   * @param {Function} onComplete - 언베일 완료 시 콜백
   */
  function attach(cardElement, noteId, onComplete) {
    if (!cardElement || typeof document === 'undefined') return;

    // 이미 언베일 컨테이너가 부착되어 있다면 중복 부착 방지
    if (cardElement.querySelector('.brush-reveal-canvas')) return;

    const noteContent = cardElement.querySelector('.note-content');
    if (!noteContent) return;

    // 본문 블러 처리
    noteContent.classList.remove('revealed');
    noteContent.classList.add('unrevealed');

    cardElement.classList.add('brush-reveal-container');

    // 1. 감성 가이드 칩 추가
    let guide = cardElement.querySelector('.brush-reveal-guide');
    if (!guide) {
      guide = document.createElement('div');
      guide.className = 'brush-reveal-guide';
      guide.innerHTML = '<span>🎨</span><span>터치해서 열어보기</span>';
      cardElement.appendChild(guide);
    }

    // 2. 캔버스 생성 및 삽입
    const canvas = document.createElement('canvas');
    canvas.className = 'brush-reveal-canvas';
    cardElement.appendChild(canvas);

    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    const rect = cardElement.getBoundingClientRect();
    const w = rect.width || 320;
    const h = rect.height || 100;

    initCanvasSurface(canvas, ctx, w, h);

    let isDrawing = false;
    let hasScratched = false;
    let lastX = 0;
    let lastY = 0;
    let touchStartTime = 0;

    function eraseAt(x, y) {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.beginPath();
      ctx.arc(x, y, 22, 0, Math.PI * 2);
      ctx.fill();

      // 스크래치 선 연결 부드럽게
      if (lastX && lastY) {
        ctx.lineWidth = 44;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.beginPath();
        ctx.moveTo(lastX, lastY);
        ctx.lineTo(x, y);
        ctx.stroke();
      }
      lastX = x;
      lastY = y;
    }

    function checkScratchThreshold() {
      const pct = calculateScratchedPercent(ctx, w, h);
      if (pct >= 40) { // 40% 이상 지워지면 시원하게 자동 스위프 완료
        sweepReveal(canvas, () => {
          if (typeof onComplete === 'function') onComplete(noteId);
        }, cardElement);
      }
    }

    // 탭 vs 드래그 판별 핸들러
    function handleStart(clientX, clientY) {
      isDrawing = true;
      hasScratched = false;
      touchStartTime = Date.now();
      const b = canvas.getBoundingClientRect();
      const x = clientX - b.left;
      const y = clientY - b.top;
      lastX = x;
      lastY = y;
    }

    function handleMove(clientX, clientY) {
      if (!isDrawing) return;
      const b = canvas.getBoundingClientRect();
      const x = clientX - b.left;
      const y = clientY - b.top;

      const dist = Math.hypot(x - lastX, y - lastY);
      if (dist > 5) {
        hasScratched = true;
        if (guide) guide.classList.add('hidden');
      }

      eraseAt(x, y);
    }

    function handleEnd() {
      if (!isDrawing) return;
      isDrawing = false;
      lastX = 0;
      lastY = 0;

      const elapsed = Date.now() - touchStartTime;
      // 300ms 이내의 단순 탭 클릭이거나 거의 드래그하지 않은 경우 ➔ 원터치 자동 스위프 언베일
      if (!hasScratched || elapsed < 280) {
        sweepReveal(canvas, () => {
          if (typeof onComplete === 'function') onComplete(noteId);
        }, cardElement);
      } else {
        checkScratchThreshold();
      }
    }

    // 터치 이벤트 바인딩
    canvas.addEventListener('touchstart', (e) => {
      if (e.touches.length > 0) {
        handleStart(e.touches[0].clientX, e.touches[0].clientY);
      }
    }, { passive: true });

    canvas.addEventListener('touchmove', (e) => {
      if (e.touches.length > 0) {
        handleMove(e.touches[0].clientX, e.touches[0].clientY);
      }
    }, { passive: true });

    canvas.addEventListener('touchend', handleEnd, { passive: true });

    // 마우스 이벤트 바인딩
    canvas.addEventListener('mousedown', (e) => handleStart(e.clientX, e.clientY));
    window.addEventListener('mousemove', (e) => {
      if (isDrawing) handleMove(e.clientX, e.clientY);
    });
    window.addEventListener('mouseup', handleEnd);

    // 원클릭 리사이즈 보정
    window.addEventListener('resize', () => {
      if (canvas && canvas.parentNode) {
        const nr = cardElement.getBoundingClientRect();
        if (nr.width > 0 && nr.height > 0) {
          initCanvasSurface(canvas, ctx, nr.width, nr.height);
        }
      }
    }, { passive: true });
  }

  return {
    attach,
    sweepReveal,
    burstSparkles,
    calculateScratchedPercent,
    initCanvasSurface
  };
}));

