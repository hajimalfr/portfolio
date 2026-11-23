/* ==========================================================================
   js/hero-ink.js — Shader WebGL "Liquid Ink" 60fps (sbwebdesign.ch .is-ink)
   Le survol souris ET les ondes autonomes utilisent exactement le même
   pipeline de pinceau liquide (addDrop), avec des trajectoires venant de partout.
   ========================================================================== */
(function () {
  /* ========================================================================
     PARAMÈTRES FACILES À MODIFIER — EFFET ENCRE LIQUIDE (ST.00)
     ======================================================================== */
  const CONFIG = {
    text: 'VICTOR VALROFF CHHUN', // Texte affiché sur la page d'accueil
    maxDrops: 30,                 // Nombre max de points d'encre actifs
    strokeDurationMs: 1350,       // Durée d'une onde autonome (ms)
    pauseBetweenStrokesMs: 1150,  // Pause entre deux ondes autonomes (ms)
    idleDelayMs: 1700,            // Délai sans souris avant reprise des ondes (ms)
    dropDecay: 0.013              // Vitesse de retour à l'état normal (plus petit = plus lent)
  };

  document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('heroInkCanvas');
    const wrap = document.getElementById('heroInkWrap');
    if (!canvas || !wrap) return;

    const TEXT = CONFIG.text;
    const MAX_DROPS = CONFIG.maxDrops;
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const gl = canvas.getContext('webgl', {
      alpha: true,
      antialias: true,
      premultipliedAlpha: false
    });

    if (!gl) {
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
      uniform vec4 uDrops[${MAX_DROPS}];
      uniform vec2 uVels[${MAX_DROPS}];

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
          p = p * 2.05 + vec2(1.7, 9.2);
          a *= 0.5;
        }
        return v;
      }

      void main() {
        float aspect = uRes.x / max(uRes.y, 1.0);
        vec2 disp = vec2(0.0);
        float inkEnergy = 0.0;
        float splashMask = 0.0;

        float n1 = fbm(vUv * vec2(aspect * 4.5, 4.5) + vec2(uTime * 0.12, -uTime * 0.1)) - 0.5;
        float n2 = fbm(vUv * vec2(aspect * 7.8, 7.8) - vec2(uTime * 0.14, uTime * 0.11)) - 0.5;

        for (int i = 0; i < ${MAX_DROPS}; i++) {
          vec4 d = uDrops[i];
          if (d.w <= 0.005) continue;

          vec2 diff = vUv - d.xy;
          vec2 corr = vec2(diff.x * aspect, diff.y);
          float dist = length(corr);

          float r = d.z * (0.82 + 0.52 * n1 + 0.28 * n2);
          float falloff = smoothstep(r, 0.0, dist) * d.w;

          if (falloff > 0.001) {
            vec2 vel = uVels[i];
            vec2 swirl = vec2(-corr.y, corr.x) * (0.35 + n2 * 0.75);
            disp += (vel * 1.55 + swirl * 0.14 + vec2(n1, n2) * 0.06) * falloff;
            inkEnergy += falloff * (0.9 + length(vel) * 9.5);
            splashMask += smoothstep(r * 1.15, r * 0.15, dist) * d.w;
          }
        }

        disp = clamp(disp, vec2(-0.24), vec2(0.24));

        vec2 uvMain = clamp(vUv - disp, 0.0, 1.0);
        float alphaMain = texture2D(uText, uvMain).a;

        vec2 uvOrange = clamp(vUv - disp * 1.92 + vec2(-0.006, 0.0045) * min(1.8, inkEnergy), 0.0, 1.0);
        float alphaOrange = texture2D(uText, uvOrange).a;

        vec2 uvTrail = clamp(vUv - disp * 2.65 + vec2(n1, n2) * 0.036 * min(1.5, splashMask), 0.0, 1.0);
        float alphaTrail = texture2D(uText, uvTrail).a;

        vec3 colBlue   = vec3(0.149, 0.173, 0.910); // #262CE8
        vec3 colOrange = vec3(1.000, 0.302, 0.110); // #FF4D1C
        vec3 colPeach  = vec3(1.000, 0.675, 0.545);

        float mixOrange = smoothstep(0.16, 1.0, inkEnergy + n1 * 0.25);
        float mixPeach  = smoothstep(0.62, 1.5, inkEnergy + n2 * 0.3);

        vec3 mainColor = mix(colBlue, colOrange, mixOrange);
        mainColor = mix(mainColor, colPeach, mixPeach * 0.68);

        float orangeBack = max(alphaOrange * smoothstep(0.05, 0.32, inkEnergy), alphaTrail * smoothstep(0.26, 0.88, splashMask));
        vec3 finalRgb = colOrange;
        float finalAlpha = orangeBack;

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

      let fontSize = Math.min(132, Math.max(34, cw * 0.088));
      tCtx.font = `800 ${fontSize}px "Bricolage Grotesque", "Barlow Condensed", sans-serif`;
      const measured = tCtx.measureText(TEXT).width;
      const targetW = cw * 0.9;
      if (measured > 0) fontSize = fontSize * (targetW / measured);

      tCtx.font = `800 ${fontSize.toFixed(1)}px "Bricolage Grotesque", "Barlow Condensed", sans-serif`;
      tCtx.fillStyle = '#262CE8';
      tCtx.textAlign = 'center';
      tCtx.textBaseline = 'middle';
      tCtx.fillText(TEXT, cw / 2, ch / 2);

      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, textCanvas);
    }

    const drops = Array.from({ length: MAX_DROPS }, () => ({
      x: -10, y: -10, r: 0.2, life: 0, vx: 0, vy: 0
    }));
    let dropHead = 0;
    let lastX = null;
    let lastY = null;
    let lastPointerTime = 0;

    function addDrop(nx, ny, vx, vy) {
      const d = drops[dropHead];
      dropHead = (dropHead + 1) % MAX_DROPS;
      const speed = Math.hypot(vx, vy);
      const mobileFactor = cw <= 640 ? 0.55 : 1.0;
      d.x = nx;
      d.y = ny;
      d.r = Math.min(0.46, 0.24 + speed * 2.1) * mobileFactor;
      d.life = 1.0;
      d.vx = Math.max(-0.11, Math.min(0.11, vx * 1.6)) * mobileFactor;
      d.vy = Math.max(-0.11, Math.min(0.11, vy * 1.6)) * mobileFactor;
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
        addDrop(nx, ny, vx, vy);
      });

      wrap.addEventListener('pointerleave', () => {
        lastX = null;
        lastY = null;
      });
    }

    // Pinceau virtuel autonome (identique au survol souris, venant de partout)
    const AUTO_PATHS = [
      { sx: 0.88, sy: 0.36, ex: 0.22, ey: 0.62 }, // Droite-haut -> Gauche-bas
      { sx: 0.28, sy: 0.66, ex: 0.78, ey: 0.38 }, // Gauche-bas -> Droite-haut
      { sx: 0.62, sy: 0.28, ex: 0.36, ey: 0.70 }, // Centre-haut -> Bas-gauche
      { sx: 0.14, sy: 0.44, ex: 0.68, ey: 0.56 }, // Gauche -> Centre-droite
      { sx: 0.82, sy: 0.64, ex: 0.42, ey: 0.34 }  // Droite-bas -> Centre-haut
    ];
    let pathIdx = 0;
    let strokeActive = false;
    let strokeStart = 0;
    let nextStrokeAt = performance.now() + 900;
    let ghostPrevX = null;
    let ghostPrevY = null;
    const STROKE_DURATION = CONFIG.strokeDurationMs;

    const dropUniforms = new Float32Array(MAX_DROPS * 4);
    const velUniforms = new Float32Array(MAX_DROPS * 2);
    const startTime = performance.now();

    function render(now) {
      const t = (now - startTime) * 0.001;

      // Exécution fluide du pinceau virtuel quand la souris est inactive
      if (!reducedMotion && now - lastPointerTime > CONFIG.idleDelayMs) {
        if (!strokeActive && now >= nextStrokeAt) {
          strokeActive = true;
          strokeStart = now;
          ghostPrevX = null;
          ghostPrevY = null;
        }
        if (strokeActive) {
          const raw = (now - strokeStart) / STROKE_DURATION;
          if (raw >= 1) {
            strokeActive = false;
            pathIdx = (pathIdx + 1) % AUTO_PATHS.length;
            nextStrokeAt = now + CONFIG.pauseBetweenStrokesMs;
          } else {
            const p = AUTO_PATHS[pathIdx];
            const e = raw < 0.5 ? 2 * raw * raw : 1 - Math.pow(-2 * raw + 2, 2) / 2;
            const gx = p.sx + (p.ex - p.sx) * e;
            const gy = p.sy + (p.ey - p.sy) * e + Math.sin(e * Math.PI) * 0.06;
            const gvx = ghostPrevX === null ? (p.ex - p.sx) * 0.015 : gx - ghostPrevX;
            const gvy = ghostPrevY === null ? (p.ey - p.sy) * 0.015 : gy - ghostPrevY;
            ghostPrevX = gx;
            ghostPrevY = gy;
            addDrop(gx, gy, gvx, gvy);
          }
        }
      } else {
        strokeActive = false;
        nextStrokeAt = now + 1500;
      }

      for (let i = 0; i < MAX_DROPS; i++) {
        const d = drops[i];
        if (d.life > 0) {
          d.life = Math.max(0, d.life - CONFIG.dropDecay);
          d.vx *= 0.945;
          d.vy *= 0.945;
        }
        dropUniforms[i * 4] = d.x;
        dropUniforms[i * 4 + 1] = d.y;
        dropUniforms[i * 4 + 2] = d.r;
        dropUniforms[i * 4 + 3] = d.life * d.life;
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
