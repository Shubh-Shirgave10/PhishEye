from flask import Blueprint, request, jsonify
from flask_jwt_extended import (
    create_access_token, create_refresh_token, jwt_required, 
    get_jwt_identity, get_jwt
)
from ..models.user import User
from ..models.api_key import APIKey
from .. import db, limiter
from ..utils.logger import log_event
from ..services.twilio_otp import send_otp, verify_otp
import pyotp
import datetime

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/register', methods=['POST'])
def register():
    data = request.get_json()
    if User.query.filter_by(email=data.get('email')).first():
        return jsonify({"message": "User already exists"}), 409
    
    new_user = User(email=data['email'], phone=data.get('phone'))
    new_user.set_password(data['password'])
    
    # Generate OTP secret (legacy TOTP support)
    new_user.otp_secret = pyotp.random_base32()
    
    db.session.add(new_user)
    db.session.commit()
    
    return jsonify({
        "message": "User registered successfully.",
        "user_id": new_user.id
    }), 201

@auth_bp.route('/login', methods=['POST'])
@limiter.limit("5 per minute")
def login():
    """
    Primary login endpoint used by the web frontend.
    """
    data = request.get_json() or {}
    email = data.get('email')
    password = data.get('password')

    user = User.query.filter_by(email=email).first()
    
    if not user or not user.check_password(password):
        log_event(email, 'LOGIN_ATTEMPT', 'FAILED', 'Invalid credentials')
        return jsonify({"message": "Invalid credentials"}), 401

    access_token = create_access_token(identity=str(user.id))
    refresh_token = create_refresh_token(identity=str(user.id))

    log_event(user.id, 'LOGIN', 'SUCCESS')

    return jsonify({
        "access_token": access_token,
        "refresh_token": refresh_token,
        "user_id": user.id,
        "email": user.email
    }), 200

@auth_bp.route('/forgot-password', methods=['POST'])
def forgot_password():
    data = request.get_json()
    email = data.get('email')
    
    user = User.query.filter_by(email=email).first()
    if not user or not user.phone:
        return jsonify({"message": "User not found or phone number not set"}), 404
    
    # Send OTP using our service
    result = send_otp(user.phone)
    if result['success']:
        return jsonify({"message": "OTP sent to your registered mobile number", "phone": user.phone}), 200
    else:
        return jsonify({"message": "Failed to send OTP", "error": result['message']}), 500

@auth_bp.route('/reset-password', methods=['POST'])
def reset_password():
    data = request.get_json()
    phone = data.get('phone')
    otp = data.get('otp')
    new_password = data.get('new_password')
    
    # Verify OTP
    v_result = verify_otp(phone, otp)
    if not v_result['success']:
        return jsonify({"message": v_result['message']}), 401
    
    # OTP verified, change password
    user = User.query.filter_by(phone=phone).first()
    if not user:
        return jsonify({"message": "User not found"}), 404
        
    user.set_password(new_password)
    db.session.commit()
    
    return jsonify({"message": "Password reset successfully. Please login with your new password."}), 200

