# agents/notification_agent.py

from uagents import Agent, Context
from agents.protocols import alert_protocol, AlertMessage

# Create the NotificationAgent
notification_agent = Agent(
    name="NotificationAgent",
    seed="your_unique_seed_phrase_for_notification_agent",  # Change to anything
    port=8004,
    endpoint="http://127.0.0.1:8004"
)

# Handler for receiving AlertMessage
@notification_agent.on_message(model=AlertMessage)
async def handle_alert(ctx: Context, sender: str, msg: AlertMessage):
    print("\n[NotificationAgent] 📢 Received alert from LocationTracker")
    print(f"[NotificationAgent] Alert for Patient ID: {msg.patient_id}")
    print(f"[NotificationAgent] Message: {msg.message}")
    print(f"[NotificationAgent] Priority: {msg.priority}")
    print(f"[NotificationAgent] Timestamp: {msg.timestamp}")

    ctx.logger.info(f"Notification sent to caregiver for Patient ID {msg.patient_id}: {msg.message}")

# Register the protocol
notification_agent.include(alert_protocol)

# For testing separately
if __name__ == "__main__":
    notification_agent.run()
