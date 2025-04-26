# agents/location_agent.py
from uagents import Agent, Context
from uagents.setup import fund_agent_if_low
import json
import os
from dotenv import load_dotenv
from .protocols import location_protocol, LocationUpdateMessage
from datetime import datetime

# Load environment variables
load_dotenv()

# Create the location tracking agent
location_agent = Agent(
    name="LocationTracker",
    seed="your_unique_seed_phrase_for_location_agent",  # Replace with a unique seed phrase
    port=8002,
    endpoint="http://127.0.0.1:8002"
)

# Fund the agent
fund_agent_if_low(location_agent.wallet.address())

# Define patient's safe zones (in a real app, this would come from a database)
safe_zones = [
    {
        "name": "Home",
        "center": {"latitude": 34.0522, "longitude": -118.2437},  # Example coordinates (LA)
        "radius": 100  # in meters
    },
    {
        "name": "Doctor's Office",
        "center": {"latitude": 34.0610, "longitude": -118.2501},  # Example coordinates
        "radius": 50  # in meters
    }
]

# Function to check if a location is within any safe zone
def is_within_safe_zones(latitude, longitude):
    from math import sin, cos, sqrt, atan2, radians
    
    # Function to calculate distance between two points
    def calculate_distance(lat1, lon1, lat2, lon2):
        # Approximate radius of earth in meters
        R = 6371e3
        
        lat1_rad = radians(lat1)
        lon1_rad = radians(lon1)
        lat2_rad = radians(lat2)
        lon2_rad = radians(lon2)
        
        dlon = lon2_rad - lon1_rad
        dlat = lat2_rad - lat1_rad
        
        a = sin(dlat/2)**2 + cos(lat1_rad) * cos(lat2_rad) * sin(dlon/2)**2
        c = 2 * atan2(sqrt(a), sqrt(1-a))
        
        distance = R * c
        return distance
    
    # Check each safe zone
    for zone in safe_zones:
        zone_lat = zone["center"]["latitude"]
        zone_lon = zone["center"]["longitude"]
        distance = calculate_distance(latitude, longitude, zone_lat, zone_lon)
        
        if distance <= zone["radius"]:
            return True, zone["name"]
    
    return False, None

@location_agent.on_message(model=LocationUpdateMessage)
async def handle_location_update(ctx: Context, sender: str, msg: LocationUpdateMessage):
    print(f"\n[LocationAgent] Protocol received message from {sender}")
    print(f"[LocationAgent] Message type: {type(msg)}")
    print(f"[LocationAgent] Message content: {msg.model_dump()}")
    
    # Extract location data
    latitude = msg.latitude
    longitude = msg.longitude
    patient_id = msg.patient_id
    print(f"[LocationAgent] Received location update from {sender}")
    print(f"[LocationAgent] Patient ID: {patient_id}, Location: {latitude}, {longitude}")
    
    # Check if location is within safe zones
    within_safe_zone, zone_name = is_within_safe_zones(latitude, longitude)
    
    if within_safe_zone:
        print(f"[LocationAgent] ✅ Patient {patient_id} is within safe zone: {zone_name}")
        ctx.logger.info(f"Patient {patient_id} is within safe zone: {zone_name}")
    else:
        print(f"[LocationAgent] ⚠️ ALERT: Patient {patient_id} has left all safe zones!")
        ctx.logger.warning(f"ALERT: Patient {patient_id} has left all safe zones!")
        
        # Prepare alert data for caregiver
        alert_data = {
            "alert_type": "location",
            "patient_id": patient_id,
            "message": f"Patient has left all safe zones. Current coordinates: {latitude}, {longitude}",
            "priority": "high",
            "timestamp": datetime.now().isoformat()  # Use ISO format for timestamps
        }
        
        # In a real implementation, this would send a message to the caregiver agent
        # For now, we'll just log it
        print(f"[LocationAgent] Alert data: {json.dumps(alert_data, indent=2)}")
        ctx.logger.info(f"Alert data: {json.dumps(alert_data)}")

# Register the protocol
location_agent.include(location_protocol)

# For testing purposes
if __name__ == "__main__":
    location_agent.run()