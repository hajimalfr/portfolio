/* ==========================================================================
   js/main.js — Preloader vertical, Animation lettre-par-lettre sbwebdesign.ch,
   Navigation par stations 100dvh, Boutons magnétiques, Rognage photo & CV
   ========================================================================== */
(function () {
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
      const duration = 860;

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
       1. ANIMATION LETTRE PAR LETTRE + BADGE DE DIMENSIONS (SBWEBDESIGN.CH)
       ---------------------------------------------------------------------- */
    const heroSelectionBox = document.getElementById('heroSelectionBox');
    const heroTitle = document.getElementById('heroTitle');
    const heroSpecBadge = document.getElementById('heroSpecBadge');
    const heroLetters = [];

    if (heroTitle) {
      heroTitle.querySelectorAll('.hero-word').forEach((wordEl) => {
        const text = wordEl.textContent || '';
        wordEl.textContent = '';
        Array.from(text).forEach((ch) => {
          const span = document.createElement('span');
          span.className = 'hero-letter';
          span.textContent = ch;
          wordEl.appendChild(span);
          heroLetters.push(span);
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
        heroSelectionBox.addEventListener('pointermove', (e) => {
          const mx = e.clientX;
          const my = e.clientY;

          heroLetters.forEach((letter) => {
            const rect = letter.getBoundingClientRect();
            const cx = rect.left + rect.width / 2;
            const cy = rect.top + rect.height / 2;
            const dx = mx - cx;
            const dy = my - cy;
            const dist = Math.hypot(dx, dy);

            // Onde de proximité gaussienne ample et expressive lettre par lettre
            const influence = Math.exp(-(dist * dist) / (2 * 155 * 155));

            if (influence > 0.03) {
              const lift = -influence * 26;
              const tilt = Math.max(-13, Math.min(13, (dx / 42) * influence * 12));
              const scaleY = 1 + influence * 0.22;
              const scaleX = 1 + influence * 0.1;
              const wght = Math.round(700 + influence * 100);
              const shadowAlpha = (influence * 0.96).toFixed(2);
              const shadowX = (-influence * 5.2).toFixed(1);
              const shadowY = (-influence * 3.6).toFixed(1);

              letter.classList.add('is-active');
              letter.style.transform = `translate3d(0, ${lift.toFixed(1)}px, 0) rotate(${tilt.toFixed(1)}deg) scale(${scaleX.toFixed(3)}, ${scaleY.toFixed(3)})`;
              letter.style.fontVariationSettings = `'wght' ${wght}, 'opsz' 96`;
              letter.style.textShadow = `${shadowX}px ${shadowY}px 0 rgba(255, 77, 28, ${shadowAlpha})`;
            } else {
              letter.classList.remove('is-active');
              letter.style.transform = '';
              letter.style.fontVariationSettings = '';
              letter.style.textShadow = '';
            }
          });
        });

        heroSelectionBox.addEventListener('pointerleave', () => {
          heroLetters.forEach((letter) => {
            letter.classList.remove('is-active');
            letter.style.transform = '';
            letter.style.fontVariationSettings = '';
            letter.style.textShadow = '';
          });
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
    const COOLDOWN_MS = 620;

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

    const cvModal = document.getElementById('cvModal');

    window.addEventListener(
      'wheel',
      (e) => {
        if (cvModal && cvModal.classList.contains('open')) return;
        if (e.defaultPrevented) return;
        if (Math.abs(e.deltaY) < 16) return;

        const activeSt = stations[currentIndex];
        if (activeSt && activeSt.scrollHeight > activeSt.clientHeight + 4) {
          const atTop = activeSt.scrollTop <= 2;
          const atBottom = activeSt.scrollTop + activeSt.clientHeight >= activeSt.scrollHeight - 2;
          if ((e.deltaY > 0 && !atBottom) || (e.deltaY < 0 && !atTop)) return;
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
