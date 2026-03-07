from .. import db
from datetime import datetime

class Scan(db.Model):
    __tablename__ = 'scans'
    id = db.Column(db.Integer, primary_key=True)
    # Existing database column is named "userid" (legacy schema), but we want to
    # keep using the "user_id" attribute name in Python. Map it explicitly.
    user_id = db.Column('userid', db.Integer, db.ForeignKey('users.id'), nullable=False)
    url = db.Column(db.String(500), nullable=False)
    result = db.Column(db.String(20), nullable=False) # 'Safe', 'Suspicious', 'Malicious'
    confidence = db.Column(db.Float, default=1.0)
    
    # Detailed scan metrics
    domain_age_days = db.Column(db.Integer, nullable=True)
    has_ssl = db.Column(db.Boolean, nullable=True)
    redirect_count = db.Column(db.Integer, default=0)
    risk_score = db.Column(db.Integer, default=0) # 0-100
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
