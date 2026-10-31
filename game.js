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
const interactionPrompt = document.querySelector('#interaction-prompt');
const guardDialog = document.querySelector('#guard-dialog');
const guardDialogText = document.querySelector('#guard-dialog-text');
const guardDialogNext = document.querySelector('#guard-dialog-next');
const guardDialogClose = document.querySelector('#guard-dialog-close');

const scene = new THREE.Scene();
scene.background = new THREE.Color(0xaed9e9);
scene.fog = new THREE.Fog(0xaed9e9, 24, 62);

const camera = new THREE.PerspectiveCamera(43, 1, 0.1, 180);
camera.position.set(4.8, 15.5, 12.8);

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
sun.shadow.camera.left = -44; sun.shadow.camera.right = 44;
sun.shadow.camera.top = 44; sun.shadow.camera.bottom = -44;
sun.shadow.camera.updateProjectionMatrix();
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

// --- Expanded school-road environment ---
const grass = new THREE.Mesh(new THREE.PlaneGeometry(124, 112), mat('grass', 0x65a85c));
grass.rotation.x = -Math.PI / 2; grass.position.y = -0.04; grass.receiveShadow = true; scene.add(grass);
const path = new THREE.Mesh(new THREE.PlaneGeometry(13, 86), mat('path', 0xb8b9ad));
path.rotation.x = -Math.PI / 2; path.position.set(0, 0.005, -4); path.receiveShadow = true; scene.add(path);
// Repeating paving joints and subtle center markings make the longer route readable.
for (let z = -45; z <= 37; z += 4) {
  box(scene, 12.8, .025, .055, mat('pathline', 0xa6aa9f), 0, .025, z, { castShadow: false });
}
for (const x of [-6.75, 6.75]) {
  box(scene, .34, .16, 86, mat('curb', 0xe0dfce), x, .08, -4, { castShadow: false });
  box(scene, .09, .045, 84, mat('curbpaint', 0xf4e8c9), x, .18, -4, { castShadow: false });
}
// School entrance gate and sign in the distance.
for (const x of [-4.25, 4.25]) {
  box(scene, .5, 3.35, .5, mat('gatewood', 0x9a7048), x, 1.675, -42, {});
  box(scene, .64, .2, .64, mat('gatecap', 0xd8ad6b), x, 3.42, -42, {});
  box(scene, .13, 2.9, .13, mat('gatedetail', 0xc08e54), x, 1.75, -41.72, {});
}
box(scene, 8.6, .58, .34, mat('signwood', 0x855d3b), 0, 3.12, -42, {});
box(scene, 8.2, .44, .13, mat('signface', 0xf2d99c), 0, 3.12, -41.79, {});
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
const signTexture = makeTextTexture(['송일초 등굣길'], { background: '#f2d99c', color: '#315448', fontSize: 112, border: '#b1834b', width: 1200, height: 180 });
const signMesh = new THREE.Mesh(new THREE.PlaneGeometry(8.05, .38), new THREE.MeshStandardMaterial({ map: signTexture, roughness: .8 }));
signMesh.position.set(0, 3.12, -41.70); scene.add(signMesh);
// School building behind the gate.
box(scene, 18, 5.8, 3.0, mat('schoolwall', 0xe8dfc9), 0, 2.8, -44.4, {});
box(scene, 18.3, .48, 3.2, mat('schoolroof', 0x648d91), 0, 5.82, -44.4, {});
for (let x = -7; x <= 7.01; x += 2.3) {
  box(scene, 1.25, 1.45, .08, mat('window', 0x94c7d2, .25), x, 3.62, -42.9, { castShadow: false });
  box(scene, 1.31, .09, .1, mat('windowframe', 0xf7f0dc), x, 3.62, -42.84, { castShadow: false });
  box(scene, .08, 1.5, .1, mat('windowframe', 0xf7f0dc), x, 3.62, -42.83, { castShadow: false });
}
// Trees and hedges on both sides of the expanded route.
function tree(x, z, size = 1) {
  const g = new THREE.Group(); g.position.set(x, 0, z); g.scale.setScalar(size); scene.add(g);
  cylinder(g, .15, .23, 1.35, mat('bark', 0x79563d), 0, .68, 0, 9);
  ball(g, .82, .9, .8, mat('leaf1', 0x4f8e57), 0, 1.72, 0, 14);
  ball(g, .56, .63, .6, mat('leaf2', 0x6ba965), -.32, 1.95, -.12, 14);
  ball(g, .55, .65, .55, mat('leaf3', 0x3f7b4c), .35, 1.9, .12, 14);
  ball(g, .28, .30, .27, mat('leaf2', 0x78b66d), .1, 2.35, .02, 12);
}
for (const [x,z,s] of [
  [-10,-36,1.1],[10,-37,1.2],[-10,-25,1],[10,-25,1.05],[-10,-12,1.1],[10,-11,1.15],
  [-10,2,1.0],[10,2,1.05],[-11,15,1.1],[11,15,1.15],[-10,28,.95],[10,30,1.0]
]) tree(x,z,s);
for (const side of [-1,1]) {
  for (let z = -37; z < 31; z += 2.5) {
    if (side === 1 && z > 15 && z < 24) continue; // keep the guardhouse frontage clear
    const hedge = box(scene, 1.25, .58, 1.85, mat('hedge', 0x4e874f), side * 8.15, .29, z, {});
    hedge.rotation.y = (z % 2) * .05;
  }
}
// Small flower beds and roadside stones.
for (let i = 0; i < 44; i++) {
  const side = i % 2 ? 1 : -1;
  const x = side * (7.5 + (i % 3) * .7);
  const z = -35 + Math.floor(i / 2) * 3.1;
  cylinder(scene, .025, .03, .16, mat('flowerstem', 0x387d48), x, .08, z, 6);
  ball(scene, .07, .07, .07, mat('flower', i % 3 === 0 ? 0xf5df75 : 0xf6f0ee), x, .18, z, 8);
}
// A little spur path leads to the school security booth.
const boothPath = new THREE.Mesh(new THREE.PlaneGeometry(4.2, 8), mat('path', 0xb8b9ad));
boothPath.rotation.x = -Math.PI/2; boothPath.position.set(8.1, .012, 20); boothPath.receiveShadow = true; scene.add(boothPath);
// Security booth: windows, roof trim, door, sign and a bench.
const booth = new THREE.Group(); booth.position.set(9.15, 0, 19.5); scene.add(booth);
box(booth, 3.0, 2.55, 2.65, mat('boothwall', 0xe8e4d3), 0, 1.28, 0, {});
box(booth, 3.16, .22, 2.82, mat('boothroof', 0x315c67), 0, 2.63, 0, {});
box(booth, 3.22, .09, 2.88, mat('boothtrim', 0xd7b46d), 0, 2.48, 0, {});
// Front window faces the road (negative Z).
box(booth, 1.72, .92, .06, mat('boothglass', 0x8fc5d0, .22), -.22, 1.73, -1.34, { castShadow: false });
for (const x of [-1.12,.68]) box(booth,.09,1.05,.10,mat('boothframe',0xf4f0df),x,1.73,-1.39,{castShadow:false});
box(booth,1.9,.09,.10,mat('boothframe',0xf4f0df),-.22,1.73,-1.39,{castShadow:false});
box(booth,.09,1.02,.10,mat('boothframe',0xf4f0df),-.22,1.73,-1.40,{castShadow:false});
box(booth,.72,1.65,.08,mat('boothdoor',0x9d7652),1.02,.85,-1.36,{});
box(booth,.07,.07,.08,mat('doorknob',0xd9bd75,.35,.5),.78,.88,-1.42,{});
const boothSignTex = makeTextTexture(['경비실'], { background:'#f6e9c4', color:'#315448', fontSize:120, width:420, height:150, border:'#b58b52' });
const boothSign = new THREE.Mesh(new THREE.PlaneGeometry(1.35,.48),new THREE.MeshStandardMaterial({map:boothSignTex,roughness:.8}));
boothSign.position.set(0,2.28,-1.43); booth.add(boothSign);
box(scene,1.7,.22,.55,mat('benchwood',0x9c7048),7.0,.45,22.1,{});
for (const x of [6.35,7.65]) box(scene,.12,.55,.12,mat('benchlegs',0x4e5150),x,.23,22.1,{});

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
  for (let i = 0; i < 7; i++) {
    const y = -.25 + i * .083;
    const ring = torus(torso, .285 - Math.abs(y) * .1, .018, stripe, 0, y, 0, 1.08, .72);
    ring.material = stripe;
  }
  torus(torso, .235, .038, mint, 0, .285, 0, 1, .78);
  // Small stitched chest label, similar in scale to the reference shirt patch.
  box(torso, .22, .10, .022, mat('patch', 0x9e8055), .07, -.03, -.239, { castShadow: false });
  const patchCanvas=document.createElement('canvas'); patchCanvas.width=256; patchCanvas.height=96;
  const pc=patchCanvas.getContext('2d'); pc.fillStyle='#9e8055'; pc.fillRect(0,0,256,96);
  pc.strokeStyle='#dfc99a'; pc.lineWidth=5; pc.strokeRect(7,7,242,82);
  pc.fillStyle='#fff0ca'; pc.font='bold 43px sans-serif'; pc.textAlign='center'; pc.textBaseline='middle'; pc.fillText('OUTDOOR',128,49);
  const patchTexture=new THREE.CanvasTexture(patchCanvas); patchTexture.colorSpace=THREE.SRGBColorSpace;
  const patchPrint=new THREE.Mesh(new THREE.PlaneGeometry(.19,.071),new THREE.MeshBasicMaterial({map:patchTexture}));
  patchPrint.position.set(.07,-.03,-.252); torso.add(patchPrint);
  // Fine seam-like shirt bands.
  for (let i=0;i<3;i++) {
    const y=-.18+i*.105;
    torus(torso,.292-Math.abs(y)*.10,.008,mat('shirtstitch',0xd8d9d2),0,y,0,1.08,.72);
  }

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
    // Narrow light sleeve bands and subtle cuff stitching.
    tubeBetween(arm, [side*.07,-.18,-.01], [side*.10,-.205,-.015], .127, stripe, 10);
    tubeBetween(arm,[side*.10,-.43,-.07],[side*.105,-.455,-.08],.113,mat('cuffstitch',0xdce3df),9);
  }

  // Neck, head and small Animal-Crossing-inspired features (smaller eyes).
  cylinder(model, .105, .12, .16, skin, 0, 1.05, 0, 12);
  const head = new THREE.Group(); head.position.set(0, 1.30, -.005); model.add(head);
  ball(head, .365, .385, .315, skin, 0, 0, 0, 32);
  ball(head, .075, .11, .06, skin, -.36, -.02, 0, 16);
  ball(head, .075, .11, .06, skin, .36, -.02, 0, 16);
  // Ear folds add a little more natural detail without losing the toy-like style.
  for (const side of [-1,1]) {
    ball(head,.028,.062,.018,mat('earinner',0xd89982),side*.375,-.02,-.045,12);
  }
  // Hair cap plus separated, slightly wavy fringe locks.
  ball(head, .385, .27, .345, hair, 0, .205, .025, 24);
  ball(head, .345, .16, .30, hair, 0, .105, -.205, 20);
  for (let i = 0; i < 17; i++) {
    const x = -.34 + i * .0425;
    const offset = Math.sin(i * 1.45) * .022;
    const lock = ball(head, .035, .145 + (i % 4) * .014, .073, hair, x, -.035 + offset, -.286, 14);
    lock.rotation.z = (i - 8) * .026;
  }
  // Fine curved locks and soft highlights create the dense, slightly wavy fringe.
  const hairSheen = mat('hairSheen',0x34383d,.4);
  for (let i = 0; i < 8; i++) {
    const x = -.29 + i * .083;
    tubeBetween(head,[x,.30,-.20],[x+.025,.12,-.335],.009,hairSheen,6);
  }
  // Side locks near the ears.
  for (const side of [-1,1]) {
    const lock = ball(head, .075, .18, .09, hair, side*.32, -.16, -.12, 12);
    lock.rotation.z = -side*.12;
  }
  // Face details; eye scale intentionally restrained.
  // Subtle cheeks, eyebrows and a small rounded nose make the face less generic.
  for (const side of [-1,1]) {
    ball(head,.072,.035,.018,mat('cheek',0xe9a99a),side*.235,-.115,-.275,12);
    tubeBetween(head,[side*.10,.025,-.30],[side*.19,.04,-.30],.012,mat('eyebrow',0x453b37),7);
  }
  ball(head,.045,.042,.045,skin,0,-.078,-.33,14);
  for (const side of [-1,1]) ball(head,.009,.007,.008,mat('nostril',0xb98270),side*.018,-.095,-.367,8);
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
  const root = new THREE.Group(); root.position.set(0, 0, -9); scene.add(root);
  const model = new THREE.Group(); root.add(model);
  const coverMat = mat('bookcover', 0x246b79, .52);
  const pagesMat = mat('bookpages', 0xf7f0df, .94);
  const spineMat = mat('bookspine', 0x164c5a, .7);
  // Thick workbook block with a rounded-looking layered page edge.
  box(model, 1.54, 1.94, .35, pagesMat, 0, .99, 0, {});
  box(model, 1.59, 1.99, .13, coverMat, 0, .99, -.235, {});
  box(model, .115, 1.91, .38, spineMat, -.75, .99, -.015, {});
  box(model, .075, 1.92, .37, mat('bookgoldedge',0xe3b45e,.55), .77, .99, -.005, {});
  // Tiny page grooves on the exposed right edge.
  for(let i=0;i<13;i++) box(model,.012,1.82,.018,mat('pagegroove',0xd8d0bd),.838,.99,-.10+i*.016,{castShadow:false});
  // Top page lines and a subtle paper stack visible along the upper edge.
  for(let i=0;i<8;i++) box(model,1.42,.012,.018,mat('pageline',0xd8d0bd),.02,1.985,-.13+i*.034,{castShadow:false});
  // Front cover artwork is original, using the visual language of school workbooks
  // (grade badge, subject title, unit list and a clean publisher strip) without copying a publisher's trade dress.
  const coverCanvas=document.createElement('canvas'); coverCanvas.width=900; coverCanvas.height=1200;
  const cx=coverCanvas.getContext('2d');
  const grad=cx.createLinearGradient(0,0,900,1200); grad.addColorStop(0,'#2d8792'); grad.addColorStop(.55,'#1e6879'); grad.addColorStop(1,'#174d68');
  cx.fillStyle=grad; cx.fillRect(0,0,900,1200);
  cx.fillStyle='#f8f2df'; cx.beginPath(); cx.roundRect(30,28,840,1144,36); cx.fill();
  cx.fillStyle='#247887'; cx.beginPath(); cx.roundRect(48,46,804,1108,28); cx.fill();
  // Header strip and series identity.
  cx.fillStyle='#f4d27d'; cx.beginPath(); cx.roundRect(82,82,736,112,22); cx.fill();
  cx.fillStyle='#28515a'; cx.font='800 43px sans-serif'; cx.textAlign='left'; cx.fillText('SONGIL  ·  초등 학습 시리즈',112,150);
  cx.textAlign='right'; cx.font='700 27px sans-serif'; cx.fillText('2026 개정 학습형',785,150);
  // Grade / semester block.
  cx.fillStyle='#f5f7ef'; cx.beginPath(); cx.roundRect(105,242,690,220,28); cx.fill();
  cx.fillStyle='#245f6a'; cx.font='800 44px sans-serif'; cx.textAlign='center'; cx.fillText('초등학교 6학년  1학기',450,305);
  cx.fillStyle='#153f51'; cx.font='900 114px sans-serif'; cx.fillText('기본 수학',450,420);
  // Accent ribbon.
  cx.fillStyle='#f4cb69'; cx.beginPath(); cx.roundRect(165,500,570,82,24); cx.fill();
  cx.fillStyle='#28515a'; cx.font='800 39px sans-serif'; cx.fillText('개념 정리  +  기본 유형',450,553);
  // Geometric learning motifs: fraction circles, a number line and clean grid cards.
  cx.fillStyle='#eaf3e7'; cx.beginPath(); cx.roundRect(105,635,690,300,28); cx.fill();
  cx.fillStyle='#235c69'; cx.font='800 35px sans-serif'; cx.textAlign='left'; cx.fillText('이번 학기 핵심 단원',145,695);
  const items=['① 분수의 나눗셈','② 소수의 나눗셈','③ 비와 비율','④ 자료의 정리'];
  cx.font='700 29px sans-serif'; cx.fillStyle='#355f61';
  items.forEach((t,i)=>cx.fillText(t,150,765+i*43));
  cx.strokeStyle='#e0b65f'; cx.lineWidth=14; cx.beginPath(); cx.arc(650,790,88,0,Math.PI*2); cx.stroke();
  cx.beginPath(); cx.moveTo(650,702); cx.lineTo(650,878); cx.stroke();
  cx.beginPath(); cx.moveTo(562,790); cx.lineTo(738,790); cx.stroke();
  cx.fillStyle='#f5d27d'; cx.beginPath(); cx.roundRect(110,980,680,95,24); cx.fill();
  cx.fillStyle='#284f59'; cx.textAlign='center'; cx.font='800 37px sans-serif'; cx.fillText('개념 확인  ·  기본 문제  ·  단원 평가',450,1040);
  cx.fillStyle='#e9f5f0'; cx.font='700 24px sans-serif'; cx.fillText('송일 학습연구소  |  기본편',450,1118);
  const coverTexture=new THREE.CanvasTexture(coverCanvas); coverTexture.colorSpace=THREE.SRGBColorSpace;
  const cover=new THREE.Mesh(new THREE.PlaneGeometry(1.52,1.90),new THREE.MeshStandardMaterial({map:coverTexture,roughness:.68,metalness:.02}));
  cover.position.set(0,.99,-.307); model.add(cover);
  // Laminated cover highlights.
  const gloss=new THREE.Mesh(new THREE.PlaneGeometry(1.48,1.86),new THREE.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:.055,side:THREE.DoubleSide}));
  gloss.position.set(0,.99,-.312); model.add(gloss);
  // Spine title panel.
  const spineTex=makeTextTexture(['6-1','기본 수학'],{background:'#164c5a',color:'#fff2cc',fontSize:92,width:420,height:900});
  const spinePrint=new THREE.Mesh(new THREE.PlaneGeometry(.09,1.55),new THREE.MeshBasicMaterial({map:spineTex}));
  spinePrint.position.set(-.812,.99,-.02); spinePrint.rotation.y=-Math.PI/2; model.add(spinePrint);
  // Small character face sits above the main title and does not obscure the subject name.
  for(const x of [-.30,.30]) {
    ball(model,.078,.095,.045,mat('bookeyeWhite',0xfffaf0),x,1.72,-.34,18);
    ball(model,.033,.046,.025,mat('bookeyeDark',0x25343b),x,1.71,-.381,14);
    ball(model,.011,.014,.009,mat('bookeyeShine',0xffffff),x-.009,1.735,-.403,8);
    tubeBetween(model,[x-.07,1.84,-.335],[x+.055,1.86,-.335],.012,mat('bookbrow',0x153c49),7);
  }
  const mouth=new THREE.Mesh(new THREE.TorusGeometry(.052,.009,7,18,Math.PI),mat('bookmouth',0x163d46));
  mouth.position.set(0,1.56,-.348); mouth.rotation.z=Math.PI; model.add(mouth);
  // Page marker tabs along the side.
  for(let i=0;i<3;i++) box(model,.15,.10,.035,mat('booktab'+i,[0xf0c96e,0xe8f0cf,0xe7a77f][i]),.84,1.56-i*.20,.02,{});
  // Little arms with cuffs and tiny shoes.
  for(const side of [-1,1]) {
    tubeBetween(model,[side*.77,1.07,0],[side*.98,.84,-.04],.085,mat('bookarm',0x27788a),12);
    tubeBetween(model,[side*.93,.89,-.035],[side*.98,.84,-.04],.09,mat('bookcuff',0xf2d78e),10);
    ball(model,.105,.095,.09,mat('bookhand',0xf2cf86),side*.99,.82,-.05,12);
    cylinder(model,.09,.11,.29,mat('bookleg',0x1e5664),side*.35,.12,0,12);
    ball(model,.17,.09,.23,mat('bookshoe',0xe2bd75),side*.35,.055,-.09,12);
  }
  const shadow=new THREE.Mesh(new THREE.CircleGeometry(.82,32),new THREE.MeshBasicMaterial({color:0x1b2930,transparent:true,opacity:.24,depthWrite:false}));
  shadow.rotation.x=-Math.PI/2; shadow.position.y=.012; root.add(shadow);
  return {root,model,shadow};
}
const enemy = makeWorkbook();

// --- Security guard NPC ---
function makeGuardNPC() {
  const root=new THREE.Group(); root.position.set(5.8,0,19.8); scene.add(root);
  const model=new THREE.Group(); root.add(model);
  const uniform=mat('guardUniform',0x315b66,.78);
  const trim=mat('guardTrim',0xd9c58c,.65);
  const skin=mat('guardSkin',0xe5b999,.85);
  const dark=mat('guardDark',0x28363b,.7);
  // Short legs, uniform jacket and belt.
  for(const side of [-1,1]) {
    cylinder(model,.105,.12,.42,mat('guardPants',0x303d43),side*.13,.27,0,12);
    ball(model,.14,.07,.22,mat('guardShoes',0x30363a),side*.13,.055,-.07,12);
  }
  ball(model,.29,.34,.19,uniform,0,.78,0,20);
  box(model,.34,.07,.025,trim,0,.67,-.185,{});
  box(model,.09,.16,.025,trim,0,.82,-.19,{});
  box(model,.13,.11,.025,mat('guardBadge',0xe8cc80),.13,.92,-.20,{});
  for(const side of [-1,1]) {
    tubeBetween(model,[side*.27,.98,0],[side*.34,.65,-.03],.09,uniform,12);
    ball(model,.09,.09,.09,skin,side*.34,.62,-.04,12);
  }
  cylinder(model,.09,.105,.15,skin,0,1.08,0,14);
  const head=new THREE.Group(); head.position.set(0,1.34,0); model.add(head);
  ball(head,.27,.30,.245,skin,0,0,0,24);
  // Grey side hair, brows, eyes, nose and a neat moustache.
  for(const side of [-1,1]) {
    ball(head,.09,.12,.10,mat('guardGreyHair',0x777b78),side*.23,.12,.02,12);
    ball(head,.018,.024,.015,dark,side*.09,-.015,-.235,10);
    tubeBetween(head,[side*.06,.055,-.235],[side*.13,.06,-.235],.012,mat('guardBrow',0x55504b),7);
  }
  ball(head,.035,.045,.035,skin,0,-.055,-.245,12);
  ball(head,.08,.032,.018,mat('guardMustache',0x77736d),0,-.12,-.224,12);
  // Navy security cap with a gold badge and brim.
  ball(head,.285,.13,.26,mat('guardCap',0x244a58),0,.245,0,18);
  box(head,.33,.045,.16,mat('guardBrim',0x203f4b),0,.19,-.18,{});
  box(head,.075,.07,.018,mat('guardCapBadge',0xe4c276,.45,.25),0,.255,-.255,{});
  model.scale.setScalar(.92);
  // Face the path and player spawn.
  root.rotation.y=Math.PI;
  return {root,model,head};
}
const guardNPC=makeGuardNPC();

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
let jumpCount = 0;
let dialogueOpen = false;
let dialogueIndex = 0;
const guardLines = [
  '어라? 문제집들이 살아나서 등굣길을 막고 있구나!',
  '저 앞의 문제집은 6학년 1학기 기본 수학이야. 표지에 적힌 이름을 잘 보고 조심해.',
  '문제집이 던지는 분수는 분자 ÷ 분모만큼 피해를 줘. 예를 들어 18/3은 6의 피해란다!',
  '스페이스를 공중에서 한 번 더 누르면 더블 점프가 돼. 잘 피해서 학교까지 가 보렴!',
  '좋아, 재석아! 등굣길을 부탁한다!'
];
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
function makeFractionTexture(numerator, denominator) {
  const canvas=document.createElement('canvas'); canvas.width=320; canvas.height=320;
  const c=canvas.getContext('2d');
  c.fillStyle='#fff8df'; c.beginPath(); c.roundRect(12,12,296,296,28); c.fill();
  c.strokeStyle='#d49b42'; c.lineWidth=10; c.stroke();
  c.textAlign='center'; c.textBaseline='middle'; c.fillStyle='#244a55';
  c.font='900 104px sans-serif'; c.fillText(String(numerator),160,105);
  c.fillStyle='#c18a39'; c.fillRect(70,154,180,10);
  c.fillStyle='#244a55'; c.font='900 104px sans-serif'; c.fillText(String(denominator),160,224);
  c.fillStyle='#6b7d76'; c.font='700 24px sans-serif'; c.fillText('분수 공격',160,278);
  const texture=new THREE.CanvasTexture(canvas); texture.colorSpace=THREE.SRGBColorSpace; return texture;
}
function fireFraction() {
  // Random damage remains 5–10 HP. The visible improper fraction evaluates
  // to exactly that integer, and its value is what damagePlayer receives.
  const wantedDamage=5+Math.floor(Math.random()*6);
  const denominator=[2,3,4][Math.floor(Math.random()*3)];
  const numerator=wantedDamage*denominator;
  const amount=numerator/denominator;
  const start=enemy.root.position.clone().add(new THREE.Vector3(0,1.0,0));
  const target=player.root.position.clone().add(new THREE.Vector3(0,.75,0));
  const dir=target.sub(start).normalize();
  const group=new THREE.Group(); group.position.copy(start);
  const paper=new THREE.Mesh(new THREE.BoxGeometry(.46,.50,.045),new THREE.MeshStandardMaterial({color:0xfff5d9,roughness:.78}));
  paper.castShadow=true; group.add(paper);
  const rim=new THREE.Mesh(new THREE.BoxGeometry(.48,.52,.018),new THREE.MeshStandardMaterial({color:0xd5a04a,roughness:.72}));
  rim.position.z=-.029; group.add(rim);
  const label=new THREE.Mesh(new THREE.PlaneGeometry(.40,.44),new THREE.MeshBasicMaterial({map:makeFractionTexture(numerator,denominator),transparent:true,side:THREE.DoubleSide}));
  label.position.z=-.041; group.add(label);
  scene.add(group);
  projectiles.push({group,dir,amount,numerator,denominator,speed:7.4,life:4});
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
function damagePlayer(amount, fractionText = '') {
  if (hurtTimer > 0 || ended) return;
  playerHP = Math.max(0, playerHP - amount); hurtTimer = .32;
  updateHUD();
  say(`${fractionText ? fractionText + ' = ' : ''}${amount} 피해! 체력 -${amount}`, 1.35);
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
  player.root.position.set(0,0,27);
  player.model.rotation.set(0,0,0);
  enemy.root.position.set(0,0,-9);
  guardDialog.classList.add('hidden'); interactionPrompt.classList.add('hidden'); dialogueOpen=false;
  playerHP = MAX_PLAYER_HP; enemyHP = MAX_ENEMY_HP;
  enemyShotTimer = .67; attackCooldown = 0; swingTime = 0; jumpVelocity = 0; grounded = true; jumpCount = 0; hurtTimer = 0;
  ended = false; started = true; updateHUD();
  endScreen.classList.add('hidden'); startScreen.classList.add('hidden');
  say('문제집이 살아났다! 다가가서 검으로 공격해!', 3);
}

function openGuardDialogue() {
  dialogueOpen=true; dialogueIndex=0; guardDialogText.textContent=guardLines[dialogueIndex];
  guardDialog.classList.remove('hidden'); interactionPrompt.classList.add('hidden');
}
function advanceGuardDialogue() {
  dialogueIndex += 1;
  if (dialogueIndex >= guardLines.length) { closeGuardDialogue(); return; }
  guardDialogText.textContent=guardLines[dialogueIndex];
}
function closeGuardDialogue() {
  dialogueOpen=false; guardDialog.classList.add('hidden');
  say('경비실 아저씨의 조언을 기억하자!',1.8);
}
function updateInteraction() {
  if (!started || ended || dialogueOpen) { interactionPrompt.classList.add('hidden'); return; }
  const near=player.root.position.distanceTo(guardNPC.root.position) < 3.5;
  interactionPrompt.classList.toggle('hidden',!near);
}
guardDialogNext.addEventListener('click',advanceGuardDialogue);
guardDialogClose.addEventListener('click',closeGuardDialogue);

window.addEventListener('keydown', (e) => {
  if (['Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.code)) e.preventDefault();
  if (e.code === 'KeyE' && !e.repeat && started && !ended) {
    if (dialogueOpen) advanceGuardDialogue();
    else if (player.root.position.distanceTo(guardNPC.root.position) < 3.5) openGuardDialogue();
  }
  keys[e.code] = true;
  if (e.code === 'Space' && !e.repeat && started && !ended && !dialogueOpen && jumpCount < 2) {
    jumpVelocity = jumpCount === 0 ? 6.2 : 5.8;
    jumpCount += 1; grounded = false;
    if (jumpCount === 2) say('더블 점프!',.7);
  }
});
window.addEventListener('keyup', (e) => { keys[e.code] = false; });
window.addEventListener('blur', () => { for (const k of Object.keys(keys)) keys[k] = false; });
renderer.domElement.addEventListener('pointerdown', (e) => { if (e.button === 0) doAttack(); });
startButton.addEventListener('click', resetGame);
restartButton.addEventListener('click', resetGame);

function updatePlayer(dt) {
  const x = dialogueOpen ? 0 : (keys.KeyD || keys.ArrowRight ? 1 : 0) - (keys.KeyA || keys.ArrowLeft ? 1 : 0);
  const z = dialogueOpen ? 0 : (keys.KeyS || keys.ArrowDown ? 1 : 0) - (keys.KeyW || keys.ArrowUp ? 1 : 0);
  const direction = new THREE.Vector3(x,0,z);
  if (direction.lengthSq() > 0) {
    direction.normalize();
    player.root.position.addScaledVector(direction, 4.25 * dt);
    const targetYaw = Math.atan2(direction.x, -direction.z);
    let diff = targetYaw - player.model.rotation.y;
    diff = Math.atan2(Math.sin(diff), Math.cos(diff));
    player.model.rotation.y += diff * Math.min(1, dt * 13);
  }
  player.root.position.x = THREE.MathUtils.clamp(player.root.position.x, -11.5, 11.5);
  player.root.position.z = THREE.MathUtils.clamp(player.root.position.z, -39, 34);
  if (!grounded) {
    jumpVelocity -= 16 * dt;
    player.root.position.y += jumpVelocity * dt;
    if (player.root.position.y <= 0) { player.root.position.y = 0; jumpVelocity = 0; grounded = true; jumpCount = 0; }
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
      damagePlayer(p.amount, `${p.numerator}/${p.denominator}`); scene.remove(p.group); projectiles.splice(i,1); continue;
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
  // High diagonal view: mostly behind the player, slightly offset to the right,
  // similar to a MOBA / football broadcast camera rather than shoulder-level view.
  const offset = new THREE.Vector3(4.8, 15.5, 12.8);
  const desired = player.root.position.clone().add(offset);
  camera.position.lerp(desired, 1 - Math.exp(-dt * 3.0));
  const look = player.root.position.clone().add(new THREE.Vector3(0,.45,-2.0));
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
    updatePlayer(dt);
    if (!dialogueOpen) { updateEnemy(dt); updateProjectiles(dt); }
    updateEffects(dt); updateInteraction();
    if (toastTimer > 0) { toastTimer -= dt; if (toastTimer <= 0) toast.textContent = 'WASD 이동 · SPACE 더블 점프 · E 대화 · 클릭 공격'; }
  } else {
    updateEffects(dt); updateInteraction();
  }
  updateCamera(dt);
  renderer.render(scene,camera);
}
animate();
