from .. import db
from datetime import datetime
from werkzeug.security import generate_password_hash, check_password_hash

class User(db.Model):
    __tablename__ = 'users'
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # OTP / Auth fields
    phone = db.Column(db.String(20), nullable=True)
    otp_secret = db.Column(db.String(32), nullable=True)
    is_verified = db.Column(db.Boolean, default=False) # For email verification
    reset_token = db.Column(db.String(100), nullable=True)
    reset_token_expiry = db.Column(db.DateTime, nullable=True)

    # Relationships
    extension = db.relationship('Extension', backref='user', uselist=False)
    scans = db.relationship('Scan', backref='user', lazy=True)
    api_keys = db.relationship('APIKey', backref='user', lazy=True)

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)
