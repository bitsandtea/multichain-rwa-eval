Skip to main content
Innovation Lab Logo
Resources
Blog
1.0.4
GitHub
SDK
Introduction
Agent Creation
uAgent Creation
uAgents Adapters
Agent Communication
uAgent to uAgent Communication
Agent Chat Protocol
Agent Transaction
Agentverse
ASI:One
MCP Integration
Examples
Agent CreationuAgent Creation
Version: 1.0.4
Build and understand uAgents
uAgents is a lightweight Python package designed to help you deploy microservices. These microservices can then be utilized by your AI agents as tools for executing tasks and achieving defined objectives.

Installing uAgents framework
Fetch.ai's uAgents Framework package is a Python library running on Ubuntu/Debian, macOS, and Windows systems.

On your computer, you may need to install:

Python 3.8+
PIP - Python package manager.
uAgents library
Install with Pip
Create a directory :
mkdir my_agents_project
cd my_agents_project

Initialize and activate a virtual environment:
python -m venv venv

Install Fetch.ai uagents library:
pip install uagents

Verify the installation:
pip show uagents

Create your first uAgent
Once you've installed the uAgents library, it's quite simple to get a minimal use case running.

The uAgent
Create a Python script:
touch my_first_agent.py

Import the necessary classes and instantiate your agent:
from uagents import Agent, Context

# instantiate agent

agent = Agent(
name="alice",
seed="secret_seed_phrase",
port=8000,
endpoint=["http://localhost:8000/submit"]
)

# startup handler

@agent.on_event("startup")
async def startup_function(ctx: Context):
ctx.logger.info(f"Hello, I'm agent {agent.name} and my address is {agent.address}.")

if **name** == "**main**":
agent.run()

Agent parameters:

name: Identifies the agent (here, “alice”).
seed: Sets a deterministic seed, generating fixed addresses each time.
port and endpoint: Configure where the agent will be available.
Behavior on startup:

The @agent.on_event("startup") decorator sets a function that runs as soon as the agent launches. In this sample, the agent logs a message including its name and unique address.

Run your agent
With your virtual environment activated, run the script:

python my_first_agent.py

Sample output
INFO: [alice]: Registration on Almanac API successful
INFO: [alice]: Registering on almanac contract...
INFO: [alice]: Registering on almanac contract...complete
INFO: [alice]: Agent inspector available at https://Agentverse.ai/inspect/?uri=http%3A//127.0.0.1%3A8000&address=agent1q...
INFO: [alice]: Starting server on http://0.0.0.0:8000 (Press CTRL+C to quit)
INFO: [alice]: Hello, I'm agent alice and my address is agent1q...

Ways to create uAgents
There are three main ways to create and deploy uAgents, each suited to different needs:

Hosted Agents
Local Agents
Mailbox Agents
Understanding these options will help you choose the best setup.

Hosted Agents
You can create and host agents directly on Agentverse:

Navigate to Agentverse → Agents tab → + New Agent.
new-agent

Choose Blank Agent or Skeleton Agent.

From a Blank Agent - You have to code everything.
From a Skeleton Agent - You will get one data model with one decorator each.
choose Blank Agent.

blank-agent

Provide a name for your new Agent.
tech-stack
After creation, click on the agent and then Build tab to open the embedded code editor.
blank-agent-created

Add your Python code (similar to the first_agent.py example).
blank-agent-code-start

Click Start to run the agent; logs appear in the terminal below the editor.
blank-agent-logs

note
Note: Hosted Agents support the full Python built-in library and specific third-party packages (like uagents, requests, openai, etc.). However, some libraries are restricted for security reasons. If you need additional packages, consider using Mailbox Agents.

Supported Libraries on Agentverse:
The Agentverse now provides full Python support! This means that all Hosted Agents will now support the full Python built-in library plus the following packages:

uagents
requests
cosmpy
pydantic
uagents-ai-engine
MySQLdb
pymongo
bs64
faiss-cpu
fetchai-babble
google-generativeai
langchain-anthropic
langchain-community
langchain-core
langchain-google-genai
langchain-google-vertexai
langchain-openai
langchain-text-splitters
langchain
nltk
openai
tenacity
unstructured
validators

Once you run an hosted agent, you don't have to bother about it's uptime. It will be always running.

Local Agents
Local Agents run entirely on your own machine or server, just like the example in my_first_agent.py. These agents:

Have complete freedom to import any Python library or custom modules.
Can handle events, messages, and tasks continuously.
Are registered on the Almanac contract, allowing them to communicate with other local agents.
Require you to manage uptime, environment dependencies, and scaling if necessary.
Lets setup a local agent.

local_agent.py
from uagents import Agent, Context, Model

class Message(Model):
message: str

SEED_PHRASE = "put_your_seed_phrase_here"

# Now your agent is ready to join the Agentverse!

agent = Agent(
name="alice",
port=8000,
seed=SEED_PHRASE,
endpoint=["http://localhost:8000/submit"]
)

# Copy the address shown below

print(f"Your agent's address is: {agent.address}")

if **name** == "**main**":
agent.run()

note
Use Case: Ideal for tasks requiring advanced customization, local file access, or extensive machine learning libraries.

Mailbox Agents
When you need to use libraries not allowed by the hosted environment, or you want direct local control while also integrating with Agentverse, you can set up a Mailbox Agent.

A Mailbox Agent runs locally but connects to the Agentverse via a secure channel, enabling interaction with other hosted or local agents. To configure this:

Lets setup a local agent first like we did in the section here but include mailbox=True.
mailbox_agent.py
from uagents import Agent, Context, Model

class Message(Model):
message: str

SEED_PHRASE = "put_your_seed_phrase_here"

# Now your agent is ready to join the Agentverse!

agent = Agent(
name="alice",
port=8000,
mailbox=True  
)

# Copy the address shown below

print(f"Your agent's address is: {agent.address}")

if **name** == "**main**":
agent.run()

Run the Script
You should get something similar within your terminal output:

INFO: [Alice]: Starting agent with address: agent1qw8jn3nfl2fyyhe7v4x8pfmsge4hs9zqrqw9eq7h7hluzmd0da8z7j0uacx
INFO: [Alice]: Agent inspector available at https://Agentverse.ai/inspect/?uri=http%3A//127.0.0.1%3A8000&address=agent1q0nrj45ah0e53424n9uqc83d9xxs6534jug7j6ka4z6wnrsx7ex2kwx86t4
INFO: [Alice]: Starting server on http://0.0.0.0:8002 (Press CTRL+C to quit)
INFO: [Alice]: Starting mailbox client for https://Agentverse.ai
INFO: [Alice]: Mailbox access token acquired
INFO: [Alice]: Registration on Almanac API successful
INFO: [Alice]: Registering on almanac contract...
INFO: [Alice]: Registering on almanac contract...complete

If you wish to publish your agent on the Agentverse, you can do so by adding the publish=True parameter while defining the agent.
Create a README.md file in the same directory as your agent script.

# Now your agent is ready to join the Agentverse!

agent = Agent(
name="alice",
port=8000,
mailbox=True,
publish_agent_details=True,
readme_path = "README.md"
)

This will publish the agent details like name, on the Agentverse.

Create a Mailbox in Agentverse
Now that we defined our local Agent and have successfully run it, we can go on and connect it to Agentverse via a Mailbox. To do so, make sure your Agent is running. Then, click on the Local Agent Inspector URL provided in your terminal output. You will be redirected towards the Inspector UI and will be able to see multiple details about this local Agent.

Here, click the Connect button.

mailbox-connect

You will be presented with 3 different choices: Mailbox, Proxy and Custom. Select Mailbox.

tech-stack
tech-stack
You will then see some code details available for the Agent. You do not need to do anything, just click on Finish.

You can see the agent details in the local agents and can try connecting it with other Agentverse agents using the on_message handler.

Previous
Introduction
Next
uAgents Adapters
Installing uAgents framework
Install with Pip
Create your first uAgent
The uAgent
Run your agent
Ways to create uAgents
Hosted Agents
Local Agents
Mailbox Agents
Resources
Innovation Lab
Fetch.ai
Agentverse
Projects
News
Events
Careers
Ambassador Innovator Club
Internship Incubator Program
Startup Accelerator
Discord
Linkedin
Blog
GitHub
© 2025 Fetch.ai Innovation Lab. All rights reserved.
agentverse-imgChat with us
