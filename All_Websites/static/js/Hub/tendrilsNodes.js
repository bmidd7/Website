import { ANGLE_OFFSET, DRAG_EASE, DRAG_THRESHOLD, HUB_CONFIG, LIMIT_BOUNCE_RATIO, MAX_DRAG_RATIO, } from "./tendrilsConfig.js";
let activeDrag = null;
function getIdleOffset(node, index, time) {
    const idleMotion = HUB_CONFIG.idleMotion;
    const seed = index * 1.61803398875 + 0.73;
    const baseRadius = node._manual ? idleMotion.manualRadius : idleMotion.autoRadius;
    const limitRadius = node._maxDragDistance
        ? Math.max(idleMotion.minRadius, Math.min(baseRadius, node._maxDragDistance * idleMotion.maxDragRatio))
        : baseRadius;
    const x = Math.sin(time * idleMotion.xPrimarySpeed + seed * idleMotion.seedXPrimary)
        * limitRadius
        * idleMotion.xPrimaryInfluence
        + Math.cos(time * idleMotion.xSecondarySpeed + seed * idleMotion.seedXSecondary)
            * limitRadius
            * idleMotion.xSecondaryInfluence;
    const y = Math.cos(time * idleMotion.yPrimarySpeed + seed * idleMotion.seedYPrimary)
        * limitRadius
        * idleMotion.yPrimaryInfluence
        + Math.sin(time * idleMotion.ySecondarySpeed + seed * idleMotion.seedYSecondary)
            * limitRadius
            * idleMotion.ySecondaryInfluence;
    return { x, y };
}
export function setNodePosition(node, x, y) {
    node.style.left = x + "px";
    node.style.top = y + "px";
    node._x = x;
    node._y = y;
    if (node._initialX === undefined || node._initialY === undefined) {
        node._initialX = x;
        node._initialY = y;
    }
}
export function setNodeTarget(node, x, y) {
    node._targetX = x;
    node._targetY = y;
}
function suppressNextClick(node) {
    node._clickSuppressed = true;
    window.setTimeout(() => {
        node._clickSuppressed = false;
    }, 0);
}
export function setMaxDragDistances(nodeEls) {
    nodeEls.forEach((node, i) => {
        if (node._initialX === undefined || node._initialY === undefined)
            return;
        let nearestNodeDistance = Infinity;
        nodeEls.forEach((otherNode, j) => {
            if (i === j || otherNode._initialX === undefined || otherNode._initialY === undefined)
                return;
            const dx = otherNode._initialX - node._initialX;
            const dy = otherNode._initialY - node._initialY;
            const distance = Math.hypot(dx, dy);
            nearestNodeDistance = Math.min(nearestNodeDistance, distance);
        });
        node._maxDragDistance = Number.isFinite(nearestNodeDistance)
            ? nearestNodeDistance * MAX_DRAG_RATIO
            : 0;
    });
}
export function clampToNodeDragLimit(node, x, y) {
    if (node._initialX === undefined ||
        node._initialY === undefined ||
        node._maxDragDistance === undefined) {
        return {
            isClamped: false,
            targetX: x,
            targetY: y,
            edgeX: x,
            edgeY: y,
            recoilX: x,
            recoilY: y,
        };
    }
    const dx = x - node._initialX;
    const dy = y - node._initialY;
    const distance = Math.hypot(dx, dy);
    if (distance <= node._maxDragDistance || distance === 0) {
        return {
            isClamped: false,
            targetX: x,
            targetY: y,
            edgeX: x,
            edgeY: y,
            recoilX: x,
            recoilY: y,
        };
    }
    const edgeScale = node._maxDragDistance / distance;
    const bounceDistance = node._maxDragDistance * LIMIT_BOUNCE_RATIO;
    const recoilScale = bounceDistance / distance;
    const edgeX = node._initialX + dx * edgeScale;
    const edgeY = node._initialY + dy * edgeScale;
    const recoilX = node._initialX + dx * recoilScale;
    const recoilY = node._initialY + dy * recoilScale;
    return {
        isClamped: true,
        targetX: recoilX,
        targetY: recoilY,
        edgeX,
        edgeY,
        recoilX,
        recoilY,
    };
}
export function createProjectNodes(projects) {
    const hubScene = document.getElementById("hub-scene");
    if (!hubScene) {
        throw new Error("Missing #hub-scene element for project nodes.");
    }
    const nodeEls = [];
    projects.forEach((project) => {
        const wrapper = document.createElement("div");
        wrapper.className = "node";
        const button = document.createElement("button");
        button.textContent = project.label;
        button.draggable = false;
        button.addEventListener("click", (event) => {
            if (wrapper._clickSuppressed) {
                event.preventDefault();
                return;
            }
            window.location.href = project.url;
        });
        wrapper.addEventListener("pointerdown", (event) => {
            if (wrapper._x === undefined || wrapper._y === undefined)
                return;
            activeDrag = {
                node: wrapper,
                pointerId: event.pointerId,
                offsetX: wrapper._x - event.clientX,
                offsetY: wrapper._y - event.clientY,
                startX: event.clientX,
                startY: event.clientY,
                moved: false,
            };
        });
        wrapper.addEventListener("pointermove", (event) => {
            if (!activeDrag || activeDrag.node !== wrapper || activeDrag.pointerId !== event.pointerId)
                return;
            const hasMoved = Math.abs(event.clientX - activeDrag.startX) > DRAG_THRESHOLD ||
                Math.abs(event.clientY - activeDrag.startY) > DRAG_THRESHOLD;
            if (!hasMoved)
                return;
            if (!activeDrag.moved) {
                activeDrag.moved = true;
                wrapper.setPointerCapture(event.pointerId);
            }
            wrapper._manual = true;
            event.preventDefault();
            const unclampedX = event.clientX + activeDrag.offsetX;
            const unclampedY = event.clientY + activeDrag.offsetY;
            const limitedPosition = clampToNodeDragLimit(wrapper, unclampedX, unclampedY);
            if (limitedPosition.isClamped) {
                wrapper._edgeTargetX = limitedPosition.edgeX;
                wrapper._edgeTargetY = limitedPosition.edgeY;
                wrapper._recoilTargetX = limitedPosition.recoilX;
                wrapper._recoilTargetY = limitedPosition.recoilY;
                wrapper._isBeyondLimit = true;
                setNodeTarget(wrapper, limitedPosition.edgeX, limitedPosition.edgeY);
                return;
            }
            wrapper._isBeyondLimit = false;
            wrapper._edgeTargetX = undefined;
            wrapper._edgeTargetY = undefined;
            wrapper._recoilTargetX = undefined;
            wrapper._recoilTargetY = undefined;
            setNodeTarget(wrapper, limitedPosition.targetX, limitedPosition.targetY);
        });
        wrapper.addEventListener("pointerup", (event) => {
            if (!activeDrag || activeDrag.node !== wrapper || activeDrag.pointerId !== event.pointerId)
                return;
            if (wrapper.hasPointerCapture(event.pointerId)) {
                wrapper.releasePointerCapture(event.pointerId);
            }
            if (activeDrag.moved) {
                suppressNextClick(wrapper);
            }
            if (wrapper._isBeyondLimit &&
                wrapper._recoilTargetX !== undefined &&
                wrapper._recoilTargetY !== undefined) {
                setNodeTarget(wrapper, wrapper._recoilTargetX, wrapper._recoilTargetY);
                wrapper._isBeyondLimit = false;
            }
            activeDrag = null;
        });
        wrapper.addEventListener("pointercancel", (event) => {
            if (!activeDrag || activeDrag.node !== wrapper || activeDrag.pointerId !== event.pointerId)
                return;
            if (wrapper.hasPointerCapture(event.pointerId)) {
                wrapper.releasePointerCapture(event.pointerId);
            }
            activeDrag = null;
        });
        wrapper.appendChild(button);
        hubScene.appendChild(wrapper);
        nodeEls.push(wrapper);
    });
    return nodeEls;
}
export function positionNodes(projects, nodeEls, centerX, centerY) {
    const nodeCount = projects.length;
    projects.forEach((project, i) => {
        if (nodeEls[i]._manual)
            return;
        const angle = ANGLE_OFFSET + (2 * Math.PI * i) / nodeCount;
        const x = centerX + project.orbitRadius * Math.cos(angle);
        const y = centerY + project.orbitRadius * Math.sin(angle);
        setNodePosition(nodeEls[i], x, y);
        setNodeTarget(nodeEls[i], x, y);
        nodeEls[i]._initialX = x;
        nodeEls[i]._initialY = y;
        nodeEls[i]._angle = angle;
    });
}
export function updateNodeMotion(nodeEls) {
    const time = performance.now();
    nodeEls.forEach((node, index) => {
        if (node._x === undefined ||
            node._y === undefined ||
            node._targetX === undefined ||
            node._targetY === undefined) {
            return;
        }
        let targetX = node._targetX;
        let targetY = node._targetY;
        if (!activeDrag || activeDrag.node !== node) {
            const idleOffset = getIdleOffset(node, index, time);
            const ambientX = targetX + idleOffset.x;
            const ambientY = targetY + idleOffset.y;
            const limitedPosition = clampToNodeDragLimit(node, ambientX, ambientY);
            if (limitedPosition.isClamped) {
                targetX = limitedPosition.edgeX;
                targetY = limitedPosition.edgeY;
            }
            else {
                targetX = limitedPosition.targetX;
                targetY = limitedPosition.targetY;
            }
        }
        const nextX = node._x + (targetX - node._x) * DRAG_EASE;
        const nextY = node._y + (targetY - node._y) * DRAG_EASE;
        const snapX = Math.abs(targetX - nextX) < 0.5 ? targetX : nextX;
        const snapY = Math.abs(targetY - nextY) < 0.5 ? targetY : nextY;
        if (snapX !== node._x || snapY !== node._y) {
            setNodePosition(node, snapX, snapY);
        }
    });
}
//# sourceMappingURL=tendrilsNodes.js.map