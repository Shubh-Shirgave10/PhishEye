import joblib
from urllib.parse import urlparse
import re
from Levenshtein import distance as levenshtein_distance

def extract_features(url):
    features = []
    features.append(len(url))
    features.append(url.count('.'))
    features.append(url.count('/'))
    features.append(1 if '@' in url else 0)
    features.append(1 if 'https' in url else 0)
    parsed_url = urlparse(url)
    domain = parsed_url.netloc
    suspicious_keywords = ['login', 'verify', 'account', 'update', 'secure']
    features.append(1 if any(keyword in domain for keyword in suspicious_keywords) else 0)
    features.append(1 if re.match(r'\b(?:\d{1,3}\.){3}\d{1,3}\b', domain) else 0)
    legitimate_domains = ['instagram.com', 'facebook.com', 'google.com']
    min_dist = 99
    if domain:
        distances = [levenshtein_distance(domain.lower(), legit) for legit in legitimate_domains]
        if distances:
            min_dist = min(distances)
    similarity_threshold = 3
    features.append(1 if min_dist <= similarity_threshold else 0)
    return features

if __name__ == '__main__':
    model = joblib.load('phisheye_model/phishing_model.pkl')
    # Safe URL
    ex_features = extract_features('https://www.google.com')
    print('Safe URL Prediction (google):', model.predict([ex_features]))
    # Malicious URL from dataset (0 is phishing)
    bad_url = 'http://www.f0519141.xsph.ru'
    bad_features = extract_features(bad_url)
    print('Malicious URL Prediction:', model.predict([bad_features]))
