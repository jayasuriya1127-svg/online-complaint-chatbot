from flask import Flask, render_template, request, jsonify
from dotenv import load_dotenv
from google import genai
import firebase_admin
from firebase_admin import credentials, firestore
import os
import uuid
from datetime import datetime

# Load environment variables
load_dotenv()

app = Flask(__name__)


# =========================================================
# FIREBASE SETUP
# =========================================================

cred_path = os.path.join(
    os.path.dirname(__file__),
    "firebase",
    "serviceAccountKey.json"
)

db = None

try:
    if os.path.exists(cred_path):

        if not firebase_admin._apps:
            cred = credentials.Certificate(cred_path)
            firebase_admin.initialize_app(cred)

        db = firestore.client()

        print("🔥 Firebase connected successfully")

    else:
        print("⚠️ serviceAccountKey.json not found")

except Exception as e:
    print("❌ Firebase Error:", e)


# =========================================================
# GEMINI SETUP
# =========================================================

gemini_key = os.getenv("GEMINI_API_KEY")

gemini_client = None

if gemini_key:

    try:
        gemini_client = genai.Client(
            api_key=gemini_key
        )

        print("🤖 Gemini connected successfully")

    except Exception as e:
        print("❌ Gemini Error:", e)

else:
    print("⚠️ GEMINI_API_KEY not found")


# =========================================================
# PAGES
# =========================================================

@app.route("/")
def index():
    return render_template("index.html")


@app.route("/login")
def login():
    return render_template("login.html")


@app.route("/register")
def register():
    return render_template("register.html")


@app.route("/dashboard")
def dashboard():
    return render_template("dashboard.html")


@app.route("/complaint")
def complaint():
    return render_template("complaint.html")


@app.route("/admin")
def admin():
    return render_template("admin.html")


# =========================================================
# GEMINI COMPLAINT ANALYSIS
# =========================================================

@app.route("/analyze-complaint", methods=["POST"])
def analyze_complaint():

    try:

        data = request.get_json(silent=True)

        if not data:
            return jsonify({
                "success": False,
                "message": "No data received."
            }), 400

        complaint_text = data.get(
            "complaint",
            ""
        ).strip()

        if not complaint_text:

            return jsonify({
                "success": False,
                "message": "Complaint description is required."
            }), 400

        if not gemini_client:

            return jsonify({
                "success": False,
                "message": "Gemini API is not configured."
            }), 500

        prompt = f"""
You are an AI assistant for an Online Complaint Management System.

Analyze the following complaint.

Complaint:
{complaint_text}

Return the response in this format:

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
            "analysis": response.text
        })

    except Exception as e:

        print("❌ Gemini Error:", e)

        return jsonify({
            "success": False,
            "message": str(e)
        }), 500


# =========================================================
# SUBMIT COMPLAINT
# =========================================================

@app.route("/submit-complaint", methods=["POST"])
def submit_complaint():

    try:

        # Get JSON data
        data = request.get_json(silent=True)

        print("📥 RECEIVED DATA:", data)

        if not data:

            return jsonify({
                "success": False,
                "message": "No complaint data received."
            }), 400


        # Get form values
        name = str(
            data.get("name", "")
        ).strip()

        email = str(
            data.get("email", "")
        ).strip()

        title = str(
            data.get("title", "")
        ).strip()

        description = str(
            data.get("description", "")
        ).strip()

        category = str(
            data.get("category", "")
        ).strip()

        # userId is optional
        user_id = data.get(
            "userId",
            ""
        )


        # Validate required fields
        if not all([
            name,
            email,
            title,
            description,
            category
        ]):

            return jsonify({
                "success": False,
                "message": "Please fill all required fields."
            }), 400


        # Check Firebase
        if db is None:

            return jsonify({
                "success": False,
                "message": "Firebase database is not connected."
            }), 500


        # Generate complaint ID
        complaint_id = (
            "CMP-" +
            str(uuid.uuid4())[:8].upper()
        )


        # Complaint data
        complaint_data = {

            "complaintId": complaint_id,

            "userId": user_id,

            "name": name,

            "email": email,

            "title": title,

            "description": description,

            "category": category,

            "status": "Pending",

            "createdAt":
                datetime.now().isoformat(),

            "updatedAt":
                datetime.now().isoformat()

        }


        # Save to Firestore
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


        # Success response
        return jsonify({

            "success": True,

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

            "success": False,

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
                "success": False,
                "complaints": []
            }), 500


        complaints = []

        docs = db.collection(
            "complaints"
        ).stream()


        for doc in docs:

            complaint_data = doc.to_dict()

            complaints.append(
                complaint_data
            )


        return jsonify({

            "success": True,

            "complaints": complaints

        })


    except Exception as e:

        print(
            "❌ Fetch Error:",
            e
        )

        return jsonify({

            "success": False,

            "complaints": [],

            "error": str(e)

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
                "success": False,
                "message": "No data received."
            }), 400


        complaint_id = data.get(
            "complaintId"
        )

        status = data.get(
            "status"
        )


        if not complaint_id or not status:

            return jsonify({
                "success": False,
                "message":
                    "Complaint ID and status are required."
            }), 400


        if db is None:

            return jsonify({
                "success": False,
                "message":
                    "Firebase database is not connected."
            }), 500


        db.collection(
            "complaints"
        ).document(
            complaint_id
        ).update({

            "status": status,

            "updatedAt":
                datetime.now().isoformat()

        })


        return jsonify({

            "success": True,

            "message":
                "Complaint status updated."

        })


    except Exception as e:

        print(
            "❌ Status Update Error:",
            e
        )

        return jsonify({

            "success": False,

            "message": str(e)

        }), 500


# =========================================================
# RUN SERVER
# =========================================================

if __name__ == "__main__":

    print("")
    print("====================================")
    print("🚀 Online Complaint Management System")
    print("🤖 Gemini AI Enabled")
    print("🔥 Firebase Enabled")
    print("====================================")
    print("")

    app.run(
        debug=True,
        host="0.0.0.0",
        port=5000
    )