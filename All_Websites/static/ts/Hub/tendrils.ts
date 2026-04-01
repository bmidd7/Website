import "./centerOrb.js";
import { PROJECTS } from "./tendrilsConfig.js";
import {
    createProjectNodes,
    positionNodes,
    setMaxDragDistances,
    updateNodeMotion,
} from "./tendrilsNodes.js";

const canvas = document.getElementById('canvas') as HTMLCanvasElement;
const canvasContext = canvas.getContext('2d') as CanvasRenderingContext2D;
export const orbEl = document.getElementById('orb') as HTMLDivElement;
const nodeEls = createProjectNodes(PROJECTS);

let width: number, height: number, centerX: number, centerY: number;
let dragLimitsInitialized = false;

function resize() {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
    centerX = width / 2;
    centerY = height / 2;
    orbEl.style.left = centerX + 'px';
    orbEl.style.top = centerY + 'px';
    positionNodes(PROJECTS, nodeEls, centerX, centerY);

    if (!dragLimitsInitialized) {
        setMaxDragDistances(nodeEls);
        dragLimitsInitialized = true;
    }
}

// Draw tendril lines
function drawTendrils() {
    canvasContext.clearRect(0, 0, width, height);

    PROJECTS.forEach((proj, i) => {
        const nodeX = nodeEls[i]._x;
        const nodeY = nodeEls[i]._y;
        if (nodeX === undefined) return;

        canvasContext.beginPath();
        canvasContext.moveTo(centerX, centerY);
        canvasContext.lineTo(nodeX, nodeY);

        canvasContext.strokeStyle = 'rgba(100, 140, 255, 0.18)';
        canvasContext.lineWidth = 1;
        canvasContext.stroke();
    });
}

// Loop
function loop() {
    updateNodeMotion(nodeEls);
    drawTendrils();
    requestAnimationFrame(loop);
}

window.addEventListener('resize', resize);
resize();
loop();
