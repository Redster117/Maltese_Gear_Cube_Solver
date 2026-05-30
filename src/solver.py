# ============================================================
#  Maltese Gear Cube — IDA* Solver
#  Author: Jarred (with Copilot assistance)
# ============================================================

from cube_state import CubeState
from moves import apply_move

MOVES = ["R2", "L2", "U2", "D2", "F2", "B2"]

# ------------------------------------------------------------
# Heuristic: number of misplaced pieces
# ------------------------------------------------------------

def heuristic(state):
    h = 0

    # corners
    for i in range(8):
        if state.corner_pos[i] != i or state.corner_ori[i] != 0:
            h += 1

    # edges
    for i in range(12):
        if state.edge_pos[i] != i or state.edge_ori[i] != 0:
            h += 1

    # centers
    for i in range(6):
        if state.center_pos[i] != i or state.center_ori[i] != 0:
            h += 1

    return h


# ------------------------------------------------------------
# Depth-limited DFS
# ------------------------------------------------------------

def dfs(state, depth, limit, last_move, path):
    h = heuristic(state)
    if h == 0:
        return True  # solved

    if depth + h > limit:
        return False  # prune

    for move in MOVES:
        if move == last_move:
            continue  # avoid immediate repeats

        new_state = state.clone()
        apply_move(new_state, move)

        path.append(move)
        if dfs(new_state, depth + 1, limit, move, path):
            return True
        path.pop()

    return False


# ------------------------------------------------------------
# IDA* Search
# ------------------------------------------------------------

def solve(start_state):
    """Return a list of moves that solves the cube."""
    if start_state.is_solved():
        return []

    limit = heuristic(start_state)

    while True:
        path = []
        if dfs(start_state.clone(), 0, limit, None, path):
            return path
        limit += 1
