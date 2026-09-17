/* ==========================================================================
   Trái tim 3D — HTML/CSS/JS thuần (three.js dựng cảnh, không cần máy chủ)
   ========================================================================== */

import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";

const cfg = window.heartConfig;
const isMobile = window.innerWidth < 600;
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ------------------------------------------------------------- Hạ tầng cảnh */
const canvas = document.getElementById("scene");
const stage = document.getElementById("stage");
const overlay = document.getElementById("overlay");

const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: "high-performance" });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(0x000000, 0);

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 0, 4);

const controls = new OrbitControls(camera, canvas);
controls.enableZoom = true;
controls.enablePan = true;
controls.enableRotate = true;
controls.enableDamping = true;
controls.dampingFactor = 0.08;
controls.minDistance = 0.5;
controls.maxDistance = 10;

const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));
const bloom = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 1.6, 0.8, 0.1);
bloom.strength = isMobile ? 1.3 : 1.7;
composer.addPass(bloom);

scene.add(new THREE.AmbientLight(0xffffff, 0.5));
const key = new THREE.PointLight(0xffffff, 1);
key.position.set(10, 10, 10);
scene.add(key);

/* ------------------------------------------------------------- Ảnh hạt sáng */
function glowTexture(size = 128) {
  const c = document.createElement("canvas");
  c.width = c.height = size;
  const g = c.getContext("2d");
  const grad = g.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  grad.addColorStop(0, "rgba(255,255,255,1)");
  grad.addColorStop(0.15, "rgba(255,255,255,0.9)");
  grad.addColorStop(0.3, "rgba(255,255,255,0.6)");
  grad.addColorStop(0.5, "rgba(255,255,255,0.3)");
  grad.addColorStop(0.7, "rgba(255,255,255,0.1)");
  grad.addColorStop(1, "rgba(255,255,255,0)");
  g.beginPath();
  g.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
  g.fillStyle = grad;
  g.fill();
  const t = new THREE.CanvasTexture(c);
  t.needsUpdate = true;
  return t;
}

function softTexture(size = 32) {
  const c = document.createElement("canvas");
  c.width = c.height = size;
  const g = c.getContext("2d");
  const grad = g.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  grad.addColorStop(0, "rgba(255,255,255,1)");
  grad.addColorStop(0.35, "rgba(255,255,255,0.55)");
  grad.addColorStop(1, "rgba(255,255,255,0)");
  g.fillStyle = grad;
  g.fillRect(0, 0, size, size);
  return new THREE.CanvasTexture(c);
}

function heartTexture(size = 128) {
  const c = document.createElement("canvas");
  c.width = c.height = size;
  const n = c.getContext("2d");
  const cx = size / 2;
  const cy = size / 2;
  const u = size / 32;
  const path = (k) => {
    n.beginPath();
    const a = u * k;
    n.moveTo(cx, cy + 10 * a);
    n.bezierCurveTo(cx - 2 * a, cy + 6 * a, cx - 12 * a, cy + 2 * a, cx - 12 * a, cy - 4 * a);
    n.bezierCurveTo(cx - 12 * a, cy - 10 * a, cx - 6 * a, cy - 12 * a, cx, cy - 6 * a);
    n.bezierCurveTo(cx + 6 * a, cy - 12 * a, cx + 12 * a, cy - 10 * a, cx + 12 * a, cy - 4 * a);
    n.bezierCurveTo(cx + 12 * a, cy + 2 * a, cx + 2 * a, cy + 6 * a, cx, cy + 10 * a);
    n.closePath();
  };
  for (let i = 3; i >= 1; i--) {
    n.save();
    path(1 + 0.05 * i);
    n.fillStyle = `rgba(255,255,255,${0.15 / i})`;
    n.fill();
    n.restore();
  }
  path(1);
  n.fillStyle = "#ffffff";
  n.fill();
  return new THREE.CanvasTexture(c);
}

const texGlow = glowTexture(128);
const texSoft = softTexture(32);
const texHeart = heartTexture(128);

/* --------------------------------------------------------- Bầu trời đầy sao */
let stars = null;
if (cfg.sky.stars !== false) {
  const count = isMobile ? 1400 : 2600;
  const pos = new Float32Array(count * 3);
  const col = new Float32Array(count * 3);
  const twinkle = new Float32Array(count * 2);
  const base = new Float32Array(count);
  for (let i = 0; i < count; i++) {
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    const r = 34 + 56 * Math.random();
    pos[3 * i] = Math.sin(phi) * Math.cos(theta) * r;
    pos[3 * i + 1] = Math.sin(phi) * Math.sin(theta) * r;
    pos[3 * i + 2] = Math.cos(phi) * r;
    const b = 0.16 + 0.5 * Math.random() ** 2;
    base[i] = b;
    col[3 * i] = b;
    col[3 * i + 1] = b * 0.94;
    col[3 * i + 2] = b * 0.88;
    twinkle[2 * i] = Math.random() * Math.PI * 2;
    twinkle[2 * i + 1] = 0.25 + 0.7 * Math.random();
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  geo.setAttribute("color", new THREE.BufferAttribute(col, 3));
  const mat = new THREE.PointsMaterial({
    size: 0.9,
    vertexColors: true,
    transparent: true,
    opacity: 0,
    sizeAttenuation: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    map: texSoft,
  });
  stars = new THREE.Points(geo, mat);
  stars.userData = { count, twinkle, base };
  scene.add(stars);
}

/* --------------------------------------------------------------- Bụi trôi */
let drift = null;
if (cfg.sky.drift !== false) {
  const count = isMobile ? 220 : 420;
  const pos = new Float32Array(count * 3);
  const seed = [];
  for (let i = 0; i < count; i++) {
    const r = 6 + 18 * Math.random();
    const a = Math.random() * Math.PI * 2;
    pos[3 * i] = Math.cos(a) * r;
    pos[3 * i + 1] = -8 + 20 * Math.random();
    pos[3 * i + 2] = Math.sin(a) * r - 6;
    seed.push({ speed: 0.05 + 0.12 * Math.random(), phase: Math.random() * Math.PI * 2 });
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  drift = new THREE.Points(
    geo,
    new THREE.PointsMaterial({
      size: 0.16,
      color: new THREE.Color(1, 0.85, 0.9),
      transparent: true,
      opacity: 0.35,
      map: texSoft,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      sizeAttenuation: true,
    }),
  );
  drift.userData = { count, seed };
  scene.add(drift);
}

/* ----------------------------------------------------------------- Bông tuyết */
let snow = null;
if (cfg.sky.snow !== false) {
  const count = isMobile ? 260 : 520;
  const pos = new Float32Array(count * 3);
  const flakes = [];
  for (let i = 0; i < count; i++) {
    const a = Math.random() * Math.PI * 2;
    const r = Math.sqrt(Math.random()) * 16;
    const f = {
      x: Math.cos(a) * r,
      z: Math.sin(a) * r - 4,
      y: 12 * Math.random() - 2,
      speed: 0.35 + 0.5 * Math.random(),
      wobble: 0.12 + 0.2 * Math.random(),
      phase: Math.random() * Math.PI * 2,
    };
    flakes.push(f);
    pos[3 * i] = f.x;
    pos[3 * i + 1] = f.y;
    pos[3 * i + 2] = f.z;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  snow = new THREE.Points(
    geo,
    new THREE.PointsMaterial({
      size: 0.14,
      color: new THREE.Color(1, 0.92, 0.95),
      transparent: true,
      opacity: 0.5,
      map: texSoft,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      sizeAttenuation: true,
    }),
  );
  snow.userData = { count, flakes };
  scene.add(snow);
}

/* -------------------------------------------- Dải sáng hồng giữa bầu trời */
let pinkSky = null;
let pinkGlow = null;
if (!reduceMotion) {
  const count = isMobile ? 1800 : 3600;
  const pos = new Float32Array(count * 3);
  const col = new Float32Array(count * 3);
  const start = new THREE.Color("#ff77aa");
  const middle = new THREE.Color("#ffb0ca");
  const edge = new THREE.Color("#9f5ac4");

  for (let i = 0; i < count; i++) {
    const spread = Math.pow(Math.random(), 1.55);
    const x = (Math.random() - 0.5) * 30;
    const wave = Math.sin(x * 0.38) * 0.28;
    const y = wave + (Math.random() - 0.5) * (0.35 + 2.8 * spread);
    const z = -7 - 9 * Math.random();
    pos[3 * i] = x;
    pos[3 * i + 1] = y;
    pos[3 * i + 2] = z;

    const centerWeight = 1 - Math.min(1, Math.abs(x) / 15);
    const color = start.clone().lerp(middle, centerWeight).lerp(edge, spread * 0.35);
    const brightness = 0.55 + 0.85 * Math.random();
    col[3 * i] = color.r * brightness;
    col[3 * i + 1] = color.g * brightness;
    col[3 * i + 2] = color.b * brightness;
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  geo.setAttribute("color", new THREE.BufferAttribute(col, 3));
  pinkSky = new THREE.Points(
    geo,
    new THREE.PointsMaterial({
      size: isMobile ? 0.13 : 0.11,
      map: texSoft,
      vertexColors: true,
      transparent: true,
      opacity: 0.54,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      sizeAttenuation: true,
    }),
  );
  pinkSky.renderOrder = -12;
  scene.add(pinkSky);

  pinkGlow = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: texGlow,
      color: new THREE.Color("#ff4f9a"),
      transparent: true,
      opacity: 0.2,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    }),
  );
  pinkGlow.position.set(0, 0, -9);
  pinkGlow.scale.set(isMobile ? 10 : 14, isMobile ? 3.4 : 4.4, 1);
  pinkGlow.renderOrder = -13;
  scene.add(pinkGlow);
}

/* ------------------------------------------------------------ Tim nhỏ bay lên */
let minis = null;
if (true) {
  const count = isMobile ? 46 : 80;
  const pos = new Float32Array(count * 3);
  const items = [];
  for (let i = 0; i < count; i++) {
    const a = Math.random() * Math.PI * 2;
    const r = Math.sqrt(Math.random()) * 8;
    const it = {
      x: Math.cos(a) * r,
      z: Math.sin(a) * r,
      baseY: -0.8 + 1.5 * Math.random(),
      speed: 0.4 * (0.5 + 0.6 * Math.random()),
      phase: Math.random() * Math.PI * 2,
      size: 0.03 + 0.04 * Math.random(),
      wobbleSpeed: 0.3 + 0.5 * Math.random(),
      wobbleAmount: 0.12 + 0.18 * Math.random(),
      lifetime: 4 + 6 * Math.random(),
      spawn: 3 * Math.random(),
      fadeIn: 0.3 + 0.4 * Math.random(),
      fadeOut: 1 + 1.5 * Math.random(),
      t0: 0,
    };
    items.push(it);
    pos[3 * i] = it.x;
    pos[3 * i + 1] = it.baseY;
    pos[3 * i + 2] = it.z;
  }
  const sizes = new Float32Array(count).fill(0.05);
  const colors = new Float32Array(count * 3);
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  geo.setAttribute("size", new THREE.BufferAttribute(sizes, 1));
  geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  minis = new THREE.Points(
    geo,
    new THREE.PointsMaterial({
      size: 0.2,
      vertexColors: true,
      transparent: true,
      opacity: 0,
      sizeAttenuation: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      map: texHeart,
      alphaTest: 0.005,
    }),
  );
  minis.userData = { count, items, color: new THREE.Color(cfg.miniHeartColor) };
  scene.add(minis);
}

/* -------------------------------------------------------------- Sao băng */
const shooters = [];
if (cfg.sky.shootingStars !== false) {
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(new Float32Array(6), 3));
  for (let i = 0; i < 3; i++) {
    const line = new THREE.Line(
      geo.clone(),
      new THREE.LineBasicMaterial({
        color: 0xffe9f2,
        transparent: true,
        opacity: 0,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
    );
    scene.add(line);
    shooters.push({ line, next: 2 + 6 * Math.random(), life: 0, dur: 0, from: new THREE.Vector3(), dir: new THREE.Vector3() });
  }
}

/* --------------------------------------------------------------- Pháo hoa */
let fireworks = null;
if (cfg.sky.fireworks !== false) {
  const max = isMobile ? 500 : 900;
  const pos = new Float32Array(max * 3);
  const col = new Float32Array(max * 3);
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  geo.setAttribute("color", new THREE.BufferAttribute(col, 3));
  const points = new THREE.Points(
    geo,
    new THREE.PointsMaterial({
      size: 0.22,
      vertexColors: true,
      transparent: true,
      opacity: 0.95,
      map: texGlow,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      sizeAttenuation: true,
    }),
  );
  scene.add(points);
  fireworks = { points, max, parts: [], next: 1.5 };
}

/* ============================ TRÁI TIM HẠT ============================== */
const HEART_SCALE = isMobile ? 0.58 : 0.72;
const COUNT = isMobile ? 9000 : 14000;

// Mặt tim ẩn của Taubin: (x² + 9/4·y² + z² − 1)³ − x²z³ − 9/80·y²z³ = 0
function heartField(x, y, z) {
  const a = x * x + 2.25 * y * y + z * z - 1;
  return a * a * a - x * x * z * z * z - (9 / 80) * y * y * z * z * z;
}

// Tìm bán kính r theo hướng dir sao cho điểm nằm trên mặt tim
function surfaceRadius(dx, dy, dz) {
  let prevT = 0.02;
  let prev = heartField(dx * prevT, dy * prevT, dz * prevT);
  for (let i = 1; i <= 120; i++) {
    const t = 0.02 + (2 - 0.02) * (i / 120);
    const v = heartField(dx * t, dy * t, dz * t);
    if (prev * v < 0) {
      let lo = prevT;
      let hi = t;
      for (let k = 0; k < 24; k++) {
        const mid = 0.5 * (lo + hi);
        if (heartField(dx * mid, dy * mid, dz * mid) * prev < 0) hi = mid;
        else lo = mid;
      }
      return 0.5 * (lo + hi);
    }
    prevT = t;
    prev = v;
  }
  return null;
}

const heartPositions = new Float32Array(COUNT * 3);
const blobPositions = new Float32Array(COUNT * 3);
const noiseOffsets = new Float32Array(COUNT * 3);
const partColors = new Float32Array(COUNT * 3);
const partSizes = new Float32Array(COUNT);

const START_COLOR = new THREE.Color(1.8, 1.2, 0.5); // vàng ấm lúc mới hình thành
const HEART_COLOR = new THREE.Color(cfg.heartColor);
const FINAL_COLOR = new THREE.Color(HEART_COLOR.r * 2.7, HEART_COLOR.g * 2.7, HEART_COLOR.b * 2.7);

let made = 0;
let guard = 0;
while (made < COUNT && guard < COUNT * 60) {
  guard++;
  // Hướng ngẫu nhiên trên mặt cầu
  const uy = 2 * Math.random() - 1;
  const ang = Math.random() * Math.PI * 2;
  const s = Math.sqrt(1 - uy * uy);
  const gx = s * Math.cos(ang);
  const gy = uy;
  const gz = s * Math.sin(ang);

  const r = surfaceRadius(gx, gy, gz);
  if (!r) continue;

  // Toạ độ tim: đổi trục để mũi tim quay xuống, mặt tim hướng về ống kính
  const hx = gx * r * HEART_SCALE;
  const hy = gz * r * HEART_SCALE;
  const hz = gy * r * HEART_SCALE * 0.85;
  heartPositions[3 * made] = hx;
  heartPositions[3 * made + 1] = hy;
  heartPositions[3 * made + 2] = hz;

  // Toạ độ khối mây ban đầu: quả cầu có những tua sáng vươn ra
  const tendril = Math.random();
  let bx;
  let by;
  let bz;
  if (tendril < 0.22) {
    const reach = HEART_SCALE * (1.4 + 4.5 * Math.random() * Math.random());
    const jx = (Math.random() - 0.5) * 0.5;
    const jy = (Math.random() - 0.5) * 0.5;
    const jz = (Math.random() - 0.5) * 0.5;
    const v = new THREE.Vector3(gx + jx, gy + jy, gz + jz).normalize();
    bx = v.x * reach;
    by = v.y * reach;
    bz = v.z * reach;
  } else {
    const wob = 1 + 0.08 * (Math.random() - 0.5);
    bx = gx * HEART_SCALE * wob;
    by = gy * HEART_SCALE * wob;
    bz = gz * HEART_SCALE * wob;
  }
  blobPositions[3 * made] = bx;
  blobPositions[3 * made + 1] = by;
  blobPositions[3 * made + 2] = bz;

  noiseOffsets[3 * made] = Math.random() * Math.PI * 2;
  noiseOffsets[3 * made + 1] = Math.random() * Math.PI * 2;
  noiseOffsets[3 * made + 2] = Math.random() * Math.PI * 2;

  partColors[3 * made] = START_COLOR.r * 1.2;
  partColors[3 * made + 1] = START_COLOR.g * 1.2;
  partColors[3 * made + 2] = START_COLOR.b * 1.2;
  partSizes[made] = 0.8 + 0.2 * Math.random();
  made++;
}

const heartGeo = new THREE.BufferGeometry();
heartGeo.setAttribute("position", new THREE.BufferAttribute(blobPositions.slice(), 3));
heartGeo.setAttribute("color", new THREE.BufferAttribute(partColors.slice(), 3));
const heartMat = new THREE.PointsMaterial({
  size: isMobile ? 0.03 : 0.026,
  vertexColors: true,
  transparent: true,
  opacity: 0,
  sizeAttenuation: true,
  blending: THREE.AdditiveBlending,
  depthWrite: false,
  map: texGlow,
  alphaTest: 0.002,
});
const heart = new THREE.Points(heartGeo, heartMat);
scene.add(heart);

/* ------------------------------------------------ Chữ và ảnh bay (lớp DOM) */
const floaters = [];

function addFloater(el, data) {
  overlay.appendChild(el);
  floaters.push({ el, ...data, shown: false });
}

const texts = cfg.messages || [];
const textCount = Math.max(24, 4 * texts.length);
for (let i = 0; i < textCount; i++) {
  const size = 0.14 + 0.22 * Math.random();
  const el = document.createElement("div");
  el.className = "fl fl-text";
  el.textContent = texts[i % texts.length];
  el.style.color = cfg.textColor;
  el.style.fontSize = `${isMobile ? 25 : 150 * size}px`;
  addFloater(el, {
    startX: 16 * (Math.random() - 0.5),
    startY: -10 - 6 * Math.random(),
    startZ: 26 * Math.random() - 20,
    speed: 1 + 2 * Math.random(),
    delay: (i / textCount) * 4 + 0.6 * Math.random(),
  });
}

const photos = cfg.images || [];
const photoCount = Math.max(24, Math.min(60, 2 * photos.length));
for (let i = 0; i < photoCount; i++) {
  const size = 0.21 + 0.2 * Math.random();
  const px = (isMobile ? 320 : 300) * size;
  const el = document.createElement("div");
  el.className = "fl fl-photo";
  const img = document.createElement("img");
  img.src = photos[i % photos.length];
  img.alt = "floating";
  img.dataset.photo = photos[i % photos.length];
  img.loading = "eager";
  // Ảnh chưa được tải lên (thiếu file) sẽ tự ẩn thay vì hiện ô vỡ
  img.onerror = () => {
    el.style.display = "none";
  };
  img.decoding = "sync";
  img.style.width = `${px}px`;
  img.style.height = `${px}px`;
  el.appendChild(img);
  addFloater(el, {
    startX: 16 * (Math.random() - 0.5),
    startY: -10 - 6 * Math.random(),
    startZ: 26 * Math.random() - 20,
    speed: 1 + 0.8 * Math.random(),
    delay: (i / photoCount) * 4 + 0.6 * Math.random(),
  });
}

const projected = new THREE.Vector3();
function updateFloaters(t) {
  const w = window.innerWidth;
  const h = window.innerHeight;
  const vFOV = (camera.fov * Math.PI) / 180;
  for (const f of floaters) {
    const age = t - f.delay;
    if (age < 0) {
      if (f.shown) {
        f.el.style.opacity = "0";
        f.shown = false;
      }
      continue;
    }
    const y = f.startY + ((age * f.speed) % 20);
    const fade = Math.min(1, (y - f.startY) / 2) * Math.min(1, (f.startY + 20 - y) / 2) * 0.7;
    projected.set(f.startX, y, f.startZ);
    const dist = camera.position.distanceTo(projected);
    projected.project(camera);
    if (projected.z > 1) {
      f.el.style.opacity = "0";
      continue;
    }
    const scale = (5 / (2 * Math.tan(vFOV / 2) * dist)) * 3.0;
    const sx = (projected.x * 0.5 + 0.5) * w;
    const sy = (-projected.y * 0.5 + 0.5) * h;
    f.el.style.transform = `translate(-50%, -50%) translate(${sx}px, ${sy}px) scale(${scale})`;
    f.el.style.opacity = String(fade);
    f.shown = true;
  }
}

/* ---------------------------------------------------------- Vòng đời cảnh */
const RISE = 2.5;
const MORPH = 2;
const COLOR_CHANGE = 1;
const HEARTBEAT = 1.5;
const START_Y = -3;
const TARGET_Y = 0;

let state = "forming"; // forming → ready → opening → open
let clockStart = null;
let morphStart = null;
let colorStart = null;
let openStart = null;
let colorProgress = 0;

const easeInOutQuad = (x) => (x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2);
const clamp01 = (x) => (x < 0 ? 0 : x > 1 ? 1 : x);
const swirl = (x, y, z, t) =>
  0.25 *
  (Math.sin(2.5 * x + 1.2 * t) * Math.cos(2.3 * y + 0.8 * t) +
    Math.sin(2.7 * y + t) * Math.cos(2.1 * z + 1.4 * t) +
    Math.sin(2.9 * z + 0.9 * t) * Math.cos(2.4 * x + 1.1 * t) +
    Math.sin(1.8 * (x + y) + 1.3 * t) * Math.cos(1.6 * (y + z) + 0.7 * t));

const heartPos = heartGeo.getAttribute("position");
const heartCol = heartGeo.getAttribute("color");

function updateHeart(t) {
  if (clockStart === null) clockStart = t;
  const age = t - clockStart;

  // 1. Bay lên
  const rise = Math.min(age / RISE, 1);
  const riseEase = 1 - Math.pow(1 - rise, 3);
  heartMat.opacity = 0.85 * Math.min(age / 0.8, 1);
  heart.position.y = START_Y + (TARGET_Y - START_Y) * riseEase;
  if (rise >= 1 && morphStart === null) morphStart = t;

  // 2. Biến hình từ khối mây thành trái tim
  let morph = 0;
  if (morphStart !== null) morph = Math.min((t - morphStart) / MORPH, 1);
  const m = easeInOutQuad(morph);
  if (morph >= 1 && colorStart === null) {
    colorStart = t;
    if (state === "forming") setState("ready");
  }

  // 3. Đổi màu vàng ấm → đỏ rực
  colorProgress = colorStart === null ? 0 : clamp01((t - colorStart) / COLOR_CHANGE);

  const chaos = 1 - m;
  const settle = Math.max(0, 1 - 0.7 * rise);

  // Nhịp đập
  const beatBase = 1 + 0.03 * Math.sin(t * HEARTBEAT * 0.8);
  const beat = colorProgress > 0.4 ? 1 + 0.035 * Math.sin(t * 5.2) * Math.sin(t * 5.2) : 1;
  const sx = beatBase * beat;
  const sy = (1 + 0.04 * Math.cos(t * HEARTBEAT * 0.7 + 1.5)) * beat;
  const sz = 1 + 0.025 * Math.sin(t * HEARTBEAT * 0.9 + 0.8);

  // Khi mở thư trái tim nở ra rồi khép lại
  let bloomOut = 0;
  if (openStart !== null) {
    const o = clamp01((t - openStart) / 0.9);
    bloomOut = state === "open" || state === "opening" ? easeInOutQuad(o) * 0.55 : 0;
  }

  const arr = heartPos.array;
  for (let i = 0; i < COUNT; i++) {
    const bx = blobPositions[3 * i];
    const by = blobPositions[3 * i + 1];
    const bz = blobPositions[3 * i + 2];
    const hx = heartPositions[3 * i];
    const hy = heartPositions[3 * i + 1];
    const hz = heartPositions[3 * i + 2];
    const n0 = noiseOffsets[3 * i];
    const n1 = noiseOffsets[3 * i + 1];
    const n2 = noiseOffsets[3 * i + 2];

    let px = bx;
    let py = by;
    let pz = bz;

    const len = Math.sqrt(bx * bx + by * by + bz * bz) || 0.0001;
    const ux = bx / len;
    const uy = by / len;
    const uz = bz / len;
    const nsum = n0 + n1;

    if (morph < 1) {
      if (len > 3.45 * (HEART_SCALE / 1.5)) {
        // Các tua sáng vươn dài, uốn lượn mạnh
        const amp = 0.6 + 0.3 * (len - 3);
        const a = Math.sin(3.5 * t + nsum) * amp;
        const b = Math.sin(3.5 * t * 0.7 + 1.5 * nsum + Math.PI) * amp * 0.4;
        const twist = 2.5 * t + n2;
        const ring = 0.35 * (1 + 0.2 * (len - 3));
        px += ux * (a + b) - uy * Math.sin(twist) * ring + 0.1 * Math.sin(6 * t + 0.1 * i);
        py += uy * (a + b) + ux * Math.sin(twist) * ring + 0.1 * Math.cos(6 * t * 1.1 + 0.15 * i);
        pz += uz * (a + b) * 0.6 + Math.cos(0.7 * twist) * ring * 0.8;
      } else {
        // Khối mây thở phập phồng
        const pulse = 0.35 * Math.sin(2 * t);
        const pulse2 = 0.35 * Math.sin(2 * t * 1.7 + 0.5 * Math.PI) * 0.4;
        const ripple =
          0.15 * Math.sin(3.5 * t + 4.5 * ux + 4.5 * uy * 0.7) +
          0.1 * Math.sin(3.5 * t * 1.3 - 4.5 * uy * 1.2 + 4.5 * uz) +
          0.08 * Math.cos(3.5 * t * 0.8 + 4.5 * uz * 1.5);
        const swirlA = 1.2 * t + 0.5 * nsum;
        const swirlB = 0.9 * t + n2;
        const swirlC = 0.7 * t + 0.8 * n0;
        const total = pulse + pulse2 + ripple;
        px += ux * total - uz * Math.sin(swirlA) * 0.25 + uz * Math.sin(swirlB) * 0.18;
        py += uy * total - uy * Math.sin(swirlB) * 0.18 + uy * Math.sin(swirlC) * 0.12;
        pz += uz * total + ux * Math.sin(swirlA) * 0.25 - ux * Math.sin(swirlC) * 0.12;
        px += 0.08 * Math.sin(6 * t + 0.05 * i);
        py += 0.08 * Math.cos(5.5 * t + 0.07 * i);
        pz += 0.08 * Math.sin(5.8 * t + 0.06 * i);
      }
    }

    px *= sx;
    py *= sy;
    pz *= sz;

    const noise = 0.05 * swirl(n0, n1, n2, 1.5 * t) * chaos * settle;
    px += noise;
    py += 0.8 * noise;
    pz += 0.9 * noise;

    // Trộn về hình trái tim
    let fx = px + (hx - px) * m;
    let fy = py + (hy - py) * m;
    let fz = pz + (hz - pz) * m;

    if (bloomOut > 0) {
      const breath = 1 + bloomOut * (0.12 + 0.08 * Math.sin(2.4 * t + n0));
      fx *= breath;
      fy *= breath;
      fz *= breath;
    }

    arr[3 * i] = fx;
    arr[3 * i + 1] = fy;
    arr[3 * i + 2] = fz;
  }
  heartPos.needsUpdate = true;

  // Màu hạt
  const cArr = heartCol.array;
  const cp = colorProgress;
  const flash = cp > 0 && cp < 1 ? 1 + 1.6 * Math.sin(Math.PI * cp) : 1;
  const rr = (START_COLOR.r + (FINAL_COLOR.r - START_COLOR.r) * cp) * flash;
  const gg = (START_COLOR.g + (FINAL_COLOR.g - START_COLOR.g) * cp) * flash;
  const bb = (START_COLOR.b + (FINAL_COLOR.b - START_COLOR.b) * cp) * flash;
  for (let i = 0; i < COUNT; i++) {
    const s = partSizes[i];
    cArr[3 * i] = rr * s;
    cArr[3 * i + 1] = gg * s;
    cArr[3 * i + 2] = bb * s;
  }
  heartCol.needsUpdate = true;

  bloom.strength = (isMobile ? 1.3 : 1.7) * (1 + 0.5 * (flash - 1));
}

/* ---------------------------------------------------- Cập nhật nền bầu trời */
function updateSky(t, dt) {
  if (pinkSky) {
    pinkSky.rotation.z = 0.012 * Math.sin(t * 0.12);
    pinkSky.position.y = 0.12 * Math.sin(t * 0.22);
    pinkSky.material.opacity = 0.48 + 0.08 * Math.sin(t * 0.45);
  }

  if (pinkGlow) {
    const pulse = 1 + 0.06 * Math.sin(t * 0.7);
    pinkGlow.scale.set((isMobile ? 10 : 14) * pulse, (isMobile ? 3.4 : 4.4) * pulse, 1);
    pinkGlow.material.opacity = 0.18 + 0.05 * Math.sin(t * 0.55);
  }

  if (stars) {
    const { count, twinkle, base } = stars.userData;
    stars.material.opacity = Math.min(t / 3, 1);
    const col = stars.geometry.getAttribute("color");
    for (let i = 0; i < count; i++) {
      const b = base[i] * (0.8 + 0.35 * Math.sin(t * twinkle[2 * i + 1] + twinkle[2 * i]));
      col.setXYZ(i, b, b * 0.94, b * 0.88);
    }
    col.needsUpdate = true;
    stars.rotation.y = t * 0.005;
  }

  if (drift) {
    const { count, seed } = drift.userData;
    const p = drift.geometry.getAttribute("position");
    for (let i = 0; i < count; i++) {
      const s = seed[i];
      let y = p.getY(i) + s.speed * dt;
      if (y > 14) y = -8;
      p.setY(i, y);
      p.setX(i, p.getX(i) + Math.sin(t * 0.3 + s.phase) * 0.004);
    }
    p.needsUpdate = true;
  }

  if (snow) {
    const { count, flakes } = snow.userData;
    const p = snow.geometry.getAttribute("position");
    for (let i = 0; i < count; i++) {
      const f = flakes[i];
      f.y -= f.speed * dt;
      if (f.y < -6) f.y = 12;
      p.setXYZ(i, f.x + Math.sin(t * f.wobble * 2 + f.phase) * 0.5, f.y, f.z);
    }
    p.needsUpdate = true;
    const c = new THREE.Color(1, 0.92, 0.95).lerp(HEART_COLOR, colorProgress * 0.7);
    snow.material.color.copy(c);
  }

  if (minis) {
    const { count, items, color } = minis.userData;
    minis.material.opacity = Math.min(Math.max(0, t - 1) / 2, 1) * 0.9;
    const p = minis.geometry.getAttribute("position");
    const sz = minis.geometry.getAttribute("size");
    const cl = minis.geometry.getAttribute("color");
    for (let i = 0; i < count; i++) {
      const it = items[i];
      const age = t - 1 - it.spawn;
      if (age < 0) {
        sz.setX(i, 0);
        cl.setXYZ(i, 0, 0, 0);
        continue;
      }
      if (age > it.lifetime) {
        it.spawn = t - 1 + 0.5 * Math.random();
        const a = Math.random() * Math.PI * 2;
        const r = Math.sqrt(Math.random()) * 8;
        it.x = Math.cos(a) * r;
        it.z = Math.sin(a) * r;
        it.lifetime = 4 + 6 * Math.random();
        continue;
      }
      let alpha = 1;
      if (age < it.fadeIn) alpha = age / it.fadeIn;
      else if (age > it.lifetime - it.fadeOut) alpha = (it.lifetime - age) / it.fadeOut;
      alpha = Math.max(0, Math.min(1.5, alpha));
      const y = it.baseY + age * it.speed;
      const wx = Math.sin(age * it.wobbleSpeed + it.phase) * it.wobbleAmount;
      const wz = Math.cos(age * it.wobbleSpeed * 0.7 + it.phase) * it.wobbleAmount * 0.6;
      p.setXYZ(i, it.x + wx, y, it.z + wz);
      sz.setX(i, it.size * alpha);
      const k = alpha * 2.2 * (0.7 - 0.3 * colorProgress);
      cl.setXYZ(i, color.r * k, color.g * k, color.b * k);
    }
    p.needsUpdate = true;
    sz.needsUpdate = true;
    cl.needsUpdate = true;
  }

  for (const s of shooters) {
    if (s.life <= 0) {
      s.next -= dt;
      if (s.next <= 0) {
        s.dur = 0.7 + 0.5 * Math.random();
        s.life = s.dur;
        const a = Math.random() * Math.PI * 2;
        s.from.set(Math.cos(a) * 30, 12 + 10 * Math.random(), Math.sin(a) * 30 - 10);
        s.dir.set(-Math.cos(a) * 0.6 - 0.4, -0.7 - 0.4 * Math.random(), 0.2).normalize();
      }
      s.line.material.opacity = 0;
      continue;
    }
    s.life -= dt;
    const k = 1 - s.life / s.dur;
    const head = s.from.clone().addScaledVector(s.dir, 34 * k);
    const tail = head.clone().addScaledVector(s.dir, -4);
    const p = s.line.geometry.getAttribute("position");
    p.setXYZ(0, tail.x, tail.y, tail.z);
    p.setXYZ(1, head.x, head.y, head.z);
    p.needsUpdate = true;
    s.line.material.opacity = Math.sin(Math.PI * k) * 0.9;
    if (s.life <= 0) s.next = 3 + 7 * Math.random();
  }

  if (fireworks) {
    fireworks.next -= dt;
    if (fireworks.next <= 0 && fireworks.parts.length < fireworks.max - 90) {
      fireworks.next = 1.2 + 2.6 * Math.random();
      const cx = 14 * (Math.random() - 0.5);
      const cy = 3 + 6 * Math.random();
      const cz = -6 - 12 * Math.random();
      const hue = new THREE.Color().setHSL(0.92 + 0.12 * Math.random(), 0.85, 0.6);
      const n = 60 + Math.floor(30 * Math.random());
      for (let i = 0; i < n; i++) {
        const th = Math.random() * Math.PI * 2;
        const ph = Math.acos(2 * Math.random() - 1);
        const sp = 1.6 + 2.4 * Math.random();
        fireworks.parts.push({
          x: cx,
          y: cy,
          z: cz,
          vx: Math.sin(ph) * Math.cos(th) * sp,
          vy: Math.sin(ph) * Math.sin(th) * sp,
          vz: Math.cos(ph) * sp,
          life: 1,
          decay: 0.5 + 0.5 * Math.random(),
          color: hue,
        });
      }
    }
    const p = fireworks.points.geometry.getAttribute("position");
    const c = fireworks.points.geometry.getAttribute("color");
    let idx = 0;
    for (const part of fireworks.parts) {
      part.life -= dt * part.decay;
      part.x += part.vx * dt;
      part.y += part.vy * dt - 0.55 * dt * dt * 9;
      part.z += part.vz * dt;
      part.vy -= 1.2 * dt;
      if (part.life <= 0 || idx >= fireworks.max) continue;
      p.setXYZ(idx, part.x, part.y, part.z);
      const k = Math.max(0, part.life) * 2.2;
      c.setXYZ(idx, part.color.r * k, part.color.g * k, part.color.b * k);
      idx++;
    }
    for (let i = idx; i < fireworks.max; i++) {
      p.setXYZ(i, 0, -999, 0);
      c.setXYZ(i, 0, 0, 0);
    }
    fireworks.parts = fireworks.parts.filter((x) => x.life > 0);
    p.needsUpdate = true;
    c.needsUpdate = true;
  }
}

/* ------------------------------------------------------------- Trạng thái */
const hintEl = document.getElementById("hint");
if (cfg.letter && cfg.letter.hint) hintEl.textContent = cfg.letter.hint;

function setState(next) {
  state = next;
  hintEl.hidden = !(state === "ready" && cfg.letter && cfg.letter.hint);
}

/* ------------------------------------------------------------------ Lá thư */
const letterRoot = document.getElementById("letterRoot");
const photoRoot = document.getElementById("photoRoot");

function splitGraphemes(word) {
  if (typeof Intl !== "undefined" && Intl.Segmenter) {
    return Array.from(new Intl.Segmenter("vi", { granularity: "grapheme" }).segment(word), (s) => s.segment);
  }
  return Array.from(word);
}

function openLetter() {
  const letter = cfg.letter;
  if (!letter) return;
  let delay = letter.photo ? 1.2 : 0.45;

  const row = (text, cls) => {
    const div = document.createElement("div");
    div.className = `ll-row ll-${cls}`;
    text.split(" ").forEach((word, wi) => {
      if (wi > 0) {
        div.appendChild(document.createTextNode(" "));
        delay += 0.02;
      }
      if (!word) return;
      const span = document.createElement("span");
      span.className = "ll-word";
      splitGraphemes(word).forEach((ch) => {
        const s = document.createElement("span");
        s.className = "ll-ch";
        s.style.animationDelay = `${delay}s`;
        s.textContent = ch;
        span.appendChild(s);
        delay += 0.032;
      });
      div.appendChild(span);
    });
    delay += 0.064;
    return div;
  };

  const root = document.createElement("div");
  root.className = "ll-root";
  root.setAttribute("aria-live", "polite");

  const card = document.createElement("div");
  card.className = "ll-card";

  const x = document.createElement("button");
  x.type = "button";
  x.className = "ll-x";
  x.setAttribute("aria-label", "Đóng thư");
  x.textContent = "✕";
  x.addEventListener("click", closeLetter);
  card.appendChild(x);

  if (letter.photo) {
    const fig = document.createElement("figure");
    fig.className = "ll-photo";
    const img = document.createElement("img");
    img.src = letter.photo;
    img.alt = letter.photoCaption || "Kỷ niệm của chúng mình";
    fig.appendChild(img);
    if (letter.photoCaption) {
      const cap = document.createElement("figcaption");
      cap.textContent = letter.photoCaption;
      fig.appendChild(cap);
    }
    card.appendChild(fig);
  }

  if (letter.greeting) card.appendChild(row(letter.greeting, "greeting"));
  (letter.lines || []).forEach((line) => {
    if (!line) {
      delay += 0.36;
      const sp = document.createElement("div");
      sp.className = "ll-space";
      card.appendChild(sp);
      return;
    }
    card.appendChild(row(line, "line"));
  });
  if (letter.signature) card.appendChild(row(letter.signature, "signature"));

  const close = document.createElement("button");
  close.type = "button";
  close.className = "ll-close";
  close.style.animationDelay = `${delay + 0.5}s`;
  close.textContent = "Khép thư 🤍";
  close.addEventListener("click", closeLetter);
  card.appendChild(close);

  let down = null;
  root.addEventListener("pointerdown", (e) => {
    down = e.target === e.currentTarget ? { x: e.clientX, y: e.clientY } : null;
  });
  root.addEventListener("pointerup", (e) => {
    const d = down;
    down = null;
    if (d && e.target === e.currentTarget && Math.hypot(e.clientX - d.x, e.clientY - d.y) < 8) closeLetter();
  });

  root.appendChild(card);
  letterRoot.appendChild(root);
  setState("open");
}

function closeLetter() {
  letterRoot.innerHTML = "";
  openStart = null;
  setState("ready");
}

/* -------------------------------------------------------- Xem ảnh phóng to */
function openPhoto(src) {
  const root = document.createElement("div");
  root.className = "pl-root";
  const frame = document.createElement("div");
  frame.className = "pl-frame";
  const x = document.createElement("button");
  x.type = "button";
  x.className = "pl-x";
  x.setAttribute("aria-label", "Đóng ảnh");
  x.textContent = "✕";
  x.addEventListener("click", closePhoto);
  const img = document.createElement("img");
  img.src = src;
  img.alt = "Kỷ niệm của chúng mình";
  frame.append(x, img);

  let down = null;
  root.addEventListener("pointerdown", (e) => {
    down = e.target === e.currentTarget ? { x: e.clientX, y: e.clientY } : null;
  });
  root.addEventListener("pointerup", (e) => {
    const d = down;
    down = null;
    if (d && e.target === e.currentTarget && Math.hypot(e.clientX - d.x, e.clientY - d.y) < 8) closePhoto();
  });

  root.appendChild(frame);
  photoRoot.appendChild(root);
}

function closePhoto() {
  photoRoot.innerHTML = "";
}

document.addEventListener("keydown", (e) => {
  if (e.key !== "Escape") return;
  if (photoRoot.firstChild) closePhoto();
  else if (letterRoot.firstChild) closeLetter();
});

/* --------------------------------------------- Chạm: mở ảnh hoặc mở lá thư */
let pointerDown = null;
stage.addEventListener("pointerdown", (e) => {
  pointerDown = { x: e.clientX, y: e.clientY };
});
stage.addEventListener("pointerup", (e) => {
  const d = pointerDown;
  pointerDown = null;
  if (!d || Math.hypot(e.clientX - d.x, e.clientY - d.y) >= 8) return;
  if (photoRoot.firstChild || letterRoot.firstChild) return;
  const target = e.target.closest && e.target.closest("[data-photo]");
  if (target) {
    openPhoto(target.dataset.photo);
    return;
  }
  if (state === "ready") {
    setState("opening");
    openStart = clock.getElapsedTime();
    window.setTimeout(openLetter, reduceMotion ? 0 : 600);
  }
});

/* ------------------------------------------------------------------- Nhạc */
const __parentMusic =
  /[?&]music=parent/.test(location.search) &&
  window.parent &&
  window.parent.__hbHeartAudio
    ? window.parent.__hbHeartAudio
    : null;
const audio = __parentMusic || document.getElementById("music");
const musicBtn = document.getElementById("musicBtn");
const musicSlash = document.getElementById("musicSlash");
if (!__parentMusic && cfg.music) audio.querySelector("source").src = cfg.music;
let userPaused = false;

function syncMusicButton() {
  const on = !audio.paused;
  musicBtn.classList.toggle("is-on", on);
  musicBtn.setAttribute("aria-pressed", String(on));
  musicBtn.setAttribute("aria-label", on ? "Tắt nhạc" : "Bật nhạc");
  musicSlash.style.display = on ? "none" : "";
}
audio.addEventListener("play", syncMusicButton);
audio.addEventListener("pause", syncMusicButton);
syncMusicButton();

const tryPlay = () => {
  if (!userPaused && audio.paused) audio.play().catch(() => {});
};
tryPlay();
["pointerdown", "touchstart", "keydown", "wheel"].forEach((ev) =>
  window.addEventListener(ev, tryPlay, { capture: true, passive: true }),
);

musicBtn.addEventListener("pointerdown", (e) => e.stopPropagation());
musicBtn.addEventListener("pointerup", (e) => {
  e.stopPropagation();
  if (audio.paused) {
    userPaused = false;
    audio.play().catch(() => {});
  } else {
    userPaused = true;
    audio.pause();
  }
});

/* ------------------------------------------------------------ Vòng lặp vẽ */
const clock = new THREE.Clock();
let last = 0;

let framesRendered = 0;

function animate() {
  requestAnimationFrame(animate);
  const t = clock.getElapsedTime();
  const dt = Math.min(t - last, 0.05);
  last = t;

  updateHeart(t);
  updateSky(t, dt);
  updateFloaters(t);
  controls.update();
  composer.render();

  // Báo cho trang cha biết trái tim đã vẽ xong khung đầu tiên, để nó mới
  // hiện màn này lên (tránh hiện lúc scene còn đang dựng gây cảm giác lag).
  framesRendered++;
  if (framesRendered === 2) {
    try {
      parent.postMessage({ type: "lovegift:heartReady" }, "*");
    } catch (_) {}
  }
}
animate();


/* ------------------------------------------------------------- Đổi kích thước */
window.addEventListener("resize", () => {
  const w = window.innerWidth;
  const h = window.innerHeight;
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
  renderer.setSize(w, h);
  composer.setSize(w, h);
});
