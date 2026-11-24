/* ==========================================================================
   js/voyages-carousel.js — Carrousel 3D incurvé façon Piven Ilya (ST.02)
   - Scroll vertical dans #station-2 => défilement horizontal fluide 01 -> 04
   - S'arrête proprement à la photo 04 (zéro boucle infinie bloquante)
   - Courbure 3D concave (rotateY + translateZ) + viseur central à 4 croix (+)
   ========================================================================== */
(function () {
  const CONFIG = {
    cardSpacingDesktop: 405, // Espacement horizontal entre cartes sur PC (px)
    cardSpacingMobile: 262,  // Espacement horizontal sur téléphone (px)
    curveDepth: 120,         // Profondeur de la courbure 3D concave (px)
    maxRotateDeg: 25,        // Angle d'inclinaison 3D des cartes latérales (deg)
    lerpSpeed: 0.068         // Glisse cinématique type dolly sur rail
  };

  const SLIDES = [
    {
      frTitle: 'Yosemite · USA',
      enTitle: 'Yosemite · USA',
      frSub: '01 / 08 · Glacier Point, Californie',
      enSub: '01 / 08 · Glacier Point, California'
    },
    {
      frTitle: 'Luxembourg · Luxembourg',
      enTitle: 'Luxembourg City · Luxembourg',
      frSub: '02 / 08 · Ville-Haute & remparts',
      enSub: '02 / 08 · Old Town & ramparts'
    },
    {
      frTitle: 'Chongqing · Chine',
      enTitle: 'Chongqing · China',
      frSub: '03 / 08 · Métropole & gratte-ciel',
      enSub: '03 / 08 · Metropolis & skyline'
    },
    {
      frTitle: 'Chongqing · Chine',
      enTitle: 'Chongqing · China',
      frSub: '04 / 08 · Panorama nocturne',
      enSub: '04 / 08 · Night skyline'
    },
    {
      frTitle: "Xi'an · Chine",
      enTitle: "Xi'an · China",
      frSub: '05 / 08 · Pavillon Huaqing',
      enSub: '05 / 08 · Huaqing Pavilion'
    },
    {
      frTitle: "Xi'an · Chine",
      enTitle: "Xi'an · China",
      frSub: '06 / 08 · Architecture bois & colonnes',
      enSub: '06 / 08 · Timber & column craft'
    },
    {
      frTitle: "Xi'an · Chine",
      enTitle: "Xi'an · China",
      frSub: '07 / 08 · Corridor lacustre',
      enSub: '07 / 08 · Lakeside corridor'
    },
    {
      frTitle: 'Olmeto (Corse) · France',
      enTitle: 'Olmeto (Corsica) · France',
      frSub: '08 / 08 · Littoral méditerranéen',
      enSub: '08 / 08 · Mediterranean coastline'
    }
  ];

  document.addEventListener('DOMContentLoaded', () => {
    const stageEl = document.getElementById('stage');
    const st2El = document.getElementById('station-2');
    const viewport = document.getElementById('voyagesCarousel');
    const cards = Array.from(document.querySelectorAll('.v-card'));
    const cardImgs = cards.map((c) => c.querySelector('img'));
    const captionCenter = document.querySelector('.voyages-caption-center');
    const titleEl = document.getElementById('voyagesCaptionTitle');
    const subEl = document.getElementById('voyagesCaptionSub');
    const viewfinder = document.getElementById('voyagesViewfinder');
    const dots = Array.from(document.querySelectorAll('.v-dot'));
    const prevBtn = document.getElementById('voyagesPrev');
    const nextBtn = document.getElementById('voyagesNext');
    const rulerCursor = document.getElementById('voyagesRulerCursor');
    const coordEl = document.getElementById('voyagesCoord');

    if (!st2El || !viewport || !cards.length) return;

    const total = cards.length;
    let currentPos = 0; // 0 .. total - 1
    let targetPos = 0;
    let activeIdx = 0;
    let scrollPull = 0; // 0 (focalisé) -> 1 (très léger recul optique pendant le mouvement)
    let isSettling = false;
    let rafId = null;
    let flashTimer = null;
    let captionTimer = null;

    function clamp(v, min, max) {
      return Math.min(max, Math.max(min, v));
    }

    function updateCaption(idx, immediate = false) {
      const s = SLIDES[idx] || SLIDES[0];
      const isEn = window.PortfolioI18n && window.PortfolioI18n.getLang() === 'en';
      const nextTitle = isEn ? s.enTitle : s.frTitle;
      const nextSub = isEn ? s.enSub : s.frSub;

      if (captionCenter && !immediate) {
        captionCenter.classList.add('is-fading');
        clearTimeout(captionTimer);
        captionTimer = setTimeout(() => {
          if (titleEl) titleEl.textContent = nextTitle;
          if (subEl) subEl.textContent = nextSub;
          captionCenter.classList.remove('is-fading');
        }, 140);
      } else {
        if (titleEl) titleEl.textContent = nextTitle;
        if (subEl) subEl.textContent = nextSub;
      }

      dots.forEach((d, i) => d.classList.toggle('active', i === idx));
      if (prevBtn) prevBtn.disabled = idx === 0;
      if (nextBtn) nextBtn.disabled = idx === total - 1;

      if (viewfinder) {
        viewfinder.classList.add('is-switching');
        clearTimeout(flashTimer);
        flashTimer = setTimeout(() => viewfinder.classList.remove('is-switching'), 260);
      }
    }

    function layoutCards(pos, pull = 0) {
      const isMobile = window.innerWidth <= 640;
      const spacing = isMobile ? CONFIG.cardSpacingMobile : CONFIG.cardSpacingDesktop;
      // Respiration dolly ultra-fluide pendant le mouvement
      const cameraScale = 1 - pull * 0.032;
      const cameraZ = -pull * 22;

      cards.forEach((card, i) => {
        const offset = i - pos;
        const absOff = Math.abs(offset);
        // Proximité au plan de mise au point (1 au centre -> 0 sur les côtés)
        const focus = clamp(1 - absOff * 0.82, 0, 1);

        const tx = offset * spacing;
        const rotY = clamp(-offset * CONFIG.maxRotateDeg, -42, 42);
        const tz = Math.min(absOff * absOff * CONFIG.curveDepth, 260) - 42 + cameraZ;
        const scale = (0.91 + focus * 0.115) * cameraScale;
        const opacity = clamp(0.24 + focus * 0.76, 0.24, 1);

        // Profondeur de champ optique (DOF) : net et lumineux au centre, doux et feutré hors-champ
        const blurPx = isMobile ? 0 : Math.max(0, (1 - focus) * 2.4);
        const brightness = 0.8 + focus * 0.24;
        const saturate = 0.76 + focus * 0.3;

        card.style.transform = `translate3d(${tx.toFixed(1)}px, 0, ${tz.toFixed(1)}px) rotateY(${rotY.toFixed(2)}deg) scale(${scale.toFixed(3)})`;
        card.style.opacity = opacity.toFixed(3);
        card.style.filter = blurPx > 0.08
          ? `blur(${blurPx.toFixed(2)}px) brightness(${brightness.toFixed(3)}) saturate(${saturate.toFixed(3)})`
          : `brightness(${brightness.toFixed(3)}) saturate(${saturate.toFixed(3)})`;
        card.style.zIndex = String(20 - Math.round(absOff * 5));
        card.classList.toggle('is-center', absOff < 0.48);

        // Parallaxe interne fenêtre cinéma : l'image glisse doucement à contre-sens dans son cadre
        const img = cardImgs[i];
        if (img) {
          const imgShiftX = clamp(-offset * 15, -24, 24);
          const imgScale = 1.07 + focus * 0.04;
          img.style.transform = `translate3d(${imgShiftX.toFixed(1)}px, 0, 0) scale(${imgScale.toFixed(4)})`;
        }
      });

      // Très léger flottement du viseur (+) sans à-coup
      if (viewfinder) {
        const vfScale = 1 + pull * 0.016;
        viewfinder.style.transform = `scale(${vfScale.toFixed(3)})`;
      }

      const pct = (pos / Math.max(1, total - 1)) * 100;
      if (rulerCursor) rulerCursor.style.left = `${pct.toFixed(2)}%`;
      if (coordEl) coordEl.textContent = `POS ${(pct * 7.6).toFixed(1).padStart(5, '0')}mm`;

      const nearest = clamp(Math.round(pos), 0, total - 1);
      if (nearest !== activeIdx) {
        activeIdx = nearest;
        updateCaption(activeIdx);
      }
    }

    function animate() {
      const delta = targetPos - currentPos;
      currentPos += delta * CONFIG.lerpSpeed;

      // Recul optique très progressif (zéro recul pendant le recentrage doux final)
      const targetPull = isSettling ? 0 : clamp((Math.abs(delta) - 0.06) * 0.85, 0, 1);
      const pullLerp = targetPull > scrollPull ? 0.055 : 0.032;
      scrollPull += (targetPull - scrollPull) * pullLerp;

      layoutCards(currentPos, scrollPull);

      if (Math.abs(delta) > 0.0015 || scrollPull > 0.003) {
        rafId = requestAnimationFrame(animate);
      } else {
        currentPos = targetPos;
        scrollPull = 0;
        isSettling = false;
        layoutCards(currentPos, 0);
        rafId = null;
      }
    }

    function kick() {
      if (!rafId) rafId = requestAnimationFrame(animate);
    }

    // Synchronisation au scroll vertical de #stage (s'arrête net à la dernière photo => zéro blocage)
    let settleTimer = null;

    function syncFromScroll() {
      if (!stageEl) return;
      const track = Math.max(1, st2El.offsetHeight - stageEl.clientHeight);
      const scrolled = stageEl.scrollTop - st2El.offsetTop;
      const p = clamp(scrolled / track, 0, 1);
      const nextPos = p * (total - 1);
      if (Math.abs(nextPos - targetPos) > 0.002) {
        isSettling = false;
        targetPos = nextPos;
        kick();
      }

      // Une fois le scroll arrêté (280 ms), recentre doucement sans redéclencher de dézoom
      clearTimeout(settleTimer);
      if (p > 0.01 && p < 0.99) {
        settleTimer = setTimeout(() => {
          const snapped = clamp(Math.round(targetPos), 0, total - 1);
          if (Math.abs(snapped - targetPos) > 0.005) {
            isSettling = true;
            targetPos = snapped;
            kick();
          }
        }, 280);
      }
    }

    // Aller directement sur une photo précise (clic carte, point ou flèche)
    function scrollToSlide(idx) {
      const clamped = clamp(idx, 0, total - 1);
      if (stageEl) {
        const track = Math.max(1, st2El.offsetHeight - stageEl.clientHeight);
        const destY = st2El.offsetTop + (clamped / Math.max(1, total - 1)) * track;
        stageEl.scrollTo({ top: destY, behavior: 'smooth' });
      }
      targetPos = clamped;
      kick();
    }

    cards.forEach((card, i) => {
      card.addEventListener('click', () => scrollToSlide(i));
    });

    dots.forEach((dot, i) => {
      dot.addEventListener('click', () => scrollToSlide(i));
    });

    if (prevBtn) prevBtn.addEventListener('click', () => scrollToSlide(activeIdx - 1));
    if (nextBtn) nextBtn.addEventListener('click', () => scrollToSlide(activeIdx + 1));

    if (stageEl) {
      stageEl.addEventListener('scroll', syncFromScroll, { passive: true });
    }
    window.addEventListener('resize', () => layoutCards(currentPos));
    document.addEventListener('portfolio:langchange', () => updateCaption(activeIdx));

    /* Légère inclinaison 3D optique au mouvement de la souris (PC) */
    const trackEl = document.getElementById('voyagesTrack');
    const isFinePointer = window.matchMedia('(pointer: fine)').matches;

    if (trackEl && isFinePointer) {
      let tiltX = 0, tiltY = 0, tTiltX = 0, tTiltY = 0;
      let tiltRaf = null;

      function stepTilt() {
        tiltX += (tTiltX - tiltX) * 0.08;
        tiltY += (tTiltY - tiltY) * 0.08;
        trackEl.style.transform = `rotateX(${tiltX.toFixed(2)}deg) rotateY(${tiltY.toFixed(2)}deg)`;

        if (Math.abs(tTiltX - tiltX) > 0.04 || Math.abs(tTiltY - tiltY) > 0.04) {
          tiltRaf = requestAnimationFrame(stepTilt);
        } else {
          tiltRaf = null;
        }
      }

      viewport.addEventListener('pointerleave', () => {
        tTiltX = 0;
        tTiltY = 0;
        if (!tiltRaf) tiltRaf = requestAnimationFrame(stepTilt);
      });

      viewport.addEventListener('pointermove', (e) => {
        const rect = viewport.getBoundingClientRect();
        const nx = (e.clientX - rect.left) / rect.width - 0.5;
        const ny = (e.clientY - rect.top) / rect.height - 0.5;
        tTiltY = nx * 4.5;
        tTiltX = -ny * 3.5;
        if (!tiltRaf) tiltRaf = requestAnimationFrame(stepTilt);
      });
    }

    updateCaption(0, true);
    layoutCards(0);
  });
})();
