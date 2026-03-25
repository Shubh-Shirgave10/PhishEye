from flask import Flask, jsonify, redirect
from flask_jwt_extended import JWTManager, jwt_required, get_jwt_identity
from flask_cors import CORS
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from flask_talisman import Talisman
from flask_marshmallow import Marshmallow
import mongoengine
import os
import datetime
from dotenv import load_dotenv

load_dotenv()

jwt = JWTManager()
ma = Marshmallow()
limiter = Limiter(key_func=get_remote_address, default_limits=["200 per day", "50 per hour"])

# Proxy object so models can do: from .. import db
class _MongoProxy:
    """Thin proxy that exposes mongoengine's Document and field types."""
    Document = mongoengine.Document
    StringField = mongoengine.StringField
    IntField = mongoengine.IntField
    FloatField = mongoengine.FloatField
    BooleanField = mongoengine.BooleanField
    DateTimeField = mongoengine.DateTimeField
    ListField = mongoengine.ListField
    ReferenceField = mongoengine.ReferenceField
    EmbeddedDocumentField = mongoengine.EmbeddedDocumentField
    DictField = mongoengine.DictField

db = _MongoProxy()

def create_app():
    BASE_DIR = os.path.abspath(os.path.dirname(__file__))
    FRONTEND_DIR = os.path.abspath(os.path.join(BASE_DIR, '..', '..', 'FrontEnd'))
    
    app = Flask(__name__, static_folder=FRONTEND_DIR, static_url_path='')
    
    # Configuration
    app.config['JWT_SECRET_KEY'] = os.getenv('JWT_SECRET_KEY', 'phish-eye-secret-key')
    app.config['JWT_ACCESS_TOKEN_EXPIRES'] = datetime.timedelta(days=7)

    # Connect to MongoDB Atlas
    mongodb_uri = os.getenv('MONGODB_URI')
    if not mongodb_uri:
        # Fallback for development if MONGODB_URI is not set
        mongodb_uri = 'mongodb://localhost:27017/phisheye'
        print("⚠️ Warning: MONGODB_URI not found, falling back to localhost.")
    
    # Connect with mongoengine
    mongoengine.connect(host=mongodb_uri, db='phisheye')
    
    # Extensions
    CORS(app)
    jwt.init_app(app)
    ma.init_app(app)
    limiter.init_app(app)
    
    # Talisman for security headers - disable mandatory HTTPS for local testing
    Talisman(app, content_security_policy=None, force_https=False)
    
    with app.app_context():
        # Import models
        from .models.user import User
        from .models.scan import Scan
        from .models.extension import Extension
        from .models.api_key import APIKey
        
        # Register blueprints
        from .routes.auth import auth_bp
        from .routes.scan import scan_bp
        from .routes.extension import extension_bp
        from .routes.admin import admin_bp
        from .routes.otp import otp_bp
        
        app.register_blueprint(auth_bp, url_prefix='/api/auth')
        app.register_blueprint(scan_bp, url_prefix='/api/scan-logic')
        app.register_blueprint(extension_bp, url_prefix='/api/extension')
        app.register_blueprint(admin_bp, url_prefix='/api/admin')
        app.register_blueprint(otp_bp, url_prefix='/api/otp')

        # Compatibility for old /api/scan route
        from .routes.scan import scan as scan_view
        app.add_url_rule('/api/scan', 'legacy_scan', scan_view, methods=['POST'])

        @app.route('/api/history', methods=['GET'])
        @jwt_required()
        def legacy_history():
            user_id = get_jwt_identity()
            # In MongoEngine, we use .objects()
            scans = Scan.objects(user_id=user_id).order_by('-created_at').limit(50)

            history_data = [{
                "id": str(s.id),
                "url": s.url,
                "result": s.result,
                "confidence": s.confidence,
                "risk_score": getattr(s, 'risk_score', 0),
                "created_at": s.created_at.isoformat()
            } for s in scans]

            return jsonify({"history": history_data}), 200

        # Frontend routes
        @app.route('/')
        def index():
            return redirect('/login-page/login.html')

        @app.route('/FrontEnd/<path:path>')
        def serve_frontend_alias(path):
            return app.send_static_file(path)

        @app.route('/<path:path>')
        def serve_static(path):
            return app.send_static_file(path)

    return app

    return app
