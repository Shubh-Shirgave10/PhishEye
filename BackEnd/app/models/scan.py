from .. import db
from datetime import datetime

class Scan(db.Document):
    meta = {'collection': 'scans'}
    
    user_id = db.StringField(required=True) # Usually the User ID string from JWT
    url = db.StringField(max_length=500, required=True)
    result = db.StringField(max_length=20, required=True) # 'Safe', 'Suspicious', 'Malicious'
    confidence = db.FloatField(default=1.0)
    
    # Detailed scan metrics
    domain_age_days = db.IntField()
    has_ssl = db.BooleanField()
    redirect_count = db.IntField(default=0)
    risk_score = db.IntField(default=0) # 0-100
    
    created_at = db.DateTimeField(default=datetime.utcnow)
