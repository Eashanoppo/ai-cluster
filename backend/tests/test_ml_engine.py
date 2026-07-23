import pytest
from django.utils import timezone
from datetime import timedelta
import numpy as np
from sklearn.ensemble import IsolationForest

def test_isolation_forest_logic():
    # Test that IsolationForest successfully identifies anomalies in mock data
    
    # Generate mock normal telemetry (Temp: 40-60, Util: 10-50, Power: 100-200)
    features = []
    for _ in range(50):
        features.append([np.random.uniform(40, 60), np.random.uniform(10, 50), np.random.uniform(100, 200)])
        
    # Inject one obvious anomaly (Temp: 95, Util: 100, Power: 350)
    features.append([95.0, 100.0, 350.0])
    
    X = np.array(features)
    iso = IsolationForest(contamination=0.1, random_state=42)
    predictions = iso.fit_predict(X)
    
    # The last element should be an anomaly (-1)
    assert predictions[-1] == -1, "IsolationForest failed to detect the injected anomaly"
