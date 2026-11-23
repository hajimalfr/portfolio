/* ==========================================================================
   js/main.js — Navigation par stations 100dvh, Altimètre, Mire,
   Rognage intelligent des photos, Modale CV & Copie e-mail
   ========================================================================== */
(function () {
  document.addEventListener('DOMContentLoaded', () => {
    const stations = Array.from(document.querySelectorAll('.station'));
    const altStops = Array.from(document.querySelectorAll('.alt-stop'));
    const altValue = document.getElementById('altValue');
    const altProgress = document.getElementById('altProgress');
    const btnPrev = document.getElementById('btnPrev');
    const btnNext = document.getElementById('btnNext');
    const reticleLayer = document.getElementById('reticleLayer');
    const reticleStatus = document.getElementById('reticleStatus');
    const marqueeBar = document.getElementById('marqueeBar');

    let currentIndex = 0;
    let isTransitioning = false;
    let reticleTimer = null;
    let marqueeTimer = null;

    const COOLDOWN_MS = 620;

    function triggerReticleAndMarquee(code, alt) {
      if (reticleLayer && reticleStatus) {
        reticleStatus.textContent = `LOCK // ${code} · ${alt}`;
        reticleLayer.classList.add('calibrating');
        clearTimeout(reticleTimer);
        reticleTimer = setTimeout(() => {
          reticleLayer.classList.remove('calibrating');
        }, 520);
      }

      if (marqueeBar) {
        marqueeBar.classList.add('station-pulse');
        clearTimeout(marqueeTimer);
        marqueeTimer = setTimeout(() => {
          marqueeBar.classList.remove('station-pulse');
        }, 420);
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
        if (active) {
          stop.setAttribute('aria-current', 'true');
        } else {
          stop.removeAttribute('aria-current');
        }
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
        triggerReticleAndMarquee(code, alt);
      }

      setTimeout(() => {
        isTransitioning = false;
      }, immediate ? 0 : COOLDOWN_MS);
    }

    /* 1. Clics de navigation (Altimètre, Précédent/Suivant, boutons CTA) */
    document.querySelectorAll('[data-goto]').forEach((el) => {
      el.addEventListener('click', () => {
        const idx = parseInt(el.getAttribute('data-goto'), 10);
        if (!Number.isNaN(idx)) goToStation(idx);
      });
    });

    if (btnPrev) btnPrev.addEventListener('click', () => goToStation(currentIndex - 1));
    if (btnNext) btnNext.addEventListener('click', () => goToStation(currentIndex + 1));

    /* 2. Molette avec anti-rebond (ignore la fenêtre CAO et la modale CV) */
    const cvModal = document.getElementById('cvModal');

    window.addEventListener(
      'wheel',
      (e) => {
        if (cvModal && cvModal.classList.contains('open')) return;
        if (e.target.closest('#cadViewport')) return;
        if (Math.abs(e.deltaY) < 16) return;

        // Sur mobile/tablette si la station scrolle intérieurement, laisser scroller avant de changer
        const activeSt = stations[currentIndex];
        if (activeSt && activeSt.scrollHeight > activeSt.clientHeight + 4) {
          const atTop = activeSt.scrollTop <= 2;
          const atBottom = activeSt.scrollTop + activeSt.clientHeight >= activeSt.scrollHeight - 2;
          if ((e.deltaY > 0 && !atBottom) || (e.deltaY < 0 && !atTop)) return;
        }

        if (e.deltaY > 0) {
          goToStation(currentIndex + 1);
        } else {
          goToStation(currentIndex - 1);
        }
      },
      { passive: true }
    );

    /* 3. Navigation clavier (Flèches, PageUp/Down, Home/End, 1–5) */
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

    /* 4. Swipe tactile mobile */
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

    /* 5. Rognage intelligent des photos (orientation auto + point focal) */
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
      if (img.complete && img.naturalWidth > 0) {
        handleLoaded();
      }
    });

    /* 6. Modale CV complet & Impression A4 */
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

    /* 7. Copie e-mail en un clic */
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

    // Initialisation station 00
    goToStation(0, true);
  });
})();
