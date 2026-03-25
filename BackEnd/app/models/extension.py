from .. import db

class Extension(db.Document):
    meta = {'collection': 'extension'}
    
    user_id = db.StringField(required=True)
    device_id = db.StringField(max_length=120, required=True)
    browser = db.StringField(max_length=50)
    version = db.StringField(max_length=20)
    last_active = db.DateTimeField()
    last_url = db.StringField(max_length=500)
