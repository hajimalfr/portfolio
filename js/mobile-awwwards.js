/* ==========================================================================
   js/mobile-awwwards.js — Moteur Motion Design Awwwards (TÉLÉPHONE <= 640px)
   100 % scroll-driven & passif (zéro blocage au pouce, desktop 100 % intact) :
   - Rideaux empilés + profondeur au scroll (recul doux de la station sortante)
   - Numéros de chapitres géants (01 -> 06) en parallaxe verticale au pouce
   - ST.02A repensée : ligne d'élévation verticale qui se trace en direct au scroll
   - ST.02B Ikigai : barre tactile 4 pôles synchronisée aux cercles SVG
   - Rubans typographiques cinétiques liés à la vitesse + skew du scroll
   - Parallaxe éditoriale opposée sur le collage magazine ST.04 (Breaking)
   - Volet d'index plein écran cinétique au tap sur la pastille VVC | ST.0X
   ========================================================================== */
(function () {
  /* ========================================================================
     PARAMÈTRES FACILES À MODIFIER — MOTION MOBILE AWWWARDS
     ======================================================================== */
  const CONFIG = {
    maxMobileWidth: 640,     // Seuil mobile (px)
    watermarkParallax: 36,   // Amplitude parallaxe des numéros 01-06 (px)
    photoParallax: 20,       // Parallaxe opposée photos ST.04 (px)
    ribbonBaseSpeed: 0.38,   // Vitesse au repos du ruban typographique (px/frame)
    ribbonVelBoost: 0.45     // Accélération liée à la vitesse du pouce
  };

  document.addEventListener('DOMContentLoaded', () => {
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const stageEl = document.getElementById('stage');
    if (!stageEl || window.innerWidth > CONFIG.maxMobileWidth) return;

    /* ----------------------------------------------------------------------
       1. TIROIR D'INDEX PLEIN ÉCRAN CINÉTIQUE (TAP SUR VVC | ST.0X)
       ---------------------------------------------------------------------- */
    const drawer = document.getElementById('mobileNavDrawer');
    const brandBtn = document.querySelector('.brand-btn');
    const drawerClose = document.getElementById('mobileDrawerClose');
    const drawerLinks = drawer ? Array.from(drawer.querySelectorAll('[data-m-goto]')) : [];

    function setDrawer(open) {
      if (!drawer) return;
      drawer.classList.toggle('is-open', open);
      drawer.setAttribute('aria-hidden', String(!open));
    }

    if (brandBtn && drawer) {
      brandBtn.addEventListener('click', (e) => {
        if (window.innerWidth > CONFIG.maxMobileWidth) return;
        e.preventDefault();
        e.stopImmediatePropagation();
        setDrawer(!drawer.classList.contains('is-open'));
      }, true);
    }

    if (drawerClose) {
      drawerClose.addEventListener('click', () => setDrawer(false));
    }

    drawerLinks.forEach((btn) => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.getAttribute('data-m-goto'), 10);
        setDrawer(false);
        const stations = document.querySelectorAll('.station');
        if (!Number.isNaN(idx) && stations[idx]) {
          stageEl.scrollTo({ top: stations[idx].offsetTop, behavior: 'smooth' });
        }
      });
    });

    /* ----------------------------------------------------------------------
       2. NUMÉROS DE CHAPITRES GÉANTS (01 -> 06) EN PARALLAXE
       ---------------------------------------------------------------------- */
    const watermarks = [];
    document.querySelectorAll('.station').forEach((st) => {
      const idx = parseInt(st.getAttribute('data-index'), 10);
      if (Number.isNaN(idx) || idx === 0) return;
      if (st.querySelector(':scope > .m-watermark')) return;
      const wm = document.createElement('span');
      wm.className = 'm-watermark mono';
      wm.setAttribute('aria-hidden', 'true');
      wm.textContent = String(idx).padStart(2, '0');
      st.prepend(wm);
      watermarks.push({ st, wm });
    });

    /* ----------------------------------------------------------------------
       3. ST.02A REPENSÉE : RAIL D'ÉLÉVATION VERTICAL TRACÉ AU SCROLL
       ---------------------------------------------------------------------- */
    const trajWrap = document.querySelector('.st5-traj-wrap');
    const trajSteps = Array.from(document.querySelectorAll('.traj-step'));
    let elevFill = null;

    if (trajWrap && trajSteps.length) {
      const rail = document.createElement('div');
      rail.className = 'm-elev-rail';
      rail.setAttribute('aria-hidden', 'true');
      elevFill = document.createElement('div');
      elevFill.className = 'm-elev-fill';
      rail.appendChild(elevFill);
      trajWrap.prepend(rail);
    }

    /* ----------------------------------------------------------------------
       4. ST.02B IKIGAI : SÉLECTEUR TACTILE 4 PÔLES SYNCHRONISÉ
       ---------------------------------------------------------------------- */
    const ikiBlock = document.querySelector('.st5-iki-block');
    const vennCircles = Array.from(document.querySelectorAll('.venn-circle'));
    const ikiCells = Array.from(document.querySelectorAll('.iki-mini-cell'));

    if (ikiBlock && vennCircles.length === 4 && !ikiBlock.querySelector('.m-iki-tabs')) {
      const poles = [
        { key: 'passion', fr: '01 PASSION', en: '01 PASSION' },
        { key: 'talents', fr: '02 TALENTS', en: '02 SKILLS' },
        { key: 'mission', fr: '03 MISSION', en: '03 MISSION' },
        { key: 'profession', fr: '04 MÉTIER', en: '04 CAREER' }
      ];
      const tabBar = document.createElement('div');
      tabBar.className = 'm-iki-tabs mono';

      const tabBtns = poles.map((p, idx) => {
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'm-iki-tab' + (idx === 0 ? ' active' : '');
        b.setAttribute('data-pole', p.key);
        const isEn = window.PortfolioI18n && window.PortfolioI18n.getLang() === 'en';
        b.textContent = isEn ? p.en : p.fr;
        b.addEventListener('click', () => activatePole(p.key));
        tabBar.appendChild(b);
        return b;
      });

      function activatePole(pole) {
        vennCircles.forEach((c) => c.classList.toggle('active', c.getAttribute('data-pole') === pole));
        ikiCells.forEach((c) => c.classList.toggle('active', c.getAttribute('data-pole') === pole));
        tabBtns.forEach((b) => b.classList.toggle('active', b.getAttribute('data-pole') === pole));
      }

      vennCircles.forEach((c) => {
        c.addEventListener('click', () => activatePole(c.getAttribute('data-pole')));
      });

      document.addEventListener('portfolio:langchange', () => {
        const isEn = window.PortfolioI18n && window.PortfolioI18n.getLang() === 'en';
        tabBtns.forEach((b, idx) => {
          b.textContent = isEn ? poles[idx].en : poles[idx].fr;
        });
      });

      const vennLayout = ikiBlock.querySelector('.ikigai-venn-layout');
      const cardsWrap = ikiBlock.querySelector('.ikigai-venn-cards');
      if (vennLayout && cardsWrap) {
        vennLayout.insertBefore(tabBar, cardsWrap);
      }
    }

    if (reducedMotion) return;

    /* ----------------------------------------------------------------------
       5. RÉVÉLATIONS MOTION AU SCROLL (RIDEAUX PHOTO, FILETS 1px, ST.06)
       ---------------------------------------------------------------------- */
    const revealTargets = Array.from(
      document.querySelectorAll('.station, .st3-trio-photo, .contact-tile, .traj-step')
    );

    if (typeof IntersectionObserver !== 'undefined') {
      const mObs = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              entry.target.classList.add('m-in');
            }
          });
        },
        { root: stageEl, threshold: 0.1 }
      );
      revealTargets.forEach((el) => mObs.observe(el));
    } else {
      revealTargets.forEach((el) => el.classList.add('m-in'));
    }

    /* ----------------------------------------------------------------------
       6. BOUCLE MOTION CONTINUE 60 IPS :
          - Rubans cinétiques réactifs à la vitesse + skew du pouce
          - Effet cartes empilées (recul doux de la station qui sort)
          - Parallaxe des numéros 01–06 + photos Breaking ST.04
          - Remplissage live du rail vertical ST.02A
       ---------------------------------------------------------------------- */
    const ribbons = Array.from(document.querySelectorAll('.m-velocity-ribbon')).map((el, idx) => ({
      el,
      track: el.querySelector('.m-ribbon-track'),
      dir: idx % 2 === 0 ? -1 : 1,
      x: 0
    }));

    const curtainStations = Array.from(document.querySelectorAll('.station')).filter(
      (st) => st.id !== 'station-2' && st.id !== 'station-4'
    );

    const st3El = document.getElementById('station-3');
    const st3Photos = st3El ? Array.from(st3El.querySelectorAll('.st3-trio-photo')) : [];

    let lastScrollTop = stageEl.scrollTop;
    let scrollVel = 0;
    let smoothVel = 0;

    stageEl.addEventListener(
      'scroll',
      () => {
        const cur = stageEl.scrollTop;
        scrollVel = cur - lastScrollTop;
        lastScrollTop = cur;
      },
      { passive: true }
    );

    function frame() {
      const vh = window.innerHeight || 1;

      // Amortissement fluide de la vitesse du pouce
      smoothVel += (scrollVel - smoothVel) * 0.14;
      scrollVel *= 0.82;

      // A. Rubans typographiques cinétiques (vitesse + skew liés au pouce)
      const clampedSkew = Math.max(-7, Math.min(7, smoothVel * 0.22));
      for (const r of ribbons) {
        if (!r.track) continue;
        const rect = r.el.getBoundingClientRect();
        if (rect.bottom < -60 || rect.top > vh + 60) continue;
        r.x += r.dir * (CONFIG.ribbonBaseSpeed + Math.abs(smoothVel) * CONFIG.ribbonVelBoost);
        const halfW = r.track.scrollWidth * 0.5 || 600;
        if (r.x <= -halfW) r.x += halfW;
        if (r.x >= 0) r.x -= halfW;
        r.track.style.transform = `translate3d(${r.x.toFixed(1)}px, 0, 0) skewX(${(-clampedSkew * r.dir).toFixed(2)}deg)`;
      }

      // B. Recul doux "Cartes empilées" sur les stations sortantes par le haut
      for (const st of curtainStations) {
        const inner = st.querySelector('.station-inner');
        if (!inner) continue;
        const rect = st.getBoundingClientRect();
        if (rect.top < 0 && rect.bottom > 0) {
          const outP = Math.min(1, Math.abs(rect.top) / Math.max(vh * 0.85, rect.height));
          const sc = 1 - outP * 0.055;
          const op = 1 - outP * 0.28;
          inner.style.transform = `scale(${sc.toFixed(4)})`;
          inner.style.opacity = op.toFixed(3);
        } else if (rect.top >= 0 && rect.top < vh * 1.15) {
          inner.style.transform = 'scale(1)';
          inner.style.opacity = '1';
        }
      }

      // C. Parallaxe verticale des numéros géants 01 -> 06
      for (const item of watermarks) {
        const rect = item.st.getBoundingClientRect();
        if (rect.bottom < -80 || rect.top > vh + 80) continue;
        const norm = (rect.top + rect.height * 0.5 - vh * 0.5) / vh;
        const shift = Math.max(-1, Math.min(1, norm)) * CONFIG.watermarkParallax;
        item.wm.style.transform = `translate3d(0, ${shift.toFixed(1)}px, 0)`;
      }

      // D. Remplissage en direct du rail vertical ST.02A (S1 -> S2 -> S3-S6)
      if (trajWrap && elevFill) {
        const rect = trajWrap.getBoundingClientRect();
        const prog = Math.max(0, Math.min(1, (vh * 0.68 - rect.top) / Math.max(120, rect.height)));
        elevFill.style.height = `${(prog * 100).toFixed(1)}%`;
        trajSteps.forEach((step, idx) => {
          const threshold = idx * 0.34;
          step.classList.toggle('m-step-lit', prog >= threshold);
        });
      }

      // E. Parallaxe éditoriale opposée sur le collage magazine ST.04
      if (st3El && st3Photos.length === 2) {
        const rect = st3El.getBoundingClientRect();
        if (rect.bottom > -80 && rect.top < vh + 80) {
          const norm = Math.max(-1, Math.min(1, (rect.top + rect.height * 0.5 - vh * 0.5) / vh));
          const dy = norm * CONFIG.photoParallax;
          st3Photos[0].style.transform = `translate3d(0, ${(-dy).toFixed(1)}px, 0)`;
          st3Photos[1].style.transform = `translate3d(0, ${(dy * 0.85).toFixed(1)}px, 0)`;
        }
      }

      requestAnimationFrame(frame);
    }

    requestAnimationFrame(frame);
  });
})();
