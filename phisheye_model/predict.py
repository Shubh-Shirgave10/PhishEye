import joblib
from urllib.parse import urlparse
import re
from Levenshtein import distance as levenshtein_distance
import pandas as pd

print("Program started")

# load trained model
model = joblib.load("phishing_model.pkl")
def extract_features(url):

    features = []

    # Existing features
    features.append(len(url))        # URL length
    features.append(url.count('.'))  # Number of dots
    features.append(url.count('/'))  # Number of slashes
    features.append(1 if '@' in url else 0)
    features.append(1 if 'https' in url else 0)

    # New features
    parsed_url = urlparse(url)
    domain = parsed_url.netloc

    # Check if domain contains suspicious keywords
    suspicious_keywords = ['login', 'verify', 'account', 'update', 'secure']
    features.append(1 if any(keyword in domain for keyword in suspicious_keywords) else 0)

    # Check if domain uses an IP address
    features.append(1 if re.match(r'\b(?:\d{1,3}\.){3}\d{1,3}\b', domain) else 0)

    # Check for domain similarity using Levenshtein distance with a stricter threshold
    legitimate_domains = ['instagram.com', 'facebook.com', 'google.com']
    min_distance = min(levenshtein_distance(domain, legit) for legit in legitimate_domains)
    similarity_threshold = 3  # Stricter threshold for typosquatting
    features.append(1 if min_distance <= similarity_threshold else 0)

    return features


url = input("Enter URL to check: ")

features = extract_features(url)

prediction = model.predict([features])

if prediction[0] == 1:
    print("⚠ Phishing Website")
else:
    print("✅ Safe Website")

def test_model():
    test_data = pd.read_csv("test_dataset.csv")
    
    for index, row in test_data.iterrows():
        url = row['url']
        true_label = row['label']
        
        features = extract_features(url)
        prediction = model.predict([features])[0]
        
        result = "Correct" if prediction == true_label else "Incorrect"
        print(f"URL: {url}, Prediction: {'Safe' if prediction == 1 else 'Suspicious'}, True Label: {'Safe' if true_label == 1 else 'Suspicious'}, Result: {result}")

# Run the test
test_model()