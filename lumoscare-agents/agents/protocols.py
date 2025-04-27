# Protocols for LumosCare Agents
from uagents import Protocol, Model
from datetime import datetime
from pydantic import Field

# Message Models
class LocationUpdateMessage(Model):
    latitude: float
    longitude: float
    patient_id: str

class AlertMessage(Model):
    patient_id: str
    message: str
    priority: str
    timestamp: str

class PhoneCallMessage(Model):
    patient_id: str
    phone_number: str
    message: str
    priority: str  # "high", "medium", "low"
    timestamp: str = datetime.now().isoformat()

# Create protocols
location_protocol = Protocol("LocationUpdates")
alert_protocol = Protocol("AlertProtocol")
phone_call_protocol = Protocol("PhoneCallProtocol")
