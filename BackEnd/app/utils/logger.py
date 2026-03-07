import logging
from datetime import datetime
import os

# Ensure logs directory exists
LOG_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), '../../logs')
if not os.path.exists(LOG_DIR):
    os.makedirs(LOG_DIR)

# Configure audit logger
audit_logger = logging.getLogger('audit')
audit_logger.setLevel(logging.INFO)
handler = logging.FileHandler(os.path.join(LOG_DIR, 'audit.log'))
formatter = logging.Formatter('%(asctime)s - %(levelname)s - %(message)s')
handler.setFormatter(formatter)
audit_logger.addHandler(handler)

def log_event(user_id, event_type, status, details=None):
    message = f"User: {user_id} | Event: {event_type} | Status: {status} | Details: {details}"
    audit_logger.info(message)
