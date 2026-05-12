export {};

interface PcBridgeStatus {
  configured?: boolean;
  online?: boolean;
  host?: string;
  port?: number;
  message?: string;
  error?: string;
}

const app = document.getElementById("pc-access-app") as HTMLElement | null;
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
const mfaRequired = requiredApp.dataset.mfaRequired === "true";
const bridgeStatusUrl = requiredApp.dataset.bridgeStatusUrl || "";
const desktopUrl = requiredApp.dataset.desktopUrl || "";
const bridgeConfigured = requiredApp.dataset.bridgeConfigured === "true";
const bridgeOnline = requiredApp.dataset.bridgeOnline === "true";
const bridgeMessage = requiredApp.dataset.bridgeMessage || "";
const guacConfigured = requiredApp.dataset.guacConfigured === "true";
const guacValid = requiredApp.dataset.guacValid === "true";
const guacMessage = requiredApp.dataset.guacMessage || "";

if (!mfaRequired) {
  const requiredRemotePanel = requireElement(remotePanel, "#pc-remote-panel");
  const requiredRemoteFrame = requireElement(remoteFrame, "#pc-remote-frame");
  const requiredRemoteLink = requireElement(remoteLink, "#pc-open-remote");
  const requiredRemoteMessage = requireElement(remoteMessage, "#pc-remote-message");
  const requiredSetupPanel = requireElement(setupPanel, "#pc-setup-panel");

  function setRemoteMessage(text: string, tone: "neutral" | "error" | "success" = "neutral") {
    requiredRemoteMessage.textContent = text;
    if (tone === "neutral") {
      requiredRemoteMessage.removeAttribute("data-tone");
      return;
    }

    requiredRemoteMessage.dataset.tone = tone;
  }

  function showSetupPanel() {
    requiredRemotePanel.hidden = false;
    requiredSetupPanel.hidden = false;
    requiredRemoteFrame.hidden = true;
    requiredRemoteFrame.removeAttribute("src");
    requiredRemoteLink.removeAttribute("href");
  }

  function showRemote() {
    requiredRemotePanel.hidden = false;

    if (!desktopUrl) {
      showSetupPanel();
      setRemoteMessage("Desktop URL is not configured yet.", "error");
      return;
    }

    requiredSetupPanel.hidden = true;
    requiredRemoteFrame.hidden = false;
    requiredRemoteLink.href = desktopUrl;
    requiredRemoteFrame.src = desktopUrl;

    if (guacConfigured && !guacValid) {
      setRemoteMessage(guacMessage || "Saved Guacamole credentials were rejected.", "error");
      return;
    }

    if (bridgeConfigured) {
      setRemoteMessage(bridgeMessage || "Desktop bridge status available.", bridgeOnline ? "success" : "error");
      return;
    }

    setRemoteMessage("Desktop bridge status was not checked.");
  }

  async function refreshBridgeStatus() {
    if (!bridgeStatusUrl) {
      return;
    }

    try {
      const response = await fetch(bridgeStatusUrl, {
        method: "GET",
        credentials: "same-origin",
      });
      const data = (await response.json()) as PcBridgeStatus;
      if (!response.ok) {
        setRemoteMessage(data.error || "Could not check the desktop bridge.", "error");
        return;
      }
      setRemoteMessage(data.message || "Desktop bridge status available.", data.online ? "success" : "error");
    } catch (_error) {
      setRemoteMessage("Could not check the desktop bridge.", "error");
    }
  }

  showRemote();
  window.setInterval(() => {
    void refreshBridgeStatus();
  }, 15000);
}
