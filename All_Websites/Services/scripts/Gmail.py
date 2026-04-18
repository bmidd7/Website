import json
import base64
from typing import TypedDict
from Services.models import GmailSettings
from googleapiclient.discovery import build
from google.oauth2.credentials import Credentials


class DataJSON(TypedDict):
    emailAddress: str
    historyId: str

class MessageJSON(TypedDict):
    data: str
    messageId: str

class PubSubJSON(TypedDict):
    message: MessageJSON
    subscription: str


def processMessage(message):
    pass

def getCreds(clients_email:str, settings_row:GmailSettings):
    token = settings_row.token_JSON
    refresh_token = settings_row.refresh_token
    if token:
        creds = Credentials.from_authorized_user_info(
            json.loads(token),
            scopes=["https://www.googleapis.com/auth/gmail.readonly"],
        )
    else:
        creds = Credentials(
        token=None,
        refresh_token=refresh_token,
        token_uri="https://oauth2.googleapis.com/token",
        client_id="YOUR_CLIENT_ID",
        client_secret="YOUR_CLIENT_SECRET",
        scopes=["https://www.googleapis.com/auth/gmail.readonly"],
        )
    return creds

def extract_message_ids(history):
    message_IDs = []

    for record in history.get("history", []):
        for added in record.get("messagesAdded", []):
            message_IDs.append(added["message"]["id"])
    return message_IDs


def PubSubMessage(raw_message):

    messages:list = []

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

    body:PubSubJSON = json.loads(raw_message)
    data64:str = body.get("message", {}).get("data")

    if not data64:
        return
    
    decoded:str = base64.b64decode(data64).decode("utf-8")
    real_data:DataJSON = json.loads(decoded)

    clients_email:str = real_data.get("emailAddress")
    history_ID:str = real_data.get("historyId")


    GMAIL_SETTINGS:GmailSettings = GmailSettings.objects.get(email_address=clients_email)
    creds = getCreds(clients_email, GMAIL_SETTINGS)


    service = build("gmail", "v1", credentials=creds)

    history = (
        service.users()
        .history()
        .list(
            userId="me",
            startHistoryId=history_ID,
            historyTypes = ["messageAdded"]
        ).execute()
    )
    
    message_ids = extract_message_ids(history)


    for messageID in message_ids:
        message = (
            service.users()
            .messages()
            .get(
                userID = "me",
                id=messageID,
                format = "full"
            ).execute()
        )
        messages.append(message)

    
    for message in messages:
        processMessage(message)
    
    return messages