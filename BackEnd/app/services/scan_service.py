import os
import sys
import joblib
import pandas as pd
import re
import socket
import ssl
import requests
from urllib.parse import urlparse
import whois
from datetime import datetime

from Levenshtein import distance as levenshtein_distance

# Add project root to sys.path to import ML modules if needed
PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', '..'))
if PROJECT_ROOT not in sys.path:
    sys.path.append(PROJECT_ROOT)

class ScanService:
    _model = None
    _model_path = os.path.join(PROJECT_ROOT, 'phisheye_model', 'phishing_model.pkl')

    @classmethod
    def _get_model(cls):
        if cls._model is None:
            if os.path.exists(cls._model_path):
                try:
                    cls._model = joblib.load(cls._model_path)
                except Exception as e:
                    print(f"Error loading ML model: {e}")
            else:
                print(f"ML model not found at {cls._model_path}")
        return cls._model

    @staticmethod
    def extract_phi_features(url):
        """
        New feature extraction matching phisheye_model/predict.py
        """
        features = []
        # 1. URL Length
        features.append(len(url))
        # 2. Dot Count
        features.append(url.count('.'))
        # 3. Slash Count
        features.append(url.count('/'))
        # 4. @ presence
        features.append(1 if '@' in url else 0)
        # 5. https presence
        features.append(1 if 'https' in url else 0)

        parsed_url = urlparse(url)
        domain = parsed_url.netloc

        # 6. Suspicious keywords in domain
        suspicious_keywords = ['login', 'verify', 'account', 'update', 'secure']
        features.append(1 if any(keyword in domain for keyword in suspicious_keywords) else 0)

        # 7. IP address in domain
        features.append(1 if re.match(r'\b(?:\d{1,3}\.){3}\d{1,3}\b', domain) else 0)

        # 8. Domain similarity (Levenshtein)
        legitimate_domains = ['instagram.com', 'facebook.com', 'google.com']
        min_dist = 99
        if domain:
            distances = [levenshtein_distance(domain.lower(), legit) for legit in legitimate_domains]
            if distances:
                min_dist = min(distances)
        
        similarity_threshold = 3
        features.append(1 if min_dist <= similarity_threshold else 0)

        return features

    @staticmethod
    def analyze_url(url):
        results = {
            "url": url,
            "status": "Safe",
            "risk_score": 0,
            "confidence": 0.0,
            "details": {}
        }
        
        parsed = urlparse(url)
        scheme = parsed.scheme.lower()
        
        # Internal Browser Protocols Whitelist
        if scheme in ['chrome', 'about', 'edge', 'file', 'view-source']:
            results["status"] = "Safe"
            results["confidence"] = 1.0
            results["details"]["whitelist"] = "Internal browser page"
            return results

        domain = parsed.netloc.split(':')[0]
        
        # Whitelist
        trusted_domains = [
            'localhost', '127.0.0.1', 'testserver.local',
            'google.com', 'gmail.com', 'outlook.com', 'microsoft.com',
            'live.com', 'apple.com', 'amazon.com', 'github.com',
            'youtube.com', 'facebook.com', 'instagram.com', 'linkedin.com',
            'twitter.com', 'x.com', 'reddit.com', 'netflix.com',
            'chatgpt.com', 'openai.com'
        ]
        
        if any(domain == td or domain.endswith('.' + td) for td in trusted_domains):
            results["status"] = "Safe"
            results["confidence"] = 1.0
            results["details"]["whitelist"] = "Trusted domain bypass"
            return results

        # Database Check for known phishing URLs
        try:
            from ..models.scan import Scan
            existing_scan = Scan.query.filter_by(url=url, result="Malicious").first()
            if existing_scan:
                results["status"] = "Malicious"
                results["risk_score"] = 100
                results["confidence"] = 1.0
                results["details"]["database"] = "Known malicious URL in database"
                return results
        except Exception as e:
            print(f"Database check failed: {e}")

        # ML Model Prediction
        ml_status = "Unknown"
        ml_score = 0
        model = ScanService._get_model()
        
        try:
            phi_features = ScanService.extract_phi_features(url)
            if model:
                # Based on dataset: 0 = Phishing, 1 = Safe
                prediction = model.predict([phi_features])[0]
                
                if prediction == 0:
                    ml_status = "Malicious"
                    ml_score = 50 # Balanced weight for hybrid engine to prevent false suspicious
                else:
                    ml_status = "Safe"
                    ml_score = 0
                
                results["details"]["ml_analysis"] = {
                    "verdict": ml_status,
                    "features": phi_features
                }
                results["risk_score"] += ml_score
        except Exception as e:
            print(f"ML Prediction failed: {e}")
            results["details"]["ml_analysis"] = {"error": str(e)}
        
        # 1. Heuristic Engine
        heuristics = ScanService.check_heuristics(url)
        results["details"]["heuristics"] = heuristics
        results["risk_score"] += heuristics["score"]
        
        # 2. Redirect Chain
        redirects = ScanService.check_redirects(url)
        results["details"]["redirects"] = redirects
        results["risk_score"] += (redirects["count"] * 5)
        
        # 3. SSL Check
        ssl_info = ScanService.check_ssl(url)
        results["details"]["ssl"] = ssl_info
        if not ssl_info["valid"] and ssl_info.get("reason") == "No HTTPS":
            results["risk_score"] += 20
        
        # 4. Domain Age
        domain_info = ScanService.check_domain_age(url)
        results["details"]["domain"] = domain_info
        if domain_info["age_days"] < 30: 
             results["risk_score"] += 20
        
        # Final status determination
        if results["risk_score"] >= 100: 
            results["status"] = "Malicious"
            results["confidence"] = 0.9
        elif results["risk_score"] >= 60: 
            results["status"] = "Suspicious"
            results["confidence"] = 0.7
        else:
            results["status"] = "Safe"
            results["confidence"] = 0.95
            
        return results

    @staticmethod
    def check_heuristics(url):
        score = 0
        parsed = urlparse(url)
        domain = parsed.netloc
        
        # IP as domain
        if re.match(r"^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$", domain):
            score += 40
            
        # Too many subdomains
        if domain.count('.') > 4: # Increased from 3
            score += 15
            
        # Suspect keywords (Only extremely specific ones)
        keywords = ['login-update', 'account-verification', 'secure-signin-verify']
        for kw in keywords:
            if kw in url.lower():
                score += 25
                
        # Length
        if len(url) > 150: # Increased from 100
            score += 10
            
        return {"score": score}

    @staticmethod
    def check_redirects(url):
        try:
            response = requests.get(url, allow_redirects=True, timeout=5)
            return {"count": len(response.history), "final_url": response.url}
        except:
            return {"count": 0, "error": "Could not follow redirects"}

    @staticmethod
    def check_ssl(url):
        parsed = urlparse(url)
        if parsed.scheme != 'https':
            return {"valid": False, "reason": "No HTTPS"}
        
        try:
            hostname = parsed.netloc
            context = ssl.create_default_context()
            with socket.create_connection((hostname, 443), timeout=5) as sock:
                with context.wrap_socket(sock, server_hostname=hostname) as ssock:
                    cert = ssock.getpeercert()
                    return {"valid": True, "issued_to": hostname}
        except:
            return {"valid": False, "reason": "SSL Handshake failed"}

    @staticmethod
    def check_domain_age(url):
        parsed = urlparse(url)
        domain = parsed.netloc
        try:
            w = whois.whois(domain)
            creation_date = w.creation_date
            if isinstance(creation_date, list):
                creation_date = creation_date[0]
            
            if creation_date:
                age = (datetime.now() - creation_date).days
                return {"age_days": age, "created": creation_date.isoformat()}
            return {"age_days": 999, "reason": "No creation date found"}
        except:
            return {"age_days": 365, "reason": "WHOIS lookup failed"} # Default to safe-ish if fails
