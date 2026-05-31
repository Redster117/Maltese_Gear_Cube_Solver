from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

from src.solver import solve
from src.moves import random_scramble

app = FastAPI()

# Allow browser access
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/api/scramble")
def api_scramble():
    scramble = random_scramble(20)
    return {"scramble": scramble}

@app.post("/api/solve")
def api_solve(state: dict):
    # state = { "faces": { "U": [...], "R": [...], ... } }
    solution = solve(state)
    return {"solution": solution}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=5000)
