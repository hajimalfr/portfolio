/* ==========================================================================
   js/main.js — Preloader vertical, Animation lettre-par-lettre sbwebdesign.ch,
   Navigation par stations 100dvh, Boutons magnétiques, Rognage photo & CV
   ========================================================================== */
(function () {
  /* ========================================================================
     PARAMÈTRES FACILES À MODIFIER — NAVIGATION, PRELOADER & INTERACTIONS
     ======================================================================== */
  const CONFIG = {
    preloaderDurationMs: 860, // Durée du chargement initial (ms)
    desktopWheelFactor: 0.56, // Vitesse posée du défilé continu sur PC
    desktopWheelLerp: 0.11,   // Douceur de l'inertie sur PC
    emailFallback: 'victorvalroff@hotmail.com'
  };

  document.addEventListener('DOMContentLoaded', () => {
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    /* ----------------------------------------------------------------------
       00. MODE SOMBRE AUTOMATIQUE (SYSTÈME TÉLÉPHONE / PC) + BOUTON MANUEL
       ---------------------------------------------------------------------- */
    const themeToggleBtn = document.getElementById('themeToggle');
    const darkMedia = window.matchMedia('(prefers-color-scheme: dark)');

    function applyTheme(theme) {
      const isDark = theme === 'dark';
      document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
      if (themeToggleBtn) {
        themeToggleBtn.textContent = isDark ? '☀' : '☾';
        themeToggleBtn.setAttribute('aria-pressed', String(isDark));
      }
    }

    const savedTheme = (() => {
      try { return localStorage.getItem('portfolio_theme'); } catch (_) { return null; }
    })();

    applyTheme(savedTheme || (darkMedia.matches ? 'dark' : 'light'));

    function syncSystemTheme() {
      const manual = (() => {
        try { return localStorage.getItem('portfolio_theme'); } catch (_) { return null; }
      })();
      if (!manual) applyTheme(darkMedia.matches ? 'dark' : 'light');
    }

    darkMedia.addEventListener('change', syncSystemTheme);
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) syncSystemTheme();
    });

    if (themeToggleBtn) {
      themeToggleBtn.addEventListener('click', () => {
        const next = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
        applyTheme(next);
        const sys = darkMedia.matches ? 'dark' : 'light';
        try {
          if (next === sys) localStorage.removeItem('portfolio_theme');
          else localStorage.setItem('portfolio_theme', next);
        } catch (_) {}
      });
    }

    /* ----------------------------------------------------------------------
       0. PRELOADER À REMPLISSAGE VERTICAL (SBWEBDESIGN.CH)
       ---------------------------------------------------------------------- */
    const preloader = document.getElementById('preloader');
    const preloaderFill = document.getElementById('preloaderWordFill');
    const preloaderPct = document.getElementById('preloaderPct');

    if (preloader && !reducedMotion) {
      const start = performance.now();
      const duration = CONFIG.preloaderDurationMs;

      function tickPreloader(now) {
        const t = Math.min((now - start) / duration, 1);
        const eased = 1 - Math.pow(1 - t, 3);
        const pct = Math.round(eased * 100);

        if (preloaderFill) {
          preloaderFill.style.clipPath = `inset(${100 - pct}% 0 0 0)`;
        }
        if (preloaderPct) {
          preloaderPct.textContent = `${String(pct).padStart(3, '0')}%`;
        }

        if (t < 1) {
          requestAnimationFrame(tickPreloader);
        } else {
          setTimeout(() => preloader.classList.add('done'), 140);
        }
      }
      requestAnimationFrame(tickPreloader);
    } else if (preloader) {
      preloader.classList.add('done');
    }

    /* ----------------------------------------------------------------------
       1. PHYSIQUE MAGNÉTIQUE SUR LES BOUTONS CLÉS
       ---------------------------------------------------------------------- */
    if (!reducedMotion && window.matchMedia('(pointer: fine)').matches) {
      document.querySelectorAll('.magnetic').forEach((btn) => {
        btn.addEventListener('pointermove', (e) => {
          const rect = btn.getBoundingClientRect();
          const dx = (e.clientX - (rect.left + rect.width / 2)) * 0.18;
          const dy = (e.clientY - (rect.top + rect.height / 2)) * 0.18;
          btn.style.transform = `translate3d(${dx.toFixed(1)}px, ${dy.toFixed(1)}px, 0)`;
        });
        btn.addEventListener('pointerleave', () => {
          btn.style.transform = '';
        });
      });
    }

    /* ----------------------------------------------------------------------
       2. NAVIGATION PAR STATIONS 100dvh, ALTIMÈTRE & MIRE
       ---------------------------------------------------------------------- */
    const stations = Array.from(document.querySelectorAll('.station'));
    const altStops = Array.from(document.querySelectorAll('.alt-stop'));
    const altValue = document.getElementById('altValue');
    const altProgress = document.getElementById('altProgress');
    const btnPrev = document.getElementById('btnPrev');
    const btnNext = document.getElementById('btnNext');
    const reticleLayer = document.getElementById('reticleLayer');
    const reticleStatus = document.getElementById('reticleStatus');

    let currentIndex = 0;
    let isTransitioning = false;
    let reticleTimer = null;
    const COOLDOWN_MS = CONFIG.stationCooldownMs;

    function triggerReticle(code, alt) {
      if (reticleLayer && reticleStatus) {
        reticleStatus.textContent = `LOCK // ${code} · ${alt}`;
        reticleLayer.classList.add('calibrating');
        clearTimeout(reticleTimer);
        reticleTimer = setTimeout(() => {
          reticleLayer.classList.remove('calibrating');
        }, 520);
      }
    }

    const stageEl = document.getElementById('stage');
    const isDesktopPointer = () => window.matchMedia('(pointer: fine)').matches && window.innerWidth > 640;

    let smoothTargetY = 0;
    let smoothRaf = null;

    function stopSmoothWheel() {
      if (smoothRaf) {
        cancelAnimationFrame(smoothRaf);
        smoothRaf = null;
      }
      if (stageEl) smoothTargetY = stageEl.scrollTop;
    }

    function runSmoothWheel() {
      if (!stageEl) return;
      const diff = smoothTargetY - stageEl.scrollTop;
      if (Math.abs(diff) < 0.6) {
        stageEl.scrollTop = smoothTargetY;
        smoothRaf = null;
        return;
      }
      stageEl.scrollTop += diff * CONFIG.desktopWheelLerp;
      smoothRaf = requestAnimationFrame(runSmoothWheel);
    }

    function updateAltimeterUi(idx, triggerLock = false) {
      const changed = idx !== currentIndex;
      currentIndex = idx;

      stations.forEach((st, i) => {
        st.classList.toggle('active', i === currentIndex);
      });

      altStops.forEach((stop, i) => {
        const active = i === currentIndex;
        stop.classList.toggle('active', active);
        if (active) stop.setAttribute('aria-current', 'true');
        else stop.removeAttribute('aria-current');
      });

      const activeStation = stations[currentIndex];
      const alt = activeStation.getAttribute('data-alt') || '+00.00m';
      const code = activeStation.getAttribute('data-code') || 'ST.00';

      const mobileStPill = document.getElementById('mobileStationCode');
      if (mobileStPill) mobileStPill.textContent = code;

      if (altValue) altValue.textContent = alt;
      if (altProgress) {
        const pct = (currentIndex / Math.max(1, stations.length - 1)) * 100;
        altProgress.style.height = `${pct}%`;
      }
      if (btnPrev) btnPrev.disabled = currentIndex === 0;
      if (btnNext) btnNext.disabled = currentIndex === stations.length - 1;

      if (triggerLock && changed) {
        triggerReticle(code, alt);
      }
    }

    function goToStation(nextIndex, immediate = false) {
      const clamped = Math.max(0, Math.min(stations.length - 1, nextIndex));
      stopSmoothWheel();
      updateAltimeterUi(clamped, !immediate);

      if (stageEl && stations[clamped]) {
        const destTop = stations[clamped].offsetTop;
        if (immediate) {
          stageEl.scrollTop = destTop;
          smoothTargetY = destTop;
        } else {
          stageEl.scrollTo({ top: destTop, behavior: 'smooth' });
          smoothTargetY = destTop;
        }
      }
    }

    // Transition continue façon Apple (échelle + opacité + micro-parallaxe au fil du scroll)
    function updateAppleTransitions() {
      if (!stageEl || reducedMotion) return;
      const vh = stageEl.clientHeight || window.innerHeight;
      const stageRect = stageEl.getBoundingClientRect();
      const isPhone = window.innerWidth <= 640;

      stations.forEach((st) => {
        // Ne pas transformer les pistes sticky (ST.02 carrousel 3D & ST.04 manifeste)
        if (st.id === 'station-2' || st.id === 'station-4') return;
        const inner = st.querySelector('.station-inner');
        if (!inner) return;

        const rect = st.getBoundingClientRect();
        const centerOffset = (rect.top - stageRect.top + rect.height / 2 - vh / 2) / vh;
        const dist = Math.min(1, Math.abs(centerOffset));

        // Transition très légère et lumineuse (opacité 0.84 -> 1.0, scale 0.975 -> 1.0)
        const ease = 1 - Math.pow(dist, 1.5);
        const opacity = 0.84 + ease * 0.16;
        const scale = 0.975 + ease * 0.025;
        const shiftY = centerOffset * 14;

        inner.style.opacity = opacity.toFixed(3);
        inner.style.transform = `translate3d(0, ${shiftY.toFixed(1)}px, 0) scale(${scale.toFixed(4)})`;
      });
    }

    if (stageEl) {
      const mobileProgFill = document.getElementById('mobileProgressFill');
      let appleRaf = null;
      const scheduleApple = () => {
        if (!appleRaf) {
          appleRaf = requestAnimationFrame(() => {
            updateAppleTransitions();
            if (mobileProgFill) {
              const maxScroll = Math.max(1, stageEl.scrollHeight - stageEl.clientHeight);
              const pct = Math.min(100, Math.max(0, (stageEl.scrollTop / maxScroll) * 100));
              mobileProgFill.style.width = `${pct.toFixed(2)}%`;
            }
            appleRaf = null;
          });
        }
      };
      stageEl.addEventListener('scroll', scheduleApple, { passive: true });
      window.addEventListener('resize', scheduleApple);
      updateAppleTransitions();
    }

    // Synchronisation continue de la station active pendant le défilé (PC & téléphone)
    if (stageEl && typeof IntersectionObserver !== 'undefined') {
      const obs = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              const idx = parseInt(entry.target.getAttribute('data-index'), 10);
              if (!Number.isNaN(idx)) updateAltimeterUi(idx, true);
            }
          });
        },
        { root: stageEl, threshold: 0.35 }
      );
      stations.forEach((st) => obs.observe(st));
    }

    document.querySelectorAll('[data-goto]').forEach((el) => {
      el.addEventListener('click', () => {
        const idx = parseInt(el.getAttribute('data-goto'), 10);
        if (!Number.isNaN(idx)) goToStation(idx);
      });
    });

    if (btnPrev) btnPrev.addEventListener('click', () => goToStation(currentIndex - 1));
    if (btnNext) btnNext.addEventListener('click', () => goToStation(currentIndex + 1));

    // Appui sur la molette (clic milieu) => remonte directement tout en haut (ST.00)
    window.addEventListener('mousedown', (e) => {
      if (e.button === 1) {
        e.preventDefault();
        goToStation(0);
      }
    });

    // Interaction 4 cercles Ikigai <-> cartes (ST.05)
    function setIkigaiPole(pole) {
      document.querySelectorAll('.venn-circle, .ikigai-venn-cards .iki-mini-cell').forEach((el) => {
        el.classList.toggle('active', el.getAttribute('data-pole') === pole);
      });
    }

    document.querySelectorAll('.venn-circle, .ikigai-venn-cards .iki-mini-cell').forEach((el) => {
      const pole = el.getAttribute('data-pole');
      if (!pole) return;
      el.addEventListener('click', () => setIkigaiPole(pole));
      el.addEventListener('pointerenter', () => setIkigaiPole(pole));
    });

    const cvModal = document.getElementById('cvModal');

    // Défilement vertical continu ralenti et doux sur PC (façon Lenis)
    window.addEventListener(
      'wheel',
      (e) => {
        if (!stageEl || (cvModal && cvModal.classList.contains('open'))) return;
        if (!isDesktopPointer() || reducedMotion) return;

        e.preventDefault();
        if (!smoothRaf) smoothTargetY = stageEl.scrollTop;
        const maxScroll = Math.max(0, stageEl.scrollHeight - stageEl.clientHeight);
        smoothTargetY = Math.max(0, Math.min(maxScroll, smoothTargetY + e.deltaY * CONFIG.desktopWheelFactor));
        if (!smoothRaf) smoothRaf = requestAnimationFrame(runSmoothWheel);
      },
      { passive: false }
    );

    window.addEventListener('keydown', (e) => {
      if (cvModal && cvModal.classList.contains('open')) {
        if (e.key === 'Escape') closeCvModal();
        return;
      }
      if (['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) return;

      if (e.key === 'ArrowDown' || e.key === 'PageDown') {
        e.preventDefault();
        goToStation(currentIndex + 1);
      } else if (e.key === 'ArrowUp' || e.key === 'PageUp') {
        e.preventDefault();
        goToStation(currentIndex - 1);
      } else if (e.key === 'Home') {
        e.preventDefault();
        goToStation(0);
      } else if (e.key === 'End') {
        e.preventDefault();
        goToStation(stations.length - 1);
      }
    });

    /* ----------------------------------------------------------------------
       4. ROGNAGE INTELLIGENT DES PHOTOS
       ---------------------------------------------------------------------- */
    document.querySelectorAll('.smart-photo').forEach((frame) => {
      const img = frame.querySelector('img');
      if (!img) return;

      const focal = frame.getAttribute('data-focal');
      if (focal) img.style.objectPosition = focal;

      const fixedRatio = frame.getAttribute('data-fixed-ratio');
      const card = frame.closest('.photo-card');
      const ratioLabel = card ? card.querySelector('[data-ratio-label]') : null;

      function handleLoaded() {
        if (!img.naturalWidth || !img.naturalHeight) return;
        frame.classList.add('is-loaded');

        if (!fixedRatio) {
          const r = img.naturalWidth / img.naturalHeight;
          frame.classList.remove('is-landscape', 'is-portrait', 'is-square');
          if (r > 1.12) {
            frame.classList.add('is-landscape');
            if (ratioLabel) ratioLabel.textContent = `16:10 · ${img.naturalWidth}×${img.naturalHeight}`;
          } else if (r < 0.88) {
            frame.classList.add('is-portrait');
            if (ratioLabel) ratioLabel.textContent = `3:4 · ${img.naturalWidth}×${img.naturalHeight}`;
          } else {
            frame.classList.add('is-square');
            if (ratioLabel) ratioLabel.textContent = `1:1 · ${img.naturalWidth}×${img.naturalHeight}`;
          }
        }
      }

      img.addEventListener('load', handleLoaded);
      if (img.complete && img.naturalWidth > 0) handleLoaded();
    });

    /* Sélecteur multi-photos (ST.02 Voyages & ST.03 Breaking) */
    document.querySelectorAll('.photo-sw-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const targetId = btn.getAttribute('data-swap-target');
        const nextSrc = btn.getAttribute('data-swap-src');
        const img = targetId ? document.getElementById(targetId) : null;
        if (!img || !nextSrc) return;

        const group = btn.closest('.photo-switcher');
        if (group) {
          group.querySelectorAll('.photo-sw-btn').forEach((b) => b.classList.toggle('active', b === btn));
        }

        img.style.opacity = '0.25';
        img.src = nextSrc;
        img.onload = () => {
          img.style.opacity = '';
        };
      });
    });

    /* ----------------------------------------------------------------------
       5. MODALE CV & COPIE E-MAIL
       ---------------------------------------------------------------------- */
    function openCvModal() {
      if (!cvModal) return;
      cvModal.classList.add('open');
      cvModal.setAttribute('aria-hidden', 'false');
    }

    function closeCvModal() {
      if (!cvModal) return;
      cvModal.classList.remove('open');
      cvModal.setAttribute('aria-hidden', 'true');
    }

    ['openCvHeader', 'openCvFooter'].forEach((id) => {
      const btn = document.getElementById(id);
      if (btn) btn.addEventListener('click', openCvModal);
    });

    const closeCvBtn = document.getElementById('closeCvBtn');
    const printCvBtn = document.getElementById('printCvBtn');
    if (closeCvBtn) closeCvBtn.addEventListener('click', closeCvModal);
    if (printCvBtn) {
      printCvBtn.addEventListener('click', () => {
        window.open('VALROFF_Victor_CV.pdf', '_blank', 'noopener,noreferrer');
      });
    }

    if (cvModal) {
      cvModal.addEventListener('click', (e) => {
        if (e.target === cvModal) closeCvModal();
      });
    }

    const copyEmailBtn = document.getElementById('copyEmailBtn');
    const copyEmailTag = document.getElementById('copyEmailTag');

    if (copyEmailBtn && copyEmailTag) {
      copyEmailBtn.addEventListener('click', async () => {
        const email = copyEmailBtn.getAttribute('data-email') || 'victorvalroff@hotmail.com';
        try {
          await navigator.clipboard.writeText(email);
        } catch (_) {
          const tmp = document.createElement('input');
          tmp.value = email;
          document.body.appendChild(tmp);
          tmp.select();
          document.execCommand('copy');
          document.body.removeChild(tmp);
        }

        const copiedText = window.PortfolioI18n ? window.PortfolioI18n.t('st4.copied') : 'COPIÉ ✓';
        const copyText = window.PortfolioI18n ? window.PortfolioI18n.t('st4.copy') : 'COPIER';
        copyEmailTag.textContent = copiedText;
        setTimeout(() => {
          copyEmailTag.textContent = copyText;
        }, 1800);
      });
    }

    /* ----------------------------------------------------------------------
       6. INTERACTIVITÉ TACTILE & FOCUS AU SCROLL SUR TÉLÉPHONE (100 % PASSIVE)
       ---------------------------------------------------------------------- */
    const isTouchUi = window.matchMedia('(pointer: coarse)').matches || window.innerWidth <= 640;
    if (isTouchUi && !reducedMotion) {
      const mobileBlocks = Array.from(document.querySelectorAll('.cote-block, .hover-card, .dim-frame'));

      if (stageEl && typeof IntersectionObserver !== 'undefined') {
        const blockObs = new IntersectionObserver(
          (entries) => {
            entries.forEach((entry) => {
              entry.target.classList.toggle('is-inview', entry.isIntersecting);
            });
          },
          { root: stageEl, rootMargin: '-18% 0px -18% 0px', threshold: 0.25 }
        );
        mobileBlocks.forEach((el) => blockObs.observe(el));
      }

      mobileBlocks.forEach((el) => {
        let touchTimer = null;
        el.addEventListener(
          'touchstart',
          () => {
            el.classList.add('is-touched');
            clearTimeout(touchTimer);
            touchTimer = setTimeout(() => el.classList.remove('is-touched'), 420);
          },
          { passive: true }
        );
      });
    }

    goToStation(0, true);
  });
})();
