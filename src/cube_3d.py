# ============================================================
#  Maltese Gear Cube — 3D Renderer (Pygame + OpenGL)
#  Author: Jarred (with Copilot assistance)
# ============================================================

import pygame
from pygame.locals import *
from OpenGL.GL import *
from OpenGL.GLU import *

from cube_state import CubeState
from moves import apply_move

FACE_COLORS = {
    "U": (1,1,1),
    "D": (1,1,0),
    "F": (0,1,0),
    "B": (0,0,1),
    "R": (1,0,0),
    "L": (1,0.5,0)
}

# ------------------------------------------------------------
# Draw a single face (square)
# ------------------------------------------------------------

def draw_face(color):
    glColor3fv(color)
    glBegin(GL_QUADS)
    glVertex3f(-1, -1, 0)
    glVertex3f( 1, -1, 0)
    glVertex3f( 1,  1, 0)
    glVertex3f(-1,  1, 0)
    glEnd()

# ------------------------------------------------------------
# Draw the cube (6 faces)
# ------------------------------------------------------------

def draw_cube():
    # Front
    glPushMatrix()
    glTranslatef(0, 0, 1.01)
    draw_face(FACE_COLORS["F"])
    glPopMatrix()

    # Back
    glPushMatrix()
    glRotatef(180, 0, 1, 0)
    glTranslatef(0, 0, 1.01)
    draw_face(FACE_COLORS["B"])
    glPopMatrix()

    # Right
    glPushMatrix()
    glRotatef(90, 0, 1, 0)
    glTranslatef(0, 0, 1.01)
    draw_face(FACE_COLORS["R"])
    glPopMatrix()

    # Left
    glPushMatrix()
    glRotatef(-90, 0, 1, 0)
    glTranslatef(0, 0, 1.01)
    draw_face(FACE_COLORS["L"])
    glPopMatrix()

    # Up
    glPushMatrix()
    glRotatef(-90, 1, 0, 0)
    glTranslatef(0, 0, 1.01)
    draw_face(FACE_COLORS["U"])
    glPopMatrix()

    # Down
    glPushMatrix()
    glRotatef(90, 1, 0, 0)
    glTranslatef(0, 0, 1.01)
    draw_face(FACE_COLORS["D"])
    glPopMatrix()

# ------------------------------------------------------------
# Main loop
# ------------------------------------------------------------

def run_3d():
    pygame.init()
    display = (400, 200)
    pygame.display.set_mode(display, DOUBLEBUF | OPENGL)

    gluPerspective(45, (display[0]/display[1]), 0.1, 50)
    glTranslatef(0, 0, -7)

    state = CubeState()

    running = True
    angle_x = 0
    angle_y = 0

    while running:
        for event in pygame.event.get():
            if event.type == pygame.QUIT:
                running = False

        # Rotate cube slowly
        angle_x += 0.2
        angle_y += 0.3

        glClear(GL_COLOR_BUFFER_BIT | GL_DEPTH_BUFFER_BIT)
        glPushMatrix()
        glRotatef(angle_x, 1, 0, 0)
        glRotatef(angle_y, 0, 1, 0)

        draw_cube()

        glPopMatrix()
        pygame.display.flip()
        pygame.time.wait(10)

    pygame.quit()


if __name__ == "__main__":
    run_3d()

def animate_move(face, duration=300):
    """
    Smoothly animate a 180° turn of a face.
    face: "R2", "L2", etc.
    duration: milliseconds
    """

    frames = 30
    angle_step = 180 / frames

    for i in range(frames):
        glClear(GL_COLOR_BUFFER_BIT | GL_DEPTH_BUFFER_BIT)

        glPushMatrix()

        # Rotate whole cube for viewing
        glRotatef(20, 1, 0, 0)
        glRotatef(30, 0, 1, 0)

        # Animate the turning face
        glPushMatrix()

        if face == "R2":
            glTranslatef(1, 0, 0)
            glRotatef(angle_step * i, 1, 0, 0)
            glTranslatef(-1, 0, 0)

        # TODO: add other faces here

        draw_cube()

        glPopMatrix()
        glPopMatrix()

        pygame.display.flip()
        pygame.time.wait(duration // frames)
