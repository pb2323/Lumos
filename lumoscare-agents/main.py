# main.py

from uagents import Bureau
from agents.location_agent import location_agent
from test_location_agent import test_agent

# Create a bureau to manage both agents
bureau = Bureau()
bureau.add(location_agent)
bureau.add(test_agent)

if __name__ == "__main__":
    print("[Main] Starting both agents...")
    bureau.run()
