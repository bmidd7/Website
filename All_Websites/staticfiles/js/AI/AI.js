const chatForm = document.getElementById("chat-form");
const chatInput = document.getElementById("chat-input");
const chatLog = document.getElementById("chat-log");
const chatSubmit = document.getElementById("chat-submit");
const clearHistoryButton = document.getElementById("clear-history");
const STORAGE_KEY = "ai-studio-chat-history-v1";
const FALLBACK_MESSAGE = {
    role: "assistant",
    text: "Ask me anything once LM Studio is running with a model loaded.",
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
const requiredChatSubmit = requireElement(chatSubmit, "Missing #chat-submit.");
const requiredClearHistoryButton = requireElement(clearHistoryButton, "Missing #clear-history.");
function escapeHtml(text) {
    return text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/\"/g, "&quot;")
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
function setRawText(element, text) {
    element.setAttribute("data-raw-text", text);
}
function getRawText(element) {
    return element.getAttribute("data-raw-text") || "";
}
function setMessageFlags(element, options) {
    element.dataset.saveToHistory = String(options.saveToHistory);
    element.dataset.includeInConversation = String(options.includeInConversation);
    element.dataset.editable = String(options.editable);
}
function resizeEditor(textarea, maxHeight = 320) {
    textarea.style.height = "auto";
    const nextHeight = Math.min(textarea.scrollHeight, maxHeight);
    textarea.style.height = `${nextHeight}px`;
    textarea.style.overflowY = textarea.scrollHeight > maxHeight ? "auto" : "hidden";
}
function createActionButton(label, className) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = className;
    if (className === "message-edit-button") {
        button.innerHTML = "&#9998;";
        button.setAttribute("aria-label", label);
        button.title = label;
    }
    else {
        button.textContent = label;
    }
    return button;
}
function updateEditButtonsDisabledState() {
    const isBusy = requiredChatSubmit.disabled;
    requiredChatLog.querySelectorAll(".message-edit-button").forEach((button) => {
        button.disabled = isBusy;
    });
}
function removeMessagesAfter(messageElement) {
    let nextMessage = messageElement.nextElementSibling;
    let removedAny = false;
    while (nextMessage) {
        const current = nextMessage;
        nextMessage = current.nextElementSibling;
        current.remove();
        removedAny = true;
    }
    return removedAny;
}
function renderMessageActions(messageElement) {
    let actions = messageElement.querySelector(".message-actions");
    if (!actions) {
        actions = document.createElement("div");
        actions.className = "message-actions";
        messageElement.appendChild(actions);
    }
    actions.replaceChildren();
    if (messageElement.dataset.editable !== "true") {
        return;
    }
    const editButton = createActionButton("Edit", "message-edit-button");
    editButton.disabled = requiredChatSubmit.disabled;
    editButton.addEventListener("click", () => {
        startEditingMessage(messageElement);
    });
    actions.appendChild(editButton);
}
function finishEditingMessage(messageElement, nextText, originalText, editingActions) {
    const body = messageElement.querySelector(".message-body");
    if (!body) {
        return;
    }
    const trimmedText = nextText.trim();
    if (!trimmedText) {
        return;
    }
    removeMessagesAfter(messageElement);
    setRawText(messageElement, trimmedText);
    body.innerHTML = renderRichText(trimmedText);
    editingActions.remove();
    messageElement.classList.remove("editing");
    renderMessageActions(messageElement);
    saveStoredMessages();
    requiredChatLog.scrollTop = messageElement.offsetTop;
}
function cancelEditingMessage(messageElement, editingActions) {
    const body = messageElement.querySelector(".message-body");
    if (!body) {
        return;
    }
    body.innerHTML = renderRichText(getRawText(messageElement));
    editingActions.remove();
    messageElement.classList.remove("editing");
    renderMessageActions(messageElement);
}
function startEditingMessage(messageElement) {
    if (messageElement.dataset.editable !== "true" || requiredChatSubmit.disabled) {
        return;
    }
    const existingEditor = requiredChatLog.querySelector(".message.editing");
    if (existingEditor && existingEditor !== messageElement) {
        const cancelButton = existingEditor.querySelector(".message-cancel-button");
        cancelButton?.click();
    }
    const body = messageElement.querySelector(".message-body");
    const actions = messageElement.querySelector(".message-actions");
    if (!body || !actions || messageElement.classList.contains("editing")) {
        return;
    }
    const originalText = getRawText(messageElement);
    const editor = document.createElement("textarea");
    editor.className = "message-editor";
    editor.value = originalText;
    body.innerHTML = "";
    body.appendChild(editor);
    resizeEditor(editor);
    const editingActions = document.createElement("div");
    editingActions.className = "message-edit-actions";
    const saveButton = createActionButton("Save", "message-save-button");
    const cancelButton = createActionButton("Cancel", "message-cancel-button");
    saveButton.addEventListener("click", () => {
        finishEditingMessage(messageElement, editor.value, originalText, editingActions);
    });
    cancelButton.addEventListener("click", () => {
        cancelEditingMessage(messageElement, editingActions);
    });
    editor.addEventListener("input", () => {
        resizeEditor(editor);
    });
    editor.addEventListener("keydown", (event) => {
        if (event.key === "Escape") {
            event.preventDefault();
            cancelButton.click();
        }
        if (event.key === "Enter" && event.ctrlKey && !event.shiftKey) {
            event.preventDefault();
            saveButton.click();
        }
    });
    editingActions.append(saveButton, cancelButton);
    actions.replaceChildren(editingActions);
    messageElement.classList.add("editing");
    editor.focus();
    editor.selectionStart = editor.value.length;
    editor.selectionEnd = editor.value.length;
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
                typeof candidate.text === "string");
        });
    }
    catch (error) {
        return [];
    }
}
function saveStoredMessages() {
    const messages = Array.from(requiredChatLog.querySelectorAll('.message[data-save-to-history="true"]')).map((message) => {
        const role = message.classList.contains("user") ? "user" : "assistant";
        const text = getRawText(message);
        return { role, text };
    });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
}
function removeFallbackMessage() {
    requiredChatLog
        .querySelectorAll('.message[data-fallback="true"]')
        .forEach((message) => message.remove());
}
function appendMessage(role, text, extraClass = "", options = {}) {
    const persist = options.persist ?? true;
    const saveToHistory = options.saveToHistory ?? true;
    const includeInConversation = options.includeInConversation ?? true;
    const editable = options.editable ?? saveToHistory;
    const isFallback = options.isFallback ?? false;
    const wrapper = document.createElement("article");
    wrapper.className = `message ${role}${extraClass ? ` ${extraClass}` : ""}`;
    setRawText(wrapper, text);
    setMessageFlags(wrapper, {
        saveToHistory,
        includeInConversation,
        editable,
    });
    if (isFallback) {
        wrapper.dataset.fallback = "true";
    }
    const label = document.createElement("p");
    label.className = "message-label";
    label.textContent = role === "user" ? "You" : extraClass === "error" ? "Error" : "Assistant";
    const body = document.createElement("div");
    body.className = "message-body";
    body.innerHTML = renderRichText(text);
    wrapper.append(label, body);
    renderMessageActions(wrapper);
    requiredChatLog.appendChild(wrapper);
    requiredChatLog.scrollTop = requiredChatLog.scrollHeight;
    if (persist) {
        saveStoredMessages();
    }
    return wrapper;
}
function getConversationMessages() {
    return Array.from(requiredChatLog.querySelectorAll('.message[data-include-in-conversation="true"]')).map((message) => ({
        role: message.classList.contains("user") ? "user" : "assistant",
        content: getRawText(message),
    }));
}
function restoreStoredMessages() {
    const messages = readStoredMessages();
    requiredChatLog.innerHTML = "";
    if (!messages.length) {
        appendMessage(FALLBACK_MESSAGE.role, FALLBACK_MESSAGE.text, "", {
            persist: false,
            saveToHistory: false,
            includeInConversation: false,
            editable: false,
            isFallback: true,
        });
        return;
    }
    messages.forEach((message) => {
        appendMessage(message.role, message.text, "", {
            editable: true,
        });
    });
}
function clearStoredMessages() {
    localStorage.removeItem(STORAGE_KEY);
    requiredChatLog.innerHTML = "";
    appendMessage(FALLBACK_MESSAGE.role, FALLBACK_MESSAGE.text, "", {
        persist: false,
        saveToHistory: false,
        includeInConversation: false,
        editable: false,
        isFallback: true,
    });
}
async function parseJsonResponse(response) {
    return (await response.json());
}
function setBusy(isBusy) {
    requiredChatSubmit.disabled = isBusy;
    requiredChatInput.disabled = isBusy;
    updateEditButtonsDisabledState();
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
        return;
    }
    removeFallbackMessage();
    appendMessage("user", message, "", { editable: true });
    requiredChatInput.value = "";
    resizeChatInput();
    setBusy(true);
    const pendingMessage = appendMessage("assistant", "Thinking...", "", {
        persist: false,
        saveToHistory: false,
        includeInConversation: false,
        editable: false,
    });
    try {
        const response = await fetch("/AI/chat/", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ messages: getConversationMessages() }),
        });
        const data = await parseJsonResponse(response);
        if (!response.ok) {
            throw new Error(data.error || "Something went wrong while contacting LM Studio.");
        }
        setRawText(pendingMessage, data.reply);
        setMessageFlags(pendingMessage, {
            saveToHistory: true,
            includeInConversation: true,
            editable: true,
        });
        const body = pendingMessage.querySelector(".message-body");
        if (!body) {
            throw new Error("Missing pending message body.");
        }
        body.innerHTML = renderRichText(data.reply);
        renderMessageActions(pendingMessage);
        saveStoredMessages();
    }
    catch (error) {
        pendingMessage.remove();
        const messageText = error instanceof Error ? error.message : "LM Studio request failed.";
        appendMessage("assistant", messageText, "error", {
            persist: false,
            saveToHistory: false,
            includeInConversation: false,
            editable: false,
        });
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
updateEditButtonsDisabledState();
//# sourceMappingURL=AI.js.map