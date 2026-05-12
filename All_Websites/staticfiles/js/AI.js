const chatForm = document.getElementById("chat-form");
const chatInput = document.getElementById("chat-input");
const chatLog = document.getElementById("chat-log");
const chatStatus = document.getElementById("chat-status");
const chatModel = document.getElementById("chat-model");
const heroModelNote = document.getElementById("hero-model-note");
const chatSubmit = document.getElementById("chat-submit");
const clearHistoryButton = document.getElementById("clear-history");
const STORAGE_KEY = "ai-studio-chat-history-v1";
const FALLBACK_MESSAGE = {
    role: "assistant",
    text: "Ask me anything once LM Studio is running with a model loaded.",
    extraClass: "",
};
function requireElement(element, message) {
    if (!element) {
        throw new Error(message);
    }
    return element;
}
const requiredChatForm = requireElement(chatForm, "Missing #chat-form.");
const requiredChatInput = requireElement(chatInput, "Missing #chat-input.");
const requiredChatLog = requireElement(chatLog, "Missing #chat-log.");
const requiredChatStatus = requireElement(chatStatus, "Missing #chat-status.");
const requiredChatModel = requireElement(chatModel, "Missing #chat-model.");
const requiredHeroModelNote = requireElement(heroModelNote, "Missing #hero-model-note.");
const requiredChatSubmit = requireElement(chatSubmit, "Missing #chat-submit.");
const requiredClearHistoryButton = requireElement(clearHistoryButton, "Missing #clear-history.");
function escapeHtml(text) {
    return text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}
function renderInline(text) {
    let rendered = escapeHtml(text);
    rendered = rendered.replace(/`([^`]+)`/g, "<code>$1</code>");
    rendered = rendered.replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, '<a href="$2" target="_blank" rel="noreferrer noopener">$1</a>');
    rendered = rendered.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
    rendered = rendered.replace(/\*([^*]+)\*/g, "<em>$1</em>");
    return rendered;
}
function renderRichText(text) {
    const blocks = text.split(/```/);
    return blocks
        .map((block, index) => {
        if (index % 2 === 1) {
            let code = block.replace(/^\r?\n/, "");
            let language = "";
            const firstNewline = code.indexOf("\n");
            if (firstNewline !== -1) {
                const firstLine = code.slice(0, firstNewline).trim();
                if (/^[A-Za-z0-9_+#.-]+$/.test(firstLine)) {
                    language = firstLine;
                    code = code.slice(firstNewline + 1);
                }
            }
            return `<pre><code${language ? ` data-language="${escapeHtml(language)}"` : ""}>${escapeHtml(code.trimEnd())}</code></pre>`;
        }
        const trimmedBlock = block.trim();
        if (!trimmedBlock) {
            return "";
        }
        return trimmedBlock
            .split(/\n\s*\n/)
            .filter(Boolean)
            .map((section) => {
            const lines = section.split("\n");
            if (lines.every((line) => /^\s*[-*]\s+/.test(line))) {
                const items = lines
                    .map((line) => line.replace(/^\s*[-*]\s+/, ""))
                    .map((line) => `<li>${renderInline(line)}</li>`)
                    .join("");
                return `<ul>${items}</ul>`;
            }
            if (lines.every((line) => /^\s*\d+\.\s+/.test(line))) {
                const items = lines
                    .map((line) => line.replace(/^\s*\d+\.\s+/, ""))
                    .map((line) => `<li>${renderInline(line)}</li>`)
                    .join("");
                return `<ol>${items}</ol>`;
            }
            if (lines.every((line) => /^\s*>\s?/.test(line))) {
                const quoted = lines
                    .map((line) => line.replace(/^\s*>\s?/, ""))
                    .map((line) => renderInline(line))
                    .join("<br>");
                return `<blockquote>${quoted}</blockquote>`;
            }
            return `<p>${lines.map((line) => renderInline(line)).join("<br>")}</p>`;
        })
            .join("");
    })
        .join("");
}
function updateModelLabels(modelName) {
    const label = modelName || "unknown";
    requiredChatModel.textContent = `Model: ${label}`;
    requiredHeroModelNote.innerHTML = `Model: <code>${escapeHtml(label)}</code>`;
}
function readStoredMessages() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) {
            return [];
        }
        const parsed = JSON.parse(raw);
        if (!Array.isArray(parsed)) {
            return [];
        }
        return parsed.filter((item) => {
            if (!item || typeof item !== "object") {
                return false;
            }
            const candidate = item;
            return ((candidate.role === "assistant" || candidate.role === "user") &&
                typeof candidate.text === "string" &&
                typeof candidate.extraClass === "string");
        });
    }
    catch (error) {
        return [];
    }
}
function saveStoredMessages() {
    const messages = Array.from(requiredChatLog.querySelectorAll(".message")).map((message) => {
        const role = message.classList.contains("user") ? "user" : "assistant";
        const extraClass = message.classList.contains("error") ? "error" : "";
        const text = message.getAttribute("data-raw-text") || "";
        return { role, text, extraClass };
    });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
}
function setRawText(element, text) {
    element.setAttribute("data-raw-text", text);
}
function appendMessage(role, text, extraClass = "", options = {}) {
    const persist = options.persist ?? true;
    const wrapper = document.createElement("article");
    wrapper.className = `message ${role}${extraClass ? ` ${extraClass}` : ""}`;
    setRawText(wrapper, text);
    const label = document.createElement("p");
    label.className = "message-label";
    label.textContent = role === "user" ? "You" : extraClass === "error" ? "Error" : "Assistant";
    const body = document.createElement("div");
    body.className = "message-body";
    body.innerHTML = renderRichText(text);
    wrapper.append(label, body);
    requiredChatLog.appendChild(wrapper);
    requiredChatLog.scrollTop = requiredChatLog.scrollHeight;
    if (persist) {
        saveStoredMessages();
    }
    return wrapper;
}
function restoreStoredMessages() {
    const messages = readStoredMessages();
    requiredChatLog.innerHTML = "";
    if (!messages.length) {
        appendMessage(FALLBACK_MESSAGE.role, FALLBACK_MESSAGE.text, FALLBACK_MESSAGE.extraClass);
        return;
    }
    messages.forEach((message) => {
        appendMessage(message.role, message.text, message.extraClass);
    });
}
function clearStoredMessages() {
    localStorage.removeItem(STORAGE_KEY);
    requiredChatLog.innerHTML = "";
    appendMessage(FALLBACK_MESSAGE.role, FALLBACK_MESSAGE.text, FALLBACK_MESSAGE.extraClass);
    requiredChatStatus.textContent = "Local history cleared.";
}
async function parseJsonResponse(response) {
    return (await response.json());
}
async function loadActiveModel() {
    try {
        const response = await fetch("/AI/model/");
        const data = await parseJsonResponse(response);
        if (!response.ok) {
            throw new Error(data.error || "Could not fetch active model.");
        }
        updateModelLabels(data.model);
    }
    catch (error) {
        requiredHeroModelNote.textContent = "Model: unavailable until LM Studio responds";
    }
}
function setBusy(isBusy) {
    requiredChatSubmit.disabled = isBusy;
    requiredChatInput.disabled = isBusy;
    requiredChatStatus.textContent = isBusy
        ? "Waiting for LM Studio..."
        : "Ready when you are.";
}
function resizeChatInput() {
    requiredChatInput.style.height = "auto";
    const computed = window.getComputedStyle(requiredChatInput);
    const borderTop = Number.parseFloat(computed.borderTopWidth) || 0;
    const borderBottom = Number.parseFloat(computed.borderBottomWidth) || 0;
    const maxHeight = Math.min(window.innerHeight * 0.3, 260);
    const nextHeight = Math.min(requiredChatInput.scrollHeight + borderTop + borderBottom, maxHeight);
    requiredChatInput.style.height = `${nextHeight}px`;
    requiredChatInput.style.overflowY =
        requiredChatInput.scrollHeight + borderTop + borderBottom > maxHeight ? "auto" : "hidden";
}
async function submitMessage() {
    const message = requiredChatInput.value.trim();
    if (!message) {
        requiredChatStatus.textContent = "Type a message first.";
        return;
    }
    appendMessage("user", message);
    requiredChatInput.value = "";
    resizeChatInput();
    setBusy(true);
    const pendingMessage = appendMessage("assistant", "Thinking...", "", { persist: false });
    try {
        const response = await fetch("/AI/chat/", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ message }),
        });
        const data = await parseJsonResponse(response);
        if (!response.ok) {
            throw new Error(data.error || "Something went wrong while contacting LM Studio.");
        }
        setRawText(pendingMessage, data.reply);
        const body = pendingMessage.querySelector(".message-body");
        if (!body) {
            throw new Error("Missing pending message body.");
        }
        body.innerHTML = renderRichText(data.reply);
        updateModelLabels(data.model);
        saveStoredMessages();
        requiredChatStatus.textContent = "Reply received.";
    }
    catch (error) {
        pendingMessage.remove();
        const messageText = error instanceof Error ? error.message : "LM Studio request failed.";
        appendMessage("assistant", messageText, "error");
        requiredChatStatus.textContent = "LM Studio request failed.";
    }
    finally {
        setBusy(false);
        requiredChatInput.focus();
    }
}
requiredChatForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    await submitMessage();
});
requiredChatInput.addEventListener("keydown", async (event) => {
    if (event.key === "Enter" && event.ctrlKey && !event.shiftKey) {
        event.preventDefault();
        if (!requiredChatSubmit.disabled) {
            await submitMessage();
        }
    }
});
requiredChatInput.addEventListener("input", () => {
    resizeChatInput();
});
window.addEventListener("resize", () => {
    resizeChatInput();
});
requiredClearHistoryButton.addEventListener("click", () => {
    clearStoredMessages();
    requiredChatInput.focus();
});
restoreStoredMessages();
resizeChatInput();
loadActiveModel();
//# sourceMappingURL=AI.js.map