from uagents import Protocol, Model

# Define a Pydantic model for the location update message
class LocationUpdateMessage(Model):
    latitude: float
    longitude: float
    patient_id: str

# Create a single protocol instance at module level
_location_protocol = None

def get_location_protocol():
    global _location_protocol
    if _location_protocol is None:
        _location_protocol = Protocol("LocationUpdates")
        print(f"[Protocol] Created new protocol instance: {_location_protocol.name}")
    return _location_protocol

# Export the singleton protocol instance
location_protocol = get_location_protocol()
print(f"[Protocol] Exported protocol instance: {location_protocol.name}") 