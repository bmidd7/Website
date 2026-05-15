const API_PATH = `${getApiOrigin()}/fly/simulate/`;
const elements = {
    duration: requireElement("duration-input"),
    fps: requireElement("fps-input"),
    quality: requireElement("quality-select"),
    world: requireElement("world-select"),
    behavior: requireElement("behavior-select"),
    seed: requireElement("seed-input"),
    arenaSize: requireElement("arena-size-input"),
    submit: requireElement("submit-params"),
    status: requireElement("simulation-status"),
    summary: requireElement("simulation-summary"),
    canvas: requireElement("canvasDiv"),
    video: requireElement("simulationVideo"),
    recordButton: requireElement("record-button"),
    downloadLink: requireElement("download-link"),
    taskStatus: requireElement("task-manager-status"),
    taskList: requireElement("task-manager-list"),
    progressBar: requireElement("task-progress-bar"),
    progressLabel: requireElement("task-progress-label"),
};
const canvas = elements.canvas;
const video = elements.video;
const ctx = canvas.getContext("2d");
let currentSimulation = null;
let animationFrameId = null;
let mediaRecorder = null;
let recordingChunks = [];
let isRecording = false;
const taskState = {
    prepare: "waiting",
    request: "waiting",
    render: "waiting",
    record: "waiting",
};
function getApiOrigin() {
    const { protocol, hostname, port } = window.location;
    if (hostname === "bmiddleton.dev" || hostname === "www.bmiddleton.dev" || hostname === "remote.bmiddleton.dev") {
        return `${protocol}//api.bmiddleton.dev`;
    }
    return port ? `${protocol}//${hostname}:${port}` : `${protocol}//${hostname}`;
}
function requireElement(id) {
    const element = document.getElementById(id);
    if (!element) {
        throw new Error(`Missing #${id}.`);
    }
    return element;
}
function normalizeQuality(value) {
    return value === "high" || value === "final" ? value : "preview";
}
function normalizeWorld(value) {
    return value === "open" ? "open" : "arena";
}
function normalizeBehavior(value) {
    if (value === "seek" || value === "patrol" || value === "avoid") {
        return value;
    }
    return "wander";
}
function setStatus(message, isError = false) {
    elements.status.textContent = message;
    elements.status.style.color = isError ? "#c0392b" : "#111";
}
function setTaskStatus(message) {
    elements.taskStatus.textContent = message;
}
function clampPercent(percent) {
    return Math.min(Math.max(percent, 0), 100);
}
function setProgress(percent, message = "") {
    const safePercent = clampPercent(percent);
    elements.progressBar.style.width = `${safePercent}%`;
    elements.progressLabel.textContent = `${Math.round(safePercent)}% complete${message ? ` - ${message}` : ""}`;
}
function setTask(name, state) {
    taskState[name] = state;
    const item = elements.taskList.querySelector(`li[data-task="${name}"]`);
    if (item) {
        item.classList.remove("waiting", "running", "completed", "error", "skipped");
        item.classList.add(state);
    }
}
function resetTaskManager() {
    setTaskStatus("Waiting for simulation tasks...");
    setProgress(0, "Waiting");
    Object.keys(taskState).forEach((name) => setTask(name, "waiting"));
}
function markTask(name, state, detail = "") {
    setTask(name, state);
    if (detail) {
        setTaskStatus(detail);
    }
}
function setSummary(text) {
    elements.summary.textContent = text;
}
function buildPayload() {
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
async function fetchSimulation(payload) {
    const response = await fetch(API_PATH, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
    });
    if (!response.ok) {
        const json = (await response.json().catch(() => null));
        const message = json?.error || `HTTP ${response.status}`;
        throw new Error(message);
    }
    return (await response.json());
}
function formatSummary(result) {
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
function clearCanvas() {
    if (!ctx)
        return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#060812";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
}
function drawArena(world) {
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
function drawFrame(frame, arenaSize) {
    if (!ctx)
        return;
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
function updateCanvasResolution() {
    const displayWidth = canvas.clientWidth || 960;
    const displayHeight = Math.round((displayWidth * 9) / 16);
    const ratio = window.devicePixelRatio || 1;
    canvas.width = Math.round(displayWidth * ratio);
    canvas.height = Math.round(displayHeight * ratio);
    canvas.style.height = `${displayHeight}px`;
}
function playSimulation(simulation, { record = false } = {}) {
    return new Promise((resolve) => {
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
        const stopOnComplete = () => {
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
        const step = (timestamp) => {
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
async function startSimulation(record = false) {
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
            mediaRecorder.ondataavailable = (event) => {
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
        }
        else {
            markTask("record", "skipped", "Recording disabled.");
        }
        await playSimulation(result, { record });
    }
    catch (error) {
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
export {};
//# sourceMappingURL=main.js.map