// ============================================================
// Maltese Gear Cube Flower Gear Viewer — Three.js ES Module
// ============================================================

import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";

const canvas = document.getElementById("cubeCanvas");
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x111111);

const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 100);
camera.position.set(2.8, 2.0, 2.8);
camera.lookAt(0, 0, 0);

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);

const orbitTarget = new THREE.Vector3(0, 0, 0);
const spherical = new THREE.Spherical();
spherical.setFromVector3(camera.position.clone().sub(orbitTarget));

const minDistance = 0.1;
const maxDistance = 24;
const rotateSpeed = 0.005;
const zoomSpeed = 1.0;
const panSpeed = 1.0;

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

scene.add(new THREE.AmbientLight(0xffffff, 0.65));
const dirLight = new THREE.DirectionalLight(0xffffff, 0.9);
dirLight.position.set(3, 4, 2);
scene.add(dirLight);

function createFlowerPetalShape(length, width) {
  const shape = new THREE.Shape();
  const halfLength = length * 0.5;
  const halfWidth = width * 0.5;

  shape.moveTo(0, -halfLength);
  shape.bezierCurveTo(halfWidth * 0.35, -halfLength * 0.75, halfWidth * 1.0, -halfLength * 0.25, halfWidth, 0);
  shape.quadraticCurveTo(halfWidth * 0.9, halfLength * 0.55, 0, halfLength);
  shape.quadraticCurveTo(-halfWidth * 0.9, halfLength * 0.55, -halfWidth, 0);
  shape.bezierCurveTo(-halfWidth * 1.0, -halfLength * 0.25, -halfWidth * 0.35, -halfLength * 0.75, 0, -halfLength);

  return shape;
}

function createFlowerGear() {
  const group = new THREE.Group();
  const centerRadius = 0.28;
  const petalLength = 0.70;
  const petalWidth = 0.30;
  const petalDepth = 0.12;
  const petalOffset = 0.35;

  const petalMat = new THREE.MeshPhongMaterial({ color: 0x0a5cff, shininess: 50 });
  const hubMat = new THREE.MeshPhongMaterial({ color: 0x0b3a7d, shininess: 40 });
  const rimMat = new THREE.MeshPhongMaterial({ color: 0x132a52, shininess: 30 });

  const petalShape = createFlowerPetalShape(petalLength, petalWidth);
  const petalGeom = new THREE.ExtrudeGeometry(petalShape, { depth: petalDepth, bevelEnabled: false });
  petalGeom.translate(0, 0, -petalDepth / 2);

  for (let i = 0; i < 4; i += 1) {
    const petal = new THREE.Mesh(petalGeom.clone(), petalMat);
    petal.position.set(petalOffset, 0, 0);
    petal.rotateZ((Math.PI / 2) * i);
    group.add(petal);
  }

  const hub = new THREE.Mesh(new THREE.CylinderGeometry(centerRadius, centerRadius, petalDepth, 48), hubMat);
  hub.rotation.x = -Math.PI / 2;
  group.add(hub);

  const rim = new THREE.Mesh(new THREE.TorusGeometry(centerRadius + 0.05, 0.04, 16, 64), rimMat);
  rim.rotation.x = Math.PI / 2;
  group.add(rim);

  return group;
}

const flowerGear = createFlowerGear();
scene.add(flowerGear);

function animate() {
  requestAnimationFrame(animate);
  flowerGear.rotation.y += 0.002;
  renderer.render(scene, camera);
}

animate();

window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
