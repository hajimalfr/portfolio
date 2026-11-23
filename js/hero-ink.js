/* ==========================================================================
   js/hero-ink.js — Shader WebGL "Liquid Ink" inspiré de sbwebdesign.ch (.is-ink)
   Déformation fluide des lettres + éclaboussures & mélange d'encre orange #FF4D1C
   en temps réel au passage de la souris, sur fond transparent (béton apparent).
   ========================================================================== */
(function () {
  document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('heroInkCanvas');
    const wrap = document.getElementById('heroInkWrap');
    if (!canvas || !wrap) return;

    const TEXT = 'VICTOR VALROFF CHHUN';
    const MAX_DROPS = 32;
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const gl = canvas.getContext('webgl', {
      alpha: true,
      antialias: true,
      premultipliedAlpha: false
    });

    if (!gl) {
      // Fallback propre si WebGL indisponible
      wrap.classList.add('ink-fallback');
      return;
    }

    const VERT_SRC = `
      attribute vec2 aPos;
      varying vec2 vUv;
      void main() {
        vUv = aPos * 0.5 + 0.5;
        vUv.y = 1.0 - vUv.y;
        gl_Position = vec4(aPos, 0.0, 1.0);
      }
    `;

    const FRAG_SRC = `
      precision highp float;
      varying vec2 vUv;

      uniform sampler2D uText;
      uniform vec2 uRes;
      uniform float uTime;
      uniform vec4 uDrops[${MAX_DROPS}];   // xy = pos (0..1), z = radius, w = life (1..0)
      uniform vec2 uVels[${MAX_DROPS}];    // xy = velocity vector

      // Bruit organique fluide pour casser toute symétrie géométrique
      float hash(vec2 p) {
        return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
      }

      float noise(vec2 p) {
        vec2 i = floor(p);
        vec2 f = fract(p);
        vec2 u = f * f * (3.0 - 2.0 * f);
        return mix(
          mix(hash(i + vec2(0.0, 0.0)), hash(i + vec2(1.0, 0.0)), u.x),
          mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x),
          u.y
        );
      }

      float fbm(vec2 p) {
        float v = 0.0;
        float a = 0.5;
        for (int i = 0; i < 3; i++) {
          v += a * noise(p);
          p = p * 2.1 + vec2(1.7, 9.2);
          a *= 0.5;
        }
        return v;
      }

      void main() {
        float aspect = uRes.x / max(uRes.y, 1.0);
        vec2 disp = vec2(0.0);
        float inkEnergy = 0.0;
        float splashMask = 0.0;

        float n1 = fbm(vUv * vec2(aspect * 5.2, 5.2) + vec2(uTime * 0.15, -uTime * 0.12)) - 0.5;
        float n2 = fbm(vUv * vec2(aspect * 8.5, 8.5) - vec2(uTime * 0.18, uTime * 0.14)) - 0.5;

        for (int i = 0; i < ${MAX_DROPS}; i++) {
          vec4 d = uDrops[i];
          if (d.w <= 0.005) continue;

          vec2 diff = vUv - d.xy;
          vec2 corr = vec2(diff.x * aspect, diff.y);
          float dist = length(corr);

          // Rayon organique irrégulier (non circulaire)
          float r = d.z * (0.82 + 0.52 * n1 + 0.28 * n2);
          float falloff = smoothstep(r, 0.0, dist) * d.w;

          if (falloff > 0.001) {
            vec2 vel = uVels[i];
            // Tourbillon + étirement dans le sens du mouvement de souris
            vec2 swirl = vec2(-corr.y, corr.x) * (0.35 + n2 * 0.8);
            disp += (vel * 1.45 + swirl * 0.14 + vec2(n1, n2) * 0.055) * falloff;
            inkEnergy += falloff * (0.85 + length(vel) * 9.0);
            splashMask += smoothstep(r * 1.12, r * 0.15, dist) * d.w;
          }
        }

        // Limitation plus ample pour des vagues d'encre larges
        disp = clamp(disp, vec2(-0.24), vec2(0.24));

        // 1. Lettre principale déformée (Bleu Tsunami #262CE8)
        vec2 uvMain = clamp(vUv - disp, 0.0, 1.0);
        float alphaMain = texture2D(uText, uvMain).a;

        // 2. Couche d'éclaboussure / cisaillement orange (#FF4D1C) large derrière & autour
        vec2 uvOrange = clamp(vUv - disp * 1.92 + vec2(-0.006, 0.0045) * min(1.8, inkEnergy), 0.0, 1.0);
        float alphaOrange = texture2D(uText, uvOrange).a;

        // 3. Deuxième traînée d'encre orange plus étirée pour les projections
        vec2 uvTrail = clamp(vUv - disp * 2.65 + vec2(n1, n2) * 0.036 * min(1.5, splashMask), 0.0, 1.0);
        float alphaTrail = texture2D(uText, uvTrail).a;

        vec3 colBlue   = vec3(0.149, 0.173, 0.910); // #262CE8
        vec3 colOrange = vec3(1.000, 0.302, 0.110); // #FF4D1C
        vec3 colPeach  = vec3(1.000, 0.675, 0.545); // Reflet chaud façon sbwebdesign

        // Mélange fluide bleu -> orange -> reflet pêche à l'intérieur des lettres perturbées
        float mixOrange = smoothstep(0.18, 1.05, inkEnergy + n1 * 0.25);
        float mixPeach  = smoothstep(0.65, 1.55, inkEnergy + n2 * 0.3);

        vec3 mainColor = mix(colBlue, colOrange, mixOrange);
        mainColor = mix(mainColor, colPeach, mixPeach * 0.68);

        // Composition des éclaboussures orange nettes derrière les lettres
        float orangeBack = max(alphaOrange * smoothstep(0.06, 0.35, inkEnergy), alphaTrail * smoothstep(0.28, 0.9, splashMask));
        vec3 finalRgb = colOrange;
        float finalAlpha = orangeBack;

        // Superposition de la lettre principale sur les éclaboussures orange
        finalRgb = mix(finalRgb, mainColor, alphaMain);
        finalAlpha = max(finalAlpha, alphaMain);

        gl_FragColor = vec4(finalRgb, finalAlpha);
      }
    `;

    function compile(type, src) {
      const sh = gl.createShader(type);
      gl.shaderSource(sh, src);
      gl.compileShader(sh);
      return sh;
    }

    const prog = gl.createProgram();
    gl.attachShader(prog, compile(gl.VERTEX_SHADER, VERT_SRC));
    gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, FRAG_SRC));
    gl.linkProgram(prog);
    gl.useProgram(prog);

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    const aPos = gl.getAttribLocation(prog, 'aPos');
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

    const uRes = gl.getUniformLocation(prog, 'uRes');
    const uTime = gl.getUniformLocation(prog, 'uTime');
    const uDropsLoc = gl.getUniformLocation(prog, 'uDrops');
    const uVelsLoc = gl.getUniformLocation(prog, 'uVels');

    // Texture texte haute résolution
    const textCanvas = document.createElement('canvas');
    const tCtx = textCanvas.getContext('2d');
    const tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

    let cw = 1000;
    let ch = 360;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    function drawTextTexture() {
      const rect = wrap.getBoundingClientRect();
      cw = Math.max(320, Math.round(rect.width));
      ch = Math.max(220, Math.round(rect.height));

      canvas.width = Math.round(cw * dpr);
      canvas.height = Math.round(ch * dpr);
      gl.viewport(0, 0, canvas.width, canvas.height);

      textCanvas.width = canvas.width;
      textCanvas.height = canvas.height;
      tCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
      tCtx.clearRect(0, 0, cw, ch);

      // Calcul automatique de la taille de police pour remplir ~90 % de la largeur sur 1 seule ligne
      let fontSize = Math.min(132, Math.max(34, cw * 0.088));
      tCtx.font = `800 ${fontSize}px "Bricolage Grotesque", "Barlow Condensed", sans-serif`;
      const measured = tCtx.measureText(TEXT).width;
      const targetW = cw * 0.9;
      if (measured > 0) {
        fontSize = fontSize * (targetW / measured);
      }

      tCtx.font = `800 ${fontSize.toFixed(1)}px "Bricolage Grotesque", "Barlow Condensed", sans-serif`;
      tCtx.fillStyle = '#262CE8';
      tCtx.textAlign = 'center';
      tCtx.textBaseline = 'middle';
      tCtx.fillText(TEXT, cw / 2, ch / 2);

      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, textCanvas);
    }

    // Buffer de gouttes / traînées de pinceau
    const drops = Array.from({ length: MAX_DROPS }, () => ({
      x: -10,
      y: -10,
      r: 0.16,
      life: 0,
      vx: 0,
      vy: 0
    }));
    let dropHead = 0;
    let lastX = null;
    let lastY = null;
    let lastPointerTime = 0;
    let ambientPhase = 0;

    function addDrop(nx, ny, vx, vy, radiusScale = 1.0) {
      const d = drops[dropHead];
      dropHead = (dropHead + 1) % MAX_DROPS;
      const speed = Math.hypot(vx, vy);
      d.x = nx;
      d.y = ny;
      d.r = Math.min(0.48, (0.26 + speed * 2.1) * radiusScale);
      d.life = 1.0;
      d.vx = Math.max(-0.11, Math.min(0.11, vx * 1.6));
      d.vy = Math.max(-0.11, Math.min(0.11, vy * 1.6));
    }

    if (!reducedMotion) {
      wrap.addEventListener('pointermove', (e) => {
        lastPointerTime = performance.now();
        const rect = wrap.getBoundingClientRect();
        const nx = (e.clientX - rect.left) / rect.width;
        const ny = (e.clientY - rect.top) / rect.height;
        const vx = lastX === null ? 0.015 : nx - lastX;
        const vy = lastY === null ? 0.0 : ny - lastY;
        lastX = nx;
        lastY = ny;
        addDrop(nx, ny, vx, vy, 1.05);
      });

      wrap.addEventListener('pointerleave', () => {
        lastX = null;
        lastY = null;
      });
    }

    const dropUniforms = new Float32Array(MAX_DROPS * 4);
    const velUniforms = new Float32Array(MAX_DROPS * 2);
    const startTime = performance.now();

    function render(now) {
      const t = (now - startTime) * 0.001;

      // Onde liquide autonome lente et fluide quand la souris n'est pas sur le titre
      if (!reducedMotion && now - lastPointerTime > 2400) {
        ambientPhase += 0.0045;
        const cycle = ambientPhase % 4.2;
        if (cycle < 1.9) {
          const waveX = 0.06 + (cycle / 1.9) * 0.88;
          const waveY = 0.5 + Math.sin(cycle * 3.4) * 0.06;
          if (Math.floor(ambientPhase * 120) % 4 === 0) {
            addDrop(waveX, waveY, 0.013, Math.cos(cycle * 3.4) * 0.004, 0.82);
          }
        }
      }

      for (let i = 0; i < MAX_DROPS; i++) {
        const d = drops[i];
        if (d.life > 0) {
          d.life = Math.max(0, d.life - 0.0095); // retour plus doux et progressif
          d.vx *= 0.955;
          d.vy *= 0.955;
        }
        dropUniforms[i * 4] = d.x;
        dropUniforms[i * 4 + 1] = d.y;
        dropUniforms[i * 4 + 2] = d.r;
        dropUniforms[i * 4 + 3] = d.life * d.life; // courbe d'amortissement élastique
        velUniforms[i * 2] = d.vx;
        velUniforms[i * 2 + 1] = d.vy;
      }

      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.uniform2f(uRes, cw, ch);
      gl.uniform1f(uTime, t);
      gl.uniform4fv(uDropsLoc, dropUniforms);
      gl.uniform2fv(uVelsLoc, velUniforms);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

      requestAnimationFrame(render);
    }

    drawTextTexture();
    window.addEventListener('resize', drawTextTexture);
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(drawTextTexture);
    }
    requestAnimationFrame(render);
  });
})();
