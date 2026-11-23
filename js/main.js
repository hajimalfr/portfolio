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
    stationCooldownMs: 320,   // Anti-rebond entre deux changements de station (ms)
    wheelThresholdPx: 16,     // Sensibilité minimale de la molette
    swipeThresholdPx: 54,     // Distance minimale de swipe vertical sur mobile (px)
    emailFallback: 'victorvalroff@hotmail.com'
  };

  document.addEventListener('DOMContentLoaded', () => {
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

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
       1. PHYSIQUE À RESSORT LETTRE PAR LETTRE (INSPIRÉE SBWEBDESIGN.CH)
          Rebond élastique + liseré orange #FF4D1C net + taches légères au survol
       ---------------------------------------------------------------------- */
    const heroSelectionBox = document.getElementById('heroSelectionBox');
    const heroTitle = document.getElementById('heroTitle');
    const heroSpecBadge = document.getElementById('heroSpecBadge');
    const stainField = document.getElementById('orangeStainField');
    const stainBlobs = stainField ? Array.from(stainField.querySelectorAll('.stain-blob')) : [];
    const letterStates = [];

    if (heroTitle) {
      heroTitle.querySelectorAll('.hero-word').forEach((wordEl) => {
        const text = wordEl.textContent || '';
        wordEl.textContent = '';
        Array.from(text).forEach((ch) => {
          const span = document.createElement('span');
          span.className = 'hero-letter';
          span.textContent = ch;
          wordEl.appendChild(span);
          letterStates.push({
            el: span,
            y: 0,
            vy: 0,
            rot: 0,
            vrot: 0,
            scale: 1,
            vscale: 0,
            glow: 0,
            vglow: 0
          });
        });
      });

      function updateSpecBadge() {
        if (!heroSpecBadge || !heroSelectionBox) return;
        const fs = Math.round(parseFloat(getComputedStyle(heroTitle).fontSize) || 84);
        const rect = heroSelectionBox.getBoundingClientRect();
        heroSpecBadge.textContent = `Bricolage · ${fs} px · ${Math.round(rect.width)} × ${Math.round(rect.height)}`;
      }

      updateSpecBadge();
      window.addEventListener('resize', updateSpecBadge);
      if (document.fonts && document.fonts.ready) {
        document.fonts.ready.then(updateSpecBadge);
      }

      if (heroSelectionBox && !reducedMotion) {
        let lastMx = null;
        let lastMy = null;
        let springRaf = null;

        function stepSprings() {
          let moving = false;
          const k = 0.14; // raideur ressort
          const d = 0.76; // amortissement élastique

          for (const st of letterStates) {
            st.vy = (st.vy + -st.y * k) * d;
            st.y += st.vy;

            st.vrot = (st.vrot + -st.rot * k) * d;
            st.rot += st.vrot;

            st.vscale = (st.vscale + (1 - st.scale) * k) * d;
            st.scale += st.vscale;

            st.vglow = (st.vglow + -st.glow * 0.12) * 0.72;
            st.glow = Math.max(0, st.glow + st.vglow);

            if (
              Math.abs(st.y) > 0.08 ||
              Math.abs(st.vy) > 0.08 ||
              Math.abs(st.rot) > 0.08 ||
              Math.abs(st.vrot) > 0.08 ||
              Math.abs(st.scale - 1) > 0.002 ||
              st.glow > 0.02
            ) {
              moving = true;
              st.el.style.transform = `translate3d(0, ${st.y.toFixed(1)}px, 0) rotate(${st.rot.toFixed(1)}deg) scale(${st.scale.toFixed(3)})`;
              if (st.glow > 0.04) {
                const a = Math.min(1, st.glow * 1.15).toFixed(2);
                const ox = (-st.glow * 3.8).toFixed(1);
                const oy = (-st.glow * 3.0).toFixed(1);
                // Liseré orange #FF4D1C franc et marqué façon sbwebdesign.ch
                st.el.style.textShadow = `${ox}px ${oy}px 0 rgba(255, 77, 28, ${a}), ${(st.glow * 2.2).toFixed(1)}px ${(st.glow * 1.8).toFixed(1)}px 0 rgba(255, 77, 28, ${(st.glow * 0.65).toFixed(2)}), 0 0 10px rgba(255, 77, 28, ${(st.glow * 0.55).toFixed(2)})`;
              } else {
                st.el.style.textShadow = '';
              }
            } else {
              st.y = 0; st.vy = 0; st.rot = 0; st.vrot = 0; st.scale = 1; st.vscale = 0; st.glow = 0; st.vglow = 0;
              st.el.style.transform = '';
              st.el.style.textShadow = '';
            }
          }

          if (moving) {
            springRaf = requestAnimationFrame(stepSprings);
          } else {
            springRaf = null;
          }
        }

        function kickSprings() {
          if (!springRaf) springRaf = requestAnimationFrame(stepSprings);
        }

        heroSelectionBox.addEventListener('pointermove', (e) => {
          const mx = e.clientX;
          const my = e.clientY;
          const vx = lastMx === null ? 0 : Math.max(-36, Math.min(36, mx - lastMx));
          const vy = lastMy === null ? 0 : Math.max(-36, Math.min(36, my - lastMy));
          lastMx = mx;
          lastMy = my;

          if (stainField && stainBlobs.length) {
            const boxRect = stainField.getBoundingClientRect();
            const lx = mx - boxRect.left;
            const ly = my - boxRect.top;
            stainField.classList.add('active');
            if (stainBlobs[0]) stainBlobs[0].style.transform = `translate3d(${(lx - 75).toFixed(0)}px, ${(ly - 60).toFixed(0)}px, 0)`;
            if (stainBlobs[1]) stainBlobs[1].style.transform = `translate3d(${(lx - 45).toFixed(0)}px, ${(ly - 80).toFixed(0)}px, 0)`;
            if (stainBlobs[2]) stainBlobs[2].style.transform = `translate3d(${(lx - 90).toFixed(0)}px, ${(ly - 30).toFixed(0)}px, 0)`;
          }

          for (const st of letterStates) {
            const rect = st.el.getBoundingClientRect();
            const cx = rect.left + rect.width / 2;
            const cy = rect.top + rect.height / 2;
            const dist = Math.hypot(mx - cx, my - cy);

            if (dist < 110) {
              const force = 1 - dist / 110;
              st.vy += (-3.4 * force) + vy * 0.14 * force;
              st.vrot += (vx * 0.24 * force) + ((mx - cx) / 38) * 0.9 * force;
              st.vscale += 0.032 * force;
              st.glow = Math.min(1.15, st.glow + 0.34 * force);
            }
          }

          kickSprings();
        });

        heroSelectionBox.addEventListener('pointerleave', () => {
          lastMx = null;
          lastMy = null;
          if (stainField) stainField.classList.remove('active');
        });
      }
    }

    /* ----------------------------------------------------------------------
       2. PHYSIQUE MAGNÉTIQUE SUR LES BOUTONS CLÉS
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
       3. NAVIGATION PAR STATIONS 100dvh, ALTIMÈTRE & MIRE
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

    function goToStation(nextIndex, immediate = false) {
      const clamped = Math.max(0, Math.min(stations.length - 1, nextIndex));
      if (!immediate && (clamped === currentIndex || isTransitioning)) return;

      isTransitioning = true;
      currentIndex = clamped;

      stations.forEach((st, idx) => {
        st.classList.toggle('active', idx === currentIndex);
        st.classList.toggle('above', idx < currentIndex);
      });

      altStops.forEach((stop, idx) => {
        const active = idx === currentIndex;
        stop.classList.toggle('active', active);
        if (active) stop.setAttribute('aria-current', 'true');
        else stop.removeAttribute('aria-current');
      });

      const activeStation = stations[currentIndex];
      const alt = activeStation.getAttribute('data-alt') || '+00.00m';
      const code = activeStation.getAttribute('data-code') || 'ST.00';

      if (altValue) altValue.textContent = alt;
      if (altProgress) {
        const pct = (currentIndex / Math.max(1, stations.length - 1)) * 100;
        altProgress.style.height = `${pct}%`;
      }
      if (btnPrev) btnPrev.disabled = currentIndex === 0;
      if (btnNext) btnNext.disabled = currentIndex === stations.length - 1;

      if (!immediate) {
        triggerReticle(code, alt);
      }

      setTimeout(() => {
        isTransitioning = false;
      }, immediate ? 0 : COOLDOWN_MS);
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

    window.addEventListener(
      'wheel',
      (e) => {
        if (cvModal && cvModal.classList.contains('open')) return;
        if (e.defaultPrevented) return;
        if (Math.abs(e.deltaY) < 16) return;

        const activeSt = stations[currentIndex];
        if (activeSt) {
          const oy = getComputedStyle(activeSt).overflowY;
          const isScrollable = (oy === 'auto' || oy === 'scroll') && activeSt.scrollHeight > activeSt.clientHeight + 6;
          if (isScrollable) {
            const atTop = activeSt.scrollTop <= 2;
            const atBottom = activeSt.scrollTop + activeSt.clientHeight >= activeSt.scrollHeight - 2;
            if ((e.deltaY > 0 && !atBottom) || (e.deltaY < 0 && !atTop)) return;
          }
        }

        if (e.deltaY > 0) goToStation(currentIndex + 1);
        else goToStation(currentIndex - 1);
      },
      { passive: true }
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

    let touchStartY = 0;
    let touchStartX = 0;

    window.addEventListener(
      'touchstart',
      (e) => {
        if (e.touches.length !== 1) return;
        if (e.target.closest('#cadViewport') || e.target.closest('#tsunamiWrap')) return;
        touchStartY = e.touches[0].clientY;
        touchStartX = e.touches[0].clientX;
      },
      { passive: true }
    );

    window.addEventListener(
      'touchend',
      (e) => {
        if (!touchStartY || (cvModal && cvModal.classList.contains('open'))) return;
        if (e.target.closest('#cadViewport') || e.target.closest('#tsunamiWrap')) return;
        const dy = touchStartY - e.changedTouches[0].clientY;
        const dx = Math.abs(touchStartX - e.changedTouches[0].clientX);
        touchStartY = 0;

        if (Math.abs(dy) > 54 && Math.abs(dy) > dx * 1.2) {
          if (dy > 0) goToStation(currentIndex + 1);
          else goToStation(currentIndex - 1);
        }
      },
      { passive: true }
    );

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
    if (printCvBtn) printCvBtn.addEventListener('click', () => window.print());

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

    goToStation(0, true);
  });
})();
