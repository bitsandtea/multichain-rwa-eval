from uagents import Agent, Context
import aiohttp
import asyncio
import os
from dotenv import load_dotenv
import requests
import json
import time
from web3 import Web3

# Load environment variables
load_dotenv()

# instantiate agent
agent = Agent(
    name="RWA_Valuator_Agent",
    seed="rwa_real_estate_valuator_seed",
    port=8000,
mailbox=True,
    endpoint=["http://localhost:8000/submit"]
)

# Target property for evaluation
TARGET_PROPERTY = {
  "property_id": "PROP001",
  "address": "7849 S Drexel Ave, Chicago, IL 60619",
  "valuation_usd": 290000,
  "size_sqm": 135,
  "default_risk_score": 75,
  "location_score": 80,
}

# Real Estate Expert Prompt
REAL_ESTATE_PROMPT = """You are a seasoned real estate investment expert with 25+ years of experience in property valuation, market analysis, and risk assessment. You have an exceptional eye for identifying great deals and understanding market dynamics across different neighborhoods and property types.

Your expertise includes:
- Advanced property valuation techniques using comparable sales, income approach, and cost approach
- Deep understanding of neighborhood trends, demographics, and future development plans
- Risk assessment including market volatility, liquidity risks, tenant default risks, and property-specific risks
- Market timing and investment opportunity identification
- Property condition assessment and maintenance cost projections

You will be provided with:
1. **Property Information** – Basic details about the property including address, current valuation, and size
2. **Zillow Data** – Market comparables, price history, neighborhood insights, and Zestimate information
3. **Rentcast Data** – Rental market analysis, rental comps, rental yield potential, and tenant demand metrics

Your task:
Analyze the provided data and generate an updated property valuation, default risk score, and location score.

Instructions:
- Return a **JSON object only** containing the updated property information.
- `valuation_usd`: Your expert valuation based on all available data (integer).
- `default_risk_score`: Risk assessment from 0 (lowest risk) to 100 (highest risk). Integer only.
- `location_score`: Location assessment from 0 (worst) to 100 (best). Integer only.
- Consider market conditions, comparable properties, rental potential, location factors, and any risk indicators.
- **Do not include explanations, reasoning, or any text outside of the JSON object.**

---

**Property Information:**
{property_info}

**Zillow Data:**
{zillow_data}

**Rentcast Data:**
{rentcast_data}

---
⚠️ Final Output:
Return a single valid JSON object like below:

```json
{{
  "property_id": "PROP001",
  "address": "1124 Pacific Ave, San Francisco, CA 94133",
  "valuation_usd": 1950000,
  "size_sqm": 190,
  "default_risk_score": 34,
  "location_score": 88
}}
```
"""

# Function to fetch Zillow data
async def fetch_zillow_data(ctx: Context, address: str):
    """Fetch property data from Zillow API via RapidAPI"""
    ctx.logger.info(f"🏡 Starting Zillow data fetch for address: {address}")
    try:
        zillow_api_key = os.getenv("ZILLOW_API_KEY")
        if not zillow_api_key:
            ctx.logger.error("❌ ZILLOW_API_KEY not found in environment variables")
            return None
        
        ctx.logger.info("🔑 Zillow API key found, preparing request...")
        
        # Using RapidAPI Zillow endpoint with property address
        url = "https://zillow-working-api.p.rapidapi.com/pro/byaddress"
        
        querystring = {
            "propertyaddress": address
        }
        
        headers = {
            "X-RapidAPI-Key": zillow_api_key,
            "X-RapidAPI-Host": "zillow-working-api.p.rapidapi.com"
        }
        
        ctx.logger.info(f"🔍 Trying alternative Zillow endpoint...")
        
        ctx.logger.info(f"📡 Making GET request to Zillow API: {url}")
        ctx.logger.info(f"📋 Request parameters: {querystring}")
        ctx.logger.info(f"🔐 Request headers: {headers}")
        ctx.logger.info(f"📄 Full request payload:")
        ctx.logger.info(f"URL: {url}")
        ctx.logger.info(f"Params: {json.dumps(querystring, indent=2)}")
        ctx.logger.info(f"Headers: {json.dumps(headers, indent=2)}")
        
        async with aiohttp.ClientSession() as session:
            async with session.get(url, headers=headers, params=querystring) as response:
                # ctx.logger.info(f"📊 Zillow API response status: {response.status}")
                
                if response.status == 200:
                    data = await response.json()
                    ctx.logger.info("✅ Successfully fetched Zillow data")
                    ctx.logger.info("📄 RAW ZILLOW RESPONSE:")
                    # ctx.logger.info(f"{json.dumps(data, indent=2)}")
                    
                    # # Extract relevant data from Zillow response
                    # if 'props' in data and data['props']:
                    #     ctx.logger.info(f"🏠 Found {len(data['props'])} properties in response")
                    #     prop = data['props'][0]  # Take first property match
                    #     
                    #     ctx.logger.info("📊 Extracting property data...")
                    #     ctx.logger.debug(f"📄 Property keys: {list(prop.keys())}")
                    #     
                    #     zestimate = prop.get('zestimate', 0)
                    #     rent_zestimate = prop.get('rentZestimate', 0)
                    #     price_history = prop.get('priceHistory', [])
                    #     
                    #     ctx.logger.info(f"💰 Zestimate: ${zestimate:,}")
                    #     ctx.logger.info(f"🏠 Rent Zestimate: ${rent_zestimate:,}")
                    #     ctx.logger.info(f"📈 Price history entries: {len(price_history)}")
                    #     
                    #     result = {
                    #         "zestimate": zestimate,
                    #         "rent_zestimate": rent_zestimate,
                    #         "price_history": price_history,
                    #         "neighborhood_data": {
                    #             "median_home_value": prop.get('neighborhoodStats', {}).get('medianHomeValue', 0),
                    #             "price_per_sqft": prop.get('pricePerSqft', 0),
                    #             "market_trend": prop.get('marketTrend', 'unknown')
                    #         },
                    #         "comparable_properties": prop.get('comparables', []),
                    #         "property_details": {
                    #             "bedrooms": prop.get('bedrooms', 0),
                    #             "bathrooms": prop.get('bathrooms', 0),
                    #             "sqft": prop.get('livingArea', 0),
                    #             "lot_size": prop.get('lotSize', 0),
                    #             "year_built": prop.get('yearBuilt', 0)
                    #         }
                    #     }
                    #     
                    #     ctx.logger.info("🔍 Processed Zillow data structure:")
                    #     ctx.logger.info(f"   - Zestimate: ${result['zestimate']:,}")
                    #     ctx.logger.info(f"   - Bedrooms: {result['property_details']['bedrooms']}")
                    #     ctx.logger.info(f"   - Bathrooms: {result['property_details']['bathrooms']}")
                    #     ctx.logger.info(f"   - Sqft: {result['property_details']['sqft']:,}")
                    #     ctx.logger.info(f"   - Comparables: {len(result['comparable_properties'])}")
                    #     
                    #     return result
                    # else:
                    #     ctx.logger.warning("❌ No properties found in Zillow response")
                    #     ctx.logger.debug(f"📄 Response structure: {data}")
                    #     return None
                    
                    # For now, return the raw data
                    return data
                else:
                    response_text = await response.text()
                    ctx.logger.error(f"❌ Zillow API request failed. Status: {response.status}")
                    ctx.logger.error(f"📄 Error response: {response_text}")
                    ctx.logger.error("💥 ABORTING: Zillow API call failed")
                    return None
    except Exception as e:
        ctx.logger.error(f"💥 Error fetching Zillow data: {str(e)}")
        ctx.logger.error(f"🔍 Exception type: {type(e).__name__}")
        return None

# Function to fetch Rentcast data
async def fetch_rentcast_data(ctx: Context, address: str):
    """Fetch rental market data from Rentcast API"""
    ctx.logger.info(f"🏠 Starting Rentcast data fetch for address: {address}")
    try:
        rentcast_api_key = os.getenv("RENTCAST_API_KEY")
        if not rentcast_api_key:
            ctx.logger.error("❌ RENTCAST_API_KEY not found in environment variables")
            return None
        
        ctx.logger.info(f"🔑 Rentcast API key found, initiating API call...")
        
        # Using Rentcast API endpoint - trying GET method
        url = "https://api.rentcast.io/v1/avm/rent/long-term"
        
        headers = {
            "X-Api-Key": rentcast_api_key,
            "Content-Type": "application/json"
        }
        
        params = {
            "address": address,
            "propertyType": "Single Family"
        }
        
        ctx.logger.info(f"📡 Making GET request to Rentcast API: {url}")
        ctx.logger.debug(f"📋 Request parameters: {json.dumps(params, indent=2)}")
        
        async with aiohttp.ClientSession() as session:
            async with session.get(url, headers=headers, params=params) as response:
                ctx.logger.info(f"📊 Rentcast API response status: {response.status}")
                
                if response.status == 200:
                    data = await response.json()
                    ctx.logger.info("✅ Successfully fetched Rentcast data")
                    ctx.logger.debug(f"📄 Raw Rentcast response: {json.dumps(data, indent=2)}")
                    
                    # Extract relevant data from Rentcast response
                    rent_estimate = data.get('rent', 0)
                    rent_range_low = data.get('rentRangeLow', 0)
                    rent_range_high = data.get('rentRangeHigh', 0)
                    
                    ctx.logger.info(f"💰 Rent estimate: ${rent_estimate}")
                    ctx.logger.info(f"📈 Rent range: ${rent_range_low} - ${rent_range_high}")
                    
                    result = {
                        "rent_estimate": rent_estimate,
                        "rent_range": {"low": rent_range_low, "high": rent_range_high},
                        "rental_comps": data.get('comparables', []),
                        "market_metrics": {
                            "vacancy_rate": data.get('vacancyRate', 0),
                            "avg_days_on_market": data.get('avgDaysOnMarket', 0),
                            "tenant_demand": data.get('tenantDemand', 'unknown')
                        },
                        "rental_yield": data.get('rentalYield', 0),
                        "property_details": {
                            "bedrooms": data.get('bedrooms', 0),
                            "bathrooms": data.get('bathrooms', 0),
                            "sqft": data.get('sqft', 0)
                        }
                    }
                    
                    ctx.logger.info("🔍 Processed Rentcast data structure:")
                    ctx.logger.info(f"   - Rent estimate: ${result['rent_estimate']}")
                    ctx.logger.info(f"   - Comparables found: {len(result['rental_comps'])}")
                    ctx.logger.info(f"   - Vacancy rate: {result['market_metrics']['vacancy_rate']}")
                    
                    return result
                else:
                    response_text = await response.text()
                    ctx.logger.error(f"❌ Rentcast API request failed. Status: {response.status}")
                    ctx.logger.error(f"📄 Error response: {response_text}")
                    ctx.logger.error("💥 ABORTING: Rentcast API call failed")
                    return None
    except Exception as e:
        ctx.logger.error(f"💥 Error fetching Rentcast data: {str(e)}")
        ctx.logger.error(f"🔍 Exception type: {type(e).__name__}")
        return None

# Function to analyze property with AS1 API
async def analyze_property_with_as1(ctx: Context, property_info, zillow_data, rentcast_data):
    """Analyze the property data using AS1 API"""
    ctx.logger.info("🧠 Starting AS1 property analysis...")
    
    # Mock analysis result
    ctx.logger.info("🤖 Using mock analysis result for development")
    
    # # Simulate processing time
    # await asyncio.sleep(2)
    
    # fake_result = {
    #     "property_id": "PROP001",
    #     "address": TARGET_PROPERTY["address"],
    #     "valuation_usd": 315000,
    #     "size_sqm": TARGET_PROPERTY["size_sqm"],
    #     "default_risk_score": 42,
    #     "location_score": 85
    # }
    
    # ctx.logger.info(f"✅ Mock analysis complete: {fake_result}")
    # return fake_result
    

    try:
        # Get AS1 API key from environment
        as1_api_key = os.getenv("ASI_ONE_API_KEY")
        if not as1_api_key:
            ctx.logger.error("❌ ASI_ONE_API_KEY not found in environment variables")
            return None
        
        ctx.logger.info("🔑 AS1 API key found, preparing analysis request...")
        
        # Prepare the prompt with the property data
        ctx.logger.info("📝 Formatting prompt with property data...")
        formatted_prompt = REAL_ESTATE_PROMPT.format(
            property_info=json.dumps(property_info, indent=2),
            zillow_data=json.dumps(zillow_data, indent=2) if zillow_data else "No Zillow data available",
            rentcast_data=json.dumps(rentcast_data, indent=2) if rentcast_data else "No Rentcast data available"
        )
        
        ctx.logger.info(f"📊 Prompt length: {len(formatted_prompt)} characters")
        ctx.logger.debug(f"📋 Full prompt preview (first 500 chars): {formatted_prompt[:500]}...")
        
        # Prepare AS1 API request
        url = "https://api.asi1.ai/v1/chat/completions"
        
        #we need to get, and then sign a tx to update the base with the following data: updateLocationStore, updateRiskScore, updateValuation
        payload = {
            "model": "asi1-extended",
            "messages": [
                {
                    "role": "system",
                    "content": "You are a seasoned real estate investment expert with 25+ years of experience. Return only valid JSON as requested."
                },
                {
                    "role": "user",
                    "content": formatted_prompt
                }
            ],
            "temperature": 0.3,
            "stream": False,
            "max_tokens": 3000
        }
        
        headers = {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Authorization': f'Bearer {as1_api_key}'
        }
        
        ctx.logger.info(f"📡 Making POST request to AS1 API: {url}")
        ctx.logger.info(f"⚙️ Request settings: temperature=0.3, max_tokens=3000")
        ctx.logger.debug(f"📋 Request payload size: {len(json.dumps(payload))} bytes")
        
        # Make AS1 API request
        response = requests.post(url, headers=headers, data=json.dumps(payload))
        
        ctx.logger.info(f"📊 AS1 API response status: {response.status_code}")
        
        if response.status_code == 200:
            response_data = response.json()
            ctx.logger.info("✅ Successfully received AS1 response")
            
            # Log response structure
            ctx.logger.debug(f"📄 Response structure: {list(response_data.keys())}")
            
            analysis_result = response_data['choices'][0]['message']['content'].strip()
            ctx.logger.info(f"📝 AS1 Analysis Result length: {len(analysis_result)} characters")
            ctx.logger.info(f"🔍 AS1 Analysis Result preview: {analysis_result[:200]}...")
            
            # Try to parse as JSON to validate
            try:
                ctx.logger.info("🔄 Attempting to parse AS1 response as JSON...")
                
                # Extract JSON from markdown code block if present
                if '```' in analysis_result:
                    ctx.logger.info("📦 Detected markdown code block, extracting JSON...")
                    json_str = analysis_result.split('```')[1]
                    if json_str.startswith('json'):
                        json_str = json_str[4:].strip()
                    ctx.logger.info(f"📄 Extracted JSON string: {json_str}")
                    parsed_result = json.loads(json_str)
                else:
                    ctx.logger.info("📄 No markdown detected, parsing directly...")
                    parsed_result = json.loads(analysis_result)
                    
                ctx.logger.info("✅ Successfully parsed AS1 response as JSON")
                ctx.logger.info(f"🏠 Property ID: {parsed_result.get('property_id', 'N/A')}")
                ctx.logger.info(f"💰 New valuation: ${parsed_result.get('valuation_usd', 0):,}")
                ctx.logger.info(f"⚠️ New risk score: {parsed_result.get('default_risk_score', 0)}")
                
                return parsed_result
            except (json.JSONDecodeError, IndexError) as parse_error:
                ctx.logger.error(f"❌ AS1 response is not valid JSON: {str(parse_error)}")
                ctx.logger.error(f"📄 Raw response for debugging: {analysis_result}")
                return analysis_result
        else:
            ctx.logger.error(f"❌ AS1 API request failed. Status: {response.status_code}")
            ctx.logger.error(f"📄 Error response: {response.text}")
            return None
        
    except Exception as e:
        ctx.logger.error(f"💥 Error calling AS1 API: {str(e)}")
        ctx.logger.error(f"🔍 Exception type: {type(e).__name__}")
        return None


# Function to update on-chain data on Base Sepolia
def update_on_chain_data(ctx: Context, analysis_result):
    """Updates valuation and risk scores on the Base Sepolia smart contract."""
    ctx.logger.info("⛓️ ========================================")
    ctx.logger.info("⚡️ STARTING ON-CHAIN DATA UPDATE")
    ctx.logger.info("⛓️ ========================================")

    try:
        # --- 1. Setup Web3 Connection ---
        infura_key = os.getenv("INFURA_KEY")
        private_key = os.getenv("PRIVATE_KEY")

        if not infura_key or not private_key:
            ctx.logger.error("❌ INFURA_KEY or PRIVATE_KEY not found in .env file")
            return

        rpc_url = f"https://base-sepolia.infura.io/v3/{infura_key}"
        w3 = Web3(Web3.HTTPProvider(rpc_url))

        if not w3.is_connected():
            ctx.logger.error("❌ Failed to connect to Base Sepolia network")
            return

        ctx.logger.info(f"✅ Connected to Base Sepolia (Chain ID: {w3.eth.chain_id})")

        # --- 2. Load Contract ---
        contract_address = "0x4Fea3A6A4CBaCBc848065D18F04B9524d635e1e4" # From constants
        
        # Load ABI from file
        try:
            with open("../layer0/deployments/baseSepolia/RWAToken.json") as f:
                contract_json = json.load(f)
                contract_abi = contract_json['abi']
        except FileNotFoundError:
            ctx.logger.error("❌ RWAToken.json ABI file not found. Make sure the path is correct.")
            return
            
        contract = w3.eth.contract(address=contract_address, abi=contract_abi)
        ctx.logger.info(f"✅ Contract loaded at address: {contract_address}")
        
        # --- 3. Prepare and Send Transactions ---
        account = w3.eth.account.from_key(private_key)
        wallet_address = account.address
        ctx.logger.info(f"🔑 Using wallet address: {wallet_address}")

        # Get chain ID for replay protection
        chain_id = w3.eth.chain_id

        # Nonce management
        nonce = w3.eth.get_transaction_count(wallet_address)
        ctx.logger.info(f"📄 Initial nonce: {nonce}")

        # New values from analysis
        new_valuation = int(analysis_result['valuation_usd'])
        new_risk_score = int(analysis_result['default_risk_score']) # Score is already 0-100
        new_location_score = int(analysis_result['location_score'])

        # --- Transaction 1: Update Valuation ---
        ctx.logger.info(f"🚀 Preparing to update valuation to ${new_valuation:,}")
        tx_valuation = contract.functions.updateValuation(new_valuation).build_transaction({
            'from': wallet_address,
            'nonce': nonce,
            'gas': 1_000_000,
            'gasPrice': w3.eth.gas_price,
            'chainId': chain_id
        })
        signed_tx_valuation = w3.eth.account.sign_transaction(tx_valuation, private_key)
        tx_hash_valuation = w3.eth.send_raw_transaction(signed_tx_valuation.raw_transaction)
        ctx.logger.info(f"✅ Valuation update transaction sent: {tx_hash_valuation.hex()}")
        w3.eth.wait_for_transaction_receipt(tx_hash_valuation)
        ctx.logger.info(f"🎉 Valuation update confirmed!")
        nonce += 1 # Increment nonce for next tx

        # --- Transaction 2: Update Risk Score ---
        ctx.logger.info(f"🚀 Preparing to update risk score to {new_risk_score}")
        tx_risk = contract.functions.updateRiskScore(new_risk_score).build_transaction({
            'from': wallet_address,
            'nonce': nonce,
            'gas': 1_000_000,
            'gasPrice': w3.eth.gas_price,
            'chainId': chain_id
        })
        signed_tx_risk = w3.eth.account.sign_transaction(tx_risk, private_key)
        tx_hash_risk = w3.eth.send_raw_transaction(signed_tx_risk.raw_transaction)
        ctx.logger.info(f"✅ Risk score update transaction sent: {tx_hash_risk.hex()}")
        w3.eth.wait_for_transaction_receipt(tx_hash_risk)
        ctx.logger.info(f"🎉 Risk score update confirmed!")
        nonce += 1 # Increment nonce

        # --- Transaction 3: Update Location Score ---
        ctx.logger.info(f"🚀 Preparing to update location score to {new_location_score}")
        tx_location = contract.functions.updateLocationScore(new_location_score).build_transaction({
            'from': wallet_address,
            'nonce': nonce,
            'gas': 1_000_000,
            'gasPrice': w3.eth.gas_price,
            'chainId': chain_id
        })
        signed_tx_location = w3.eth.account.sign_transaction(tx_location, private_key)
        tx_hash_location = w3.eth.send_raw_transaction(signed_tx_location.raw_transaction)
        ctx.logger.info(f"✅ Location score update transaction sent: {tx_hash_location.hex()}")
        w3.eth.wait_for_transaction_receipt(tx_hash_location)
        ctx.logger.info(f"🎉 Location score update confirmed!")

        ctx.logger.info("✅ All on-chain data updates completed successfully!")

    except Exception as e:
        ctx.logger.error(f"💥 An error occurred during the on-chain update: {str(e)}")
        ctx.logger.error(f"🔍 Exception type: {type(e).__name__}")
        # Consider adding more detailed error handling here

# startup handler
@agent.on_event("startup")
async def startup_function(ctx: Context):
    ctx.logger.info("🚀 ========================================")
    ctx.logger.info("🏠 RWA VALUATOR AGENT STARTING UP")
    ctx.logger.info("🚀 ========================================")
    
    ctx.logger.info(f"🤖 Agent Name: {agent.name}")
    ctx.logger.info(f"📍 Agent Address: {agent.address}")
    
    ctx.logger.info("✅ RWA Valuator Agent is ready to analyze real estate properties!")
    
    # Display target property information
    ctx.logger.info("🏡 ========================================")
    ctx.logger.info("🎯 TARGET PROPERTY ANALYSIS")
    ctx.logger.info("🏡 ========================================")
    
    ctx.logger.info(f"🏠 Property ID: {TARGET_PROPERTY['property_id']}")
    ctx.logger.info(f"📍 Address: {TARGET_PROPERTY['address']}")
    ctx.logger.info(f"💰 Current Valuation: ${TARGET_PROPERTY['valuation_usd']:,}")
    ctx.logger.info(f"📏 Size: {TARGET_PROPERTY['size_sqm']} sqm")
    ctx.logger.info(f"⚠️ Current Risk Score: {TARGET_PROPERTY['default_risk_score']}")
    
    # Check environment variables
    ctx.logger.info("🔍 ========================================")
    ctx.logger.info("🔑 CHECKING API KEYS")
    ctx.logger.info("🔍 ========================================")
    
    zillow_key = os.getenv("ZILLOW_API_KEY")
    rentcast_key = os.getenv("RENTCAST_API_KEY")
    as1_key = os.getenv("ASI_ONE_API_KEY")
    
    ctx.logger.info(f"🏡 Zillow API Key: {'✅ Found' if zillow_key else '❌ Missing'}")
    ctx.logger.info(f"🏠 Rentcast API Key: {'✅ Found' if rentcast_key else '❌ Missing'}")
    ctx.logger.info(f"🧠 AS1 API Key: {'✅ Found' if as1_key else '❌ Missing'}")
    
    # Start data fetching process
    ctx.logger.info("📊 ========================================")
    ctx.logger.info("🔄 STARTING DATA COLLECTION")
    ctx.logger.info("📊 ========================================")
    
    # Fetch data from both APIs
    ctx.logger.info("🏡 Phase 1: Fetching Zillow data...")
    zillow_data = await fetch_zillow_data(ctx, TARGET_PROPERTY["address"])
    
    ctx.logger.info("🏠 Phase 2: Fetching Rentcast data...")
    rentcast_data = await fetch_rentcast_data(ctx, TARGET_PROPERTY["address"])
    
    # Check data collection results
    ctx.logger.info("📋 ========================================")
    ctx.logger.info("🔍 DATA COLLECTION RESULTS")
    ctx.logger.info("📋 ========================================")
    
    zillow_status = "✅ Success" if zillow_data else "❌ Failed"
    rentcast_status = "✅ Success" if rentcast_data else "❌ Failed"
    
    ctx.logger.info(f"🏡 Zillow Data: {zillow_status}")
    ctx.logger.info(f"🏠 Rentcast Data: {rentcast_status}")
    
    if zillow_data and rentcast_data:
        ctx.logger.info("🧠 ========================================")
        ctx.logger.info("🔄 STARTING AI ANALYSIS")
        ctx.logger.info("🧠 ========================================")
        
        # Analyze the property with AS1
        analysis_result = await analyze_property_with_as1(ctx, TARGET_PROPERTY, zillow_data, rentcast_data)
        
        ctx.logger.info("📊 ========================================")
        ctx.logger.info("🎯 FINAL ANALYSIS RESULTS")
        ctx.logger.info("📊 ========================================")
        
        if analysis_result:
            if isinstance(analysis_result, dict):
                ctx.logger.info("✅ Property valuation analysis completed successfully!")
                ctx.logger.info(f"🏠 Property ID: {analysis_result.get('property_id', 'N/A')}")
                ctx.logger.info(f"📍 Address: {analysis_result.get('address', 'N/A')}")
                ctx.logger.info(f"💰 NEW VALUATION: ${analysis_result.get('valuation_usd', 0):,}")
                ctx.logger.info(f"📏 Size: {analysis_result.get('size_sqm', 0)} sqm")
                ctx.logger.info(f"⚠️ NEW RISK SCORE: {analysis_result.get('default_risk_score', 0)}")
                
                # Compare with original values
                original_val = TARGET_PROPERTY['valuation_usd']
                new_val = analysis_result.get('valuation_usd', 0)
                val_change = new_val - original_val
                val_change_pct = (val_change / original_val) * 100 if original_val > 0 else 0
                
                original_risk = TARGET_PROPERTY['default_risk_score']
                new_risk = analysis_result.get('default_risk_score', 0)
                risk_change = new_risk - original_risk
                
                ctx.logger.info("📈 ========================================")
                ctx.logger.info("📊 COMPARISON WITH ORIGINAL VALUES")
                ctx.logger.info("📈 ========================================")
                
                ctx.logger.info(f"💰 Valuation Change: ${val_change:,} ({val_change_pct:+.2f}%)")
                ctx.logger.info(f"⚠️ Risk Score Change: {risk_change:+.3f}")
                
                # Update on-chain data
                update_on_chain_data(ctx, analysis_result)

                ctx.logger.info("🎊 ========================================")
                ctx.logger.info("✅ ANALYSIS COMPLETE - AGENT READY")
                ctx.logger.info("🎊 ========================================")
                
                ctx.logger.info(f"📄 Complete Analysis Result:")
                ctx.logger.info(f"{json.dumps(analysis_result, indent=2)}")
            else:
                ctx.logger.warning("⚠️ Analysis returned non-JSON result")
                ctx.logger.info(f"📄 Raw result: {analysis_result}")
        else:
            ctx.logger.error("❌ Failed to get analysis from AS1")
            ctx.logger.error("💡 Check AS1 API key and connection")
    else:
        ctx.logger.error("❌ ========================================")
        ctx.logger.error("💥 DATA COLLECTION FAILED")
        ctx.logger.error("❌ ========================================")
        
        if not zillow_data:
            ctx.logger.error("🏡 Zillow data collection failed")
            ctx.logger.error("💡 Check ZILLOW_API_KEY and RapidAPI subscription")
        
        if not rentcast_data:
            ctx.logger.error("🏠 Rentcast data collection failed")
            ctx.logger.error("💡 Check RENTCAST_API_KEY and API subscription")
        
        ctx.logger.error("❌ Cannot proceed with analysis without both data sources")
        ctx.logger.error("🔧 Please check API keys and try again")

if __name__ == "__main__":
    agent.run() 