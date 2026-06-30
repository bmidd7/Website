import json
from unittest.mock import patch

from django.conf import settings
from django.test import TestCase


class AIAPITests(TestCase):
    def test_ai_chat_returns_reply(self):
        with patch("AI.views.chat", return_value={"reply": "Hello!", "model": "test-model"}):
            response = self.client.post(
                "/ai/chat/",
                data=json.dumps({"message": "Hello"}),
                content_type="application/json",
                HTTP_HOST=settings.API_SITE_HOST,
            )

        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("reply", data)
        self.assertIsInstance(data["reply"], str)
        self.assertTrue(len(data["reply"]) > 0)

    def test_ai_chat_accepts_full_history(self):
        payload = {
            "messages": [
                {"role": "user", "content": "First question"},
                {"role": "assistant", "content": "First answer"},
                {"role": "user", "content": "Follow-up question"},
            ]
        }

        with patch("AI.views.chat", return_value={"reply": "ok", "model": "test-model"}):
            response = self.client.post(
                "/ai/chat/",
                data=json.dumps(payload),
                content_type="application/json",
                HTTP_HOST=settings.API_SITE_HOST,
            )

        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("reply", data)

    def test_model_info_returns_model_name(self):
        with patch("AI.views.get_active_model", return_value="test-model"):
            response = self.client.get("/ai/model/", HTTP_HOST=settings.API_SITE_HOST)

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json().get("model"), "test-model")

