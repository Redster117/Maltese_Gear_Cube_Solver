# Maltese_Gear_Cube_Solver
maltese-gear-solver/
│
├── src/
│   ├── cube_state.py        # Step A: internal model
│   ├── moves.py             # Step B: move engine
│   ├── solver.py            # Step D: IDA* solver
│   ├── color_mapper.py      # Step C: map colours → cube state
│   ├── ui/                  # Step E: optional visual interface
│   │   ├── web/             # (Three.js or HTML/JS)
│   │   └── unity/           # (if you choose Unity)
│   └── utils.py
│
├── tests/
│   ├── test_moves.py
│   ├── test_solver.py
│   └── test_color_mapper.py
│
├── README.md
└── requirements.txt
