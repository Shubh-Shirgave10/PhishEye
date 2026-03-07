from flask import Flask, jsonify, redirect
from flask_sqlalchemy import SQLAlchemy
from flask_jwt_extended import JWTManager, jwt_required, get_jwt_identity
from flask_cors import CORS
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from flask_talisman import Talisman
from flask_marshmallow import Marshmallow
import os
import datetime
from dotenv import load_dotenv

load_dotenv()

db = SQLAlchemy()
jwt = JWTManager()
ma = Marshmallow()
limiter = Limiter(key_func=get_remote_address, default_limits=["200 per day", "50 per hour"])

def create_app():
    BASE_DIR = os.path.abspath(os.path.dirname(__file__))
    FRONTEND_DIR = os.path.abspath(os.path.join(BASE_DIR, '..', '..', 'FrontEnd'))
    
    app = Flask(__name__, static_folder=FRONTEND_DIR, static_url_path='')
    
    # Configuration
    # Prefer a stable SQLite path under Flask's instance folder by default.
    # This avoids surprises with relative paths and keeps the DB writable on Windows.
    os.makedirs(app.instance_path, exist_ok=True)
    default_db_path = os.path.join(app.instance_path, 'phisheye.db')
    
    db_url = os.getenv('DATABASE_URL')
    if db_url and db_url.startswith('postgres://'):
        db_url = db_url.replace('postgres://', 'postgresql://', 1)
        
    app.config['SQLALCHEMY_DATABASE_URI'] = db_url or f"sqlite:///{default_db_path}"
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    app.config['JWT_SECRET_KEY'] = os.getenv('JWT_SECRET_KEY', 'phish-eye-secret-key')
    app.config['JWT_ACCESS_TOKEN_EXPIRES'] = datetime.timedelta(days=7)

    # SQLite can easily hit "database is locked" under concurrent requests (dashboard polling + extension autoscan).
    # These options make SQLite behave better for this dev setup.
    if app.config['SQLALCHEMY_DATABASE_URI'].startswith('sqlite'):
        app.config['SQLALCHEMY_ENGINE_OPTIONS'] = {
            "connect_args": {
                "check_same_thread": False,
                "timeout": 30
            }
        }
    
    # Extensions
    CORS(app)
    db.init_app(app)
    jwt.init_app(app)
    ma.init_app(app)
    limiter.init_app(app)
    
    # Talisman for security headers (like Helmet)
    Talisman(app, content_security_policy=None) # CSP can be tricky with inline scripts in dev, disabling for now or refine later
    
    with app.app_context():
        # Import models
        from .models.user import User
        from .models.scan import Scan
        from .models.extension import Extension
        from .models.api_key import APIKey
        
        db.create_all()
        
        # Register blueprints
        from .routes.auth import auth_bp
        from .routes.scan import scan_bp
        from .routes.extension import extension_bp
        from .routes.admin import admin_bp
        from .routes.otp import otp_bp
        
        app.register_blueprint(auth_bp, url_prefix='/api/auth')
        app.register_blueprint(scan_bp, url_prefix='/api/scan-logic') # renamed to avoid conflict with old /api/scan
        app.register_blueprint(extension_bp, url_prefix='/api/extension')
        app.register_blueprint(admin_bp, url_prefix='/api/admin')
        app.register_blueprint(otp_bp, url_prefix='/api/otp')

        # Compatibility for old /api/scan route
        from .routes.scan import scan as scan_view
        from .models.scan import Scan
        app.add_url_rule('/api/scan', 'legacy_scan', scan_view, methods=['POST'])

        @app.route('/api/history', methods=['GET'])
        @jwt_required()
        def legacy_history():
            """
            History endpoint used by the frontend dashboard and history pages.
            Returns data in the shape: {"history": [...]} for compatibility.
            """
            user_id = get_jwt_identity()
            scans = (Scan.query
                          .filter_by(user_id=user_id)
                          .order_by(Scan.created_at.desc())
                          .limit(50)
                          .all())

            history_data = [{
                "id": s.id,
                "url": s.url,
                "result": s.result,
                "confidence": s.confidence,
                "risk_score": s.risk_score,
                "created_at": s.created_at.isoformat()
            } for s in scans]

            return jsonify({"history": history_data}), 200

        # --- CLEAN URL ROUTES ---
        @app.route('/login')
        def login_pretty():
            return app.send_static_file('login-page/login.html')

        @app.route('/dashboard')
        @app.route('/main')
        def dashboard_pretty():
            return app.send_static_file('Main_Dash/mainDash.html')

        @app.route('/home')
        def home_pretty():
            return app.send_static_file('Dashboard/dashboard.html')

        @app.route('/quickscan')
        def quickscan_pretty():
            return app.send_static_file('QuickScan/quickscan.html')

        @app.route('/history')
        def history_pretty():
            return app.send_static_file('History/history.html')

        @app.route('/settings')
        def settings_pretty():
            return app.send_static_file('setting/settings.html')

        @app.route('/about')
        def about_pretty():
            return app.send_static_file('about/about.html')

        # Fallback routes for frontend
        @app.route('/')
        def index():
            # Redirect to the home landing page
            return redirect('/home')

        @app.route('/<path:path>')
        def serve_static_clean(path):
            # Check if file exists without .html
            if not path.endswith('.html') and '.' not in path:
                # Try serving from various directories
                potential_files = [
                    f"{path}.html",
                    f"login-page/{path}.html",
                    f"Main_Dash/{path}.html",
                    f"Dashboard/{path}.html",
                    f"History/{path}.html",
                    f"QuickScan/{path}.html",
                    f"setting/{path}.html",
                    f"about/{path}.html"
                ]
                for p in potential_files:
                    try:
                        return app.send_static_file(p)
                    except:
                        continue
            
            # Normal static file serving
            try:
                return app.send_static_file(path)
            except:
                # If all else fails, serve home
                return redirect('/home')

    return app
