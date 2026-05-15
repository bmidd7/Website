export {};

type QualityName = "preview" | "high" | "final";
type WorldName = "arena" | "open";
type BehaviorName = "wander" | "seek" | "patrol" | "avoid";
type TaskName = "prepare" | "request" | "render" | "record";
type TaskState = "waiting" | "running" | "completed" | "error" | "skipped";

interface SimulationPayload {
  duration_s: number;
  fps: number;
  quality: QualityName;
  world: WorldName;
  behavior: BehaviorName;
  seed: number;
  arena_size: number;
}

interface SimulationFrame {
  frame: number;
  t: number;
  x: number;
  y: number;
  heading_rad: number;
  speed: number;
}

interface SimulationResult {
  config: SimulationPayload & { data_path?: string; max_saved_frames?: number };
  connectome: {
    status: string;
    message?: string;
  };
  summary: {
    saved_frames: number;
    duration_s: number;
    fps: number;
    world: WorldName;
    behavior: BehaviorName;
  };
  frames: SimulationFrame[];
}

interface PlayOptions {
  record?: boolean;
}

const API_PATH = `${getApiOrigin()}/fly/simulate/`;

const elements = {
  duration: requireElement<HTMLInputElement>("duration-input"),
  fps: requireElement<HTMLInputElement>("fps-input"),
  quality: requireElement<HTMLSelectElement>("quality-select"),
  world: requireElement<HTMLSelectElement>("world-select"),
  behavior: requireElement<HTMLSelectElement>("behavior-select"),
  seed: requireElement<HTMLInputElement>("seed-input"),
  arenaSize: requireElement<HTMLInputElement>("arena-size-input"),
  submit: requireElement<HTMLButtonElement>("submit-params"),
  status: requireElement<HTMLParagraphElement>("simulation-status"),
  summary: requireElement<HTMLPreElement>("simulation-summary"),
  canvas: requireElement<HTMLCanvasElement>("canvasDiv"),
  video: requireElement<HTMLVideoElement>("simulationVideo"),
  recordButton: requireElement<HTMLButtonElement>("record-button"),
  downloadLink: requireElement<HTMLAnchorElement>("download-link"),
  taskStatus: requireElement<HTMLParagraphElement>("task-manager-status"),
  taskList: requireElement<HTMLOListElement>("task-manager-list"),
  progressBar: requireElement<HTMLDivElement>("task-progress-bar"),
  progressLabel: requireElement<HTMLDivElement>("task-progress-label"),
};

const canvas = elements.canvas;
const video = elements.video;
const ctx = canvas.getContext("2d");

let currentSimulation: SimulationResult | null = null;
let animationFrameId: number | null = null;
let mediaRecorder: MediaRecorder | null = null;
let recordingChunks: Blob[] = [];
let isRecording = false;

const taskState: Record<TaskName, TaskState> = {
  prepare: "waiting",
  request: "waiting",
  render: "waiting",
  record: "waiting",
};

function getApiOrigin(): string {
  const { protocol, hostname, port } = window.location;
  if (hostname === "bmiddleton.dev" || hostname === "www.bmiddleton.dev" || hostname === "remote.bmiddleton.dev") {
    return `${protocol}//api.bmiddleton.dev`;
  }

  return port ? `${protocol}//${hostname}:${port}` : `${protocol}//${hostname}`;
}

function requireElement<T extends HTMLElement>(id: string): T {
  const element = document.getElementById(id) as T | null;
  if (!element) {
    throw new Error(`Missing #${id}.`);
  }
  return element;
}

function normalizeQuality(value: string): QualityName {
  return value === "high" || value === "final" ? value : "preview";
}

function normalizeWorld(value: string): WorldName {
  return value === "open" ? "open" : "arena";
}

function normalizeBehavior(value: string): BehaviorName {
  if (value === "seek" || value === "patrol" || value === "avoid") {
    return value;
  }
  return "wander";
}

function setStatus(message: string, isError = false): void {
  elements.status.textContent = message;
  elements.status.style.color = isError ? "#c0392b" : "#111";
}

function setTaskStatus(message: string): void {
  elements.taskStatus.textContent = message;
}

function clampPercent(percent: number): number {
  return Math.min(Math.max(percent, 0), 100);
}

function setProgress(percent: number, message = ""): void {
  const safePercent = clampPercent(percent);
  elements.progressBar.style.width = `${safePercent}%`;
  elements.progressLabel.textContent = `${Math.round(safePercent)}% complete${message ? ` - ${message}` : ""}`;
}

function setTask(name: TaskName, state: TaskState): void {
  taskState[name] = state;
  const item = elements.taskList.querySelector<HTMLLIElement>(`li[data-task="${name}"]`);
  if (item) {
    item.classList.remove("waiting", "running", "completed", "error", "skipped");
    item.classList.add(state);
  }
}

function resetTaskManager(): void {
  setTaskStatus("Waiting for simulation tasks...");
  setProgress(0, "Waiting");
  (Object.keys(taskState) as TaskName[]).forEach((name) => setTask(name, "waiting"));
}

function markTask(name: TaskName, state: TaskState, detail = ""): void {
  setTask(name, state);
  if (detail) {
    setTaskStatus(detail);
  }
}

function setSummary(text: string): void {
  elements.summary.textContent = text;
}

function buildPayload(): SimulationPayload {
  return {
    duration_s: Number.parseFloat(elements.duration.value) || 5,
    fps: Number.parseInt(elements.fps.value, 10) || 30,
    quality: normalizeQuality(String(elements.quality.value || "preview").toLowerCase()),
    world: normalizeWorld(String(elements.world.value || "arena").toLowerCase()),
    behavior: normalizeBehavior(String(elements.behavior.value || "wander").toLowerCase()),
    seed: Number.parseInt(elements.seed.value, 10) || 1,
    arena_size: Number.parseFloat(elements.arenaSize.value) || 10,
  };
}

async function fetchSimulation(payload: SimulationPayload): Promise<SimulationResult> {
  const response = await fetch(API_PATH, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const json = (await response.json().catch((): null => null)) as { error?: string } | null;
    const message = json?.error || `HTTP ${response.status}`;
    throw new Error(message);
  }

  return (await response.json()) as SimulationResult;
}

function formatSummary(result: SimulationResult): string {
  return [
    `Duration: ${result.config.duration_s}s`,
    `FPS: ${result.config.fps}`,
    `Quality: ${result.config.quality}`,
    `World: ${result.config.world}`,
    `Behavior: ${result.config.behavior}`,
    `Seed: ${result.config.seed}`,
    `Saved frames: ${result.summary.saved_frames}`,
    `Connectome: ${result.connectome.status}`,
  ].join("\n");
}

function clearCanvas(): void {
  if (!ctx) return;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#060812";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}

function drawArena(world: WorldName): void {
  if (!ctx || world !== "arena") {
    return;
  }

  const padding = 32;
  const size = Math.min(canvas.width, canvas.height) - padding * 2;
  const offsetX = (canvas.width - size) / 2;
  const offsetY = (canvas.height - size) / 2;

  ctx.strokeStyle = "rgba(255,255,255,0.25)";
  ctx.lineWidth = 2;
  ctx.strokeRect(offsetX, offsetY, size, size);
}

function drawFrame(frame: SimulationFrame, arenaSize: number): void {
  if (!ctx) return;

  clearCanvas();
  drawArena(currentSimulation?.config.world || "arena");

  const scale = (canvas.width * 0.8) / arenaSize;
  const centerX = canvas.width / 2;
  const centerY = canvas.height / 2;

  const x = centerX + frame.x * scale;
  const y = centerY - frame.y * scale;

  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(frame.heading_rad);

  ctx.fillStyle = "#f4d96f";
  ctx.strokeStyle = "#ffffff";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(16, 0);
  ctx.lineTo(-12, 9);
  ctx.lineTo(-12, -9);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  ctx.restore();

  ctx.fillStyle = "#ffffff";
  ctx.font = "14px Arial";
  ctx.fillText(`t = ${frame.t.toFixed(2)}s`, 18, 24);
}

function updateCanvasResolution(): void {
  const displayWidth = canvas.clientWidth || 960;
  const displayHeight = Math.round((displayWidth * 9) / 16);
  const ratio = window.devicePixelRatio || 1;
  canvas.width = Math.round(displayWidth * ratio);
  canvas.height = Math.round(displayHeight * ratio);
  canvas.style.height = `${displayHeight}px`;
}

function playSimulation(simulation: SimulationResult, { record = false }: PlayOptions = {}): Promise<void> {
  return new Promise<void>((resolve) => {
    const frames = simulation.frames;
    if (!frames.length) {
      setStatus("No frames returned from the simulation.", true);
      setTask("render", "error");
      resolve();
      return;
    }

    updateCanvasResolution();
    currentSimulation = simulation;
    setStatus("Playing simulation...");
    setSummary(formatSummary(simulation));
    video.hidden = true;
    elements.downloadLink.hidden = true;

    markTask("render", "running", `Rendering frame 1 of ${frames.length}...`);

    const start = performance.now();
    let frameIndex = 0;
    let hasCompleted = false;

    const stopOnComplete = (): void => {
      if (hasCompleted) {
        return;
      }
      hasCompleted = true;
      animationFrameId = null;
      markTask("render", "completed", "Rendering complete.");
      setStatus("Simulation complete.");
      if (record && mediaRecorder?.state === "recording") {
        mediaRecorder.stop();
      }
      resolve();
    };

    const step = (timestamp: DOMHighResTimeStamp): void => {
      const elapsed = (timestamp - start) / 1000;
      while (frameIndex + 1 < frames.length && frames[frameIndex + 1].t <= elapsed) {
        frameIndex += 1;
      }

      drawFrame(frames[frameIndex], simulation.config.arena_size);
      const renderProgress = frames.length > 1 ? frameIndex / (frames.length - 1) : 1;
      const base = record ? 45 : 40;
      const max = record ? 90 : 100;
      const percent = base + renderProgress * (max - base);
      setProgress(percent, `Rendering frame ${frameIndex + 1}/${frames.length}`);

      if (frameIndex >= frames.length - 1) {
        stopOnComplete();
        return;
      }

      animationFrameId = window.requestAnimationFrame(step);
    };

    animationFrameId = window.requestAnimationFrame(step);
  });
}

async function startSimulation(record = false): Promise<void> {
  if (animationFrameId !== null) {
    window.cancelAnimationFrame(animationFrameId);
    animationFrameId = null;
  }

  resetTaskManager();
  markTask("prepare", "running", "Preparing simulation payload...");

  const payload = buildPayload();
  setStatus("Running simulation on the local server...");
  setSummary("");
  video.hidden = true;
  elements.downloadLink.hidden = true;

  try {
    markTask("request", "running", "Sending request to backend...");
    setProgress(20, "Request in progress");
    const result = await fetchSimulation(payload);
    currentSimulation = result;
    markTask("request", "completed", "Simulation data received.");
    markTask("prepare", "completed");
    setProgress(40, "Data loaded");

    if (record && !("MediaRecorder" in window)) {
      markTask("record", "error", "Recording not supported in this browser.");
      setStatus("Recording is not supported in this browser.", true);
      return;
    }

    if (record) {
      updateCanvasResolution();
      const stream = canvas.captureStream(payload.fps);
      recordingChunks = [];
      mediaRecorder = new MediaRecorder(stream, { mimeType: "video/webm; codecs=vp8" });
      mediaRecorder.ondataavailable = (event: BlobEvent) => {
        if (event.data && event.data.size > 0) {
          recordingChunks.push(event.data);
        }
      };
      mediaRecorder.onstop = () => {
        const blob = new Blob(recordingChunks, { type: "video/webm" });
        const url = URL.createObjectURL(blob);
        video.src = url;
        video.hidden = false;
        elements.downloadLink.href = url;
        elements.downloadLink.hidden = false;
        markTask("record", "completed", "Recorded video available.");
        setProgress(100, "Recording complete");
        setStatus("Recording complete. Preview below or download the video.");
      };
      mediaRecorder.start();
      markTask("record", "running", "Recording the animation...");
      setProgress(45, "Recording will complete after render");
    } else {
      markTask("record", "skipped", "Recording disabled.");
    }

    await playSimulation(result, { record });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Simulation failed.";
    markTask("request", "error", `Error: ${message}`);
    setStatus(message, true);
  }
}

elements.submit.addEventListener("click", () => {
  void startSimulation(false);
});

elements.recordButton.addEventListener("click", () => {
  if (!("MediaRecorder" in window)) {
    setStatus("Recording is not available in this browser.", true);
    return;
  }

  if (isRecording) {
    setStatus("Recording is already in progress. Please wait.");
    return;
  }

  isRecording = true;
  elements.recordButton.textContent = "Recording...";
  startSimulation(true).finally(() => {
    isRecording = false;
    elements.recordButton.textContent = "Record simulation";
  });
});

window.addEventListener("resize", updateCanvasResolution);
updateCanvasResolution();
clearCanvas();
resetTaskManager();
setStatus("Ready to run the Fly simulation. Preview runs typically finish in a few seconds.");
