import dotenv from "dotenv";
dotenv.config();

import "@layerzerolabs/toolbox-hardhat";

import { EndpointId } from "@layerzerolabs/lz-definitions";
import "@nomicfoundation/hardhat-network-helpers";
import "@nomicfoundation/hardhat-verify";
import "@nomiclabs/hardhat-ethers";
import "hardhat-deploy";

const config = {
  paths: {
    sources: "./contracts",
    cache: "./cache",
    artifacts: "./artifacts",
  },
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  networks: {
    hardhat: {
      chainId: 31337,
    },
    flowEVMTestnet: {
      url: "https://testnet.evm.nodes.onflow.org",
      chainId: 545,
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
    },
    baseSepolia: {
      eid: EndpointId.BASESEP_V2_TESTNET,
      url: `https://base-sepolia.infura.io/v3/${process.env.INFURA_KEY}`,
      chainId: 84532,
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      timeout: 60000,
      gasPrice: 1000000000,
    },
    ethSepolia: {
      eid: EndpointId.SEPOLIA_V2_TESTNET,
      url: `https://sepolia.infura.io/v3/${process.env.INFURA_KEY}`,
      chainId: 11155111,
      accounts: process.env.PRIVATE_KEY_ETHSEPOLIA
        ? [process.env.PRIVATE_KEY_ETHSEPOLIA]
        : [],
      timeout: 60000,
      gas: 2100000,
      gasPrice: 8000000000,
    },
    polygonAmoy: {
      eid: EndpointId.AMOY_V2_TESTNET,
      url: `https://polygon-amoy.infura.io/v3/${process.env.INFURA_KEY}`,
      chainId: 80002,
      accounts: process.env.PRIVATE_KEY_AMOY
        ? [process.env.PRIVATE_KEY_AMOY]
        : [],
    },
  },
  etherscan: {
    apiKey: process.env.ETHERSCAN_API || "abc",
    customChains: [
      {
        network: "flowEVMTestnet",
        chainId: 545,
        urls: {
          apiURL: "https://evm-testnet.flowscan.io/api",
          browserURL: "https://evm-testnet.flowscan.io",
        },
      },
    ],
  },

  sourcify: {
    enabled: false,
  },
};

export default config;
