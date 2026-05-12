export const BASE_ORB_DIAMETER = 95;
export const TEXT_FILL_RATIO = 0.85;
export const MAX_ORB_VIEWPORT_RATIO = 0.1;
function getViewportBaseSize() {
    return Math.min(window.innerWidth, window.innerHeight);
}
function getOrbitRatio(minViewportRatio, maxViewportRatio) {
    return minViewportRatio + Math.random() * (maxViewportRatio - minViewportRatio);
}
export const ANGLE_OFFSET = -Math.PI / 2;
export const DRAG_THRESHOLD = 6;
export const MAX_DRAG_RATIO = 0.75;
export const DRAG_EASE = 0.085;
export const LIMIT_BOUNCE_RATIO = 0.95;
export const HUB_CONFIG = {
    orbitRadius: {
        minViewportRatio: 0.25,
        maxViewportRatio: 0.4,
    },
    projects: [
        { label: "School", url: "/School/" },
        { label: "Chemistry", url: "/School/Chemistry/" },
        { label: "APIs", url: "/API/" },
        { label: "Services", url: "/Services/" },
        { label: "Engineering", url: "/School/Engineering/" },
        { label: "Art", url: "/My-Art/" },
        { label: "AIs", url: "/AI/" },
        { label: "Fly", url: "/Fly/" },
    ],
    idleMotion: {
        manualRadius: 8,
        autoRadius: 14,
        minRadius: 5,
        maxDragRatio: 0.12,
        xPrimarySpeed: 0.0003,
        xSecondarySpeed: 0.00035,
        yPrimarySpeed: 0.0008,
        ySecondarySpeed: 0.00025,
        xPrimaryInfluence: 1,
        xSecondaryInfluence: 0.45,
        yPrimaryInfluence: 0.85,
        ySecondaryInfluence: 0.35,
        seedXPrimary: 3.1,
        seedXSecondary: 5.4,
        seedYPrimary: 2.2,
        seedYSecondary: 4.7,
    },
    tendril: {
        seedMultiplier: 127.1,
        seedOffsetMultiplier: 43758.5453123,
        minSegments: 7,
        segmentLength: 38,
        swayMin: 12,
        swayMax: 34,
        swayDistanceRatio: 0.08,
        envelopePower: 1.15,
        primaryWaveFrequency: 7.2,
        primaryWaveSpeed: 0.0018,
        primaryWaveSeed: 10,
        secondaryWaveFrequency: 15.5,
        secondaryWaveSpeed: 0.0011,
        secondaryWaveSeed: 18,
        secondaryWaveInfluence: 0.38,
        tipCurlFrequency: 22,
        tipCurlSpeed: 0.0024,
        tipCurlSeed: 24,
        tipCurlPower: 2.4,
        tipCurlInfluence: 0.28,
        axialWaveFrequency: 10.5,
        axialWaveSpeed: 0.0014,
        axialWaveSeed: 13,
        axialWaveInfluence: 0.085,
        outerWidthMin: 2.8,
        outerWidthRatio: 0.012,
        innerWidthMin: 1.1,
        innerWidthRatio: 0.32,
        glowWidthRatio: 2.1,
        glowBlur: 18,
        bloomBase: 4,
        bloomPulseSize: 1.2,
        bloomPulseSpeed: 0.004,
        colors: {
            glowStroke: "rgba(54, 96, 202, 0.12)",
            midStroke: "rgba(102, 152, 255, 0.24)",
            coreStroke: "rgba(212, 232, 255, 0.75)",
            glowShadow: "rgba(110, 164, 255, 0.2)",
            tipBloom: "rgba(196, 225, 255, 0.16)",
        },
    },
};
export const PROJECTS = HUB_CONFIG.projects.map((project) => {
    const orbitRatio = getOrbitRatio(HUB_CONFIG.orbitRadius.minViewportRatio, HUB_CONFIG.orbitRadius.maxViewportRatio);
    return {
        ...project,
        orbitRatio,
        orbitRadius: Math.round(getViewportBaseSize() * orbitRatio),
    };
});
export function updateProjectOrbitRadii(projects) {
    const viewportBaseSize = getViewportBaseSize();
    projects.forEach((project) => {
        project.orbitRadius = Math.round(viewportBaseSize * project.orbitRatio);
    });
}
//# sourceMappingURL=tendrilsConfig.js.map