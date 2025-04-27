# test_location_agent.py
import asyncio
from uagents import Agent, Context
from agents.location_agent import location_agent
from agents.protocols import location_protocol, LocationUpdateMessage

# Create a test agent
test_agent = Agent(
    name="TestDevice",
    seed="lumoscare_test_device",
    port=8003,
    endpoint="http://127.0.0.1:8003"
)

# Steps to simulate
steps = [
    {"latitude": 34.0522, "longitude": -118.2437, "patient_id": "Robin"},
    {"latitude": 34.0611, "longitude": -118.2503, "patient_id": "Andrew"},
    {"latitude": 34.0531, "longitude": -118.2445, "patient_id": "John"},
    # {"latitude": 34.0550, "longitude": -118.2460, "patient_id": "test_patient_123"},
]

# Track step index
step_index = 0
all_steps_sent = False

@test_agent.on_event("startup")
async def on_startup(ctx: Context):
    print("[TestDevice] Agent started")

@test_agent.on_interval(period=3.0)  # Send every 3 seconds
async def send_location_update(ctx: Context):
    global step_index, all_steps_sent

    if step_index < len(steps):
        location = steps[step_index]
        print(f"Step {step_index+1}: Sending location {location['latitude']}, {location['longitude']}")

        message = LocationUpdateMessage(
            latitude=location["latitude"],
            longitude=location["longitude"],
            patient_id=location["patient_id"]
        )

        await ctx.send(
            location_agent.address,   # Receiver address
            message                    # Message object
        )
        print(f"Step {step_index+1} sent.")

        step_index += 1
    elif not all_steps_sent:
        print("All steps sent. Agent will continue running.")
        all_steps_sent = True

# Include protocol
test_agent.include(location_protocol)

if __name__ == "__main__":
    test_agent.run()
