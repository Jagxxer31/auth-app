from flask import request, jsonify
import jwt
import os
from db import get_mysql, mongo_db, redis_client

def _verify_token():
    token = request.headers.get("Authorization")

    if not token:
        return None

    try:
        token = token.split(" ")[1]
        decoded = jwt.decode(token, os.getenv("JWT_SECRET"), algorithms=["HS256"])

        stored = redis_client.get(f"session:{decoded['id']}")

        if not stored or stored != token:
            return None

        return decoded
    except:
        return None


def get_profile():
    user = _verify_token()

    if not user:
        return jsonify({"error": "Unauthorized"}), 401

    db = get_mysql()
    cursor = db.cursor(dictionary=True)
    cursor.execute("SELECT id, name, email FROM users WHERE id=%s", (user["id"],))
    user_data = cursor.fetchone()

    profile = mongo_db.profiles.find_one({"userId": user["id"]})

    if profile:
        profile.pop("_id", None)
    else:
        profile = {}

    return jsonify({**user_data, "profile": profile})


def update_profile():
    user = _verify_token()

    if not user:
        return jsonify({"error": "Unauthorized"}), 401

    data = request.get_json()

    mongo_db.profiles.update_one(
        {"userId": user["id"]},
        {"$set": {
            "dob": data.get("dob"),
            "contact": data.get("contact"),
            "address": data.get("address")
        }},
        upsert=True
    )

    updated = mongo_db.profiles.find_one({"userId": user["id"]})
    if updated:
        updated.pop("_id", None)

    return jsonify({"success": True, "profile": updated})