import * as THREE from 'three';

const mount = document.querySelector('#game-view');
const playerHpText = document.querySelector('#player-hp-text');
const enemyHpText = document.querySelector('#enemy-hp-text');
const playerHpBar = document.querySelector('#player-hp-bar');
const enemyHpBar = document.querySelector('#enemy-hp-bar');
const toast = document.querySelector('#toast');
const startScreen = document.querySelector('#start-screen');
const endScreen = document.querySelector('#end-screen');
const startButton = document.querySelector('#start-button');
const restartButton = document.querySelector('#restart-button');
const endTitle = document.querySelector('#end-title');
const endMessage = document.querySelector('#end-message');
const endIcon = document.querySelector('#end-icon');

const scene = new THREE.Scene();
scene.background = new THREE.Color(0xaed9e9);
scene.fog = new THREE.Fog(0xaed9e9, 24, 62);

const camera = new THREE.PerspectiveCamera(48, 1, 0.1, 120);
camera.position.set(7, 9, 15);

const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.8));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.12;
mount.appendChild(renderer.domElement);

const hemi = new THREE.HemisphereLight(0xe8f6ff, 0x617a48, 2.0);
scene.add(hemi);
const sun = new THREE.DirectionalLight(0xffedcf, 2.4);
sun.position.set(-9, 16, 8);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
sun.shadow.camera.left = -24; sun.shadow.camera.right = 24;
sun.shadow.camera.top = 24; sun.shadow.camera.bottom = -24;
sun.shadow.bias = -0.0003;
scene.add(sun);

const mats = {};
function mat(name, color, roughness = 0.8, metalness = 0) {
  if (!mats[name]) mats[name] = new THREE.MeshStandardMaterial({ color, roughness, metalness });
  return mats[name];
}
function box(parent, w, h, d, material, x, y, z, opts = {}) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material);
  mesh.position.set(x, y, z);
  mesh.castShadow = opts.castShadow ?? true;
  mesh.receiveShadow = opts.receiveShadow ?? true;
  if (opts.rotation) mesh.rotation.set(...opts.rotation);
  parent.add(mesh);
  return mesh;
}
function ball(parent, rx, ry, rz, material, x, y, z, segments = 18) {
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(1, segments, Math.max(10, Math.floor(segments * .7))), material);
  mesh.scale.set(rx, ry, rz);
  mesh.position.set(x, y, z);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
}
function cylinder(parent, rt, rb, h, material, x, y, z, radial = 12) {
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, radial), material);
  mesh.position.set(x, y, z);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
}
function tubeBetween(parent, start, end, radius, material, radial = 10) {
  const a = new THREE.Vector3(...start), b = new THREE.Vector3(...end);
  const diff = new THREE.Vector3().subVectors(b, a);
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, diff.length(), radial), material);
  mesh.position.copy(a).add(b).multiplyScalar(.5);
  mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), diff.normalize());
  mesh.castShadow = true;
  parent.add(mesh);
  return mesh;
}
function torus(parent, radius, tube, material, x, y, z, scaleX = 1, scaleZ = 1) {
  const mesh = new THREE.Mesh(new THREE.TorusGeometry(radius, tube, 8, 28), material);
  mesh.rotation.x = Math.PI / 2;
  mesh.position.set(x, y, z);
  mesh.scale.set(scaleX, 1, scaleZ);
  parent.add(mesh);
  return mesh;
}

// --- School-road environment ---
const grass = new THREE.Mesh(new THREE.PlaneGeometry(90, 90), mat('grass', 0x65a85c));
grass.rotation.x = -Math.PI / 2; grass.position.y = -0.04; grass.receiveShadow = true; scene.add(grass);
const path = new THREE.Mesh(new THREE.PlaneGeometry(9, 46), mat('path', 0xb8b9ad));
path.rotation.x = -Math.PI / 2; path.position.set(0, 0.005, -3); path.receiveShadow = true; scene.add(path);
// Road seams and small paving details.
for (let z = -23; z <= 17; z += 4) {
  box(scene, 8.8, .025, .055, mat('pathline', 0xa6aa9f), 0, .025, z - 3, { castShadow: false });
}
for (const x of [-4.65, 4.65]) {
  box(scene, .32, .16, 47, mat('curb', 0xe0dfce), x, .08, -3, { castShadow: false });
}
// School entrance gate and sign in the distance.
for (const x of [-3.3, 3.3]) {
  box(scene, .48, 3.2, .48, mat('gatewood', 0x9a7048), x, 1.6, -23, {});
  box(scene, .58, .18, .58, mat('gatecap', 0xd8ad6b), x, 3.25, -23, {});
}
box(scene, 6.5, .55, .32, mat('signwood', 0x855d3b), 0, 3.0, -23, {});
box(scene, 6.1, .42, .12, mat('signface', 0xf2d99c), 0, 3.0, -22.79, {});
function makeTextTexture(lines, options = {}) {
  const canvas = document.createElement('canvas');
  canvas.width = options.width || 1024; canvas.height = options.height || 512;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = options.background || '#f2d99c'; ctx.fillRect(0, 0, canvas.width, canvas.height);
  if (options.border) { ctx.strokeStyle = options.border; ctx.lineWidth = 16; ctx.strokeRect(12, 12, canvas.width - 24, canvas.height - 24); }
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  const arr = Array.isArray(lines) ? lines : [lines];
  arr.forEach((line, i) => {
    ctx.fillStyle = options.color || '#284c42';
    ctx.font = `${options.weight || 900} ${options.fontSize || 90}px sans-serif`;
    ctx.fillText(line, canvas.width / 2, canvas.height * (i + 1) / (arr.length + 1));
  });
  const tex = new THREE.CanvasTexture(canvas); tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}
const signTexture = makeTextTexture(['송일초 등굣길'], { background: '#f2d99c', color: '#315448', fontSize: 112, border: '#b1834b' });
const signMesh = new THREE.Mesh(new THREE.PlaneGeometry(5.95, .38), new THREE.MeshStandardMaterial({ map: signTexture, roughness: .8 }));
signMesh.position.set(0, 3.0, -22.72); scene.add(signMesh);
// A simple school building silhouette behind the gate.
box(scene, 14, 5.5, 2.5, mat('schoolwall', 0xe8dfc9), 0, 2.7, -25.2, {});
box(scene, 14.2, .45, 2.7, mat('schoolroof', 0x648d91), 0, 5.55, -25.2, {});
for (let x = -5.3; x <= 5.31; x += 2.1) {
  box(scene, 1.15, 1.3, .08, mat('window', 0x94c7d2, .25), x, 3.5, -23.9, { castShadow: false });
  box(scene, 1.2, .08, .1, mat('windowframe', 0xf7f0dc), x, 3.5, -23.84, { castShadow: false });
}
// Trees and hedges along the route.
function tree(x, z, size = 1) {
  const g = new THREE.Group(); g.position.set(x, 0, z); g.scale.setScalar(size); scene.add(g);
  cylinder(g, .15, .23, 1.35, mat('bark', 0x79563d), 0, .68, 0, 9);
  ball(g, .82, .9, .8, mat('leaf1', 0x4f8e57), 0, 1.72, 0, 14);
  ball(g, .56, .63, .6, mat('leaf2', 0x6ba965), -.32, 1.95, -.12, 14);
  ball(g, .55, .65, .55, mat('leaf3', 0x3f7b4c), .35, 1.9, .12, 14);
}
for (const [x,z,s] of [[-8,-19,1.1],[8,-20,1.2],[-8,-9,1],[8,-10,1.05],[-8,3,1.1],[8,5,1.15],[-7,15,.9],[7,16,.95]]) tree(x,z,s);
for (const side of [-1,1]) {
  for (let z = -18; z < 15; z += 2.2) {
    const hedge = box(scene, 1.2, .55, 1.7, mat('hedge', 0x4e874f), side * 6.1, .28, z, {});
    hedge.rotation.y = (z % 2) * .05;
  }
}
// Tiny flowers on the grass for a friendly Animal-Crossing-like mood.
for (let i = 0; i < 24; i++) {
  const x = (i % 2 ? 1 : -1) * (5.5 + (i % 4) * .65);
  const z = -17 + Math.floor(i / 2) * 2.7;
  cylinder(scene, .025, .03, .16, mat('flowerstem', 0x387d48), x, .08, z, 6);
  ball(scene, .07, .07, .07, mat('flower', i % 3 === 0 ? 0xf5df75 : 0xf6f0ee), x, .18, z, 8);
}

// --- Jaeseok: a small, stylized 3D avatar based on the provided photo ---
function makePlayer() {
  const root = new THREE.Group();
  root.position.set(0, 0, 6.0);
  scene.add(root);
  const model = new THREE.Group(); root.add(model);
  // Lower body: dark loose pants and white trainers with black stripes / blue socks.
  const pants = mat('pants', 0x17191f);
  const skin = mat('skin', 0xf1c4a4);
  const shoe = mat('shoe', 0xe9edf0, .45);
  const sole = mat('sole', 0x303944);
  const sock = mat('sock', 0x1684d2);
  const shirt = mat('shirt', 0x454e5a);
  const stripe = mat('shirtstripe', 0xc6c8c4);
  const mint = mat('mint', 0x9eb8ad);
  const hair = mat('hair', 0x17191d, .48);
  const glasses = new THREE.MeshStandardMaterial({ color: 0x17191d, roughness: .28, metalness: .22 });
  const lens = new THREE.MeshStandardMaterial({ color: 0x8eafbc, roughness: .12, metalness: .12, transparent: true, opacity: .22 });

  const leftLeg = new THREE.Group(); leftLeg.position.set(-.16, .48, 0); model.add(leftLeg);
  const rightLeg = new THREE.Group(); rightLeg.position.set(.16, .48, 0); model.add(rightLeg);
  for (const leg of [leftLeg, rightLeg]) {
    cylinder(leg, .125, .145, .43, pants, 0, -.20, 0, 12);
    cylinder(leg, .105, .11, .13, sock, 0, -.45, -.005, 12);
    ball(leg, .17, .095, .27, shoe, 0, -.52, -.12, 14);
    box(leg, .28, .055, .43, sole, 0, -.59, -.1, {});
    // Three dark trainer stripes.
    for (let j = -1; j <= 1; j++) {
      const mark = box(leg, .038, .012, .20, glasses, j * .075, -.445, -.17, { castShadow: false });
      mark.rotation.y = -.23;
    }
  }

  const torso = new THREE.Group(); torso.position.y = .77; model.add(torso);
  ball(torso, .34, .34, .23, shirt, 0, 0, 0, 20);
  // Hem and horizontal stripes around the rounded shirt.
  for (let i = 0; i < 5; i++) {
    const y = -.23 + i * .105;
    const ring = torus(torso, .285 - Math.abs(y) * .1, .018, stripe, 0, y, 0, 1.08, .72);
    ring.material = stripe;
  }
  torus(torso, .235, .038, mint, 0, .285, 0, 1, .78);
  // Chest patch reminiscent of the small clothing label in the photo.
  box(torso, .2, .085, .018, mat('patch', 0x9e8055), .07, -.03, -.232, { castShadow: false });

  const leftArm = new THREE.Group(); leftArm.position.set(-.31, .98, 0); model.add(leftArm);
  const rightArm = new THREE.Group(); rightArm.position.set(.31, .98, 0); model.add(rightArm);
  for (const [arm, side] of [[leftArm,-1],[rightArm,1]]) {
    const shoulder = [0, 0, 0]; const elbow = [side * .12, -.27, -.02]; const wrist = [side * .1, -.48, -.11];
    tubeBetween(arm, shoulder, elbow, .125, shirt, 12);
    tubeBetween(arm, elbow, wrist, .105, shirt, 12);
    ball(arm, .12, .12, .12, shirt, ...elbow, 12);
    // Pale cuffs stand out on the striped long sleeves.
    tubeBetween(arm, [side*.12,-.40,-.07], wrist, .112, mint, 12);
    ball(arm, .105, .105, .1, skin, side*.1, -.53, -.12, 12);
    // Narrow light sleeve bands.
    tubeBetween(arm, [side*.07,-.18,-.01], [side*.10,-.205,-.015], .127, stripe, 10);
  }

  // Neck, head and small Animal-Crossing-inspired features (smaller eyes).
  cylinder(model, .105, .12, .16, skin, 0, 1.05, 0, 12);
  const head = new THREE.Group(); head.position.set(0, 1.30, -.005); model.add(head);
  ball(head, .365, .385, .315, skin, 0, 0, 0, 24);
  ball(head, .07, .105, .055, skin, -.36, -.02, 0, 12);
  ball(head, .07, .105, .055, skin, .36, -.02, 0, 12);
  // Hair cap plus separated, slightly wavy fringe locks.
  ball(head, .385, .27, .345, hair, 0, .205, .025, 24);
  ball(head, .345, .16, .30, hair, 0, .105, -.205, 20);
  for (let i = 0; i < 11; i++) {
    const x = -.32 + i * .064;
    const offset = Math.sin(i * 1.7) * .018;
    const lock = ball(head, .046, .145 + (i % 3) * .012, .075, hair, x, -.035 + offset, -.285, 12);
    lock.rotation.z = (i - 5) * .035;
  }
  // Side locks near the ears.
  for (const side of [-1,1]) {
    const lock = ball(head, .075, .18, .09, hair, side*.32, -.16, -.12, 12);
    lock.rotation.z = -side*.12;
  }
  // Face details; eye scale intentionally restrained.
  for (const side of [-1,1]) {
    ball(head, .034, .042, .025, mat('eye', 0x252329), side*.135, -.045, -.298, 12);
    ball(head, .011, .013, .008, mat('eyehighlight', 0xffffff), side*.125, -.03, -.319, 8);
  }
  ball(head, .035, .025, .045, skin, 0, -.11, -.312, 10);
  // Black round-rim glasses and bridge.
  for (const side of [-1,1]) {
    const rim = new THREE.Mesh(new THREE.TorusGeometry(.125, .018, 9, 28), glasses);
    rim.position.set(side*.137, -.035, -.325); head.add(rim);
    const glass = new THREE.Mesh(new THREE.CircleGeometry(.108, 24), lens);
    glass.position.set(side*.137, -.035, -.327); head.add(glass);
    tubeBetween(head, [side*.245,-.025,-.305], [side*.37,-.005,-.17], .013, glasses, 8);
  }
  tubeBetween(head, [-.025,-.025,-.333], [.025,-.025,-.333], .014, glasses, 8);
  // Small mouth.
  const mouth = new THREE.Mesh(new THREE.TorusGeometry(.045, .008, 6, 16, Math.PI), mat('mouth', 0x80564d));
  mouth.position.set(0, -.205, -.304); mouth.rotation.z = Math.PI; head.add(mouth);

  // Sword pivot attaches near the right hand. The prop from the photo is intentionally omitted.
  const swordPivot = new THREE.Group(); swordPivot.position.set(.49, .72, -.16); model.add(swordPivot);
  const hilt = cylinder(swordPivot, .035, .04, .2, mat('swordgrip', 0x684631), 0, 0, 0, 8);
  hilt.rotation.z = Math.PI / 2;
  box(swordPivot, .22, .055, .07, mat('swordguard', 0xd9b65d, .34, .55), 0, .12, 0, {});
  const blade = new THREE.Mesh(new THREE.BoxGeometry(.095, .48, .035), new THREE.MeshStandardMaterial({ color: 0xbfd4dc, metalness: .78, roughness: .2 }));
  blade.position.set(0, .4, 0); blade.castShadow = true; swordPivot.add(blade);
  const point = new THREE.Mesh(new THREE.ConeGeometry(.068, .16, 4), new THREE.MeshStandardMaterial({ color: 0xdcebf0, metalness: .72, roughness: .2 }));
  point.position.set(0, .72, 0); point.rotation.y = Math.PI / 4; swordPivot.add(point);
  const pommel = ball(swordPivot, .055, .055, .055, mat('pommel', 0xe1bf69, .3, .6), 0, -.12, 0, 10);
  // Avatar scale: about 1.4 units tall, with a slightly oversized cozy head.
  model.scale.setScalar(.78);

  const shadow = new THREE.Mesh(new THREE.CircleGeometry(.47, 24), new THREE.MeshBasicMaterial({ color: 0x1b2930, transparent: true, opacity: .25, depthWrite: false }));
  shadow.rotation.x = -Math.PI/2; shadow.position.y = .012; root.add(shadow);
  return { root, model, leftArm, rightArm, leftLeg, rightLeg, swordPivot, head, shadow };
}
const player = makePlayer();

// --- The first enemy: an original, easy 6th-grade first-semester math workbook ---
function makeWorkbook() {
  const root = new THREE.Group(); root.position.set(0, 0, -.8); scene.add(root);
  const model = new THREE.Group(); root.add(model);
  const coverMat = mat('bookcover', 0x236a78, .64);
  const pagesMat = mat('bookpages', 0xf3eedf, .9);
  const spineMat = mat('bookspine', 0x164c5a, .7);
  box(model, 1.42, 1.78, .31, pagesMat, 0, .95, 0, {});
  box(model, 1.48, 1.84, .12, spineMat, 0, .95, -.205, {});
  box(model, .09, 1.77, .34, mat('bookedge', 0xf0b85b), -.69, .95, -.01, {});
  const coverCanvas = document.createElement('canvas'); coverCanvas.width = 768; coverCanvas.height = 1024;
  const cx = coverCanvas.getContext('2d');
  const grad = cx.createLinearGradient(0, 0, 768, 1024); grad.addColorStop(0, '#3d94a1'); grad.addColorStop(1, '#175469');
  cx.fillStyle = grad; cx.fillRect(0,0,768,1024);
  cx.fillStyle = '#f3d47a'; cx.beginPath(); cx.roundRect(42,42,684,940,32); cx.fill();
  cx.fillStyle = '#247584'; cx.beginPath(); cx.roundRect(58,58,652,908,25); cx.fill();
  cx.fillStyle = '#eaf4e8'; cx.font = '900 44px sans-serif'; cx.textAlign = 'center'; cx.fillText('초등 수학', 384, 150);
  cx.fillStyle = '#fff4c8'; cx.font = '900 118px sans-serif'; cx.fillText('6-1', 384, 315);
  cx.fillStyle = '#ffffff'; cx.font = '900 82px sans-serif'; cx.fillText('기본', 384, 430);
  cx.fillStyle = '#f8d879'; cx.beginPath(); cx.roundRect(138,500,492,72,24); cx.fill();
  cx.fillStyle = '#244f58'; cx.font = '700 34px sans-serif'; cx.fillText('개념부터 차근차근', 384, 548);
  cx.fillStyle = '#eaf4e8'; cx.font = '700 32px sans-serif'; cx.fillText('분수 · 소수 · 비와 비율', 384, 665);
  // Original fraction doodles, not copied from a published cover.
  cx.strokeStyle = '#f8d879'; cx.lineWidth = 13; cx.beginPath(); cx.arc(250,790,62,0,Math.PI*2); cx.stroke();
  cx.beginPath(); cx.moveTo(218,790); cx.lineTo(282,790); cx.stroke();
  cx.fillStyle = '#ffffff'; cx.font = '900 42px sans-serif'; cx.fillText('기본 문제', 510, 812);
  cx.fillStyle = '#d4edf0'; cx.font = '26px sans-serif'; cx.fillText('SONGIL STUDY MONSTER', 384, 908);
  const coverTexture = new THREE.CanvasTexture(coverCanvas); coverTexture.colorSpace = THREE.SRGBColorSpace;
  const cover = new THREE.Mesh(new THREE.PlaneGeometry(1.40, 1.76), new THREE.MeshStandardMaterial({ map: coverTexture, roughness: .78 }));
  cover.position.set(0, .95, -.273); model.add(cover);
  // Eyes above the title; deliberately cute rather than scary.
  for (const x of [-.28,.28]) {
    ball(model, .105, .13, .055, mat('bookeyeWhite', 0xfffaf0), x, 1.35, -.34, 14);
    ball(model, .045, .065, .025, mat('bookeyeDark', 0x25343b), x, 1.34, -.39, 12);
    ball(model, .014, .018, .01, mat('bookeyeShine', 0xffffff), x-.012, 1.37, -.414, 8);
    tubeBetween(model, [x-.1,1.52,-.34], [x+.06,1.55,-.34], .018, mat('bookbrow', 0x153c49), 7);
  }
  const mouth = new THREE.Mesh(new THREE.TorusGeometry(.065,.012,7,18,Math.PI), mat('bookmouth',0x163d46));
  mouth.position.set(0,1.08,-.345); mouth.rotation.z = Math.PI; model.add(mouth);
  // Little arms and shoes.
  for (const side of [-1,1]) {
    tubeBetween(model, [side*.72,1.03,0], [side*.91,.78,-.03], .09, mat('bookarm',0x27788a), 10);
    ball(model,.105,.095,.09,mat('bookhand',0xf2cf86),side*.91,.77,-.03,10);
    cylinder(model,.095,.11,.3,mat('bookleg',0x1e5664),side*.34,.12,0,10);
    ball(model,.16,.09,.22,mat('bookshoe',0xe2bd75),side*.34,.055,-.08,10);
  }
  const shadow = new THREE.Mesh(new THREE.CircleGeometry(.76, 28), new THREE.MeshBasicMaterial({ color:0x1b2930, transparent:true, opacity:.24, depthWrite:false }));
  shadow.rotation.x=-Math.PI/2; shadow.position.y=.012; root.add(shadow);
  return { root, model, shadow };
}
const enemy = makeWorkbook();

// --- Combat state ---
const MAX_PLAYER_HP = 100;
const MAX_ENEMY_HP = 50;
let playerHP = MAX_PLAYER_HP;
let enemyHP = MAX_ENEMY_HP;
let started = false;
let ended = false;
let lastTime = 0;
let elapsed = 0;
let enemyShotTimer = .67;
let attackCooldown = 0;
let swingTime = 0;
let jumpVelocity = 0;
let grounded = true;
let hurtTimer = 0;
let toastTimer = 0;
const projectiles = [];
const keys = Object.create(null);
const clock = new THREE.Clock();
const tempVec = new THREE.Vector3();

function updateHUD() {
  playerHpText.textContent = `${Math.max(0, Math.ceil(playerHP))} / ${MAX_PLAYER_HP}`;
  enemyHpText.textContent = `${Math.max(0, Math.ceil(enemyHP))} / ${MAX_ENEMY_HP}`;
  playerHpBar.style.width = `${Math.max(0, playerHP / MAX_PLAYER_HP * 100)}%`;
  enemyHpBar.style.width = `${Math.max(0, enemyHP / MAX_ENEMY_HP * 100)}%`;
}
function say(message, duration = 2.2) {
  toast.textContent = message; toastTimer = duration;
}
function makeFractionTexture(value) {
  const canvas = document.createElement('canvas'); canvas.width = 256; canvas.height = 256;
  const c = canvas.getContext('2d');
  c.fillStyle = '#fff8df'; c.beginPath(); c.roundRect(12,12,232,232,26); c.fill();
  c.strokeStyle = '#d49b42'; c.lineWidth = 9; c.stroke();
  c.textAlign = 'center'; c.fillStyle = '#244a55'; c.font = '900 94px sans-serif'; c.fillText(String(value * 2),128,111);
  c.fillRect(63,128,130,8);
  c.font = '900 86px sans-serif'; c.fillText('2',128,214);
  const texture = new THREE.CanvasTexture(canvas); texture.colorSpace = THREE.SRGBColorSpace; return texture;
}
function fireFraction() {
  const amount = 5 + Math.floor(Math.random() * 6); // 5–10 inclusive
  const start = enemy.root.position.clone().add(new THREE.Vector3(0, 1.0, 0));
  const target = player.root.position.clone().add(new THREE.Vector3(0, .75, 0));
  const dir = target.sub(start).normalize();
  const group = new THREE.Group(); group.position.copy(start);
  const paper = new THREE.Mesh(new THREE.BoxGeometry(.38,.42,.035), new THREE.MeshStandardMaterial({ color:0xfff5d9, roughness:.8 }));
  paper.castShadow = true; group.add(paper);
  const label = new THREE.Mesh(new THREE.PlaneGeometry(.32,.36), new THREE.MeshBasicMaterial({ map:makeFractionTexture(amount), transparent:true, side:THREE.DoubleSide }));
  label.position.z = -.022; group.add(label);
  scene.add(group);
  projectiles.push({ group, dir, amount, speed:7.4, life:4 });
}
function makeSlashEffect() {
  const slash = new THREE.Mesh(new THREE.TorusGeometry(.72,.055,8,30,Math.PI*1.12), new THREE.MeshBasicMaterial({ color:0xe9fbff, transparent:true, opacity:.9 }));
  slash.position.copy(player.root.position).add(new THREE.Vector3(0,.95,-.7));
  slash.rotation.set(.18,0,-.55);
  scene.add(slash);
  let age = 0;
  const effect = { mesh:slash, update(dt) { age += dt; slash.scale.setScalar(1 + age*1.5); slash.material.opacity = Math.max(0, .9 - age*4.5); return age < .22; } };
  effects.push(effect);
}
const effects = [];
function doAttack() {
  if (!started || ended || attackCooldown > 0) return;
  attackCooldown = .43; swingTime = .27;
  makeSlashEffect();
  const distance = player.root.position.distanceTo(enemy.root.position);
  const toEnemy = enemy.root.position.clone().sub(player.root.position).setY(0).normalize();
  const forward = new THREE.Vector3(0,0,-1).applyQuaternion(player.model.quaternion);
  const facing = forward.dot(toEnemy);
  if (distance <= 3.25 && facing > .05) {
    enemyHP = Math.max(0, enemyHP - 10);
    updateHUD();
    say('검 공격 성공! 문제집 -10 HP', 1.1);
    enemy.model.rotation.z = -.05;
    setTimeout(() => { if (enemy.model) enemy.model.rotation.z = 0; }, 110);
    if (enemyHP <= 0) finish(true);
  } else {
    say('조금 더 가까이 다가가서 문제집을 바라보고 공격해 봐!', 1.2);
  }
}
function damagePlayer(amount) {
  if (hurtTimer > 0 || ended) return;
  playerHP = Math.max(0, playerHP - amount); hurtTimer = .32;
  updateHUD();
  say(`분수 공격에 맞았다! -${amount} HP`, 1.15);
  if (playerHP <= 0) finish(false);
}
function finish(won) {
  ended = true; started = false;
  endIcon.textContent = won ? '🏆' : '📕';
  endTitle.textContent = won ? '등굣길을 되찾았다!' : '문제집에게 막혔다!';
  endMessage.textContent = won ? '첫 번째 문제집을 물리쳤어. 다음 문제집은 아직 준비 중이야!' : '체력이 모두 떨어졌어. 다시 도전해서 문제집을 이겨 보자!';
  endScreen.classList.remove('hidden');
}
function resetGame() {
  for (const p of projectiles) scene.remove(p.group);
  projectiles.length = 0;
  for (const e of effects) scene.remove(e.mesh);
  effects.length = 0;
  player.root.position.set(0,0,6);
  player.model.rotation.set(0,0,0);
  enemy.root.position.set(0,0,-.8);
  playerHP = MAX_PLAYER_HP; enemyHP = MAX_ENEMY_HP;
  enemyShotTimer = .67; attackCooldown = 0; swingTime = 0; jumpVelocity = 0; grounded = true; hurtTimer = 0;
  ended = false; started = true; updateHUD();
  endScreen.classList.add('hidden'); startScreen.classList.add('hidden');
  say('문제집이 살아났다! 다가가서 검으로 공격해!', 3);
}

window.addEventListener('keydown', (e) => {
  if (['Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.code)) e.preventDefault();
  keys[e.code] = true;
  if (e.code === 'Space' && started && !ended && grounded) { jumpVelocity = 6.2; grounded = false; }
});
window.addEventListener('keyup', (e) => { keys[e.code] = false; });
window.addEventListener('blur', () => { for (const k of Object.keys(keys)) keys[k] = false; });
renderer.domElement.addEventListener('pointerdown', (e) => { if (e.button === 0) doAttack(); });
startButton.addEventListener('click', resetGame);
restartButton.addEventListener('click', resetGame);

function updatePlayer(dt) {
  const x = (keys.KeyD || keys.ArrowRight ? 1 : 0) - (keys.KeyA || keys.ArrowLeft ? 1 : 0);
  const z = (keys.KeyS || keys.ArrowDown ? 1 : 0) - (keys.KeyW || keys.ArrowUp ? 1 : 0);
  const direction = new THREE.Vector3(x,0,z);
  if (direction.lengthSq() > 0) {
    direction.normalize();
    player.root.position.addScaledVector(direction, 4.25 * dt);
    const targetYaw = Math.atan2(direction.x, -direction.z);
    let diff = targetYaw - player.model.rotation.y;
    diff = Math.atan2(Math.sin(diff), Math.cos(diff));
    player.model.rotation.y += diff * Math.min(1, dt * 13);
  }
  player.root.position.x = THREE.MathUtils.clamp(player.root.position.x, -3.25, 3.25);
  player.root.position.z = THREE.MathUtils.clamp(player.root.position.z, -20, 15);
  if (!grounded) {
    jumpVelocity -= 16 * dt;
    player.root.position.y += jumpVelocity * dt;
    if (player.root.position.y <= 0) { player.root.position.y = 0; jumpVelocity = 0; grounded = true; }
  }
  const moving = direction.lengthSq() > 0;
  const bob = moving && grounded ? Math.sin(elapsed * 13) * .035 : Math.sin(elapsed * 2.2) * .012;
  player.model.position.y = bob + (grounded ? 0 : Math.sin(elapsed*10)*.015);
  if (moving && grounded) {
    player.leftLeg.rotation.x = Math.sin(elapsed * 13) * .38;
    player.rightLeg.rotation.x = -Math.sin(elapsed * 13) * .38;
    player.leftArm.rotation.x = -Math.sin(elapsed * 13) * .24;
    player.rightArm.rotation.x = Math.sin(elapsed * 13) * .24;
  } else {
    player.leftLeg.rotation.x = THREE.MathUtils.damp(player.leftLeg.rotation.x,0,8,dt);
    player.rightLeg.rotation.x = THREE.MathUtils.damp(player.rightLeg.rotation.x,0,8,dt);
    player.leftArm.rotation.x = THREE.MathUtils.damp(player.leftArm.rotation.x,0,8,dt);
    player.rightArm.rotation.x = THREE.MathUtils.damp(player.rightArm.rotation.x,0,8,dt);
  }
  if (swingTime > 0) {
    swingTime = Math.max(0, swingTime - dt);
    const t = 1 - swingTime / .27;
    player.swordPivot.rotation.z = Math.sin(t * Math.PI) * -1.8 + (t > .5 ? -.15 : 0);
    player.swordPivot.rotation.x = Math.sin(t * Math.PI) * -.5;
  } else {
    player.swordPivot.rotation.z = THREE.MathUtils.damp(player.swordPivot.rotation.z,0,12,dt);
    player.swordPivot.rotation.x = THREE.MathUtils.damp(player.swordPivot.rotation.x,0,12,dt);
  }
  attackCooldown = Math.max(0, attackCooldown - dt);
  hurtTimer = Math.max(0, hurtTimer - dt);
  player.shadow.material.opacity = .25 - Math.min(.12, player.root.position.y * .08);
  player.shadow.scale.setScalar(1 + player.root.position.y * .09);
}
function updateEnemy(dt) {
  enemy.model.position.y = Math.sin(elapsed * 2.6) * .035;
  enemy.model.rotation.y = Math.sin(elapsed * 1.1) * .035;
  enemyShotTimer -= dt;
  const dist = player.root.position.distanceTo(enemy.root.position);
  if (enemyShotTimer <= 0 && dist < 14) {
    fireFraction(); enemyShotTimer = .67;
  }
}
function updateProjectiles(dt) {
  for (let i = projectiles.length - 1; i >= 0; i--) {
    const p = projectiles[i];
    p.group.position.addScaledVector(p.dir, p.speed * dt);
    p.group.rotation.z += dt * 1.9; p.group.rotation.y += dt * 1.1;
    p.life -= dt;
    const hitPoint = player.root.position.clone().add(new THREE.Vector3(0,.68,0));
    if (p.group.position.distanceTo(hitPoint) < .62) {
      damagePlayer(p.amount); scene.remove(p.group); projectiles.splice(i,1); continue;
    }
    if (p.life <= 0) { scene.remove(p.group); projectiles.splice(i,1); }
  }
}
function updateEffects(dt) {
  for (let i = effects.length - 1; i >= 0; i--) {
    if (!effects[i].update(dt)) { scene.remove(effects[i].mesh); effects.splice(i,1); }
  }
}
function updateCamera(dt) {
  const offset = new THREE.Vector3(7.2, 8.1, 10.5);
  const desired = player.root.position.clone().add(offset);
  camera.position.lerp(desired, 1 - Math.exp(-dt * 3.2));
  const look = player.root.position.clone().add(new THREE.Vector3(0,.85,-1.0));
  camera.lookAt(look);
}
function resize() {
  const w = mount.clientWidth || window.innerWidth;
  const h = mount.clientHeight || window.innerHeight;
  camera.aspect = w / h; camera.updateProjectionMatrix(); renderer.setSize(w,h,false);
}
window.addEventListener('resize', resize);
resize(); updateHUD();

function animate() {
  requestAnimationFrame(animate);
  const dt = Math.min(clock.getDelta(), .04);
  elapsed += dt;
  if (started && !ended) {
    updatePlayer(dt); updateEnemy(dt); updateProjectiles(dt); updateEffects(dt);
    if (toastTimer > 0) { toastTimer -= dt; if (toastTimer <= 0) toast.textContent = 'WASD 이동 · SPACE 점프 · 마우스 클릭 공격'; }
  } else {
    updateEffects(dt);
  }
  updateCamera(dt);
  renderer.render(scene,camera);
}
animate();
