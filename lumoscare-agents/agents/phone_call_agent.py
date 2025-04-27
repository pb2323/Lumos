# agents/phone_call_agent.py
from uagents import Agent, Context
import json
import os
from dotenv import load_dotenv
from datetime import datetime
from agents.protocols import phone_call_protocol, PhoneCallMessage
import requests

# Load environment variables
load_dotenv()

# Get healthcare service URL from environment or use default
HEALTHCARE_SERVICE_URL = os.getenv('HEALTHCARE_SERVICE_URL', 'http://localhost:3000')

# Create the phone call agent
phone_call_agent = Agent(
    name="PhoneCaller",
    seed="your_unique_seed_phrase_for_phone_call_agent",
    port=8005,
    endpoint="http://127.0.0.1:8005"
)

@phone_call_agent.on_message(model=PhoneCallMessage)
async def handle_phone_call(ctx: Context, sender: str, msg: PhoneCallMessage):
    print(f"\n[PhoneCallAgent] Protocol received message from {sender}")
    print(f"[PhoneCallAgent] Message type: {type(msg)}")
    print(f"[PhoneCallAgent] Message content: {msg.model_dump()}")
    
    # Extract call data
    patient_id = msg.patient_id
    phone_number = msg.phone_number
    message = msg.message
    priority = msg.priority
    
    print(f"[PhoneCallAgent] Making phone call:")
    print(f"  Patient ID: {patient_id}")
    print(f"  Phone Number: {phone_number}")
    print(f"  Message: {message}")
    print(f"  Priority: {priority}")
    
    try:
        # Forward to healthcare service for Twilio integration
        healthcare_service_url = f"{HEALTHCARE_SERVICE_URL}/api/make-call"
        payload = {
            "patientId": patient_id,
            "phoneNumber": phone_number,
            "message": message,
            "priority": priority
        }
        
        print(f"[PhoneCallAgent] Forwarding to healthcare service at {healthcare_service_url}")
        print(f"[PhoneCallAgent] Payload: {payload}")
        
        response = requests.post(healthcare_service_url, json=payload)
        
        if response.status_code == 200:
            print(f"[PhoneCallAgent] Successfully initiated call through healthcare service")
            print(f"[PhoneCallAgent] Response: {response.json()}")
        else:
            print(f"[PhoneCallAgent] Failed to initiate call: {response.status_code}")
            print(f"[PhoneCallAgent] Response: {response.text}")
            
    except Exception as e:
        print(f"[PhoneCallAgent] ❌ Error making phone call: {str(e)}")
        print(f"[PhoneCallAgent] Service URL: {healthcare_service_url}")

# Register the protocol
phone_call_agent.include(phone_call_protocol)

# For testing purposes
if __name__ == "__main__":
    phone_call_agent.run() 