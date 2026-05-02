import re
import json
import base64
import tldextract
from typing import Optional
from dataclasses import dataclass

# {
#   "id": "18f5d0a1b2c3d4e5",
#   "threadId": "18f5d0a1b2c3d4e5",
#   "labelIds": ["INBOX", "UNREAD"],
#   "snippet": "This is the short preview text you see in your inbox...",
#   "payload": {
#     "partId": "",
#     "mimeType": "multipart/alternative",
#     "headers": [
#       { "name": "Delivered-To", "value": "..." },
#       { "name": "From", "value": "John Doe <john@example.com>" },
#       { "name": "Subject", "value": "Hello" }
#     "body": { "size": 0 },
#     "parts": [
#       {
#         "partId": "0",
#         "mimeType": "text/plain",
#         "body": {
#           "size": 25,
#           "data": "SGVsbG8sIHRoaXMgaXMgcGxhaW4gdGV4dCE="
#         }
#       },
#       {
#         "partId": "1",
#         "mimeType": "text/html",
#         "body": {
#           "size": 48,
#           "data": "PGI+SGVsbG8sIHRoaXMgaXMgSFRNTCBjb250ZW50ITwvYj4="
#         }
#       }
#     ]
#   },
#   "sizeEstimate": 1500
# }

horribely_failed_emails: list[str] = []

@dataclass
class EmailDomain:
    mail_server: str
    TLD: str

@dataclass
class Email:
    local_part: str
    tag: str | None
    domain: EmailDomain

def getSenderEmail(message) -> Email:
    headers: list[dict[str, str]] = message["payload"].get("headers", [])

    sender_email: Optional[str] = None


    for header in headers:
        if header["name"].lower() == "from":
            value = header["value"]

            if "<" in value and ">" in value:
                sender_email = value.split("<")[1].split(">")[0].strip()
            else:
                sender_email = value.strip()
            break

    if sender_email is None:
        horribely_failed_emails.append(message.get("id"))
        raise ValueError("No From header found")


    local_part, domain = sender_email.split("@", 1)


    if "+" in local_part:
        sender_username, sender_tag = local_part.split("+", 1)
    else:
        sender_username = local_part
        sender_tag = None

    ext = tldextract.extract(domain)

    if ext.subdomain:
        mail_server = f"{ext.subdomain}.{ext.domain}"
    else:
        mail_server = ext.domain

    sender = Email(
        local_part= sender_username,
        tag= sender_tag,
        domain= EmailDomain(
            mail_server=  mail_server,
            TLD= ext.suffix
        )
    )

    return sender


def getBasicData(message):

    ID: str = message['id']
    currentLabels: list[str] = message['labelIds']
    sender: Email = getSenderEmail(message)

    return {
        "ID": ID,
        "appliedLabels" : currentLabels,
        "sender": sender,
    }


def updateLabels(service, message, labels: dict[str, list[str]]):
    data = getBasicData(message)


    label_changes: dict[str, list[str]] = {
        'addLabelIds': labels["add"], 
        'removeLabelIds': labels["remove"]
    }

    service.users().messages().modify(
        userId="me",
        id=data["ID"],
        body=label_changes
    ).execute()