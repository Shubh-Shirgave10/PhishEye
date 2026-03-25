from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required
from ..models.user import User
from ..models.scan import Scan
from .. import db

admin_bp = Blueprint('admin', __name__)

@admin_bp.route('/stats', methods=['GET'])
@jwt_required()
def get_stats():
    # Only allow for admin user (logic to be defined, for now just check if user exists)
    total_users = User.objects.count()
    total_scans = Scan.objects.count()
    malicious_scans = Scan.objects(result='Malicious').count()
    suspicious_scans = Scan.objects(result='Suspicious').count()
    safe_scans = Scan.objects(result='Safe').count()
    
    return jsonify({
        "users": total_users,
        "scans": {
            "total": total_scans,
            "malicious": malicious_scans,
            "suspicious": suspicious_scans,
            "safe": safe_scans
        }
    }), 200
