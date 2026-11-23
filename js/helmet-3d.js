/* ==========================================================================
   js/helmet-3d.js — Modélisation 3D interactive d'un casque de protection
   de chantier (filaire CAO + cotes Fusion 360, rotation libre 360°)
   ========================================================================== */
(function () {
  document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('helmetCanvas');
    const wrap = document.getElementById('helmetWrap');
    const resetBtn = document.getElementById('resetHelmetBtn');
    if (!canvas || !wrap) return;

    const ctx = canvas.getContext('2d');
    const DPR = Math.min(window.devicePixelRatio || 1, 2);

    let cw = 520;
    let ch = 360;
    let rotY = -0.55;
    let rotX = 0.28;
    let targetRotY = -0.55;
    let targetRotX = 0.28;
    let isDragging = false;
    let lastX = 0;
    let lastY = 0;

    // Génération paramétrique du casque de chantier (coque, crête centrale, visière, harnais)
    function shellPoint(u, v) {
      // u: 0 (sommet) -> 1 (bord inférieur), v: 0 -> 2*PI (autour du casque)
      const phi = u * (Math.PI * 0.54);
      const sinP = Math.sin(phi);
      const cosP = Math.cos(phi);

      // Forme légèrement ovale (plus longue avant/arrière sur Z)
      let rx = 1.0 * sinP;
      let rz = 1.18 * sinP;
      let y = -0.92 * cosP + 0.22;

      // Crête structurelle supérieure caractéristique d'un casque de chantier (le long de Z, autour de x=0)
      const ridgeFactor = Math.exp(-Math.pow(Math.cos(v) * 4.5, 2)) * Math.sin(u * Math.PI * 0.92);
      y -= ridgeFactor * 0.16;

      // Légère nervure latérale de renfort
      const sideRib = Math.exp(-Math.pow((Math.abs(Math.cos(v)) - 0.55) * 8.0, 2)) * Math.sin(u * Math.PI * 0.85);
      y -= sideRib * 0.045;

      let x = rx * Math.cos(v);
      let z = rz * Math.sin(v);

      // Rebord inférieur + visière avant (sin(v) > 0 => avant du casque)
      if (u > 0.86) {
        const brimT = (u - 0.86) / 0.14;
        const frontMask = Math.max(0, Math.sin(v));
        const visorExtend = Math.pow(frontMask, 1.8) * 0.42 * brimT;
        const sideRim = 0.08 * brimT;
        x *= 1 + sideRim;
        z += visorExtend + sideRim * Math.sin(v) * 0.6;
        y += brimT * 0.06 - visorExtend * 0.08;
      }

      return [x, y, z];
    }

    const latRings = [];
    const uSteps = 12;
    const vSteps = 34;

    for (let iu = 1; iu <= uSteps; iu++) {
      const u = iu / uSteps;
      const ring = [];
      for (let iv = 0; iv <= vSteps; iv++) {
        const v = (iv / vSteps) * Math.PI * 2;
        ring.push(shellPoint(u, v));
      }
      latRings.push({ u, pts: ring });
    }

    const meridians = [];
    const mCount = 16;
    for (let im = 0; im < mCount; im++) {
      const v = (im / mCount) * Math.PI * 2;
      const line = [];
      for (let iu = 0; iu <= uSteps; iu++) {
        line.push(shellPoint(iu / uSteps, v));
      }
      meridians.push({ v, pts: line });
    }

    // Crête centrale mise en valeur en orange #FF4D1C
    const crestLine = [];
    for (let i = -14; i <= 14; i++) {
      const t = i / 14;
      const u = Math.abs(t) * 0.94;
      const v = t >= 0 ? Math.PI * 0.5 : -Math.PI * 0.5;
      const p = shellPoint(u, v);
      crestLine.push([p[0], p[1] - 0.015, p[2]]);
    }

    // Anneau de harnais intérieur
    const harnessRing = [];
    for (let iv = 0; iv <= 28; iv++) {
      const v = (iv / 28) * Math.PI * 2;
      harnessRing.push([0.82 * Math.cos(v), 0.34, 0.96 * Math.sin(v)]);
    }

    function project(pt) {
      const [x0, y0, z0] = pt;
      const cy = Math.cos(rotY);
      const sy = Math.sin(rotY);
      const cx = Math.cos(rotX);
      const sx = Math.sin(rotX);

      // Rotation Y
      const x1 = x0 * cy - z0 * sy;
      const z1 = x0 * sy + z0 * cy;
      // Rotation X
      const y2 = y0 * cx - z1 * sx;
      const z2 = y0 * sx + z1 * cx;

      const fov = 4.4;
      const depth = fov / (fov + z2 + 1.4);
      const scale = Math.min(cw, ch) * 0.34;
      return {
        x: cw / 2 + x1 * scale * depth,
        y: ch / 2 + y2 * scale * depth,
        z: z2,
        depth
      };
    }

    function drawPolyline(pts, stroke, lineWidth, dashed = false) {
      ctx.save();
      ctx.beginPath();
      if (dashed) ctx.setLineDash([4, 4]);
      pts.forEach((p, idx) => {
        const pr = project(p);
        if (idx === 0) ctx.moveTo(pr.x, pr.y);
        else ctx.lineTo(pr.x, pr.y);
      });
      ctx.strokeStyle = stroke;
      ctx.lineWidth = lineWidth;
      ctx.stroke();
      ctx.restore();
    }

    function resize() {
      const rect = wrap.getBoundingClientRect();
      cw = Math.max(240, Math.round(rect.width));
      ch = Math.max(220, Math.round(rect.height));
      canvas.width = Math.round(cw * DPR);
      canvas.height = Math.round(ch * DPR);
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    }

    function render() {
      if (!isDragging) {
        targetRotY += 0.005;
      }
      rotY += (targetRotY - rotY) * 0.12;
      rotX += (targetRotX - rotX) * 0.12;

      ctx.clearRect(0, 0, cw, ch);

      // Ombre elliptique douce au sol
      ctx.save();
      ctx.beginPath();
      ctx.ellipse(cw / 2, ch * 0.78, Math.min(cw, ch) * 0.28, 12, 0, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(18, 18, 18, 0.09)';
      ctx.fill();
      ctx.restore();

      // Remplissage translucide de la silhouette de la coque
      const brimPts = latRings[latRings.length - 1].pts.map(project);
      ctx.save();
      ctx.beginPath();
      brimPts.forEach((p, i) => (i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)));
      ctx.closePath();
      ctx.fillStyle = 'rgba(38, 44, 232, 0.06)';
      ctx.fill();
      ctx.restore();

      // Harnais interne en pointillés
      drawPolyline(harnessRing, 'rgba(18, 18, 18, 0.28)', 1, true);

      // Méridiens
      meridians.forEach((m) => {
        drawPolyline(m.pts, 'rgba(38, 44, 232, 0.34)', 1.0);
      });

      // Anneaux horizontaux (rebord final plus appuyé)
      latRings.forEach((r, idx) => {
        const isRim = idx === latRings.length - 1;
        drawPolyline(
          r.pts,
          isRim ? '#262CE8' : 'rgba(38, 44, 232, 0.45)',
          isRim ? 2.0 : 1.05
        );
      });

      // Crête structurelle du casque en orange #FF4D1C
      drawPolyline(crestLine, '#FF4D1C', 2.2);

      // Cotes CAO 1px dynamiques autour du casque
      const topPt = project([0, -0.84, 0]);
      const botPt = project([0, 0.32, 0]);
      const leftX = cw * 0.12;
      ctx.save();
      ctx.strokeStyle = 'rgba(18, 18, 18, 0.45)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(leftX, topPt.y);
      ctx.lineTo(leftX, botPt.y);
      ctx.moveTo(leftX - 5, topPt.y);
      ctx.lineTo(leftX + 5, topPt.y);
      ctx.moveTo(leftX - 5, botPt.y);
      ctx.lineTo(leftX + 5, botPt.y);
      ctx.stroke();

      ctx.fillStyle = '#121212';
      ctx.font = '600 10px "JetBrains Mono", monospace';
      ctx.fillText('H=155mm', leftX + 8, (topPt.y + botPt.y) / 2 + 3);
      ctx.fillStyle = '#262CE8';
      ctx.fillText('EN 397 · CASQUE CHANTIER 3D', 14, 22);
      ctx.fillStyle = '#FF4D1C';
      ctx.fillText('L=290mm · Ø 580', cw - 122, ch - 14);
      ctx.restore();

      requestAnimationFrame(render);
    }

    wrap.addEventListener('pointerdown', (e) => {
      isDragging = true;
      lastX = e.clientX;
      lastY = e.clientY;
      wrap.setPointerCapture(e.pointerId);
    });

    wrap.addEventListener('pointermove', (e) => {
      if (!isDragging) return;
      const dx = e.clientX - lastX;
      const dy = e.clientY - lastY;
      lastX = e.clientX;
      lastY = e.clientY;
      targetRotY += dx * 0.012;
      targetRotX = Math.max(-0.65, Math.min(0.85, targetRotX + dy * 0.01));
    });

    function endDrag(e) {
      if (!isDragging) return;
      isDragging = false;
      try {
        wrap.releasePointerCapture(e.pointerId);
      } catch (_) {}
    }

    wrap.addEventListener('pointerup', endDrag);
    wrap.addEventListener('pointercancel', endDrag);

    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        targetRotY = -0.55;
        targetRotX = 0.28;
      });
    }

    window.addEventListener('resize', resize);
    resize();
    requestAnimationFrame(render);
  });
})();
