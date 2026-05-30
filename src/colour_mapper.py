# ============================================================
#  Maltese Gear Cube — Color → State Mapper
#  Author: Jarred (with Copilot assistance)
# ============================================================

from cube_state import CubeState

# ------------------------------------------------------------
# Expected color combinations for each piece in the SOLVED state
# ------------------------------------------------------------

CORNER_COLORS = {
    0: ("U", "R", "F"),  # URF
    1: ("U", "F", "L"),  # UFL
    2: ("U", "L", "B"),  # ULB
    3: ("U", "B", "R"),  # UBR
    4: ("D", "F", "R"),  # DRF
    5: ("D", "L", "F"),  # DFL
    6: ("D", "B", "L"),  # DLB
    7: ("D", "R", "B")   # DBR
}

EDGE_COLORS = {
    0: ("U", "F"),  # UF
    1: ("U", "R"),  # UR
    2: ("U", "B"),  # UB
    3: ("U", "L"),  # UL
    4: ("F", "R"),  # FR
    5: ("F", "L"),  # FL
    6: ("B", "R"),  # BR
    7: ("B", "L"),  # BL
    8: ("D", "F"),  # DF
    9: ("D", "R"),  # DR
    10: ("D", "B"), # DB
    11: ("D", "L")  # DL
}

CENTER_COLORS = {
    0: "U",
    1: "D",
    2: "F",
    3: "B",
    4: "R",
    5: "L"
}

# ------------------------------------------------------------
# Helper: match a piece by its color set
# ------------------------------------------------------------

def match_piece(color_tuple, solved_dict):
    """Return the index of the piece whose color set matches."""
    color_set = set(color_tuple)
    for idx, expected in solved_dict.items():
        if set(expected) == color_set:
            return idx
    raise ValueError(f"Unknown piece colors: {color_tuple}")


# ------------------------------------------------------------
# Main function: convert sticker colors → CubeState
# ------------------------------------------------------------

def colors_to_state(corner_colors, edge_colors, center_colors):
    """
    Convert real cube colors into a CubeState.

    corner_colors: list of 8 tuples, each with 3 face letters
    edge_colors:   list of 12 tuples, each with 2 face letters
    center_colors: list of 6 face letters
    """

    state = CubeState()

    # --- Corners ---
    for pos, colors in enumerate(corner_colors):
        solved_idx = match_piece(colors, CORNER_COLORS)
        state.corner_pos[pos] = solved_idx

        # orientation = how many rotations needed to match solved order
        solved = CORNER_COLORS[solved_idx]
        for ori in range(3):
            if tuple(colors[i % 3] for i in range(ori, ori+3)) == solved:
                state.corner_ori[pos] = ori
                break

    # --- Edges ---
    for pos, colors in enumerate(edge_colors):
        solved_idx = match_piece(colors, EDGE_COLORS)
        state.edge_pos[pos] = solved_idx

        # orientation: 0 if order matches, 1 if flipped
        if colors == EDGE_COLORS[solved_idx]:
            state.edge_ori[pos] = 0
        else:
            state.edge_ori[pos] = 1

    # --- Centers ---
    for pos, color in enumerate(center_colors):
        for idx, expected in CENTER_COLORS.items():
            if color == expected:
                state.center_pos[pos] = idx
                break

        # orientation: 0 or 1 (binary flip)
        state.center_ori[pos] = 0  # assume correct; flips handled by moves

    return state
