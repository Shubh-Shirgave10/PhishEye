import sys
import os

# Add the project root to sys.path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app import create_app, db
from sqlalchemy import text

app = create_app()

with app.app_context():
    try:
        db.session.execute(text('ALTER TABLE users ADD COLUMN phone VARCHAR(20)'))
        db.session.commit()
        print("Successfully added 'phone' column to 'users' table.")
    except Exception as e:
        if "duplicate column name" in str(e).lower() or "already exists" in str(e).lower():
            print("Column 'phone' already exists.")
        else:
            print(f"Error: {e}")
