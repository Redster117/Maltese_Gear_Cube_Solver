# ============================================================
#  Maltese Gear Cube — Scrambler
#  Author: Jarred (with Copilot assistance)
# ============================================================

import random
from cube_state import CubeState
from moves import apply_move

MOVES = ["R2", "L2", "U2", "D2", "F2", "B2"]

# Opposite faces (optional scramble cleanup)
OPPOSITE = {
    "R2": "L2",
    "L2": "R2",
    "U2": "D2",
    "D2": "U2",
    "F2": "B2",
    "B2": "F2"
}

def generate_scramble(length=20):
    """
    Generate a legal random scramble for the Maltese Gear Cube.
    Returns (scramble_list, scrambled_state).
    """

    scramble = []
    last_move = None

    for _ in range(length):
        move = random.choice(MOVES)

        # Avoid repeating the same move
        while move == last_move:
            move = random.choice(MOVES)

        # Avoid immediate opposite face (optional)
        if last_move and OPPOSITE[last_move] == move:
            move = random.choice(MOVES)

        scramble.append(move)
        last_move = move

    # Apply scramble to a fresh cube
    state = CubeState()
    for move in scramble:
        apply_move(state, move)

    return scramble, state


def scramble_string(scramble):
    """Convert a scramble list into a readable string."""
    return " ".join(scramble)
