export type NodeElType = HTMLDivElement & {
    _angle?: number;
    _x?: number;
    _y?: number;
    _targetX?: number;
    _targetY?: number;
    _edgeTargetX?: number;
    _edgeTargetY?: number;
    _recoilTargetX?: number;
    _recoilTargetY?: number;
    _isBeyondLimit?: boolean;
    _initialX?: number;
    _initialY?: number;
    _maxDragDistance?: number;
    _manual?: boolean;
    _clickSuppressed?: boolean;
};

export type DragState = {
    node: NodeElType;
    pointerId: number;
    offsetX: number;
    offsetY: number;
    startX: number;
    startY: number;
    moved: boolean;
};

export type Project = {
    label: string;
    url: string;
    orbitRadius: number;
};

function getViewportBaseSize() {
    return Math.min(window.innerWidth, window.innerHeight);
}

function getOrbitRadius() {
    const viewportBaseSize = getViewportBaseSize();
    const min = Math.ceil(viewportBaseSize / 4);
    const max = Math.floor((viewportBaseSize * 2) / 5);

    return Math.floor(Math.random() * (max - min + 1)) + min;
}

export const ANGLE_OFFSET = -Math.PI / 2;

export const DRAG_THRESHOLD = 6;
export const MAX_DRAG_RATIO = 0.75;
export const DRAG_EASE = 0.085;
export const LIMIT_BOUNCE_RATIO = 0.95;

export const PROJECTS: Project[] = [
    { label: "School", url: "/School/", orbitRadius: getOrbitRadius() },
    { label: "Chemistry", url: "/School/Chemistry/", orbitRadius: getOrbitRadius() },
    { label: "APIs", url: "/API/", orbitRadius: getOrbitRadius() },
    { label: "Engineering", url: "/School/Engineering/", orbitRadius: getOrbitRadius() },
    { label: "Art", url: "/My-Art/", orbitRadius: getOrbitRadius() },
];
