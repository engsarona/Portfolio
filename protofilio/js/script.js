/* ═══════════════════════════════════════════════════════════════════
   Sara Ghaleb — AI Portfolio · script.js
   Three.js Digital Ocean World · GSAP · Full UX
   FIXED: Progressive enhancement; content always visible
═══════════════════════════════════════════════════════════════════ */
'use strict';

/* ────────────────────────────────────────
   UTILITIES
──────────────────────────────────────── */
const $ = (s, c = document) => c.querySelector(s);
const $$ = (s, c = document) => [...c.querySelectorAll(s)];
const mobile = () => window.innerWidth <= 768;
const PRM = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ────────────────────────────────────────
   STEP 1 — APPLY ANIMATION CLASS IMMEDIATELY
   This is the core fix: we add .sg-anim ONLY via JS,
   so CSS hides elements only when JS is running.
   Without JS (or if JS errors), elements stay visible.
──────────────────────────────────────── */
document.body.classList.add('sg-anim');

/* Safety net: if something goes wrong, show everything after 4s */
const safetyTimeout = setTimeout(() => {
  $$('.reveal, .gsap-fade').forEach(el => {
    el.classList.add('visible');
    el.style.opacity = '1';
    el.style.transform = 'none';
  });
  if (loader) loader.classList.add('out');
}, 4000);

/* ────────────────────────────────────────
   STEP 2 — THEME (apply immediately to prevent flash)
──────────────────────────────────────── */
const THEME_KEY = 'sg-ai-theme';
(function applyTheme() {
  const saved = localStorage.getItem(THEME_KEY) || 'dark';
  document.documentElement.dataset.theme = saved;
})();

/* ────────────────────────────────────────
   ELEMENT REFS
──────────────────────────────────────── */
const loader      = $('#loader');
const loaderBar   = $('#loaderBar');
const loaderSt    = $('#loaderStatus');

/* ────────────────────────────────────────
   STEP 3 — LOADING SCREEN
──────────────────────────────────────── */
const STEPS = [
  { p: 20,  m: 'Calibrating sensors…' },
  { p: 45,  m: 'Initializing 3D world…' },
  { p: 68,  m: 'Loading AI modules…' },
  { p: 88,  m: 'Establishing connection…' },
  { p: 100, m: "Welcome to Sara's AI World" }
];

function runLoader() {
  let i = 0;
  function tick() {
    if (i >= STEPS.length) { revealSite(); return; }
    const s = STEPS[i++];
    if (loaderBar) loaderBar.style.width = s.p + '%';
    if (loaderSt)  loaderSt.textContent  = s.m;
    setTimeout(tick, i === STEPS.length ? 600 : 300);
  }
  tick();
}

function revealSite() {
  clearTimeout(safetyTimeout);
  if (loader) loader.classList.add('out');
  initAll();
}

/* ════════════════════════════════════════════════════
   THREE.JS — AI DIGITAL OCEAN WORLD
════════════════════════════════════════════════════ */
class AIWorld {
  constructor() {
    if (PRM || typeof THREE === 'undefined') {
      console.warn('[AIWorld] Three.js unavailable or reduced motion; skipping 3D.');
      return;
    }
    this.canvas  = $('#threeCanvas');
    this.mouse   = { x: 0, y: 0, tx: 0, ty: 0 };
    this.scrollY = 0;
    this.clock   = new THREE.Clock();
    this.islands = [];
    this.orbs    = [];
    this.shipT   = 0;

    try {
      this._init();
      this._buildScene();
      this._animate();
      this._events();
    } catch (e) {
      console.warn('[AIWorld] Three.js error:', e);
    }
  }

  /* ── Setup ── */
  _init() {
    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.FogExp2(0x020810, 0.016);

    const W = window.innerWidth, H = window.innerHeight;
    this.cam = new THREE.PerspectiveCamera(55, W / H, 0.1, 200);
    this.cam.position.set(0, 12, 28);
    this.cam.lookAt(0, 0, 0);

    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      alpha: true,
      antialias: !mobile(),
      powerPreference: 'high-performance'
    });
    this.renderer.setPixelRatio(Math.min(devicePixelRatio, mobile() ? 1.5 : 2));
    this.renderer.setSize(W, H);
    this.renderer.setClearColor(0x000000, 0);
  }

  /* ── Full scene ── */
  _buildScene() {
    this._lights();
    this._ocean();
    this._islands();
    this._particles();
    this._monitors();
    this._ship();
    this._ambientOrbs();
    this._neuralWeb();
  }

  _lights() {
    this.scene.add(new THREE.AmbientLight(0x0a1628, 1.5));
    const c = new THREE.PointLight(0x00d4ff, 2, 60);
    c.position.set(0, 20, 0);
    this.scene.add(c); this.keyLight = c;

    const p = new THREE.PointLight(0x8b5cf6, 1.2, 50);
    p.position.set(-15, 8, -10); this.scene.add(p);

    const b = new THREE.PointLight(0x3b82f6, 0.8, 40);
    b.position.set(15, 5, 10); this.scene.add(b);
  }

  _ocean() {
    const D = mobile() ? 40 : 70;
    this.oceanGeo = new THREE.PlaneGeometry(120, 120, D, D);

    // Wireframe layer
    const wireMat = new THREE.MeshBasicMaterial({
      color: 0x00d4ff, wireframe: true, transparent: true,
      opacity: mobile() ? 0.045 : 0.065
    });
    this.ocean = new THREE.Mesh(this.oceanGeo, wireMat);
    this.ocean.rotation.x = -Math.PI / 2;
    this.ocean.position.y = -6;
    this.scene.add(this.ocean);

    // Solid surface
    const solidGeo = new THREE.PlaneGeometry(120, 120, 1, 1);
    const solidMat = new THREE.MeshPhongMaterial({
      color: 0x030d1e, transparent: true, opacity: 0.82,
      shininess: 50, specular: new THREE.Color(0x003355)
    });
    const solid = new THREE.Mesh(solidGeo, solidMat);
    solid.rotation.x = -Math.PI / 2;
    solid.position.y = -6.15;
    this.scene.add(solid);
  }

  _islands() {
    const data = [
      { pos: [0,   0,    0],   col: 0x00d4ff, sz: 1.8, name: 'origin'     },
      { pos: [-9,  0.5, -8],   col: 0x8b5cf6, sz: 1.4, name: 'about'      },
      { pos: [9,   1,   -7],   col: 0x06b6d4, sz: 1.5, name: 'skills'     },
      { pos: [-7,  0.8,  8],   col: 0x3b82f6, sz: 1.6, name: 'projects'   },
      { pos: [9,   0.6,  8],   col: 0x8b5cf6, sz: 1.3, name: 'experience' },
    ];

    data.forEach((d, i) => {
      const g = new THREE.Group();
      g.position.set(...d.pos);

      // Crystal body
      const geo = new THREE.IcosahedronGeometry(d.sz, 1);
      const mat = new THREE.MeshPhongMaterial({
        color: d.col, emissive: d.col, emissiveIntensity: 0.22,
        transparent: true, opacity: 0.88, shininess: 130
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.y = d.sz * 0.4;
      g.add(mesh);

      // Wire
      const wm = new THREE.MeshBasicMaterial({ color: d.col, wireframe: true, transparent: true, opacity: 0.14 });
      const wMesh = new THREE.Mesh(geo.clone(), wm);
      wMesh.position.copy(mesh.position);
      g.add(wMesh);

      // Holo ring
      const rGeo = new THREE.TorusGeometry(d.sz * 1.6, 0.04, 16, 80);
      const rMat = new THREE.MeshBasicMaterial({ color: d.col, transparent: true, opacity: 0.5 });
      const ring = new THREE.Mesh(rGeo, rMat);
      ring.rotation.x = Math.PI / 2;
      ring.position.y = d.sz * 0.4;
      g.add(ring);

      // Light pillar
      const pl = new THREE.CylinderGeometry(0.02, 0.02, 14, 4);
      const pm = new THREE.MeshBasicMaterial({ color: d.col, transparent: true, opacity: 0.1 });
      const pillar = new THREE.Mesh(pl, pm);
      pillar.position.y = d.sz * 0.4 + 7;
      g.add(pillar);

      // Point light
      const light = new THREE.PointLight(d.col, 0.65, 12);
      light.position.y = d.sz;
      g.add(light);

      this.scene.add(g);
      this.islands.push({ g, mesh, ring, wMesh, phase: i * 1.25 });
    });

    // Connecting bezier paths
    const pos = this.islands.map(is => is.g.position);
    for (let i = 0; i < pos.length - 1; i++) {
      const a = pos[i].clone(), b = pos[i + 1].clone();
      const mid = a.clone().lerp(b, 0.5);
      mid.y += 3;
      const curve = new THREE.QuadraticBezierCurve3(a, mid, b);
      const pts = curve.getPoints(32);
      const geo = new THREE.BufferGeometry().setFromPoints(pts);
      const mat = new THREE.LineBasicMaterial({ color: 0x00d4ff, transparent: true, opacity: 0.1 });
      this.scene.add(new THREE.Line(geo, mat));
    }
  }

  _particles() {
    const N = mobile() ? 350 : 850;
    const pos = new Float32Array(N * 3);
    for (let i = 0; i < N; i++) {
      const r = 28 + Math.random() * 24;
      const t = Math.random() * Math.PI * 2;
      const p = Math.random() * Math.PI;
      pos[i*3]   = r * Math.sin(p) * Math.cos(t);
      pos[i*3+1] = (Math.random() - 0.4) * 22;
      pos[i*3+2] = r * Math.sin(p) * Math.sin(t);
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const mat = new THREE.PointsMaterial({ color: 0x00d4ff, size: 0.11, transparent: true, opacity: 0.5, sizeAttenuation: true });
    this.particles = new THREE.Points(geo, mat);
    this.scene.add(this.particles);
  }

  _monitors() {
    /* Floating holographic monitors displaying project data */
    const mData = [
      { pos: [-5, 3, -5],  rot: [0, 0.5, 0] },
      { pos: [5,  4, -4],  rot: [0, -0.4, 0] },
      { pos: [0,  5,  6],  rot: [0, Math.PI, 0] },
    ];
    this.monitors = [];
    mData.forEach((d) => {
      const g = new THREE.Group();
      g.position.set(...d.pos);
      g.rotation.set(...d.rot);

      // Screen body
      const body = new THREE.Mesh(
        new THREE.BoxGeometry(2.4, 1.5, 0.05),
        new THREE.MeshPhongMaterial({
          color: 0x0a1628, emissive: 0x002244, shininess: 200,
          transparent: true, opacity: 0.9
        })
      );
      g.add(body);

      // Screen glow face
      const screen = new THREE.Mesh(
        new THREE.PlaneGeometry(2.2, 1.3),
        new THREE.MeshBasicMaterial({ color: 0x00d4ff, transparent: true, opacity: 0.07 })
      );
      screen.position.z = 0.031;
      g.add(screen);

      // Bezel
      const bezel = new THREE.Mesh(
        new THREE.BoxGeometry(2.5, 1.6, 0.04),
        new THREE.MeshBasicMaterial({ color: 0x00d4ff, transparent: true, opacity: 0.25 })
      );
      bezel.position.z = -0.005;
      g.add(bezel);

      // Stand
      const stand = new THREE.Mesh(
        new THREE.CylinderGeometry(0.02, 0.08, 0.6, 8),
        new THREE.MeshBasicMaterial({ color: 0x00d4ff, transparent: true, opacity: 0.3 })
      );
      stand.position.y = -1.05;
      g.add(stand);

      // Monitor light
      const ml = new THREE.PointLight(0x00d4ff, 0.4, 6);
      g.add(ml);

      this.scene.add(g);
      this.monitors.push({ g, phase: Math.random() * Math.PI * 2 });
    });
  }

  _ship() {
    this.ship = new THREE.Group();

    // Body
    const bGeo = new THREE.ConeGeometry(0.22, 1.1, 6);
    const bMat = new THREE.MeshPhongMaterial({
      color: 0x00d4ff, emissive: 0x00d4ff, emissiveIntensity: 0.45, shininess: 220
    });
    const body = new THREE.Mesh(bGeo, bMat);
    body.rotation.z = Math.PI / 2;
    this.ship.add(body);

    // Wings
    [-1, 1].forEach(sign => {
      const wing = new THREE.Mesh(
        new THREE.ConeGeometry(0.09, 0.55, 3),
        bMat
      );
      wing.position.set(-0.15, sign * 0.18, 0);
      wing.rotation.z = Math.PI;
      this.ship.add(wing);
    });

    // Engine trail light
    const tl = new THREE.PointLight(0x00d4ff, 1.2, 5);
    tl.position.set(-0.8, 0, 0);
    this.ship.add(tl);

    this.ship.position.set(-9, 2.5, -8);
    this.scene.add(this.ship);

    // Patrol path (catmull-rom through islands)
    this.shipPath = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-9,  2.5, -8),
      new THREE.Vector3(9,   3.0, -7),
      new THREE.Vector3(-7,  2.5,  8),
      new THREE.Vector3(9,   2.5,  8),
      new THREE.Vector3(0,   2.0,  0),
      new THREE.Vector3(-9,  2.5, -8),
    ], true);
  }

  _ambientOrbs() {
    const data = [
      { p: [16, 5, -16], c: 0x8b5cf6, s: 0.4 },
      { p: [-16, 8, 16], c: 0x00d4ff, s: 0.35 },
      { p: [0, 12, -22], c: 0x3b82f6, s: 0.28 },
      { p: [-22, 3, 0],  c: 0x06b6d4, s: 0.22 },
    ];
    data.forEach((d, i) => {
      const m = new THREE.Mesh(
        new THREE.SphereGeometry(d.s, 10, 10),
        new THREE.MeshBasicMaterial({ color: d.c, transparent: true, opacity: 0.7 })
      );
      m.position.set(...d.p);
      this.scene.add(m);
      const l = new THREE.PointLight(d.c, 0.4, 15);
      l.position.copy(m.position);
      this.scene.add(l);
      this.orbs.push({ m, l, base: m.position.clone(), ph: i });
    });
  }

  _neuralWeb() {
    /* Simple neural network — nodes connected by lines */
    const nodePositions = [];
    for (let i = 0; i < 8; i++) {
      nodePositions.push(new THREE.Vector3(
        (Math.random() - 0.5) * 30,
        Math.random() * 10 - 2,
        (Math.random() - 0.5) * 30
      ));
    }
    // Draw connections
    for (let i = 0; i < nodePositions.length; i++) {
      for (let j = i + 1; j < nodePositions.length; j++) {
        if (nodePositions[i].distanceTo(nodePositions[j]) < 18) {
          const pts = [nodePositions[i], nodePositions[j]];
          const geo = new THREE.BufferGeometry().setFromPoints(pts);
          const mat = new THREE.LineBasicMaterial({ color: 0x8b5cf6, transparent: true, opacity: 0.06 });
          this.scene.add(new THREE.Line(geo, mat));
        }
      }
    }
    // Node spheres
    nodePositions.forEach(p => {
      const m = new THREE.Mesh(
        new THREE.SphereGeometry(0.1, 8, 8),
        new THREE.MeshBasicMaterial({ color: 0x8b5cf6, transparent: true, opacity: 0.4 })
      );
      m.position.copy(p);
      this.scene.add(m);
    });
  }

  /* ── Animate ── */
  _animate() {
    this._raf = requestAnimationFrame(() => this._animate());
    const t = this.clock.getElapsedTime();

    this._waveOcean(t);
    this._animIslands(t);
    this._animShip(t);
    this._animOrbs(t);
    this._animMonitors(t);
    this._animCamera(t);

    if (this.particles) this.particles.rotation.y = t * 0.012;
    if (this.keyLight) this.keyLight.intensity = 1.6 + Math.sin(t * 0.9) * 0.5;

    this.renderer.render(this.scene, this.cam);
  }

  _waveOcean(t) {
    const pos = this.oceanGeo.attributes.position;
    const step = mobile() ? 3 : 1;
    for (let i = 0; i < pos.count; i += step) {
      const x = pos.getX(i), y = pos.getY(i);
      const z = Math.sin(x * 0.28 + t * 0.6) * 0.42
              + Math.sin(y * 0.38 + t * 0.44) * 0.3
              + Math.sin((x + y) * 0.18 + t * 0.32) * 0.22;
      pos.setZ(i, z);
    }
    pos.needsUpdate = true;
  }

  _animIslands(t) {
    this.islands.forEach(({ g, mesh, ring, wMesh, phase }) => {
      g.position.y = Math.sin(t * 0.48 + phase) * 0.3;
      mesh.rotation.y = t * 0.38 + phase;
      wMesh.rotation.y = -t * 0.22 + phase;
      ring.rotation.y = t * 0.58 + phase;
      ring.rotation.x = Math.PI / 2 + Math.sin(t * 0.28 + phase) * 0.14;
    });
  }

  _animShip(t) {
    if (!this.ship || !this.shipPath) return;
    this.shipT = (this.shipT + 0.0008) % 1;
    const pt  = this.shipPath.getPoint(this.shipT);
    const pt2 = this.shipPath.getPoint((this.shipT + 0.01) % 1);
    this.ship.position.copy(pt);
    this.ship.position.y += Math.sin(t * 1.8) * 0.14;
    const dir = pt2.clone().sub(pt).normalize();
    if (dir.length() > 0.001) this.ship.lookAt(pt.clone().add(dir));
  }

  _animOrbs(t) {
    this.orbs.forEach(({ m, l, base, ph }) => {
      m.position.x = base.x + Math.sin(t * 0.38 + ph) * 2;
      m.position.y = base.y + Math.sin(t * 0.28 + ph * 1.3) * 1.5;
      m.position.z = base.z + Math.cos(t * 0.33 + ph) * 2;
      l.position.copy(m.position);
      l.intensity = Math.max(0, 0.28 + Math.sin(t * 0.7 + ph) * 0.2);
    });
  }

  _animMonitors(t) {
    this.monitors && this.monitors.forEach(({ g, phase }) => {
      g.position.y += Math.sin(t * 0.4 + phase) * 0.005;
      g.rotation.y += Math.sin(t * 0.15 + phase) * 0.001;
    });
  }

  _animCamera(t) {
    // Smooth mouse parallax
    this.mouse.tx += (this.mouse.x - this.mouse.tx) * 0.04;
    this.mouse.ty += (this.mouse.y - this.mouse.ty) * 0.04;

    // Scroll percentage
    const maxS = Math.max(1, document.documentElement.scrollHeight - innerHeight);
    const pct  = this.scrollY / maxS;

    const tY = 12 - pct * 7;
    const tZ = 28 - pct * 10;
    const lY = pct * -3.5;

    this.cam.position.x += (this.mouse.tx * 1.8 - this.cam.position.x) * 0.025;
    this.cam.position.y += (tY + this.mouse.ty * 0.8 - this.cam.position.y) * 0.025;
    this.cam.position.z += (tZ - this.cam.position.z) * 0.025;
    this.cam.lookAt(0, lY, 0);
  }

  _events() {
    window.addEventListener('mousemove', e => {
      this.mouse.x = (e.clientX / innerWidth  - 0.5) * 2;
      this.mouse.y = (e.clientY / innerHeight - 0.5) * 2;
    }, { passive: true });

    window.addEventListener('scroll', () => {
      this.scrollY = window.scrollY;
    }, { passive: true });

    window.addEventListener('resize', () => {
      const W = innerWidth, H = innerHeight;
      this.cam.aspect = W / H;
      this.cam.updateProjectionMatrix();
      this.renderer.setSize(W, H);
    });
  }
}

/* ════════════════════════════════════════════════════
   CUSTOM CURSOR
════════════════════════════════════════════════════ */
function initCursor() {
  if (!window.matchMedia('(pointer:fine)').matches) return;
  const dot  = $('#cursor');
  const ring = $('#cursorRing');
  if (!dot || !ring) return;

  let rx = 0, ry = 0;

  document.addEventListener('mousemove', e => {
    dot.style.left  = e.clientX + 'px';
    dot.style.top   = e.clientY + 'px';
    rx += (e.clientX - rx) * 0.14;
    ry += (e.clientY - ry) * 0.14;
  }, { passive: true });

  (function rafLoop() {
    ring.style.left = rx + 'px';
    ring.style.top  = ry + 'px';
    requestAnimationFrame(rafLoop);
  })();

  const HITS = 'a,button,input,textarea,.glass-card,.nav-link';
  document.addEventListener('mouseover', e => {
    if (e.target.closest(HITS)) { dot.classList.add('on'); ring.classList.add('on'); }
  });
  document.addEventListener('mouseout', e => {
    if (e.target.closest(HITS)) { dot.classList.remove('on'); ring.classList.remove('on'); }
  });
}

/* ════════════════════════════════════════════════════
   NAVBAR
════════════════════════════════════════════════════ */
function initNavbar() {
  const nav      = $('#navbar');
  const burger   = $('#hamburger');
  const links    = $('#navLinks');
  const navAs    = $$('.nav-link');
  const sections = $$('main section[id]');

  window.addEventListener('scroll', () => {
    nav && nav.classList.toggle('sc', window.scrollY > 30);
    activeLink();
    updateMinimap();
  }, { passive: true });

  function activeLink() {
    const mid = window.scrollY + innerHeight * 0.38;
    let cur = '';
    sections.forEach(s => { if (s.offsetTop <= mid) cur = s.id; });
    navAs.forEach(a => a.classList.toggle('active', a.dataset.sec === cur));
  }

  burger && burger.addEventListener('click', () => {
    const o = links.classList.toggle('open');
    burger.classList.toggle('open', o);
    burger.setAttribute('aria-expanded', String(o));
  });

  navAs.forEach(a => a.addEventListener('click', () => {
    links.classList.remove('open');
    burger.classList.remove('open');
    burger.setAttribute('aria-expanded', 'false');
  }));

  document.addEventListener('click', e => {
    if (links.classList.contains('open') &&
        !links.contains(e.target) && !burger.contains(e.target)) {
      links.classList.remove('open');
      burger.classList.remove('open');
      burger.setAttribute('aria-expanded', 'false');
    }
  });

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && links.classList.contains('open')) {
      links.classList.remove('open');
      burger.classList.remove('open');
      burger.setAttribute('aria-expanded', 'false');
      burger.focus();
    }
  });
}

/* ════════════════════════════════════════════════════
   MINIMAP & WORLD TAGS
════════════════════════════════════════════════════ */
function updateMinimap() {
  const IDS  = ['hero','about','skills','projects','experience','contact'];
  const dots = $$('.mm-node');
  const mid  = window.scrollY + innerHeight * 0.38;
  let act = 0;
  IDS.forEach((id, i) => {
    const el = $('#' + id);
    if (el && el.offsetTop <= mid) act = i;
  });
  dots.forEach((d, i) => d.classList.toggle('active', i === act));
}

function initWorldTags() {
  const obs = new IntersectionObserver(entries => {
    entries.forEach(e => {
      const tag = e.target.querySelector('.world-tag');
      if (tag) tag.classList.toggle('vis', e.isIntersecting);
    });
  }, { threshold: 0.25 });
  $$('.section').forEach(s => obs.observe(s));
}

/* ════════════════════════════════════════════════════
   THEME TOGGLE
════════════════════════════════════════════════════ */
function initThemeToggle() {
  const btn = $('#themeToggle');
  const html = document.documentElement;
  btn && btn.addEventListener('click', () => {
    const next = html.dataset.theme === 'dark' ? 'light' : 'dark';
    html.dataset.theme = next;
    localStorage.setItem(THEME_KEY, next);
  });
}

/* ════════════════════════════════════════════════════
   TYPEWRITER ROLE
════════════════════════════════════════════════════ */
function initTypewriter() {
  const el = $('#roleText');
  if (!el) return;
  const ROLES = [
    'AI & Machine Learning Engineer',
    'Data Analytics Specialist',
    'Predictive Modeling Expert',
    'Streamlit App Developer',
    'End-to-End ML Engineer'
  ];
  let ri = 0, ci = 0, del = false;
  function tick() {
    const cur = ROLES[ri];
    if (!del) {
      el.textContent = cur.slice(0, ++ci);
      if (ci === cur.length) { del = true; setTimeout(tick, 2200); return; }
    } else {
      el.textContent = cur.slice(0, --ci);
      if (ci === 0) { del = false; ri = (ri + 1) % ROLES.length; setTimeout(tick, 320); return; }
    }
    setTimeout(tick, del ? 38 : 68);
  }
  setTimeout(tick, 900);
}

/* ════════════════════════════════════════════════════
   LIVE UTC CLOCK (HUD decoration)
════════════════════════════════════════════════════ */
function initClock() {
  const el = $('#coordTime');
  if (!el) return;
  function tick() {
    const d = new Date();
    const h = String(d.getUTCHours()).padStart(2,'0');
    const m = String(d.getUTCMinutes()).padStart(2,'0');
    const s = String(d.getUTCSeconds()).padStart(2,'0');
    el.textContent = `${h}:${m}:${s} UTC`;
  }
  tick();
  setInterval(tick, 1000);
}

/* ════════════════════════════════════════════════════
   SCROLL REVEAL — handles both GSAP and fallback
════════════════════════════════════════════════════ */
function initReveal() {
  const hasGSAP = typeof gsap !== 'undefined';
  const hasST   = hasGSAP && typeof ScrollTrigger !== 'undefined';

  /* Hero elements — animate in after loader */
  const heroEls = $$('.gsap-fade');

  if (hasGSAP) {
    gsap.registerPlugin && hasST && gsap.registerPlugin(ScrollTrigger);

    // Hero stagger
    gsap.fromTo(heroEls,
      { opacity: 0, y: 20 },
      { opacity: 1, y: 0, duration: 0.85, stagger: 0.18, ease: 'power3.out', delay: 0.2,
        onComplete: () => heroEls.forEach(e => { e.classList.add('visible'); }) }
    );

    // Hero parallax
    if (hasST) {
      gsap.to('#heroContent', {
        y: -80, ease: 'none',
        scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true }
      });

      // Section cards
      $$('.reveal').forEach(el => {
        const delay = (+el.dataset.d || 0) / 1000;
        gsap.fromTo(el,
          { opacity: 0, y: 28 },
          {
            opacity: 1, y: 0, duration: 0.72, delay, ease: 'power2.out',
            scrollTrigger: { trigger: el, start: 'top 88%', once: true },
            onComplete: () => el.classList.add('visible')
          }
        );
      });
    } else {
      // GSAP but no ScrollTrigger — fallback to IntersectionObserver
      initIO();
    }
  } else {
    // No GSAP at all — pure IntersectionObserver
    // Make hero elements visible immediately
    heroEls.forEach(e => e.classList.add('visible'));
    initIO();
  }
}

function initIO() {
  const obs = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      const delay = +e.target.dataset.d || 0;
      setTimeout(() => e.target.classList.add('visible'), delay);
      obs.unobserve(e.target);
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -36px 0px' });

  $$('.reveal').forEach(el => obs.observe(el));
}

/* ════════════════════════════════════════════════════
   SKILL BARS
════════════════════════════════════════════════════ */
function initSkillBars() {
  const obs = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      e.target.style.width = (e.target.dataset.w || 0) + '%';
      obs.unobserve(e.target);
    });
  }, { threshold: 0.5 });
  $$('.bl-fill').forEach(f => obs.observe(f));
}

/* ════════════════════════════════════════════════════
   SMOOTH SCROLL
════════════════════════════════════════════════════ */
function initScroll() {
  const nav = $('#navbar');
  $$('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
      const target = $(a.getAttribute('href'));
      if (!target) return;
      e.preventDefault();
      const off = nav ? nav.offsetHeight : 68;
      window.scrollTo({ top: target.getBoundingClientRect().top + window.scrollY - off, behavior: 'smooth' });
    });
  });
}

/* ════════════════════════════════════════════════════
   CONTACT FORM
════════════════════════════════════════════════════ */
function initForm() {
  const form = $('#contactForm');
  const note = $('#formNote');
  const btn  = $('#ctSubmit');
  if (!form) return;

  function setNote(msg, cls) {
    if (!note) return;
    note.textContent = msg;
    note.className = 'form-note' + (cls ? ' ' + cls : '');
  }

  function vField(el) {
    const ok = el.checkValidity();
    el.classList.toggle('invalid', !ok);
    return ok;
  }

  $$('input,textarea', form).forEach(f => {
    f.addEventListener('blur', () => vField(f));
    f.addEventListener('input', () => { if (f.classList.contains('invalid')) vField(f); });
  });

  form.addEventListener('submit', e => {
    e.preventDefault();
    setNote('');
    const ok = $$('input,textarea', form).map(vField).every(Boolean);
    if (!ok) { setNote('Please fill in all required fields correctly.', 'err'); return; }

    const lbl = $('.btn-lbl', btn);
    if (lbl) lbl.textContent = 'Transmitting…';
    btn.disabled = true;

    setTimeout(() => {
      setNote('✓ Signal received! I will respond shortly.', 'ok');
      form.reset();
      $$('input,textarea', form).forEach(f => f.classList.remove('invalid'));
      if (lbl) lbl.textContent = 'Transmit Message';
      btn.disabled = false;
    }, 1400);
  });
}

/* ════════════════════════════════════════════════════
   FOOTER YEAR
════════════════════════════════════════════════════ */
function initYear() {
  const el = $('#year');
  if (el) el.textContent = new Date().getFullYear();
}

/* ════════════════════════════════════════════════════
   INIT ALL FEATURES
════════════════════════════════════════════════════ */
function initAll() {
  clearTimeout(safetyTimeout);
  initCursor();
  initNavbar();
  initThemeToggle();
  initTypewriter();
  initClock();
  initReveal();
  initSkillBars();
  initScroll();
  initForm();
  initWorldTags();
  initYear();
  initMascot();       /* ← NEW: mascot companion */
  new AIWorld();
}

/* ════════════════════════════════════════════════════
   BOOT
════════════════════════════════════════════════════ */
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', runLoader);
} else {
  runLoader(); // Already loaded
}

/* ════════════════════════════════════════════════════
   MASCOT COMPANION CONTROLLER
   - Scroll-reactive speech bubbles
   - Section-based animation states
   - Click / hover interactions
   - Confetti trigger on certificates section
════════════════════════════════════════════════════ */
function initMascot() {
  const widget   = $('#mascotWidget');
  const msgEl    = $('#mascotMsg');
  const imgWrap  = $('#mascotImgWrap');
  if (!widget || !msgEl) return;

  /* ── Messages keyed to section ── */
  const SECTION_DATA = {
    hero:         { msg: 'Small Steps, Big Models! 🚀',          state: 'state-wave'  },
    about:        { msg: 'CS + AI student leveling up! 🎓',       state: 'state-think' },
    skills:       { msg: "Python & ML are my superpowers! 🐍",    state: 'state-type'  },
    projects:     { msg: 'Look what I built! 🏗️✨',               state: 'state-idle'  },
    experience:   { msg: 'Every milestone counts! 📌',            state: 'state-think' },
    services:     { msg: "Let's solve something together! 🤝",    state: 'state-wave'  },
    certificates: { msg: 'Certified and proud! 🎖️',              state: 'state-wave'  },
    contact:      { msg: "Say hi! I don't byte… much. 😄",        state: 'state-wave'  },
    objective:    { msg: '"To build the future, one model at a time."', state: 'state-think' }
  };

  const STATES = ['state-idle','state-wave','state-think','state-type'];
  let currentSection = 'hero';
  let confettiShown  = false;
  let bubbleTimeout  = null;

  /* ── Set animation state ── */
  function setState(state) {
    STATES.forEach(s => widget.classList.remove(s));
    widget.classList.add(state);
  }

  /* ── Update speech bubble ── */
  function setMessage(msg) {
    if (!msgEl) return;
    clearTimeout(bubbleTimeout);
    msgEl.style.opacity = '0';
    msgEl.style.transform = 'translateY(4px)';
    setTimeout(() => {
      msgEl.textContent = msg;
      msgEl.style.opacity = '1';
      msgEl.style.transform = 'translateY(0)';
    }, 200);
  }

  /* ── Detect active section on scroll ── */
  const sections = $$('main section[id]');
  function detectSection() {
    const mid = window.scrollY + window.innerHeight * 0.45;
    let active = 'hero';
    sections.forEach(s => { if (s.offsetTop <= mid) active = s.id; });
    if (active !== currentSection) {
      currentSection = active;
      const d = SECTION_DATA[active];
      if (d) {
        setMessage(d.msg);
        setState(d.state);
      }
      /* Trigger confetti when user reaches certificates section */
      if (active === 'certificates' && !confettiShown) {
        confettiShown = true;
        triggerConfetti();
      }
    }
    /* Hide widget when at very bottom (footer) */
    const atBottom = window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 80;
    widget.classList.toggle('hidden', atBottom);
  }

  window.addEventListener('scroll', detectSection, { passive: true });
  detectSection();

  /* ── Click mascot: wave animation ── */
  imgWrap && imgWrap.addEventListener('click', () => {
    const CLICK_MSGS = [
      "小步前行，大模型追梦！🧠",
      "Let's build something amazing! ⚡",
      "Powered by curiosity + caffeine ☕",
      "ML Engineer in training! 🏋️",
      "Every dataset tells a story 📊"
    ];
    const msg = CLICK_MSGS[Math.floor(Math.random() * CLICK_MSGS.length)];
    setMessage(msg);
    setState('state-wave');
    /* Bounce animation */
    imgWrap.style.transform = 'scale(1.15) rotate(-4deg)';
    setTimeout(() => { imgWrap.style.transform = ''; }, 350);
    /* Revert to scroll-based state after 3s */
    clearTimeout(bubbleTimeout);
    bubbleTimeout = setTimeout(() => detectSection(), 3000);
  });

  /* ── Hover: show cursor glow ── */
  imgWrap && imgWrap.addEventListener('mouseenter', () => {
    setState('state-wave');
  });
  imgWrap && imgWrap.addEventListener('mouseleave', () => {
    const d = SECTION_DATA[currentSection];
    if (d) setState(d.state);
  });

  /* ── Initial wave on load ── */
  setTimeout(() => {
    setState('state-wave');
    setTimeout(() => setState('state-idle'), 2000);
  }, 1200);

  /* ── Apply msg transition style ── */
  if (msgEl) {
    msgEl.style.transition = 'opacity .2s ease, transform .2s ease';
  }
}

/* ─────────────────────────────────────────────
   CONFETTI BURST (Certificates section trigger)
───────────────────────────────────────────────*/
function triggerConfetti() {
  const container = $('#certConfetti');
  if (!container) return;
  /* Re-trigger animation by clone-replace */
  const clone = container.cloneNode(true);
  container.parentNode.replaceChild(clone, container);
}
