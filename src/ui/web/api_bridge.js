// ============================================================
// API Bridge: Browser <-> Python Solver
// ============================================================

const API_BASE = "http://localhost:5000/api";

export async function requestScramble() {
  const res = await fetch(`${API_BASE}/scramble`);
  return await res.json();
}

export async function requestSolve(cubeState) {
  const res = await fetch(`${API_BASE}/solve`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(cubeState)
  });
  return await res.json();
}
