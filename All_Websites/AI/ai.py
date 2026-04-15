import json
import os
from urllib import error, request


class LMStudioError(RuntimeError):
    pass


def _get_base_url() -> str:
    return os.environ.get("LM_STUDIO_BASE_URL", "http://127.0.0.1:1234/v1").rstrip("/")


def _get_headers() -> dict[str, str]:
    api_key = os.environ.get("LM_STUDIO_API_KEY", "lm-studio")
    return {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
    }


def _make_request(method: str, path: str, payload: dict | None = None) -> dict:
    body = None
    if payload is not None:
        body = json.dumps(payload).encode("utf-8")

    req = request.Request(
        url=f"{_get_base_url()}{path}",
        data=body,
        headers=_get_headers(),
        method=method,
    )

    timeout = float(os.environ.get("LM_STUDIO_TIMEOUT", "120"))

    try:
        with request.urlopen(req, timeout=timeout) as response:
            raw = response.read().decode("utf-8")
    except error.HTTPError as exc:
        details = exc.read().decode("utf-8", errors="replace").strip()
        raise LMStudioError(
            f"LM Studio returned HTTP {exc.code}. {details or 'Check the server logs in LM Studio.'}"
        ) from exc
    except error.URLError as exc:
        raise LMStudioError(
            f"Could not connect to LM Studio at {_get_base_url()}. "
            "Start the local server in LM Studio and try again."
        ) from exc

    if not raw:
        return {}

    try:
        return json.loads(raw)
    except json.JSONDecodeError as exc:
        raise LMStudioError("LM Studio returned invalid JSON.") from exc


def _get_model_name() -> str:
    configured_model = os.environ.get("LM_STUDIO_MODEL", "").strip()
    if configured_model:
        return configured_model

    response = _make_request("GET", "/models")
    models = response.get("data", [])

    if not models:
        raise LMStudioError(
            "No model is currently loaded in LM Studio. Load a model or set LM_STUDIO_MODEL."
        )

    model_name = models[0].get("id", "").strip()
    if not model_name:
        raise LMStudioError("LM Studio did not return a usable model id.")

    return model_name


def get_active_model() -> str:
    return _get_model_name()


def _extract_text(content: object) -> str:
    if isinstance(content, str):
        return content.strip()

    if isinstance(content, list):
        text_parts: list[str] = []
        for item in content:
            if isinstance(item, dict) and item.get("type") == "text":
                text_parts.append(str(item.get("text", "")))
        return "".join(text_parts).strip()

    return str(content).strip()


def chat(messages: list[dict]) -> dict[str, str]:
    model_name = _get_model_name()
    response = _make_request(
        "POST",
        "/chat/completions",
        {
            "model": model_name,
            "messages": messages,
        },
    )

    choices = response.get("choices", [])
    if not choices:
        raise LMStudioError("LM Studio returned no chat choices.")

    message = choices[0].get("message", {})
    reply = _extract_text(message.get("content", ""))

    if not reply:
        raise LMStudioError("LM Studio returned an empty reply.")

    return {
        "reply": reply,
        "model": model_name,
    }
