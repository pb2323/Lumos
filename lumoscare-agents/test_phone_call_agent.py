# test_phone_call_agent.py
import asyncio
from uagents import Agent, Context
from agents.phone_call_agent import phone_call_agent
from agents.protocols import phone_call_protocol, PhoneCallMessage

# Create a test agent
test_agent = Agent(
    name="TestCaller",
    seed="lumoscare_test_caller",
    port=8006,
    endpoint="http://127.0.0.1:8006"
)

# Test cases
test_calls = [
    {
        "patient_id": "test_patient_1",
        "phone_number": "+16693407283",
        "message": "Emergency: You have left your safe zone!",
        "priority": "high"
    },
    {
        "patient_id": "test_patient_2",
        "phone_number": "+16693407283",
        "message": "Time for your daily wellness check",
        "priority": "medium"
    },
    {
        "patient_id": "test_patient_3",
        "phone_number": "+16693407283",
        "message": "Don't forget to take your medication",
        "priority": "low"
    }
]

# Track test index
test_index = 0
all_tests_sent = False

@test_agent.on_event("startup")
async def on_startup(ctx: Context):
    print("[TestCaller] Agent started")

@test_agent.on_interval(period=5.0)  # Send every 5 seconds
async def send_phone_call(ctx: Context):
    global test_index, all_tests_sent

    if test_index < len(test_calls):
        call_data = test_calls[test_index]
        print(f"Test {test_index+1}: Sending phone call to {call_data['phone_number']}")

        message = PhoneCallMessage(
            patient_id=call_data["patient_id"],
            phone_number=call_data["phone_number"],
            message=call_data["message"],
            priority=call_data["priority"]
        )

        await ctx.send(
            phone_call_agent.address,   # Receiver address
            message                    # Message object
        )
        print(f"Test {test_index+1} sent.")

        test_index += 1
    elif not all_tests_sent:
        print("All tests sent. Agent will continue running.")
        all_tests_sent = True

# Include protocol
test_agent.include(phone_call_protocol)

if __name__ == "__main__":
    test_agent.run() 