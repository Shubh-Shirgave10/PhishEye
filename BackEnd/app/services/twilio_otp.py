"""
Twilio SMS OTP Service
----------------------
Generates a random 6-digit OTP, sends it via Twilio SMS,
and verifies it against an in-memory store (with expiry).
"""

import random
import time
from twilio.rest import Client
import os

# ---------------------------------------------------------------------------
# In-memory OTP store:  { phone_number: { "otp": "123456", "expires": ts } }
# For production, swap this with Redis / DB-backed storage.
# ---------------------------------------------------------------------------
_otp_store: dict[str, dict] = {}

OTP_EXPIRY_SECONDS = 300  # OTP valid for 5 minutes


def _get_twilio_client() -> Client:
    """Create and return a Twilio REST client using env vars."""
    account_sid = os.getenv("TWILIO_ACCOUNT_SID")
    auth_token = os.getenv("TWILIO_AUTH_TOKEN")
    if not account_sid or not auth_token:
        raise RuntimeError(
            "TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN must be set in .env"
        )
    return Client(account_sid, auth_token)


def generate_otp(length: int = 6) -> str:
    """Return a random numeric OTP of the given length."""
    return "".join([str(random.randint(0, 9)) for _ in range(length)])


def send_otp(phone_number: str) -> dict:
    """
    Generate an OTP, store it, and send it to *phone_number* via Twilio SMS.

    Parameters
    ----------
    phone_number : str
        E.164 formatted phone number, e.g. "+919876543210"

    Returns
    -------
    dict
        { "success": True/False, "message": "...", "sid": "..." }
    """
    otp_code = generate_otp()

    # Store with expiry timestamp
    _otp_store[phone_number] = {
        "otp": otp_code,
        "expires": time.time() + OTP_EXPIRY_SECONDS,
    }

    try:
        client = _get_twilio_client()
        twilio_phone = os.getenv("TWILIO_PHONE_NUMBER")
        if not twilio_phone:
            raise RuntimeError("TWILIO_PHONE_NUMBER must be set in .env")

        message = client.messages.create(
            body=f"Your PhishEye verification code is: {otp_code}. Valid for 5 minutes.",
            from_=twilio_phone,
            to=phone_number,
        )

        return {
            "success": True,
            "message": "OTP sent successfully",
            "sid": message.sid,
        }

    except Exception as e:
        # Clean up stored OTP on failure
        _otp_store.pop(phone_number, None)
        return {"success": False, "message": str(e)}


def verify_otp(phone_number: str, otp_code: str) -> dict:
    """
    Verify the OTP entered by the user.

    Parameters
    ----------
    phone_number : str
        The phone number the OTP was sent to.
    otp_code : str
        The OTP entered by the user.

    Returns
    -------
    dict
        { "success": True/False, "message": "..." }
    """
    record = _otp_store.get(phone_number)

    if not record:
        return {"success": False, "message": "No OTP was requested for this number"}

    # Check expiry
    if time.time() > record["expires"]:
        _otp_store.pop(phone_number, None)
        return {"success": False, "message": "OTP has expired. Please request a new one."}

    # Check match
    if record["otp"] == otp_code:
        _otp_store.pop(phone_number, None)  # One-time use
        return {"success": True, "message": "OTP verified successfully"}

    return {"success": False, "message": "Invalid OTP"}
