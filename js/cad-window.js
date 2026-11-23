/* ==========================================================================
   js/cad-window.js — Fenêtre Manifeste CAO façon Fusion 360 × sbwebdesign.ch
   - Zoom vectoriel net (font-size réel, zéro pixellisation)
   - Retour libre vers le haut à la molette dès que le zoom est à 100 %
   - Animations synchronisées au zoom : étapes 01/04→04/04, curseur orange,
     inspecteur typographique live & pastille de dimensions
   ========================================================================== */
(function () {
  document.addEventListener('DOMContentLoaded', () => {
    const viewport = document.getElementById('cadViewport');
    const content = document.getElementById('cadContent');
    const manifestoText = document.getElementById('cadManifestoText');
    const zoomReadout = document.getElementById('cadZoomReadout');
    const coordsReadout = document.getElementById('cadCoords');
    const resetBtn = document.getElementById('cadResetBtn');
    const noteText = document.getElementById('cadNoteText');
    const stepCounter = document.getElementById('cadStepCounter');
    const quoteBadge = document.getElementById('cadQuoteBadge');
    const metricScale = document.getElementById('cadMetricScale');
    const metricWeight = document.getElementById('cadMetricWeight');
    const metricTrack = document.getElementById('cadMetricTrack');
    const liveCursor = document.getElementById('cadLiveCursor');
    const cursorComment = document.getElementById('cadCursorComment');

    if (!viewport || !content || !manifestoText) return;

    const MIN_SCALE = 1.0;
    const MAX_SCALE = 2.2;
    const BASE_FONT_PX = window.innerWidth < 768 ? 19 : 25;

    let scale = 1.0;
    let targetScale = 1.0;
    let panX = 0;
    let panY = 0;
    let targetPanX = 0;
    let targetPanY = 0;

    let isPanning = false;
    let startX = 0;
    let startY = 0;
    let originPanX = 0;
    let originPanY = 0;
    let rafId = null;

    const STEPS = [
      {
        key: 'realisation',
        step: '01/04',
        noteKey: 'cad.noteReal',
        commentKey: 'cad.cReal',
        weight: 640,
        track: '-0.015em',
        cursorPos: 'translate3d(0px, 0px, 0)'
      },
      {
        key: 'utilite',
        step: '02/04',
        noteKey: 'cad.noteUtil',
        commentKey: 'cad.cUtil',
        weight: 700,
        track: '-0.024em',
        cursorPos: 'translate3d(-180px, 118px, 0)'
      },
      {
        key: 'design',
        step: '03/04',
        noteKey: 'cad.noteDesign',
        commentKey: 'cad.cDesign',
        weight: 750,
        track: '-0.030em',
        cursorPos: 'translate3d(-310px, 4px, 0)'
      },
      {
        key: 'choix',
        step: '04/04',
        noteKey: 'cad.noteChoix',
        commentKey: 'cad.cChoix',
        weight: 800,
        track: '-0.036em',
        cursorPos: 'translate3d(-30px, 128px, 0)'
      }
    ];

    let activeStepKey = 'realisation';

    function clamp(v, min, max) {
      return Math.min(max, Math.max(min, v));
    }

    function applyStep(key) {
      const cfg = STEPS.find((s) => s.key === key) || STEPS[0];
      activeStepKey = cfg.key;

      document.querySelectorAll('.cad-node').forEach((btn) => {
        btn.classList.toggle('active', btn.getAttribute('data-highlight') === cfg.key);
      });

      document.querySelectorAll('.m-seg').forEach((seg) => {
        seg.classList.toggle('is-highlighted', seg.getAttribute('data-seg') === cfg.key);
      });

      if (stepCounter) stepCounter.textContent = cfg.step;
      if (metricWeight) metricWeight.textContent = String(cfg.weight);
      if (metricTrack) metricTrack.textContent = cfg.track;

      manifestoText.style.fontVariationSettings = `'wght' ${cfg.weight}`;
      manifestoText.style.letterSpacing = cfg.track;

      if (liveCursor) {
        liveCursor.style.transform = cfg.cursorPos;
      }

      if (window.PortfolioI18n) {
        if (noteText) noteText.textContent = window.PortfolioI18n.t(cfg.noteKey);
        if (cursorComment) cursorComment.textContent = window.PortfolioI18n.t(cfg.commentKey);
      }
    }

    function syncStepFromZoom(s) {
      let nextKey = 'realisation';
      if (s >= 1.82) nextKey = 'choix';
      else if (s >= 1.52) nextKey = 'design';
      else if (s >= 1.24) nextKey = 'utilite';

      if (nextKey !== activeStepKey) {
        applyStep(nextKey);
      }
    }

    function updateReadouts() {
      const pct = Math.round(scale * 100);
      const px = Math.round(BASE_FONT_PX * scale);

      if (zoomReadout) zoomReadout.textContent = `${pct}%`;
      if (metricScale) metricScale.textContent = `${pct}%`;
      if (quoteBadge) quoteBadge.textContent = `Bricolage · ${px} px · ${pct}%`;

      if (coordsReadout) {
        const xStr = panX.toFixed(1).padStart(6, ' ');
        const yStr = (-panY).toFixed(1).padStart(6, ' ');
        coordsReadout.textContent = `X:${xStr} · Y:${yStr}`;
      }
    }

    function animate() {
      scale += (targetScale - scale) * 0.2;
      panX += (targetPanX - panX) * 0.22;
      panY += (targetPanY - panY) * 0.22;

      // Zoom vectoriel pur (font-size réel) : zéro pixellisation des lettres
      manifestoText.style.fontSize = `${(BASE_FONT_PX * scale).toFixed(2)}px`;
      content.style.transform = `translate3d(${panX.toFixed(1)}px, ${panY.toFixed(1)}px, 0)`;

      syncStepFromZoom(scale);
      updateReadouts();

      const done =
        Math.abs(targetScale - scale) < 0.002 &&
        Math.abs(targetPanX - panX) < 0.2 &&
        Math.abs(targetPanY - panY) < 0.2;

      if (!done) {
        rafId = requestAnimationFrame(animate);
      } else {
        scale = targetScale;
        panX = targetPanX;
        panY = targetPanY;
        manifestoText.style.fontSize = `${(BASE_FONT_PX * scale).toFixed(2)}px`;
        content.style.transform = `translate3d(${panX}px, ${panY}px, 0)`;
        syncStepFromZoom(scale);
        updateReadouts();
        rafId = null;
      }
    }

    function kickAnim() {
      if (!rafId) rafId = requestAnimationFrame(animate);
    }

    function resetView() {
      targetScale = 1.0;
      targetPanX = 0;
      targetPanY = 0;
      applyStep('realisation');
      kickAnim();
    }

    /* Molette dans la fenêtre CAO :
       - Vers le bas (deltaY > 0) : agrandit le texte vectoriellement + anime les étapes
       - Vers le haut (deltaY < 0) : dézoome jusqu'à 100 %, puis laisse remonter librement vers ST.03 ! */
    viewport.addEventListener(
      'wheel',
      (e) => {
        // Si déjà à 100 % et qu'on scrolle vers le haut => ne pas bloquer, laisser main.js remonter !
        if (e.deltaY < 0 && targetScale <= MIN_SCALE + 0.01) {
          return;
        }

        e.preventDefault();
        e.stopPropagation();

        const direction = Math.sign(e.deltaY);
        targetScale = clamp(targetScale + direction * 0.14, MIN_SCALE, MAX_SCALE);

        // Recentrer progressivement le pan quand on revient à 100 %
        if (targetScale <= 1.04) {
          targetPanX = 0;
          targetPanY = 0;
        }
        kickAnim();
      },
      { passive: false }
    );

    /* Pan au glisser */
    viewport.addEventListener('pointerdown', (e) => {
      if (e.button !== 0) return;
      isPanning = true;
      startX = e.clientX;
      startY = e.clientY;
      originPanX = targetPanX;
      originPanY = targetPanY;
      viewport.setPointerCapture(e.pointerId);
    });

    viewport.addEventListener('pointermove', (e) => {
      if (!isPanning) return;
      targetPanX = clamp(originPanX + (e.clientX - startX), -280, 280);
      targetPanY = clamp(originPanY + (e.clientY - startY), -180, 180);
      kickAnim();
    });

    function endPan(e) {
      if (!isPanning) return;
      isPanning = false;
      try {
        viewport.releasePointerCapture(e.pointerId);
      } catch (_) {}
    }

    viewport.addEventListener('pointerup', endPan);
    viewport.addEventListener('pointercancel', endPan);
    viewport.addEventListener('dblclick', resetView);

    if (resetBtn) {
      resetBtn.addEventListener('click', resetView);
    }

    /* Clic direct dans l'arborescence Fusion 360 */
    document.querySelectorAll('.cad-node').forEach((btn) => {
      btn.addEventListener('click', () => {
        switchCadTab('manifesto');
        applyStep(btn.getAttribute('data-highlight'));
      });
    });

    document.addEventListener('portfolio:langchange', () => {
      applyStep(activeStepKey);
    });

    /* Onglets dans le ruban CAO */
    function switchCadTab(tabName) {
      document.querySelectorAll('.cad-tab').forEach((tab) => {
        const match = tab.getAttribute('data-cad-tab') === tabName;
        tab.classList.toggle('active', match);
        tab.setAttribute('aria-selected', String(match));
      });
      document.querySelectorAll('.cad-panel').forEach((panel) => {
        panel.classList.toggle('active', panel.id === `cadPanel-${tabName}`);
      });
    }

    document.querySelectorAll('.cad-tab').forEach((tab) => {
      tab.addEventListener('click', () => {
        switchCadTab(tab.getAttribute('data-cad-tab'));
      });
    });

    manifestoText.style.fontSize = `${BASE_FONT_PX}px`;
    applyStep('realisation');
    updateReadouts();
  });
})();
