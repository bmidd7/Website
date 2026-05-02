import json
import base64
import logging
import emailmanagement
from typing import TypedDict
from django.conf import settings
from Services.models import GmailSettings
from binascii import Error as BinasciiError
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError
from google.auth.exceptions import RefreshError
from google.oauth2.credentials import Credentials
from google.auth.transport.requests import Request


logger = logging.getLogger(__name__)


class DataJSON(TypedDict):
    emailAddress: str
    historyId: str

class MessageJSON(TypedDict):
    data: str
    messageId: str

class PubSubJSON(TypedDict):
    message: MessageJSON
    subscription: str


def processMessage(message, service):



def getCreds(settings_row:GmailSettings):
    token = settings_row.token_JSON
    refresh_token = settings_row.refresh_token
    creds = None

    if token:
        try:
            creds = Credentials.from_authorized_user_info(
                json.loads(token),
                scopes=["https://www.googleapis.com/auth/gmail.readonly"],
            )
        except (TypeError, ValueError, json.JSONDecodeError) as exc:
            logger.warning("Failed to load Gmail token JSON for %s: %s", settings_row.email_address, exc)
            creds = None
    
    if refresh_token and not creds:
        creds = Credentials(
        token=None,
        refresh_token=refresh_token,
        token_uri="https://oauth2.googleapis.com/token",
        client_id=settings.GOOGLE_CLIENT_ID,
        client_secret=settings.GOOGLE_CLIENT_SECRET,
        scopes=["https://www.googleapis.com/auth/gmail.readonly"],
        )

    if creds and creds.expired and creds.refresh_token:
        try:
            creds.refresh(Request())
            settings_row.token_JSON = creds.to_json()
            settings_row.save(update_fields=["token_JSON"])
        except RefreshError as exc:
            logger.warning("Failed to refresh Gmail credentials for %s: %s", settings_row.email_address, exc)
            return None

        
    return creds

def extract_message_ids(history):
    message_IDs = []

    for record in history.get("history", []):
        for added in record.get("messagesAdded", []):
            message_IDs.append(added["message"]["id"])
    return message_IDs


def PubSubMessage(raw_message):

    messages: list = []

# EXAMPLE 'body'
# {
#   "message": {
#     "data":{
#           "emailAddress": "user@example.com",
#           "historyId": "123456"
#         },
#     "messageId": "2070443601311540",
#     "publishTime": "2026-04-16T20:12:34.123Z"
#   },
#   "subscription": "projects/YOUR_PROJECT/subscriptions/YOUR_SUB"
# }

    try:
        body:PubSubJSON = json.loads(raw_message)
    except (TypeError, json.JSONDecodeError) as exc:
        logger.warning("Invalid Pub/Sub payload: %s", exc)
        return []

    data64:str = body.get("message", {}).get("data")

    if not data64:
        return []

    try:
        decoded:str = base64.urlsafe_b64decode(data64 + "=" * (-len(data64) % 4)).decode("utf-8")
        real_data:DataJSON = json.loads(decoded)
    except (BinasciiError, UnicodeDecodeError, json.JSONDecodeError) as exc:
        logger.warning("Invalid Pub/Sub message data: %s", exc)
        return []

    clients_email:str = real_data.get("emailAddress")
    history_ID:str = real_data.get("historyId")

    if not clients_email or not history_ID:
        logger.warning("Pub/Sub payload missing emailAddress or historyId")
        return []

    try:
        new_history_id = int(history_ID)
    except (TypeError, ValueError):
        logger.warning("Invalid historyId in Pub/Sub payload: %r", history_ID)
        return []

    try:
        GMAIL_SETTINGS:GmailSettings = GmailSettings.objects.get(email_address=clients_email)
    except (GmailSettings.DoesNotExist, GmailSettings.MultipleObjectsReturned) as exc:
        logger.warning("Unable to resolve Gmail settings for %s: %s", clients_email, exc)
        return []

    start_history_id = GMAIL_SETTINGS.last_history_ID

    if not start_history_id:
        GMAIL_SETTINGS.last_history_ID = new_history_id
        GMAIL_SETTINGS.save(update_fields=["last_history_ID"])
        return []

    creds = getCreds(GMAIL_SETTINGS)

    if not creds:
        return []


    service = build("gmail", "v1", credentials=creds)

    try:
        history = (
            service.users()
            .history()
            .list(
                userId="me",
                startHistoryId=start_history_id,
                historyTypes = ["messageAdded"]
            ).execute()
        )
    except HttpError as exc:
        logger.warning("Failed to load Gmail history for %s: %s", clients_email, exc)
        return []
    
    message_ids = extract_message_ids(history)


    for messageID in message_ids:
        try:
            message = (
                service.users()
                .messages()
                .get(
                    userId = "me",
                    id=messageID,
                    format = "full"
                ).execute()
            )
            messages.append(message)
        except HttpError as exc:
            logger.warning("Failed to load Gmail message %s for %s: %s", messageID, clients_email, exc)
            continue

    
    for message in messages:
        processMessage(message, service)

    GMAIL_SETTINGS.last_history_ID = new_history_id
    GMAIL_SETTINGS.save(update_fields=["last_history_ID"])
    
    return messages

def main():
    # PubSubMessage()
    pass