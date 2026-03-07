import sqlite3
import os

db_path = 'instance/phisheye.db'

if os.path.exists(db_path):
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    try:
        # Check if columns exist
        cursor.execute("PRAGMA table_info(users)")
        columns = [col[1] for col in cursor.fetchall()]
        
        if 'otp_secret' not in columns:
            print("Adding otp_secret to users...")
            cursor.execute("ALTER TABLE users ADD COLUMN otp_secret VARCHAR(32)")
            
        if 'is_verified' not in columns:
            print("Adding is_verified to users...")
            cursor.execute("ALTER TABLE users ADD COLUMN is_verified BOOLEAN DEFAULT 0")
            
        if 'reset_token' not in columns:
            print("Adding reset_token to users...")
            cursor.execute("ALTER TABLE users ADD COLUMN reset_token VARCHAR(100)")
            
        if 'reset_token_expiry' not in columns:
            print("Adding reset_token_expiry to users...")
            cursor.execute("ALTER TABLE users ADD COLUMN reset_token_expiry DATETIME")

        # Rename scan columns if needed or just drop and recreate if it's easier for dev
        # But let's try to fix the scans table too
        cursor.execute("PRAGMA table_info(scans)")
        scan_cols = [col[1] for col in cursor.fetchall()]
        
        if 'user_id' not in scan_cols and 'userid' in scan_cols:
             print("Migrating scans table...")
             # Simple rename is tricky in sqlite for FKs, let's just add new columns
             cursor.execute("ALTER TABLE scans ADD COLUMN user_id INTEGER REFERENCES users(id)")
             cursor.execute("UPDATE scans SET user_id = userid")
             
        if 'domain_age_days' not in scan_cols:
            cursor.execute("ALTER TABLE scans ADD COLUMN domain_age_days INTEGER")
        if 'has_ssl' not in scan_cols:
            cursor.execute("ALTER TABLE scans ADD COLUMN has_ssl BOOLEAN")
        if 'redirect_count' not in scan_cols:
            cursor.execute("ALTER TABLE scans ADD COLUMN redirect_count INTEGER DEFAULT 0")
        if 'risk_score' not in scan_cols:
            cursor.execute("ALTER TABLE scans ADD COLUMN risk_score INTEGER DEFAULT 0")

        conn.commit()
        print("Database migration complete.")
    except Exception as e:
        print(f"Error migrating database: {e}")
    finally:
        conn.close()
else:
    print("Database not found, nothing to migrate.")
