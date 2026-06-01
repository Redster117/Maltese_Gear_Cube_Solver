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

const orbitTarget = new THREE.Vector3(0, 0, 0);
const spherical = new THREE.Spherical();
spherical.setFromVector3(camera.position.clone().sub(orbitTarget));

const minDistance = 2.0;
const maxDistance = 12.0;
const rotateSpeed = 0.005;
const zoomSpeed = 1;
const panSpeed = 1;

let isPointerDown = false;
let pointerMode = null;
const pointerStart = new THREE.Vector2();
let startTheta = spherical.theta;
let startPhi = spherical.phi;
const startTarget = new THREE.Vector3();

function updateCamera() {
  spherical.makeSafe();
  spherical.radius = Math.max(minDistance, Math.min(maxDistance, spherical.radius));
  const offset = new THREE.Vector3().setFromSpherical(spherical);
  camera.position.copy(orbitTarget).add(offset);
  camera.lookAt(orbitTarget);
}

function getPanVectors() {
  camera.updateMatrixWorld();
  const cameraDirection = new THREE.Vector3();
  camera.getWorldDirection(cameraDirection);
  const cameraRight = new THREE.Vector3().crossVectors(cameraDirection, camera.up).normalize();
  const cameraUp = camera.up.clone().normalize();
  return { cameraRight, cameraUp };
}

canvas.addEventListener("pointerdown", (event) => {
  const isPan = event.button === 1 || (event.button === 0 && event.ctrlKey);
  const isRotate = event.button === 0 && !event.ctrlKey;
  if (!isPan && !isRotate) return;

  isPointerDown = true;
  pointerMode = isPan ? "pan" : "rotate";
  pointerStart.set(event.clientX, event.clientY);
  startTheta = spherical.theta;
  startPhi = spherical.phi;
  startTarget.copy(orbitTarget);
  canvas.setPointerCapture(event.pointerId);
});

window.addEventListener("pointermove", (event) => {
  if (!isPointerDown) return;

  const deltaX = event.clientX - pointerStart.x;
  const deltaY = event.clientY - pointerStart.y;

  if (pointerMode === "rotate") {
    spherical.theta = startTheta - deltaX * rotateSpeed;
    spherical.phi = Math.min(Math.PI - 0.1, Math.max(0.1, startPhi - deltaY * rotateSpeed));
    updateCamera();
    return;
  }

  const { cameraRight, cameraUp } = getPanVectors();
  const panOffset = new THREE.Vector3()
    .addScaledVector(cameraRight, -deltaX * panSpeed * spherical.radius)
    .addScaledVector(cameraUp, -deltaY * panSpeed * spherical.radius);

  orbitTarget.copy(startTarget).add(panOffset);
  updateCamera();
});

window.addEventListener("pointerup", (event) => {
  if (event.pointerId != null) canvas.releasePointerCapture(event.pointerId);
  isPointerDown = false;
  pointerMode = null;
});

canvas.addEventListener("wheel", (event) => {
  event.preventDefault();
  spherical.radius = Math.max(minDistance, Math.min(maxDistance, spherical.radius + event.deltaY * 0.01 * zoomSpeed));
  updateCamera();
}, { passive: false });

canvas.addEventListener("contextmenu", (event) => event.preventDefault());

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
  L: 0x8000FF  // purple
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

// ------------------------------------------------------------
// 12‑Tooth Slightly‑Rounded Gear Shape (Option A rounding)
// ------------------------------------------------------------
function createGearToothShape() {
  const shape = new THREE.Shape();

  const teeth = 12;
  const toothOut = 1.05 + 0.18; // outward tooth radius
  const toothIn  = 1.05 - 0.10; // valley radius
  const roundness = 0.22;       // slight rounding at tips

  for (let i = 0; i < teeth; i++) {
    const angle = (i / teeth) * Math.PI * 2;
    const nextAngle = ((i + 1) / teeth) * Math.PI * 2;

    // Tooth tip (slightly rounded)
    const midAngle = angle + (nextAngle - angle) * 0.5;
    const tipX = Math.cos(midAngle) * toothOut;
    const tipY = Math.sin(midAngle) * toothOut;

    // Valley between teeth
    const valleyX = Math.cos(nextAngle) * toothIn;
    const valleyY = Math.sin(nextAngle) * toothIn;

    if (i === 0) {
      shape.moveTo(tipX, tipY);
    } else {
      shape.quadraticCurveTo(
        Math.cos(angle) * (toothOut + roundness),
        Math.sin(angle) * (toothOut + roundness),
        tipX,
        tipY
      );
    }

    // Smooth inward curve to valley
    shape.quadraticCurveTo(
      Math.cos(midAngle) * (toothIn - roundness),
      Math.sin(midAngle) * (toothIn - roundness),
      valleyX,
      valleyY
    );
  }

  shape.closePath();
  return shape;
}

// ------------------------------------------------------------
// Raised Gear Ring (extruded 12‑tooth rounded gear)
// ------------------------------------------------------------
function createGearRing() {
  const toothShape = createGearToothShape();

  const extrude = new THREE.ExtrudeGeometry(toothShape, {
    depth: 0.22,        // raised ring height
    bevelEnabled: false
  });

  const mat = new THREE.MeshPhongMaterial({
    color: 0x000000,
    shininess: 40
  });

  const ring = new THREE.Mesh(extrude, mat);
  ring.position.z = 0.11; // sits above the face
  ring.visible = false;
  return ring;
}

// ------------------------------------------------------------
// Center Hub (recessed disc + small cap)
// ------------------------------------------------------------
function createCenterHub() {
  const group = new THREE.Group();

  // Recessed disc
  const discGeom = new THREE.CylinderGeometry(0.55, 0.55, 0.18, 48);
  const discMat = new THREE.MeshPhongMaterial({ color: 0x111111 });
  const disc = new THREE.Mesh(discGeom, discMat);
  disc.position.z = -0.09; // slightly recessed
  group.add(disc);

  // Center cap
  const capGeom = new THREE.CylinderGeometry(0.25, 0.25, 0.05, 32);
  const capMat = new THREE.MeshPhongMaterial({ color: 0x222222 });
  const cap = new THREE.Mesh(capGeom, capMat);
  cap.position.z = 0.02;
  group.add(cap);

  group.visible = false;
  return group;
}

// ------------------------------------------------------------
// Rounded Rectangular Sticker (Option B)
// ------------------------------------------------------------
function createRoundedSticker(color) {
  const width = 0.85;
  const height = 0.55;
  const radius = 0.18;

  const shape = new THREE.Shape();

  // Start at top-left corner
  shape.moveTo(-width/2 + radius, height/2);

  // Top edge
  shape.lineTo(width/2 - radius, height/2);
  shape.quadraticCurveTo(width/2, height/2, width/2, height/2 - radius);

  // Right edge
  shape.lineTo(width/2, -height/2 + radius);
  shape.quadraticCurveTo(width/2, -height/2, width/2 - radius, -height/2);

  // Bottom edge
  shape.lineTo(-width/2 + radius, -height/2);
  shape.quadraticCurveTo(-width/2, -height/2, -width/2, -height/2 + radius);

  // Left edge
  shape.lineTo(-width/2, height/2 - radius);
  shape.quadraticCurveTo(-width/2, height/2, -width/2 + radius, height/2);

  const geom = new THREE.ExtrudeGeometry(shape, {
    depth: 0.03,
    bevelEnabled: false
  });

  const mat = new THREE.MeshPhongMaterial({ color });
  const mesh = new THREE.Mesh(geom, mat);
  mesh.position.z = 0.25; // sits above gear ring

  return mesh;
}

// ------------------------------------------------------------
// Build a single gear face
// ------------------------------------------------------------

function buildGearFace(faceKey, normal, up, group) {
  const center = normal.clone().multiplyScalar(1.75);

  // Base circular plate
  const plateGeom = new THREE.CircleGeometry(1.1, 64);
  const plateMat = new THREE.MeshPhongMaterial({ color: 0x000000 });
  const plate = new THREE.Mesh(plateGeom, plateMat);
  plate.position.copy(center);
  plate.lookAt(center.clone().add(normal));
  plate.visible = false;
  group.add(plate);

  // Gear ring
  const ring = createGearRing();
  ring.position.copy(center);
  ring.lookAt(center.clone().add(normal));
  group.add(ring);

  // Center hub
  const hub = createCenterHub();
  hub.position.copy(center);
  hub.lookAt(center.clone().add(normal));
  group.add(hub);

  // Rounded sticker
  const sticker = createRoundedSticker(FACE_COLORS[faceKey]);
  sticker.position.copy(center);
  sticker.lookAt(center.clone().add(normal));
  sticker.visible = false;
  group.add(sticker);
}

// ------------------------------------------------------------
// Build a full Maltese Gear Cube face
// ------------------------------------------------------------
function buildCube() {

  // --- Build all 6 gear faces ---
  buildGearFace("U", new THREE.Vector3(0, 1, 0),  new THREE.Vector3(0, 0, -1), faceGroups.U);
  buildGearFace("D", new THREE.Vector3(0, -1, 0), new THREE.Vector3(0, 0, 1),  faceGroups.D);
  buildGearFace("F", new THREE.Vector3(0, 0, 1),  new THREE.Vector3(0, 1, 0),  faceGroups.F);
  buildGearFace("B", new THREE.Vector3(0, 0, -1), new THREE.Vector3(0, 1, 0),  faceGroups.B);
  buildGearFace("R", new THREE.Vector3(1, 0, 0),  new THREE.Vector3(0, 1, 0),  faceGroups.R);
  buildGearFace("L", new THREE.Vector3(-1, 0, 0), new THREE.Vector3(0, 1, 0),  faceGroups.L);

  // --- Add corner blocks ---
  placeCornerBlocks(scene);

  // --- Add edge blocks ---
  placeEdgeBlocks(scene);
}
buildCube();

// ------------------------------------------------------------
// Corner face panel helper
// ------------------------------------------------------------
function createCornerFacePanel(color) {
  const width = 0.66;
  const height = 0.66;

  const shape = new THREE.Shape();
  shape.moveTo(0, height / 2);
  shape.quadraticCurveTo(width / 2, height / 2, width / 2, 0);
  shape.quadraticCurveTo(width / 2, -height / 2, 0, -height / 2);
  shape.quadraticCurveTo(-width / 2, -height / 2, -width / 2, 0);
  shape.quadraticCurveTo(-width / 2, height / 2, 0, height / 2);

  const geom = new THREE.ExtrudeGeometry(shape, {
    depth: 0.03,
    bevelEnabled: false
  });

  const mat = new THREE.MeshPhongMaterial({ color, shininess: 20 });
  const mesh = new THREE.Mesh(geom, mat);
  mesh.position.z = 0.015;
  return mesh;
}

// ------------------------------------------------------------
// Single triangular tooth helper
// ------------------------------------------------------------
function createTriangularToothGeometry(baseWidth, height, depth) {
  const shape = new THREE.Shape();
  shape.moveTo(-baseWidth / 2, 0);
  shape.lineTo(baseWidth / 2, 0);
  shape.lineTo(0, height);
  shape.closePath();

  return new THREE.ExtrudeGeometry(shape, {
    depth,
    bevelEnabled: false
  });
}

// ------------------------------------------------------------
// Rotation helper for explicit XYZ Euler angles
// ------------------------------------------------------------
function setMeshRotation(mesh, x = 0, y = 0, z = 0) {
  mesh.rotation.set(x, y, z);
}

function createToothMatrix(xDeg = 0, yDeg = 0, zDeg = 0, x = 0, y = 0, z = 0) {
  // xDeg/yDeg/zDeg are rotation angles in degrees around X, Y, Z axes.
  // x/y/z are the translation offsets applied after rotation.
  return new THREE.Matrix4()
    .makeRotationFromEuler(new THREE.Euler(
      THREE.MathUtils.degToRad(xDeg),
      THREE.MathUtils.degToRad(yDeg),
      THREE.MathUtils.degToRad(zDeg)
    ))
    .setPosition(x, y, z);
}

// ------------------------------------------------------------
// Simple geometry merge helper for same-attribute geometries
// ------------------------------------------------------------
function concatFloat32Arrays(arrays) {
  let length = 0;
  arrays.forEach((arr) => { length += arr.length; });
  const result = new Float32Array(length);
  let offset = 0;
  arrays.forEach((arr) => {
    result.set(arr, offset);
    offset += arr.length;
  });
  return result;
}

function mergeSimpleGeometries(geometries, useGroups = false) {
  const hasIndexed = geometries.some((g) => g.index !== null);
  const hasNonIndexed = geometries.some((g) => g.index === null);
  const mergedGeometry = new THREE.BufferGeometry();

  const positionArrays = [];
  const normalArrays = [];
  const indexArrays = [];
  const groups = [];

  let vertexOffset = 0;
  let indexOffset = 0;

  for (let idx = 0; idx < geometries.length; idx += 1) {
    const geometry = geometries[idx];
    let geom = geometry.clone();

    if (hasIndexed && hasNonIndexed && geom.index !== null) {
      geom = geom.toNonIndexed();
    }

    if (geom.index === null) {
      const count = geom.attributes.position.count;
      const indices = [];
      for (let i = 0; i < count; i += 3) {
        indices.push(i, i + 1, i + 2);
      }
      geom.setIndex(indices);
    }

    if (!geom.attributes.normal) {
      geom.computeVertexNormals();
    }

    if (!geom.attributes.position || !geom.attributes.normal) {
      console.error('mergeSimpleGeometries failed with geometry at index ' + idx + '. Missing required position or normal attributes.');
      return null;
    }

    positionArrays.push(geom.attributes.position.array);
    normalArrays.push(geom.attributes.normal.array);

    const indexArray = geom.index.array;
    for (let i = 0; i < indexArray.length; i += 1) {
      indexArrays.push(indexArray[i] + vertexOffset);
    }

    if (useGroups) {
      const materialIndex = geom.groups[0] ? geom.groups[0].materialIndex : 0;
      groups.push({ start: indexOffset, count: indexArray.length, materialIndex });
    }

    vertexOffset += geom.attributes.position.count;
    indexOffset += indexArray.length;
  }

  mergedGeometry.setAttribute('position', new THREE.Float32BufferAttribute(concatFloat32Arrays(positionArrays), 3));
  mergedGeometry.setAttribute('normal', new THREE.Float32BufferAttribute(concatFloat32Arrays(normalArrays), 3));
  mergedGeometry.setIndex(indexArrays);
  if (useGroups) mergedGeometry.groups = groups;

  return mergedGeometry;
}

// ------------------------------------------------------------
// Corner Block (hollow inward-facing corner shell)
// ------------------------------------------------------------
function createCornerBlock(signX, signY, signZ) {
  const group = new THREE.Group();

  const outer = 0.9; // outer side length
  const depth = 0.55; // wall height
  const wallThickness = 0.10;

  const shellMaterial = new THREE.MeshPhongMaterial({
    color: 0xffffff,
    shininess: 30,
    side: THREE.DoubleSide
  });

  const teethMaterial = new THREE.MeshPhongMaterial({
    color: 0x444444,
    shininess: 40,
    side: THREE.DoubleSide
  });

  const wallZGeom = new THREE.BoxGeometry(outer, outer, wallThickness);
  const wallXGeom = new THREE.BoxGeometry(wallThickness, outer, outer);
  const wallYGeom = new THREE.BoxGeometry(outer, wallThickness, outer);

  const addGeometry = (geometry, matrix, materialIndex, targetArray) => {
    const geom = geometry.clone();
    geom.applyMatrix4(matrix);
    const count = geom.index ? geom.index.count : geom.attributes.position.count;
    geom.groups = [{ start: 0, count, materialIndex }];
    targetArray.push(geom);
  };

  const geoms = [];
  addGeometry(wallZGeom, new THREE.Matrix4().makeTranslation(outer / 2, outer / 2, wallThickness / 2), 0, geoms);
  addGeometry(wallXGeom, new THREE.Matrix4().makeTranslation(wallThickness / 2, outer / 2, outer / 2), 0, geoms);
  addGeometry(wallYGeom, new THREE.Matrix4().makeTranslation(outer / 2, wallThickness / 2, outer / 2), 0, geoms);

  const toothDepth = 0.1;
  const toothWidth = 0.35;
  const toothHeight = 0.43;
  const toothGeom = createTriangularToothGeometry(toothWidth, toothHeight, toothDepth);

  const toothMatrix = createToothMatrix(0, 0, 90, 0, 0.70, 0.8);
  addGeometry(toothGeom, toothMatrix, 1, geoms);

  const tooth2Matrix = createToothMatrix(0, 0, 90, 0, 0.176666666, 0.8);
  addGeometry(toothGeom, tooth2Matrix, 1, geoms);

  const tooth3Matrix = createToothMatrix(90, 90, 180, 0.8, 0.176666666, 0);
  addGeometry(toothGeom, tooth3Matrix, 1, geoms);

  const tooth4Matrix = createToothMatrix(90, 90, 180, 0.8, 0.70, 0);
  addGeometry(toothGeom, tooth4Matrix, 1, geoms);

  const tooth5Matrix = createToothMatrix(0, 0, 180, 0.7, 0, 0.8);
  addGeometry(toothGeom, tooth5Matrix, 1, geoms);

  const tooth6Matrix = createToothMatrix(0, 0, 180, 0.2, 0, 0.8);
  addGeometry(toothGeom, tooth6Matrix, 1, geoms);

  const mergedShell = mergeSimpleGeometries(geoms, true);
  const shell = new THREE.Mesh(mergedShell, [shellMaterial, teethMaterial]);
  group.add(shell);

  group.scale.set(signX, signY, signZ);

  return group;
}

// ------------------------------------------------------------
// Place all 8 corner blocks
// ------------------------------------------------------------
function placeCornerBlocks(scene) {
  const offsets = [
    [ 1,  1,  1],
    [ 1,  1, -1],
    [ 1, -1,  1],
    [ 1, -1, -1],
    [-1,  1,  1],
    [-1,  1, -1],
    [-1, -1,  1],
    [-1, -1, -1]
  ];

  const distance = 0.5; // Option C face distance

  offsets.forEach(([x, y, z]) => {
    const corner = createCornerBlock(x, y, z);
    corner.position.set(
      x * distance,
      y * distance,
      z * distance
    );
    scene.add(corner);
  });
}

// ------------------------------------------------------------
// Edge Block (rounded rectangular prism)
// ------------------------------------------------------------
function createEdgeBlock() {
  const group = new THREE.Group();

  const width = 0.45;   // X dimension
  const height = 0.25;  // Y dimension
  const depth = 0.90;   // Z dimension (long axis)
  const radius = 0.10;  // rounding

  const shape = new THREE.Shape();

  // Start top-left corner
  shape.moveTo(-width/2 + radius, height/2);

  // Top edge
  shape.lineTo(width/2 - radius, height/2);
  shape.quadraticCurveTo(width/2, height/2, width/2, height/2 - radius);

  // Right edge
  shape.lineTo(width/2, -height/2 + radius);
  shape.quadraticCurveTo(width/2, -height/2, width/2 - radius, -height/2);

  // Bottom edge
  shape.lineTo(-width/2 + radius, -height/2);
  shape.quadraticCurveTo(-width/2, -height/2, -width/2, -height/2 + radius);

  // Left edge
  shape.lineTo(-width/2, height/2 - radius);
  shape.quadraticCurveTo(-width/2, height/2, -width/2 + radius, height/2);

  const extrude = new THREE.ExtrudeGeometry(shape, {
    depth: depth,
    bevelEnabled: false
  });

  const mat = new THREE.MeshPhongMaterial({
    color: 0x1a1a1a,
    shininess: 30
  });

  const prism = new THREE.Mesh(extrude, mat);

  // Center the prism
  prism.position.z = -depth / 2;

  group.add(prism);
  return group;
}

// ------------------------------------------------------------
// Place all 12 edge blocks
// ------------------------------------------------------------
function placeEdgeBlocks(scene) {
  const distance = 1.75; // Option C face distance

  // Midpoints of cube edges
  const positions = [
    [ 1,  1,  0],
    [ 1, -1,  0],
    [-1,  1,  0],
    [-1, -1,  0],

    [ 1,  0,  1],
    [ 1,  0, -1],
    [-1,  0,  1],
    [-1,  0, -1],

    [ 0,  1,  1],
    [ 0,  1, -1],
    [ 0, -1,  1],
    [ 0, -1, -1]
  ];

  positions.forEach(([x, y, z]) => {
    const edge = createEdgeBlock();

    // Position at midpoint
    edge.position.set(
      x * distance,
      y * distance,
      z * distance
    );

    // Orient the block so its long axis points outward
    edge.lookAt(0, 0, 0);

    scene.add(edge);
  });
}

// ------------------------------------------------------------
// Animation Loop
// ------------------------------------------------------------

function animate() {
  requestAnimationFrame(animate);

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
