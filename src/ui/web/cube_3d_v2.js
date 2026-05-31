console.log("LOADING THE CORRECT cube_3d.js");
// ============================================================
// Maltese Gear Cube Viewer — Three.js (ES Module Version)
// ============================================================

import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";
import { playMoveSequence } from "./cube_moves.js";

// ------------------------------------------------------------
// Scene, Camera, Renderer
// ------------------------------------------------------------

const canvas = document.getElementById("cubeCanvas");

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x111111);

const camera = new THREE.PerspectiveCamera(
  45,
  window.innerWidth / window.innerHeight,
  0.1,
  100
);
camera.position.set(4, 4, 6);
camera.lookAt(0, 0, 0);

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);

// ------------------------------------------------------------
// Lighting
// ------------------------------------------------------------

scene.add(new THREE.AmbientLight(0xffffff, 0.6));

const dir = new THREE.DirectionalLight(0xffffff, 0.8);
dir.position.set(5, 10, 7);
scene.add(dir);

// ------------------------------------------------------------
// Face Colors (Meffert’s Gear Cube)
// ------------------------------------------------------------

const FACE_COLORS = {
  U: 0xffffff, // white
  D: 0xffff00, // yellow
  F: 0x00ff00, // green
  B: 0x0000ff, // blue
  R: 0xff0000, // red
  L: 0xff8000  // orange
};

// ------------------------------------------------------------
// Face Groups
// ------------------------------------------------------------

export const faceGroups = {
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
// Gear Geometry Helpers
// ------------------------------------------------------------

// 4‑lobe gear “flower” shape
function createGearLobeShape() {
  const shape = new THREE.Shape();
  const radius = 0.9;
  const lobes = 4;

  for (let i = 0; i < lobes; i++) {
    const angle = (i / lobes) * Math.PI * 2;
    const x = Math.cos(angle) * radius;
    const y = Math.sin(angle) * radius;

    if (i === 0) shape.moveTo(x, y);
    else shape.lineTo(x, y);
  }

  shape.closePath();
  return shape;
}

// Sticker arc
function createStickerArc(color) {
  const shape = new THREE.Shape();
  shape.absarc(0, 0, 0.75, 0, Math.PI * 2);

  const geom = new THREE.ExtrudeGeometry(shape, {
    depth: 0.05,
    bevelEnabled: false
  });

  const mat = new THREE.MeshPhongMaterial({ color });
  const mesh = new THREE.Mesh(geom, mat);
  mesh.position.z = 0.1;
  return mesh;
}

// ------------------------------------------------------------
// Build a single gear face
// ------------------------------------------------------------

function buildGearFace(faceKey, normal, up, group) {
  const right = new THREE.Vector3().crossVectors(normal, up).normalize();
  const center = normal.clone().multiplyScalar(1.5);

  // Base circular plate
  const plateGeom = new THREE.CircleGeometry(1.1, 64);
  const plateMat = new THREE.MeshPhongMaterial({ color: 0x000000 });
  const plate = new THREE.Mesh(plateGeom, plateMat);
  plate.position.copy(center);
  plate.lookAt(center.clone().add(normal));
  group.add(plate);

  // Gear lobe shape
  const lobeShape = createGearLobeShape();
  const lobeGeom = new THREE.ExtrudeGeometry(lobeShape, {
    depth: 0.15,
    bevelEnabled: false
  });
  const lobeMat = new THREE.MeshPhongMaterial({ color: 0x000000 });

  const lobe = new THREE.Mesh(lobeGeom, lobeMat);
  lobe.position.copy(center);
  lobe.lookAt(center.clone().add(normal));
  group.add(lobe);

  // Sticker arc
  const sticker = createStickerArc(FACE_COLORS[faceKey]);
  sticker.position.copy(center);
  sticker.lookAt(center.clone().add(normal));
  group.add(sticker);
}

// ------------------------------------------------------------
// Build the full cube
// ------------------------------------------------------------

function buildCube() {
  buildGearFace("U", new THREE.Vector3(0, 1, 0), new THREE.Vector3(0, 0, -1), faceGroups.U);
  buildGearFace("D", new THREE.Vector3(0, -1, 0), new THREE.Vector3(0, 0, 1), faceGroups.D);
  buildGearFace("F", new THREE.Vector3(0, 0, 1), new THREE.Vector3(0, 1, 0), faceGroups.F);
  buildGearFace("B", new THREE.Vector3(0, 0, -1), new THREE.Vector3(0, 1, 0), faceGroups.B);
  buildGearFace("R", new THREE.Vector3(1, 0, 0), new THREE.Vector3(0, 1, 0), faceGroups.R);
  buildGearFace("L", new THREE.Vector3(-1, 0, 0), new THREE.Vector3(0, 1, 0), faceGroups.L);
}

buildCube();

// ------------------------------------------------------------
// Animation Loop
// ------------------------------------------------------------

let autoRotY = 0;

function animate() {
  requestAnimationFrame(animate);

  autoRotY += 0.002;
  scene.rotation.y = autoRotY;

  renderer.render(scene, camera);
}

animate();

// ------------------------------------------------------------
// Resize Handling
// ------------------------------------------------------------

window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// ------------------------------------------------------------
// UI Buttons
// ------------------------------------------------------------

document.getElementById("scrambleBtn").addEventListener("click", () => {
  const moves = ["R2", "L2", "U2", "D2", "F2", "B2"];
  const seq = Array.from({ length: 20 }, () =>
    moves[Math.floor(Math.random() * moves.length)]
  );
  playMoveSequence(seq, faceGroups);
});

document.getElementById("solveBtn").addEventListener("click", () => {
  const demo = ["R2", "U2", "F2", "L2", "D2", "B2"];
  playMoveSequence(demo, faceGroups);
});
