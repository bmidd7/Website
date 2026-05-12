import { BASE_ORB_DIAMETER, TEXT_FILL_RATIO, MAX_ORB_VIEWPORT_RATIO, } from "./tendrilsConfig.js";
const textMeasureCanvas = document.createElement("canvas");
const textMeasureContext = textMeasureCanvas.getContext("2d");
function getUserName() {
    const userDataEl = document.getElementById("user-data");
    if (!userDataEl) {
        return null;
    }
    try {
        const parsedUser = JSON.parse(userDataEl.textContent ?? "null");
        return typeof parsedUser === "string" && parsedUser.trim()
            ? parsedUser
            : null;
    }
    catch (error) {
        console.warn("Unable to parse #user-data JSON.", error);
        return null;
    }
}
function getCanvasFont(style) {
    if (style.font) {
        return style.font;
    }
    return [
        style.fontStyle,
        style.fontVariant,
        style.fontWeight,
        style.fontSize,
        style.fontFamily,
    ].join(" ");
}
function getLineHeight(style) {
    const parsedLineHeight = Number.parseFloat(style.lineHeight);
    if (Number.isFinite(parsedLineHeight)) {
        return parsedLineHeight;
    }
    const fontSize = Number.parseFloat(style.fontSize);
    return Number.isFinite(fontSize) ? fontSize * 1.2 : 16;
}
function measureTextWidth(text, style) {
    const letterSpacing = Number.parseFloat(style.letterSpacing);
    const extraSpacing = Number.isFinite(letterSpacing)
        ? Math.max(text.length - 1, 0) * letterSpacing
        : 0;
    if (!textMeasureContext) {
        const fontSize = Number.parseFloat(style.fontSize);
        const fallbackWidth = Number.isFinite(fontSize) ? fontSize * 0.6 : 10;
        return text.length * fallbackWidth + extraSpacing;
    }
    textMeasureContext.font = getCanvasFont(style);
    return textMeasureContext.measureText(text).width + extraSpacing;
}
function chunkWord(word, maxCharsPerLine) {
    const characters = Array.from(word);
    const lines = [];
    for (let index = 0; index < characters.length; index += maxCharsPerLine) {
        lines.push(characters.slice(index, index + maxCharsPerLine).join(""));
    }
    return lines;
}
function wrapText(text, maxCharsPerLine) {
    const normalizedText = text.trim().replace(/\s+/g, " ");
    if (!normalizedText || normalizedText.length <= maxCharsPerLine) {
        return [normalizedText];
    }
    const words = normalizedText.split(" ");
    const lines = [];
    let currentLine = "";
    for (const word of words) {
        if (word.length > maxCharsPerLine) {
            if (currentLine) {
                lines.push(currentLine);
                currentLine = "";
            }
            const chunks = chunkWord(word, maxCharsPerLine);
            const trailingChunk = chunks.pop();
            lines.push(...chunks);
            currentLine = trailingChunk ?? "";
            continue;
        }
        const candidateLine = currentLine ? `${currentLine} ${word}` : word;
        if (candidateLine.length <= maxCharsPerLine) {
            currentLine = candidateLine;
            continue;
        }
        lines.push(currentLine);
        currentLine = word;
    }
    if (currentLine) {
        lines.push(currentLine);
    }
    return lines;
}
function getRequiredOrbDiameter(lines, style) {
    const widestLine = lines.reduce((largestWidth, line) => {
        return Math.max(largestWidth, measureTextWidth(line, style));
    }, 0);
    const lineHeight = getLineHeight(style);
    const textBlockHeight = lines.length * lineHeight;
    const textBounds = Math.max(widestLine, textBlockHeight);
    return Math.ceil(textBounds / TEXT_FILL_RATIO);
}
function sizeOrbToLabel(orbEl, labelEl, label) {
    const buttonStyle = window.getComputedStyle(labelEl);
    const maxViewportDiameter = Math.min(window.innerWidth, window.innerHeight) * MAX_ORB_VIEWPORT_RATIO;
    let bestLines = [label];
    let bestDiameter = getRequiredOrbDiameter(bestLines, buttonStyle);
    if (bestDiameter > maxViewportDiameter) {
        const characterWidth = Math.max(measureTextWidth("M", buttonStyle), 1);
        const maxCharsPerLine = Math.max(1, Math.floor((maxViewportDiameter * TEXT_FILL_RATIO) / characterWidth));
        for (let charsPerLine = maxCharsPerLine; charsPerLine >= 1; charsPerLine--) {
            const candidateLines = wrapText(label, charsPerLine);
            const candidateDiameter = getRequiredOrbDiameter(candidateLines, buttonStyle);
            if (candidateDiameter < bestDiameter) {
                bestLines = candidateLines;
                bestDiameter = candidateDiameter;
            }
            if (candidateDiameter <= maxViewportDiameter) {
                bestLines = candidateLines;
                bestDiameter = candidateDiameter;
                break;
            }
        }
    }
    labelEl.textContent = bestLines.join("\n");
    labelEl.style.whiteSpace = bestLines.length > 1 ? "pre-line" : "normal";
    orbEl.style.width = `${Math.max(BASE_ORB_DIAMETER, bestDiameter)}px`;
    orbEl.style.height = `${Math.max(BASE_ORB_DIAMETER, bestDiameter)}px`;
}
function sizeOrbToLines(orbEl, labelEl, lines) {
    const style = window.getComputedStyle(labelEl);
    const diameter = getRequiredOrbDiameter(lines, style);
    orbEl.style.width = `${Math.max(BASE_ORB_DIAMETER, diameter)}px`;
    orbEl.style.height = `${Math.max(BASE_ORB_DIAMETER, diameter)}px`;
}
function buildPrimaryOrbLink(label, href, ariaLabel) {
    const linkEl = document.createElement("a");
    linkEl.className = "orb-primary-link";
    linkEl.href = href;
    linkEl.setAttribute("aria-label", ariaLabel);
    linkEl.textContent = label;
    return linkEl;
}
function buildGuestAuthLinks() {
    const linksWrapper = document.createElement("div");
    linksWrapper.className = "orb-auth-links";
    const loginLink = document.createElement("a");
    loginLink.className = "orb-auth-link";
    loginLink.href = "/accounts/login/?next=/";
    loginLink.textContent = "Log In";
    loginLink.setAttribute("aria-label", "Log in");
    const signupLink = document.createElement("a");
    signupLink.className = "orb-auth-link";
    signupLink.href = "/accounts/signup/";
    signupLink.textContent = "Sign Up";
    signupLink.setAttribute("aria-label", "Sign up");
    linksWrapper.append(loginLink, signupLink);
    return { linksWrapper, loginLink };
}
document.addEventListener("DOMContentLoaded", () => {
    const orbEl = document.getElementById("orb");
    const accountButton = document.getElementById("account-button");
    if (!orbEl) {
        throw new Error("Missing #orb element for center orb sizing.");
    }
    if (!accountButton) {
        throw new Error("Missing #account-button element for center orb link.");
    }
    const userName = getUserName();
    if (userName) {
        const displayName = userName.trim().replace(/\s+/g, " ");
        const accountLink = buildPrimaryOrbLink("", "/accounts/settings/", `Open account settings for ${displayName}`);
        accountLink.style.lineHeight = "1.15";
        accountLink.style.overflowWrap = "anywhere";
        accountButton.replaceChildren(accountLink);
        sizeOrbToLabel(orbEl, accountLink, displayName);
        window.addEventListener("resize", () => {
            sizeOrbToLabel(orbEl, accountLink, displayName);
        });
    }
    else {
        const { linksWrapper, loginLink } = buildGuestAuthLinks();
        accountButton.replaceChildren(linksWrapper);
        sizeOrbToLines(orbEl, loginLink, ["Log In", "Sign Up"]);
        window.addEventListener("resize", () => {
            sizeOrbToLines(orbEl, loginLink, ["Log In", "Sign Up"]);
        });
    }
});
//# sourceMappingURL=centerOrb.js.map