# main.py

from uagents import Bureau
from agents.location_agent import location_agent
from test_location_agent import test_agent
from agents.notification_agent import notification_agent

# Create a Bureau
bureau = Bureau(port=8000)

# Add agents
bureau.add(location_agent)
bureau.add(test_agent)
bureau.add(notification_agent)

if __name__ == "__main__":
    print("[Main] Starting all agents...")
    bureau.run()
