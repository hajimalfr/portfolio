/* ==========================================================================
   js/awwwards-fx.js — Chorégraphie & micro-interactions primées Awwwards
   1. Révélation typographique masquée mot par mot (ST.01, ST.02, ST.04, ST.06)
   2. Décodage télémétrique monospace (scramble CAO) à l'entrée de chaque station
   3. Cascade rythmée : spec-chips (ST.01), jalons S1->S6 & Ikigai auto-pulse (ST.02),
      rideau cinéma + parallaxe opposée (ST.04), tuiles contact (ST.06)
   4. Curseur de précision architectural (anneau fluide + label contextuel PC)
   ========================================================================== */
(function () {
  /* ========================================================================
     PARAMÈTRES FACILES À MODIFIER — EFFETS AWWWARDS
     ======================================================================== */
  const CONFIG = {
    scrambleDurationMs: 360,   // Durée du décodage télémétrique monospace (ms)
    ikigaiCycleMs: 3200,       // Rythme du projecteur doux sur l'Ikigai au repos (ms)
    st4ParallaxPx: 18,         // Amplitude de la parallaxe opposée ST.04 (px)
    cursorLerp: 0.16,          // Fluidité de l'anneau du curseur de précision
    enableCustomCursor: true   // Activer le curseur architectural sur PC
  };

  const GLYPHS = '0123456789ABCDEF/+·—';

  document.addEventListener('DOMContentLoaded', () => {
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const stageEl = document.getElementById('stage');
    if (reducedMotion || !stageEl) {
      document.querySelectorAll('.station').forEach((st) => st.classList.add('aw-visible'));
      return;
    }

    /* ----------------------------------------------------------------------
       1. RÉVÉLATION TYPOGRAPHIQUE MASQUÉE MOT PAR MOT (AWWWARDS EDITORIAL)
       ---------------------------------------------------------------------- */
    function splitTitleWords(titleEl) {
      if (!titleEl) return;
      const walk = (node) => {
        if (node.nodeType === 3) {
          const text = node.textContent;
          if (!text || !text.trim()) return;
          const frag = document.createDocumentFragment();
          const parts = text.split(/(\s+)/);
          parts.forEach((part) => {
            if (!part) return;
            if (/^\s+$/.test(part)) {
              frag.appendChild(document.createTextNode(part));
            } else {
              const mask = document.createElement('span');
              mask.className = 'aw-word-mask';
              const inner = document.createElement('span');
              inner.className = 'aw-word';
              inner.textContent = part;
              mask.appendChild(inner);
              frag.appendChild(mask);
            }
          });
          node.parentNode.replaceChild(frag, node);
        } else if (node.nodeType === 1 && node.tagName !== 'BR' && !node.classList.contains('aw-word-mask')) {
          Array.from(node.childNodes).forEach(walk);
        }
      };

      Array.from(titleEl.childNodes).forEach(walk);
      const words = titleEl.querySelectorAll('.aw-word');
      words.forEach((w, idx) => {
        w.style.setProperty('--aw-i', String(idx));
      });
    }

    const animatedTitles = Array.from(
      document.querySelectorAll('#station-1 .st-title-compact, #station-3 .st-title-compact, #station-6 .st6-title')
    );

    function prepareAllTitles() {
      animatedTitles.forEach((el) => splitTitleWords(el));
    }

    prepareAllTitles();
    document.addEventListener('portfolio:langchange', () => {
      document.querySelectorAll('[data-aw-text]').forEach((el) => el.removeAttribute('data-aw-text'));
      requestAnimationFrame(prepareAllTitles);
    });

    /* ----------------------------------------------------------------------
       2. DÉCODAGE TÉLÉMÉTRIQUE MONOSPACE (SCRAMBLE CAO)
       ---------------------------------------------------------------------- */
    function scrambleText(el) {
      if (!el || el.children.length > 0) return;
      const finalText = el.getAttribute('data-aw-text') || el.textContent.trim();
      if (!finalText) return;
      el.setAttribute('data-aw-text', finalText);

      const start = performance.now();
      const dur = CONFIG.scrambleDurationMs;

      function tick(now) {
        const p = Math.min(1, (now - start) / dur);
        const locked = Math.floor(p * finalText.length);
        let out = '';
        for (let i = 0; i < finalText.length; i++) {
          const ch = finalText[i];
          if (ch === ' ' || ch === '·' || ch === '/' || i < locked) {
            out += ch;
          } else {
            out += GLYPHS[(i + Math.floor(now / 28)) % GLYPHS.length];
          }
        }
        el.textContent = out;
        if (p < 1) {
          requestAnimationFrame(tick);
        } else {
          el.textContent = finalText;
        }
      }
      requestAnimationFrame(tick);
    }

    /* ----------------------------------------------------------------------
       3. CHORÉGRAPHIE PAR STATION À L'ENTRÉE DANS L'ÉCRAN
       ---------------------------------------------------------------------- */
    const stations = Array.from(document.querySelectorAll('.station'));
    const revealedSet = new WeakSet();

    // Ajoute le point lumineux voyageur sur la courbe SVG S1 -> S6 (ST.02)
    const trajSvg = document.querySelector('.traj-svg-line');
    if (trajSvg && !trajSvg.querySelector('.traj-beacon')) {
      const ns = 'http://www.w3.org/2000/svg';
      const beacon = document.createElementNS(ns, 'circle');
      beacon.setAttribute('r', '4.5');
      beacon.setAttribute('class', 'traj-beacon');
      const anim = document.createElementNS(ns, 'animateMotion');
      anim.setAttribute('dur', '4.8s');
      anim.setAttribute('repeatCount', 'indefinite');
      anim.setAttribute('path', 'M 30 60 C 200 10, 320 110, 480 60 C 640 10, 740 110, 870 60');
      beacon.appendChild(anim);
      trajSvg.appendChild(beacon);
    }

    function triggerStationReveal(st) {
      st.classList.add('aw-visible');
      if (revealedSet.has(st)) return;
      revealedSet.add(st);

      // Décodage télémétrique sur les étiquettes mono de la station
      const labels = st.querySelectorAll('.st-tag, .st-dim, .traj-code, .dim-top > span:first-child');
      labels.forEach((lbl, idx) => {
        setTimeout(() => scrambleText(lbl), idx * 55);
      });
    }

    if (typeof IntersectionObserver !== 'undefined') {
      const revObs = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              triggerStationReveal(entry.target);
            }
          });
        },
        { root: stageEl, threshold: 0.08 }
      );
      stations.forEach((st) => revObs.observe(st));
    } else {
      stations.forEach(triggerStationReveal);
    }

    /* ----------------------------------------------------------------------
       4. PROJECTEUR AUTOMATIQUE DOUX SUR L'IKIGAI AU REPOS (ST.02)
       ---------------------------------------------------------------------- */
    const ikigaiBlock = document.querySelector('.st5-iki-block');
    const vennCircles = Array.from(document.querySelectorAll('.venn-circle'));
    const ikiCells = Array.from(document.querySelectorAll('.iki-mini-cell'));

    if (ikigaiBlock && vennCircles.length === 4) {
      const poles = ['passion', 'talents', 'mission', 'profession'];
      let poleIdx = 0;
      let userPaused = false;
      let pauseTimer = null;

      function setIkigaiPole(pole) {
        vennCircles.forEach((c) => c.classList.toggle('active', c.getAttribute('data-pole') === pole));
        ikiCells.forEach((c) => c.classList.toggle('active', c.getAttribute('data-pole') === pole));
      }

      const pauseCycle = () => {
        userPaused = true;
        clearTimeout(pauseTimer);
        pauseTimer = setTimeout(() => {
          userPaused = false;
        }, 6500);
      };

      ikigaiBlock.addEventListener('pointerenter', pauseCycle);
      ikigaiBlock.addEventListener('click', pauseCycle);

      setInterval(() => {
        if (userPaused || document.hidden) return;
        const rect = ikigaiBlock.getBoundingClientRect();
        if (rect.bottom < 0 || rect.top > window.innerHeight) return;
        poleIdx = (poleIdx + 1) % poles.length;
        setIkigaiPole(poles[poleIdx]);
      }, CONFIG.ikigaiCycleMs);
    }

    /* ----------------------------------------------------------------------
       5. PARALLAXE SCULPTURALE OPPOSÉE SUR LE TRIO ST.04 (BREAKING / TSUNAMI)
       ---------------------------------------------------------------------- */
    const st3El = document.getElementById('station-3');
    const st3Photos = st3El ? Array.from(st3El.querySelectorAll('.st3-trio-photo')) : [];
    const st3Center = st3El ? st3El.querySelector('.st3-trio-3d') : null;

    if (st3El && st3Photos.length && window.innerWidth > 980) {
      let paraRaf = null;
      function updateSt3Parallax() {
        paraRaf = null;
        if (window.innerWidth <= 980) return;
        const rect = st3El.getBoundingClientRect();
        const vh = window.innerHeight || 1;
        if (rect.bottom < -100 || rect.top > vh + 100) return;
        const progress = (rect.top + rect.height * 0.5 - vh * 0.5) / vh; // -1 .. +1
        const shift = Math.max(-1, Math.min(1, progress)) * CONFIG.st4ParallaxPx;

        if (st3Photos[0]) st3Photos[0].style.transform = `translate3d(0, ${(-shift).toFixed(1)}px, 0)`;
        if (st3Center) st3Center.style.transform = `translate3d(0, ${(shift * 0.65).toFixed(1)}px, 0)`;
        if (st3Photos[1]) st3Photos[1].style.transform = `translate3d(0, ${(-shift * 0.85).toFixed(1)}px, 0)`;
      }

      stageEl.addEventListener('scroll', () => {
        if (!paraRaf) paraRaf = requestAnimationFrame(updateSt3Parallax);
      }, { passive: true });
      updateSt3Parallax();
    }

    /* ----------------------------------------------------------------------
       6. CURSEUR ARCHITECTURAL DE PRÉCISION (PC UNIQUEMENT)
       ---------------------------------------------------------------------- */
    const isDesktopFine =
      CONFIG.enableCustomCursor &&
      window.matchMedia('(hover: hover) and (pointer: fine)').matches &&
      window.innerWidth > 900;

    if (isDesktopFine) {
      const ring = document.createElement('div');
      ring.className = 'aw-cursor-ring';
      ring.setAttribute('aria-hidden', 'true');
      const label = document.createElement('span');
      label.className = 'aw-cursor-label mono';
      ring.appendChild(label);
      document.body.appendChild(ring);

      let mx = -100, my = -100, rx = -100, ry = -100;
      let cursorRaf = null;
      let visible = false;

      function stepCursor() {
        rx += (mx - rx) * CONFIG.cursorLerp;
        ry += (my - ry) * CONFIG.cursorLerp;
        ring.style.transform = `translate3d(${rx.toFixed(1)}px, ${ry.toFixed(1)}px, 0)`;

        if (Math.abs(mx - rx) > 0.25 || Math.abs(my - ry) > 0.25) {
          cursorRaf = requestAnimationFrame(stepCursor);
        } else {
          cursorRaf = null;
        }
      }

      window.addEventListener('pointermove', (e) => {
        mx = e.clientX;
        my = e.clientY;
        if (!visible) {
          visible = true;
          rx = mx;
          ry = my;
          ring.classList.add('is-visible');
        }
        if (!cursorRaf) cursorRaf = requestAnimationFrame(stepCursor);

        const target = e.target;
        if (!target || !target.closest) return;

        if (target.closest('.helmet-canvas-wrap, .tsunami-canvas-wrap')) {
          ring.className = 'aw-cursor-ring is-visible is-label';
          label.textContent = '360°';
        } else if (target.closest('.cad-viewport')) {
          ring.className = 'aw-cursor-ring is-visible is-label';
          label.textContent = 'PAN';
        } else if (target.closest('.v-card')) {
          ring.className = 'aw-cursor-ring is-visible is-label';
          label.textContent = 'VIEW';
        } else if (target.closest('button, a, .venn-circle, .contact-tile')) {
          ring.className = 'aw-cursor-ring is-visible is-active';
          label.textContent = '';
        } else {
          ring.className = 'aw-cursor-ring is-visible';
          label.textContent = '';
        }
      }, { passive: true });

      document.addEventListener('pointerleave', () => {
        visible = false;
        ring.classList.remove('is-visible');
      });
    }
  });
})();
