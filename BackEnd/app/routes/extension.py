from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from ..models.extension import Extension
from .. import db
from datetime import datetime

extension_bp = Blueprint('extension', __name__)

@extension_bp.route('/link', methods=['POST'])
@jwt_required()
def link():
    user_id = get_jwt_identity()
    data = request.get_json()
    
    device_id = data.get('device_id')
    browser = data.get('browser')
    
    ext = Extension.objects(user_id=str(user_id), device_id=device_id).first()
    if not ext:
        ext = Extension(user_id=str(user_id), device_id=device_id)
    
    ext.browser = browser
    ext.last_active = datetime.utcnow()
    ext.save()
    
    return jsonify({"message": "Extension linked successfully"}), 200

@extension_bp.route('/status', methods=['GET'])
@jwt_required()
def status():
    user_id = get_jwt_identity()
    extensions = Extension.objects(user_id=str(user_id)).all()
    
    return jsonify([{
        "device_id": e.device_id,
        "browser": e.browser,
        "last_active": e.last_active.isoformat() if e.last_active else None
    } for e in extensions]), 200
