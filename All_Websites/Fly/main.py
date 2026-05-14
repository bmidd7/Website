from __future__ import annotations

import json
import math
import random
from dataclasses import asdict, dataclass
from pathlib import Path
from typing import Any, Mapping


BASE_DIR = Path(__file__).resolve().parent
DEFAULT_CONNECTOME_PATH = BASE_DIR / "proofread_connections_783.feather"

QUALITY_PRESETS = {
    "preview": {"resolution": [640, 360], "sim_hz": 120, "aa_samples": 1},
    "high": {"resolution": [1280, 720], "sim_hz": 240, "aa_samples": 4},
    "final": {"resolution": [1920, 1080], "sim_hz": 480, "aa_samples": 8},
}

DEFAULT_DURATION_S = 5.0
DEFAULT_FPS = 30
DEFAULT_QUALITY = "preview"
DEFAULT_WORLD = "arena"
DEFAULT_BEHAVIOR = "wander"
DEFAULT_SEED = 1
DEFAULT_ARENA_SIZE = 10.0
DEFAULT_MAX_SAVED_FRAMES = 500


@dataclass(slots=True)
class SimulationConfig:
    duration_s: float = DEFAULT_DURATION_S
    fps: int = DEFAULT_FPS
    quality: str = DEFAULT_QUALITY
    world: str = DEFAULT_WORLD
    behavior: str = DEFAULT_BEHAVIOR
    seed: int = DEFAULT_SEED
    arena_size: float = DEFAULT_ARENA_SIZE
    data_path: str = str(DEFAULT_CONNECTOME_PATH)
    max_saved_frames: int = DEFAULT_MAX_SAVED_FRAMES

    @classmethod
    def from_input(cls, payload: Mapping[str, float|int|str] | None = None) -> "SimulationConfig":
        payload = payload or {}
        config = cls(
            duration_s=float(payload.get("duration_s", DEFAULT_DURATION_S)),
            fps=float(payload.get("fps", DEFAULT_FPS)),
            quality=str(payload.get("quality", DEFAULT_QUALITY)).lower(),
            world=str(payload.get("world", DEFAULT_WORLD)),
            behavior=str(payload.get("behavior", DEFAULT_BEHAVIOR)),
            seed=int(payload.get("seed", DEFAULT_SEED)),
            arena_size=float(payload.get("arena_size", DEFAULT_ARENA_SIZE)),
            data_path=str(payload.get("data_path", str(DEFAULT_CONNECTOME_PATH))),
            max_saved_frames=int(payload.get("max_saved_frames", DEFAULT_MAX_SAVED_FRAMES)),
        )
        config.validate()
        return config

    def validate(self) -> None:
        if self.duration_s <= 0:
            raise ValueError("duration_s must be greater than 0.")
        if self.fps <= 0:
            raise ValueError("fps must be greater than 0.")
        if self.quality not in QUALITY_PRESETS:
            allowed = ", ".join(sorted(QUALITY_PRESETS))
            raise ValueError(f"quality must be one of: {allowed}.")
        if self.max_saved_frames <= 0:
            raise ValueError("max_saved_frames must be greater than 0.")


def _quality_settings(quality: str) -> dict[str, Any]:
    return dict(QUALITY_PRESETS[quality])


def _load_connectome_summary(data_path: str) -> dict[str, Any]:
    path = Path(data_path)
    summary: dict[str, Any] = {
        "path": str(path),
        "exists": path.exists(),
    }
    if not path.exists():
        summary["status"] = "missing_file"
        return summary

    summary["size_bytes"] = path.stat().st_size

    try:
        import pyarrow.feather as feather  # type: ignore
        import pyarrow.lib as pa_lib  # type: ignore
    except ModuleNotFoundError:
        summary["status"] = "pyarrow_not_installed"
        summary["message"] = (
            "Install pyarrow to inspect or stream the FlyWire feather file directly."
        )
        return summary

    try:
        table = feather.read_table(path, memory_map=True)
    except pa_lib.ArrowInvalid as exc:
        summary["status"] = "arrow_file_not_readable_as_feather"
        summary["message"] = str(exc)
        summary["next_step"] = (
            "Verify the export format or convert it into a standard Feather, "
            "Parquet, or CSV file before using it in the simulation pipeline."
        )
        return summary

    summary["status"] = "loaded"
    summary["rows"] = table.num_rows
    summary["columns"] = table.column_names
    return summary


def _behavior_velocity(behavior: str, t: float, rng: random.Random) -> tuple[float, float]:
    if behavior == "seek":
        return 1.4, 0.15 * math.sin(t * 0.8)
    if behavior == "patrol":
        return 1.0 + 0.2 * math.sin(t * 1.4), 0.35 * math.sin(t * 0.5)
    if behavior == "avoid":
        return 1.1, 0.45 * math.sin(t * 1.8)
    return 0.95 + 0.25 * math.sin(t * 1.1), rng.uniform(-0.25, 0.25)


def _simulate_frames(config: SimulationConfig, quality: Mapping[str, Any]) -> list[dict[str, Any]]:
    rng = random.Random(config.seed)
    sim_hz = int(quality["sim_hz"])
    total_steps = max(1, int(config.duration_s * sim_hz))
    frame_interval = max(1, int(round(sim_hz / config.fps)))
    stride = max(1, math.ceil((total_steps / frame_interval) / config.max_saved_frames))

    x = 0.0
    y = 0.0
    heading = 0.0
    half_arena = config.arena_size / 2.0
    frames: list[dict[str, Any]] = []

    for step in range(total_steps):
        t = step / sim_hz
        speed, turn_rate = _behavior_velocity(config.behavior, t, rng)
        heading += turn_rate / sim_hz

        next_x = x + math.cos(heading) * speed / sim_hz
        next_y = y + math.sin(heading) * speed / sim_hz

        if config.world == "arena":
            if abs(next_x) > half_arena:
                heading = math.pi - heading
                next_x = max(min(next_x, half_arena), -half_arena)
            if abs(next_y) > half_arena:
                heading = -heading
                next_y = max(min(next_y, half_arena), -half_arena)

        x = next_x
        y = next_y

        should_save = step % frame_interval == 0 and (step // frame_interval) % stride == 0
        if should_save:
            frames.append(
                {
                    "frame": len(frames),
                    "t": round(t, 4),
                    "x": round(x, 4),
                    "y": round(y, 4),
                    "heading_rad": round(heading, 4),
                    "speed": round(speed, 4),
                }
            )

    return frames


def run_simulation(payload: Mapping[str, Any] | None = None) -> dict[str, Any]:
    config = SimulationConfig.from_input(payload)
    quality = _quality_settings(config.quality)
    connectome = _load_connectome_summary(config.data_path)
    frames = _simulate_frames(config, quality)

    return {
        "config": asdict(config),
        "quality_settings": quality,
        "connectome": connectome,
        "summary": {
            "saved_frames": len(frames),
            "duration_s": config.duration_s,
            "fps": config.fps,
            "world": config.world,
            "behavior": config.behavior,
        },
        "frames": frames,
    }


def run_simulation_json(payload: Mapping[str, Any] | None = None) -> str:
    return json.dumps(run_simulation(payload), indent=2)


def main() -> None:
    result = run_simulation()
    print(json.dumps(result, indent=2))


if __name__ == "__main__":
    main()
