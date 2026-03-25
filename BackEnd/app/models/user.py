from .. import db
from datetime import datetime
from werkzeug.security import generate_password_hash, check_password_hash

class User(db.Document):
    meta = {'collection': 'users'}
    
    email = db.StringField(max_length=120, unique=True, required=True)
    password_hash = db.StringField(max_length=255, required=True)
    created_at = db.DateTimeField(default=datetime.utcnow)
    
    # OTP / Auth fields
    phone = db.StringField(max_length=20)
    otp_secret = db.StringField(max_length=32)
    is_verified = db.BooleanField(default=False)
    reset_token = db.StringField(max_length=100)
    reset_token_expiry = db.DateTimeField()

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)
