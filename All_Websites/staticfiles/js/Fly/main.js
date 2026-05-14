const API_PATH = '/Fly/api/simulate/';

const elements = {
  duration: document.getElementById('duration-input'),
  fps: document.getElementById('fps-input'),
  quality: document.getElementById('quality-select'),
  world: document.getElementById('world-select'),
  behavior: document.getElementById('behavior-select'),
  seed: document.getElementById('seed-input'),
  arenaSize: document.getElementById('arena-size-input'),
  submit: document.getElementById('submit-params'),
  status: document.getElementById('simulation-status'),
  summary: document.getElementById('simulation-summary'),
  canvas: document.getElementById('canvasDiv'),
  video: document.getElementById('simulationVideo'),
  recordButton: document.getElementById('record-button'),
  downloadLink: document.getElementById('download-link'),
  taskStatus: document.getElementById('task-manager-status'),
  taskList: document.getElementById('task-manager-list'),
  progressBar: document.getElementById('task-progress-bar'),
  progressLabel: document.getElementById('task-progress-label'),
};

const canvas = /** @type {HTMLCanvasElement} */ (elements.canvas);
const video = /** @type {HTMLVideoElement} */ (elements.video);
const ctx = canvas.getContext('2d');

let currentSimulation = null;
let animationFrameId = null;
let mediaRecorder = null;
let recordingChunks = [];
let isRecording = false;

const taskState = {
  prepare: 'waiting',
  request: 'waiting',
  render: 'waiting',
  record: 'waiting',
};

function setStatus(message, isError = false) {
  elements.status.textContent = message;
  elements.status.style.color = isError ? '#c0392b' : '#111';
}

function setTaskStatus(message) {
  if (elements.taskStatus) {
    elements.taskStatus.textContent = message;
  }
}

function setProgress(percent, message = '') {
  if (elements.progressBar) {
    elements.progressBar.style.width = `${Math.min(Math.max(percent, 0), 100)}%`;
  }
  if (elements.progressLabel) {
    elements.progressLabel.textContent = `${Math.round(Math.min(Math.max(percent, 0), 100))}% complete${message ? ` — ${message}` : ''}`;
  }
}

function setTask(name, state) {
  taskState[name] = state;
  const item = elements.taskList?.querySelector(`li[data-task="${name}"]`);
  if (item) {
    item.classList.remove('waiting', 'running', 'completed', 'error', 'skipped');
    item.classList.add(state);
  }
}

function resetTaskManager() {
  setTaskStatus('Waiting for simulation tasks...');
  setProgress(0, 'Waiting');
  Object.keys(taskState).forEach((name) => setTask(name, 'waiting'));
}

function markTask(name, state, detail = '') {
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
    duration_s: parseFloat(elements.duration.value) || 5,
    fps: parseInt(elements.fps.value, 10) || 30,
    quality: String(elements.quality.value || 'preview').toLowerCase(),
    world: String(elements.world.value || 'arena').toLowerCase(),
    behavior: String(elements.behavior.value || 'wander').toLowerCase(),
    seed: parseInt(elements.seed.value, 10) || 1,
    arena_size: parseFloat(elements.arenaSize.value) || 10,
  };
}

async function fetchSimulation(payload) {
  const response = await fetch(API_PATH, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const json = await response.json().catch(() => null);
    const message = json?.error || `HTTP ${response.status}`;
    throw new Error(message);
  }

  return response.json();
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
  ].join('\n');
}

function clearCanvas() {
  if (!ctx) return;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#060812';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}

function drawArena(world, arenaSize) {
  if (!ctx) return;
  if (world !== 'arena') {
    return;
  }

  const padding = 32;
  const size = Math.min(canvas.width, canvas.height) - padding * 2;
  const offsetX = (canvas.width - size) / 2;
  const offsetY = (canvas.height - size) / 2;

  ctx.strokeStyle = 'rgba(255,255,255,0.25)';
  ctx.lineWidth = 2;
  ctx.strokeRect(offsetX, offsetY, size, size);
}

function drawFrame(frame, arenaSize) {
  if (!ctx) return;

  clearCanvas();
  drawArena(currentSimulation?.config.world || 'arena', arenaSize);

  const scale = (canvas.width * 0.8) / arenaSize;
  const centerX = canvas.width / 2;
  const centerY = canvas.height / 2;

  const x = centerX + frame.x * scale;
  const y = centerY - frame.y * scale;

  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(frame.heading_rad);

  ctx.fillStyle = '#f4d96f';
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(16, 0);
  ctx.lineTo(-12, 9);
  ctx.lineTo(-12, -9);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  ctx.restore();

  ctx.fillStyle = '#ffffff';
  ctx.font = '14px Arial';
  ctx.fillText(`t = ${frame.t.toFixed(2)}s`, 18, 24);
}

function updateCanvasResolution() {
  const displayWidth = canvas.clientWidth;
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
      setStatus('No frames returned from the simulation.', true);
      setTask('render', 'error');
      resolve();
      return;
    }

    updateCanvasResolution();
    currentSimulation = simulation;
    setStatus('Playing simulation...');
    setSummary(formatSummary(simulation));
    video.hidden = true;
    elements.downloadLink.hidden = true;

    markTask('render', 'running', `Rendering frame 1 of ${frames.length}...`);

    const start = performance.now();
    let frameIndex = 0;
    const stopOnComplete = () => {
      markTask('render', 'completed', 'Rendering complete.');
      setStatus('Simulation complete.');
      if (record && mediaRecorder && mediaRecorder.state === 'recording') {
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
        const renderProgress = frames.length > 1 ? (frameIndex / (frames.length - 1)) : 1;
        const base = record ? 45 : 40;
        const max = record ? 90 : 100;
        const percent = base + renderProgress * (max - base);
        setProgress(percent, `Rendering frame ${frameIndex + 1}/${frames.length}`);
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
  markTask('prepare', 'running', 'Preparing simulation payload...');

  const payload = buildPayload();
  setStatus('Running simulation on the local server...');
  setSummary('');
  video.hidden = true;
  elements.downloadLink.hidden = true;

  try {
    markTask('request', 'running', 'Sending request to backend...');
    setProgress(20, 'Request in progress');
    const result = await fetchSimulation(payload);
    currentSimulation = result;
    markTask('request', 'completed', 'Simulation data received.');
    markTask('prepare', 'completed');
    setProgress(40, 'Data loaded');

    if (record && !('MediaRecorder' in window)) {
      markTask('record', 'error', 'Recording not supported in this browser.');
      setStatus('Recording is not supported in this browser.', true);
      return;
    }

    if (record) {
      const stream = canvas.captureStream(payload.fps);
      recordingChunks = [];
      mediaRecorder = new MediaRecorder(stream, { mimeType: 'video/webm; codecs=vp8' });
      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          recordingChunks.push(event.data);
        }
      };
      mediaRecorder.onstop = () => {
        const blob = new Blob(recordingChunks, { type: 'video/webm' });
        const url = URL.createObjectURL(blob);
        video.src = url;
        video.hidden = false;
        elements.downloadLink.href = url;
        elements.downloadLink.hidden = false;
        markTask('record', 'completed', 'Recorded video available.');
        setProgress(100, 'Recording complete');
        setStatus('Recording complete. Preview below or download the video.');
      };
      mediaRecorder.start();
      markTask('record', 'running', 'Recording the animation...');
      setProgress(45, 'Recording will complete after render');
    } else {
      markTask('record', 'skipped', 'Recording disabled.');
    }

    await playSimulation(result, { record });
  } catch (error) {
    markTask('request', 'error', `Error: ${error.message}`);
    setStatus(error.message || 'Simulation failed.', true);
  }
}

elements.submit.addEventListener('click', () => startSimulation(false));

elements.recordButton.addEventListener('click', () => {
  if (!('MediaRecorder' in window)) {
    setStatus('Recording is not available in this browser.', true);
    return;
  }

  if (isRecording) {
    setStatus('Recording is already in progress. Please wait.');
    return;
  }

  isRecording = true;
  elements.recordButton.textContent = 'Recording...';
  startSimulation(true).finally(() => {
    isRecording = false;
    elements.recordButton.textContent = 'Record simulation';
  });
});

window.addEventListener('resize', updateCanvasResolution);
updateCanvasResolution();
clearCanvas();
resetTaskManager();
setStatus('Ready to run the Fly simulation. Preview runs typically finish in a few seconds.');
