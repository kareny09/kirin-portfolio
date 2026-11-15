import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

await Promise.all(['900','800','700'].map(w=>document.fonts.load(w+' 40px P','가나다AI')));
const W = 1080, H = 1920;
const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
const lerp = (a, b, t) => a + (b - a) * t;
const P = (t, a, b) => clamp((t - a) / (b - a));
const io = t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
const oB = t => { const c1 = 1.7, c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); };
const bounce = x => { const n = 7.5625, d = 2.75; if (x < 1 / d) return n * x * x; if (x < 2 / d) return n * (x -= 1.5 / d) * x + .75; if (x < 2.5 / d) return n * (x -= 2.25 / d) * x + .9375; return n * (x -= 2.625 / d) * x + .984375; };
const hash = n => { const s = Math.sin(n * 127.1) * 43758.5453; return s - Math.floor(s); };

// ---------- timeline (from narration) ----------
const T = { s1: 2.3, red: 4.54, s2: 6.92, stamp: 8.93, s3: 11.72, stop: 12.78, ticket: 14.82, unconf: 18.83, s4: 21.04, survey: 23.63, s5: 27.78, s5b: 29.97, s6: 32.43, s6b: 34.25, s7: 37.71, s7b: 40.90, s8: 43.76, s8b: 46.05, s9: 47.48, end: 50.04 };
const CAPS = [
  [T.s1, '세무사 시험 [y:수석 합격자]가'],
  [T.red, '1차에서 틀린 건 [r:단 한 문제]'],
  [T.s2, '그는 1·2차 모두에서 [m:생성형 AI]를 써서'],
  [T.stamp, '[r:부정행위]를 했다고 [y:자수]했습니다'],
  [T.s3, '수험생들은 [y:허탈함]을 털어놨습니다'],
  [T.ticket, '이 일로 누군가 실제로'],
  [17.05, '[y:합격 기회]를 잃었는지는'],
  [T.unconf, '아직 [r:확인되지 않았습니다]'],
  [T.s4, '정부는 [r:합격 취소]를 추진하고'],
  [T.survey, '올해 국가자격시험을 [y:전수조사]하겠다고 밝혔습니다'],
  [T.s5, '그런데 [y:두 번의 시험]에서'],
  [T.s5b, '어떻게 [r:걸러지지 않았을까요?]'],
  [T.s6, '정부는 이번 시험 결과에'],
  [T.s6b, '[y:영향]이 있었는지 어떻게 확인할까요?'],
  [T.s7, '그리고 누군가 [y:합격 기회]를 잃었다면'],
  [T.s7b, '그 기회는 [r:어떻게 돌려줘야] 할까요?'],
  [T.s8, '곧 있을 [y:수능시험]에서'],
  [T.s8b, '[r:대책]이 있을까요?'],
  [T.s9, '여러분의 생각을 [y:댓글]로 남겨주세요'],
];

// ---------- renderer ----------
const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
renderer.setPixelRatio(1); renderer.setSize(W, H);
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.05;
document.body.prepend(renderer.domElement);
const scene = new THREE.Scene();
scene.background = new THREE.Color('#9fb9c6');
scene.fog = new THREE.Fog('#9fb9c6', 40, 95);
const camera = new THREE.PerspectiveCamera(30, W / H, 0.1, 300);
const hud = new THREE.Group(); hud.position.z = -5; camera.add(hud);

scene.add(camera);
scene.add(new THREE.HemisphereLight('#e8f0ff', '#7a5a44', 1.25));
const sun = new THREE.DirectionalLight('#ffe0b5', 2.6);
sun.position.set(-14, 22, 10); sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048); sun.shadow.camera.left = -16; sun.shadow.camera.right = 16; sun.shadow.camera.top = 16; sun.shadow.camera.bottom = -16; sun.shadow.camera.far = 80; sun.shadow.bias = -0.0004; sun.shadow.radius = 4;
scene.add(sun, sun.target);
const fill = new THREE.DirectionalLight('#b9d4ff', 0.6); fill.position.set(12, 8, 14); scene.add(fill);

const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));
const bloom = new UnrealBloomPass(new THREE.Vector2(W / 2, H / 2), 0.35, 0.5, 0.88); composer.addPass(bloom);
composer.addPass(new OutputPass());

// ---------- helpers ----------
const matCache = {};
const mat = (c, o = {}) => { const k = c + JSON.stringify(o); return matCache[k] || (matCache[k] = new THREE.MeshStandardMaterial({ color: c, roughness: .75, metalness: 0, ...o })); };
function rb(w, h, d, c, r = 0.08, o = {}) {
  const m = new THREE.Mesh(new RoundedBoxGeometry(w, h, d, 3, Math.min(r, w / 2 - .001, h / 2 - .001, d / 2 - .001)), typeof c === 'string' ? mat(c, o) : c);
  m.castShadow = true; m.receiveShadow = true; return m;
}
function grp(...ch) { const g = new THREE.Group(); ch.forEach(c => g.add(c)); return g; }
function at(o, x, y, z) { o.position.set(x, y, z); return o; }

function canvasTex(wpx, hpx, draw) {
  const c = document.createElement('canvas'); c.width = wpx; c.height = hpx;
  const g = c.getContext('2d'); draw(g, wpx, hpx);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
  t.userData = { c, g }; return t;
}
function rr(g, x, y, w, h, r) { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); }
function textPlane(w, h, lines, { bg = null, fg = '#1d2433', size = .5, weight = 900, radius = .1, emissive = false, colors = null, lh = 1.15 } = {}) {
  const S = 200;
  const tex = canvasTex(Math.round(w * S), Math.round(h * S), (g, cw, ch) => {
    if (bg) { g.fillStyle = bg; rr(g, 0, 0, cw, ch, radius * S); g.fill(); }
    g.textAlign = 'center'; g.textBaseline = 'middle';
    const L = Array.isArray(lines) ? lines : [lines];
    let fs = size * S; g.font = `${weight} ${fs}px P`;
    const mw = Math.max(...L.map(l => g.measureText(l).width)); if (mw > cw * .9) fs *= cw * .9 / mw; g.font = `${weight} ${fs}px P`; size = fs / S;
    L.forEach((ln, i) => { g.fillStyle = colors ? colors[i] : fg; g.fillText(ln, cw / 2, ch / 2 + (i - (L.length - 1) / 2) * size * S * lh); });
  });
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), emissive ? new THREE.MeshBasicMaterial({ map: tex, transparent: true, toneMapped: false }) : new THREE.MeshStandardMaterial({ map: tex, transparent: true, roughness: .8 }));
  return m;
}
// panel: rounded slab + text on front
function panel(w, h, lines, o = {}) {
  const { slab = '#ffffff', d = .18, ...to } = o;
  const g = grp(rb(w, h, d, slab, .12));
  const tp = textPlane(w * .94, h * .9, lines, to); tp.position.z = d / 2 + .005; g.add(tp);
  return g;
}

// ---------- characters ----------
const SKIN = '#f6cfaa';
function student(hood = '#3b5bdb', hair = '#2b2230') {
  const root = new THREE.Group();
  const body = rb(.95, .9, .7, hood, .2); body.position.y = 1.05;
  const legs = grp(at(rb(.32, .65, .4, '#2c3245', .1), -.22, .33, 0), at(rb(.32, .65, .4, '#2c3245', .1), .22, .33, 0));
  const head = new THREE.Group(); head.position.y = 1.5;
  const skull = rb(1.0, .92, .9, SKIN, .26); skull.position.y = .46;
  const hairM = rb(1.06, .36, .96, hair, .16); hairM.position.set(0, .86, -.04);
  const fringe = rb(1.04, .2, .3, hair, .09); fringe.position.set(0, .76, .36);
  const eyeM = mat('#1d1d26');
  const eyeL = rb(.11, .2, .05, eyeM, .05); eyeL.position.set(-.2, .48, .45);
  const eyeR = eyeL.clone(); eyeR.position.x = .2;
  const browL = rb(.2, .05, .04, eyeM, .02); browL.position.set(-.2, .66, .46);
  const browR = browL.clone(); browR.position.x = .2;
  const blushL = rb(.14, .07, .03, '#ff9d9d', .03); blushL.position.set(-.33, .33, .45);
  const blushR = blushL.clone(); blushR.position.x = .33;
  const mouth = rb(.16, .05, .04, eyeM, .02); mouth.position.set(0, .26, .46);
  head.add(skull, hairM, fringe, eyeL, eyeR, browL, browR, blushL, blushR, mouth);
  const arm = () => { const p = new THREE.Group(); const a = rb(.26, .62, .26, hood, .12); a.position.y = -.28; const h = rb(.22, .2, .22, SKIN, .09); h.position.y = -.62; p.add(a, h); return p; };
  const armL = arm(); armL.position.set(-.6, 1.4, 0);
  const armR = arm(); armR.position.set(.6, 1.4, 0);
  root.add(legs, body, head, armL, armR);
  return { root, head, eyeL, eyeR, browL, browR, mouth, armL, armR, legs, body };
}
function face(s, kind, t = 0) {
  const blink = (t * 1.0 % 3.1) < .1 ? .15 : 1;
  s.eyeL.scale.y = s.eyeR.scale.y = blink;
  s.browL.rotation.z = s.browR.rotation.z = 0; s.mouth.scale.set(1, 1, 1); s.mouth.rotation.z = 0;
  s.browL.position.y = s.browR.position.y = .66;
  if (kind === 'sad') { s.browL.rotation.z = -.35; s.browR.rotation.z = .35; s.mouth.scale.set(.8, 1, 1); s.eyeL.scale.y = s.eyeR.scale.y = .55 * blink; }
  if (kind === 'shock') { s.browL.position.y = s.browR.position.y = .74; s.mouth.scale.set(.7, 3.2, 1); s.eyeL.scale.y = s.eyeR.scale.y = 1.25; }
  if (kind === 'worry') { s.browL.rotation.z = -.25; s.browR.rotation.z = .25; s.mouth.rotation.z = .2; }
  if (kind === 'happy') { s.mouth.scale.set(1.4, 2, 1); }
}

// ---------- exam room ----------
const WOOD = '#d39a62', WALL = '#f3e7d3', FLOOR = '#c98f5a';
function desk() {
  const g = new THREE.Group();
  g.add(at(rb(1.9, .14, 1.2, '#e8c79a', .05), 0, 1.25, 0));
  g.add(at(rb(1.8, .9, .08, '#b98252', .03), 0, .78, .55)); // front panel hides legs
  g.add(at(rb(.09, 1.2, .09, '#6f7a8c', .03), -.85, .6, -.5));
  g.add(at(rb(.09, 1.2, .09, '#6f7a8c', .03), .85, .6, -.5));
  return g;
}
function chair(c = '#4fa3a5') {
  const g = new THREE.Group();
  g.add(at(rb(1.0, .12, .9, c, .05), 0, .78, 0));
  g.add(at(rb(1.0, .9, .1, c, .05), 0, 1.25, -.45));
  [[-.42, -.38], [.42, -.38], [-.42, .38], [.42, .38]].forEach(([x, z]) => g.add(at(rb(.07, .78, .07, '#6f7a8c', .03), x, .39, z)));
  return g;
}
const HOODS = ['#3b5bdb', '#f08c3a', '#2f9e77', '#e8590c', '#7048e8', '#f2b84b', '#1c7ed6', '#d6336c', '#5c940d'];
function makeRoom(withStudents = true, idxSeed = 0) {
  const room = new THREE.Group();
  room.add(at(rb(12.4, .5, 10.4, FLOOR, .12), 0, -.25, 0));
  // floor planks
  for (let i = -5; i <= 5; i++) room.add(at(new THREE.Mesh(new THREE.BoxGeometry(.03, .01, 10.2), mat('#b57c4a')), i * 1.1, .005, 0));
  room.add(at(rb(12.4, 5.2, .4, WALL, .1), 0, 2.6, -5));
  room.add(at(rb(.4, 5.2, 10.4, WALL, .1), -6, 2.6, 0));
  room.add(at(rb(12.4, .6, .44, '#9ab8a8', .06), 0, .3, -4.98)); // wainscot
  room.add(at(rb(.44, .6, 10.4, '#9ab8a8', .06), -5.98, .3, 0));
  // windows on left wall
  for (const z of [-2.2, 1.6]) {
    room.add(at(rb(.2, 2.2, 2.4, '#ffffff', .06), -5.78, 2.9, z));
    const pane = new THREE.Mesh(new THREE.PlaneGeometry(2.1, 1.9), new THREE.MeshBasicMaterial({ color: '#cfe9ff', toneMapped: false }));
    pane.rotation.y = Math.PI / 2; pane.position.set(-5.66, 2.9, z); room.add(pane);
    room.add(at(rb(.08, 1.95, .08, '#ffffff', .02), -5.62, 2.9, z));
    room.add(at(rb(.08, .08, 2.15, '#ffffff', .02), -5.62, 2.9, z));
  }
  const desks = [], kids = [];
  if (withStudents !== null) {
    for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) {
      const x = (c - 1) * 3.3 + .4, z = (r - 1) * 2.9 + .3;
      const ch = chair(); ch.position.set(x, 0, z - .55); room.add(ch);
      const dk = desk(); dk.position.set(x, 0, z + .35); room.add(dk);
      desks.push(dk);
      if (withStudents) {
        const s = student(HOODS[(r * 3 + c + idxSeed) % HOODS.length], hash(r * 3 + c + idxSeed) > .5 ? '#2b2230' : '#5a3a2a');
        s.root.position.set(x, .25, z - .5); s.legs.visible = false;
        s.armL.rotation.x = s.armR.rotation.x = -1.1; s.armL.position.z = s.armR.position.z = .1;
        room.add(s.root); kids.push(s);
      }
    }
  }
  return { room, desks, kids };
}

// ---------- build: main room ----------
const main = makeRoom(true);
scene.add(main.room);
const ACE = 1; // front-center seat index (row 0? rows go back->front). row r=2 is front.
const aceIdx = 7, sadIdx = 2; // 7 = front-center, 2 = back-right
const ace = main.kids[aceIdx], sadK = main.kids[sadIdx];
// wall sign + clock on back wall
const sign = panel(4.6, 1.0, '제63회 세무사 시험', { slab: '#2f5d50', fg: '#f4f1e6', size: .44, weight: 800 });
sign.position.set(-1.0, 3.9, -4.75); main.room.add(sign);
const clock = new THREE.Group(); clock.position.set(3.8, 3.85, -4.72);
{
  const rim = new THREE.Mesh(new THREE.CylinderGeometry(.95, .95, .2, 40), mat('#2b2f3a')); rim.rotation.x = Math.PI / 2; rim.castShadow = true;
  const faceM = new THREE.Mesh(new THREE.CylinderGeometry(.82, .82, .22, 40), mat('#fbfaf5')); faceM.rotation.x = Math.PI / 2;
  clock.add(rim, faceM);
  for (let i = 0; i < 12; i++) { const k = rb(.06, i % 3 ? .12 : .2, .04, '#2b2f3a', .02); const a = i / 12 * Math.PI * 2; k.position.set(Math.sin(a) * .68, Math.cos(a) * .68, .12); k.rotation.z = -a; clock.add(k); }
  const hand = (len, wd, c) => { const p = new THREE.Group(); const m = rb(wd, len, .03, c, .01); m.position.y = len / 2 - .08; p.add(m); p.position.z = .14; return p; };
  clock.userData.h = hand(.42, .08, '#2b2f3a'); clock.userData.m = hand(.62, .06, '#2b2f3a'); clock.userData.s = hand(.7, .025, '#e5484d');
  clock.add(clock.userData.h, clock.userData.m, clock.userData.s);
  const cap = new THREE.Mesh(new THREE.CylinderGeometry(.06, .06, .05, 16), mat('#e5484d')); cap.rotation.x = Math.PI / 2; cap.position.z = .17; clock.add(cap);
}
main.room.add(clock);
// door on left wall (front)
// spotlight on ace
const aceSpot = new THREE.SpotLight('#fff1c9', 0, 30, .32, .6, 1.2);
aceSpot.position.set(0.4, 14, 6); aceSpot.target.position.copy(main.desks[aceIdx].position); main.room.add(aceSpot, aceSpot.target);

// OMR board (floating above room)
const omrTex = canvasTex(900, 1180, () => { });
function drawOMR(n, redOn, pulse) {
  const { g, c } = omrTex.userData; const cw = c.width, ch = c.height;
  g.clearRect(0, 0, cw, ch);
  g.fillStyle = '#fffdf7'; rr(g, 0, 0, cw, ch, 50); g.fill();
  g.fillStyle = '#e5484d'; rr(g, 0, 0, cw, 120, 50); g.fill(); g.fillRect(0, 60, cw, 60);
  g.fillStyle = '#fff'; g.font = '900 64px P'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('OMR 답안지 · 1차', cw / 2, 64);
  const cols = 8, rows = 20, x0 = 80, y0 = 170, dx = (cw - 160) / (cols - 1), dy = 40;
  for (let i = 0; i < 160; i++) {
    const cc = Math.floor(i / rows), r = i % rows; const x = x0 + cc * dx, y = y0 + r * dy;
    const filled = i < n; const isRed = i === 117;
    g.beginPath(); g.ellipse(x, y, 30, 14, 0, 0, Math.PI * 2);
    if (isRed && redOn) { g.fillStyle = `rgba(229,72,77,${.75 + .25 * pulse})`; g.fill(); }
    else if (filled) { g.fillStyle = '#2f9e77'; g.fill(); }
    else { g.strokeStyle = '#c9c2b0'; g.lineWidth = 4; g.stroke(); }
  }
  g.fillStyle = '#1d2433'; g.font = '900 92px P';
  g.fillText(`${Math.min(n, 159) + (n >= 160 ? 0 : 0)} / 160`, cw / 2, ch - 110);
  omrTex.needsUpdate = true;
}
const omr = new THREE.Group();
{
  const slab = rb(4.7, 6.15, .2, '#ffffff', .2); omr.add(slab);
  const pl = new THREE.Mesh(new THREE.PlaneGeometry(4.5, 5.9), new THREE.MeshStandardMaterial({ map: omrTex, roughness: .8 })); pl.position.z = .11; omr.add(pl);
}
scene.add(omr);
const badge = panel(4.2, 1.05, '160문제 중 159개 정답', { slab: '#FFD23F', size: .46 }); scene.add(badge);
// crown on ace
const crown = new THREE.Group();
{ const base = rb(.9, .3, .9, '#f2b84b', .06, { metalness: .4, roughness: .35 }); crown.add(base);
  for (let i = 0; i < 4; i++) { const sp = new THREE.Mesh(new THREE.ConeGeometry(.16, .4, 4), mat('#f2b84b', { metalness: .4, roughness: .35 })); const a = i / 4 * Math.PI * 2 + Math.PI / 4; sp.position.set(Math.cos(a) * .32, .32, Math.sin(a) * .32); crown.add(sp); }
}
ace.head.add(crown); crown.position.y = 1.15;
// AI orb + chat bubbles
const aiOrb = new THREE.Group();
{ const core = new THREE.Mesh(new THREE.IcosahedronGeometry(.55, 0), new THREE.MeshStandardMaterial({ color: '#5CF0C4', emissive: '#2fd6a3', emissiveIntensity: 1.6, flatShading: true, roughness: .3 }));
  const ring = new THREE.Mesh(new THREE.TorusGeometry(.95, .045, 8, 48), new THREE.MeshBasicMaterial({ color: '#9ff7dd', toneMapped: false })); ring.rotation.x = 1.2;
  const lab = textPlane(1.0, .45, 'AI', { fg: '#0d3b30', size: .34, weight: 900 }); lab.position.z = .56;
  aiOrb.add(core, ring, lab); aiOrb.userData = { core, ring };
}
scene.add(aiOrb);
const bubbles = [0, 1, 2].map(i => { const b = rb(1.1 + i * .2, .5, .14, new THREE.MeshStandardMaterial({ color: '#dffcf3', emissive: '#5CF0C4', emissiveIntensity: .25 }), .2); const dots = textPlane(.8, .4, '• • •', { fg: '#2f9e77', size: .3 }); dots.position.z = .08; b.add(dots); scene.add(b); return b; });
// stamp
const stamp = new THREE.Group();
{ const base = rb(2.6, .45, 1.5, '#c92a2a', .12); const handle = new THREE.Mesh(new THREE.CylinderGeometry(.28, .38, 1.4, 20), mat('#7a2121')); handle.position.y = .9; handle.castShadow = true;
  const knob = new THREE.Mesh(new THREE.SphereGeometry(.48, 20, 14), mat('#7a2121')); knob.position.y = 1.75; knob.castShadow = true; stamp.add(base, handle, knob); }
scene.add(stamp);
const imprint = textPlane(2.6, 1.2, '부정행위', { fg: '#e03131', size: .62, weight: 900 }); imprint.rotation.x = -Math.PI / 2; scene.add(imprint);
const confess = panel(2.2, 1.3, ['자수서', '경찰 제출'], { slab: '#fffaf0', size: .38, colors: ['#1d2433', '#e5484d'] }); scene.add(confess);
// phone headline panel
const phone = new THREE.Group();
{ const body = rb(2.5, 4.4, .25, '#1d2433', .3); phone.add(body);
  const scr = textPlane(2.25, 4.0, ['[속보]', '세무사 수석', 'AI 부정행위', '자수'], { bg: '#ffffff', size: .34, colors: ['#e5484d', '#1d2433', '#1d2433', '#e5484d'], radius: .2, lh: 1.5 }); scr.position.z = .13; phone.add(scr); }
scene.add(phone);
const miniPhone = rb(.32, .55, .06, '#1d2433', .05); sadK.armR.add(miniPhone); miniPhone.position.set(0, -.75, .15);
// rain cloud
const cloud = new THREE.Group();
{ [[0, 0, .6], [.6, -.1, .45], [-.6, -.1, .45], [.25, .25, .45], [-.3, .2, .4]].forEach(([x, y, r]) => { const s = new THREE.Mesh(new THREE.IcosahedronGeometry(r, 1), mat('#8792a6', { flatShading: true })); s.position.set(x, y, 0); s.castShadow = true; cloud.add(s); }); }
const drops = []; for (let i = 0; i < 8; i++) { const d = rb(.06, .26, .06, '#74c0fc', .03); cloud.add(d); drops.push(d); }
scene.add(cloud);
// ticket
const ticket = panel(2.4, 1.15, '합격', { slab: '#f2b84b', fg: '#7a4a00', size: .58 }); scene.add(ticket);
const qm = panel(.9, .9, '?', { slab: '#ffffff', fg: '#1d2433', size: .7 }); scene.add(qm);
const unconf = panel(2.0, .8, '미확인', { slab: '#868e96', fg: '#ffffff', size: .44 }); scene.add(unconf);

// ---------- S4: big signs + room grid ----------
const cancelSign = panel(6.2, 1.7, '합격 취소 추진', { slab: '#e5484d', fg: '#ffffff', size: .9, d: .5 }); scene.add(cancelSign);
const surveySign = panel(7.6, 1.7, '국가자격시험 전수조사', { slab: '#1c7ed6', fg: '#ffffff', size: .8, d: .5 }); scene.add(surveySign);
const grid = new THREE.Group(); const gridRooms = [];
for (let i = 0; i < 8; i++) {
  const r = makeRoom(false, i); r.room.scale.setScalar(1);
  const gx = (i % 3 - 1) * 15 - 0, gz = -Math.floor(i / 3 + 1) * 13; // rooms behind main
  r.room.position.set(gx + (i >= 6 ? 7.5 : 0), 0, gz);
  const chk = panel(2.4, 2.4, '✓', { slab: '#2f9e77', fg: '#fff', size: 1.8 }); chk.position.set(0, 7, 0); r.room.add(chk); r.chk = chk;
  grid.add(r.room); gridRooms.push(r);
}
scene.add(grid);
const lens = new THREE.Group();
{ const ring = new THREE.Mesh(new THREE.TorusGeometry(2.4, .35, 16, 48), mat('#2b2f3a', { metalness: .3, roughness: .4 })); ring.castShadow = true;
  const glass = new THREE.Mesh(new THREE.CircleGeometry(2.3, 48), new THREE.MeshStandardMaterial({ color: '#dff3ff', transparent: true, opacity: .28, roughness: .05 }));
  const handle = rb(.6, 3.2, .6, '#e5484d', .25); handle.position.set(0, -4.0, 0);
  lens.add(ring, glass, handle); }
scene.add(lens);

// ---------- S5: gates ----------
const gates = new THREE.Group(); gates.position.set(60, 0, 0); scene.add(gates);
gates.add(at(rb(12, .5, 30, '#dfe4ea', .12), 0, -.25, 0));
gates.add(at(rb(1.6, .06, 28, '#4b5563', .03), 0, .03, 0)); // track
const gateLights = [];
[[-5, '1차'], [3, '2차']].forEach(([x, l]) => {
  const g = new THREE.Group(); g.position.z = x;
  g.add(at(rb(.6, 5, 2.2, '#f8f9fa', .2), -2.2, 2.5, 0), at(rb(.6, 5, 2.2, '#f8f9fa', .2), 2.2, 2.5, 0), at(rb(5, .9, 2.2, '#f8f9fa', .2), 0, 5.2, 0));
  const lab = panel(2.2, 1.0, l, { slab: '#1d2433', fg: '#fff', size: .6 }); lab.position.set(0, 5.2, 1.15); g.add(lab);
  const light = new THREE.Mesh(new THREE.SphereGeometry(.28, 16, 12), new THREE.MeshBasicMaterial({ color: '#2fd36b', toneMapped: false })); light.position.set(1.4, 5.2, 1.2); g.add(light); gateLights.push(light);
  gates.add(g);
});
const passBox = panel(3.2, 1.3, '합격', { slab: '#f2b84b', fg: '#7a4a00', size: .7, d: .6 }); passBox.position.set(0, .65, 10); gates.add(passBox);
const aiCube = rb(1.1, 1.1, 1.1, new THREE.MeshStandardMaterial({ color: '#5CF0C4', emissive: '#2fd6a3', emissiveIntensity: 1.3, roughness: .3 }), .2);
{ const l = textPlane(1, .5, 'AI', { fg: '#0d3b30', size: .4 }); l.position.z = .56; aiCube.add(l); }
gates.add(aiCube);
const bigQ = panel(2.2, 2.2, '?', { slab: '#FFD23F', fg: '#1d2433', size: 1.7, d: .4 }); gates.add(bigQ);

// ---------- S6: score bars ----------
const bars = new THREE.Group(); bars.position.set(120, 0, 0); bars.rotation.y = .62; scene.add(bars);
bars.add(at(rb(22, .5, 8, '#e9ecef', .12), 0, -.25, 0));
const barH = [3.2, 4.1, 4.9, 5.35, 5.55, 5.8, 6.4, 8.2], barObjs = [];
barH.forEach((h, i) => {
  const isAce = i === 7; const b = rb(1.35, h, 1.35, isAce ? new THREE.MeshStandardMaterial({ color: '#5CF0C4', emissive: '#2fd6a3', emissiveIntensity: .7 }) : HOODS[i], .14);
  b.position.set((i - 3.5) * 1.8, h / 2, 0); bars.add(b);
  const s = student(isAce ? '#2b2f3a' : HOODS[(i + 3) % 9]); s.root.scale.setScalar(.7); s.root.position.set((i - 3.5) * 1.8, h, 0); bars.add(s.root);
  barObjs.push({ b, s, h });
});
const cutPlane = new THREE.Mesh(new THREE.BoxGeometry(15.5, .08, 3.0), new THREE.MeshBasicMaterial({ color: '#ff4d4f', transparent: true, opacity: .85, toneMapped: false }));
cutPlane.position.set(0, 5.6, 0); bars.add(cutPlane);
const cutLab = panel(2.6, .9, '합격선', { slab: '#e5484d', fg: '#fff', size: .5 }); cutLab.position.set(-8.6, 5.6, 0); bars.add(cutLab);
const lens2 = lens.clone(); bars.add(lens2);

// ---------- S7: door & queue ----------
const doorSet = new THREE.Group(); doorSet.position.set(180, 0, 0); scene.add(doorSet);
doorSet.add(at(rb(20, .5, 9, '#d9c2a3', .12), 0, -.25, 0));
doorSet.add(at(rb(20, 7, .5, '#f3e7d3', .12), 0, 3.5, -3));
doorSet.add(at(rb(3.6, 5.4, .3, '#8a5a35', .1), 3, 2.7, -2.7)); // frame
const doorHole = rb(3.0, 5.0, .1, '#2b2230', .05); doorHole.position.set(3, 2.5, -2.55); doorSet.add(doorHole);
const doorPivot = new THREE.Group(); doorPivot.position.set(1.5, 0, -2.45); doorSet.add(doorPivot);
const door = rb(3.0, 5.0, .22, '#4fa3a5', .08); door.position.set(1.5, 2.5, 0); doorPivot.add(door);
{ const l = panel(2.0, .8, '합격', { slab: '#f2b84b', fg: '#7a4a00', size: .5 }); l.position.set(1.5, 3.9, .16); doorPivot.add(l);
  const k = new THREE.Mesh(new THREE.SphereGeometry(.15, 12, 10), mat('#f2b84b', { metalness: .5 })); k.position.set(2.6, 2.4, .2); doorPivot.add(k); }
const queue = [0, 1, 2, 3].map(i => { const s = student(HOODS[(i * 2 + 1) % 9]); doorSet.add(s.root); return s; });
const ticket2 = panel(2.0, 1.0, '합격', { slab: '#f2b84b', fg: '#7a4a00', size: .5 }); doorSet.add(ticket2);
const qm2 = panel(1.0, 1.0, '?', { slab: '#ffffff', fg: '#1d2433', size: .75 }); doorSet.add(qm2);
const dotted = new THREE.Group(); for (let i = 0; i < 9; i++) { const d = new THREE.Mesh(new THREE.SphereGeometry(.09, 8, 6), new THREE.MeshBasicMaterial({ color: '#ffffff', toneMapped: false })); dotted.add(d); } doorSet.add(dotted);

// ---------- S8/S9: calendar, shield, comments ----------
const cal = new THREE.Group();
{ const b = rb(3.4, 3.8, .3, '#ffffff', .2); cal.add(b);
  const top = rb(3.4, 1.0, .34, '#e5484d', .2); top.position.y = 1.4; cal.add(top);
  const tl = textPlane(3, .8, '수능', { fg: '#fff', size: .55, emissive: true }); tl.position.set(0, 1.4, .19); cal.add(tl);
  const dl = textPlane(3.2, 2.4, 'D-3', { fg: '#1d2433', size: 1.5 }); dl.position.set(0, -.45, .16); cal.add(dl);
  [-1, 1].forEach(x => { const r = new THREE.Mesh(new THREE.TorusGeometry(.18, .05, 8, 16), mat('#2b2f3a')); r.position.set(x, 1.95, 0); cal.add(r); }); }
scene.add(cal);
const shield = new THREE.Group();
{ const sh = new THREE.Shape(); sh.moveTo(0, 1.3); sh.quadraticCurveTo(1.1, 1.2, 1.2, .9); sh.lineTo(1.1, -.2); sh.quadraticCurveTo(.8, -1.1, 0, -1.5); sh.quadraticCurveTo(-.8, -1.1, -1.1, -.2); sh.lineTo(-1.2, .9); sh.quadraticCurveTo(-1.1, 1.2, 0, 1.3);
  const m = new THREE.Mesh(new THREE.ExtrudeGeometry(sh, { depth: .35, bevelEnabled: true, bevelSize: .08, bevelThickness: .08, bevelSegments: 3 }), mat('#1c7ed6', { roughness: .45 })); m.castShadow = true; shield.add(m);
  const l = textPlane(2, 1.2, ['대책', '?'], { fg: '#fff', size: .5, lh: 1.1 }); l.position.z = .46; shield.add(l); }
scene.add(shield);
const comments = [0, 1, 2, 3, 4].map(i => { const g = new THREE.Group(); const b = rb(1.7, 1.05, .3, '#ffffff', .3); g.add(b); const tail = new THREE.Mesh(new THREE.ConeGeometry(.22, .45, 4), mat('#ffffff')); tail.position.set(-.45, -.6, 0); tail.rotation.z = .5; g.add(tail); const d = textPlane(1.4, .7, ['• • •', '?', '!', '• • •', '?'][i], { fg: ['#1d2433', '#e5484d', '#1c7ed6', '#2f9e77', '#f08c3a'][i], size: .5 }); d.position.z = .16; g.add(d); scene.add(g); return g; });

// ---------- captions / ui ----------
function parse(str) { return str.replace(/\[(y|r|m):([^\]]+)\]/g, '<span class="$1">$2</span>'); }
const capEl = document.getElementById('cap'), titleEl = document.getElementById('title'), flashEl = document.getElementById('flash');
function ui(t) {
  let idx = -1; for (let i = 0; i < CAPS.length; i++) if (t >= CAPS[i][0]) idx = i;
  let html = '';
  if (idx >= 0) {
    const [st, txt] = CAPS[idx]; const p = clamp((t - st) / .22);
    html = `<div class="ln" style="opacity:${p};transform:translateY(${(1 - oB(p)) * 30}px) scale(${lerp(.92, 1, oB(p))})">${parse(txt)}</div>`;
  }
  capEl.innerHTML = html;
  const tp = 1 - P(t, 2.0, 2.4);
  titleEl.style.opacity = Math.min(P(t, .15, .5), tp);
  titleEl.innerHTML = `세무사 수석의<br>'AI 부정행위' 자수<span class="s">1·2차 모두 생성형 AI 사용</span>`;
  titleEl.style.transform = `translateY(${(1 - oB(P(t, .15, .6))) * 40}px)`;
  const cuts = [T.s3, T.s4, T.s5, T.s6, T.s7, T.s8]; let f = 0; cuts.forEach(c => { f = Math.max(f, 1 - Math.abs(t - c) / .12); });
  flashEl.style.opacity = f * .85;
}

// ---------- camera helper ----------
const tmpT = new THREE.Vector3();
function setCam(pos, tgt, fov = 30) { camera.position.set(...pos); tmpT.set(...tgt); camera.lookAt(tmpT); camera.fov = fov; camera.updateProjectionMatrix(); }
function mixCam(a, b, p) { return [0, 1, 2].map(i => lerp(a[i], b[i], p)); }
function show(o, v) { o.visible = v; }
function hp(o, u, v, s, ry = 0, rx = 0, rz = 0) { if (o.parent !== hud) { hud.add(o); o.traverse(m => { m.castShadow = false; m.receiveShadow = false; }); } const hh = 5 * Math.tan(camera.fov * Math.PI / 360), hw = hh * W / H; o.position.set(u * hw, v * hh, 0); o.scale.setScalar(Math.max(.0005, s * .5)); o.rotation.set(rx, ry, rz); }

// ---------- main render ----------
window.render = function (t) {
  const inRoom = t < T.s5 || t >= T.s8;
  main.room.visible = inRoom; grid.visible = t >= T.s4 && t < T.s5;
  gates.visible = t >= T.s5 && t < T.s6; bars.visible = t >= T.s6 && t < T.s7; doorSet.visible = t >= T.s7 && t < T.s8;
  [omr, badge, aiOrb, stamp, imprint, confess, phone, cloud, ticket, qm, unconf, cancelSign, surveySign, lens, cal, shield, bigQ, ticket2, qm2, ...bubbles, ...comments].forEach(o => o.visible = false);
  crown.visible = false; aceSpot.intensity = 0;
  sun.target.position.set(0, 0, 0); sun.position.set(-14, 22, 10);

  // clock: ticks each second; stops at s8b-0.6
  const stopAt = T.s8 + 1.6; const tt = Math.min(t, stopAt);
  const sec = Math.floor(tt) + oB(clamp((tt % 1) / .18)) * 1; clock.userData.s.rotation.z = -(sec / 60) * Math.PI * 2 - 1.2;
  clock.userData.m.rotation.z = -(10 + tt / 60) / 60 * Math.PI * 2 * 1 - 2.1; clock.userData.h.rotation.z = -1.0;

  // idle all kids
  main.kids.forEach((k, i) => { face(k, 'neutral', t + i * .7); k.head.rotation.set(Math.sin(t * 1.3 + i) * .04, 0, 0); k.armL.rotation.x = k.armR.rotation.x = -1.1 + Math.sin(t * 6 + i * 2) * .06; k.root.position.y = .25; });

  if (t < T.s3) {
    // ===== S0-S2: exam room, ace, OMR =====
    const pA = io(P(t, 0, T.s1));
    let cam = mixCam([16, 17, 22], [13, 13.5, 17], pA), tgt = [0, 2.6, 0];
    if (t >= T.s1) { const p = io(P(t, T.s1, T.s2)); cam = mixCam([13, 13.5, 17], [10, 11, 17], p); tgt = mixCam([0, 2.6, 0], [0.4, 1.6, 1.0], p); }
    if (t >= T.s2) { const p = io(P(t, T.s2, T.s2 + 1.2)); cam = mixCam([10, 11, 17], [6.5, 9.0, 15], p); tgt = mixCam([0.4, 1.6, 1.0], [0.4, 2.6, 2.5], p); }
    if (t >= T.stamp) { const sh = Math.max(0, 1 - (t - T.stamp - .25) / .4) * (t > T.stamp + .25 ? 1 : 0); cam = cam.map((v, i) => v + Math.sin(t * 80 + i) * .12 * sh); }
    setCam(cam, tgt, 30);
    // ace spotlight & crown
    aceSpot.intensity = lerp(0, 220, P(t, 1.0, 2.0));
    crown.visible = t > 2.6 && t < T.stamp + .3;
    crown.scale.setScalar(oB(P(t, 2.6, 3.0)) || .001);
    crown.rotation.y = t * 1.5;
    // OMR board
    if (t >= T.s1 - .2 && t < T.s2 + .6) {
      omr.visible = true;
      const e = oB(P(t, T.s1 - .2, T.s1 + .3)); const out = P(t, T.s2, T.s2 + .5);
      hp(omr, -.05, .36 + out * 1.4, .34 * e, .18, -.08, .03);
      const n = Math.floor(lerp(0, 160, clamp(P(t, T.s1 + .3, T.red - .1))));
      drawOMR(n, t >= T.red - .1, .5 + .5 * Math.sin(t * 12));
      badge.visible = t >= T.red;
      const be = oB(P(t, T.red, T.red + .35));
      hp(badge, 0, -.27 - out * 1.2, .33 * be, -.1, 0, -.04);
    }
    // AI orb & bubbles
    if (t >= T.s2) {
      aiOrb.visible = t < T.stamp + .4;
      const e = oB(P(t, T.s2 + .2, T.s2 + .7));
      const dk = main.desks[aceIdx].position;
      aiOrb.position.set(dk.x + 1.6, 3.6 + Math.sin(t * 3) * .12, dk.z + .2); aiOrb.scale.setScalar(Math.max(.001, e * (1 - P(t, T.stamp, T.stamp + .3))));
      aiOrb.userData.core.rotation.y = t * 1.8; aiOrb.userData.ring.rotation.z = t * 2;
      bubbles.forEach((b, i) => { const st = T.s2 + .6 + i * .45; b.visible = t > st && t < T.stamp + .3; const p = P(t, st, st + .35); b.position.set(dk.x + 1.6 + (i % 2 ? .8 : -.7), 4.5 + i * .65, dk.z + .2); b.scale.setScalar(Math.max(.001, oB(p))); b.lookAt(camera.position); });
      // stamp
      if (t >= T.stamp - .5) {
        stamp.visible = t < T.s3; const down = P(t, T.stamp - .5, T.stamp + .25), up = P(t, T.stamp + .55, T.stamp + 1.0);
        const y = lerp(6, 1.32, Math.pow(down, 3)) + up * 6;
        stamp.position.set(dk.x, y, dk.z); stamp.rotation.y = .2;
        imprint.visible = t >= T.stamp + .25; imprint.position.set(dk.x, 1.33, dk.z); imprint.rotation.z = -.2;
        if (t > T.stamp + .25) { face(ace, 'shock', t); ace.root.position.y = .25 + Math.max(0, Math.sin((t - T.stamp - .25) * 12) * .25 * (1 - P(t, T.stamp + .25, T.stamp + 1))); }
        main.kids.forEach((k, i) => { if (i !== aceIdx && t > T.stamp + .4) { face(k, 'shock', t); k.head.rotation.y = Math.atan2(dk.x - k.root.position.x, dk.z - k.root.position.z) * .5 * P(t, T.stamp + .4, T.stamp + .8); } });
      }
      if (t >= T.stamp + 1.1) {
        confess.visible = true; const p = oB(P(t, T.stamp + 1.1, T.stamp + 1.5));
        hp(confess, -.55, .32 + Math.sin(t * 2.5) * .01, .75 * p, .3, 0, .06);
        face(ace, 'sad', t); ace.head.rotation.x = .35 * P(t, T.stamp + 1.1, T.stamp + 1.6);
      }
    }
  } else if (t < T.s4) {
    // ===== S3: sad student w/ phone, ticket, unconfirmed =====
    const sk = sadK.root.position; const wp = new THREE.Vector3(); sadK.root.getWorldPosition(wp);
    imprint.visible = true; imprint.position.set(main.desks[aceIdx].position.x, 1.33, main.desks[aceIdx].position.z);
    const p = io(P(t, T.s3, T.s3 + 6));
    const cam = mixCam([wp.x + 6.5, wp.y + 7.5, wp.z + 13], [wp.x + 5.5, wp.y + 6.5, wp.z + 11], p);
    const pb = io(P(t, T.ticket, T.ticket + .8));
    const cam2 = mixCam(cam, [wp.x + 6, wp.y + 8.5, wp.z + 14], pb);
    setCam(cam2, [wp.x - 1.2, wp.y + 2.6 + pb * 1.2, wp.z], 32);
    // phone in hand, scrolling then stop
    sadK.armR.rotation.x = -1.6 + (t < T.stop ? Math.sin(t * 9) * .12 : 0); sadK.armR.rotation.z = .25;
    sadK.head.rotation.x = .25;
    phone.visible = true; const pe = oB(P(t, T.s3, T.s3 + .4));
    const po = P(t, T.ticket, T.ticket + .4); hp(phone, -.5 - po * 1.2, .3, .5 * pe, .35, 0, -.05);
    if (t >= T.stop) {
      face(sadK, 'sad', t); sadK.head.rotation.x = .25 + .2 * P(t, T.stop, T.stop + .6);
      cloud.visible = true; const ce = oB(P(t, T.stop + .2, T.stop + .7));
      cloud.position.set(wp.x, wp.y + 4.0 + Math.sin(t * 2) * .06, wp.z); cloud.scale.setScalar(Math.max(.001, ce * .8));
      drops.forEach((d, i) => { const k = ((t * 1.3 + hash(i) ) % 1); d.position.set((hash(i + 3) - .5) * 1.4, -.5 - k * 1.6, (hash(i + 7) - .5) * .6); d.scale.setScalar(1 - k * .6); });
      main.kids.forEach((k, i) => { if (i !== sadIdx && i !== aceIdx) { face(k, 'sad', t + i); k.head.rotation.x = .2; } });
    }
    if (t >= T.ticket) {
      ticket.visible = true; const te = oB(P(t, T.ticket, T.ticket + .45));
      hp(ticket, -.1, .5 + Math.sin(t * 2.2) * .015, .85 * te, -.2, 0, Math.sin(t * 1.7) * .05);
      qm.visible = t >= 16.0; const qe = oB(P(t, 16.0, 16.35)); hp(qm, .55, .62, .8 * qe, -.2, 0, Math.sin(t * 5) * .15);
      if (t >= T.unconf) { unconf.visible = true; const ue = P(t, T.unconf, T.unconf + .25); hp(unconf, .3, .34, .6 * lerp(1.8, 1, ue), -.2, 0, -.18); unconf.position.z = .2; }
    }
  } else if (t < T.s5) {
    // ===== S4: cancel sign drop + pullback over many rooms =====
    imprint.visible = true; imprint.position.set(main.desks[aceIdx].position.x, 1.33, main.desks[aceIdx].position.z);
    main.kids.forEach((k, i) => { face(k, i === aceIdx ? 'sad' : 'worry', t + i); });
    const dropP = P(t, T.s4 + .1, T.s4 + .9);
    cancelSign.visible = true; const cOut = P(t, T.survey - .3, T.survey + .3); hp(cancelSign, 0, lerp(1.4, .5, bounce(dropP)) + cOut * 1.5, .42, -.08, 0, Math.sin(t * 2) * .02);
    const pull = io(P(t, T.survey - .3, T.survey + 2.2));
    const cam = mixCam([3, 9, 20], [6, 46, 34], pull);
    const tgt = mixCam([0, 4, 0], [0, 0, -18], pull);
    setCam(cam, tgt, 32);
    sun.shadow.camera.left = -16;
    if (t >= T.survey) {
      surveySign.visible = true; const se = oB(P(t, T.survey, T.survey + .5));
      hp(surveySign, 0, .55, .34 * se, -.06, 0, 0);
      // lens sweep over rooms
      lens.visible = true; const sw = P(t, T.survey + 1.2, T.s5 - .2);
      const path = gridRooms.map(r => r.room.position);
      const fi = sw * (path.length - 1), i0 = Math.floor(fi), f = fi - i0;
      const a = path[Math.min(i0, path.length - 1)], b = path[Math.min(i0 + 1, path.length - 1)];
      lens.position.set(lerp(a.x, b.x, io(f)), 10, lerp(a.z, b.z, io(f)) + 2); lens.rotation.set(-1.0, 0, .4); lens.scale.setScalar(1.6);
      gridRooms.forEach((r, i) => { const ct = T.survey + 1.2 + (i / (path.length - 1)) * (T.s5 - .2 - T.survey - 1.2) + .3; r.chk.visible = t > ct; r.chk.scale.setScalar(Math.max(.001, oB(P(t, ct, ct + .3)))); r.chk.lookAt(camera.position); });
    }
  } else if (t < T.s6) {
    // ===== S5: two gates, AI cube passes =====
    const lt = t - T.s5;
    setCam([60 + lerp(6, 8, P(t, T.s5, T.s6)), 21, lerp(22, 20, P(t, T.s5, T.s6))], [60, 1.5, -1.5], 34);
    sun.target.position.set(60, 0, 0); sun.position.set(46, 22, 10);
    const x = lerp(-13, 10, io(P(t, T.s5 + .2, T.s5b + .9)));
    const hop = Math.abs(Math.sin(lt * 7)) * .4 * (x < 10 ? 1 : 0);
    aiCube.position.set(0, .55 + hop + (x >= 9.9 ? 1.3 : 0), x); aiCube.rotation.y = lt * 2;
    gateLights.forEach((l, i) => { const gx = i ? 3 : -5; const near = Math.abs(x - gx) < 1.4; l.material.color.set(near ? '#7dff9e' : '#2fd36b'); l.scale.setScalar(near ? 1.5 : 1); });
    bigQ.visible = t >= T.s5b; const qe = oB(P(t, T.s5b, T.s5b + .4)); hp(bigQ, .35, .45 + Math.sin(t * 3) * .015, .55 * qe, -.3, 0, Math.sin(t * 4) * .12);
  } else if (t < T.s7) {
    // ===== S6: score bars + cut line + lens =====
    sun.target.position.set(120, 0, 0); sun.position.set(106, 22, 10);
    const p = io(P(t, T.s6, T.s7));
    setCam([120 + lerp(-12, -6, p), lerp(13, 15, p), lerp(26, 24, p)], [120 + lerp(-.5, 1, p), 4.6, 0], 32);
    barObjs.forEach((o, i) => {
      const grow = oB(P(t, T.s6 + i * .08, T.s6 + .5 + i * .08));
      o.b.scale.y = Math.max(.001, grow); o.b.position.y = o.h * grow / 2;
      const near = Math.abs(o.h - 5.6) < .45 && t > T.s6b;
      const wob = near ? Math.sin(t * 14 + i) * .08 : 0; o.b.rotation.z = wob;
      o.s.root.position.y = o.h * grow; face(o.s, near ? 'worry' : (i === 7 ? 'neutral' : 'neutral'), t + i);
    });
    cutPlane.material.opacity = .85 * P(t, T.s6 + .8, T.s6 + 1.1); cutLab.scale.setScalar(Math.max(.001, oB(P(t, T.s6 + .9, T.s6 + 1.3))));
    lens2.visible = t > T.s6b; const lp = P(t, T.s6b, T.s7);
    lens2.position.set(lerp(-1.5, 3.5, io(lp)) + Math.sin(t * 3) * .3, 7.8, 3); lens2.rotation.set(0, 0, .5); lens2.scale.setScalar(.75 * oB(P(t, T.s6b, T.s6b + .4)) + .001);
  } else if (t < T.s8) {
    // ===== S7: door closes on the last student; ticket floats with ? =====
    sun.target.position.set(180, 0, 0); sun.position.set(166, 22, 10);
    const p = io(P(t, T.s7, T.s8));
    setCam([180 + lerp(-5, -3, p), lerp(9, 9.5, p), lerp(24, 22, p)], [180 + lerp(-.5, -1, p), 3.0, -1], 32);
    queue.forEach((s, i) => {
      const startX = -6 - i * 1.9; const walk = P(t, T.s7 + .1 + i * .25, T.s7 + 2.2 + i * .25);
      let x = lerp(startX, 3 - (i === 3 ? 0 : 0), io(walk)), z = lerp(0, -2.4, P(walk, .75, 1)); let vis = true;
      if (i === 3) { x = lerp(startX, -1.0, io(P(t, T.s7 + .5, T.s7 + 2.7))); z = 0; }
      if (i < 3 && walk >= 1) vis = false;
      s.root.visible = vis; s.root.position.set(x, 0, z);
      s.root.rotation.y = i === 3 && t > T.s7 + 3 ? lerp(Math.PI / 2, 0, P(t, T.s7 + 3, T.s7 + 3.4)) : Math.PI / 2 * (walk < 1 ? 1 : 0) + (i === 3 ? 0 : 0);
      if (i === 3 && t < T.s7 + 3) s.root.rotation.y = Math.PI / 2;
      const step = Math.sin(t * 12 + i) * .5 * ((i < 3 ? walk > 0 && walk < 1 : t < T.s7 + 2.7) ? 1 : 0);
      s.legs.children[0].rotation.x = step; s.legs.children[1].rotation.x = -step; s.armL.rotation.x = -step * .6; s.armR.rotation.x = step * .6;
      face(s, i === 3 && t > T.s7 + 3.0 ? 'sad' : 'neutral', t + i);
    });
    const close = P(t, T.s7 + 2.7, T.s7 + 3.0);
    doorPivot.rotation.y = lerp(-1.4, 0, bounce(close));
    ticket2.visible = qm2.visible = t >= T.s7b; dotted.visible = t >= T.s7b;
    if (t >= T.s7b) {
      const tp = io(P(t, T.s7b, T.s7b + 1.2));
      const A = new THREE.Vector3(3, 6.2, -1), B = new THREE.Vector3(-1, 3.4, .5);
      const pos = A.clone().lerp(B, tp * .55); pos.y += Math.sin(tp * Math.PI) * 1.2 + Math.sin(t * 3) * .1;
      ticket2.position.copy(pos); ticket2.rotation.z = Math.sin(t * 2) * .1; ticket2.scale.setScalar(Math.max(.001, oB(P(t, T.s7b, T.s7b + .4))));
      qm2.position.copy(pos).add(new THREE.Vector3(1.3, .9, .2)); qm2.scale.setScalar(Math.max(.001, oB(P(t, T.s7b + .9, T.s7b + 1.3)))); qm2.rotation.z = Math.sin(t * 5) * .15;
      dotted.children.forEach((d, i) => { const k = i / 8; const q = A.clone().lerp(B, k); q.y += Math.sin(k * Math.PI) * 1.2; d.position.copy(q); d.visible = k > tp * .55 && t > T.s7b + .9; });
    }
  } else {
    // ===== S8/S9: back in room, calendar, clock stops, shield, comments =====
    imprint.visible = false;
    const p = io(P(t, T.s8, T.s9));
    let cam = mixCam([11, 10, 17], [8, 8, 14.5], p), tgt = [1.5, 3.5, -2];
    if (t >= T.s9) { const q = io(P(t, T.s9, T.s9 + 1.2)); cam = mixCam(cam, [10, 12, 19], q); tgt = mixCam(tgt, [0, 2.5, 0], q); }
    setCam(cam, tgt, 32);
    cal.visible = true; const ce = oB(P(t, T.s8 + .1, T.s8 + .55));
    const up9 = P(t, T.s9, T.s9 + .5); hp(cal, -.45, .42 + Math.sin(t * 2) * .012 + up9 * 1.3, .48 * ce, .35, 0, Math.sin(t * 1.5) * .03);
    if (t >= T.s8 + 1.6) { clock.scale.setScalar(1 + .12 * Math.max(0, 1 - (t - T.s8 - 1.6) / .3)); }
    main.kids.forEach((k, i) => { face(k, 'worry', t + i); });
    if (t >= T.s8b) { shield.visible = true; const se = oB(P(t, T.s8b, T.s8b + .45)); hp(shield, .52, .4 + Math.sin(t * 2.4) * .012 + P(t, T.s9, T.s9 + .5) * 1.3, .5 * se, -.3 + Math.sin(t * 2) * .1, 0, 0); }
    if (t >= T.s9) {
      
      main.kids.forEach((k, i) => { const r = oB(P(t, T.s9 + .1 + i * .07, T.s9 + .45 + i * .07)); k.armR.rotation.x = lerp(-1.1, -3.0, r); k.armR.rotation.z = lerp(0, .25, r); face(k, 'happy', t + i); k.head.rotation.x = -.1; });
      comments.forEach((c, i) => { const ci = [0, 2, 4, 6, 8][i]; const k = main.kids[ci]; const wp = new THREE.Vector3(); k.root.getWorldPosition(wp);
        const st = T.s9 + .4 + i * .18; c.visible = t > st; c.position.set(wp.x + .9, wp.y + 4.3 + Math.sin(t * 2.5 + i) * .12, wp.z); c.scale.setScalar(Math.max(.001, oB(P(t, st, st + .35)) * 1.15)); c.lookAt(camera.position); });
    }
  }
  composer.render();
  ui(t);
};
window.DURATION = T.end;
// re-draw text textures now that fonts are loaded is unnecessary: textures created after load? ensure by rebuilding below
window.READY = true;
const q = new URLSearchParams(location.search); window.render(q.get('t') ? +q.get('t') : 0);
