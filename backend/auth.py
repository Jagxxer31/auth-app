from flask import request, jsonify
from werkzeug.security import generate_password_hash, check_password_hash
import jwt
import datetime
import os
from db import get_mysql, redis_client

def register():
    data = request.get_json()
    name = data.get("name")
    email = data.get("email")
    password = data.get("password")

    if not name or not email or not password:
        return jsonify({"error": "All fields required"}), 400

    db = get_mysql()
    cursor = db.cursor(dictionary=True)
    cursor.execute("SELECT id FROM users WHERE email=%s", (email,))
    existing = cursor.fetchone()

    if existing:
        return jsonify({"error": "Email already exists"}), 400

    hashed = generate_password_hash(password)

    formatted_name = " ".join([w.capitalize() for w in name.lower().split()])

    cursor.execute(
        "INSERT INTO users (name, email, password) VALUES (%s, %s, %s)",
        (formatted_name, email, hashed)
    )
    db.commit()

    return jsonify({"success": True})


def login():
    data = request.get_json()
    email = data.get("email")
    password = data.get("password")

    if not email or not password:
        return jsonify({"error": "All fields required"}), 400

    db = get_mysql()
    cursor = db.cursor(dictionary=True)
    cursor.execute("SELECT * FROM users WHERE email=%s", (email,))
    user = cursor.fetchone()

    if not user:
        return jsonify({"error": "Invalid credentials"}), 400

    if not check_password_hash(user["password"], password):
        return jsonify({"error": "Invalid credentials"}), 400

    token = jwt.encode(
        {
            "id": user["id"],
            "email": user["email"],
            "exp": datetime.datetime.utcnow() + datetime.timedelta(hours=1)
        },
        os.getenv("JWT_SECRET"),
        algorithm="HS256"
    )

    if isinstance(token, bytes):
        token = token.decode("utf-8")

    redis_client.set(f"session:{user['id']}", token, ex=3600)

    return jsonify({"success": True, "token": token})