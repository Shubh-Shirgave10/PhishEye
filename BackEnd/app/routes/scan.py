from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from ..services.scan_service import ScanService
from ..models.scan import Scan
from ..middlewares.api_key_auth import require_api_key
from .. import db, limiter

scan_bp = Blueprint('scan', __name__)

@scan_bp.route('/scan', methods=['POST'])
@limiter.limit("10 per minute")
def scan():
    """
    Unified scan endpoint used by both the web app and browser extension.
    It accepts either a JWT (Authorization: Bearer ...) or an API key (X-API-KEY).
    On any internal error it returns a JSON error payload instead of an HTML 500 page,
    so frontend/extension callers never break on non‑JSON responses.
    """
    try:
        # Allow either JWT or API Key
        user_id = None
        auth_header = request.headers.get('Authorization')
        api_key_header = request.headers.get('X-API-KEY')
        
        if api_key_header:
            from ..models.api_key import APIKey
            key_record = APIKey.query.filter_by(key_value=api_key_header, is_active=True).first()
            if key_record:
                user_id = key_record.user_id
        
        if not user_id and auth_header:
            # Try JWT verification (manual for flexibility in this route)
            try:
                from flask_jwt_extended import decode_token
                token = auth_header.split(" ")[1]
                decoded = decode_token(token)
                user_id = decoded.get('sub')
            except Exception:
                # Invalid token just means we won't persist the scan
                user_id = None

        data = request.get_json(silent=True) or {}
        url = data.get('url')
        if not url:
            return jsonify({"message": "URL is required"}), 400
        
        analysis = ScanService.analyze_url(url)
        
        # Save scan result if user is authenticated
        if user_id:
            new_scan = Scan(
                user_id=int(user_id),
                url=url,
                result=analysis.get('status'),
                confidence=analysis.get('confidence'),
                risk_score=analysis.get('risk_score'),
                domain_age_days=analysis.get('details', {}).get('domain', {}).get('age_days'),
                has_ssl=analysis.get('details', {}).get('ssl', {}).get('valid')
            )
            db.session.add(new_scan)
            db.session.commit()
        
        return jsonify(analysis), 200

    except Exception as e:
        # Defensive fallback – never return HTML error pages to JS clients
        # You could also log this via the existing logger if desired.
        db.session.rollback()
        return jsonify({
            "status": "Error",
            "message": "Scan failed due to an internal error.",
            "details": {"error": str(e)}
        }), 500

@scan_bp.route('/history', methods=['GET'])
@jwt_required()
def history():
    user_id = get_jwt_identity()
    scans = Scan.query.filter_by(user_id=user_id).order_by(Scan.created_at.desc()).limit(50).all()
    
    history_data = [{
        "id": s.id,
        "url": s.url,
        "result": s.result,
        "confidence": s.confidence,
        "risk_score": s.risk_score,
        "created_at": s.created_at.isoformat()
    } for s in scans]
    
    return jsonify(history_data), 200
