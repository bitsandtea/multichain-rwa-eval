# Multichain Index Fund – RWA Platform

![tag:innovationlab](https://img.shields.io/badge/innovationlab-3D8BD3)

## Overview

This repository contains a full-stack, cross-chain Real World Asset (RWA) platform for tokenized real estate and asset management. The system leverages AI-powered valuation agents, LayerZero cross-chain smart contracts, and a modern Next.js frontend to deliver a unified, multi-network investment experience.

## Key Components

- **app/** – Next.js frontend dashboard for live cross-chain property data and user interaction
- **layer0/** – Solidity smart contracts and deployment scripts for LayerZero-powered omnichain tokens
- **uAgent/** – Python AI agents for property valuation, risk scoring, and index management
- **mockContracts/** – Mock contracts and test scripts for local development

## Features

- **AI-Powered Valuation**: Automated property analysis and scoring
- **Cross-Chain Tokenization**: Unified supply and data across Ethereum Sepolia, Base Sepolia, and Polygon Amoy testnets
- **Live Dashboard**: Real-time property data, risk/location scores, and bidding
- **Explorer Integration**: Direct links to Etherscan, Basescan, Polygonscan, and LayerZero scan
- **Modular Architecture**: Easily extendable for new property types, chains, or analytics

## Quick Start

### 1. Frontend (app/)

```bash
cd app
npm install
npm run dev
# For static export:
npm run build
npm run export
```

### 2. Smart Contracts (layer0/)

```bash
cd layer0
npm install
npx hardhat compile
# Deploy to testnet:
npx hardhat run scripts/deploy-eth.ts --network sepolia
```

### 3. AI Agents (uAgent/)

```bash
cd uAgent
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python RWA_Valuator.py
```

## Directory Structure

```
multichain-index-fund/
├── app/           # Next.js frontend
├── layer0/        # Solidity contracts & scripts
├── uAgent/        # Python AI agents
├── mockContracts/ # Mock/test contracts
└── README.md      # This file
```

## Demo Video

[![Demo Video](https://img.shields.io/badge/Watch%20Demo%20on%20YouTube-red?logo=youtube)](https://youtu.be/l1RbQvgxwos)

## More Information

- See [uAgent/README.md](uAgent/README.md) for details on the AI agent system
- See [app/README.md] and [layer0/README.md] for frontend and contract specifics (if present)

---

_Built with ❤️ using LayerZero, OpenAI, and modern blockchain infrastructure._
