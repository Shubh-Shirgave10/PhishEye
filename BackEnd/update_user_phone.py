import sys
import os

sys.path.append(os.path.abspath(os.path.dirname(__file__)))
from app import create_app, db
from app.models.user import User

app = create_app()

with app.app_context():
    # Check if user exists
    user = User.query.filter_by(email='yashnaik459@gmail.com').first()
    if not user:
        # Create user if they don't exist
        user = User(email='yashnaik459@gmail.com', phone='+919945576085')
        user.set_password('password123')
        db.session.add(user)
        print(f"Created new user {user.email}")
    else:
        # Update phone if user exists
        user.phone = '+919945576085'
        print(f"Updated phone for existing user {user.email}")
        
    db.session.commit()
    print("Database updated!")
