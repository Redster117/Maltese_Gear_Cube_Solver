# ============================================================
#  Maltese Gear Cube — Cube State Representation
#  Author: Jarred (with Copilot assistance)
# ============================================================

class CubeState:
    """
    Internal representation of the Maltese Gear Cube.

    Pieces:
      - 8 corners (3-way orientation, but 180° moves don't twist them)
      - 12 edges (geared, 2-way orientation: 0° or 180°)
      - 6 centers (move + flip: 0° or 180°)

    Moves:
      - R2, L2, U2, D2, F2, B2 (180° only)
    """

    def __init__(self):
        # Corner indices:
        # 0 = URF, 1 = UFL, 2 = ULB, 3 = UBR,
        # 4 = DRF, 5 = DFL, 6 = DLB, 7 = DBR
        self.corner_pos = list(range(8))   # permutation of 0..7
        self.corner_ori = [0] * 8          # 0,1,2 (we keep it general)

        # Edge indices:
        # 0 = UF, 1 = UR, 2 = UB, 3 = UL,
        # 4 = FR, 5 = FL, 6 = BR, 7 = BL,
        # 8 = DF, 9 = DR, 10 = DB, 11 = DL
        self.edge_pos = list(range(12))    # permutation of 0..11
        self.edge_ori = [0] * 12           # 0 or 1 (0° or 180°)

        # Center indices:
        # 0 = U, 1 = D, 2 = F, 3 = B, 4 = R, 5 = L
        self.center_pos = list(range(6))   # permutation of 0..5
        self.center_ori = [0] * 6          # 0 or 1 (0° or 180°)

    def clone(self):
        """Return a deep copy of this state."""
        new = CubeState()
        new.corner_pos = self.corner_pos[:]
        new.corner_ori = self.corner_ori[:]
        new.edge_pos = self.edge_pos[:]
        new.edge_ori = self.edge_ori[:]
        new.center_pos = self.center_pos[:]
        new.center_ori = self.center_ori[:]
        return new

    def is_solved(self):
        """Check if the cube is in the solved state."""
        return (
            self.corner_pos == list(range(8)) and
            all(o == 0 for o in self.corner_ori) and
            self.edge_pos == list(range(12)) and
            all(o == 0 for o in self.edge_ori) and
            self.center_pos == list(range(6)) and
            all(o == 0 for o in self.center_ori)
        )

    def __repr__(self):
        return (
            f"CubeState(\n"
            f"  corners pos={self.corner_pos}, ori={self.corner_ori}\n"
            f"  edges   pos={self.edge_pos}, ori={self.edge_ori}\n"
            f"  centers pos={self.center_pos}, ori={self.center_ori}\n"
            f")"
        )
