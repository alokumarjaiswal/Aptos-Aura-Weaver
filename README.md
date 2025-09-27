# Aptos Aura Weaver

A personalized NFT generator that creates unique "aura" visualizations based on your on-chain activity and mood.

## What It Does

Aptos Aura Weaver analyzes your wallet's transaction history and combines it with a custom "mood seed" (phrase or emoji) to generate personalized, animated art. Each aura is unique to your on-chain journey and can be minted as an NFT on the Aptos blockchain.

## How It Works

1. **Connect Wallet** - Connect your Petra wallet to access your transaction data
2. **Enter Mood** - Input a mood seed (e.g., "happy 😊", "calm 🌊", "energetic ⚡")
3. **Generate Aura** - Watch as your personalized aura visualization is created using p5.js
4. **Mint NFT** - Mint your unique aura as an NFT with rarity based on your transaction count

## Features

- **Personalized Generation** - Each aura reflects your unique on-chain activity
- **Dynamic Visualizations** - Real-time animated particles and waveforms
- **Smart Rarity System** - Rarity calculated from transaction count and mood complexity
- **IPFS Storage** - Optional decentralized storage for NFT metadata and images
- **Social Sharing** - Built-in sharing tools for Twitter/X
- **Mood-Based Palettes** - Color schemes adapt to your mood input

## Technology Stack

### Frontend
- **React** with TypeScript
- **p5.js** for generative art
- **Aptos TypeScript SDK** for blockchain interaction
- **Petra Wallet Adapter** for wallet connectivity

### Smart Contract
- **Move Language** on Aptos blockchain
- **Token Objects Framework** for NFT implementation
- **Event-driven architecture** for tracking mints

### Storage
- **Pinata IPFS** for decentralized metadata storage
- **On-chain metadata** for core NFT properties

## Getting Started

### Prerequisites
- Node.js 16+
- Petra Wallet browser extension
- Aptos CLI (for contract deployment)

### Installation

1. Clone the repository
```bash
git clone https://github.com/your-username/Aptos-Aura-Weaver.git
cd Aptos-Aura-Weaver
```

2. Install frontend dependencies
```bash
cd frontend
npm install
```

3. Set up environment variables
```bash
# Optional: For IPFS storage
REACT_APP_PINATA_API_KEY=your_pinata_api_key
REACT_APP_PINATA_SECRET_KEY=your_pinata_secret_key

# Network configuration
REACT_APP_APTOS_NETWORK=devnet
REACT_APP_APTOS_NODE_URL=https://fullnode.devnet.aptoslabs.com/v1
```

4. Start the development server
```bash
npm start
```

### Smart Contract Deployment

```bash
cd move-contracts
aptos move compile
aptos move publish
```

## Contract Address

**Devnet**: `0x0b65f8046e689981c490d760553a03b9d11775d03d78c141d6a44041c3b12a43`

## Project Structure

```
├── frontend/                 # React TypeScript frontend
│   ├── src/
│   │   ├── components/      # React components
│   │   ├── services/        # IPFS and external services
│   │   ├── utils/          # Validation and utilities
│   │   └── types/          # TypeScript definitions
├── move-contracts/          # Aptos Move smart contracts
│   ├── sources/            # Move source files
│   └── Move.toml          # Package configuration
└── build/                  # Compiled contract artifacts
```

## Rarity System

Aura rarity is calculated based on:
- **Transaction Count**: Higher activity = higher base rarity
- **Mood Complexity**: Longer, more diverse mood seeds increase rarity
- **Character Diversity**: Unique characters in mood seed add bonus points

## Demo Mode

The app works without IPFS configuration using placeholder URIs for demonstration purposes.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

MIT License - see LICENSE file for details

---

*Generate your unique digital aura and mint it as an NFT on Aptos blockchain.*
