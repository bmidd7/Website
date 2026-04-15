# views.py
import json
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from .ai import LMStudioError, chat, get_active_model
from django.shortcuts import render

SYSTEM_PROMPT = (
    "You are a helpful assistant inside a local website chat powered by LM Studio. "
    "Be clear, concise, and practical."
)


def _normalize_history_message(message: object) -> dict[str, str] | None:
    if not isinstance(message, dict):
        return None

    role = str(message.get("role", "")).strip().lower()
    content = str(message.get("content", "")).strip()

    if role not in {"user", "assistant"} or not content:
        return None

    return {
        "role": role,
        "content": content,
    }


def _build_messages(body: dict) -> list[dict[str, str]] | None:
    history = body.get("messages")
    if isinstance(history, list):
        normalized_history: list[dict[str, str]] = []
        for message in history:
            normalized_message = _normalize_history_message(message)
            if normalized_message is None:
                return None
            normalized_history.append(normalized_message)

        if normalized_history:
            return [
                {"role": "system", "content": SYSTEM_PROMPT},
                *normalized_history,
            ]

    user_message = str(body.get("message", "")).strip()
    if not user_message:
        return None

    return [
        {"role": "system", "content": SYSTEM_PROMPT},
        {"role": "user", "content": user_message},
    ]


def _chat_response(request):
    try:
        body = json.loads(request.body or "{}")
    except json.JSONDecodeError:
        return JsonResponse({"error": "Invalid JSON payload."}, status=400)

    messages = _build_messages(body)
    if messages is None:
        return JsonResponse(
            {
                "error": (
                    "Provide either a non-empty message or a non-empty list of valid "
                    "user/assistant messages."
                )
            },
            status=400,
        )

    try:
        result = chat(messages)
    except LMStudioError as exc:
        return JsonResponse({"error": str(exc)}, status=502)

    return JsonResponse(result)


@csrf_exempt
def DefaultAI(request):
    if request.method == "GET":
        return render(request, "AI/index.html")

    if request.method == "POST":
        return _chat_response(request)

    return JsonResponse({"error": "GET or POST only"}, status=405)


@csrf_exempt
def chat_api(request):
    if request.method != "POST":
        return JsonResponse({"error": "POST only"}, status=405)

    return _chat_response(request)


def model_info(request):
    if request.method != "GET":
        return JsonResponse({"error": "GET only"}, status=405)

    try:
        model_name = get_active_model()
    except LMStudioError as exc:
        return JsonResponse({"error": str(exc)}, status=502)

    return JsonResponse({"model": model_name})
