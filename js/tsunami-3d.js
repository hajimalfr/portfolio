/* ==========================================================================
   js/tsunami-3d.js — Vague Tsunami en 3D interactive
   Détourage automatique du fond (noir ou blanc) via <canvas> pour faire
   flotter la vague #262CE8 en relief 3D multi-couches + rotation libre 360°
   ========================================================================== */
(function () {
  document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('tsunamiCanvas');
    const wrap = document.getElementById('tsunamiWrap');
    const resetBtn = document.getElementById('resetTsunamiBtn');
    if (!canvas || !wrap) return;

    const ctx = canvas.getContext('2d');
    const DPR = Math.min(window.devicePixelRatio || 1, 2);

    let cw = 300;
    let ch = 260;

    // Angles 3D (radians) : rotation libre à 360° sur Y, inclinaison fluide sur X
    let rotY = -0.28;
    let rotX = 0.14;
    let targetRotY = -0.28;
    let targetRotX = 0.14;
    let velY = 0;

    let isDragging = false;
    let isHovering = false;
    let lastX = 0;
    let lastY = 0;
    let time = 0;

    // Sprites détourés : face avant (#262CE8) + couche d'extrusion profonde (#141996)
    let frontSprite = null;
    let depthSprite = null;
    let spriteRatio = 1.6;

    function buildKeyedSprites(img) {
      const w = Math.min(img.naturalWidth || 512, 560);
      const h = Math.round((img.naturalHeight || 320) * (w / (img.naturalWidth || 512)));
      spriteRatio = w / h;

      const offFront = document.createElement('canvas');
      offFront.width = w;
      offFront.height = h;
      const fCtx = offFront.getContext('2d');
      fCtx.drawImage(img, 0, 0, w, h);

      const offDepth = document.createElement('canvas');
      offDepth.width = w;
      offDepth.height = h;
      const dCtx = offDepth.getContext('2d');

      try {
        const imgData = fCtx.getImageData(0, 0, w, h);
        const data = imgData.data;
        const depthData = dCtx.createImageData(w, h);
        const dd = depthData.data;

        for (let i = 0; i < data.length; i += 4) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          const a = data[i + 3];

          // Détection automatique fond noir OU fond blanc : on conserve les pixels bleus dominants
          const blueDominance = b - Math.max(r, g);
          const isBlackBg = r < 42 && g < 42 && b < 55;
          const isWhiteBg = r > 205 && g > 205 && b > 205 && blueDominance < 30;

          if (a < 20 || isBlackBg || isWhiteBg || blueDominance < 18) {
            data[i + 3] = 0;
            dd[i + 3] = 0;
          } else {
            // Normalisation nette en Bleu Tsunami #262CE8 (38, 44, 232)
            const alpha = Math.min(255, Math.round(Math.min(1, blueDominance / 70) * a));
            data[i] = 38;
            data[i + 1] = 44;
            data[i + 2] = 232;
            data[i + 3] = alpha;

            // Couche d'épaisseur 3D plus sombre (#12178A)
            dd[i] = 18;
            dd[i + 1] = 23;
            dd[i + 2] = 138;
            dd[i + 3] = alpha;
          }
        }

        fCtx.putImageData(imgData, 0, 0);
        dCtx.putImageData(depthData, 0, 0);
        frontSprite = offFront;
        depthSprite = offDepth;
      } catch (_) {
        // Fallback sécurisé si ouverture en file:// (CORS canvas taint)
        frontSprite = img;
        depthSprite = img;
      }
    }

    function loadLogo() {
      const candidates = ['images/tsunami-logo.webp', 'images/tsunami-logo.jpg', 'images/tsunami-logo.png'];
      let idx = 0;

      function tryNext() {
        if (idx >= candidates.length) return;
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => buildKeyedSprites(img);
        img.onerror = () => {
          idx += 1;
          tryNext();
        };
        img.src = candidates[idx];
      }

      tryNext();
    }

    function resize() {
      const rect = wrap.getBoundingClientRect();
      cw = Math.max(200, Math.round(rect.width));
      ch = Math.max(200, Math.round(rect.height));
      canvas.width = Math.round(cw * DPR);
      canvas.height = Math.round(ch * DPR);
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    }

    function render() {
      time += 0.016;

      if (!isDragging) {
        if (!isHovering) {
          targetRotY += 0.0045 + velY;
          velY *= 0.94;
        }
      }

      rotY += (targetRotY - rotY) * 0.14;
      rotX += (targetRotX - rotX) * 0.14;

      ctx.clearRect(0, 0, cw, ch);

      const cx = cw / 2;
      const cy = ch / 2 + Math.sin(time * 1.8) * 4;

      // Ombre portée douce sur le béton
      ctx.save();
      ctx.beginPath();
      ctx.ellipse(cx, ch * 0.84, cw * 0.28, 10, 0, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(18, 18, 18, 0.12)';
      ctx.fill();
      ctx.restore();

      if (frontSprite) {
        const baseW = Math.min(cw * 0.82, ch * 0.72 * spriteRatio);
        const baseH = baseW / spriteRatio;

        const cosY = Math.cos(rotY);
        const sinY = Math.sin(rotY);
        const sinX = Math.sin(rotX);

        // Extrusion 3D en 18 couches empilées
        const layers = 18;
        const thickness = 18;
        const scaleX = Math.abs(cosY) < 0.04 ? (cosY >= 0 ? 0.04 : -0.04) : cosY;
        const skewY = sinY * sinX * 0.28;

        for (let i = 0; i < layers; i++) {
          const t = i / (layers - 1) - 0.5; // -0.5 (arrière) à +0.5 (avant)
          const z = t * thickness;
          const offsetX = sinY * z * 1.45;
          const offsetY = -sinX * z * 0.9;

          const isFrontFace = (cosY >= 0 && i === layers - 1) || (cosY < 0 && i === 0);

          ctx.save();
          ctx.translate(cx + offsetX, cy + offsetY);
          ctx.transform(scaleX, skewY, 0, Math.cos(rotX * 0.5), 0, 0);

          if (isFrontFace) {
            ctx.globalAlpha = 1;
            ctx.drawImage(frontSprite, -baseW / 2, -baseH / 2, baseW, baseH);
          } else {
            ctx.globalAlpha = 0.55 + (i / layers) * 0.35;
            ctx.drawImage(depthSprite || frontSprite, -baseW / 2, -baseH / 2, baseW, baseH);
          }
          ctx.restore();
        }
      }

      requestAnimationFrame(render);
    }

    // Interactions : survol (inclinaison) + glisser (rotation libre 360°)
    wrap.addEventListener('pointerenter', () => {
      isHovering = true;
    });

    wrap.addEventListener('pointerleave', () => {
      isHovering = false;
      if (!isDragging) {
        targetRotX = 0.14;
      }
    });

    wrap.addEventListener('pointerdown', (e) => {
      isDragging = true;
      lastX = e.clientX;
      lastY = e.clientY;
      velY = 0;
      wrap.setPointerCapture(e.pointerId);
    });

    wrap.addEventListener('pointermove', (e) => {
      if (isDragging) {
        const dx = e.clientX - lastX;
        const dy = e.clientY - lastY;
        lastX = e.clientX;
        lastY = e.clientY;
        targetRotY += dx * 0.014;
        targetRotX = Math.max(-0.85, Math.min(0.85, targetRotX + dy * 0.01));
        velY = dx * 0.0012;
      } else if (isHovering) {
        const rect = wrap.getBoundingClientRect();
        const nx = (e.clientX - rect.left) / rect.width - 0.5;
        const ny = (e.clientY - rect.top) / rect.height - 0.5;
        targetRotX = ny * 0.45;
        targetRotY += nx * 0.015;
      }
    });

    function stopDrag(e) {
      if (!isDragging) return;
      isDragging = false;
      try {
        wrap.releasePointerCapture(e.pointerId);
      } catch (_) {}
    }

    wrap.addEventListener('pointerup', stopDrag);
    wrap.addEventListener('pointercancel', stopDrag);

    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        targetRotY = -0.28;
        targetRotX = 0.14;
        velY = 0;
      });
    }

    window.addEventListener('resize', resize);
    resize();
    loadLogo();
    requestAnimationFrame(render);
  });
})();
