# PhishEye Backend Setup & API Docs

## Setup Instructions

1.  **Clone the project** and navigate to the `BackEnd` directory.
2.  **Create a virtual environment**:
    ```powershell
    python -m venv .venv
    .\.venv\Scripts\activate
    ```
3.  **Install dependencies**:
    ```powershell
    pip install -r requirements.txt
    ```
4.  **Configure environment variables**:
    Create a `.env` file from `.env.example`:
    ```env
    DATABASE_URL=sqlite:///phisheye.db
    JWT_SECRET_KEY=your-secure-key
    ```
5.  **Run the application**:
    ```powershell
    python run.py
    ```

## API Reference

### 1. Authentication

#### Register
`POST /api/auth/register`
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```
*Note: Returns OTP URI for 2FA setup.*

#### Login
`POST /api/auth/login`
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```
*Returns `requires_otp: true`.*

#### Verify OTP
`POST /api/auth/verify-otp`
```json
{
  "user_id": 1,
  "otp": "123456"
}
```
*Returns JWT tokens.*

#### Issue API Key (For Extension)
`POST /api/auth/issue-api-key`
*Headers: Authorization: Bearer <JWT>*
```json
{
  "api_key": "xyz123...",
  "name": "Default Extension Key"
}
```

### 2. Phishing Detection

#### Scan URL
`POST /api/scan-logic/scan`
*Headers: X-API-KEY: <API_KEY> OR Authorization: Bearer <JWT>*
```json
{
  "url": "http://suspect-site.com/login"
}
```
**Response:**
```json
{
  "url": "http://suspect-site.com/login",
  "status": "Malicious",
  "risk_score": 75,
  "confidence": 0.88,
  "details": {
    "heuristics": {"score": 25},
    "ssl": {"valid": false, "reason": "No HTTPS"},
    "domain": {"age_days": 5, "created": "2024-02-05"}
  }
}
```

### 3. Admin

#### Get Stats
`GET /api/admin/stats`
*Headers: Authorization: Bearer <JWT>*
```json
{
  "users": 150,
  "scans": {
    "total": 5402,
    "malicious": 320,
    "suspicious": 112,
    "safe": 4970
  }
}
```
