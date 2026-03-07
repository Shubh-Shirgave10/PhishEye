import os
from flask import Flask, jsonify, request, send_from_directory, redirect
from flask_cors import CORS
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity
from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash
import datetime
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Determine the absolute path to the FrontEnd directory
BASE_DIR = os.path.abspath(os.path.dirname(__file__))
FRONTEND_DIR = os.path.abspath(os.path.join(BASE_DIR, '..', 'FrontEnd'))

app = Flask(__name__, static_folder=FRONTEND_DIR, static_url_path='')
CORS(app)

# Configuration from environment variables
app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URL')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['JWT_SECRET_KEY'] = os.getenv('JWT_SECRET_KEY', 'default-secret-key')
app.config['JWT_ACCESS_TOKEN_EXPIRES'] = datetime.timedelta(days=7)

db = SQLAlchemy(app)
jwt = JWTManager(app)

# --- Models ---

class User(db.Model):
    __tablename__ = 'users'
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.datetime.utcnow)
    
    # Relationships
    extension = db.relationship('Extension', backref='user', uselist=False)
    scans = db.relationship('Scan', backref='user', lazy=True)

class Extension(db.Model):
    __tablename__ = 'extension'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    device_id = db.Column(db.String(120), nullable=False)
    last_screen = db.Column(db.String(500), nullable=True) # Last screened URL or status

class Scan(db.Model):
    __tablename__ = 'scans'
    id = db.Column(db.Integer, primary_key=True)
    userid = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    url = db.Column(db.String(500), nullable=False)
    result = db.Column(db.String(20), nullable=False) # 'Safe', 'Unsafe'
    confidence = db.Column(db.Float, default=1.0)
    created_at = db.Column(db.DateTime, default=datetime.datetime.utcnow)

# Create tables
with app.app_context():
    db.create_all()

# --- Auth Routes ---

@app.route('/api/auth/register', methods=['POST'])
def register():
    data = request.get_json()
    if not data or not data.get('email') or not data.get('password'):
        return jsonify({'message': 'Missing email or password'}), 400
    
    if User.query.filter_by(email=data['email']).first():
        return jsonify({'message': 'User already exists'}), 409
    
    hashed_password = generate_password_hash(data['password'])
    new_user = User(email=data['email'], password_hash=hashed_password)
    db.session.add(new_user)
    db.session.commit()
    
    return jsonify({'message': 'User created successfully'}), 201

@app.route('/api/auth/login', methods=['POST'])
def login():
    data = request.get_json()
    if not data or not data.get('email') or not data.get('password'):
        return jsonify({'message': 'Missing credentials'}), 400
    
    user = User.query.filter_by(email=data['email']).first()
    
    if not user or not check_password_hash(user.password_hash, data['password']):
        return jsonify({'message': 'Invalid credentials'}), 401
    
    access_token = create_access_token(identity=str(user.id))
    return jsonify({'access_token': access_token, 'user_id': user.id}), 200

@app.route('/api/auth/verify', methods=['GET'])
@jwt_required()
def verify_token():
    current_user_id = get_jwt_identity()
    user = User.query.get(int(current_user_id))
    if not user:
        return jsonify({'message': 'User not found'}), 404
    return jsonify({'user_id': current_user_id, 'email': user.email}), 200

# --- Extension Routes ---

@app.route('/api/extension/link', methods=['POST'])
@jwt_required()
def link_extension():
    current_user_id = int(get_jwt_identity())
    data = request.get_json()
    device_id = data.get('device_id', 'unknown_device')
    
    ext = Extension.query.filter_by(user_id=current_user_id).first()
    if ext:
        ext.device_id = device_id
    else:
        ext = Extension(user_id=current_user_id, device_id=device_id)
        db.session.add(ext)
    
    db.session.commit()
    return jsonify({'message': 'Extension linked successfully', 'device_id': device_id}), 200

# --- Scan & History Routes ---

@app.route('/api/scan', methods=['POST'])
@jwt_required()
def scan_url():
    current_user_id = int(get_jwt_identity())
    data = request.get_json()
    url = data.get('url')
    
    if not url:
        return jsonify({'message': 'No URL provided'}), 400
    
    # Mock scanning logic
    is_unsafe = "phish" in url.lower() or "malware" in url.lower()
    status = "Unsafe" if is_unsafe else "Safe"
    confidence = 0.95 if is_unsafe else 0.99
    
    # Save to scans table
    new_scan = Scan(userid=current_user_id, url=url, result=status, confidence=confidence)
    db.session.add(new_scan)
    
    # Update extension last_screen
    ext = Extension.query.filter_by(user_id=current_user_id).first()
    if ext:
        ext.last_screen = url
        
    db.session.commit()
    
    return jsonify({'url': url, 'result': status, 'confidence': confidence}), 200

@app.route('/api/history', methods=['GET'])
@jwt_required()
def get_history():
    current_user_id = int(get_jwt_identity())
    scans = Scan.query.filter_by(userid=current_user_id).order_by(Scan.created_at.desc()).all()
    
    history_data = []
    for scan in scans:
        history_data.append({
            'url': scan.url,
            'result': scan.result,
            'confidence': scan.confidence,
            'created_at': scan.created_at.isoformat()
        })
        
    return jsonify({'history': history_data}), 200

@app.route('/')
def index():
    return redirect('/login-page/login.html')

@app.route('/FrontEnd/<path:path>')
def serve_frontend_alias(path):
    return send_from_directory(app.static_folder, path)

if __name__ == '__main__':
    app.run(debug=True, port=5000)
