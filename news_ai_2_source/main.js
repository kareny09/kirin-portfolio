import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

await Promise.all(['900', '800', '700'].map(w => document.fonts.load(w + ' 40px P', '가나다AI')));
const CUES = await (await fetch('cues.json')).json();
const C = CUES.cues.map(c => c[0]);
const DUR = CUES.dur;
const W = 1080, H = 1920;
const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
const lerp = (a, b, t) => a + (b - a) * t;
const P = (t, a, b) => clamp((t - a) / (b - a));
const io = t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
const oB = t => { const c1 = 1.7, c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); };
const hash = n => { const s = Math.sin(n * 127.1) * 43758.5453; return s - Math.floor(s); };
const sc = v => Math.max(.0005, v);

// ---------- renderer ----------
const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
renderer.setPixelRatio(1); renderer.setSize(W, H);
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.1;
document.body.prepend(renderer.domElement);
const scene = new THREE.Scene();
scene.background = new THREE.Color('#06080c');
scene.fog = new THREE.Fog('#06080c', 14, 30);
const camera = new THREE.PerspectiveCamera(30, W / H, 0.1, 200);
scene.add(camera);
scene.add(new THREE.HemisphereLight('#9fb4d8', '#0a0c10', .55));
const key = new THREE.DirectionalLight('#ffffff', 2.2); key.position.set(-4, 9, 7); key.castShadow = true;
key.shadow.mapSize.set(1024, 1024); Object.assign(key.shadow.camera, { left: -6, right: 6, top: 8, bottom: -2, far: 30 }); key.shadow.radius = 6; key.shadow.bias = -.0005;
scene.add(key);
const rim = new THREE.DirectionalLight('#4aa3ff', 1.6); rim.position.set(3, 5, -6); scene.add(rim);
const fillL = new THREE.PointLight('#ff9a4a', 6, 12); fillL.position.set(-3, 2, 3); scene.add(fillL);

const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));
composer.addPass(new UnrealBloomPass(new THREE.Vector2(W / 2, H / 2), 0.5, 0.45, 0.82));
composer.addPass(new OutputPass());

// floor + grid + dust
const floor = new THREE.Mesh(new THREE.PlaneGeometry(60, 60), new THREE.MeshStandardMaterial({ color: '#0b0e14', roughness: .9 }));
floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true; scene.add(floor);
const grid = new THREE.GridHelper(60, 60, '#1a2233', '#121825'); grid.position.y = .005; scene.add(grid);
const dustG = new THREE.BufferGeometry(); const dN = 160; const dp = new Float32Array(dN * 3);
for (let i = 0; i < dN; i++) { dp[i * 3] = (hash(i) - .5) * 10; dp[i * 3 + 1] = hash(i + 50) * 7; dp[i * 3 + 2] = (hash(i + 99) - .5) * 8 - 2; }
dustG.setAttribute('position', new THREE.BufferAttribute(dp, 3));
const dust = new THREE.Points(dustG, new THREE.PointsMaterial({ color: '#6f8fbf', size: .03, transparent: true, opacity: .5 })); scene.add(dust);

// ---------- helpers ----------
const mats = {};
const mat = (c, o = {}) => { const k = c + JSON.stringify(o); return mats[k] || (mats[k] = new THREE.MeshStandardMaterial({ color: c, roughness: .45, metalness: .2, ...o })); };
const glow = (c, i = 1) => new THREE.MeshBasicMaterial({ color: new THREE.Color(c).multiplyScalar(i), toneMapped: false, transparent: true });
function rb(w, h, d, m, r = .06) { const g = new THREE.Mesh(new RoundedBoxGeometry(w, h, d, 3, Math.min(r, w / 2 - .001, h / 2 - .001, d / 2 - .001)), typeof m === 'string' ? mat(m) : m); g.castShadow = true; g.receiveShadow = true; return g; }
function at(o, x, y, z = 0) { o.position.set(x, y, z); return o; }
function G(...c) { const g = new THREE.Group(); c.forEach(x => g.add(x)); return g; }
function rr(g, x, y, w, h, r) { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); }
function tex(wpx, hpx, draw) { const c = document.createElement('canvas'); c.width = wpx; c.height = hpx; const g = c.getContext('2d'); draw(g, wpx, hpx); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; t.userData = { c, g }; return t; }
function text(w, h, lines, { fg = '#ffffff', size = .4, weight = 800, bg = null, radius = .1, glowing = true, colors = null, lh = 1.2, op = 1, k = .78 } = {}) {
  const S = 220;
  const t = tex(Math.round(w * S), Math.round(h * S), (g, cw, ch) => {
    if (bg) { g.fillStyle = bg; rr(g, 0, 0, cw, ch, radius * S); g.fill(); }
    const L = Array.isArray(lines) ? lines : [lines];
    let fs = size * S; g.font = `${weight} ${fs}px P`; const mw = Math.max(...L.map(l => g.measureText(l).width)); if (mw > cw * .92) fs *= cw * .92 / mw;
    g.font = `${weight} ${fs}px P`; g.textAlign = 'center'; g.textBaseline = 'middle';
    L.forEach((l, i) => { g.fillStyle = colors ? colors[i] : fg; g.fillText(l, cw / 2, ch / 2 + (i - (L.length - 1) / 2) * fs * lh); });
  });
  const m = glowing ? new THREE.MeshBasicMaterial({ map: t, color: new THREE.Color(k, k, k), transparent: true, toneMapped: false, opacity: op, depthWrite: false }) : new THREE.MeshStandardMaterial({ map: t, transparent: true, roughness: .6 });
  return new THREE.Mesh(new THREE.PlaneGeometry(w, h), m);
}
// leader-line label (anchor at group origin, text above)
function label(str, { h = .55, color = '#cfe3ff', side = 0, size = .2 } = {}) {
  const g = new THREE.Group();
  const dot = new THREE.Mesh(new THREE.SphereGeometry(.03, 10, 8), glow(color)); g.add(dot);
  const line = new THREE.Mesh(new THREE.BoxGeometry(.012, h, .012), glow(color, .8)); line.position.y = h / 2; g.add(line);
  const tp = text(1.6, .34, str, { fg: color, size, weight: 700 }); tp.position.set(side * .5, h + .17, 0); g.add(tp);
  g.userData.parts = [dot, line, tp]; return g;
}
function setOpacity(o, a) { o.traverse(m => { if (m.material) { m.material.transparent = true; m.material.opacity = a * (m.userData.baseOp ?? 1); } }); o.visible = a > .01; }
function slab(w, h, lines, { glass = '#121a28', edge = '#2E8BFF', fg = '#ffffff', size = .5, colors = null } = {}) {
  const g = new THREE.Group();
  g.add(rb(w, h, .12, new THREE.MeshStandardMaterial({ color: glass, roughness: .25, metalness: .5 }), .1));
  const e = new THREE.Mesh(new THREE.BoxGeometry(w + .04, h + .04, .02), glow(edge, 1.2)); e.position.z = -.05; g.add(e);
  const tp = text(w * .94, h * .9, lines, { fg, size, colors }); tp.position.z = .07; g.add(tp);
  return g;
}
function stamp(w, h, str, color = '#E5484D') {
  const g = new THREE.Group();
  const t = text(w, h, str, { fg: color, size: .5, weight: 900 });
  const border = new THREE.Mesh(new THREE.RingGeometry(0, 0, 4), glow(color));
  const fr = tex(400, Math.round(400 * h / w), (gg, cw, ch) => { gg.strokeStyle = color; gg.lineWidth = 18; rr(gg, 12, 12, cw - 24, ch - 24, 30); gg.stroke(); });
  const fm = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: fr, transparent: true, toneMapped: false, depthWrite: false }));
  const plate = new THREE.Mesh(new THREE.PlaneGeometry(w * .97, h * .94), new THREE.MeshBasicMaterial({ color: '#0b0f17', transparent: true, depthWrite: false })); plate.position.z = -.01;
  g.add(plate, fm, t); return g;
}
function ringSign(str, color = '#5ab8ff', r = .55) {
  const g = new THREE.Group();
  const ring = new THREE.Mesh(new THREE.TorusGeometry(r, .045, 12, 64), glow(color, 1.4));
  const disc = new THREE.Mesh(new THREE.CircleGeometry(r - .02, 48), new THREE.MeshStandardMaterial({ color: '#0d1420', roughness: .4, metalness: .3 }));
  const tp = text(r * 1.8, r * .9, str, { size: .34 * r / .55, weight: 900 }); tp.position.z = .02;
  g.add(disc, ring, tp); g.userData = { ring, tp }; return g;
}
// camera module (lens faces +z)
function camModule(s = 1) {
  const g = new THREE.Group();
  g.add(rb(.7, .7, .45, mat('#1c222d', { metalness: .6, roughness: .35 }), .1));
  const barrel = new THREE.Mesh(new THREE.CylinderGeometry(.2, .22, .14, 32), mat('#0c0f14', { metalness: .8, roughness: .2 })); barrel.rotation.x = Math.PI / 2; barrel.position.z = .27; g.add(barrel);
  const lens = new THREE.Mesh(new THREE.SphereGeometry(.15, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2), new THREE.MeshStandardMaterial({ color: '#1a3a7a', metalness: .9, roughness: .05, emissive: '#16306b', emissiveIntensity: .6 })); lens.rotation.x = Math.PI / 2; lens.position.z = .33; g.add(lens);
  const ringL = new THREE.Mesh(new THREE.TorusGeometry(.2, .012, 8, 40), glow('#5ab8ff', 1.2)); ringL.position.z = .345; g.add(ringL);
  g.scale.setScalar(s); g.userData.lensPos = new THREE.Vector3(0, 0, .36); return g;
}
function phone() {
  const g = new THREE.Group();
  g.add(rb(1.05, 2.0, .1, mat('#1a1f29', { metalness: .6, roughness: .3 }), .14));
  const scr = tex(420, 800, (gg, cw, ch) => {
    const gr = gg.createLinearGradient(0, 0, 0, ch); gr.addColorStop(0, '#0f2547'); gr.addColorStop(1, '#091426'); gg.fillStyle = gr; rr(gg, 0, 0, cw, ch, 50); gg.fill();
    gg.fillStyle = '#5ab8ff'; gg.font = '900 110px P'; gg.textAlign = 'center'; gg.fillText('AI', cw / 2, 330);
    gg.fillStyle = 'rgba(90,184,255,.35)'; [430, 500, 570].forEach((y, i) => { rr(gg, 70 + (i % 2) * 60, y, 220, 44, 22); gg.fill(); });
  });
  const s = new THREE.Mesh(new THREE.PlaneGeometry(.95, 1.88), new THREE.MeshBasicMaterial({ map: scr, toneMapped: false })); s.position.z = .056; g.add(s);
  return g;
}
function earbud(s = 1) {
  const g = new THREE.Group();
  const cap = new THREE.Mesh(new THREE.CapsuleGeometry(.16, .22, 8, 20), mat('#22262e', { metalness: .5, roughness: .3 })); cap.rotation.z = Math.PI / 2; cap.castShadow = true; g.add(cap);
  const tip = new THREE.Mesh(new THREE.SphereGeometry(.13, 20, 12), mat('#3a404c', { roughness: .8 })); tip.position.x = -.3; g.add(tip);
  const band = new THREE.Mesh(new THREE.TorusGeometry(.162, .015, 8, 30), glow('#F0761E', 1.2)); band.rotation.y = Math.PI / 2; band.position.x = .12; g.add(band);
  g.scale.setScalar(s); return g;
}
function waveRings(color = '#F0761E', n = 3) { const g = new THREE.Group(); for (let i = 0; i < n; i++) { const r = new THREE.Mesh(new THREE.TorusGeometry(1, .02, 8, 48), glow(color, 1.3)); g.add(r); } return g; }
function animRings(g, t, period = 1.2, maxR = 1.2, on = 1) { g.children.forEach((r, i) => { const k = ((t / period) + i / g.children.length) % 1; r.scale.setScalar(sc(.15 + k * maxR)); r.material.opacity = (1 - k) * on; }); }

// ---------- scene groups ----------
const S = [0, 1, 2, 3, 4, 5, 6].map(() => { const g = new THREE.Group(); scene.add(g); return g; });
const CY = 3.3; // content centre height

// S1: glasses -> camera + phone
const glasses = new THREE.Group(); S[0].add(glasses); glasses.position.set(0, CY + .3, 0);
{
  const fm = mat('#202836', { metalness: .7, roughness: .25 });
  [-.72, .72].forEach(x => {
    const rimM = new THREE.Mesh(new THREE.TorusGeometry(.55, .07, 16, 48), fm); rimM.position.x = x; rimM.castShadow = true; glasses.add(rimM);
    const edge = new THREE.Mesh(new THREE.TorusGeometry(.55, .012, 8, 64), glow('#5ab8ff', 1.1)); edge.position.set(x, 0, .07); glasses.add(edge);
    const lensM = new THREE.Mesh(new THREE.CircleGeometry(.5, 40), new THREE.MeshStandardMaterial({ color: '#4a7dff', transparent: true, opacity: .22, roughness: .05, metalness: .3 })); lensM.position.x = x; glasses.add(lensM);
    const temple = rb(.08, .08, 1.5, fm, .03); temple.position.set(x * 1.72, .1, -.72); glasses.add(temple);
  });
  const bridge = new THREE.Mesh(new THREE.TorusGeometry(.2, .05, 8, 20, Math.PI), fm); bridge.position.set(0, .12, 0); glasses.add(bridge);
}
const xMark = G(at(new THREE.Mesh(new THREE.BoxGeometry(3.0, .16, .1), glow('#ff3b47', 1.4)), 0, 0, 0), at(new THREE.Mesh(new THREE.BoxGeometry(3.0, .16, .1), glow('#ff3b47', 1.4)), 0, 0, 0));
xMark.children[0].rotation.z = .7; xMark.children[1].rotation.z = -.7; xMark.position.set(0, CY + .3, .4); S[0].add(xMark);
const lblGlasses = label('AI 안경', { color: '#ff8a8f' }); lblGlasses.position.set(1.0, CY + .85, .1); S[0].add(lblGlasses);
const cam1 = camModule(1.25); cam1.position.set(-.8, CY + .2, 0); S[0].add(cam1);
const ph1 = phone(); ph1.position.set(.85, CY + .2, 0); S[0].add(ph1);
const lblCam1 = label('초소형 카메라', { color: '#ffb27a' }); lblCam1.position.set(-.8, CY + .7, .3); S[0].add(lblCam1);
const lblPh1 = label('스마트기기', { color: '#ffb27a' }); lblPh1.position.set(.85, CY + 1.25, .3); S[0].add(lblPh1);

// S2: scale comparison
const button = new THREE.Group(); S[1].add(button);
{
  const disc = new THREE.Mesh(new THREE.CylinderGeometry(.75, .75, .16, 48), mat('#d8c3a0', { roughness: .5, metalness: .05 })); disc.rotation.x = Math.PI / 2; disc.castShadow = true; button.add(disc);
  const lip = new THREE.Mesh(new THREE.TorusGeometry(.68, .06, 12, 48), mat('#c4ad87', { roughness: .5 })); lip.position.z = .08; button.add(lip);
  [[-.17, .17], [.17, .17], [-.17, -.17], [.17, -.17]].forEach(([x, y]) => { const h = new THREE.Mesh(new THREE.CylinderGeometry(.08, .08, .2, 16), mat('#2a2219')); h.rotation.x = Math.PI / 2; h.position.set(x, y, .01); button.add(h); });
}
button.position.set(-.75, CY + 1.25, 0);
const camSmall = camModule(.42); camSmall.position.set(.85, CY + 1.05, 0); S[1].add(camSmall);
const rice = new THREE.Mesh(new THREE.SphereGeometry(.5, 32, 16), new THREE.MeshPhysicalMaterial({ color: '#f4efe4', roughness: .35, clearcoat: .6, sheen: .5 })); rice.scale.set(.5, .24, .24); rice.position.set(-.75, CY - .55, 0); rice.castShadow = true; S[1].add(rice);
const bud2 = earbud(.6); bud2.position.set(.85, CY - .55, 0); S[1].add(bud2);
const ruler = new THREE.Group(); ruler.position.set(0, CY + .2, 0); S[1].add(ruler);
{
  const rt = tex(1600, 160, (g, cw, ch) => { g.fillStyle = '#e9edf5'; rr(g, 0, 0, cw, ch, 20); g.fill(); g.fillStyle = '#1b2230'; for (let i = 0; i <= 60; i++) { const x = 40 + i * (cw - 80) / 60; const L = i % 10 === 0 ? 70 : (i % 5 === 0 ? 50 : 30); g.fillRect(x - 2, 0, 4, L); if (i % 10 === 0) { g.font = '700 40px P'; g.textAlign = 'center'; g.fillText(String(i / 10), x, 125); } } g.font = '800 34px P'; g.textAlign = 'right'; g.fillText('cm', cw - 30, 125); });
  const r = rb(3.2, .32, .06, new THREE.MeshStandardMaterial({ map: rt, roughness: .5 }), .03); ruler.add(r);
}
const lblBtn = label('단추', { color: '#cfe3ff', h: .3 }); lblBtn.position.set(-.75, CY + 1.95, .1); S[1].add(lblBtn);
const lblCam2 = label('카메라', { color: '#ffb27a' }); lblCam2.position.set(.85, CY + 1.4, .1); S[1].add(lblCam2);
const lblRice = label('쌀알', { color: '#cfe3ff' }); lblRice.position.set(-.75, CY - .7, .1); lblRice.rotation.z = Math.PI; lblRice.userData.parts[2].rotation.z = Math.PI; S[1].add(lblRice);
const lblBud = label('이어폰', { color: '#ffb27a' }); lblBud.position.set(.85, CY - .72, .1); lblBud.rotation.z = Math.PI; lblBud.userData.parts[2].rotation.z = Math.PI; S[1].add(lblBud);

// S3: principle flow
const N1 = new THREE.Vector3(-.75, CY + 1.25, 0), N2 = new THREE.Vector3(.75, CY + .15, 0), N3 = new THREE.Vector3(-.65, CY - .95, 0);
const cam3 = camModule(.9); cam3.position.copy(N1); cam3.rotation.y = .5; S[2].add(cam3);
const chip = new THREE.Group(); chip.position.copy(N2); S[2].add(chip);
{
  chip.add(rb(.95, .95, .16, mat('#141a24', { metalness: .7, roughness: .3 }), .08));
  for (let i = 0; i < 5; i++) for (const s of [-1, 1]) { const pin = rb(.05, .16, .05, mat('#c9a14a', { metalness: .9, roughness: .3 }), .02); pin.position.set(-.36 + i * .18, s * .55, 0); chip.add(pin); const pin2 = pin.clone(); pin2.rotation.z = Math.PI / 2; pin2.position.set(s * .55, -.36 + i * .18, 0); chip.add(pin2); }
  const core = text(.7, .7, 'AI', { fg: '#7fd0ff', size: .42, weight: 900 }); core.position.z = .09; chip.add(core); chip.userData.core = core;
  const halo = new THREE.Mesh(new THREE.PlaneGeometry(1.0, 1.0), glow('#2E8BFF', .6)); halo.position.z = .085; halo.material.opacity = 0; chip.add(halo); chip.userData.halo = halo;
}
const bud3 = earbud(1.1); bud3.position.copy(N3); S[2].add(bud3);
const rings3 = waveRings('#F0761E', 3); rings3.position.copy(N3).add(new THREE.Vector3(-.35, 0, 0)); rings3.rotation.y = Math.PI / 2; rings3.scale.setScalar(.6); S[2].add(rings3);
const doc = new THREE.Group(); S[2].add(doc); doc.position.set(.75, CY + 1.55, -.2);
{ const dt = tex(300, 380, (g, cw, ch) => { g.fillStyle = '#f2f4f8'; rr(g, 0, 0, cw, ch, 20); g.fill(); g.fillStyle = '#1b2230'; g.font = '900 52px P'; g.fillText('문제', 28, 72); g.fillStyle = '#9aa6bb'; for (let i = 0; i < 6; i++) g.fillRect(28, 110 + i * 42, 220 - (i % 3) * 40, 14); });
  doc.add(rb(.66, .84, .03, new THREE.MeshStandardMaterial({ map: dt, roughness: .7 }), .02)); }
const curve = new THREE.CatmullRomCurve3([N1.clone().add(new THREE.Vector3(.25, -.3, 0)), new THREE.Vector3(.1, CY + .9, .2), N2.clone().add(new THREE.Vector3(-.4, .25, 0)), N2.clone().add(new THREE.Vector3(-.3, -.4, 0)), new THREE.Vector3(-.2, CY - .55, .2), N3.clone().add(new THREE.Vector3(.35, .15, 0))]);
const tube = new THREE.Mesh(new THREE.TubeGeometry(curve, 120, .075, 12), new THREE.MeshPhysicalMaterial({ color: '#cfe3ff', transparent: true, opacity: .16, roughness: .05, transmission: .6 })); S[2].add(tube);
const beads = []; for (let i = 0; i < 22; i++) { const b = new THREE.Mesh(new THREE.SphereGeometry(.055, 12, 8), glow('#bfe4ff', 1.6)); S[2].add(b); beads.push(b); }
const lblN1 = label('① 보고', { color: '#ffb27a', h: .4 }); lblN1.position.copy(N1).add(new THREE.Vector3(-.35, .4, .2)); S[2].add(lblN1);
const lblN2 = label('② 풀고', { color: '#7fd0ff', h: .4 }); lblN2.position.copy(N2).add(new THREE.Vector3(.3, .55, .2)); S[2].add(lblN2);
const lblN3 = label('③ 속삭이고', { color: '#ffb27a', h: .4 }); lblN3.position.copy(N3).add(new THREE.Vector3(.2, .3, .2)); S[2].add(lblN3);
const scanBeam = new THREE.Mesh(new THREE.ConeGeometry(.35, 1.1, 24, 1, true), glow('#5ab8ff', .7)); scanBeam.material.side = THREE.DoubleSide; S[2].add(scanBeam);

// S4: the eye
const eye = new THREE.Group(); eye.position.set(-.85, CY + 1.25, 0); S[3].add(eye);
{
  const ball = new THREE.Mesh(new THREE.SphereGeometry(.55, 40, 24), new THREE.MeshPhysicalMaterial({ color: '#f3f5f8', roughness: .2, clearcoat: 1 })); ball.castShadow = true; eye.add(ball);
  const iris = new THREE.Mesh(new THREE.CircleGeometry(.24, 40), mat('#2E8BFF', { roughness: .3 })); iris.position.z = .54; eye.add(iris);
  const pupil = new THREE.Mesh(new THREE.CircleGeometry(.11, 32), mat('#05070a')); pupil.position.z = .545; eye.add(pupil);
  const hl = new THREE.Mesh(new THREE.CircleGeometry(.04, 16), glow('#ffffff', 1.2)); hl.position.set(.06, .07, .55); eye.add(hl);
}
const cone = new THREE.Mesh(new THREE.ConeGeometry(.95, 3.2, 40, 1, true), new THREE.MeshBasicMaterial({ color: '#4a3c18', transparent: true, opacity: .1, side: THREE.FrontSide, depthWrite: false, toneMapped: false, blending: THREE.AdditiveBlending }));
S[3].add(cone);
const tiny = camModule(.12); tiny.position.set(.55, CY - .7, .4); S[3].add(tiny);
const tinyBud = earbud(.18); tinyBud.position.set(.95, CY - .9, .4); S[3].add(tinyBud);
const qMarks = [0, 1].map(i => { const q = text(.5, .5, '?', { fg: '#ffd77a', size: .45, weight: 900 }); S[3].add(q); return q; });
const cable = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([new THREE.Vector3(.55, CY - .7, .4), new THREE.Vector3(.2, CY - 1.1, .5), new THREE.Vector3(.7, CY - 1.3, .5), new THREE.Vector3(.95, CY - .9, .4)]), 60, .025, 8), glow('#9aa6bb', .9)); S[3].add(cable);
const cableX = text(.9, .4, '무선', { fg: '#7fd0ff', size: .26 }); S[3].add(cableX);
const pulse4 = waveRings('#7fd0ff', 3); pulse4.position.set(.75, CY - .8, .4); S[3].add(pulse4);
const lblEye = label('감독관의 눈', { color: '#ffd77a', h: .35 }); lblEye.position.set(-.85, CY + 1.85, 0); S[3].add(lblEye);
const flash4 = ringSign('순식간', '#7fd0ff', .5); flash4.position.set(.55, CY + .55, .3); S[3].add(flash4);

// S5: detectors
const sigs = [['전파', '#5ab8ff'], ['금속', '#7dffb0'], ['렌즈', '#ff8a5a']].map(([s, c], i) => { const g = ringSign(s, c, .5); g.position.set(0, CY + 1.25 - i * 1.25, .2); S[4].add(g); return g; });
const rfGroup = new THREE.Group(); S[4].add(rfGroup);
const rfDev = camModule(.75); rfDev.position.set(-.85, CY + .3, 0); rfDev.rotation.y = .5; rfGroup.add(rfDev);
const rfWaves = waveRings('#5ab8ff', 3); rfWaves.position.copy(rfDev.position); rfGroup.add(rfWaves);
const rfDet = new THREE.Group(); rfDet.position.set(.85, CY + .3, 0); rfGroup.add(rfDet);
const rfScr = tex(300, 300, () => { });
{ rfDet.add(rb(.85, 1.3, .25, mat('#1a2030', { metalness: .5 }), .1)); const ant = new THREE.Mesh(new THREE.CylinderGeometry(.03, .03, .8, 10), mat('#9aa6bb', { metalness: .8 })); ant.position.set(.25, 1.0, 0); rfDet.add(ant); const tipA = new THREE.Mesh(new THREE.SphereGeometry(.07, 12, 8), glow('#5ab8ff', 1.4)); tipA.position.set(.25, 1.42, 0); rfDet.add(tipA); rfDet.userData.tip = tipA;
  const s = new THREE.Mesh(new THREE.PlaneGeometry(.68, .68), new THREE.MeshBasicMaterial({ map: rfScr, toneMapped: false })); s.position.set(0, .18, .13); rfDet.add(s);
  const led = new THREE.Mesh(new THREE.SphereGeometry(.06, 12, 8), glow('#ff3b47', 1.5)); led.position.set(0, -.42, .13); rfDet.add(led); rfDet.userData.led = led; }
function drawRF(level, t) { const { g, c } = rfScr.userData; g.fillStyle = '#07101c'; g.fillRect(0, 0, 300, 300); g.strokeStyle = 'rgba(90,184,255,.25)'; for (let i = 1; i < 6; i++) { g.beginPath(); g.moveTo(0, i * 50); g.lineTo(300, i * 50); g.stroke(); }
  for (let i = 0; i < 12; i++) { const h = 20 + 30 * hash(i + Math.floor(t * 8)) + level * (180 + 60 * hash(i * 3 + Math.floor(t * 10))); g.fillStyle = level > .5 ? '#ff5a63' : '#5ab8ff'; g.fillRect(14 + i * 23, 280 - h, 16, h); } rfScr.needsUpdate = true; }
const lblRF = label('전파 감지', { color: '#5ab8ff', h: .35 }); lblRF.position.set(.85, CY + 1.95, 0); rfGroup.add(lblRF);
// metal
const mGroup = new THREE.Group(); S[4].add(mGroup);
const shell = rb(1.4, 1.4, .9, new THREE.MeshPhysicalMaterial({ color: '#8fb6ff', transparent: true, opacity: .14, roughness: .1, metalness: .1, depthWrite: false }), .18); shell.position.set(0, CY - .1, 0); shell.castShadow = false; mGroup.add(shell);
const battery = new THREE.Group(); battery.position.set(0, CY - .1, 0); mGroup.add(battery);
{ const b = new THREE.Mesh(new THREE.CylinderGeometry(.26, .26, .8, 32), mat('#2fbf71', { metalness: .4, roughness: .35 })); b.rotation.z = Math.PI / 2; b.castShadow = true; battery.add(b); const cap = new THREE.Mesh(new THREE.CylinderGeometry(.12, .12, .08, 20), mat('#c9ced8', { metalness: .9 })); cap.rotation.z = Math.PI / 2; cap.position.x = .44; battery.add(cap); const pcb = rb(1.0, .08, .6, mat('#1f5c3a'), .02); pcb.position.y = -.4; battery.add(pcb); }
const field = new THREE.Group(); field.position.copy(battery.position); mGroup.add(field);
for (let i = 0; i < 4; i++) { const r = new THREE.Mesh(new THREE.TorusGeometry(.5 + i * .22, .015, 8, 60), glow('#7dffb0', 1.2)); r.rotation.y = Math.PI / 2; field.add(r); }
const wand = new THREE.Group(); mGroup.add(wand);
{ const head = new THREE.Mesh(new THREE.TorusGeometry(.42, .07, 12, 40), mat('#2a3242', { metalness: .6 })); head.rotation.x = Math.PI / 2; wand.add(head); const handle = rb(.14, .14, 1.3, mat('#2a3242'), .06); handle.position.z = .9; handle.rotation.x = 0; wand.add(handle); const led = new THREE.Mesh(new THREE.SphereGeometry(.07, 12, 8), glow('#7dffb0', 1.5)); led.position.set(0, .1, .45); wand.add(led); wand.userData.led = led; }
const lblBat = label('배터리', { color: '#7dffb0', h: .35 }); lblBat.position.set(.55, CY + .05, .4); mGroup.add(lblBat);
// lens
const lGroup = new THREE.Group(); S[4].add(lGroup);
const lDev = camModule(1.0); lDev.position.set(-.7, CY - .55, 0); lDev.rotation.y = .55; lGroup.add(lDev);
const lDet = new THREE.Group(); lDet.position.set(.85, CY + 1.25, .3); lGroup.add(lDet);
{ lDet.add(rb(.6, .9, .35, mat('#1a2030', { metalness: .5 }), .1)); const emitter = new THREE.Mesh(new THREE.CircleGeometry(.14, 24), glow('#ff5a3c', 1.6)); emitter.position.set(0, .15, .18); lDet.add(emitter); }
const beam = new THREE.Mesh(new THREE.ConeGeometry(.18, 1, 24, 1, true), new THREE.MeshBasicMaterial({ color: '#ff5a3c', transparent: true, opacity: .28, side: THREE.DoubleSide, depthWrite: false, toneMapped: false })); lGroup.add(beam);
const ret = new THREE.Mesh(new THREE.CylinderGeometry(.03, .03, 1, 8), glow('#ffffff', 1.6)); lGroup.add(ret);
const glint = new THREE.Group(); lGroup.add(glint);
{ for (let i = 0; i < 4; i++) { const sp = new THREE.Mesh(new THREE.PlaneGeometry(.9, .06), glow('#ffffff', 2)); sp.rotation.z = i * Math.PI / 4; glint.add(sp); } const core = new THREE.Mesh(new THREE.CircleGeometry(.12, 24), glow('#ffffff', 2.4)); glint.add(core); }
const lblRefl = label('반사광', { color: '#ff8a5a', h: .35 }); lGroup.add(lblRefl);

// S6: reality
const sunung = slab(3.0, 1.05, ['2027 수능', '11월 19일'], { size: .44, colors: ['#ffffff', '#7fd0ff'] }); sunung.position.set(0, CY + 1.35, 0); S[5].add(sunung);
const miniSigs = [['전파', '#5ab8ff'], ['금속', '#7dffb0'], ['렌즈', '#ff8a5a']].map(([s, c], i) => { const g = ringSign(s, c, .36); g.position.set(-1.05 + i * 1.05, CY + .1, 0); S[5].add(g); return g; });
const hardStamp = stamp(2.9, .8, '올해 도입 어려움', '#9aa6bb'); hardStamp.position.set(0, CY + .1, .4); hardStamp.rotation.z = -.08; S[5].add(hardStamp);
const supSlab = slab(2.6, .85, '감독 강화', { edge: '#2E8BFF', size: .5 }); supSlab.position.set(0, CY + .1, .2); S[5].add(supSlab);
const st1 = stamp(1.5, .7, '성적 무효'); st1.position.set(-.8, CY - 1.05, .3); st1.rotation.z = .06; S[5].add(st1);
const st2 = stamp(1.5, .7, '응시 제한'); st2.position.set(.8, CY - 1.05, .3); st2.rotation.z = -.06; S[5].add(st2);

// S7: D-3, ?, comments
const dRing = new THREE.Mesh(new THREE.TorusGeometry(1.05, .06, 16, 80), glow('#F0761E', 1.4)); dRing.position.set(0, CY + .4, 0); S[6].add(dRing);
const dDisc = new THREE.Mesh(new THREE.CircleGeometry(1.02, 64), new THREE.MeshStandardMaterial({ color: '#0d1420', roughness: .4, metalness: .3 })); dDisc.position.set(0, CY + .4, -.02); S[6].add(dDisc);
const dTxt = text(1.9, 1.0, 'D-3', { size: .78, weight: 900 }); dTxt.position.set(0, CY + .48, .02); S[6].add(dTxt);
const dSub = text(1.6, .3, '수능 11.19', { fg: '#ffb27a', size: .2 }); dSub.position.set(0, CY - .2, .02); S[6].add(dSub);
const bigQ = text(1.6, 1.8, '?', { fg: '#ffffff', size: 1.5, weight: 900 }); bigQ.position.set(0, CY + .45, .3); S[6].add(bigQ);
const bubbles = [0, 1, 2].map(i => { const g = new THREE.Group(); g.add(rb(1.1, .66, .16, mat('#1c2a44', { metalness: .3, roughness: .3 }), .2)); const e = new THREE.Mesh(new THREE.BoxGeometry(1.14, .7, .02), glow(['#F0761E', '#2E8BFF', '#7dffb0'][i], 1.1)); e.position.z = -.06; g.add(e); const tl = new THREE.Mesh(new THREE.ConeGeometry(.12, .26, 3), mat('#1c2a44')); tl.position.set(-.3, -.4, 0); tl.rotation.z = .6; g.add(tl); const d = text(.9, .4, '• • •', { size: .28, fg: ['#ffb27a', '#7fd0ff', '#a6ffd0'][i] }); d.position.z = .09; g.add(d); S[6].add(g); return g; });

// ---------- captions ----------
const capEl = document.getElementById('cap'), dipEl = document.getElementById('dip');
function capHTML(str) { return str.replace(/\[(o|b|r):([^\]]+)\]/g, '<span class="hl $1">$2</span>'); }
function ui(t) {
  let i = -1; for (let k = 0; k < C.length; k++) if (t >= C[k]) i = k;
  if (i < 0) { capEl.innerHTML = ''; } else {
    const p = clamp((t - C[i]) / .2), e = oB(p);
    capEl.innerHTML = `<div style="opacity:${p};transform:translateY(${(1 - e) * 26}px) scale(${lerp(.94, 1, e)})">${capHTML(CUES.cues[i][1])}</div>`;
  }
  const cuts = [C[2], C[5], C[9], C[12], C[17], C[21]]; let d = 0; cuts.forEach(c => d = Math.max(d, 1 - Math.abs(t - c) / .14));
  dipEl.style.opacity = d * .9;
}

// ---------- camera ----------
const tg = new THREE.Vector3();
function cam(x, y, z, tx, ty, tz, fov = 30) { camera.position.set(x, y - .2, z + 3.0); tg.set(tx, ty - .05, tz); camera.lookAt(tg); camera.fov = fov; camera.updateProjectionMatrix(); }
const lab = (o, p) => { o.scale.setScalar(sc(oB(p))); o.visible = p > 0; };

// ---------- render ----------
window.render = function (t) {
  const si = t < C[2] ? 0 : t < C[5] ? 1 : t < C[9] ? 2 : t < C[12] ? 3 : t < C[17] ? 4 : t < C[21] ? 5 : 6;
  S.forEach((g, i) => g.visible = i === si);
  dust.rotation.y = t * .02; dust.position.y = Math.sin(t * .3) * .1;
  const drift = Math.sin(t * .35) * .5;
  const base = (k, push = 0) => cam(drift * .8, CY + .25 - push * .1, 11.2 - push, 0, CY - .55, 0, 30);

  if (si === 0) {
    base(0, P(t, 0, C[2]) * 1.2);
    const gOut = P(t, C[1] - .1, C[1] + .35);
    glasses.rotation.set(.1 + Math.sin(t * .8) * .05, -.35 + t * .25, 0);
    glasses.scale.setScalar(sc(oB(P(t, 0, .45)) * (1 - gOut)));
    const xp = P(t, .9, 1.15); xMark.scale.set(sc(xp), 1, 1); xMark.visible = xp > 0 && gOut < 1; xMark.children.forEach(m => m.material.opacity = 1 - gOut);
    lab(lblGlasses, P(t, .5, .8) * (1 - gOut));
    const ce = oB(P(t, C[1] + .1, C[1] + .55)), pe = oB(P(t, C[1] + .35, C[1] + .8));
    cam1.scale.setScalar(sc(1.25 * ce)); cam1.rotation.set(.1, -.4 + Math.sin(t) * .15, 0); cam1.position.y = CY + .2 + Math.sin(t * 1.4) * .05;
    ph1.scale.setScalar(sc(pe)); ph1.rotation.set(.05, -.25 + Math.sin(t * .9) * .1, .04); ph1.position.y = CY + .2 + Math.sin(t * 1.2 + 1) * .05;
    lab(lblCam1, P(t, C[1] + .5, C[1] + .8)); lab(lblPh1, P(t, C[1] + .8, C[1] + 1.1));
  } else if (si === 1) {
    const p = io(P(t, C[2], C[5])); cam(lerp(-.4, .4, p), CY + .4, lerp(10.2, 9.0, p), 0, CY - .3, 0, 30);
    button.scale.setScalar(sc(oB(P(t, C[2], C[2] + .35)))); button.rotation.set(.15, Math.sin(t * .7) * .25, 0);
    camSmall.scale.setScalar(sc(.42 * oB(P(t, C[2] + .3, C[2] + .65)))); camSmall.rotation.y = -.5 + Math.sin(t) * .2;
    ruler.scale.set(sc(io(P(t, C[2] + .1, C[2] + .6))), 1, 1);
    lab(lblBtn, P(t, C[2] + .25, C[2] + .5)); lab(lblCam2, P(t, C[2] + .55, C[2] + .8));
    rice.visible = bud2.visible = t > C[3]; rice.scale.set(.5 * sc(oB(P(t, C[3], C[3] + .35))), .24 * sc(oB(P(t, C[3], C[3] + .35))), .24); rice.rotation.y = t * .5;
    bud2.scale.setScalar(sc(.6 * oB(P(t, C[3] + .25, C[3] + .6)))); bud2.rotation.y = t * .6;
    lab(lblRice, P(t, C[3] + .2, C[3] + .45)); lab(lblBud, P(t, C[3] + .45, C[3] + .7));
    // emphasis pulse at C4
    const em = Math.max(0, Math.sin(P(t, C[4], C[4] + .6) * Math.PI)); camSmall.scale.multiplyScalar(1 + em * .25); bud2.scale.multiplyScalar(1 + em * .25);
  } else if (si === 2) {
    const p = io(P(t, C[5], C[9])); cam(lerp(.6, -.4, p), CY + .3, lerp(10.4, 9.6, p), 0, CY - .45, 0, 30);
    const a1 = oB(P(t, C[5], C[5] + .35)), a2 = oB(P(t, C[5] + .25, C[5] + .6)), a3 = oB(P(t, C[5] + .5, C[5] + .85));
    cam3.scale.setScalar(sc(.9 * a1)); chip.scale.setScalar(sc(a2)); bud3.scale.setScalar(sc(1.1 * a3)); chip.rotation.set(.2, -.3 + Math.sin(t) * .1, 0); bud3.rotation.y = .5 + Math.sin(t) * .2;
    tube.scale.setScalar(1); tube.material.opacity = .16 * P(t, C[5] + .3, C[5] + .8);
    lab(lblN1, P(t, C[6], C[6] + .3)); lab(lblN2, P(t, C[7], C[7] + .3)); lab(lblN3, P(t, C[8], C[8] + .3));
    doc.visible = t > C[6] - .2; doc.scale.setScalar(sc(oB(P(t, C[6] - .2, C[6] + .2)))); doc.rotation.set(0, -.3, Math.sin(t * 1.3) * .05);
    // scan beam from lens to doc
    scanBeam.visible = t > C[6] && t < C[7] + .3; if (scanBeam.visible) { const a = cam3.position.clone(), b = doc.position.clone(); const mid = a.clone().lerp(b, .5); scanBeam.position.copy(mid); scanBeam.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), a.clone().sub(b).normalize()); scanBeam.scale.set(1, a.distanceTo(b), 1); scanBeam.material.opacity = .35 * (.6 + .4 * Math.sin(t * 20)); }
    // beads progress
    let prog = 0; if (t > C[6]) prog = .5 * io(P(t, C[6] + .2, C[7])); if (t > C[7]) prog = .5 + .5 * io(P(t, C[7] + .3, C[8]));
    beads.forEach((b, i) => { const u = ((t * .35 + i / beads.length) % 1); const vis = u <= prog && t > C[6]; b.visible = vis; if (vis) { b.position.copy(curve.getPointAt(u)); b.scale.setScalar(.8 + .4 * Math.sin(t * 6 + i)); } });
    const cg = P(t, C[7], C[7] + .3) * (1 - .5 * P(t, C[8], C[8] + .5)); chip.userData.halo.material.opacity = cg * (.5 + .3 * Math.sin(t * 9));
    animRings(rings3, t, .9, 1.3, P(t, C[8], C[8] + .2));
  } else if (si === 3) {
    const p = io(P(t, C[9], C[12])); cam(lerp(-.3, .5, p), CY + .3, lerp(10.6, 9.8, p), 0, CY - .4, 0, 30);
    eye.scale.setScalar(sc(oB(P(t, C[9], C[9] + .4))));
    const sweep = Math.sin((t - C[9]) * 1.4) * .35; eye.rotation.set(.45, .55 + sweep, 0);
    // vision cone from eye, misses tiny devices
    const dir = new THREE.Vector3(Math.sin(.55 + sweep) * .9, -.55, .35).normalize();
    const len = 3.2; cone.position.copy(eye.position).add(dir.clone().multiplyScalar(len / 2 + .3)); cone.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.clone().negate());
    cone.visible = t > C[9] + .3; cone.material.opacity = .5 * P(t, C[9] + .3, C[9] + .7);
    lab(lblEye, P(t, C[9] + .2, C[9] + .5));
    tiny.visible = tinyBud.visible = true; tiny.rotation.y = t; tinyBud.rotation.y = -t;
    qMarks.forEach((q, i) => { const e = oB(P(t, C[9] + 1.2 + i * .3, C[9] + 1.5 + i * .3)); q.visible = e > 0 && t < C[10]; q.scale.setScalar(sc(e)); q.position.set(.4 + i * .6, CY - .2 + Math.sin(t * 3 + i) * .06, .5); });
    // cable dissolves at C10
    const cd = P(t, C[10], C[10] + .6); cable.visible = t < C[10] + .6; cable.material.opacity = 1 - cd; cable.scale.setScalar(1);
    cableX.visible = t > C[10] + .2 && t < C[11] + .2; cableX.scale.setScalar(sc(oB(P(t, C[10] + .2, C[10] + .5)))); cableX.position.set(.75, CY - 1.55, .5);
    animRings(pulse4, t, .35, .9, P(t, C[11], C[11] + .15));
    flash4.visible = t > C[11]; flash4.scale.setScalar(sc(oB(P(t, C[11] + .1, C[11] + .45)))); flash4.userData.ring.material.opacity = .7 + .3 * Math.sin(t * 25);
  } else if (si === 4) {
    // sub-phase camera
    let cx = 0, cz = 10.2; cam(drift * .5, CY + .3, cz, 0, CY - .45, 0, 30);
    const intro = t < C[13];
    sigs.forEach((g, i) => { const e = oB(P(t, C[12] + .15 + i * .2, C[12] + .5 + i * .2)); const out = P(t, C[13] - .2, C[13] + .2); g.visible = e > 0 && out < 1; g.scale.setScalar(sc(e * (1 - out))); g.rotation.y = Math.sin(t * 1.5 + i) * .25; g.userData.ring.material.opacity = .8 + .2 * Math.sin(t * 4 + i); });
    rfGroup.visible = t >= C[13] - .1 && t < C[14]; mGroup.visible = t >= C[14] - .1 && t < C[15]; lGroup.visible = t >= C[15] - .1;
    if (rfGroup.visible) {
      const e = oB(P(t, C[13], C[13] + .4)); rfGroup.scale.setScalar(sc(e)); rfGroup.position.set(0, (1 - e) * .5, 0);
      const ph = ((t - C[13]) % 1.1) / 1.1; const burst = ph < .25 ? 1 : 0; const level = Math.max(0, 1 - ph * 3);
      animRings(rfWaves, t - C[13], 1.1, 1.3, 1); rfWaves.rotation.y = .5;
      drawRF(level, t); rfDet.userData.led.material.opacity = level > .3 ? 1 : .15; rfDet.userData.tip.scale.setScalar(1 + level * .6);
      rfDev.rotation.y = .5 + Math.sin(t) * .15; lab(lblRF, P(t, C[13] + .4, C[13] + .7));
    }
    if (mGroup.visible) {
      const e = oB(P(t, C[14], C[14] + .4)); mGroup.scale.setScalar(sc(e)); mGroup.rotation.y = Math.sin(t * .6) * .3;
      const wx = Math.sin((t - C[14]) * 1.8) * 1.1; wand.position.set(wx, CY + 1.0, .2); wand.rotation.set(0, 0, 0);
      const near = Math.max(0, 1 - Math.abs(wx) / .6);
      field.children.forEach((r, i) => { r.material.opacity = near * (.9 - i * .18) * (.6 + .4 * Math.sin(t * 10 - i)); r.scale.setScalar(1 + near * .15 * Math.sin(t * 8 + i)); });
      wand.userData.led.material.color.set(near > .4 ? '#ff3b47' : '#7dffb0').multiplyScalar(1.5);
      lab(lblBat, P(t, C[14] + .5, C[14] + .8));
    }
    if (lGroup.visible) {
      const e = oB(P(t, C[15], C[15] + .4)); lGroup.scale.setScalar(sc(e));
      const lensW = new THREE.Vector3(); lDev.updateMatrixWorld(); lDev.localToWorld(lensW.copy(lDev.userData.lensPos));
      lGroup.worldToLocal(lensW);
      const src = lDet.position.clone().add(new THREE.Vector3(0, .15, .2));
      const sweepA = t < C[16] ? Math.sin((t - C[15]) * 3) * .55 : 0;
      const tgt = lensW.clone().add(new THREE.Vector3(sweepA, sweepA * .3, 0));
      const d = tgt.clone().sub(src); const L = d.length();
      beam.position.copy(src).add(d.clone().multiplyScalar(.5)); beam.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.clone().normalize().negate()); beam.scale.set(1.2, L, 1.2);
      const hit = t >= C[16] ? 1 : 0;
      ret.visible = hit > 0; if (hit) { ret.position.copy(beam.position); ret.quaternion.copy(beam.quaternion); ret.scale.set(1, L * P(t, C[16], C[16] + .35), 1); ret.material.opacity = .8 + .2 * Math.sin(t * 20); }
      glint.position.copy(lensW).add(new THREE.Vector3(0, 0, .1)); glint.visible = hit > 0; glint.scale.setScalar(sc(oB(P(t, C[16], C[16] + .3)) * (1 + .15 * Math.sin(t * 14)))); glint.rotation.z = t * .8; glint.lookAt(camera.position);
      lblRefl.position.copy(lensW).add(new THREE.Vector3(-.25, .35, .3)); lab(lblRefl, P(t, C[16] + .3, C[16] + .6));
    }
  } else if (si === 5) {
    const p = io(P(t, C[17], C[21])); cam(lerp(.4, -.3, p), CY + .3, lerp(10.4, 9.8, p), 0, CY - .45, 0, 30);
    sunung.scale.setScalar(sc(oB(P(t, C[17], C[17] + .4)))); sunung.rotation.y = Math.sin(t * .8) * .12;
    const dim = P(t, C[18] + .3, C[18] + .8), swap = P(t, C[19] - .15, C[19] + .2);
    miniSigs.forEach((g, i) => { const e = oB(P(t, C[17] + .4 + i * .15, C[17] + .7 + i * .15)); g.visible = e > 0 && swap < 1; g.scale.setScalar(sc(e * (1 - swap))); g.userData.ring.material.color.set(dim > .5 ? '#3a4150' : ['#5ab8ff', '#7dffb0', '#ff8a5a'][i]).multiplyScalar(lerp(1.4, .6, dim)); g.userData.tp.material.opacity = 1 - dim * .6; });
    const hs = P(t, C[18] + .45, C[18] + .7); hardStamp.visible = hs > 0 && swap < 1; hardStamp.scale.setScalar(sc(lerp(1.8, 1, hs) * (1 - swap))); setOpacity(hardStamp, hs * (1 - swap));
    supSlab.visible = t > C[19]; supSlab.scale.setScalar(sc(oB(P(t, C[19], C[19] + .4))));
    [[st1, C[20] + .7], [st2, C[20] + 1.6]].forEach(([s, ts]) => { const e = P(t, ts, ts + .2); s.visible = e > 0; s.scale.setScalar(sc(lerp(1.8, 1, e))); setOpacity(s, e); });
  } else {
    const p = io(P(t, C[21], DUR)); cam(drift * .4, CY + .3, lerp(10.6, 9.6, p), 0, CY - .45, 0, 30);
    const dIn = oB(P(t, C[21], C[21] + .4)), dOut = P(t, C[22] - .1, C[22] + .3);
    [dRing, dDisc, dTxt, dSub].forEach(o => { o.visible = dOut < 1; o.scale.setScalar(sc(dIn * (1 - dOut))); });
    dRing.material.opacity = .8 + .2 * Math.sin(t * 5);
    const q = oB(P(t, C[22] + .1, C[22] + .5)); bigQ.visible = q > 0; bigQ.scale.setScalar(sc(q * (1 - .35 * P(t, C[23], C[23] + .4)))); bigQ.position.y = CY + .45 + P(t, C[23], C[23] + .4) * .55; bigQ.rotation.z = Math.sin(t * 2) * .06;
    bubbles.forEach((b, i) => { const st = C[23] + .2 + i * .25; const e = oB(P(t, st, st + .35)); b.visible = e > 0; b.scale.setScalar(sc(e)); b.position.set([-1.0, .95, -.1][i], CY + [-.55, -.35, -1.2][i] + Math.sin(t * 2 + i) * .05, .3); b.rotation.y = Math.sin(t + i) * .2; });
  }
  composer.render(); ui(t);
};
window.DURATION = DUR; window.__dbg = { cone, S };
window.READY = true;
const qp = new URLSearchParams(location.search); window.render(qp.get('t') ? +qp.get('t') : 0);
