/*
 * 상상고리 hero — the !Cbooks infinity-ring mark as a slowly swaying 3D object,
 * 빨강 and 쪽빛 flowing into each other along the loop.
 * Plain WebGL 1, no libraries (~10k vertices, cheap on phones).
 *
 * The still logo stays in place (and the canvas is never shown) when:
 *   - the user prefers reduced motion, or the URL has ?still
 *   - WebGL is unavailable, fails to compile, or the context is lost
 *   - the device reports very low memory / few CPU cores
 *   - the first ~1.5 s of frames run below ~24 fps
 */
(function () {
  "use strict";

  var hero = document.querySelector(".hero");
  var canvas = document.querySelector(".hero-canvas");
  if (!hero || !canvas) return;

  var reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var lowEnd =
    (navigator.deviceMemory && navigator.deviceMemory < 2) ||
    (navigator.hardwareConcurrency && navigator.hardwareConcurrency < 3);
  var forceStill = /[?&]still\b/.test(location.search);
  if (reduceMotion || lowEnd || forceStill) return;

  var gl;
  try {
    var opts = { alpha: true, antialias: true, depth: true, stencil: false, premultipliedAlpha: true, powerPreference: "low-power" };
    gl = canvas.getContext("webgl", opts) || canvas.getContext("experimental-webgl", opts);
  } catch (e) { gl = null; }
  if (!gl) return;

  /* ---------------- geometry ---------------- */
  var pos = [], nor = [], flow = [], idx = [];

  // Sweep a circular tube along a closed polyline of points.
  function tube(points, radius, sides, phase, waves) {
    var n = points.length, base = pos.length / 3;
    for (var i = 0; i <= n; i++) {
      var p = points[i % n];
      var a = points[(i - 1 + n) % n], b = points[(i + 1) % n];
      var tx = b[0] - a[0], ty = b[1] - a[1], tz = b[2] - a[2];
      var tl = Math.hypot(tx, ty, tz); tx /= tl; ty /= tl; tz /= tl;
      // n1 = normalize(T x Z), n2 = n1 x T
      var n1x = ty, n1y = -tx, n1z = 0;
      var l1 = Math.hypot(n1x, n1y) || 1; n1x /= l1; n1y /= l1;
      var n2x = n1y * tz - n1z * ty, n2y = n1z * tx - n1x * tz, n2z = n1x * ty - n1y * tx;
      for (var j = 0; j <= sides; j++) {
        var ang = (j / sides) * Math.PI * 2, c = Math.cos(ang), s = Math.sin(ang);
        var nx = n1x * c + n2x * s, ny = n1y * c + n2y * s, nz = n1z * c + n2z * s;
        pos.push(p[0] + nx * radius, p[1] + ny * radius, p[2] + nz * radius);
        nor.push(nx, ny, nz);
        flow.push(i / n, phase, waves);
      }
    }
    var row = sides + 1;
    for (i = 0; i < n; i++) {
      for (j = 0; j < sides; j++) {
        var k = base + i * row + j;
        idx.push(k, k + row, k + 1, k + 1, k + row, k + row + 1);
      }
    }
  }

  // Lemniscate (figure-eight), stretched vertically like the mark,
  // with the two branches lifted apart where they cross.
  var A = 0.86, B = 1.75, H = 0.16, SEG = 260;
  var centre = [];
  for (var i = 0; i < SEG; i++) {
    var t = (i / SEG) * Math.PI * 2, s = Math.sin(t), c = Math.cos(t), d = 1 + s * s;
    centre.push([A * c / d, A * B * s * c / d, H * s * s * s]);
  }
  // three parallel strands, offset in the drawing plane
  var STRAND_R = 0.05, GAP = 0.118;
  [-1, 0, 1].forEach(function (k, si) {
    var pts = centre.map(function (p, i) {
      var a = centre[(i - 1 + SEG) % SEG], b = centre[(i + 1) % SEG];
      var tx = b[0] - a[0], ty = b[1] - a[1], l = Math.hypot(tx, ty) || 1;
      return [p[0] - (ty / l) * GAP * k, p[1] + (tx / l) * GAP * k, p[2]];
    });
    tube(pts, STRAND_R, 12, si * 0.9, 2);
  });
  // outer ring
  var ring = [], RR = 1.13;
  for (i = 0; i < 180; i++) {
    var u = (i / 180) * Math.PI * 2;
    ring.push([RR * Math.cos(u), RR * 0.88 * Math.sin(u), 0]);
  }
  tube(ring, 0.07, 12, 1.6, 1);

  /* ---------------- shaders ---------------- */
  var VERT = [
    "attribute vec3 aPos; attribute vec3 aNor; attribute vec3 aFlow;",
    "uniform mat4 uModel; uniform mat4 uProj;",
    "varying vec3 vN; varying vec3 vP; varying vec3 vF;",
    "void main(){",
    "  vec4 wp = uModel*vec4(aPos,1.);",
    "  vP = wp.xyz; vN = mat3(uModel)*aNor; vF = aFlow;",
    "  gl_Position = uProj*wp;",
    "}"
  ].join("\n");

  var FRAG = [
    "precision mediump float;",
    "varying vec3 vN; varying vec3 vP; varying vec3 vF;",
    "uniform float uTime;",
    // 빨강 (#a61f2d, the wordmark) and 쪽빛 (#2b4566, the card navy) in linear light, flowing into each other
    "const vec3 RED = vec3(0.381,0.0137,0.026);",
    "const vec3 INDIGO = vec3(0.022,0.05,0.13);",
    "void main(){",
    "  vec3 n = normalize(vN);",
    "  vec3 v = normalize(vec3(0.,0.,4.6) - vP);",
    "  float w = 0.5+0.5*sin(6.2831853*vF.x*vF.z - uTime*0.7 + vF.y);",
    "  w = smoothstep(0.08,0.92,w);",
    "  vec3 base = mix(INDIGO, RED, w);",
    "  vec3 L1 = normalize(vec3(-0.5,0.7,0.8));",
    "  vec3 L2 = normalize(vec3(0.8,-0.3,0.5));",
    "  float hemi = 0.5+0.5*n.y;",
    "  vec3 amb = mix(vec3(0.2,0.2,0.26), vec3(0.72,0.72,0.75), hemi)*0.55;",
    "  float d1 = max(dot(n,L1),0.), d2 = max(dot(n,L2),0.);",
    "  vec3 col = base*(amb + d1*0.95 + d2*0.25);",
    "  float sp = pow(max(dot(n,normalize(L1+v)),0.),60.);",
    "  float sp2 = pow(max(dot(n,normalize(L2+v)),0.),24.)*0.25;",
    "  float rim = pow(1.-max(dot(n,v),0.),3.)*0.25;",
    "  col += vec3(0.92,0.95,1.)*(sp*0.6+sp2*0.6) + vec3(0.55,0.5,0.6)*rim;",
    "  gl_FragColor = vec4(pow(col,vec3(0.4545)),1.);",
    "}"
  ].join("\n");

  function compile(type, src) {
    var sh = gl.createShader(type);
    gl.shaderSource(sh, src); gl.compileShader(sh);
    return gl.getShaderParameter(sh, gl.COMPILE_STATUS) ? sh : null;
  }
  var vs = compile(gl.VERTEX_SHADER, VERT), fs = compile(gl.FRAGMENT_SHADER, FRAG);
  if (!vs || !fs) return;
  var prog = gl.createProgram();
  gl.attachShader(prog, vs); gl.attachShader(prog, fs); gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return;
  gl.useProgram(prog);

  function attr(name, data) {
    var b = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, b);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data), gl.STATIC_DRAW);
    var l = gl.getAttribLocation(prog, name);
    gl.enableVertexAttribArray(l);
    gl.vertexAttribPointer(l, 3, gl.FLOAT, false, 0, 0);
  }
  attr("aPos", pos); attr("aNor", nor); attr("aFlow", flow);
  var ib = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ib);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(idx), gl.STATIC_DRAW);
  var count = idx.length;

  var uModel = gl.getUniformLocation(prog, "uModel");
  var uProj = gl.getUniformLocation(prog, "uProj");
  var uTime = gl.getUniformLocation(prog, "uTime");

  gl.enable(gl.DEPTH_TEST);
  gl.clearColor(0, 0, 0, 0);

  /* ---------------- matrices ---------------- */
  function perspective(fovy, aspect, near, far) {
    var f = 1 / Math.tan(fovy / 2), nf = 1 / (near - far);
    return [f / aspect, 0, 0, 0, 0, f, 0, 0, 0, 0, (far + near) * nf, -1, 0, 0, 2 * far * near * nf, 0];
  }
  function model(ry, rx, rz) {
    var cy = Math.cos(ry), sy = Math.sin(ry), cx = Math.cos(rx), sx = Math.sin(rx), cz = Math.cos(rz), sz = Math.sin(rz);
    // R = Ry * Rx * Rz, then translate z by -4.6 (camera)
    var m00 = cy * cz + sy * sx * sz, m01 = -cy * sz + sy * sx * cz, m02 = sy * cx;
    var m10 = cx * sz, m11 = cx * cz, m12 = -sx;
    var m20 = -sy * cz + cy * sx * sz, m21 = sy * sz + cy * sx * cz, m22 = cy * cx;
    return [m00, m10, m20, 0, m01, m11, m21, 0, m02, m12, m22, 0, 0, 0, -4.6, 1];
  }

  /* ---------------- sizing ---------------- */
  var scale = Math.min(window.devicePixelRatio || 1, 2);
  function resize() {
    var r = canvas.getBoundingClientRect();
    var w = Math.max(1, Math.round(r.width * scale)), h = Math.max(1, Math.round(r.height * scale));
    if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; }
    gl.viewport(0, 0, w, h);
    gl.uniformMatrix4fv(uProj, false, perspective(0.52, w / h, 0.1, 20));
  }
  window.addEventListener("resize", resize, { passive: true });
  resize();

  /* ---------------- interaction ---------------- */
  var tilt = { x: 0, y: 0 }, target = { x: 0, y: 0 };
  window.addEventListener("pointermove", function (e) {
    target.x = (e.clientX / window.innerWidth - 0.5) * 0.7;
    target.y = (e.clientY / window.innerHeight - 0.5) * 0.5;
  }, { passive: true });
  if (window.DeviceOrientationEvent && "ontouchstart" in window) {
    window.addEventListener("deviceorientation", function (e) {
      if (e.gamma == null) return;
      target.x = Math.max(-0.5, Math.min(0.5, e.gamma / 60));
      target.y = Math.max(-0.4, Math.min(0.4, (e.beta - 45) / 90));
    }, { passive: true });
  }

  /* ---------------- loop + fallback ---------------- */
  var inView = true, visible = !document.hidden, raf = 0, failed = false;
  var start = performance.now(), last = start;
  var frames = 0, probeTime = 0, samples = [], probing = true;

  function giveUp(why) {
    hero.setAttribute("data-hero", "still:" + why);
    failed = true;
    cancelAnimationFrame(raf);
    hero.classList.remove("is-live");
  }
  canvas.addEventListener("webglcontextlost", function (e) { e.preventDefault(); giveUp("context-lost"); });

  function draw(now) {
    var t = (now - start) / 1000;
    tilt.x += (target.x - tilt.x) * 0.06;
    tilt.y += (target.y - tilt.y) * 0.06;
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.uniform1f(uTime, t);
    gl.uniformMatrix4fv(uModel, false, model(
      Math.sin(t * 0.4) * 0.45 + tilt.x,
      Math.sin(t * 0.31) * 0.22 + tilt.y,
      Math.sin(t * 0.23) * 0.05
    ));
    gl.drawElements(gl.TRIANGLES, count, gl.UNSIGNED_SHORT, 0);
  }

  function frame(now) {
    if (failed) return;
    var dt = now - last; last = now;
    if (probing) {
      // Skip warm-up frames, and gaps where the browser paused us
      // (background tab, hidden pane): those say nothing about the device.
      // The median frame time ignores one-off hitches (fonts, images decoding).
      if (frames > 2 && dt < 400 && !document.hidden) { probeTime += dt; samples.push(dt); }
      frames++;
      if (probeTime > 1500) {
        probing = false;
        samples.sort(function (x, y) { return x - y; });
        var fps = 1000 / samples[samples.length >> 1];
        if (fps < 24) { giveUp("slow-" + Math.round(fps) + "fps"); return; }
      }
    }
    draw(now);
    if (frames === 3) { hero.classList.add("is-live"); hero.setAttribute("data-hero", "live"); }
    if (inView && visible) raf = requestAnimationFrame(frame);
  }

  function resume() {
    if (failed || !(inView && visible)) return;
    cancelAnimationFrame(raf);
    last = performance.now();
    raf = requestAnimationFrame(frame);
  }

  if ("IntersectionObserver" in window) {
    new IntersectionObserver(function (en) {
      inView = en[0].isIntersecting;
      if (inView) resume(); else cancelAnimationFrame(raf);
    }).observe(canvas);
  }
  document.addEventListener("visibilitychange", function () {
    visible = !document.hidden;
    if (visible) resume(); else cancelAnimationFrame(raf);
  });

  resume();
})();
