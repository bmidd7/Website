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
export const PROJECTS = [
    { label: "School", url: "/School/", orbitRadius: getOrbitRadius() },
    { label: "Chemistry", url: "/School/Chemistry/", orbitRadius: getOrbitRadius() },
    { label: "APIs", url: "/API/", orbitRadius: getOrbitRadius() },
    { label: "Engineering", url: "/School/Engineering/", orbitRadius: getOrbitRadius() },
    { label: "Art", url: "/My-Art/", orbitRadius: getOrbitRadius() },
];
//# sourceMappingURL=tendrilsConfig.js.map