export const mainPage = document.getElementById("main");
export const sidebar = document.getElementById("sidebar");
export const sidebarOpenButton = document.getElementById("open-sidebar");
export const sidebarCloseButton = document.getElementById("close-sidebar");
export const sidebarHandle = document.getElementById("sidebar-handle");
export const webAddressWithEndSlash = "https://isreal-brainy-irreclaimably.ngrok-free.dev/";
const hardwareNavigator = navigator;
export const GPU = Boolean(hardwareNavigator.gpu);
export const RAM = hardwareNavigator.deviceMemory ?? 0;
export const CPUCores = navigator.hardwareConcurrency;
export function apiOrigin() {
    const { protocol, hostname, port } = window.location;
    if (hostname === "bmiddleton.dev" || hostname === "www.bmiddleton.dev" || hostname === "remote.bmiddleton.dev") {
        return `${protocol}//api.bmiddleton.dev`;
    }
    return port ? `${protocol}//${hostname}:${port}` : `${protocol}//${hostname}`;
}
export async function hasWiFi(retries = 3, delay = 500) {
    if (!navigator.onLine) {
        console.log("No WiFi Connection");
        return false;
    }
    let attempt = 1;
    let internetAccess = false;
    while (attempt <= retries) {
        try {
            const response = await fetch(`${apiOrigin()}/wi-fi/`);
            if (response.ok) {
                console.log("Internet Works likely");
                internetAccess = true;
                break;
            }
        }
        catch (err) {
            console.log(`Attempt #${attempt} failed. Will retry in ${delay}ms.`);
            attempt++;
            await new Promise((resolve) => {
                setTimeout(resolve, delay);
            });
        }
    }
    return internetAccess;
}
export async function WiFiSpeed() {
    const baseURL = `${apiOrigin()}/20mb/`;
    const samples = [];
    const attempts = 1;
    for (let i = 0; i < attempts; i++) {
        const cacheBust = `${baseURL}${baseURL.includes("?") ? "&" : "?"}_t=${Date.now()}_${i}`;
        const start = performance.now();
        const response = await fetch(cacheBust, {
            cache: "no-store",
            headers: { "ngrok-skip-browser-warning": "true" },
        });
        if (!response.ok) {
            throw new Error(`Speed test failed with status ${response.status}`);
        }
        const buffer = await response.arrayBuffer();
        const end = performance.now();
        const headerLen = response.headers.get("Content-Length");
        const bytes = headerLen ? Number(headerLen) : buffer.byteLength;
        const seconds = (end - start) / 1000;
        const mbps = (bytes * 8) / (seconds * 1000000);
        samples.push({ bytes, seconds, mbps });
    }
    const avgMbps = samples.reduce((sum, s) => sum + s.mbps, 0) / samples.length;
    return { avgMbps, samples };
}
//# sourceMappingURL=global-vars.js.map