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
}(typeof window !== 'undefined' ? window : (typeof self !== 'undefined' ? self : this), function() {
  'use strict';

  /**
   * 8개 스파클 파티클 방사형 확산 생성 (✨💕💖🌸⭐)
   * 360도로 확산 후 0.4초 뒤 자동 소멸
   * @param {number} x - 중심 X 좌표
   * @param {number} y - 중심 Y 좌표
   * @param {number|HTMLElement} [count=8] - 파티클 개수 또는 컨테이너
   * @param {HTMLElement} [container] - 파티클이 부착될 컨테이너
   */
  function createSparkles(x, y, count, container) {
    let numParticles = 8;
    let targetContainer = null;

    if (typeof count === 'number') {
      numParticles = count;
      targetContainer = container;
    } else if (typeof count === 'object' && count !== null) {
      targetContainer = count;
      numParticles = 8;
    } else {
      targetContainer = container;
    }

    if (!targetContainer && typeof document !== 'undefined') {
      targetContainer = document.querySelector('.brush-reveal-container') || document.body;
    }
    if (!targetContainer || typeof document === 'undefined') return;

    const emojis = ['✨', '💕', '💖', '🌸', '⭐', '✨', '💕', '💖'];
    const angleStep = (Math.PI * 2) / numParticles;

    for (let i = 0; i < numParticles; i++) {
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

      targetContainer.appendChild(particle);

      // 0.4초(400ms) 뒤 자동 소멸
      setTimeout(() => {
        if (particle && particle.parentNode) {
          particle.parentNode.removeChild(particle);
        }
      }, 400);
    }
  }

  // 기존 호환성 유지 alias
  const burstSparkles = createSparkles;

  /**
   * 캔버스 초기 샴페인 로즈 펄 글래스모피즘 배경 채우기
   */
  function initCanvasSurface(canvas, ctx, width, height) {
    if (!canvas || !ctx) return;
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
   * 3차 베지에 곡선 좌표 보간 함수
   */
  function cubicBezierPoint(t, p0, p1, p2, p3) {
    const u = 1 - t;
    const tt = t * t;
    const uu = u * u;
    const uuu = uu * u;
    const ttt = tt * t;

    return {
      x: uuu * p0.x + 3 * uu * t * p1.x + 3 * u * tt * p2.x + ttt * p3.x,
      y: uuu * p0.y + 3 * uu * t * p1.y + 3 * u * tt * p2.y + ttt * p3.y
    };
  }

  /**
   * 0.45초 베지에 곡선 브러시 스위프 트윈 애니메이션
   * @param {HTMLCanvasElement} canvas
   * @param {Function} [onRevealed]
   * @param {HTMLElement} [container]
   */
  function sweepReveal(canvas, onRevealed, container) {
    if (!canvas || canvas.dataset.revealing === 'true') return;
    canvas.dataset.revealing = 'true';

    const targetContainer = container ||
      (canvas.closest ? canvas.closest('.brush-reveal-container') : null) ||
      canvas.parentElement;

    const noteId = canvas._noteId || (targetContainer && targetContainer._noteId);

    // 가이드 칩 숨기기
    if (targetContainer) {
      const guide = targetContainer.querySelector('.brush-reveal-guide');
      if (guide) guide.classList.add('hidden');
    }

    let ctx = null;
    try {
      if (typeof canvas.getContext === 'function') {
        ctx = canvas.getContext('2d');
      }
    } catch (e) {
      ctx = null;
    }

    const rect = (canvas.getBoundingClientRect && canvas.getBoundingClientRect()) || { width: 320, height: 100 };
    const w = rect.width || canvas.width || 320;
    const h = rect.height || canvas.height || 100;
    const centerX = w / 2;
    const centerY = h / 2;

    const duration = 450; // 0.45초
    const startTime = (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now();

    // 부드러운 S자 대각선 베지에 제어점
    const p0 = { x: -w * 0.1, y: h * 0.2 };
    const p1 = { x: w * 0.4, y: h * 1.1 };
    const p2 = { x: w * 0.6, y: -h * 0.1 };
    const p3 = { x: w * 1.15, y: h * 0.9 };

    let prevPt = { x: p0.x, y: p0.y };

    function step(now) {
      const elapsed = (now || Date.now()) - startTime;
      const progress = Math.min(1, Math.max(0, elapsed / duration));

      if (ctx) {
        try {
          ctx.globalCompositeOperation = 'destination-out';
          ctx.lineCap = 'round';
          ctx.lineJoin = 'round';
          const brushRadius = Math.max(h * 0.75, 55);
          ctx.lineWidth = brushRadius * 2;

          const currentPt = cubicBezierPoint(progress, p0, p1, p2, p3);

          ctx.beginPath();
          ctx.arc(currentPt.x, currentPt.y, brushRadius, 0, Math.PI * 2);
          ctx.fill();

          ctx.beginPath();
          ctx.moveTo(prevPt.x, prevPt.y);
          ctx.lineTo(currentPt.x, currentPt.y);
          ctx.stroke();

          prevPt = currentPt;
        } catch (err) {
          // 비브라우저 / 모의 환경 예외 방어
        }
      }

      // 진행 60% 시점에 캔버스 페이드아웃 및 본문 블러 해제 트랜지션 진입
      if (progress >= 0.6 && !canvas.classList.contains('fading-out')) {
        canvas.classList.add('fading-out');
        if (targetContainer) {
          const noteContent = targetContainer.querySelector('.note-content');
          if (noteContent) {
            noteContent.classList.remove('unrevealed');
            noteContent.classList.add('revealed');
          }
        }
      }

      if (progress < 1) {
        if (typeof requestAnimationFrame !== 'undefined') {
          requestAnimationFrame(step);
        } else {
          setTimeout(() => step(Date.now()), 16);
        }
      } else {
        finishSweep();
      }
    }

    function finishSweep() {
      if (ctx) {
        try {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
        } catch (e) {}
      }

      if (targetContainer) {
        const noteContent = targetContainer.querySelector('.note-content');
        if (noteContent) {
          noteContent.classList.remove('unrevealed');
          noteContent.classList.add('revealed');
        }
        // 개봉 완료 시 8개 스파클 파티클 방사형 확산
        createSparkles(centerX, centerY, 8, targetContainer);
      }

      setTimeout(() => {
        if (canvas && canvas.parentNode) {
          canvas.parentNode.removeChild(canvas);
        }
        if (targetContainer) {
          const guide = targetContainer.querySelector('.brush-reveal-guide');
          if (guide && guide.parentNode) {
            guide.parentNode.removeChild(guide);
          }
        }
        if (typeof onRevealed === 'function') {
          onRevealed(noteId);
        }
      }, 50);
    }

    if (typeof requestAnimationFrame !== 'undefined') {
      requestAnimationFrame(step);
    } else {
      setTimeout(finishSweep, duration);
    }
  }

  /**
   * 긁힘 면적 추산 (Canvas 샘플링)
   * 40% 이상 지워짐 감지용
   */
  function calculateScratchedPercent(ctx, width, height) {
    if (!ctx) return 0;
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
   * @param {string|object} note - 쪽지 ID 또는 쪽지 객체
   * @param {Function} onRevealed - 언베일 완료 시 콜백
   */
  function attach(cardElement, note, onRevealed) {
    if (!cardElement || typeof document === 'undefined') return;

    // 이미 언베일 캔버스가 부착되어 있다면 중복 부착 방지
    if (cardElement.querySelector('.brush-reveal-canvas')) return;

    const noteContent = cardElement.querySelector('.note-content');
    if (!noteContent) return;

    const noteId = (typeof note === 'object' && note !== null) ? note.id : note;

    // 본문 8px 블러 처리
    noteContent.classList.remove('revealed');
    noteContent.classList.add('unrevealed');

    cardElement.classList.add('brush-reveal-container');
    cardElement._brushRevealData = { note, onRevealed };
    cardElement._noteId = noteId;

    // 1. 감성 가이드 칩 추가 ("🎨 살포시 터치해서 열어보기")
    let guide = cardElement.querySelector('.brush-reveal-guide');
    if (!guide) {
      guide = document.createElement('div');
      guide.className = 'brush-reveal-guide';
      guide.innerHTML = '<span>🎨</span><span>살포시 터치해서 열어보기</span>';
      cardElement.appendChild(guide);
    }

    // 2. 캔버스 생성 및 삽입
    const canvas = document.createElement('canvas');
    canvas.className = 'brush-reveal-canvas';
    canvas._noteId = noteId;
    cardElement.appendChild(canvas);

    let ctx = null;
    try {
      if (typeof canvas.getContext === 'function') {
        ctx = canvas.getContext('2d', { willReadFrequently: true });
      }
    } catch (e) {
      ctx = null;
    }

    const rect = (cardElement.getBoundingClientRect && cardElement.getBoundingClientRect()) || { width: 320, height: 100 };
    const w = rect.width || 320;
    const h = rect.height || 100;

    if (ctx) {
      initCanvasSurface(canvas, ctx, w, h);
    }

    let isDrawing = false;
    let hasScratched = false;
    let lastX = 0;
    let lastY = 0;
    let touchStartTime = 0;

    function eraseAt(x, y) {
      if (!ctx) return;
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
      if (!ctx) return;
      const pct = calculateScratchedPercent(ctx, w, h);
      if (pct >= 40) { // 40% 이상 지워지면 자동으로 페이드아웃 및 언베일 완료
        sweepReveal(canvas, onRevealed, cardElement);
      }
    }

    // 탭 vs 드래그 판별 핸들러
    function handleStart(clientX, clientY) {
      isDrawing = true;
      hasScratched = false;
      touchStartTime = Date.now();
      const b = (canvas.getBoundingClientRect && canvas.getBoundingClientRect()) || { left: 0, top: 0 };
      const x = clientX - b.left;
      const y = clientY - b.top;
      lastX = x;
      lastY = y;
    }

    function handleMove(clientX, clientY) {
      if (!isDrawing) return;
      const b = (canvas.getBoundingClientRect && canvas.getBoundingClientRect()) || { left: 0, top: 0 };
      const x = clientX - b.left;
      const y = clientY - b.top;

      const dist = Math.hypot(x - lastX, y - lastY);
      if (dist > 5) {
        hasScratched = true;
        if (guide) guide.classList.add('hidden');
      }

      eraseAt(x, y);

      // 스크래치 중 실시간 40% 체크
      if (hasScratched) {
        checkScratchThreshold();
      }
    }

    function handleEnd() {
      if (!isDrawing) return;
      isDrawing = false;
      lastX = 0;
      lastY = 0;

      const elapsed = Date.now() - touchStartTime;
      // 300ms 이내의 단순 탭 클릭이거나 거의 드래그하지 않은 경우 -> 원터치 자동 스위프 호출
      if (!hasScratched || elapsed < 300) {
        sweepReveal(canvas, onRevealed, cardElement);
      } else {
        checkScratchThreshold();
      }
    }

    // 원터치 탭(click) 리스너 직접 바인딩
    canvas.addEventListener('click', (e) => {
      e.stopPropagation();
      sweepReveal(canvas, onRevealed, cardElement);
    });

    // 터치 이벤트 바인딩
    canvas.addEventListener('touchstart', (e) => {
      if (e.touches && e.touches.length > 0) {
        handleStart(e.touches[0].clientX, e.touches[0].clientY);
      }
    }, { passive: true });

    canvas.addEventListener('touchmove', (e) => {
      if (e.touches && e.touches.length > 0) {
        handleMove(e.touches[0].clientX, e.touches[0].clientY);
      }
    }, { passive: true });

    canvas.addEventListener('touchend', handleEnd, { passive: true });

    // 마우스 이벤트 바인딩
    canvas.addEventListener('mousedown', (e) => {
      handleStart(e.clientX, e.clientY);
    });

    if (typeof window !== 'undefined') {
      window.addEventListener('mousemove', (e) => {
        if (isDrawing) handleMove(e.clientX, e.clientY);
      });
      window.addEventListener('mouseup', handleEnd);

      // 브라우저 리사이즈 시 캔버스 반응형 크기 보정
      window.addEventListener('resize', () => {
        if (canvas && canvas.parentNode && ctx) {
          const nr = cardElement.getBoundingClientRect();
          if (nr.width > 0 && nr.height > 0) {
            initCanvasSurface(canvas, ctx, nr.width, nr.height);
          }
        }
      }, { passive: true });
    }
  }

  /**
   * 안 읽음 상태 복원 시 오버레이 재구성
   * @param {HTMLElement} cardElement
   * @param {string|object} [note]
   * @param {Function} [onRevealed]
   */
  function reset(cardElement, note, onRevealed) {
    if (!cardElement || typeof document === 'undefined') return;

    // 1. 기존 잔여 캔버스 및 가이드 칩 제거
    const oldCanvas = cardElement.querySelector('.brush-reveal-canvas');
    if (oldCanvas && oldCanvas.parentNode) {
      oldCanvas.parentNode.removeChild(oldCanvas);
    }
    const oldGuide = cardElement.querySelector('.brush-reveal-guide');
    if (oldGuide && oldGuide.parentNode) {
      oldGuide.parentNode.removeChild(oldGuide);
    }

    // 2. 본문 8px 블러 복원
    const noteContent = cardElement.querySelector('.note-content');
    if (noteContent) {
      noteContent.classList.remove('revealed');
      noteContent.classList.add('unrevealed');
    }

    // 3. 오버레이 재구성
    const targetNote = note || (cardElement._brushRevealData && cardElement._brushRevealData.note);
    const targetCallback = onRevealed || (cardElement._brushRevealData && cardElement._brushRevealData.onRevealed);

    if (targetNote && targetCallback) {
      attach(cardElement, targetNote, targetCallback);
    }
  }

  const engine = {
    attach,
    sweepReveal,
    createSparkles,
    burstSparkles,
    reset,
    calculateScratchedPercent,
    initCanvasSurface
  };

  if (typeof window !== 'undefined') {
    window.BrushRevealEngine = engine;
  }

  return engine;
}));
