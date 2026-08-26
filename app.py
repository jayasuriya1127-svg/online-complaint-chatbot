from flask import Flask, render_template, request, jsonify
from dotenv import load_dotenv
from google import genai

import firebase_admin
from firebase_admin import credentials, firestore

import os
import uuid
import json
from datetime import datetime


# =========================================================
# LOAD ENVIRONMENT VARIABLES
# =========================================================

load_dotenv()

app = Flask(__name__)


# =========================================================
# FIREBASE SETUP
# =========================================================

db = None

try:

    # -----------------------------------------------------
    # OPTION 1: RENDER ENVIRONMENT VARIABLE
    # -----------------------------------------------------

    firebase_json = os.getenv("FIREBASE_SERVICE_ACCOUNT")

    if firebase_json:

        print("🔐 Firebase Environment Variable found")

        try:

            firebase_config = json.loads(firebase_json)

        except json.JSONDecodeError as e:

            print("❌ FIREBASE_SERVICE_ACCOUNT JSON is invalid")
            print("Error:", repr(e))
            firebase_config = None

        if firebase_config:

            if not firebase_admin._apps:

                cred = credentials.Certificate(
                    firebase_config
                )

                firebase_admin.initialize_app(cred)

            db = firestore.client()

            print(
                "🔥 Firebase connected successfully using Environment Variable"
            )


    # -----------------------------------------------------
    # OPTION 2: LOCAL serviceAccountKey.json
    # -----------------------------------------------------

    else:

        print(
            "⚠️ FIREBASE_SERVICE_ACCOUNT not found."
        )

        cred_path = os.path.join(
            os.path.dirname(__file__),
            "firebase",
            "serviceAccountKey.json"
        )

        if os.path.exists(cred_path):

            if not firebase_admin._apps:

                cred = credentials.Certificate(
                    cred_path
                )

                firebase_admin.initialize_app(
                    cred
                )

            db = firestore.client()

            print(
                "🔥 Firebase connected successfully using local serviceAccountKey.json"
            )

        else:

            print(
                "❌ Firebase credentials not found"
            )


except Exception as e:

    print(
        "❌ Firebase Error:",
        repr(e)
    )


# =========================================================
# GEMINI SETUP
# =========================================================

gemini_key = os.getenv(
    "GEMINI_API_KEY"
)

gemini_client = None


if gemini_key:

    try:

        gemini_client = genai.Client(
            api_key=gemini_key
        )

        print(
            "🤖 Gemini connected successfully"
        )

    except Exception as e:

        print(
            "❌ Gemini Error:",
            repr(e)
        )

else:

    print(
        "⚠️ GEMINI_API_KEY not found"
    )


# =========================================================
# PAGES
# =========================================================

@app.route("/")
def index():

    return render_template(
        "index.html"
    )


@app.route("/login")
def login():

    return render_template(
        "login.html"
    )


@app.route("/register")
def register():

    return render_template(
        "register.html"
    )


@app.route("/dashboard")
def dashboard():

    return render_template(
        "dashboard.html"
    )


@app.route("/complaint")
def complaint():

    return render_template(
        "complaint.html"
    )


@app.route("/admin")
def admin():

    return render_template(
        "admin.html"
    )


# =========================================================
# GEMINI COMPLAINT ANALYSIS
# =========================================================

@app.route(
    "/analyze-complaint",
    methods=["POST"]
)
def analyze_complaint():

    try:

        data = request.get_json(
            silent=True
        )

        if not data:

            return jsonify({

                "success": False,

                "message":
                    "No data received."

            }), 400


        complaint_text = str(
            data.get(
                "complaint",
                ""
            )
        ).strip()


        if not complaint_text:

            return jsonify({

                "success": False,

                "message":
                    "Complaint description is required."

            }), 400


        if not gemini_client:

            return jsonify({

                "success": False,

                "message":
                    "Gemini API is not configured."

            }), 500


        prompt = f"""
You are an AI assistant for an Online Complaint Management System.

Analyze the following complaint.

Complaint:
{complaint_text}

Return the response exactly in this format:

Category: <category>
Priority: <Low/Medium/High>
Summary: <short summary>
Suggested Action: <suggested action>
"""


        response = gemini_client.models.generate_content(

            model="gemini-2.5-flash",

            contents=prompt

        )


        return jsonify({

            "success": True,

            "analysis":
                response.text

        })


    except Exception as e:

        print(
            "❌ Gemini Error:",
            repr(e)
        )

        return jsonify({

            "success": False,

            "message":
                str(e)

        }), 500


# =========================================================
# SUBMIT COMPLAINT
# =========================================================

@app.route(
    "/submit-complaint",
    methods=["POST"]
)
def submit_complaint():

    try:

        data = request.get_json(
            silent=True
        )

        print(
            "📥 RECEIVED DATA:",
            data
        )


        if not data:

            return jsonify({

                "success": False,

                "message":
                    "No complaint data received."

            }), 400


        # -------------------------------------------------
        # GET DATA
        # -------------------------------------------------

        name = str(
            data.get(
                "name",
                ""
            )
        ).strip()


        email = str(
            data.get(
                "email",
                ""
            )
        ).strip()


        title = str(
            data.get(
                "title",
                ""
            )
        ).strip()


        description = str(
            data.get(
                "description",
                ""
            )
        ).strip()


        category = str(
            data.get(
                "category",
                ""
            )
        ).strip()


        user_id = str(
            data.get(
                "userId",
                ""
            )
        ).strip()


        # -------------------------------------------------
        # VALIDATION
        # -------------------------------------------------

        if not all([

            name,
            email,
            title,
            description,
            category

        ]):

            return jsonify({

                "success": False,

                "message":
                    "Please fill all required fields."

            }), 400


        # -------------------------------------------------
        # FIREBASE CHECK
        # -------------------------------------------------

        if db is None:

            print(
                "❌ Firebase database is not connected"
            )

            return jsonify({

                "success": False,

                "message":
                    "Firebase database is not connected."

            }), 500


        # -------------------------------------------------
        # GENERATE COMPLAINT ID
        # -------------------------------------------------

        complaint_id = (

            "CMP-" +

            str(
                uuid.uuid4()
            )[:8].upper()

        )


        now = datetime.now().isoformat()


        # -------------------------------------------------
        # COMPLAINT DATA
        # -------------------------------------------------

        complaint_data = {

            "complaintId":
                complaint_id,

            "userId":
                user_id,

            "name":
                name,

            "email":
                email,

            "title":
                title,

            "description":
                description,

            "category":
                category,

            "status":
                "Pending",

            "createdAt":
                now,

            "updatedAt":
                now

        }


        # -------------------------------------------------
        # SAVE FIRESTORE
        # -------------------------------------------------

        db.collection(
            "complaints"
        ).document(
            complaint_id
        ).set(
            complaint_data
        )


        print(
            "✅ COMPLAINT SAVED:",
            complaint_id
        )


        return jsonify({

            "success":
                True,

            "message":
                "Complaint submitted successfully.",

            "complaintId":
                complaint_id

        }), 200


    except Exception as e:

        print(
            "❌ COMPLAINT ERROR:",
            repr(e)
        )

        return jsonify({

            "success":
                False,

            "message":
                str(e)

        }), 500


# =========================================================
# GET ALL COMPLAINTS
# =========================================================

@app.route(
    "/complaints",
    methods=["GET"]
)
def get_complaints():

    try:

        if db is None:

            return jsonify({

                "success":
                    False,

                "complaints":
                    [],

                "error":
                    "Firebase database is not connected."

            }), 500


        complaints = []


        docs = db.collection(
            "complaints"
        ).stream()


        for document in docs:

            complaint_data = (
                document.to_dict()
            )

            complaints.append(
                complaint_data
            )


        # -------------------------------------------------
        # NEWEST FIRST
        # -------------------------------------------------

        complaints.sort(

            key=lambda x:
                x.get(
                    "createdAt",
                    ""
                ),

            reverse=True

        )


        return jsonify({

            "success":
                True,

            "complaints":
                complaints

        })


    except Exception as e:

        print(
            "❌ Fetch Error:",
            repr(e)
        )

        return jsonify({

            "success":
                False,

            "complaints":
                [],

            "error":
                str(e)

        }), 500


# =========================================================
# UPDATE COMPLAINT STATUS
# =========================================================

@app.route(
    "/update-status",
    methods=["POST"]
)
def update_status():

    try:

        data = request.get_json(
            silent=True
        )


        if not data:

            return jsonify({

                "success":
                    False,

                "message":
                    "No data received."

            }), 400


        complaint_id = str(
            data.get(
                "complaintId",
                ""
            )
        ).strip()


        status = str(
            data.get(
                "status",
                ""
            )
        ).strip()


        if not complaint_id or not status:

            return jsonify({

                "success":
                    False,

                "message":
                    "Complaint ID and status are required."

            }), 400


        if db is None:

            return jsonify({

                "success":
                    False,

                "message":
                    "Firebase database is not connected."

            }), 500


        # -------------------------------------------------
        # CHECK DOCUMENT
        # -------------------------------------------------

        complaint_ref = db.collection(
            "complaints"
        ).document(
            complaint_id
        )


        complaint_doc = complaint_ref.get()


        if not complaint_doc.exists:

            return jsonify({

                "success":
                    False,

                "message":
                    "Complaint not found."

            }), 404


        # -------------------------------------------------
        # UPDATE
        # -------------------------------------------------

        complaint_ref.update({

            "status":
                status,

            "updatedAt":
                datetime.now().isoformat()

        })


        print(
            "✅ STATUS UPDATED:",
            complaint_id,
            status
        )


        return jsonify({

            "success":
                True,

            "message":
                "Complaint status updated."

        })


    except Exception as e:

        print(
            "❌ Status Update Error:",
            repr(e)
        )


        return jsonify({

            "success":
                False,

            "message":
                str(e)

        }), 500


# =========================================================
# DELETE COMPLAINT
# =========================================================

@app.route(
    "/delete-complaint",
    methods=["POST"]
)
def delete_complaint():

    try:

        data = request.get_json(
            silent=True
        )


        if not data:

            return jsonify({

                "success":
                    False,

                "message":
                    "No data received."

            }), 400


        complaint_id = str(
            data.get(
                "complaintId",
                ""
            )
        ).strip()


        if not complaint_id:

            return jsonify({

                "success":
                    False,

                "message":
                    "Complaint ID is required."

            }), 400


        if db is None:

            return jsonify({

                "success":
                    False,

                "message":
                    "Firebase database is not connected."

            }), 500


        # -------------------------------------------------
        # CHECK DOCUMENT
        # -------------------------------------------------

        complaint_ref = db.collection(
            "complaints"
        ).document(
            complaint_id
        )


        complaint_doc = complaint_ref.get()


        if not complaint_doc.exists:

            return jsonify({

                "success":
                    False,

                "message":
                    "Complaint not found."

            }), 404


        # -------------------------------------------------
        # DELETE
        # -------------------------------------------------

        complaint_ref.delete()


        print(
            "🗑️ COMPLAINT DELETED:",
            complaint_id
        )


        return jsonify({

            "success":
                True,

            "message":
                "Complaint deleted successfully."

        })


    except Exception as e:

        print(
            "❌ Delete Error:",
            repr(e)
        )


        return jsonify({

            "success":
                False,

                "message":
                    str(e)

        }), 500


# =========================================================
# HEALTH CHECK
# =========================================================

@app.route(
    "/health",
    methods=["GET"]
)
def health():

    return jsonify({

        "status":
            "running",

        "firebase":
            db is not None,

        "gemini":
            gemini_client is not None

    })


# =========================================================
# FIREBASE TEST
# =========================================================

@app.route(
    "/firebase-test",
    methods=["GET"]
)
def firebase_test():

    try:

        if db is None:

            return jsonify({

                "success":
                    False,

                "message":
                    "Firebase is NOT connected."

            }), 500


        # Just read collection
        docs = db.collection(
            "complaints"
        ).limit(
            1
        ).stream()


        list(docs)


        return jsonify({

            "success":
                True,

            "message":
                "🔥 Firebase Firestore is working correctly."

        })


    except Exception as e:

        print(
            "❌ Firebase Test Error:",
            repr(e)
        )


        return jsonify({

            "success":
                False,

            "message":
                str(e)

        }), 500


# =========================================================
# RUN SERVER
# =========================================================

if __name__ == "__main__":

    print("")
    print("==============================================")
    print("🚀 ONLINE COMPLAINT MANAGEMENT SYSTEM")
    print("==============================================")
    print("🔥 Firebase Enabled")
    print("🤖 Gemini AI Enabled")
    print("==============================================")
    print("")


    app.run(

        host="0.0.0.0",

        port=int(
            os.getenv(
                "PORT",
                5000
            )
        ),

        debug=False

    )
