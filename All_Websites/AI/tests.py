import json
from unittest.mock import patch

from django.test import TestCase
from django.urls import reverse


class AIViewsTests(TestCase):
    def test_ai_page_renders(self):
        response = self.client.get(reverse("AI_Hub"))

        self.assertEqual(response.status_code, 200)
        self.assertContains(response, "LM Studio")

    @patch("AI.views.chat", return_value={"reply": "Local answer", "model": "test-model"})
    def test_ai_chat_returns_reply(self, mocked_chat):
        response = self.client.post(
            reverse("AI_chat"),
            data=json.dumps({"message": "Hello"}),
            content_type="application/json",
        )

        self.assertEqual(response.status_code, 200)
        self.assertJSONEqual(response.content, {"reply": "Local answer", "model": "test-model"})
        mocked_chat.assert_called_once()

    @patch("AI.views.chat", return_value={"reply": "History answer", "model": "test-model"})
    def test_ai_chat_accepts_full_history(self, mocked_chat):
        response = self.client.post(
            reverse("AI_chat"),
            data=json.dumps(
                {
                    "messages": [
                        {"role": "user", "content": "First question"},
                        {"role": "assistant", "content": "First answer"},
                        {"role": "user", "content": "Follow-up"},
                    ]
                }
            ),
            content_type="application/json",
        )

        self.assertEqual(response.status_code, 200)
        self.assertJSONEqual(response.content, {"reply": "History answer", "model": "test-model"})
        mocked_chat.assert_called_once_with(
            [
                {
                    "role": "system",
                    "content": (
                        "You are a helpful assistant inside a local website chat powered by LM Studio. "
                        "Be clear, concise, and practical."
                    ),
                },
                {"role": "user", "content": "First question"},
                {"role": "assistant", "content": "First answer"},
                {"role": "user", "content": "Follow-up"},
            ]
        )

    @patch("AI.views.get_active_model", return_value="test-model")
    def test_ai_model_returns_active_model(self, mocked_model):
        response = self.client.get(reverse("AI_model"))

        self.assertEqual(response.status_code, 200)
        self.assertJSONEqual(response.content, {"model": "test-model"})
        mocked_model.assert_called_once()

    def test_ai_chat_requires_message(self):
        response = self.client.post(
            reverse("AI_chat"),
            data=json.dumps({"message": "   "}),
            content_type="application/json",
        )

        self.assertEqual(response.status_code, 400)
        self.assertJSONEqual(
            response.content,
            {
                "error": (
                    "Provide either a non-empty message or a non-empty list of valid "
                    "user/assistant messages."
                )
            },
        )

# Create your tests here.
