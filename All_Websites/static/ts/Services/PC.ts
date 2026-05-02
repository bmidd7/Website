export {};

interface PcAuthResponse {
  ok?: boolean;
  layer?: number;
  remembered?: boolean;
  accessGranted?: boolean;
  remoteUrl?: string;
  desktopUrl?: string;
  desktopConfigured?: boolean;
  bridgeStatus?: PcBridgeStatus;
  error?: string;
}

interface PcBridgeStatus {
  configured?: boolean;
  online?: boolean;
  host?: string;
  port?: number;
  message?: string;
}

const app = document.getElementById("pc-access-app") as HTMLElement | null;
const authForm = document.getElementById("pc-auth-form") as HTMLFormElement | null;
const passwordInput = document.getElementById("pc-password-input") as HTMLInputElement | null;
const submitButton = document.getElementById("pc-submit-button") as HTMLButtonElement | null;
const message = document.getElementById("pc-auth-message") as HTMLParagraphElement | null;
const layerLabel = document.getElementById("pc-current-layer-label") as HTMLParagraphElement | null;
const formTitle = document.getElementById("pc-form-title") as HTMLHeadingElement | null;
const togglePasswordButton = document.getElementById("pc-toggle-password") as HTMLButtonElement | null;
const forgetButton = document.getElementById("pc-forget-button") as HTMLButtonElement | null;
const remotePanel = document.getElementById("pc-remote-panel") as HTMLDivElement | null;
const remoteFrame = document.getElementById("pc-remote-frame") as HTMLIFrameElement | null;
const remoteLink = document.getElementById("pc-open-remote") as HTMLAnchorElement | null;
const remoteMessage = document.getElementById("pc-remote-message") as HTMLParagraphElement | null;
const setupPanel = document.getElementById("pc-setup-panel") as HTMLDivElement | null;

function requireElement<T>(element: T | null, name: string): T {
  if (!element) {
    throw new Error(`Missing ${name}.`);
  }

  return element;
}

const requiredApp = requireElement(app, "#pc-access-app");
const requiredAuthForm = requireElement(authForm, "#pc-auth-form");
const requiredPasswordInput = requireElement(passwordInput, "#pc-password-input");
const requiredSubmitButton = requireElement(submitButton, "#pc-submit-button");
const requiredMessage = requireElement(message, "#pc-auth-message");
const requiredLayerLabel = requireElement(layerLabel, "#pc-current-layer-label");
const requiredFormTitle = requireElement(formTitle, "#pc-form-title");
const requiredTogglePasswordButton = requireElement(togglePasswordButton, "#pc-toggle-password");
const requiredForgetButton = requireElement(forgetButton, "#pc-forget-button");
const requiredRemotePanel = requireElement(remotePanel, "#pc-remote-panel");
const requiredRemoteFrame = requireElement(remoteFrame, "#pc-remote-frame");
const requiredRemoteLink = requireElement(remoteLink, "#pc-open-remote");
const requiredRemoteMessage = requireElement(remoteMessage, "#pc-remote-message");
const requiredSetupPanel = requireElement(setupPanel, "#pc-setup-panel");

const authUrl = requiredApp.dataset.authUrl || "";
const forgetUrl = requiredApp.dataset.forgetUrl || "";
const bridgeStatusUrl = requiredApp.dataset.bridgeStatusUrl || "";

const layerTitles: Record<number, string> = {
  1: "Outer gate",
  2: "Device gate",
  3: "Session gate",
};

const rememberedLayers = new Set<number>();
if (requiredApp.getAttribute("data-layer-1-remembered") === "true") {
  rememberedLayers.add(1);
}
if (requiredApp.getAttribute("data-layer-2-remembered") === "true") {
  rememberedLayers.add(2);
}

let currentLayer = getNextLayer();
let accessGranted = false;

function getNextLayer() {
  if (!rememberedLayers.has(1)) {
    return 1;
  }

  if (!rememberedLayers.has(2)) {
    return 2;
  }

  return 3;
}

function setMessage(text: string, tone: "neutral" | "error" | "success" = "neutral") {
  requiredMessage.textContent = text;
  if (tone === "neutral") {
    requiredMessage.removeAttribute("data-tone");
    return;
  }

  requiredMessage.dataset.tone = tone;
}

function setRemoteMessage(text: string, tone: "neutral" | "error" | "success" = "neutral") {
  requiredRemoteMessage.textContent = text;
  if (tone === "neutral") {
    requiredRemoteMessage.removeAttribute("data-tone");
    return;
  }

  requiredRemoteMessage.dataset.tone = tone;
}

function setBusy(isBusy: boolean) {
  requiredSubmitButton.disabled = isBusy;
  requiredPasswordInput.disabled = isBusy;
  requiredTogglePasswordButton.disabled = isBusy;
}

function updateSteps() {
  document.querySelectorAll<HTMLElement>("[data-layer-step]").forEach((step) => {
    const layer = Number(step.dataset.layerStep);
    const status = step.querySelector<HTMLElement>(`[data-layer-status="${layer}"]`);

    if (accessGranted && layer === 3) {
      step.dataset.stepStatus = "complete";
      if (status) {
        status.textContent = "Unlocked";
      }
      return;
    }

    if (rememberedLayers.has(layer)) {
      step.dataset.stepStatus = "complete";
      if (status) {
        status.textContent = "Remembered";
      }
      return;
    }

    if (layer === currentLayer) {
      step.dataset.stepStatus = "active";
      if (status) {
        status.textContent = layer === 3 ? "Required every time" : "Ready";
      }
      return;
    }

    step.dataset.stepStatus = "locked";
    if (status) {
      status.textContent = "Locked";
    }
  });
}

function updateFormForCurrentLayer() {
  requiredLayerLabel.textContent = `Layer ${currentLayer}`;
  requiredFormTitle.textContent = layerTitles[currentLayer] || "Access gate";
  requiredSubmitButton.textContent = currentLayer === 3 ? "Start session" : "Unlock";
  requiredPasswordInput.value = "";
  requiredPasswordInput.type = "password";
  requiredTogglePasswordButton.textContent = "Show";
  requiredTogglePasswordButton.setAttribute("aria-label", "Show password");
  updateSteps();
  requiredPasswordInput.focus();
}

async function parseResponse(response: Response) {
  const data = (await response.json()) as PcAuthResponse;
  if (!response.ok) {
    throw new Error(data.error || "Access check failed.");
  }

  return data;
}

async function submitCurrentLayer() {
  const password = requiredPasswordInput.value;
  if (!password) {
    return;
  }

  setBusy(true);
  setMessage("Checking...");

  try {
    const response = await fetch(authUrl, {
      method: "POST",
      credentials: "same-origin",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        layer: currentLayer,
        password,
      }),
    });

    const data = await parseResponse(response);

    if (data.layer === 1 || data.layer === 2) {
      rememberedLayers.add(data.layer);
      currentLayer = getNextLayer();
      setMessage(`Layer ${data.layer} saved on this browser.`, "success");
      updateFormForCurrentLayer();
      return;
    }

    if (data.accessGranted) {
      accessGranted = true;
      showRemote(data.desktopUrl || data.remoteUrl || "", data.bridgeStatus);
      updateSteps();
      return;
    }
  } catch (error) {
    const errorText = error instanceof Error ? error.message : "Access check failed.";
    setMessage(errorText, "error");
    requiredPasswordInput.select();
  } finally {
    setBusy(false);
  }
}

function bridgeStatusText(bridgeStatus?: PcBridgeStatus) {
  if (!bridgeStatus) {
    return "Desktop bridge status was not checked.";
  }

  if (bridgeStatus.online) {
    return bridgeStatus.message || "Desktop bridge is online.";
  }

  return bridgeStatus.message || "Desktop bridge is not online yet.";
}

function showRemote(remoteUrl: string, bridgeStatus?: PcBridgeStatus) {
  requiredAuthForm.hidden = true;
  requiredRemotePanel.hidden = false;
  requiredSetupPanel.hidden = true;
  requiredRemoteFrame.hidden = false;

  if (!remoteUrl) {
    requiredRemoteLink.removeAttribute("href");
    requiredRemoteFrame.removeAttribute("src");
    requiredRemoteFrame.hidden = true;
    requiredSetupPanel.hidden = false;
    setRemoteMessage("Unlocked. Desktop bridge setup is still needed.", "neutral");
    return;
  }

  requiredRemoteLink.href = remoteUrl;
  requiredRemoteFrame.src = remoteUrl;
  setRemoteMessage(bridgeStatusText(bridgeStatus), bridgeStatus?.online ? "success" : "error");
}

async function refreshBridgeStatus() {
  if (!bridgeStatusUrl || !accessGranted) {
    return;
  }

  try {
    const response = await fetch(bridgeStatusUrl, {
      method: "GET",
      credentials: "same-origin",
    });
    const data = (await response.json()) as PcBridgeStatus;
    setRemoteMessage(bridgeStatusText(data), data.online ? "success" : "error");
  } catch (error) {
    setRemoteMessage("Could not check the desktop bridge.", "error");
  }
}

async function forgetRememberedLayers() {
  requiredForgetButton.disabled = true;
  setMessage("Forgetting remembered gates...");

  try {
    const response = await fetch(forgetUrl, {
      method: "POST",
      credentials: "same-origin",
    });

    const data = (await response.json()) as PcAuthResponse;
    if (!response.ok) {
      throw new Error(data.error || "Could not clear remembered gates.");
    }

    rememberedLayers.clear();
    accessGranted = false;
    currentLayer = 1;
    requiredAuthForm.hidden = false;
    requiredRemotePanel.hidden = true;
    requiredRemoteFrame.removeAttribute("src");
    requiredRemoteFrame.hidden = false;
    requiredRemoteLink.removeAttribute("href");
    requiredSetupPanel.hidden = true;
    setRemoteMessage("");
    setMessage("Remembered gates cleared.", "success");
    updateFormForCurrentLayer();
  } catch (error) {
    const errorText = error instanceof Error ? error.message : "Could not clear remembered gates.";
    setMessage(errorText, "error");
  } finally {
    requiredForgetButton.disabled = false;
  }
}

requiredAuthForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  await submitCurrentLayer();
});

requiredTogglePasswordButton.addEventListener("click", () => {
  const isPassword = requiredPasswordInput.type === "password";
  requiredPasswordInput.type = isPassword ? "text" : "password";
  requiredTogglePasswordButton.textContent = isPassword ? "Hide" : "Show";
  requiredTogglePasswordButton.setAttribute(
    "aria-label",
    isPassword ? "Hide password" : "Show password",
  );
  requiredPasswordInput.focus();
});

requiredForgetButton.addEventListener("click", async () => {
  await forgetRememberedLayers();
});

window.setInterval(() => {
  void refreshBridgeStatus();
}, 15000);

updateFormForCurrentLayer();
