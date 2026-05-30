# Maltese_Gear_Cube_Solver
Maltese_Gear_Cube_Solver/
│
├── src/
│   ├── cube_state.py            # Step A: internal cube model
│   ├── moves.py                 # Step B: move engine (R2/L2/etc.)
│   ├── solver.py                # Step D: IDA* solver
│   ├── color_mapper.py          # Step C: map colours → cube state
│   ├── utils.py
│   │
│   ├── ui/                      # Step E: visual interfaces
│   │   │
│   │   ├── desktop/             # (optional) Tkinter / PyOpenGL
│   │   │   └── ui_2d.py
│   │   │
│   │   ├── web/                 # ⭐ NEW: Three.js WebGL viewer
│   │   │   ├── cube_3d.html     # Main webpage
│   │   │   ├── cube_3d.js       # Scene, cube, stickers, gear styling
│   │   │   ├── cube_moves.js    # R2/L2/U2/D2/F2/B2 animations
│   │   │   └── api_bridge.js    # (optional) Connects to Python solver
│   │   │
│   │   └── unity/               # (optional) Unity viewer (future)
│   │
│   └── __init__.py
│
├── tests/
│   ├── test_moves.py
│   ├── test_solver.py
│   └── test_color_mapper.py
│
├── README.md
└── requirements.txt
cd src/ui/web
python -m http.server 8000

