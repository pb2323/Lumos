# agents/notification_agent.py
from uagents import Agent, Context
import json
import os
from dotenv import load_dotenv
from datetime import datetime
from agents.protocols import alert_protocol, AlertMessage, phone_call_protocol, PhoneCallMessage
import requests

# Load environment variables
load_dotenv()

# Get healthcare service URL from environment or use default
HEALTHCARE_SERVICE_URL = os.getenv('HEALTHCARE_SERVICE_URL', 'http://localhost:3000')
PATIENT_PHONE_NUMBER = os.getenv('PATIENT_PHONE_NUMBER', '+16693407283')
MOBILE_ALERT_API_URL = os.getenv('MOBILE_ALERT_API_URL', 'https://28ad-164-67-70-232.ngrok-free.app/api/alerts')

# Create the notification agent
notification_agent = Agent(
    name="NotificationAgent",
    seed="your_unique_seed_phrase_for_notification_agent",
    port=8004,
    endpoint="http://127.0.0.1:8004"
)

# Function to send alert to mobile app notification API
def send_alert_to_mobile_api(alert_data):
    try:
        response = requests.post(MOBILE_ALERT_API_URL, json=alert_data)
        if response.status_code == 200:
            print(f"[NotificationAgent] Successfully sent alert to mobile API: {response.json()}")
        else:
            print(f"[NotificationAgent] Failed to send alert to mobile API: {response.status_code} {response.text}")
    except Exception as e:
        print(f"[NotificationAgent] Error sending alert to mobile API: {e}")

@notification_agent.on_message(model=AlertMessage)
async def handle_alert(ctx: Context, sender: str, msg: AlertMessage):
    print(f"\n[NotificationAgent] Received alert from {sender}")
    print(f"[NotificationAgent] Alert details: {msg.model_dump()}")
    
    # Process the alert
    print(f"[NotificationAgent] Processing alert for patient {msg.patient_id}")
    print(f"[NotificationAgent] Priority: {msg.priority}")
    print(f"[NotificationAgent] Message: {msg.message}")
    
    # Log the alert
    alert_log = {
        "timestamp": datetime.now().isoformat(),
        "patient_id": msg.patient_id,
        "message": msg.message,
        "priority": msg.priority,
        "status": "processed"
    }
    
    print(f"[NotificationAgent] Alert log: {json.dumps(alert_log, indent=2)}")
    
    # For high priority alerts, make a phone call and send to mobile API
    if msg.priority == "high":
        print(f"[NotificationAgent] High priority alert detected, initiating phone call and sending to mobile app...")
        
        # Send alert to mobile app notification API
        mobile_alert_payload = {
            "patient_id": msg.patient_id,
            "type": msg.priority,
            "title": msg.message,
            "description": msg.message
        }
        send_alert_to_mobile_api(mobile_alert_payload)
        
        try:
            # Forward to healthcare service for Twilio integration
            healthcare_service_url = f"{HEALTHCARE_SERVICE_URL}/api/make-call"
            payload = {
                "patientId": msg.patient_id,
                "phoneNumber": PATIENT_PHONE_NUMBER,
                "message": f"EMERGENCY ALERT: {msg.message}",
                "priority": "high"
            }
            
            print(f"[NotificationAgent] Forwarding to healthcare service at {healthcare_service_url}")
            print(f"[NotificationAgent] Payload: {payload}")
            
            response = requests.post(healthcare_service_url, json=payload)
            
            if response.status_code == 200:
                print(f"[NotificationAgent] Successfully initiated emergency call")
                print(f"[NotificationAgent] Response: {response.json()}")
            else:
                print(f"[NotificationAgent] Failed to initiate emergency call: {response.status_code}")
                print(f"[NotificationAgent] Response: {response.text}")
                
        except Exception as e:
            print(f"[NotificationAgent] ❌ Error making emergency call: {str(e)}")
            print(f"[NotificationAgent] Service URL: {healthcare_service_url}")

# Register the protocol
notification_agent.include(alert_protocol)

# For testing purposes
if __name__ == "__main__":
    notification_agent.run()