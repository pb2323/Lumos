# Protocols for LumosCare Agents
from uagents import Protocol, Model

# Location Update Message (already there)
class LocationUpdateMessage(Model):
    latitude: float
    longitude: float
    patient_id: str

# NEW: Alert Message for sending alerts to NotificationAgent
class AlertMessage(Model):
    patient_id: str
    message: str
    priority: str
    timestamp: str

# Protocols
_location_protocol = None
_alert_protocol = None

# Singleton for LocationUpdates
def get_location_protocol():
    global _location_protocol
    if _location_protocol is None:
        _location_protocol = Protocol("LocationUpdates")
    return _location_protocol

# Singleton for AlertProtocol
def get_alert_protocol():
    global _alert_protocol
    if _alert_protocol is None:
        _alert_protocol = Protocol("AlertProtocol")
    return _alert_protocol

# Export singleton instances
location_protocol = get_location_protocol()
alert_protocol = get_alert_protocol()
