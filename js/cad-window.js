/* ==========================================================================
   js/cad-window.js — Fenêtre Manifeste CAO façon Fusion 360 / AutoCAD
   Zoom molette (bloque changement de station), pan au glisser, reset, onglets
   ========================================================================== */
(function () {
  document.addEventListener('DOMContentLoaded', () => {
    const viewport = document.getElementById('cadViewport');
    const content = document.getElementById('cadContent');
    const zoomReadout = document.getElementById('cadZoomReadout');
    const coordsReadout = document.getElementById('cadCoords');
    const resetBtn = document.getElementById('cadResetBtn');
    const noteText = document.getElementById('cadNoteText');

    if (!viewport || !content) return;

    const MIN_SCALE = 0.72;
    const MAX_SCALE = 2.4;

    let scale = 1;
    let targetScale = 1;
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

    function clamp(v, min, max) {
      return Math.min(max, Math.max(min, v));
    }

    function updateReadouts() {
      if (zoomReadout) {
        zoomReadout.textContent = `${Math.round(scale * 100)}%`;
      }
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

      content.style.transform = `translate3d(${panX.toFixed(2)}px, ${panY.toFixed(2)}px, 0) scale(${scale.toFixed(4)})`;
      updateReadouts();

      const done =
        Math.abs(targetScale - scale) < 0.001 &&
        Math.abs(targetPanX - panX) < 0.2 &&
        Math.abs(targetPanY - panY) < 0.2;

      if (!done) {
        rafId = requestAnimationFrame(animate);
      } else {
        scale = targetScale;
        panX = targetPanX;
        panY = targetPanY;
        content.style.transform = `translate3d(${panX}px, ${panY}px, 0) scale(${scale})`;
        updateReadouts();
        rafId = null;
      }
    }

    function kickAnim() {
      if (!rafId) rafId = requestAnimationFrame(animate);
    }

    function resetView() {
      targetScale = 1;
      targetPanX = 0;
      targetPanY = 0;
      kickAnim();
    }

    /* Molette dans la fenêtre CAO :
       bloque le changement de station et agrandit fluidement en tournant vers le bas */
    viewport.addEventListener(
      'wheel',
      (e) => {
        e.preventDefault();
        e.stopPropagation();

        // deltaY > 0 (molette vers le bas) => zoom avant (+)
        const direction = Math.sign(e.deltaY);
        const step = direction * 0.12;
        targetScale = clamp(targetScale + step, MIN_SCALE, MAX_SCALE);
        kickAnim();
      },
      { passive: false }
    );

    /* Déplacement panoramique (pan) au glisser */
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
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;
      targetPanX = clamp(originPanX + dx, -280, 280);
      targetPanY = clamp(originPanY + dy, -180, 180);
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

    /* Légende latérale façon Browser Fusion 360 */
    const noteKeyMap = {
      realisation: 'cad.noteReal',
      utilite: 'cad.noteUtil',
      design: 'cad.noteDesign',
      choix: 'cad.noteChoix'
    };

    let activeHighlight = 'realisation';

    function applyHighlight(key) {
      activeHighlight = key;
      document.querySelectorAll('.cad-node').forEach((btn) => {
        btn.classList.toggle('active', btn.getAttribute('data-highlight') === key);
      });
      document.querySelectorAll('.m-seg').forEach((seg) => {
        seg.classList.toggle('is-highlighted', seg.getAttribute('data-seg') === key);
      });
      if (noteText && window.PortfolioI18n && noteKeyMap[key]) {
        noteText.textContent = window.PortfolioI18n.t(noteKeyMap[key]);
      }
    }

    document.querySelectorAll('.cad-node').forEach((btn) => {
      btn.addEventListener('click', () => {
        // Revenir automatiquement sur l'onglet Manifeste si besoin
        switchCadTab('manifesto');
        applyHighlight(btn.getAttribute('data-highlight'));
      });
    });

    document.addEventListener('portfolio:langchange', () => {
      if (noteText && window.PortfolioI18n && noteKeyMap[activeHighlight]) {
        noteText.textContent = window.PortfolioI18n.t(noteKeyMap[activeHighlight]);
      }
    });

    /* Onglets dans le ruban CAO : Manifeste / S1 → S6 / Ikigai */
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

    // Mise en évidence initiale subtile
    applyHighlight('realisation');
    updateReadouts();
  });
})();
