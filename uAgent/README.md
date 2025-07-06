# RWA (Real World Asset) Valuation Agent

![tag:innovationlab](https://img.shields.io/badge/innovationlab-3D8BD3)

## Demo Video

[![Demo Video](https://img.shields.io/badge/Watch%20Demo%20on%20YouTube-red?logo=youtube)](https://youtu.be/l1RbQvgxwos)

---

## Overview

The RWA Valuation Agent is an intelligent system that evaluates real-world assets (specifically real estate properties) and integrates with cross-chain blockchain infrastructure to provide tokenized asset management. This agent combines AI-powered property analysis with LayerZero's cross-chain protocol to create a unified valuation and risk assessment platform.

## 🏗️ System Architecture

### Core Components

1. **RWA_Valuator.py** - Primary AI agent for property valuation and risk assessment
2. **UNICORN_Index_Agent.py** - Specialized index and portfolio management agent
3. **Cross-Chain Smart Contracts** - LayerZero-powered OFT (Omnichain Fungible Token) contracts
4. **Frontend Dashboard** - Next.js application displaying live cross-chain data

### Blockchain Networks

- **Ethereum Sepolia** (Testnet)
- **Base Sepolia** (Testnet)
- **Polygon Amoy** (Testnet)

## 🎯 Features

### Property Analysis

- **AI-Powered Valuation**: Intelligent assessment of property values
- **Risk Scoring**: Comprehensive risk analysis (0-100 scale)
- **Location Scoring**: Geographic and demographic analysis (0-100 scale)
- **Market Data Integration**: Real-time property market insights

### Cross-Chain Integration

- **Unified Token Supply**: Seamless token transfers across chains
- **Cross-Chain Bidding**: Multi-chain auction and bidding system
- **Synchronized Data**: Real-time synchronization of property data across networks
- **LayerZero Integration**: Leverages LayerZero V2 for secure cross-chain messaging

### Real-Time Dashboard

- **Live Property Data**: Current valuations, scores, and market metrics
- **Cross-Chain Visibility**: View token data across all supported networks
- **Explorer Integration**: Direct links to blockchain explorers and LayerZero scan
- **Responsive Design**: Modern, mobile-friendly interface

## 🚀 Quick Start

### Prerequisites

```bash
# Python 3.8+ required
python --version

# Node.js 18+ required
node --version
```

### Environment Setup

1. **Create Virtual Environment**

```bash
cd uAgent
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

2. **Install Dependencies**

```bash
pip install -r requirements.txt
```

3. **Environment Variables**
   Create `.env` file in the uAgent directory:

```env
# OpenAI API (if using AI features)
OPENAI_API_KEY=your_openai_key_here

# Blockchain RPC URLs
ETHEREUM_SEPOLIA_RPC=your_ethereum_rpc
BASE_SEPOLIA_RPC=your_base_rpc
POLYGON_AMOY_RPC=your_polygon_rpc

# Private Keys (for testnet only)
PRIVATE_KEY=your_private_key
```

### Running the Agent

```bash
# Run the RWA Valuator Agent
python RWA_Valuator.py

# Run the Index Agent
python UNICORN_Index_Agent.py
```

## 📊 Property Data Structure

The system tracks comprehensive property information:

```json
{
  "description": "Real World Asset backed Token",
  "physicalAddress": "7849 S Drexel Ave, Chicago, IL 60619",
  "valuation": 315000,
  "valuationDate": 1751763204,
  "squareMeters": 135,
  "riskScore": 42,
  "locationScore": 85,
  "highestBid": 0,
  "highestBidTimestamp": 0,
  "highestBidChain": 0,
  "lastBid": 0,
  "lastBidTimestamp": 0
}
```

## 🔗 Smart Contract Integration

### Contract Addresses (Testnet)

- **Ethereum Sepolia**: `0xd3042a0244dD3428F6B327b9C245D24AF0024bd8`
- **Base Sepolia**: `0x4Fea3A6A4CBaCBc848065D18F04B9524d635e1e4`
- **Polygon Amoy**: `0x7B79861D0C7092C2FD4831F3a5baA299a219df51`

### Key Functions

- `getRWAData()` - Retrieve complete property information
- `updateValuation()` - Update property valuation (Base Sepolia only)
- `updateRiskScore()` - Update risk assessment
- `updateLocationScore()` - Update location scoring
- `placeBid()` - Submit cross-chain bids

## 🌐 Frontend Dashboard

Access the live dashboard to view:

- Real-time property valuations
- Risk and location scores
- Cross-chain token data
- Bidding history
- Explorer links

### Dashboard Features

- **Multi-Chain View**: See data across all supported networks
- **Live Updates**: Real-time synchronization with smart contracts
- **Explorer Integration**: Direct links to Etherscan, Basescan, Polygonscan, and LayerZero scan
- **Modern UI**: Clean, professional interface with branded typography

## 🔧 Development

### Project Structure

```
uAgent/
├── RWA_Valuator.py          # Main valuation agent
├── UNICORN_Index_Agent.py   # Index management agent
├── docs/                    # Documentation
├── venv/                    # Virtual environment
└── README.md               # This file
```

### Adding New Features

1. **Property Types**: Extend beyond residential to commercial, industrial
2. **Additional Chains**: Add support for more blockchain networks
3. **Advanced Analytics**: Implement ML models for predictive analysis
4. **Mobile App**: Native mobile application development

## 📈 Metrics & Analytics

The system provides comprehensive metrics:

- **Valuation Accuracy**: Track prediction vs actual values
- **Risk Assessment**: Historical risk score performance
- **Cross-Chain Activity**: Transaction volume across networks
- **Market Trends**: Property market analysis and insights

## 🛡️ Security

- **Testnet Only**: Currently deployed on testnets for development
- **Multi-Sig**: Support for multi-signature wallet integration
- **Access Controls**: Role-based permissions for different operations
- **Audit Ready**: Code structured for professional security audits

## 🤝 Contributing

We welcome contributions! Please see our contributing guidelines:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📜 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:

- Create an issue in the repository
- Contact the development team
- Check the documentation in `/docs`

## 🔮 Roadmap

- [ ] Mainnet deployment
- [ ] Additional property types
- [ ] Mobile application
- [ ] Advanced ML models
- [ ] DeFi integrations
- [ ] Governance token
- [ ] Insurance products
- [ ] Fractional ownership

---

_Built with ❤️ using LayerZero, OpenAI, and modern blockchain infrastructure._
