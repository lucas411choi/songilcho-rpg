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
scene.fog = new THREE.Fog(0xaed9e9, 40, 112);

const camera = new THREE.OrthographicCamera(-10, 10, 10, -10, 0.1, 220);
camera.position.set(28, 38, 8);

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

// --- Jaeseok: a higher-detail procedural character based on the supplied photo ---
// This is a hand-built game model (not a photogrammetry scan). Its silhouette,
// hair, glasses and clothes are designed around the visible reference details.
function makePlayer() {
  const root = new THREE.Group();
  root.position.set(0, 0, 8.0);
  scene.add(root);
  const model = new THREE.Group();
  model.rotation.y = -Math.PI / 2; // face the broadcast camera at the sideline
  root.add(model);

  const skin = new THREE.MeshPhysicalMaterial({ color: 0xe8b99d, roughness: .72, clearcoat: .06, clearcoatRoughness: .8 });
  const skinLight = new THREE.MeshStandardMaterial({ color: 0xf0c8ad, roughness: .72 });
  const skinShade = new THREE.MeshStandardMaterial({ color: 0xd49a81, roughness: .78 });
  const hair = new THREE.MeshPhysicalMaterial({ color: 0x111317, roughness: .42, clearcoat: .2, clearcoatRoughness: .35 });
  const hairDark = new THREE.MeshStandardMaterial({ color: 0x090b0e, roughness: .53 });
  const hairSheen = new THREE.MeshStandardMaterial({ color: 0x34383e, roughness: .34, metalness: .04 });
  const glasses = new THREE.MeshPhysicalMaterial({ color: 0x101216, roughness: .24, metalness: .22, clearcoat: .35 });
  const lens = new THREE.MeshPhysicalMaterial({ color: 0xa9c4ca, roughness: .12, metalness: .1, transparent: true, opacity: .19, transmission: .25, thickness: .02, side: THREE.DoubleSide, depthWrite: false });
  const eyeWhite = new THREE.MeshStandardMaterial({ color: 0xfffaf1, roughness: .38 });
  const iris = new THREE.MeshStandardMaterial({ color: 0x30251f, roughness: .28 });
  const pupil = new THREE.MeshStandardMaterial({ color: 0x090a0c, roughness: .2 });
  const mouthMat = new THREE.MeshStandardMaterial({ color: 0x85574f, roughness: .8 });

  function fabricTexture(base, stripeSet = []) {
    const canvas = document.createElement('canvas');
    canvas.width = 1024; canvas.height = 512;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = base; ctx.fillRect(0, 0, 1024, 512);
    for (const st of stripeSet) {
      ctx.fillStyle = st.color; ctx.fillRect(0, st.y, 1024, st.h);
      if (st.edge) { ctx.fillStyle = st.edge; ctx.fillRect(0, st.y + st.h - 2, 1024, 2); }
    }
    // Fine, low-contrast fibers add a cloth-like surface instead of a flat color.
    for (let i = 0; i < 1450; i++) {
      const x = (i * 193) % 1024, y = (i * 317) % 512;
      ctx.fillStyle = i % 3 === 0 ? 'rgba(255,255,255,.045)' : 'rgba(0,0,0,.035)';
      ctx.fillRect(x, y, 1 + (i % 3), 1);
    }
    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.wrapS = THREE.RepeatWrapping; tex.wrapT = THREE.ClampToEdgeWrapping;
    tex.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
    return tex;
  }
  const shirtTexture = fabricTexture('#444b55', [
    { y: 48, h: 12, color: '#c4c9c7' }, { y: 74, h: 7, color: '#899b99' },
    { y: 142, h: 13, color: '#d0d1cc' }, { y: 169, h: 7, color: '#9aa9a4' },
    { y: 236, h: 12, color: '#c4c9c7' }, { y: 264, h: 7, color: '#899b99' },
    { y: 336, h: 13, color: '#d0d1cc' }, { y: 363, h: 7, color: '#9aa9a4' },
    { y: 438, h: 12, color: '#c4c9c7' }, { y: 466, h: 7, color: '#899b99' }
  ]);
  const shirtMat = new THREE.MeshStandardMaterial({ map: shirtTexture, roughness: .9 });
  const mintTexture = fabricTexture('#91aa9f', [
    { y: 75, h: 8, color: '#d1d6cf' }, { y: 270, h: 7, color: '#c8d0c9' }, { y: 440, h: 9, color: '#718b83' }
  ]);
  const mintMat = new THREE.MeshStandardMaterial({ map: mintTexture, roughness: .92 });
  const pantsTexture = fabricTexture('#17191f', [
    { y: 84, h: 3, color: '#22262d' }, { y: 286, h: 2, color: '#242830' }, { y: 420, h: 3, color: '#20242b' }
  ]);
  const pantsMat = new THREE.MeshStandardMaterial({ map: pantsTexture, roughness: .96 });
  const pantsSeam = new THREE.MeshStandardMaterial({ color: 0x3a3d43, roughness: .95 });
  const shoeMat = new THREE.MeshPhysicalMaterial({ color: 0xe9edf0, roughness: .42, clearcoat: .22 });
  const shoeSoleMat = new THREE.MeshStandardMaterial({ color: 0x303840, roughness: .8 });
  const shoeStripeMat = new THREE.MeshStandardMaterial({ color: 0x262c34, roughness: .58 });
  const sockMat = new THREE.MeshStandardMaterial({ color: 0x087aca, roughness: .82 });
  const seamMat = new THREE.MeshStandardMaterial({ color: 0xe0e2de, roughness: .83 });

  // Hip/pelvis and shirt torso: natural child-like proportions, not a bobble-head.
  const hips = new THREE.Group(); hips.position.set(0, 1.06, 0); model.add(hips);
  const pelvis = new THREE.Mesh(new THREE.SphereGeometry(1, 28, 20), pantsMat);
  pelvis.scale.set(.36, .205, .245); pelvis.position.y = -.015; hips.add(pelvis);

  const torso = new THREE.Group(); torso.position.set(0, 1.28, 0); model.add(torso);
  const body = new THREE.Mesh(new THREE.CylinderGeometry(.405, .355, .86, 48, 6, false), shirtMat);
  body.position.y = .02; body.castShadow = true; body.receiveShadow = true; torso.add(body);
  // Soft shoulder caps make the shirt silhouette rounded and less boxy.
  for (const side of [-1, 1]) {
    const shoulder = new THREE.Mesh(new THREE.SphereGeometry(1, 24, 18), shirtMat);
    shoulder.scale.set(.235, .19, .26); shoulder.position.set(side * .285, .335, 0); torso.add(shoulder);
  }
  // Waist hem, collar and stitched seams.
  const hem = new THREE.Mesh(new THREE.TorusGeometry(.365, .018, 8, 48), seamMat);
  hem.rotation.x = Math.PI / 2; hem.position.y = -.405; hem.scale.set(1, .69, 1); torso.add(hem);
  const collar = new THREE.Mesh(new THREE.TorusGeometry(.205, .047, 12, 40), mintMat);
  collar.rotation.x = Math.PI / 2; collar.position.y = .432; collar.scale.set(1, .82, 1); torso.add(collar);
  const collarInner = new THREE.Mesh(new THREE.TorusGeometry(.177, .012, 8, 40), seamMat);
  collarInner.rotation.x = Math.PI / 2; collarInner.position.y = .446; collarInner.scale.set(1, .82, 1); torso.add(collarInner);
  // Small chest label similar in placement to the photo, but with original lettering.
  const patchCanvas = document.createElement('canvas'); patchCanvas.width = 360; patchCanvas.height = 150;
  const pc = patchCanvas.getContext('2d');
  pc.fillStyle = '#917b53'; pc.fillRect(0, 0, 360, 150);
  pc.strokeStyle = '#d9c99e'; pc.lineWidth = 7; pc.strokeRect(8, 8, 344, 134);
  pc.fillStyle = '#fff0cf'; pc.textAlign = 'center'; pc.textBaseline = 'middle';
  pc.font = '800 49px sans-serif'; pc.fillText('OUTDOOR', 180, 72);
  pc.font = '600 22px sans-serif'; pc.fillText('FIELD CLUB', 180, 113);
  const patchTex = new THREE.CanvasTexture(patchCanvas); patchTex.colorSpace = THREE.SRGBColorSpace;
  const patch = new THREE.Mesh(new THREE.PlaneGeometry(.205, .086), new THREE.MeshBasicMaterial({ map: patchTex }));
  patch.position.set(.085, .04, -.407); patch.rotation.z = -.04; torso.add(patch);
  // Fine fabric folds and shoulder seams catch light when the torso turns.
  for (const side of [-1, 1]) {
    const fold = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([
      new THREE.Vector3(side * .28, -.18, -.29), new THREE.Vector3(side * .24, -.11, -.35), new THREE.Vector3(side * .19, -.06, -.36)
    ]), 8, .006, 5, false), seamMat);
    torso.add(fold);
  }

  // Anatomical articulated legs, with independent knees and loose black trousers.
  function makeLeg(side) {
    const upper = new THREE.Group(); upper.position.set(side * .19, -.02, 0); hips.add(upper);
    const thigh = new THREE.Mesh(new THREE.CapsuleGeometry(.155, .36, 7, 18), pantsMat);
    thigh.position.y = -.28; thigh.castShadow = true; thigh.receiveShadow = true; upper.add(thigh);
    // Subtle trouser crease along the outer face.
    const crease = new THREE.Mesh(new THREE.CylinderGeometry(.006, .008, .40, 6), pantsSeam);
    crease.position.set(side * .132, -.29, -.103); upper.add(crease);
    const knee = new THREE.Mesh(new THREE.SphereGeometry(.135, 18, 14), pantsMat);
    knee.position.y = -.55; upper.add(knee);
    const calf = new THREE.Group(); calf.position.y = -.55; upper.add(calf);
    const lower = new THREE.Mesh(new THREE.CapsuleGeometry(.118, .32, 7, 16), pantsMat);
    lower.position.y = -.235; calf.add(lower);
    const ankle = new THREE.Mesh(new THREE.CylinderGeometry(.095, .11, .13, 16), sockMat);
    ankle.position.set(0, -.475, -.005); calf.add(ankle);
    // White trainer with layered sole, toe cap, laces and three dark side stripes.
    const shoe = new THREE.Group(); shoe.position.set(0, -.39, -.085); calf.add(shoe);
    const shoeUpper = new THREE.Mesh(new THREE.SphereGeometry(1, 24, 18), shoeMat);
    shoeUpper.scale.set(.17, .105, .285); shoe.add(shoeUpper);
    const toe = new THREE.Mesh(new THREE.SphereGeometry(1, 20, 14), shoeMat);
    toe.scale.set(.145, .078, .15); toe.position.set(0, -.01, -.17); shoe.add(toe);
    const sole = new THREE.Mesh(new THREE.BoxGeometry(.335, .052, .51), shoeSoleMat);
    sole.position.set(0, -.084, -.06); shoe.add(sole);
    const midsole = new THREE.Mesh(new THREE.BoxGeometry(.334, .035, .49), new THREE.MeshStandardMaterial({ color: 0xf7f7f2, roughness: .62 }));
    midsole.position.set(0, -.057, -.06); shoe.add(midsole);
    for (let i = 0; i < 4; i++) {
      const lace = new THREE.Mesh(new THREE.BoxGeometry(.105, .009, .018), seamMat);
      lace.position.set(0, .074 - i * .022, -.10 + i * .035); lace.rotation.y = (i % 2 ? -.16 : .16); shoe.add(lace);
    }
    // Three slanted stripes on the outside of each sneaker.
    const outerX = side * .157;
    for (let i = 0; i < 3; i++) {
      const stripe = new THREE.Mesh(new THREE.BoxGeometry(.012, .095, .034), shoeStripeMat);
      stripe.position.set(outerX, .005 + i * .008, -.145 + i * .072);
      stripe.rotation.y = -.34; stripe.rotation.z = -.26; shoe.add(stripe);
    }
    return { upper, calf, shoe };
  }
  const leftLegParts = makeLeg(-1), rightLegParts = makeLeg(1);

  // Arms use shoulder, elbow and wrist pivots so the sword swing moves the whole body.
  function makeArm(side) {
    const upper = new THREE.Group(); upper.position.set(side * .405, 1.57, -.005); model.add(upper);
    const sleeve = new THREE.Mesh(new THREE.CapsuleGeometry(.145, .32, 7, 18), shirtMat);
    sleeve.position.set(side * .025, -.245, -.01); sleeve.rotation.z = side * -.12; upper.add(sleeve);
    const shoulderCap = new THREE.Mesh(new THREE.SphereGeometry(.16, 18, 14), shirtMat);
    shoulderCap.position.set(0, -.055, 0); upper.add(shoulderCap);
    const forearm = new THREE.Group(); forearm.position.set(side * .055, -.49, -.025); upper.add(forearm);
    const lowerSleeve = new THREE.Mesh(new THREE.CapsuleGeometry(.122, .30, 7, 18), shirtMat);
    lowerSleeve.position.set(side * .015, -.205, -.025); lowerSleeve.rotation.z = side * -.10; forearm.add(lowerSleeve);
    const cuff = new THREE.Mesh(new THREE.CylinderGeometry(.12, .123, .17, 24), mintMat);
    cuff.position.set(side * .025, -.405, -.04); cuff.rotation.z = side * -.09; forearm.add(cuff);
    const cuffEdge = new THREE.Mesh(new THREE.TorusGeometry(.12, .009, 7, 24), seamMat);
    cuffEdge.rotation.x = Math.PI / 2; cuffEdge.position.set(side * .025, -.49, -.04); forearm.add(cuffEdge);
    const hand = new THREE.Group(); hand.position.set(side * .025, -.515, -.075); forearm.add(hand);
    const palm = new THREE.Mesh(new THREE.SphereGeometry(1, 20, 16), skin);
    palm.scale.set(.092, .105, .075); hand.add(palm);
    for (let f = 0; f < 4; f++) {
      const finger = new THREE.Mesh(new THREE.CapsuleGeometry(.019, .075, 4, 8), skinLight);
      finger.position.set((f - 1.5) * .038, -.085, -.008); finger.rotation.z = (f - 1.5) * -.11; hand.add(finger);
    }
    const thumb = new THREE.Mesh(new THREE.CapsuleGeometry(.022, .07, 4, 8), skin);
    thumb.position.set(side * .09, -.025, -.035); thumb.rotation.z = side * .78; hand.add(thumb);
    return { upper, forearm, hand };
  }
  const leftArmParts = makeArm(-1), rightArmParts = makeArm(1);

  // Neck and detailed face, with a restrained, natural eye size.
  const neck = new THREE.Mesh(new THREE.CylinderGeometry(.105, .125, .19, 24), skin);
  neck.position.set(0, 1.80, 0); model.add(neck);
  const head = new THREE.Group(); head.position.set(0, 2.12, -.005); model.add(head);
  const skull = new THREE.Mesh(new THREE.SphereGeometry(1, 48, 36), skin);
  skull.scale.set(.355, .405, .318); skull.position.set(0, .01, 0); skull.castShadow = true; skull.receiveShadow = true; head.add(skull);
  const jaw = new THREE.Mesh(new THREE.SphereGeometry(1, 32, 24), skin);
  jaw.scale.set(.285, .235, .265); jaw.position.set(0, -.17, -.035); head.add(jaw);
  // Ears and their inner folds.
  for (const side of [-1, 1]) {
    const ear = new THREE.Mesh(new THREE.SphereGeometry(1, 20, 16), skin);
    ear.scale.set(.075, .115, .07); ear.position.set(side * .35, -.015, .006); head.add(ear);
    const earInner = new THREE.Mesh(new THREE.SphereGeometry(1, 16, 12), skinShade);
    earInner.scale.set(.025, .065, .018); earInner.position.set(side * .387, -.02, -.045); head.add(earInner);
  }
  // Eyebrows, eyes, nose bridge and nostrils.
  for (const side of [-1, 1]) {
    const browCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(side * .075, .075, -.292), new THREE.Vector3(side * .135, .095, -.305), new THREE.Vector3(side * .205, .078, -.285)
    ]);
    head.add(new THREE.Mesh(new THREE.TubeGeometry(browCurve, 10, .012, 7, false), hairDark));
    const eyeSocket = new THREE.Mesh(new THREE.SphereGeometry(1, 20, 14), skinShade);
    eyeSocket.scale.set(.065, .076, .018); eyeSocket.position.set(side * .135, -.012, -.294); head.add(eyeSocket);
    const eye = new THREE.Mesh(new THREE.SphereGeometry(1, 24, 18), eyeWhite);
    eye.scale.set(.051, .061, .026); eye.position.set(side * .135, -.01, -.312); head.add(eye);
    const irisMesh = new THREE.Mesh(new THREE.SphereGeometry(1, 20, 14), iris);
    irisMesh.scale.set(.027, .036, .016); irisMesh.position.set(side * .135, -.012, -.335); head.add(irisMesh);
    const pupilMesh = new THREE.Mesh(new THREE.SphereGeometry(1, 16, 12), pupil);
    pupilMesh.scale.set(.014, .022, .009); pupilMesh.position.set(side * .135, -.012, -.349); head.add(pupilMesh);
    const glint = new THREE.Mesh(new THREE.SphereGeometry(.008, 8, 8), new THREE.MeshBasicMaterial({ color: 0xffffff }));
    glint.position.set(side * .126, .002, -.357); head.add(glint);
    const cheek = new THREE.Mesh(new THREE.SphereGeometry(1, 16, 12), new THREE.MeshStandardMaterial({ color: 0xe3a99a, roughness: .9, transparent: true, opacity: .26 }));
    cheek.scale.set(.072, .035, .012); cheek.position.set(side * .235, -.12, -.282); head.add(cheek);
  }
  const noseBridge = new THREE.Mesh(new THREE.SphereGeometry(1, 20, 14), skinLight);
  noseBridge.scale.set(.035, .067, .046); noseBridge.position.set(0, -.045, -.315); head.add(noseBridge);
  const noseTip = new THREE.Mesh(new THREE.SphereGeometry(1, 20, 14), skin);
  noseTip.scale.set(.048, .034, .042); noseTip.position.set(0, -.092, -.354); head.add(noseTip);
  for (const side of [-1, 1]) {
    const nostril = new THREE.Mesh(new THREE.SphereGeometry(.008, 8, 8), skinShade);
    nostril.position.set(side * .024, -.113, -.38); head.add(nostril);
  }
  const mouthCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-.047, -.205, -.302), new THREE.Vector3(0, -.216, -.318), new THREE.Vector3(.047, -.205, -.302)
  ]);
  head.add(new THREE.Mesh(new THREE.TubeGeometry(mouthCurve, 12, .008, 7, false), mouthMat));
  const lowerLip = new THREE.Mesh(new THREE.SphereGeometry(1, 12, 8), skinLight);
  lowerLip.scale.set(.035, .009, .009); lowerLip.position.set(0, -.229, -.303); head.add(lowerLip);

  // Thick, round black acetate frames like the reference photo.
  for (const side of [-1, 1]) {
    const rim = new THREE.Mesh(new THREE.TorusGeometry(.137, .019, 12, 40), glasses);
    rim.position.set(side * .137, -.012, -.351); head.add(rim);
    const innerRim = new THREE.Mesh(new THREE.TorusGeometry(.116, .0045, 8, 36), hairSheen);
    innerRim.position.set(side * .137, -.012, -.353); head.add(innerRim);
    const lensMesh = new THREE.Mesh(new THREE.CircleGeometry(.119, 36), lens);
    lensMesh.position.set(side * .137, -.012, -.346); head.add(lensMesh);
    const templeCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(side * .272, -.005, -.342), new THREE.Vector3(side * .335, .008, -.265), new THREE.Vector3(side * .355, .005, -.105)
    ]);
    const temple = new THREE.Mesh(new THREE.TubeGeometry(templeCurve, 14, .014, 8, false), glasses);
    head.add(temple);
  }
  const bridge = new THREE.Mesh(new THREE.CylinderGeometry(.014, .014, .075, 12), glasses);
  bridge.rotation.z = Math.PI / 2; bridge.position.set(0, -.002, -.354); head.add(bridge);

  // No hat. A dense, rounded, slightly wavy bowl-shaped hairstyle with visible strands.
  const cap = new THREE.Mesh(new THREE.SphereGeometry(.377, 48, 32, 0, Math.PI * 2, 0, 1.83), hair);
  cap.position.set(0, .145, .035); cap.castShadow = true; head.add(cap);
  // Thick side/back volume, matching the full hair silhouette in the photo.
  for (const side of [-1, 1]) {
    const sideVolume = new THREE.Mesh(new THREE.SphereGeometry(1, 28, 20), hair);
    sideVolume.scale.set(.105, .235, .285); sideVolume.position.set(side * .305, -.015, .065); head.add(sideVolume);
    const sideLock = new THREE.Mesh(new THREE.CapsuleGeometry(.052, .13, 6, 12), hairDark);
    sideLock.position.set(side * .325, -.14, -.055); sideLock.rotation.z = side * -.11; head.add(sideLock);
  }
  // Strands follow the crown and sweep toward the forehead in subtle curls.
  for (let i = 0; i < 27; i++) {
    const u = (i - 13) / 13;
    const x = u * .29;
    const wave = Math.sin(i * .83) * .018;
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(x + .025, .39 - Math.abs(u) * .04, .18),
      new THREE.Vector3(x + .035 + wave, .425 - Math.abs(u) * .025, .06),
      new THREE.Vector3(x - .018 + wave, .37, -.10),
      new THREE.Vector3(x + .012, .22 + Math.sin(i * .7) * .018, -.255)
    ]);
    head.add(new THREE.Mesh(new THREE.TubeGeometry(curve, 18, .009 + (i % 4) * .001, 6, false), i % 4 === 0 ? hairSheen : hairDark));
  }
  // Layered fringe curves create the thick, slightly uneven front edge without hiding the glasses.
  for (let i = 0; i < 17; i++) {
    const x = -.285 + i * .0356;
    const endY = .015 + Math.sin(i * 1.12) * .018;
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(x - .025, .31 + Math.sin(i) * .018, -.20),
      new THREE.Vector3(x - .012, .22, -.282),
      new THREE.Vector3(x + .008, .105 + Math.cos(i * .8) * .015, -.315),
      new THREE.Vector3(x + .012, endY, -.304)
    ]);
    head.add(new THREE.Mesh(new THREE.TubeGeometry(curve, 12, .022, 7, false), i % 3 === 0 ? hairSheen : hair));
  }
  // A handful of short, lifted waves on the top makes the hair look softly curly rather than helmet-like.
  for (let i = 0; i < 14; i++) {
    const x = -.25 + i * .038;
    const z = -.06 + (i % 4) * .055;
    const curl = new THREE.CatmullRomCurve3([
      new THREE.Vector3(x, .385, z),
      new THREE.Vector3(x + .025, .425, z - .025),
      new THREE.Vector3(x + .045, .405, z - .065)
    ]);
    head.add(new THREE.Mesh(new THREE.TubeGeometry(curl, 9, .012, 6, false), hairSheen));
  }

  // Basic sword is held by the right hand; the arm, elbow, torso and legs animate together.
  const swordPivot = new THREE.Group(); swordPivot.position.set(.025, -.015, -.025); rightArmParts.hand.add(swordPivot);
  const grip = new THREE.Mesh(new THREE.CylinderGeometry(.024, .028, .17, 10), new THREE.MeshStandardMaterial({ color: 0x62442e, roughness: .75 }));
  grip.rotation.z = Math.PI / 2; swordPivot.add(grip);
  const guard = new THREE.Mesh(new THREE.BoxGeometry(.22, .045, .065), new THREE.MeshStandardMaterial({ color: 0xd2ad5c, metalness: .42, roughness: .36 }));
  guard.position.y = .10; swordPivot.add(guard);
  const blade = new THREE.Mesh(new THREE.BoxGeometry(.078, .49, .026), new THREE.MeshPhysicalMaterial({ color: 0xcbdce1, metalness: .78, roughness: .2, clearcoat: .5 }));
  blade.position.y = .37; blade.castShadow = true; swordPivot.add(blade);
  const tip = new THREE.Mesh(new THREE.ConeGeometry(.055, .14, 4), new THREE.MeshStandardMaterial({ color: 0xe0edf0, metalness: .7, roughness: .2 }));
  tip.position.y = .685; tip.rotation.y = Math.PI / 4; swordPivot.add(tip);
  const pommel = new THREE.Mesh(new THREE.SphereGeometry(.045, 12, 10), new THREE.MeshStandardMaterial({ color: 0xd8b35c, metalness: .5, roughness: .3 }));
  pommel.position.y = -.105; swordPivot.add(pommel);

  // The silhouette is intentionally larger on screen than the earlier tiny prototype.
  const shadow = new THREE.Mesh(new THREE.CircleGeometry(.64, 40), new THREE.MeshBasicMaterial({ color: 0x1b2930, transparent: true, opacity: .27, depthWrite: false }));
  shadow.rotation.x = -Math.PI / 2; shadow.position.y = .014; root.add(shadow);
  return {
    root, model, torso, hips, head,
    leftArm: leftArmParts.upper, rightArm: rightArmParts.upper,
    leftForearm: leftArmParts.forearm, rightForearm: rightArmParts.forearm,
    leftHand: leftArmParts.hand, rightHand: rightArmParts.hand,
    leftLeg: leftLegParts.upper, rightLeg: rightLegParts.upper,
    leftCalf: leftLegParts.calf, rightCalf: rightLegParts.calf,
    swordPivot, shadow
  };
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
  // Transparent canvas: only the improper fraction itself is visible in flight.
  const canvas = document.createElement('canvas');
  canvas.width = 512; canvas.height = 512;
  const c = canvas.getContext('2d');
  c.clearRect(0, 0, canvas.width, canvas.height);
  c.textAlign = 'center'; c.textBaseline = 'middle';
  c.lineJoin = 'round';
  c.shadowColor = 'rgba(255, 190, 54, .95)'; c.shadowBlur = 28;
  c.lineWidth = 18; c.strokeStyle = '#163c52';
  c.font = '900 174px sans-serif';
  c.strokeText(String(numerator), 256, 145);
  c.strokeText(String(denominator), 256, 365);
  c.fillStyle = '#fffdf2';
  c.fillText(String(numerator), 256, 145);
  c.fillText(String(denominator), 256, 365);
  c.shadowBlur = 13; c.strokeStyle = '#f7c85d'; c.lineWidth = 9;
  c.beginPath(); c.moveTo(105, 255); c.lineTo(407, 255); c.stroke();
  c.shadowBlur = 0; c.fillStyle = '#f8d978';
  c.fillRect(111, 249, 290, 12);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}
function fireFraction() {
  // Every projectile is an improper fraction whose exact value is 5–10 HP.
  const amount = 5 + Math.floor(Math.random() * 6);
  const denominator = [2, 3, 4, 5][Math.floor(Math.random() * 4)];
  const numerator = amount * denominator;
  const actualDamage = numerator / denominator;
  const start = enemy.root.position.clone().add(new THREE.Vector3(0, 1.12, 0));
  const target = player.root.position.clone().add(new THREE.Vector3(0, .85, 0));
  const dir = target.sub(start).normalize();
  const group = new THREE.Group();
  group.position.copy(start);

  // A small luminous core and halo make the fraction look like a magic projectile,
  // not a flying workbook or a paper card.
  const core = new THREE.Mesh(
    new THREE.SphereGeometry(.19, 18, 14),
    new THREE.MeshStandardMaterial({ color: 0xffd66c, emissive: 0xb87917, emissiveIntensity: 1.25, roughness: .24, metalness: .18 })
  );
  core.position.y = -.02; group.add(core);
  const halo = new THREE.Mesh(
    new THREE.TorusGeometry(.29, .035, 8, 28),
    new THREE.MeshBasicMaterial({ color: 0xffd46a, transparent: true, opacity: .88 })
  );
  halo.rotation.x = Math.PI / 2; halo.position.y = -.02; group.add(halo);
  const glow = new THREE.PointLight(0xffc85c, 1.2, 2.8);
  glow.position.set(0, .05, 0); group.add(glow);

  // The sprite has a transparent background and always faces the camera.
  const fractionSprite = new THREE.Sprite(new THREE.SpriteMaterial({
    map: makeFractionTexture(numerator, denominator),
    transparent: true, depthWrite: false, depthTest: true
  }));
  fractionSprite.scale.set(1.02, 1.02, 1);
  fractionSprite.position.set(0, .10, 0);
  fractionSprite.renderOrder = 2;
  group.add(fractionSprite);

  scene.add(group);
  projectiles.push({ group, dir, amount: actualDamage, numerator, denominator, speed: 8.0, life: 4 });
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
function makeDoubleJumpEffect() {
  const burst = new THREE.Group();
  burst.position.set(player.root.position.x, player.root.position.y + .055, player.root.position.z);

  const ringMat = new THREE.MeshBasicMaterial({ color: 0x8af5ef, transparent: true, opacity: .95, side: THREE.DoubleSide, depthWrite: false });
  const ring = new THREE.Mesh(new THREE.RingGeometry(.22, .52, 40), ringMat);
  ring.rotation.x = -Math.PI / 2;
  burst.add(ring);
  const innerMat = new THREE.MeshBasicMaterial({ color: 0xffe08a, transparent: true, opacity: .95, side: THREE.DoubleSide, depthWrite: false });
  const innerRing = new THREE.Mesh(new THREE.RingGeometry(.10, .23, 32), innerMat);
  innerRing.rotation.x = -Math.PI / 2;
  innerRing.position.y = .012;
  burst.add(innerRing);

  const sparks = [];
  for (let i = 0; i < 10; i++) {
    const angle = (i / 10) * Math.PI * 2;
    const sparkMat = new THREE.MeshBasicMaterial({ color: i % 2 ? 0xffdc83 : 0x9af8ed, transparent: true, opacity: 1 });
    const spark = new THREE.Mesh(new THREE.SphereGeometry(.045, 8, 7), sparkMat);
    spark.position.set(Math.cos(angle) * .30, .02, Math.sin(angle) * .30);
    burst.add(spark);
    sparks.push({ mesh: spark, velocity: new THREE.Vector3(Math.cos(angle) * 1.45, .9 + (i % 3) * .22, Math.sin(angle) * 1.45) });
  }
  scene.add(burst);
  let age = 0;
  const duration = .48;
  effects.push({
    mesh: burst,
    update(dt) {
      age += dt;
      const t = Math.min(1, age / duration);
      ring.scale.setScalar(.55 + t * 1.75);
      innerRing.scale.setScalar(.75 + t * .95);
      ringMat.opacity = 1 - t;
      innerMat.opacity = 1 - t;
      burst.position.y += dt * .22;
      for (const item of sparks) {
        item.mesh.position.addScaledVector(item.velocity, dt);
        item.velocity.y -= 2.8 * dt;
        item.mesh.material.opacity = 1 - t;
        item.mesh.scale.setScalar(Math.max(.05, 1 - t * .8));
      }
      return age < duration;
    }
  });
}

function doAttack() {
  if (!started || ended || attackCooldown > 0) return;
  attackCooldown = .52; swingTime = .52;
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
  player.root.position.set(0,0,8);
  player.model.rotation.set(0, -Math.PI / 2, 0);
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
    if (jumpCount === 2) { makeDoubleJumpEffect(); say('더블 점프!',.7); }
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
  const direction = new THREE.Vector3(x, 0, z);
  const moving = direction.lengthSq() > 0;
  if (moving) {
    direction.normalize();
    player.root.position.addScaledVector(direction, 4.35 * dt);
    const targetYaw = Math.atan2(direction.x, -direction.z);
    let diff = targetYaw - player.model.rotation.y;
    diff = Math.atan2(Math.sin(diff), Math.cos(diff));
    player.model.rotation.y += diff * Math.min(1, dt * 10.5);
  }
  player.root.position.x = THREE.MathUtils.clamp(player.root.position.x, -11.5, 11.5);
  player.root.position.z = THREE.MathUtils.clamp(player.root.position.z, -39, 34);

  if (!grounded) {
    jumpVelocity -= 16.5 * dt;
    player.root.position.y += jumpVelocity * dt;
    if (player.root.position.y <= 0) {
      player.root.position.y = 0; jumpVelocity = 0; grounded = true; jumpCount = 0;
    }
  }

  const walkPhase = elapsed * 9.8;
  const runSwing = moving && grounded ? Math.sin(walkPhase) : 0;
  const idle = grounded && !moving;
  const bob = moving && grounded ? Math.abs(Math.sin(walkPhase)) * .035 : Math.sin(elapsed * 1.8) * .008;
  player.model.position.y = bob + (grounded ? 0 : Math.sin(elapsed * 9) * .012);

  // Natural gait: opposite arm/leg swing, bent elbows and soft torso/head counter-motion.
  if (swingTime <= 0) {
    player.leftLeg.rotation.x = THREE.MathUtils.damp(player.leftLeg.rotation.x, runSwing * .48, 10, dt);
    player.rightLeg.rotation.x = THREE.MathUtils.damp(player.rightLeg.rotation.x, -runSwing * .48, 10, dt);
    player.leftCalf.rotation.x = THREE.MathUtils.damp(player.leftCalf.rotation.x, Math.max(0, -runSwing) * .42, 9, dt);
    player.rightCalf.rotation.x = THREE.MathUtils.damp(player.rightCalf.rotation.x, Math.max(0, runSwing) * .42, 9, dt);
    player.leftArm.rotation.x = THREE.MathUtils.damp(player.leftArm.rotation.x, -runSwing * .32, 9, dt);
    player.rightArm.rotation.x = THREE.MathUtils.damp(player.rightArm.rotation.x, runSwing * .24, 9, dt);
    player.leftArm.rotation.z = THREE.MathUtils.damp(player.leftArm.rotation.z, .10, 8, dt);
    player.rightArm.rotation.z = THREE.MathUtils.damp(player.rightArm.rotation.z, -.12, 8, dt);
    player.leftForearm.rotation.x = THREE.MathUtils.damp(player.leftForearm.rotation.x, -.16, 8, dt);
    player.rightForearm.rotation.x = THREE.MathUtils.damp(player.rightForearm.rotation.x, -.22, 8, dt);
    player.torso.rotation.x = THREE.MathUtils.damp(player.torso.rotation.x, moving ? -.035 : 0, 7, dt);
    player.torso.rotation.y = THREE.MathUtils.damp(player.torso.rotation.y, runSwing * .035, 7, dt);
    player.torso.rotation.z = THREE.MathUtils.damp(player.torso.rotation.z, moving ? -x * .045 : 0, 7, dt);
    player.hips.rotation.y = THREE.MathUtils.damp(player.hips.rotation.y, -runSwing * .025, 7, dt);
    player.head.rotation.x = THREE.MathUtils.damp(player.head.rotation.x, moving ? -.018 : Math.sin(elapsed * 1.5) * .008, 7, dt);
    player.head.rotation.y = THREE.MathUtils.damp(player.head.rotation.y, 0, 7, dt);
    player.swordPivot.rotation.x = THREE.MathUtils.damp(player.swordPivot.rotation.x, -.12, 8, dt);
    player.swordPivot.rotation.z = THREE.MathUtils.damp(player.swordPivot.rotation.z, -.08, 8, dt);
  }

  // Mid-air body pose: knees tuck, arms balance, then relax on landing.
  if (!grounded && swingTime <= 0) {
    const lift = THREE.MathUtils.clamp(player.root.position.y / 1.45, 0, 1);
    player.leftLeg.rotation.x = THREE.MathUtils.damp(player.leftLeg.rotation.x, .48 * lift, 8, dt);
    player.rightLeg.rotation.x = THREE.MathUtils.damp(player.rightLeg.rotation.x, .48 * lift, 8, dt);
    player.leftCalf.rotation.x = THREE.MathUtils.damp(player.leftCalf.rotation.x, .6 * lift, 8, dt);
    player.rightCalf.rotation.x = THREE.MathUtils.damp(player.rightCalf.rotation.x, .6 * lift, 8, dt);
    player.leftArm.rotation.x = THREE.MathUtils.damp(player.leftArm.rotation.x, -.5 * lift, 8, dt);
    player.rightArm.rotation.x = THREE.MathUtils.damp(player.rightArm.rotation.x, -.25 * lift, 8, dt);
    player.torso.rotation.x = THREE.MathUtils.damp(player.torso.rotation.x, -.10 * lift, 7, dt);
  }

  // A clear wind-up, committed torso twist, shoulder swing, elbow follow-through,
  // opposite-leg step and head counterbalance. The sword is only one part of it.
  if (swingTime > 0) {
    swingTime = Math.max(0, swingTime - dt);
    const t = 1 - swingTime / .52;
    const wind = THREE.MathUtils.smoothstep(t, 0, .28);
    const strike = Math.sin(Math.PI * THREE.MathUtils.clamp((t - .20) / .58, 0, 1));
    const recover = 1 - THREE.MathUtils.smoothstep(t, .62, 1);
    const power = Math.max(strike, wind * .25) * recover;
    player.torso.rotation.y = -.36 * power;
    player.torso.rotation.x = -.11 * power;
    player.torso.rotation.z = -.14 * power;
    player.hips.rotation.y = -.19 * power;
    player.head.rotation.y = .20 * power;
    player.head.rotation.x = -.055 * power;
    player.rightArm.rotation.x = -.18 + 1.62 * power;
    player.rightArm.rotation.z = -.58 * power;
    player.rightForearm.rotation.x = -.22 - 1.22 * power;
    player.rightForearm.rotation.z = -.18 * power;
    player.rightHand.rotation.z = -.12 * power;
    player.leftArm.rotation.x = .20 + .52 * power;
    player.leftArm.rotation.z = .20 * power;
    player.leftForearm.rotation.x = -.10 - .42 * power;
    player.leftLeg.rotation.x = .28 * power;
    player.rightLeg.rotation.x = -.20 * power;
    player.leftCalf.rotation.x = .16 * power;
    player.rightCalf.rotation.x = .28 * power;
    player.swordPivot.rotation.z = -.28 - .32 * power;
    player.swordPivot.rotation.x = -.35 - .55 * power;
  }

  attackCooldown = Math.max(0, attackCooldown - dt);
  hurtTimer = Math.max(0, hurtTimer - dt);
  player.shadow.material.opacity = .27 - Math.min(.13, player.root.position.y * .07);
  player.shadow.scale.setScalar(1 + player.root.position.y * .10);
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
  // Orthographic sideline broadcast angle, rotated 90 degrees from the old chase view.
  // Looking across the route makes its long axis run horizontally like a football game.
  // The target is shifted to the far side so Jaeseok appears around the lower-middle,
  // while the tighter framing keeps the full character large and readable.
  const desired = new THREE.Vector3(
    player.root.position.x + 25.0,
    37.0 + player.root.position.y * .25,
    player.root.position.z + .05
  );
  camera.position.lerp(desired, 1 - Math.exp(-dt * 4.8));
  // Aim at the middle of the avatar so the whole body sits in the center,
  // rather than slipping toward the bottom edge of the screen.
  const look = new THREE.Vector3(
    player.root.position.x,
    1.28 + player.root.position.y,
    player.root.position.z
  );
  camera.lookAt(look);
}
function resize() {
  const w = mount.clientWidth || window.innerWidth;
  const h = mount.clientHeight || window.innerHeight;
  const aspect = w / h;
  const viewHeight = aspect < 1 ? 19.0 : 15.0;
  const halfH = viewHeight / 2;
  const halfW = halfH * aspect;
  camera.left = -halfW; camera.right = halfW;
  camera.top = halfH; camera.bottom = -halfH;
  camera.updateProjectionMatrix();
  renderer.setSize(w, h, false);
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
