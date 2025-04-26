# main.py

from uagents import Bureau
from agents.location_agent import location_agent
from test_location_agent import test_agent
from agents.notification_agent import notification_agent  # NEW

# Create a Bureau
bureau = Bureau()
bureau.add(location_agent)
bureau.add(test_agent)
bureau.add(notification_agent)  # Add new agent

if __name__ == "__main__":
    print("[Main] Starting all agents...")
    bureau.run()
