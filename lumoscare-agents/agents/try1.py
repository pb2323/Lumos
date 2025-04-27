from uagents import Agent, Context, Model

# Data model (envolope) which you want to send from one agent to another
class Message(Model):
    message : str
    field : int

my_first_agent = Agent(
    name = 'My First Agent',
    port = 5050,
    endpoint = ['http://localhost:5050/submit']
)

second_agent = 'your_second_agent_address'

@my_first_agent.on_event('startup')
async def startup_handler(ctx : Context):
    ctx.logger.info(f'My name is {ctx.agent.name} and my address  is {ctx.agent.address}')
    await ctx.send(second_agent, Message(message = 'Hi Second Agent, this is the first agent.'))

if __name__ == "__main__":
    my_first_agent.run()