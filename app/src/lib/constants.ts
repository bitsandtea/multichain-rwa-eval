export enum SupportedChainId {
  ETHEREUM = "ethereum",
  FLOW = "flow",
}

export interface Token {
  name: string;
  address: string;
  symbol: string;
  cmcId?: number;
}

export const TOKENS: Record<SupportedChainId, Token[]> = {
  [SupportedChainId.ETHEREUM]: [
    {
      name: "Chainlink",
      address: "0x514910771AF9Ca656af840dff83E8264EcF986CA",
      symbol: "LINK",
      cmcId: 1975,
    },
    {
      name: "Uniswap",
      address: "0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984",
      symbol: "UNI",
      cmcId: 7083,
    },
    {
      name: "Aave",
      address: "0x7Fc66500c84A76Ad7e9c93437bFc5Ac33E2DDaE9",
      symbol: "AAVE",
      cmcId: 7278,
    },
  ],
  [SupportedChainId.FLOW]: [
    {
      name: "Wrapped Ether",
      address: "0x2F6F07CDcf3588944Bf4C42aC74ff24bF56e7590",
      symbol: "WETH",
      cmcId: 2396,
    },
    {
      name: "FVIX",
      address: "0x00f4CE400130C9383115f3858F9CA54677426583",
      symbol: "FVIX",
    },
    {
      name: "Ankr Staked FLOW",
      address: "0x1b97100eA1D7126C4d60027e231EA4CB25314bdb",
      symbol: "ankrFLOW",
    },
  ],
};

export const mainPrompt: string = `You are a professional crypto asset strategist managing the UNICORN index, a basket of selected crypto tokens.

You will be provided with the following:
1. **Market Conditions** – High-level macro or crypto-specific market insights (e.g., BTC trend, ETH gas fees, regulatory news, risk appetite).
2. **Token Universe** – A list of tokens in the UNICORN index, along with their current data: market cap, liquidity, 7-day price change, volatility, and any fundamentals.
3. **Current Index Composition** – The current weight distribution of tokens in the UNICORN index.

Your task:
Evaluate the data and provide a rebalancing signal for each token using a \`REBALANCE_INDEX\` value, which reflects your conviction to buy, hold, or sell each asset.

Instructions:
- Return a **JSON object only** that contains each token symbol as a key, and a number from **-1 to 1** as the value.
    - \`-1\` = strong sell
    - \`0\` = hold
    - \`1\` = strong buy
- These values represent **strategic rebalancing intent** over a **3-year investment horizon**.
- You are only allowed to trade among the tokens already in the index (no new assets).
- **Do not include explanations, reasoning, or any text outside of the JSON object.**

---

**Market Conditions:**  
{{Market_Conditions}}
**Token Universe:**  
{{Token_Universe}}
**Current Index Composition:**  
{{Current_Index_Composition}}


---
⚠️ Final Output:
Return a single valid JSON object like below (with your suggested \`REBALANCE_INDEX\` values):

\`\`\`json
{
  "AAVE": 0.3,
  "UNI": -0.2,
  "MKR": 0.0,
  ...
}
\`\`\`
`;
