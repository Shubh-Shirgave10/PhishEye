import sys
import os

sys.path.append(os.path.abspath(os.path.dirname(__file__)))
from app import create_app, db
from app.models.user import User

app = create_app()

with app.app_context():
    users = User.query.all()
    for u in users:
        print(f"User: {u.email}, Phone: {u.phone}")
