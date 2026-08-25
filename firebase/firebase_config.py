import firebase_admin
from firebase_admin import credentials, firestore
import os


BASE_DIR = os.path.dirname(
    os.path.dirname(
        os.path.abspath(__file__)
    )
)


SERVICE_ACCOUNT = os.path.join(
    BASE_DIR,
    "firebase",
    "serviceAccountKey.json"
)


if not firebase_admin._apps:

    cred = credentials.Certificate(
        SERVICE_ACCOUNT
    )

    firebase_admin.initialize_app(cred)


db = firestore.client()