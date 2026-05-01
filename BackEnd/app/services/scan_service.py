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
        suspicious_keywords = ['login', 'verify', 'account', 'update', 'secure', 'test', 'vuln', 'lab']
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
            'chatgpt.com', 'openai.com', 'wikipedia.org', 'stackoverflow.com',
            'zoom.us', 'slack.com', 'discord.com', 'spotify.com', 'adobe.com',
            'salesforce.com', 'dropbox.com', 'paypal.com', 'microsoftonline.com',
            'bing.com', 'yahoo.com', 'duckduckgo.com', 'medium.com', 'dev.to',
            'render.com', 'heroku.com', 'vercel.app', 'netlify.app', 'pypi.org',
            'python.org', 'npmjs.com', 'cloudflare.com', 'aws.amazon.com', 'azure.com'
        ]
        
        if any(domain == td or domain.endswith('.' + td) for td in trusted_domains):
            results["status"] = "Safe"
            results["confidence"] = 1.0
            results["details"]["whitelist"] = "Trusted domain bypass"
            return results

        # Database Check for known phishing URLs
        try:
            from ..models.scan import Scan
            existing_scan = Scan.objects(url=url, result="Malicious").first()
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
                    ml_score = 30 # Reduced impact to prevent false positives
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
        
        # -------------------------------
        # Parallel Engine Modules
        # -------------------------------
        import concurrent.futures
        
        with concurrent.futures.ThreadPoolExecutor(max_workers=4) as executor:
            # Kick off all external checks in parallel
            future_heuristics = executor.submit(ScanService.check_heuristics, url)
            future_redirects = executor.submit(ScanService.check_redirects, url)
            future_ssl = executor.submit(ScanService.check_ssl, url)
            future_domain = executor.submit(ScanService.check_domain_age, url)
            
            # Use wait to ensure we don't hang forever, though individual tools have timeouts
            done, not_done = concurrent.futures.wait(
                [future_heuristics, future_redirects, future_ssl, future_domain], 
                timeout=10
            )

            # 1. Heuristic Engine result
            try:
                heuristics = future_heuristics.result(timeout=1)
                results["details"]["heuristics"] = heuristics
                results["risk_score"] += heuristics.get("score", 0)
            except Exception as e:
                results["details"]["heuristics"] = {"error": str(e), "score": 0}

            # 2. Redirect Chain result
            try:
                redirects = future_redirects.result(timeout=1)
                results["details"]["redirects"] = redirects
                results["risk_score"] += (redirects.get("count", 0) * 5)
            except Exception as e:
                results["details"]["redirects"] = {"error": str(e), "count": 0}

            # 3. SSL Check result
            try:
                ssl_info = future_ssl.result(timeout=1)
                results["details"]["ssl"] = ssl_info
                if not ssl_info.get("valid") and ssl_info.get("reason") == "No HTTPS":
                    results["risk_score"] += 25 # Increased penalty for unencrypted sites
            except Exception as e:
                results["details"]["ssl"] = {"error": str(e), "valid": False}

            # 4. Domain Age result
            try:
                domain_info = future_domain.result(timeout=1)
                results["details"]["domain"] = domain_info
                if domain_info.get("age_days", 999) < 30: 
                     results["risk_score"] += 15 # Reduced from 20
            except Exception as e:
                results["details"]["domain"] = {"error": str(e), "age_days": 365}
        
        # Final status determination
        risk_score = int(results["risk_score"])
        if risk_score >= 85: 
            results["status"] = "Malicious"
            results["confidence"] = 0.92
        elif risk_score >= 60: # Increased threshold to reduce false warnings
            results["status"] = "Suspicious"
            results["confidence"] = 0.75
        else:
            results["status"] = "Safe"
            results["confidence"] = 0.95
            
        return results

    @staticmethod
    def check_heuristics(url):
        score = 0
        parsed = urlparse(url)
        domain = parsed.netloc
        
        # 1. IP as domain (Strong indicator)
        if re.match(r"^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$", domain):
            if domain not in ['127.0.0.1', '0.0.0.0']:
                score += 50
            
        # 2. Too many subdomains
        if domain.count('.') > 4: 
            score += 15
            
        # 3. Suspect keywords (Capped at 30 total)
        keywords = ['login', 'verify', 'account', 'update', 'secure', 'signin', 'banking', 'wallet', 'auth', 'vuln', 'test', 'exploit', 'lab']
        keyword_score = 0
        for kw in keywords:
            if kw in url.lower():
                keyword_score += 10 # Reduced weight per keyword
        
        score += min(keyword_score, 40) # Max 40 points from keywords
                
        # 4. Excessive Length
        if len(url) > 120:
            score += 5
            
        return {"score": score}

    @staticmethod
    def check_redirects(url):
        try:
            # Use stream=True to prevent fully downloading large payloads
            response = requests.get(url, allow_redirects=True, timeout=3, stream=True)
            response.close()
            return {"count": len(response.history), "final_url": response.url}
        except Exception as e:
            return {"count": 0, "error": f"Could not follow redirects: {str(e)}"}

    @staticmethod
    def check_ssl(url):
        parsed = urlparse(url)
        if parsed.scheme != 'https':
            return {"valid": False, "reason": "No HTTPS"}
        
        try:
            hostname = parsed.netloc.split(':')[0] # Ensure no port in hostname
            context = ssl.create_default_context()
            with socket.create_connection((hostname, 443), timeout=3) as sock: # Reduced timeout to 3
                with context.wrap_socket(sock, server_hostname=hostname) as ssock:
                    cert = ssock.getpeercert()
                    return {"valid": True, "issued_to": hostname}
        except Exception as e:
            return {"valid": False, "reason": f"SSL Handshake failed: {str(e)}"}

    @staticmethod
    def check_domain_age(url):
        parsed = urlparse(url)
        domain = parsed.netloc.split(':')[0]
        try:
            import concurrent.futures
            def _do_whois():
                return whois.whois(domain)

            # Cap the WHOIS lookup at 3 seconds as it can hang indefinitely
            with concurrent.futures.ThreadPoolExecutor(max_workers=1) as executor:
                future = executor.submit(_do_whois)
                w = future.result(timeout=3)
                
            creation_date = w.creation_date
            if isinstance(creation_date, list):
                creation_date = creation_date[0]
            
            if creation_date:
                age = (datetime.now() - creation_date).days
                return {"age_days": age, "created": creation_date.isoformat()}
            return {"age_days": 999, "reason": "No creation date found"}
        except Exception as e:
            return {"age_days": 365, "reason": f"WHOIS failed or timed out: {str(e)}"}
