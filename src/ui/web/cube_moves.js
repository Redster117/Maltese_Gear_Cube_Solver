// ============================================================
// Maltese Gear Cube — Move Animations
// R2, L2, U2, D2, F2, B2
// ============================================================

const MOVE_DEFS = {
  R2: { face: 'R', axis: new THREE.Vector3(1, 0, 0) },
  L2: { face: 'L', axis: new THREE.Vector3(-1, 0, 0) },
  U2: { face: 'U', axis: new THREE.Vector3(0, 1, 0) },
  D2: { face: 'D', axis: new THREE.Vector3(0, -1, 0) },
  F2: { face: 'F', axis: new THREE.Vector3(0, 0, 1) },
  B2: { face: 'B', axis: new THREE.Vector3(0, 0, -1) }
};

function animateMove(move, faceGroups, duration = 250) {
  return new Promise(resolve => {
    const def = MOVE_DEFS[move];
    if (!def) {
      resolve();
      return;
    }

    const group = faceGroups[def.face];
    const axis = def.axis.clone().normalize();

    const start = performance.now();
    const totalAngle = Math.PI; // 180°

    function step(now) {
      const t = Math.min(1, (now - start) / duration);
      const eased = t * t * (3 - 2 * t); // smoothstep
      const angle = eased * totalAngle;

      // Reset rotation then apply angle
      group.rotation.set(0, 0, 0);
      group.rotateOnAxis(axis, angle);

      if (t < 1) {
        requestAnimationFrame(step);
      } else {
        // Snap to exact 180° at end
        group.rotation.set(0, 0, 0);
        group.rotateOnAxis(axis, totalAngle);
        resolve();
      }
    }

    requestAnimationFrame(step);
  });
}

async function playMoveSequence(moves, faceGroups) {
  for (const m of moves) {
    await animateMove(m, faceGroups);
  }
}
