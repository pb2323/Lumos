# main.py

from uagents import Bureau
from agents.location_agent import location_agent
from test_location_agent import test_agent
from agents.notification_agent import notification_agent
from agents.phone_call_agent import phone_call_agent
from test_phone_call_agent import test_agent as phone_test_agent

# Create a Bureau with proper endpoint configuration
bureau = Bureau(
    port=8001,
    endpoint=["http://127.0.0.1:8001"]
)

# Add agents
bureau.add(location_agent)
bureau.add(test_agent)
bureau.add(notification_agent)
bureau.add(phone_call_agent)
# bureau.add(phone_test_agent)

if __name__ == "__main__":
    print("[Main] Starting all agents...")
    bureau.run()
