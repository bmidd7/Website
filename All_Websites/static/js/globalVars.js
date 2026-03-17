var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
export const mainPage = document.getElementById("main");
export const sidebar = document.getElementById("sidebar");
export const sidebarOpenButton = document.getElementById("open-sidebar");
export const sidebarCloseButton = document.getElementById("close-sidebar");
export const sidebarHandle = document.getElementById("sidebar-handle");
export const webAddressWithEndSlash = "https://isreal-brainy-irreclaimably.ngrok-free.dev/";
export const GPU = !!navigator.gpu;
export const RAM = navigator.deviceMemory;
export const CPUCores = navigator.hardwareConcurrency;
export function hasWiFi() {
    return __awaiter(this, arguments, void 0, function* (retries = 3, delay = 500) {
        if (!navigator.onLine) {
            console.log("No WiFi Connection");
            return false;
        }
        let attempt = 1;
        let internetAccess = false;
        while (attempt <= retries) {
            try {
                const response = yield fetch(webAddressWithEndSlash + "API/WiFi");
                if (response.ok) {
                    console.log("Internet Works likely");
                    internetAccess = true;
                    break;
                }
            }
            catch (err) {
                console.log(`Attempt #${attempt} failed. Will retry in ${delay}ms.`);
                attempt++;
                yield new Promise((resolve) => {
                    setTimeout(resolve, delay);
                });
            }
        }
        return internetAccess;
    });
}
export function WiFiSpeed() {
    return __awaiter(this, void 0, void 0, function* () {
        const baseURL = "/API/20MB/";
        const samples = [];
        const attempts = 1;
        for (let i = 0; i < attempts; i++) {
            const cacheBust = `${baseURL}${baseURL.includes("?") ? "&" : "?"}_t=${Date.now()}_${i}`;
            const start = performance.now();
            const response = yield fetch(cacheBust, {
                cache: "no-store",
                headers: { "ngrok-skip-browser-warning": "true" },
            });
            if (!response.ok) {
                throw new Error(`Speed test failed with status ${response.status}`);
            }
            const buffer = yield response.arrayBuffer();
            const end = performance.now();
            const headerLen = response.headers.get("Content-Length");
            const bytes = headerLen ? Number(headerLen) : buffer.byteLength;
            const seconds = (end - start) / 1000;
            const mbps = (bytes * 8) / (seconds * 1000000);
            samples.push({ bytes, seconds, mbps });
        }
        const avgMbps = samples.reduce((sum, s) => sum + s.mbps, 0) / samples.length;
        return { avgMbps, samples };
    });
}
//# sourceMappingURL=globalVars.js.map