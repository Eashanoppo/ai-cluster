import os
import sys
import time
import django
import pandas as pd
from sklearn.ensemble import IsolationForest
import warnings
warnings.filterwarnings('ignore')

# Setup Django ORM context
backend_path = os.path.abspath(os.path.join(os.path.dirname(__file__), '../backend'))
sys.path.append(backend_path)
os.chdir(backend_path)  # Fix: Change working directory so load_dotenv() and sqlite find the right files
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'neuronops.settings')
django.setup()

from telemetry.models import GpuTelemetry
from sentinel.models import Prediction, Alert
from simulator.models import SimulationRun
from django.utils import timezone
from datetime import timedelta

def run_anomaly_detection():
    print("[ML Anomaly Engine] Starting Isolation Forest detection...")
    
    while True:
        try:
            # Simulate PromQL: fetch last 60 seconds of telemetry
            cutoff = timezone.now() - timedelta(seconds=60)
            telemetry = GpuTelemetry.objects.filter(timestamp__gte=cutoff).values(
                'node_id', 'temperature_celsius', 'vram_usage_mb', 'gpu_utilization_percent', 'power_draw_watts'
            )
            
            if not telemetry:
                time.sleep(5)
                continue
                
            df = pd.DataFrame(list(telemetry))
            
            # Group by node to get latest stats
            latest = df.groupby('node_id').last().reset_index()
            features = ['temperature_celsius', 'power_draw_watts']
            
            if latest.empty or len(latest) < 5: # Need a minimum batch for isolation forest
                time.sleep(5)
                continue
                
            # Train Isolation Forest on current window
            model = IsolationForest(contamination=0.05, random_state=42)
            latest['anomaly_score'] = model.fit_predict(latest[features])
            latest['decision_function'] = model.decision_function(latest[features])
            
            anomalies = latest[latest['anomaly_score'] == -1]
            
            for _, row in anomalies.iterrows():
                node = row['node_id']
                temp = row['temperature_celsius']
                
                # If thermal runaway detected
                if temp > 85.0:
                    print(f"[ML Anomaly Engine] WARNING: Anomaly detected on {node}! Temp: {temp}C")
                    
                    # Create Alert
                    Alert.objects.get_or_create(
                        node_id=node,
                        severity='critical',
                        defaults={
                            'message': f'Critical Thermal Anomaly Predicted via Isolation Forest: {temp}C',
                            'is_resolved': False
                        }
                    )
                    
                    # Generate Prediction for Scheduler
                    Prediction.objects.get_or_create(
                        node_id=node,
                        metric='temperature',
                        defaults={
                            'predicted_value': 95.0,
                            'probability_percent': 91.0,
                            'time_to_failure_sec': 12
                        }
                    )
            
            time.sleep(5)
            
        except Exception as e:
            print(f"Error in ML Engine: {e}")
            time.sleep(5)

if __name__ == "__main__":
    run_anomaly_detection()
