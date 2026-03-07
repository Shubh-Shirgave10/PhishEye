import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score
import joblib
from urllib.parse import urlparse
import re
from Levenshtein import distance as levenshtein_distance

# Load dataset
data = pd.read_csv("combined_phishing_urls.csv")

# Feature extraction
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
    min_dist = 99
    if domain:
        distances = [levenshtein_distance(domain.lower(), legit) for legit in legitimate_domains]
        if distances:
            min_dist = min(distances)
    
    similarity_threshold = 3  # Stricter threshold for typosquatting
    features.append(1 if min_dist <= similarity_threshold else 0)

    return features

X = []
y = []

for index,row in data.iterrows():

    url = row['url']
    label = row['label']
    features = extract_features(url)

    X.append(features)
    y.append(label)

# Split data
X_train,X_test,y_train,y_test = train_test_split(X,y,test_size=0.2)

# Train model
model = RandomForestClassifier()
model.fit(X_train,y_train)

# Test model
pred = model.predict(X_test)
print("Accuracy:",accuracy_score(y_test,pred))

# Save model
joblib.dump(model,"phishing_model.pkl")