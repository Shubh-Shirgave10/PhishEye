from .. import db
import secrets
from datetime import datetime

class APIKey(db.Model):
    __tablename__ = 'api_keys'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    key_value = db.Column(db.String(64), unique=True, nullable=False)
    name = db.Column(db.String(50), default='Default Extension Key')
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    last_used = db.Column(db.DateTime, nullable=True)

    @staticmethod
    def generate_key():
        return secrets.token_urlsafe(32)
