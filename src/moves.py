# ============================================================
#  Maltese Gear Cube — Move Tables (180°-only)
#  Author: Jarred (with Copilot assistance)
# ============================================================

# ------------------------------------------------------------
# Corner, Edge, Center Permutations for Each Move
# ------------------------------------------------------------

corner_perm = {
    "R2": [3,1,2,0, 7,5,6,4],
    "L2": [0,2,1,3, 4,6,5,7],
    "U2": [3,0,1,2, 4,5,6,7],
    "D2": [0,1,2,3, 7,4,5,6],
    "F2": [4,5,2,3, 0,1,6,7],
    "B2": [0,1,3,2, 4,5,7,6]
}

edge_perm = {
    "R2": [0,9,2,3, 4,5,10,7, 8,1,6,11],
    "L2": [0,1,2,11, 4,7,6,5, 8,9,10,3],
    "U2": [2,1,0,3, 4,5,6,7, 8,9,10,11],
    "D2": [0,1,2,3, 4,5,6,7, 10,9,8,11],
    "F2": [0,1,2,3, 6,7,4,5, 8,9,10,11],
    "B2": [0,1,2,3, 4,5,6,7, 8,11,10,9]
}

center_perm = {
    "R2": [0,1,2,3, 5,4],
    "L2": [0,1,2,3, 4,5],
    "U2": [1,0,2,3, 4,5],
    "D2": [1,0,2,3, 4,5],
    "F2": [0,1,3,2, 4,5],
    "B2": [0,1,3,2, 4,5]
}

# ------------------------------------------------------------
# Orientation flips (edges + centers)
# ------------------------------------------------------------

edge_flip = {
    "R2": [1,9,4,6],
    "L2": [3,11,5,7],
    "U2": [0,1,2,3],
    "D2": [8,9,10,11],
    "F2": [4,5,6,7],
    "B2": [2,3,6,7]
}

center_flip = {
    "R2": [4],
    "L2": [5],
    "U2": [0],
    "D2": [1],
    "F2": [2],
    "B2": [3]
}

# ------------------------------------------------------------
# Apply a move to a CubeState
# ------------------------------------------------------------

def apply_move(state, move):
    """Apply a 180° move (R2, L2, U2, D2, F2, B2) to the cube state."""

    # --- Corners ---
    state.corner_pos = [state.corner_pos[i] for i in corner_perm[move]]
    # corner orientation unchanged (180° turns do not twist corners)

    # --- Edges ---
    state.edge_pos = [state.edge_pos[i] for i in edge_perm[move]]
    for e in edge_flip[move]:
        state.edge_ori[e] ^= 1  # flip 0 ↔ 1

    # --- Centers ---
    state.center_pos = [state.center_pos[i] for i in center_perm[move]]
    for c in center_flip[move]:
        state.center_ori[c] ^= 1  # flip 0 ↔ 1

    return state
