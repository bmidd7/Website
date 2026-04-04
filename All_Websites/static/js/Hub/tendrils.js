import "./centerOrb.js";
import { HUB_CONFIG, PROJECTS } from "./tendrilsConfig.js";
import { createProjectNodes, positionNodes, setMaxDragDistances, updateNodeMotion, } from "./tendrilsNodes.js";
const canvas = document.getElementById('canvas');
const canvasContext = canvas.getContext('2d');
export const orbEl = document.getElementById('orb');
const hubScene = document.getElementById('hub-scene');
const nodeEls = createProjectNodes(PROJECTS);
let width, height, centerX, centerY;
let resizeFrame = 0;
function getSeed(index) {
    const { seedMultiplier, seedOffsetMultiplier } = HUB_CONFIG.tendril;
    const raw = Math.sin((index + 1) * seedMultiplier) * seedOffsetMultiplier;
    return raw - Math.floor(raw);
}
function getTendrilPoints(nodeX, nodeY, index, time) {
    const tendril = HUB_CONFIG.tendril;
    const dx = nodeX - centerX;
    const dy = nodeY - centerY;
    const distance = Math.hypot(dx, dy);
    if (distance === 0) {
        return [{ x: centerX, y: centerY }, { x: nodeX, y: nodeY }];
    }
    const unitX = dx / distance;
    const unitY = dy / distance;
    const normalX = -unitY;
    const normalY = unitX;
    const seed = getSeed(index);
    const segments = Math.max(tendril.minSegments, Math.round(distance / tendril.segmentLength));
    const swayBase = Math.min(tendril.swayMax, Math.max(tendril.swayMin, distance * tendril.swayDistanceRatio));
    const points = [];
    for (let step = 0; step <= segments; step++) {
        const progress = step / segments;
        const envelope = Math.pow(Math.sin(progress * Math.PI), tendril.envelopePower);
        const primaryWave = Math.sin(progress * tendril.primaryWaveFrequency
            + time * tendril.primaryWaveSpeed
            + seed * tendril.primaryWaveSeed);
        const secondaryWave = Math.cos(progress * tendril.secondaryWaveFrequency
            - time * tendril.secondaryWaveSpeed
            + seed * tendril.secondaryWaveSeed);
        const tipCurl = Math.sin(progress * tendril.tipCurlFrequency
            - time * tendril.tipCurlSpeed
            + seed * tendril.tipCurlSeed) * Math.pow(progress, tendril.tipCurlPower);
        const lateralOffset = (primaryWave * swayBase + secondaryWave * swayBase * tendril.secondaryWaveInfluence)
            * envelope
            + tipCurl * swayBase * tendril.tipCurlInfluence;
        const axialOffset = Math.sin(progress * tendril.axialWaveFrequency
            + time * tendril.axialWaveSpeed
            + seed * tendril.axialWaveSeed) * swayBase * tendril.axialWaveInfluence * envelope;
        points.push({
            x: centerX + dx * progress + normalX * lateralOffset + unitX * axialOffset,
            y: centerY + dy * progress + normalY * lateralOffset + unitY * axialOffset,
        });
    }
    return points;
}
function drawPath(points) {
    canvasContext.beginPath();
    canvasContext.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length - 1; i++) {
        const midX = (points[i].x + points[i + 1].x) / 2;
        const midY = (points[i].y + points[i + 1].y) / 2;
        canvasContext.quadraticCurveTo(points[i].x, points[i].y, midX, midY);
    }
    const lastPoint = points[points.length - 1];
    canvasContext.lineTo(lastPoint.x, lastPoint.y);
}
function updateProjectOrbitRadii(viewportBaseSize) {
    const { minViewportRatio, maxViewportRatio } = HUB_CONFIG.orbitRadius;
    PROJECTS.forEach((project) => {
        if (typeof project.orbitRatio !== "number") {
            project.orbitRatio = minViewportRatio + Math.random() * (maxViewportRatio - minViewportRatio);
        }
        project.orbitRadius = Math.round(viewportBaseSize * project.orbitRatio);
    });
}
function resize() {
    const sceneRect = hubScene?.getBoundingClientRect();
    const nextWidth = Math.round(sceneRect?.width ?? window.innerWidth);
    const nextHeight = Math.round(sceneRect?.height ?? window.innerHeight);
    if (nextWidth <= 0 || nextHeight <= 0) {
        return;
    }
    width = canvas.width = nextWidth;
    height = canvas.height = nextHeight;
    centerX = width / 2;
    centerY = height / 2;
    updateProjectOrbitRadii(Math.min(nextWidth, nextHeight));
    orbEl.style.left = centerX + 'px';
    orbEl.style.top = centerY + 'px';
    positionNodes(PROJECTS, nodeEls, centerX, centerY);
    setMaxDragDistances(nodeEls);
}
function queueResize() {
    if (resizeFrame) {
        return;
    }
    resizeFrame = window.requestAnimationFrame(() => {
        resizeFrame = 0;
        resize();
    });
}
// Draw tendril lines
function drawTendrils() {
    canvasContext.clearRect(0, 0, width, height);
    const time = performance.now();
    PROJECTS.forEach((proj, i) => {
        const nodeX = nodeEls[i]._x;
        const nodeY = nodeEls[i]._y;
        if (nodeX === undefined)
            return;
        if (nodeY === undefined)
            return;
        const points = getTendrilPoints(nodeX, nodeY, i, time);
        const distance = Math.hypot(nodeX - centerX, nodeY - centerY);
        const tendril = HUB_CONFIG.tendril;
        const outerWidth = Math.max(tendril.outerWidthMin, distance * tendril.outerWidthRatio);
        const innerWidth = Math.max(tendril.innerWidthMin, outerWidth * tendril.innerWidthRatio);
        canvasContext.save();
        canvasContext.lineCap = "round";
        canvasContext.lineJoin = "round";
        drawPath(points);
        canvasContext.strokeStyle = tendril.colors.glowStroke;
        canvasContext.lineWidth = outerWidth * tendril.glowWidthRatio;
        canvasContext.shadowColor = tendril.colors.glowShadow;
        canvasContext.shadowBlur = tendril.glowBlur;
        canvasContext.stroke();
        drawPath(points);
        canvasContext.strokeStyle = tendril.colors.midStroke;
        canvasContext.lineWidth = outerWidth;
        canvasContext.shadowBlur = 0;
        canvasContext.stroke();
        drawPath(points);
        canvasContext.strokeStyle = tendril.colors.coreStroke;
        canvasContext.lineWidth = innerWidth;
        canvasContext.stroke();
        canvasContext.restore();
        const tip = points[points.length - 1];
        const seed = getSeed(i);
        const bloom = tendril.bloomBase
            + Math.sin(time * tendril.bloomPulseSpeed + seed * Math.PI * 2) * tendril.bloomPulseSize;
        canvasContext.beginPath();
        canvasContext.arc(tip.x, tip.y, bloom, 0, Math.PI * 2);
        canvasContext.fillStyle = tendril.colors.tipBloom;
        canvasContext.fill();
    });
}
// Loop
function loop() {
    const sceneRect = hubScene?.getBoundingClientRect();
    const sceneWidth = Math.round(sceneRect?.width ?? window.innerWidth);
    const sceneHeight = Math.round(sceneRect?.height ?? window.innerHeight);
    if (sceneWidth > 0 && sceneHeight > 0 && (sceneWidth !== width || sceneHeight !== height)) {
        resize();
    }
    updateNodeMotion(nodeEls);
    drawTendrils();
    requestAnimationFrame(loop);
}
window.addEventListener('resize', queueResize);
window.addEventListener('orientationchange', queueResize);
window.visualViewport?.addEventListener('resize', queueResize);
window.visualViewport?.addEventListener('scroll', queueResize);
resize();
loop();
//# sourceMappingURL=tendrils.js.map