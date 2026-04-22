from dotenv import load_dotenv
load_dotenv()

from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from db import get_mysql, mongo_db, redis_client
import auth
import profile

app = Flask(__name__, static_folder="../", static_url_path="")
CORS(app)

@app.route("/")
def home():
    return send_from_directory("../", "login.html")

@app.route("/register")
def register_page():
    return send_from_directory("../", "register.html")

@app.route("/profile")
def profile_page():
    return send_from_directory("../", "profile.html")

@app.route("/api/test-db")
def test_db():
    try:
        cursor = get_mysql.cursor()
        cursor.execute("SELECT 1")
        result = cursor.fetchone()
        return jsonify({"success": True, "result": result})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/api/register", methods=["POST"])
def register():
    return auth.register()

@app.route("/api/login", methods=["POST"])
def login():
    return auth.login()

@app.route("/api/profile", methods=["GET"])
def get_profile():
    return profile.get_profile()

@app.route("/api/profile", methods=["PUT"])
def update_profile():
    return profile.update_profile()

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)