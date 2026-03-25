"""
OTP Routes
----------
REST endpoints for sending and verifying SMS OTPs via Twilio.
"""

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from ..services.twilio_otp import send_otp, verify_otp
from ..models.user import User
from .. import db, limiter

otp_bp = Blueprint("otp", __name__)


@otp_bp.route("/send", methods=["POST"])
@limiter.limit("3 per minute")  # Prevent OTP spam
def send_otp_route():
    """
    Send an OTP to the given phone number.

    Request JSON
    -------------
    {
        "phone": "+919876543210"
    }
    """
    data = request.get_json() or {}
    phone = data.get("phone")

    if not phone:
        return jsonify({"message": "Phone number is required"}), 400

    # Basic validation — must start with '+' and be at least 10 digits
    cleaned = phone.replace(" ", "").replace("-", "")
    if not cleaned.startswith("+") or len(cleaned) < 10:
        return jsonify({
            "message": "Phone number must be in E.164 format (e.g. +919876543210)"
        }), 400

    result = send_otp(cleaned)

    if result["success"]:
        return jsonify({"message": result["message"]}), 200
    else:
        return jsonify({"message": result["message"]}), 500


@otp_bp.route("/verify", methods=["POST"])
@limiter.limit("5 per minute")
def verify_otp_route():
    """
    Verify the OTP that was sent to the phone number.

    Request JSON
    -------------
    {
        "phone": "+919876543210",
        "otp": "123456"
    }
    """
    data = request.get_json() or {}
    phone = data.get("phone")
    otp_code = data.get("otp")

    if not phone or not otp_code:
        return jsonify({"message": "Phone number and OTP are required"}), 400

    cleaned = phone.replace(" ", "").replace("-", "")
    result = verify_otp(cleaned, str(otp_code))

    if result["success"]:
        return jsonify({"message": result["message"], "verified": True}), 200
    else:
        return jsonify({"message": result["message"], "verified": False}), 401
