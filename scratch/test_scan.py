import sys
import os
import json

# Add BackEnd to sys.path
sys.path.append(r'c:\Users\Dell\Documents\phishEye\Project\BackEnd')

# Mock db and limiter before importing ScanService
import flask
from unittest.mock import MagicMock

app = flask.Flask(__name__)
sys.modules['..'] = MagicMock()
sys.modules['..models.scan'] = MagicMock()
sys.modules['..middlewares.api_key_auth'] = MagicMock()

from app.services.scan_service import ScanService

test_urls = [
    "https://www.google.com",
    "https://github.com",
    "https://www.wikipedia.org",
    "http://localhost:3000",
    "https://www.bing.com",
    "https://www.bankofamerica.com",
    "https://signin.aws.amazon.com",
    "https://login.microsoftonline.com",
    "http://example.com",
    "https://www.paypal.com/signin",
    "https://docs.google.com",
    "https://medium.com",
    "https://dev.to"
]

for url in test_urls:
    try:
        result = ScanService.analyze_url(url)
        print(f"URL: {url}")
        print(f"  Status: {result['status']}")
        print(f"  Score: {result['risk_score']}")
        print(f"  ML verdict: {result['details'].get('ml_analysis', {}).get('verdict')}")
        print(f"  Heuristics: {result['details'].get('heuristics', {}).get('score')}")
        print("-" * 40)
    except Exception as e:
        print(f"URL: {url} failed: {e}")
