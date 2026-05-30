# ============================================================
#  Maltese Gear Cube — 2D UI Visualizer (Tkinter)
#  Author: Jarred (with Copilot assistance)
# ============================================================

import tkinter as tk
from cube_state import CubeState
from moves import apply_move
from scrambler import generate_scramble, scramble_string
from solver import solve

# ------------------------------------------------------------
# Color mapping for faces
# ------------------------------------------------------------

FACE_COLORS = {
    "U": "white",
    "D": "yellow",
    "F": "green",
    "B": "blue",
    "R": "red",
    "L": "orange"
}

# ------------------------------------------------------------
# Sticker layout for a 2D cube net
# ------------------------------------------------------------

# Each face is a 3×3 grid of stickers
# We draw them in a standard unfolded net layout

FACE_POSITIONS = {
    "U": (3, 0),
    "L": (0, 3),
    "F": (3, 3),
    "R": (6, 3),
    "B": (9, 3),
    "D": (3, 6)
}

STICKER_SIZE = 30


# ------------------------------------------------------------
# UI Class
# ------------------------------------------------------------

class CubeUI:
    def __init__(self):
        self.state = CubeState()

        self.root = tk.Tk()
        self.root.title("Maltese Gear Cube — Visualizer")

        self.canvas = tk.Canvas(self.root, width=600, height=400, bg="black")
        self.canvas.pack()

        # Buttons
        tk.Button(self.root, text="Scramble", command=self.scramble).pack(side=tk.LEFT)
        tk.Button(self.root, text="Solve", command=self.solve_cube).pack(side=tk.LEFT)
        tk.Button(self.root, text="Reset", command=self.reset).pack(side=tk.LEFT)

        self.draw_cube()

    # --------------------------------------------------------
    # Drawing
    # --------------------------------------------------------

    def draw_face(self, face, colors):
        fx, fy = FACE_POSITIONS[face]

        for i in range(3):
            for j in range(3):
                x = (fx + j) * STICKER_SIZE
                y = (fy + i) * STICKER_SIZE
                self.canvas.create_rectangle(
                    x, y, x + STICKER_SIZE, y + STICKER_SIZE,
                    fill=colors[i][j], outline="black"
                )

    def draw_cube(self):
        self.canvas.delete("all")

        # For now, draw each face as a solid color
        # (Later we can map actual stickers from state)
        for face, color in FACE_COLORS.items():
            colors = [[color] * 3 for _ in range(3)]
            self.draw_face(face, colors)

    # --------------------------------------------------------
    # Actions
    # --------------------------------------------------------

    def scramble(self):
        scramble, new_state = generate_scramble(20)
        self.state = new_state
        print("Scramble:", scramble_string(scramble))
        self.draw_cube()

    def solve_cube(self):
        solution = solve(self.state)
        print("Solution:", solution)

        for move in solution:
            apply_move(self.state, move)
            self.draw_cube()
            self.root.update()
            self.root.after(150)

    def reset(self):
        self.state = CubeState()
        self.draw_cube()

    # --------------------------------------------------------

    def run(self):
        self.root.mainloop()


# ------------------------------------------------------------
# Run UI
# ------------------------------------------------------------

if __name__ == "__main__":
    ui = CubeUI()
    ui.run()
