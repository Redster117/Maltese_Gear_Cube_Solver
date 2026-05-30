// ============================================================
// Maltese Gear Cube — WebGL Viewer (Three.js)
// Light gear-style sticker layout
// ============================================================

const canvas = document.getElementById('cubeCanvas');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(window.devicePixelRatio);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x111111);

const camera = new THREE.PerspectiveCamera(45, 2, 0.1, 100);
camera.position.set(4, 4, 6);

const light = new THREE.DirectionalLight(0xffffff, 1);
light.position.set(5, 10, 7);
scene.add(light);
scene.add(new THREE.AmbientLight(0x404040));

// Face colors (U, D, F, B, R, L)
const FACE_COLORS = {
  U: 0xffffff,
  D: 0xffff00,
  F: 0x00ff00,
  B: 0x0000ff,
  R: 0xff0000,
  L: 0xff8000
};

// Groups for each face (for animations)
const faceGroups = {
  U: new THREE.Group(),
  D: new THREE.Group(),
  F: new THREE.Group(),
  B: new THREE.Group(),
  R: new THREE.Group(),
  L: new THREE.Group()
};

scene.add(
  faceGroups.U,
  faceGroups.D,
  faceGroups.F,
  faceGroups.B,
  faceGroups.R,
  faceGroups.L
);

// ------------------------------------------------------------
// Build stickered cube with light gear-style arcs
// ------------------------------------------------------------

function createSticker(color) {
  const geom = new THREE.PlaneGeometry(0.9, 0.9);
  const mat = new THREE.MeshPhongMaterial({ color, side: THREE.FrontSide });
  const mesh = new THREE.Mesh(geom, mat);
  return mesh;
}

function addFaceStickers(faceKey, normal, up, group, baseOffset) {
  // 3x3 grid, but we rotate each sticker slightly around center
  // to give a subtle "gear arc" feeling.
  const color = FACE_COLORS[faceKey];
  const center = new THREE.Vector3().copy(normal).multiplyScalar(1.5);

  for (let row = -1; row <= 1; row++) {
    for (let col = -1; col <= 1; col++) {
      const sticker = createSticker(color);

      const right = new THREE.Vector3().crossVectors(normal, up).normalize();
      const pos = new THREE.Vector3()
        .copy(center)
        .addScaledVector(up, row * 1.02)
        .addScaledVector(right, col * 1.02);

      sticker.position.copy(pos);

      // Orient plane to face outward
      const lookAtTarget = new THREE.Vector3().copy(pos).add(normal);
      sticker.lookAt(lookAtTarget);

      // Light gear-style: rotate around face normal based on (row, col)
      const angle = (row * col) * 0.15; // small twist
      sticker.rotateOnAxis(normal, angle + baseOffset);

      group.add(sticker);
    }
  }
}

function buildCube() {
  // Up (0,1,0)
  addFaceStickers('U', new THREE.Vector3(0, 1, 0), new THREE.Vector3(0, 0, -1), faceGroups.U, 0.1);
  // Down (0,-1,0)
  addFaceStickers('D', new THREE.Vector3(0, -1, 0), new THREE.Vector3(0, 0, 1), faceGroups.D, -0.1);
  // Front (0,0,1)
  addFaceStickers('F', new THREE.Vector3(0, 0, 1), new THREE.Vector3(0, 1, 0), faceGroups.F, 0.15);
  // Back (0,0,-1)
  addFaceStickers('B', new THREE.Vector3(0, 0, -1), new THREE.Vector3(0, 1, 0), faceGroups.B, -0.15);
  // Right (1,0,0)
  addFaceStickers('R', new THREE.Vector3(1, 0, 0), new THREE.Vector3(0, 1, 0), faceGroups.R, 0.12);
  // Left (-1,0,0)
  addFaceStickers('L', new THREE.Vector3(-1, 0, 0), new THREE.Vector3(0, 1, 0), faceGroups.L, -0.12);
}

buildCube();

// ------------------------------------------------------------
// Basic orbit-like rotation (no mouse yet, just auto spin)
// ------------------------------------------------------------

let autoRotY = 0;

function resizeRendererToDisplaySize() {
  const width = window.innerWidth;
  const height = window.innerHeight;
  const needResize = canvas.width !== width || canvas.height !== height;
  if (needResize) {
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
  }
}

function render(time) {
  time *= 0.001;
  resizeRendererToDisplaySize();

  autoRotY += 0.002;
  scene.rotation.y = autoRotY;

  renderer.render(scene, camera);
  requestAnimationFrame(render);
}

requestAnimationFrame(render);

// ------------------------------------------------------------
// Hook up buttons to move animations (from cube_moves.js)
// ------------------------------------------------------------

document.getElementById('scrambleBtn').addEventListener('click', () => {
  // For now: random sequence of moves
  const moves = [];
  const allMoves = ['R2', 'L2', 'U2', 'D2', 'F2', 'B2'];
  for (let i = 0; i < 20; i++) {
    moves.push(allMoves[Math.floor(Math.random() * allMoves.length)]);
  }
  playMoveSequence(moves, faceGroups);
});

document.getElementById('solveBtn').addEventListener('click', () => {
  // Placeholder: later this will call your Python solver via API.
  const demoSolution = ['R2', 'U2', 'F2', 'L2', 'D2', 'B2'];
  playMoveSequence(demoSolution, faceGroups);
});
