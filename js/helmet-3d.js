/* ==========================================================================
   js/helmet-3d.js — Pont à Haubans 3D (WebGL 100 % filaire CAO)
   - Deux pylônes en losange (A-frame), tablier caisson aérodynamique cintré,
     64 haubans en éventail bleu Tsunami #262CE8 & têtes d'ancrage corail #FF4D1C
   - Onde de charge structurale façon calcul éléments finis (FEA / Fusion 360)
   - Rotation 360° fluide à 60 ips, compatible mode clair & mode sombre
   ========================================================================== */
(function () {
  /* ========================================================================
     PARAMÈTRES FACILES À MODIFIER — PONT À HAUBANS 3D (ST.01)
     ======================================================================== */
  const CONFIG = {
    autoRotateSpeed: 0.0038, // Vitesse de rotation automatique (rad/frame)
    initialRotY: -0.58,      // Angle 3/4 architectural initial
    initialRotX: 0.22,       // Plongée initiale
    staysPerSide: 7          // Nombre de paires de haubans par côté de pylône
  };

  document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('helmetCanvas');
    const wrap = document.getElementById('helmetWrap');
    const resetBtn = document.getElementById('resetHelmetBtn');
    if (!canvas || !wrap) return;

    const gl = canvas.getContext('webgl', { alpha: true, antialias: true, premultipliedAlpha: true });
    if (!gl) return;

    /* ----------------------------------------------------------------------
       1. GÉNÉRATION DU PONT À HAUBANS 3D (TYPE VIADUC / NORMANDIE)
       ---------------------------------------------------------------------- */
    const pos = [];
    const kind = []; // 0 = grille sol, 1 = tablier & pylônes, 2 = haubans bleu Tsunami, 3 = ancrages corail

    function addLine(ax, ay, az, bx, by, bz, k) {
      pos.push(ax, ay, az, bx, by, bz);
      kind.push(k, k);
    }

    const halfL = 2.35;
    const halfW = 0.34;
    const floorY = -0.82;
    const baseDeckY = -0.16;
    const pylonTopY = 1.16;
    const pylonXs = [-0.94, 0.94];

    // Légère cambrure architecturale du tablier (flèche douce au centre)
    function deckYAt(x) {
      const u = x / halfL;
      return baseDeckY + (1 - u * u) * 0.085;
    }

    // 1. Grille topographique au sol
    for (let gx = -2.5; gx <= 2.51; gx += 0.5) {
      addLine(gx, floorY, -1.1, gx, floorY, 1.1, 0);
    }
    for (let gz = -1.1; gz <= 1.11; gz += 0.366) {
      addLine(-2.5, floorY, gz, 2.5, floorY, gz, 0);
    }

    // 2. Tablier caisson aérodynamique (20 segments, section trapézoïdale profilée)
    const deckSegs = 20;
    const deckThick = 0.095;
    for (let i = 0; i < deckSegs; i++) {
      const x0 = -halfL + (i / deckSegs) * (halfL * 2);
      const x1 = -halfL + ((i + 1) / deckSegs) * (halfL * 2);
      const y0 = deckYAt(x0);
      const y1 = deckYAt(x1);

      for (const s of [-1, 1]) {
        // Bord supérieur extérieur du tablier
        addLine(x0, y0, s * halfW, x1, y1, s * halfW, 1);
        // Garde-corps / corniche fine
        addLine(x0, y0 + 0.04, s * halfW, x1, y1 + 0.04, s * halfW, 1);
        // Fond de caisson profilé (plus étroit dessous)
        addLine(x0, y0 - deckThick, s * (halfW * 0.62), x1, y1 - deckThick, s * (halfW * 0.62), 1);
      }
      // Axe central de chaussée
      addLine(x0, y0, 0, x1, y1, 0, 1);

      // Entretoises & profils transversaux du caisson
      addLine(x0, y0, -halfW, x0, y0, halfW, 1);
      addLine(x0, y0, -halfW, x0, y0 - deckThick, -halfW * 0.62, 1);
      addLine(x0, y0, halfW, x0, y0 - deckThick, halfW * 0.62, 1);
      addLine(x0, y0 - deckThick, -halfW * 0.62, x0, y0 - deckThick, halfW * 0.62, 1);

      if (i === deckSegs - 1) {
        addLine(x1, y1, -halfW, x1, y1, halfW, 1);
        addLine(x1, y1, -halfW, x1, y1 - deckThick, -halfW * 0.62, 1);
        addLine(x1, y1, halfW, x1, y1 - deckThick, halfW * 0.62, 1);
        addLine(x1, y1 - deckThick, -halfW * 0.62, x1, y1 - deckThick, halfW * 0.62, 1);
      }
    }

    // Culées d'extrémité
    for (const ex of [-halfL, halfL]) {
      const ey = deckYAt(ex) - deckThick;
      for (const s of [-1, 1]) {
        addLine(ex, ey, s * halfW * 0.65, ex, floorY, s * halfW * 0.8, 1);
      }
      addLine(ex, floorY, -halfW * 0.8, ex, floorY, halfW * 0.8, 1);
    }

    // 3. Deux pylônes architecturaux en losange (Y inversé / diamant) + haubans en éventail
    const nodePos = [];

    for (const px of pylonXs) {
      const dy = deckYAt(px);
      const legHalfX = 0.075;
      const baseZ = 0.56;
      const deckZ = 0.44;
      const kneeY = 0.58;
      const topZ = 0.08;

      // Jambes doubles du pylône (épaisseur réelle en X : px - legHalfX et px + legHalfX)
      for (const s of [-1, 1]) {
        for (const ox of [-legHalfX, legHalfX]) {
          // Fût inférieur (sol -> niveau tablier)
          addLine(px + ox, floorY, s * baseZ, px + ox, dy, s * deckZ, 1);
          // Jambe supérieure convergente (tablier -> tête de pylône)
          addLine(px + ox, dy, s * deckZ, px + ox, kneeY, s * 0.24, 1);
          addLine(px + ox, kneeY, s * 0.24, px + ox, pylonTopY, s * topZ, 1);
        }
        // Entretoises d'épaisseur sur chaque jambe
        addLine(px - legHalfX, floorY, s * baseZ, px + legHalfX, floorY, s * baseZ, 1);
        addLine(px - legHalfX, dy, s * deckZ, px + legHalfX, dy, s * deckZ, 1);
        addLine(px - legHalfX, kneeY, s * 0.24, px + legHalfX, kneeY, s * 0.24, 1);
        addLine(px - legHalfX, pylonTopY, s * topZ, px + legHalfX, pylonTopY, s * topZ, 1);
      }

      // Traverses horizontales de liaison du pylône (sous tablier, mi-hauteur, sommet)
      addLine(px, dy - deckThick - 0.03, -deckZ, px, dy - deckThick - 0.03, deckZ, 1);
      addLine(px, kneeY, -0.24, px, kneeY, 0.24, 1);
      addLine(px, pylonTopY, -topZ, px, pylonTopY, topZ, 3);
      addLine(px, pylonTopY - 0.12, -topZ * 1.35, px, pylonTopY - 0.12, topZ * 1.35, 1);

      // Tête d'ancrage corail au sommet du pylône
      nodePos.push(px, pylonTopY, -topZ, px, pylonTopY, topZ);

      // Haubans en semi-éventail (des deux côtés du pylône, sur les 2 nappes Z = ±halfW)
      const count = CONFIG.staysPerSide;
      for (const dir of [-1, 1]) {
        for (let k = 0; k < count; k++) {
          const frac = (k + 1) / count; // 0.14 .. 1.0
          // Hauteur d'ancrage étagée en tête de mât
          const anchorY = pylonTopY - (1 - frac) * 0.44;
          const anchorZRatio = topZ + (1 - frac) * 0.09;
          // Distance d'ancrage sur le tablier (ne dépasse pas le milieu entre les 2 pylônes ou les culées)
          const maxSpan = dir === (px < 0 ? 1 : -1) ? 0.88 : 1.24;
          const deckX = px + dir * (0.16 + frac * maxSpan);
          const dY = deckYAt(deckX);

          for (const s of [-1, 1]) {
            addLine(px, anchorY, s * anchorZRatio, deckX, dY + 0.015, s * halfW, 2);
            // Marque les ancrages extrêmes en corail
            if (k === count - 1) {
              nodePos.push(deckX, dY + 0.015, s * halfW);
            }
          }
        }
      }
    }

    /* ----------------------------------------------------------------------
       2. SHADERS WEBGL (FILAIRE ARCHITECTURAL + IMPULSION DE CHARGE FEA)
       ---------------------------------------------------------------------- */
    const VS = `
      attribute vec3 aPos;
      attribute float aKind;
      uniform mat4 uMvp;
      uniform mat4 uModelView;
      uniform float uPulseX;
      varying float vKind;
      varying float vDepth;
      varying float vPulse;
      void main() {
        vec4 mv = uModelView * vec4(aPos, 1.0);
        vDepth = clamp((mv.z + 6.0) / 3.8, 0.0, 1.0);
        vKind = aKind;
        float dx = abs(aPos.x - uPulseX);
        vPulse = smoothstep(0.42, 0.0, dx) * step(0.5, aKind);
        gl_Position = uMvp * vec4(aPos, 1.0);
        gl_PointSize = 5.5;
      }
    `;

    const FS = `
      precision mediump float;
      varying float vKind;
      varying float vDepth;
      varying float vPulse;
      uniform float uDark;
      void main() {
        vec3 colInk    = mix(vec3(0.08, 0.09, 0.12), vec3(0.78, 0.82, 0.92), uDark);
        vec3 colBlue   = mix(vec3(0.15, 0.17, 0.91), vec3(0.38, 0.56, 1.00), uDark);
        vec3 colOrange = vec3(1.00, 0.32, 0.13);
        vec3 colGrid   = mix(vec3(0.10, 0.10, 0.12), vec3(0.65, 0.72, 0.88), uDark);

        vec3 col = colInk;
        float alpha = 0.28 + pow(vDepth, 1.2) * 0.64;

        if (vKind < 0.5) {
          col = colGrid;
          alpha = mix(0.10, 0.14, uDark) * (0.4 + 0.6 * vDepth);
        } else if (vKind > 2.5) {
          col = colOrange;
          alpha = 0.96;
        } else if (vKind > 1.5) {
          col = colBlue;
          alpha = 0.32 + pow(vDepth, 1.1) * 0.64;
        }

        // Onde de charge corail traversant tablier et haubans
        col = mix(col, colOrange, vPulse * 0.62);
        alpha = min(1.0, alpha + vPulse * 0.22);

        gl_FragColor = vec4(col * alpha, alpha);
      }
    `;

    function compile(type, src) {
      const sh = gl.createShader(type);
      gl.shaderSource(sh, src);
      gl.compileShader(sh);
      return sh;
    }

    const prog = gl.createProgram();
    gl.attachShader(prog, compile(gl.VERTEX_SHADER, VS));
    gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, FS));
    gl.linkProgram(prog);
    gl.useProgram(prog);

    const aPos = gl.getAttribLocation(prog, 'aPos');
    const aKind = gl.getAttribLocation(prog, 'aKind');
    const uMvp = gl.getUniformLocation(prog, 'uMvp');
    const uModelView = gl.getUniformLocation(prog, 'uModelView');
    const uPulseX = gl.getUniformLocation(prog, 'uPulseX');
    const uDark = gl.getUniformLocation(prog, 'uDark');

    const linePosBuf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, linePosBuf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(pos), gl.STATIC_DRAW);

    const lineKindBuf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, lineKindBuf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(kind), gl.STATIC_DRAW);

    const nodePosBuf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, nodePosBuf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(nodePos), gl.STATIC_DRAW);

    const nodeKinds = new Float32Array(nodePos.length / 3).fill(3);
    const nodeKindBuf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, nodeKindBuf);
    gl.bufferData(gl.ARRAY_BUFFER, nodeKinds, gl.STATIC_DRAW);

    /* ----------------------------------------------------------------------
       3. MATRICES 4x4 & ORBITE 360° FLUIDE (PC & MOBILE)
       ---------------------------------------------------------------------- */
    function mul(a, b) {
      const out = new Float32Array(16);
      for (let r = 0; r < 4; r++) {
        for (let c = 0; c < 4; c++) {
          out[c * 4 + r] =
            a[0 * 4 + r] * b[c * 4 + 0] +
            a[1 * 4 + r] * b[c * 4 + 1] +
            a[2 * 4 + r] * b[c * 4 + 2] +
            a[3 * 4 + r] * b[c * 4 + 3];
        }
      }
      return out;
    }

    function perspective(fovy, aspect, near, far) {
      const f = 1 / Math.tan(fovy / 2);
      const nf = 1 / (near - far);
      return new Float32Array([
        f / aspect, 0, 0, 0,
        0, f, 0, 0,
        0, 0, (far + near) * nf, -1,
        0, 0, 2 * far * near * nf, 0
      ]);
    }

    function rotYMat(a) {
      const c = Math.cos(a), s = Math.sin(a);
      return new Float32Array([c, 0, -s, 0, 0, 1, 0, 0, s, 0, c, 0, 0, 0, 0, 1]);
    }

    function rotXMat(a) {
      const c = Math.cos(a), s = Math.sin(a);
      return new Float32Array([1, 0, 0, 0, 0, c, s, 0, 0, -s, c, 0, 0, 0, 0, 1]);
    }

    function transMat(x, y, z) {
      return new Float32Array([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, x, y, z, 1]);
    }

    let rotY = CONFIG.initialRotY;
    let rotX = CONFIG.initialRotX;
    let targetRotY = rotY;
    let targetRotX = rotX;
    let isDragging = false;
    let lastX = 0;
    let lastY = 0;
    const t0 = performance.now();

    function resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const rect = wrap.getBoundingClientRect();
      canvas.width = Math.max(1, Math.round(rect.width * dpr));
      canvas.height = Math.max(1, Math.round(rect.height * dpr));
      gl.viewport(0, 0, canvas.width, canvas.height);
    }

    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    gl.disable(gl.DEPTH_TEST);

    function render(now) {
      if (!isDragging) {
        targetRotY += CONFIG.autoRotateSpeed;
      }
      rotY += (targetRotY - rotY) * 0.11;
      rotX += (targetRotX - rotX) * 0.11;

      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);

      const isDark = document.documentElement.getAttribute('data-theme') === 'dark' ? 1.0 : 0.0;
      const aspect = canvas.width / Math.max(1, canvas.height);
      const dist = aspect < 1.15 ? 6.8 : 5.15;
      const proj = perspective(0.62, aspect, 0.1, 30.0);
      const mv = mul(transMat(0, -0.08, -dist), mul(rotXMat(rotX), rotYMat(rotY)));
      const mvp = mul(proj, mv);

      const cycle = ((now - t0) % 5600) / 5600;
      const pulseX = -2.8 + cycle * 5.6;

      gl.uniformMatrix4fv(uMvp, false, mvp);
      gl.uniformMatrix4fv(uModelView, false, mv);
      gl.uniform1f(uPulseX, pulseX);
      gl.uniform1f(uDark, isDark);

      gl.bindBuffer(gl.ARRAY_BUFFER, linePosBuf);
      gl.enableVertexAttribArray(aPos);
      gl.vertexAttribPointer(aPos, 3, gl.FLOAT, false, 0, 0);

      gl.bindBuffer(gl.ARRAY_BUFFER, lineKindBuf);
      gl.enableVertexAttribArray(aKind);
      gl.vertexAttribPointer(aKind, 1, gl.FLOAT, false, 0, 0);

      gl.drawArrays(gl.LINES, 0, pos.length / 3);

      gl.bindBuffer(gl.ARRAY_BUFFER, nodePosBuf);
      gl.vertexAttribPointer(aPos, 3, gl.FLOAT, false, 0, 0);

      gl.bindBuffer(gl.ARRAY_BUFFER, nodeKindBuf);
      gl.vertexAttribPointer(aKind, 1, gl.FLOAT, false, 0, 0);

      gl.drawArrays(gl.POINTS, 0, nodePos.length / 3);

      requestAnimationFrame(render);
    }

    wrap.addEventListener('pointerdown', (e) => {
      if (e.pointerType === 'touch' && window.innerWidth <= 640) return;
      isDragging = true;
      lastX = e.clientX;
      lastY = e.clientY;
      wrap.setPointerCapture(e.pointerId);
    });

    wrap.addEventListener('pointermove', (e) => {
      if (!isDragging) return;
      targetRotY += (e.clientX - lastX) * 0.011;
      targetRotX = Math.max(-0.55, Math.min(0.85, targetRotX + (e.clientY - lastY) * 0.009));
      lastX = e.clientX;
      lastY = e.clientY;
    });

    const endDrag = (e) => {
      if (!isDragging) return;
      isDragging = false;
      try { wrap.releasePointerCapture(e.pointerId); } catch (_) {}
    };
    wrap.addEventListener('pointerup', endDrag);
    wrap.addEventListener('pointercancel', endDrag);

    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        targetRotY = CONFIG.initialRotY;
        targetRotX = CONFIG.initialRotX;
      });
    }

    window.addEventListener('resize', resize);
    resize();
    requestAnimationFrame(render);
  });
})();
