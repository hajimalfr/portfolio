/* ==========================================================================
   js/cad-window.js — Fenêtre Manifeste CAO façon Fusion 360 × sbwebdesign.ch
   - Courbe en arche au scroll : zoom vectoriel 100 % -> 195 % -> retour 100 %
     en fin de scroll (zéro pixellisation, font-size vectoriel réel)
   - Retour libre vers ST.03 en scrollant vers le haut depuis le début (0 %)
   - Animations synchronisées : étapes 01/04→04/04, curseur orange & inspecteur
   ========================================================================== */
(function () {
  /* ========================================================================
     PARAMÈTRES FACILES À MODIFIER — FENÊTRE MANIFESTE CAO (ST.04)
     ======================================================================== */
  const CONFIG = {
    peakExtraScale: 0.95, // Zoom max au milieu de l'arche (0.95 => 195 %, retour à 100 % à la fin)
    baseFontDesktop: 25,  // Taille de base du manifeste sur ordinateur (px)
    baseFontMobile: 19,   // Taille de base du manifeste sur mobile (px)
    wheelStep: 0.16,      // Pas par cran de molette (~6 crans pour faire l'arche complète)
    swipeStep: 0.34       // Pas par swipe sur téléphone (3 swipes fluides pour faire l'arche)
  };

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

    const PEAK_EXTRA_SCALE = CONFIG.peakExtraScale;
    const BASE_FONT_PX = window.innerWidth < 768 ? CONFIG.baseFontMobile : CONFIG.baseFontDesktop;

    let progress = 0; // 0.0 -> 1.0
    let targetProgress = 0;
    let scale = 1.0;
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
        weight: 760,
        track: '-0.030em',
        cursorPos: 'translate3d(-310px, 4px, 0)'
      },
      {
        key: 'choix',
        step: '04/04',
        noteKey: 'cad.noteChoix',
        commentKey: 'cad.cChoix',
        weight: 800,
        track: '-0.022em',
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

    function syncStepFromProgress(p) {
      let nextKey = 'realisation';
      if (p >= 0.78) nextKey = 'choix';
      else if (p >= 0.5) nextKey = 'design';
      else if (p >= 0.24) nextKey = 'utilite';

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
      progress += (targetProgress - progress) * 0.16;
      panX += (targetPanX - panX) * 0.2;
      panY += (targetPanY - panY) * 0.2;

      // Arche sinusoïdale : 100% au début -> 195% au milieu -> retour propre à 100% à la fin
      scale = 1.0 + Math.sin(progress * Math.PI) * PEAK_EXTRA_SCALE;

      // Zoom vectoriel pur (font-size réel) : zéro pixellisation
      manifestoText.style.fontSize = `${(BASE_FONT_PX * scale).toFixed(2)}px`;
      content.style.transform = `translate3d(${panX.toFixed(1)}px, ${panY.toFixed(1)}px, 0)`;

      syncStepFromProgress(progress);
      updateReadouts();

      const done =
        Math.abs(targetProgress - progress) < 0.0015 &&
        Math.abs(targetPanX - panX) < 0.2 &&
        Math.abs(targetPanY - panY) < 0.2;

      if (!done) {
        rafId = requestAnimationFrame(animate);
      } else {
        progress = targetProgress;
        scale = 1.0 + Math.sin(progress * Math.PI) * PEAK_EXTRA_SCALE;
        panX = targetPanX;
        panY = targetPanY;
        manifestoText.style.fontSize = `${(BASE_FONT_PX * scale).toFixed(2)}px`;
        content.style.transform = `translate3d(${panX}px, ${panY}px, 0)`;
        syncStepFromProgress(progress);
        updateReadouts();
        rafId = null;
      }
    }

    function kickAnim() {
      if (!rafId) rafId = requestAnimationFrame(animate);
    }

    function resetView() {
      targetProgress = 0;
      targetPanX = 0;
      targetPanY = 0;
      applyStep('realisation');
      kickAnim();
    }

    /* API exposée à main.js pour piloter obligatoirement l'arche zoom→dézoom sur ST.04
       (molette partout sur ST.04 + swipe tactile sur téléphone, sans jamais bloquer) */
    function stepArch(direction, isSwipe = false) {
      if (direction < 0 && targetProgress <= 0.01) return false; // Prêt à remonter vers ST.03
      if (direction > 0 && targetProgress >= 0.99) return false; // Arche terminée -> descendre vers ST.05

      const step = isSwipe ? CONFIG.swipeStep : CONFIG.wheelStep;
      targetProgress = clamp(targetProgress + Math.sign(direction) * step, 0, 1);

      if (targetProgress <= 0.05 || targetProgress >= 0.95) {
        targetPanX = 0;
        targetPanY = 0;
      }
      kickAnim();
      return true;
    }

    function prepareOnEnter(fromIndex) {
      targetProgress = fromIndex > 4 ? 1 : 0;
      progress = targetProgress;
      targetPanX = 0;
      targetPanY = 0;
      panX = 0;
      panY = 0;
      scale = 1.0;
      manifestoText.style.fontSize = `${BASE_FONT_PX}px`;
      content.style.transform = 'translate3d(0px, 0px, 0)';
      applyStep(targetProgress >= 0.9 ? 'choix' : 'realisation');
      updateReadouts();
    }

    window.CadManifestoController = {
      stepArch,
      prepareOnEnter
    };

    /* Molette directement dans le viewport CAO */
    viewport.addEventListener(
      'wheel',
      (e) => {
        const dir = Math.sign(e.deltaY);
        if (!dir) return;
        if (stepArch(dir, false)) {
          e.preventDefault();
          e.stopPropagation();
        }
      },
      { passive: false }
    );

    /* Pan au glisser (souris/trackpad — sur téléphone le swipe vertical pilote l'arche) */
    viewport.addEventListener('pointerdown', (e) => {
      if (e.button !== 0 || e.pointerType === 'touch') return;
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
    const stepProgressMap = {
      realisation: 0.0,
      utilite: 0.34,
      design: 0.62,
      choix: 1.0
    };

    document.querySelectorAll('.cad-node').forEach((btn) => {
      btn.addEventListener('click', () => {
        const key = btn.getAttribute('data-highlight');
        switchCadTab('manifesto');
        if (stepProgressMap[key] !== undefined) {
          targetProgress = stepProgressMap[key];
          if (targetProgress === 0 || targetProgress === 1) {
            targetPanX = 0;
            targetPanY = 0;
          }
          kickAnim();
        }
        applyStep(key);
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
