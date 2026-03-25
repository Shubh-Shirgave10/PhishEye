from .. import db
import secrets
from datetime import datetime

class APIKey(db.Document):
    meta = {'collection': 'api_keys'}
    
    user_id = db.StringField(required=True)
    key_value = db.StringField(max_length=64, unique=True, required=True)
    name = db.StringField(max_length=50, default='Default Extension Key')
    is_active = db.BooleanField(default=True)
    created_at = db.DateTimeField(default=datetime.utcnow)
    last_used = db.DateTimeField()

    @staticmethod
    def generate_key():
        return secrets.token_urlsafe(32)
