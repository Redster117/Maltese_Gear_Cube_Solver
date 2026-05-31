// ============================================================
// Move animation engine for the Gear Cube viewer
// ============================================================

export async function playMoveSequence(sequence, faceGroups) {
  for (const move of sequence) {
    await animateMove(move, faceGroups);
  }
}

// ------------------------------------------------------------
// Animate a single 180° face turn
// ------------------------------------------------------------

function animateMove(move, faceGroups) {
  return new Promise(resolve => {
    const face = move[0];
    const group = faceGroups[face];

    if (!group) {
      console.warn("Unknown face:", face);
      resolve();
      return;
    }

    const duration = 300; // ms
    const start = performance.now();
    const startRot = group.rotation.clone();

    function frame(now) {
      const t = Math.min((now - start) / duration, 1);
      const eased = easeInOutQuad(t);

      // 180° turn
      const target = Math.PI;

      group.rotation.z = startRot.z + target * eased;

      if (t < 1) {
        requestAnimationFrame(frame);
      } else {
        group.rotation.z = startRot.z + target;
        resolve();
      }
    }

    requestAnimationFrame(frame);
  });
}

// ------------------------------------------------------------
// Easing function
// ------------------------------------------------------------

function easeInOutQuad(t) {
  return t < 0.5
    ? 2 * t * t
    : 1 - Math.pow(-2 * t + 2, 2) / 2;
}
