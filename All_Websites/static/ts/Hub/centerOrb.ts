const BASE_ORB_DIAMETER = 80;
const TEXT_FILL_RATIO = 0.85;
const MAX_ORB_VIEWPORT_RATIO = 0.1;
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
  } catch (error) {
    console.warn("Unable to parse #user-data JSON.", error);
    return null;
  }
}

function getCanvasFont(style: CSSStyleDeclaration) {
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

function getLineHeight(style: CSSStyleDeclaration) {
  const parsedLineHeight = Number.parseFloat(style.lineHeight);
  if (Number.isFinite(parsedLineHeight)) {
    return parsedLineHeight;
  }

  const fontSize = Number.parseFloat(style.fontSize);
  return Number.isFinite(fontSize) ? fontSize * 1.2 : 16;
}

function measureTextWidth(text: string, style: CSSStyleDeclaration) {
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

function chunkWord(word: string, maxCharsPerLine: number) {
  const characters = Array.from(word);
  const lines: string[] = [];

  for (let index = 0; index < characters.length; index += maxCharsPerLine) {
    lines.push(characters.slice(index, index + maxCharsPerLine).join(""));
  }

  return lines;
}

function wrapText(text: string, maxCharsPerLine: number) {
  const normalizedText = text.trim().replace(/\s+/g, " ");

  if (!normalizedText || normalizedText.length <= maxCharsPerLine) {
    return [normalizedText];
  }

  const words = normalizedText.split(" ");
  const lines: string[] = [];
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

function getRequiredOrbDiameter(
  lines: string[],
  style: CSSStyleDeclaration,
) {
  const widestLine = lines.reduce((largestWidth, line) => {
    return Math.max(largestWidth, measureTextWidth(line, style));
  }, 0);
  const lineHeight = getLineHeight(style);
  const textBlockHeight = lines.length * lineHeight;
  const textBounds = Math.max(widestLine, textBlockHeight);

  return Math.ceil(textBounds / TEXT_FILL_RATIO);
}

function sizeOrbToLabel(
  orbEl: HTMLDivElement,
  accountButton: HTMLAnchorElement,
  label: string,
) {
  const buttonStyle = window.getComputedStyle(accountButton);
  const maxViewportDiameter =
    Math.min(window.innerWidth, window.innerHeight) * MAX_ORB_VIEWPORT_RATIO;

  let bestLines = [label];
  let bestDiameter = getRequiredOrbDiameter(bestLines, buttonStyle);

  if (bestDiameter > maxViewportDiameter) {
    const characterWidth = Math.max(measureTextWidth("M", buttonStyle), 1);
    const maxCharsPerLine = Math.max(
      1,
      Math.floor((maxViewportDiameter * TEXT_FILL_RATIO) / characterWidth),
    );

    for (let charsPerLine = maxCharsPerLine; charsPerLine >= 1; charsPerLine--) {
      const candidateLines = wrapText(label, charsPerLine);
      const candidateDiameter = getRequiredOrbDiameter(
        candidateLines,
        buttonStyle,
      );

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

  accountButton.textContent = bestLines.join("\n");
  accountButton.style.whiteSpace = bestLines.length > 1 ? "pre-line" : "normal";
  orbEl.style.width = `${Math.max(BASE_ORB_DIAMETER, bestDiameter)}px`;
  orbEl.style.height = `${Math.max(BASE_ORB_DIAMETER, bestDiameter)}px`;
}

document.addEventListener("DOMContentLoaded", () => {
  const orbEl = document.getElementById("orb") as HTMLDivElement | null;
  const accountButton = document.getElementById(
    "account-button",
  ) as HTMLAnchorElement | null;

  if (!orbEl) {
    throw new Error("Missing #orb element for center orb sizing.");
  }

  if (!accountButton) {
    throw new Error("Missing #account-button element for center orb link.");
  }

  accountButton.style.lineHeight = "1.15";
  accountButton.style.overflowWrap = "anywhere";

  const userName = getUserName();

  if (userName) {
    const displayName = userName.trim().replace(/\s+/g, " ");

    console.log("Logged in as:", displayName);
    accountButton.setAttribute(
      "aria-label",
      `Open account settings for ${displayName}`,
    );
    accountButton.href = "/accounts/settings/";
    sizeOrbToLabel(orbEl, accountButton, displayName);
    window.addEventListener("resize", () => {
      sizeOrbToLabel(orbEl, accountButton, displayName);
    });
  } else {
    console.log("No user logged in.");
    accountButton.textContent = "Log In";
    accountButton.setAttribute("aria-label", "Log in");
    accountButton.href = "/accounts/login/?next=/";
  }
});
