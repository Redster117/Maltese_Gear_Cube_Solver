// ============================================================
// Maltese Gear Cube Viewer — Three.js (ES Module Version)
// ============================================================

import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";

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
camera.position.set(4, 4, 4);
camera.lookAt(0, 0, 0);

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);

const orbitTarget = new THREE.Vector3(0, 0, 0);
const spherical = new THREE.Spherical();
spherical.setFromVector3(camera.position.clone().sub(orbitTarget));

const minDistance = 2.0;
const maxDistance = 24.0;
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
  const cameraUp = new THREE.Vector3().crossVectors(cameraRight, cameraDirection).normalize();
  return { cameraRight, cameraUp };
}

canvas.addEventListener("pointerdown", (event) => {
  const isPan = event.button === 1 || event.button === 2 || (event.button === 0 && event.ctrlKey);
  const isRotate = event.button === 0 && !event.ctrlKey;
  if (!isPan && !isRotate) return;

  event.preventDefault();
  isPointerDown = true;
  pointerMode = isPan ? "pan" : "rotate";
  pointerStart.set(event.clientX, event.clientY);
  startTheta = spherical.theta;
  startPhi = spherical.phi;
  startTarget.copy(orbitTarget);
  if (event.pointerId != null) canvas.setPointerCapture(event.pointerId);
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

  event.preventDefault();
  const { cameraRight, cameraUp } = getPanVectors();
  const panScale = panSpeed * spherical.radius * 0.0015;
  const panOffset = new THREE.Vector3()
    .addScaledVector(cameraRight, -deltaX * panScale)
    .addScaledVector(cameraUp, deltaY * panScale);

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
dir.position.set(4, 8, 6);
scene.add(dir);

// ------------------------------------------------------------
// Only corner pieces are rendered in this viewer.
// ------------------------------------------------------------

// ------------------------------------------------------------
// Gear Geometry Helpers
// ------------------------------------------------------------

// ------------------------------------------------------------
// Render only corner pieces
// ------------------------------------------------------------
placeCornerBlocks(scene);

// ------------------------------------------------------------
// Single triangular tooth helper
// ------------------------------------------------------------
function createTriangularToothGeometry(baseWidth, height, depth) {
  const cornerRadius = Math.min(baseWidth, height) * 0.21;
  const halfWidth = baseWidth / 2.5;
  const apexY = height;
  const shape = new THREE.Shape();

  shape.moveTo(-halfWidth, 0);
  shape.lineTo(halfWidth, 0);
  shape.lineTo(halfWidth - cornerRadius, apexY - cornerRadius);
  shape.quadraticCurveTo(0, apexY, -halfWidth + cornerRadius, apexY - cornerRadius);
  shape.closePath();

  const geom = new THREE.ExtrudeGeometry(shape, {
    depth,
    bevelEnabled: false
  });

  // Center the tooth so the base sits on the XY plane
  geom.translate(0, 0, -depth / 2);
  return geom;
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
// Outer Maltese-style corner wedge (solid core)
// ------------------------------------------------------------
function createCornerOuterGeometry(size = 1) {
  const geom = new THREE.BufferGeometry();

  // Simple tetra-like wedge: (0,0,0) to three axes
  const vertices = new Float32Array([
    0,    0,    0,    // 0: inner corner
    size, 0,    0,    // 1: along X
    0,    size, 0,    // 2: along Y
    0,    0,    size  // 3: along Z
  ]);

  // 4 triangular faces
  const indices = [
    0, 1, 2,  // XY face
    0, 1, 3,  // XZ face
    0, 2, 3,  // YZ face
    1, 2, 3   // outer diagonal face
  ];

  geom.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  geom.setIndex(indices);
  geom.computeVertexNormals();

  return geom;
}

// ------------------------------------------------------------
// Corner Block (hollow inward-facing corner shell)
// ------------------------------------------------------------
function createCornerBlock(signX, signY, signZ) {
  const group = new THREE.Group();

  const outer = 0.9; // outer side length
  const depth = 0.50; // wall height
  const wallThickness = 0.10;

  const shellMaterial = new THREE.MeshPhongMaterial({
    color: 0xffffff,
    shininess: 30,
    side: THREE.DoubleSide
  });

  const wallZGeom = new THREE.BoxGeometry(outer, outer, wallThickness);
  const wallXGeom = new THREE.BoxGeometry(wallThickness, outer, outer);
  const wallYGeom = new THREE.BoxGeometry(outer, wallThickness, outer);

  const addGeometry = (geometry, matrix, targetArray) => {
    const geom = geometry.clone();
    geom.applyMatrix4(matrix);
    targetArray.push(geom);
  };

  const shellGeoms = [];
  addGeometry(wallZGeom, new THREE.Matrix4().makeTranslation(outer / 2, outer / 2, wallThickness / 2), shellGeoms);
  addGeometry(wallXGeom, new THREE.Matrix4().makeTranslation(wallThickness / 2, outer / 2, outer / 2), shellGeoms);
  addGeometry(wallYGeom, new THREE.Matrix4().makeTranslation(outer / 2, wallThickness / 2, outer / 2), shellGeoms);

  const mergedShell = mergeSimpleGeometries(shellGeoms, true);
  const shell = new THREE.Mesh(mergedShell, shellMaterial);
  group.add(shell);

  const toothDepth = 0.1;
  const baseToothWidth = 0.35;
  const skinnyToothWidth = 0.20;
  const toothHeight = 0.40;

  const toothSpecs = [
    { matrix: createToothMatrix(0, 0, 90, 0, 0.70, 0.85), color: 0xff0000 },
    { matrix: createToothMatrix(0, 0, 90, 0, 0.40, 0.85), color: 0xff7f00, width: skinnyToothWidth },
    { matrix: createToothMatrix(90, 90, 180, 0.85, 0, 0), color: 0xff7ff00, width: skinnyToothWidth },
    { matrix: createToothMatrix(90, 90, 180, 0.8, 0.70, 0), color: 0xff0000 },
    { matrix: createToothMatrix(0, 0, 180, 0.7, 0, 0.8), color: 0xff0000 },
    { matrix: createToothMatrix(0, 0, 180, 0.35, 0, 0.8), color: 0xff7f00, width: skinnyToothWidth },
    { matrix: createToothMatrix(0, 90, 180, 0.8, 0, 0.7), color: 0xff0000 },
    { matrix: createToothMatrix(0, 90, 180, 0.85, 0, 0), color: 0xff7f00, width: skinnyToothWidth }
  ];

  toothSpecs.forEach((spec) => {
    const toothGeometry = createTriangularToothGeometry(spec.width || baseToothWidth, toothHeight, toothDepth);
    const toothMaterial = new THREE.MeshPhongMaterial({
      color: spec.color,
      shininess: 40
    });
    const tooth = new THREE.Mesh(toothGeometry, toothMaterial);
    tooth.applyMatrix4(spec.matrix);
    group.add(tooth);
  });

  group.scale.set(signX, signY, signZ);

  return group;
}

// ------------------------------------------------------------
// Place all 8 corner blocks
// ------------------------------------------------------------
function placeCornerBlocks(scene) {
  const offsets = [
    [ 1,  1, -1]
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