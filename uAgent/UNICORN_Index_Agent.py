from uagents import Agent, Context
import aiohttp
import asyncio
import os
from dotenv import load_dotenv
import requests
import json

# Load environment variables
load_dotenv()

# instantiate agent
agent = Agent(
    name="UNICORN_Index_Agent",
    seed="unicorn_index_fund_secret_seed",
    port=8000,
    endpoint=["http://localhost:8000/submit"]
)

# Main prompt from constants.ts
MAIN_PROMPT = """You are a professional crypto asset strategist managing the UNICORN index, a basket of selected crypto tokens.

You will be provided with the following:
1. **Market Conditions** – High-level macro or crypto-specific market insights (e.g., BTC trend, ETH gas fees, regulatory news, risk appetite).
2. **Token Universe** – A list of tokens in the UNICORN index, along with their current data: market cap, liquidity, 7-day price change, volatility, and any fundamentals.
3. **Current Index Composition** – The current weight distribution of tokens in the UNICORN index.

Your task:
Evaluate the data and provide a rebalancing signal for each token using a `REBALANCE_INDEX` value, which reflects your conviction to buy, hold, or sell each asset.

Instructions:
- Return a **JSON object only** that contains each token symbol as a key, and a number from **-1 to 1** as the value.
    - `-1` = strong sell
    - `0` = hold
    - `1` = strong buy
- These values represent **strategic rebalancing intent** over a **3-year investment horizon**.
- You are only allowed to trade among the tokens already in the index (no new assets).
- **Do not include explanations, reasoning, or any text outside of the JSON object.**

---

**Market Conditions:**  
{market_conditions}
**Token Universe:**  
{token_universe}
**Current Index Composition:**  
{current_index_composition}

---
⚠️ Final Output:
Return a single valid JSON object like below (with your suggested `REBALANCE_INDEX` values):

```json
{{
  "AAVE": 0.3,
  "UNI": -0.2,
  "MKR": 0.0,
  ...
}}
```
"""

# Function to fetch data from API endpoint
async def fetch_data_from_api(ctx: Context):
    """Fetch data from the local API endpoint"""
    try:
        async with aiohttp.ClientSession() as session:
            async with session.get("http://localhost:3000/api/fetch-data") as response:
                if response.status == 200:
                    data = await response.json()
                    # ctx.logger.info(f"Successfully fetched data: {data}")
                    return data
                else:
                    ctx.logger.error(f"Failed to fetch data. Status: {response.status}")
                    return None
    except Exception as e:
        ctx.logger.error(f"Error fetching data from API: {str(e)}")
        return None

# Function to call AS1 API with the data
async def analyze_with_as1(ctx: Context, api_data):
    """Analyze the API data using AS1 API"""
    try:
        # Get AS1 API key from environment
        as1_api_key = os.getenv("ASI_ONE_API_KEY")
        if not as1_api_key:
            ctx.logger.error("ASI_ONE_API_KEY not found in environment variables")
            return None
        
        # Prepare the prompt with the API data
        # Handle the case where api_data might be a list or dict
        if isinstance(api_data, list):
            # If it's a list of tokens, use it as token universe
            token_universe = api_data
            market_conditions = "Current market conditions data"
            current_index_composition = "Equal weight distribution"  # Default assumption
        else:
            # If it's a dict, extract the fields
            token_universe = api_data.get("token_universe", api_data)
            market_conditions = api_data.get("market_conditions", "Current market conditions data")
            current_index_composition = api_data.get("current_index_composition", "Equal weight distribution")
        
        formatted_prompt = MAIN_PROMPT.format(
            market_conditions=market_conditions,
            token_universe=json.dumps(token_universe, indent=2),
            current_index_composition=json.dumps(current_index_composition, indent=2)
        )
        
        ctx.logger.info("Sending data to AS1 API for analysis...")
        
        # Prepare AS1 API request
        url = "https://api.asi1.ai/v1/chat/completions"
        
        payload = json.dumps({
            "model": "asi1-mini",
            "messages": [
                {
                    "role": "system",
                    "content": "You are a professional crypto asset strategist. Return only valid JSON as requested."
                },
                {
                    "role": "user",
                    "content": formatted_prompt
                }
            ],
            "temperature": 0.7,
            "stream": False,
            "max_tokens": 1000
        })
        
        headers = {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Authorization': f'Bearer {as1_api_key}'
        }
        
        # Make AS1 API request
        response = requests.post(url, headers=headers, data=payload)
        
        if response.status_code == 200:
            response_data = response.json()
            analysis_result = response_data['choices'][0]['message']['content'].strip()
            ctx.logger.info(f"AS1 Analysis Result: {analysis_result}")
            
            # Try to parse as JSON to validate
            try:
                # Extract JSON from markdown code block if present
                if '```' in analysis_result:
                    json_str = analysis_result.split('```')[1]
                    if json_str.startswith('json'):
                        json_str = json_str[4:].strip()
                    parsed_result = json.loads(json_str)
                else:
                    parsed_result = json.loads(analysis_result)
                    
                ctx.logger.info("Successfully parsed AS1 response as JSON")
                return parsed_result
            except (json.JSONDecodeError, IndexError):
                ctx.logger.error("AS1 response is not valid JSON")
                return analysis_result
        else:
            ctx.logger.error(f"AS1 API request failed. Status: {response.status_code}, Response: {response.text}")
            return None
        
    except Exception as e:
        ctx.logger.error(f"Error calling AS1 API: {str(e)}")
        return None

# startup handler
@agent.on_event("startup")
async def startup_function(ctx: Context):
    ctx.logger.info(f"Hello, I'm agent {agent.name} and my address is {agent.address}.")
    ctx.logger.info("UNICORN Index Agent is ready to manage multichain index fund operations!")
    
    # Fetch data from API on startup
    ctx.logger.info("Fetching initial data from API...")
    api_data = await fetch_data_from_api(ctx)
    
    if api_data:
        # Analyze the data with AS1
        analysis_result = await analyze_with_as1(ctx, api_data)
        if analysis_result:
            ctx.logger.info("=== REBALANCING RECOMMENDATION ===")
            ctx.logger.info(f"Analysis Result: {analysis_result}")
        else:
            ctx.logger.error("Failed to get analysis from AS1")
    else:
        ctx.logger.error("Failed to fetch data from API")

# Commented out periodic fetching as requested
# @agent.on_interval(period=30.0)
# async def periodic_data_fetch(ctx: Context):
#     ctx.logger.info("Performing periodic data fetch...")
#     await fetch_data_from_api(ctx)

if __name__ == "__main__":
    agent.run() 