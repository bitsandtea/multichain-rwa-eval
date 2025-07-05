export enum SupportedChainId {
  BASE_SEPOLIA = "baseSepolia",
  POLYGON_AMOY = "polygonAmoy",
  ETHEREUM_SEPOLIA = "ethSepolia",
}

export interface RWAToken {
  name: string;
  address: string;
  symbol: string;
  chainId: number;
  layerZeroEid: number;
  isDataSource?: boolean; // True for Base Sepolia (unidirectional updates)
}

export const RWA_TOKENS: Record<SupportedChainId, RWAToken> = {
  [SupportedChainId.BASE_SEPOLIA]: {
    name: "RWA Property Token",
    address: "0x0000000000000000000000000000000000000000", // To be filled after deployment
    symbol: "RWAT",
    chainId: 84532,
    layerZeroEid: 40245,
    isDataSource: true, // Only Base Sepolia can update valuation, risk score, location score
  },
  [SupportedChainId.POLYGON_AMOY]: {
    name: "RWA Property Token",
    address: "0x0000000000000000000000000000000000000000", // To be filled after deployment
    symbol: "RWAT",
    chainId: 80002,
    layerZeroEid: 40267,
  },
  [SupportedChainId.ETHEREUM_SEPOLIA]: {
    name: "RWA Property Token",
    address: "0x0000000000000000000000000000000000000000", // To be filled after deployment
    symbol: "RWAT",
    chainId: 11155111,
    layerZeroEid: 40161,
  },
};

// LayerZero V2 Endpoint Addresses
export const LAYERZERO_ENDPOINTS: Record<SupportedChainId, string> = {
  [SupportedChainId.BASE_SEPOLIA]: "0x6EDCE65403992e310A62460808c4b910D972f10f",
  [SupportedChainId.POLYGON_AMOY]: "0x6EDCE65403992e310A62460808c4b910D972f10f",
  [SupportedChainId.ETHEREUM_SEPOLIA]:
    "0x6EDCE65403992e310A62460808c4b910D972f10f",
};

// RWA Token Configuration
export const RWA_CONFIG = {
  TOTAL_SUPPLY: "1000000", // 1M tokens
  DECIMALS: 18,

  // Property Information
  DEFAULT_PROPERTY: {
    name: "Luxury Downtown Condo",
    symbol: "RWAT",
    description: "Premium residential property in downtown financial district",
    physicalAddress: "123 Main Street, Downtown City, State 12345",
    valuation: "500000", // $500,000 USD
    squareMeters: "150", // 150 square meters
    riskScore: "25", // Low risk (0-100 scale)
    locationScore: "85", // High location score (0-100 scale)
  },

  // Cross-Chain Messaging
  MESSAGING: {
    GAS_LIMIT: {
      BASIC: "80000",
      BID_UPDATE: "100000",
      DATA_UPDATE: "120000",
    },

    MESSAGE_TYPES: {
      UPDATE_VALUATION: "updateValuation",
      UPDATE_RISK_SCORE: "updateRiskScore",
      UPDATE_LOCATION_SCORE: "updateLocationScore",
      UPDATE_BIDS: "updateBids",
    },
  },

  // Access Control
  ROLES: {
    OWNER: "Owner",
    RISK_SCORE_UPDATER: "Risk Score Updater",
    VALUATION_UPDATER: "Valuation Updater",
  },
};

// Network Configuration for Environment Variables
export const NETWORK_CONFIG = {
  [SupportedChainId.BASE_SEPOLIA]: {
    name: "Base Sepolia",
    rpcUrl: "https://base-sepolia.infura.io/v3/",
    explorerUrl: "https://sepolia.basescan.org",
    privateKeyEnv: "PRIVATE_KEY",
  },
  [SupportedChainId.POLYGON_AMOY]: {
    name: "Polygon Amoy",
    rpcUrl: "https://polygon-amoy.infura.io/v3/",
    explorerUrl: "https://amoy.polygonscan.com",
    privateKeyEnv: "PRIVATE_KEY_AMOY",
  },
  [SupportedChainId.ETHEREUM_SEPOLIA]: {
    name: "Ethereum Sepolia",
    rpcUrl: "https://sepolia.infura.io/v3/",
    explorerUrl: "https://sepolia.etherscan.io",
    privateKeyEnv: "PRIVATE_KEY_ETHSEPOLIA",
  },
};

// Deployment Script Constants
export const DEPLOYMENT_CONFIG = {
  CONSTRUCTOR_ARGS: {
    name: RWA_CONFIG.DEFAULT_PROPERTY.name,
    symbol: RWA_CONFIG.DEFAULT_PROPERTY.symbol,
    description: RWA_CONFIG.DEFAULT_PROPERTY.description,
    physicalAddress: RWA_CONFIG.DEFAULT_PROPERTY.physicalAddress,
    valuation: RWA_CONFIG.DEFAULT_PROPERTY.valuation,
    squareMeters: RWA_CONFIG.DEFAULT_PROPERTY.squareMeters,
    riskScore: RWA_CONFIG.DEFAULT_PROPERTY.riskScore,
    locationScore: RWA_CONFIG.DEFAULT_PROPERTY.locationScore,
  },

  // Gas Configurations for Deployment
  GAS_SETTINGS: {
    gasLimit: "3000000",
    gasPrice: "20000000000", // 20 gwei
  },
};

// Utility Functions
export const getTokenByChainId = (chainId: number): RWAToken | undefined => {
  return Object.values(RWA_TOKENS).find((token) => token.chainId === chainId);
};

export const getTokenByEid = (eid: number): RWAToken | undefined => {
  return Object.values(RWA_TOKENS).find((token) => token.layerZeroEid === eid);
};

export const getEndpointByChainId = (chainId: number): string => {
  const token = getTokenByChainId(chainId);
  if (!token) throw new Error(`Unsupported chain ID: ${chainId}`);

  const chainKey = Object.keys(RWA_TOKENS).find(
    (key) => RWA_TOKENS[key as SupportedChainId].chainId === chainId
  ) as SupportedChainId;

  return LAYERZERO_ENDPOINTS[chainKey];
};

// Export for backward compatibility
export const mainPrompt: string = `You are managing RWA (Real World Asset) tokens across multiple blockchain networks using LayerZero V2 OFT standard.

The system supports:
- Unified token supply across Base Sepolia, Polygon Amoy, and Ethereum Sepolia
- Unidirectional property data updates from Base Sepolia only
- Bidirectional bid tracking across all chains  
- Cross-chain highest bid tracking with chain identification

Available operations:
- Transfer tokens between chains (maintains unified supply)
- Update property valuation, risk score, location score (Base Sepolia only)
- Place bids (any chain, syncs to all chains)
- Query property data and bid information

Chain Configuration:
${Object.entries(RWA_TOKENS)
  .map(
    ([key, token]) =>
      `- ${token.name} (${key}): Chain ID ${token.chainId}, LayerZero EID ${
        token.layerZeroEid
      }${token.isDataSource ? " (Data Source)" : ""}`
  )
  .join("\n")}`;

export { SupportedChainId as ChainId };
