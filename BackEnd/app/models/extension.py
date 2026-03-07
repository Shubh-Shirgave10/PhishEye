from .. import db

class Extension(db.Model):
    __tablename__ = 'extension'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    device_id = db.Column(db.String(120), nullable=False)
    browser = db.Column(db.String(50), nullable=True)
    version = db.Column(db.String(20), nullable=True)
    last_active = db.Column(db.DateTime, nullable=True)
    last_url = db.Column(db.String(500), nullable=True)
