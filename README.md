# Aptos Aura Weaver 

<div align="center">
  <img src="https://github.com/alokumarjaiswal/Aptos-Aura-Weaver/blob/main/README.png" alt="Aptos Aura Weaver Landing Page" width="800" />
  <br />
  <em>Transform your blockchain journey into personalized generative art NFTs</em>
</div>

<br />

> **Transform your blockchain journey into personalized generative art NFTs**

A sophisticated full-stack Web3 application that creates unique "aura" visualizations based on your Aptos on-chain activity and personal mood, then mints them as NFTs using cutting-edge Move smart contracts.

## What Makes This Special

**Aptos Aura Weaver** bridges the gap between your digital identity and artistic expression by:
- **Analyzing your on-chain footprint** - Reads your Aptos wallet's transaction history
- **Combining with personal mood** - Uses your custom mood seed (text/emojis) as creative input  
- **Generating unique art** - Creates personalized, animated particle visualizations using p5.js
- **Minting as NFTs** - Deploys to Aptos blockchain with sophisticated rarity scoring
- **IPFS storage** - Optionally stores metadata and images on decentralized storage

## Core Concept

Each aura is a **digital fingerprint** of your blockchain journey:
- **Transaction Count** determines base particle behavior and rarity
- **Mood Seed** influences color palettes, particle patterns, and visual themes  
- **Generative Algorithm** creates real-time animations with orbiting particles, spirals, and waveforms
- **Smart Rarity System** calculates NFT rarity based on activity level and mood complexity

## Architecture Overview

### **Frontend (React + TypeScript)**
- **Modern React 19** with TypeScript for type safety
- **Aptos Wallet Integration** via official adapter (@aptos-labs/wallet-adapter-react)
- **p5.js Generative Art** engine for real-time aura visualization
- **Lazy Loading** and performance optimization for smooth UX
- **Responsive Design** with mobile-first approach

### **Smart Contracts (Move Language)**
- **Aptos Token Objects Framework** for modern NFT implementation
- **Enhanced Rarity Algorithm** combining transaction history + mood complexity
- **Event-Driven Architecture** for tracking mints and collection stats
- **Input Validation** and security measures for safe minting
- **Gas-Optimized** transactions with proper error handling

### **Backend (Node.js + Express)**
- **IPFS Integration** via Pinata for decentralized storage
- **Rate Limiting** and security middleware
- **Comprehensive Logging** for operations monitoring
- **Error Handling** with detailed analytics
- **CORS Configuration** for cross-origin support

### **DevOps & Deployment**
- **Railway Backend** hosting with environment management
- **GitHub Pages** frontend deployment with CI/CD
- **Multiple Network Support** (Devnet/Testnet/Mainnet)
- **Docker Ready** configuration for containerization

## Getting Started

### Prerequisites
```bash
Node.js 18+ 
Aptos CLI (for smart contract deployment)
Petra Wallet browser extension
```

### Quick Setup

1. **Clone and Install**
```bash
git clone https://github.com/alokumarjaiswal/Aptos-Aura-Weaver.git
cd Aptos-Aura-Weaver

# Install all dependencies (frontend + backend)
npm run install-all
```

2. **Environment Configuration**
```bash
# Frontend (.env in /frontend)
REACT_APP_APTOS_NETWORK=devnet
REACT_APP_APTOS_NODE_URL=https://fullnode.devnet.aptoslabs.com/v1

# Backend (.env in /backend) - Optional for IPFS
PINATA_API_KEY=your_pinata_api_key
PINATA_SECRET_KEY=your_pinata_secret_key
```

3. **Run Development Environment**
```bash
# Start both frontend and backend concurrently
npm run dev

# Or run separately:
npm run frontend  # React dev server on :3000
npm run backend   # Express API server on :3001
```

4. **Smart Contract Deployment**
```bash
cd move-contracts
aptos move compile
aptos move publish --named-addresses aura_weaver=<YOUR_ADDRESS>
```

## How to Use

### **Step 1: Connect Wallet**
- Install Petra wallet if not already installed
- Switch to Aptos Devnet in wallet settings
- Get test APT from [Aptos faucet](https://aptoslabs.com/faucet)
- Click "Connect Petra Wallet" on landing page

### **Step 2: Set Your Mood**
- Enter a creative mood seed (e.g., "happy 😊", "mystical 🌟", "energetic ⚡")
- Longer, more diverse seeds increase NFT rarity
- System automatically fetches your transaction count

### **Step 3: Generate Your Aura**
- Click "Generate My Aura" to create visualization
- Watch as particles, colors, and patterns reflect your unique data
- Each generation is deterministic yet visually rich

### **Step 4: Mint as NFT**
- Click "Mint as NFT" to deploy to blockchain
- Metadata stored on IPFS (or demo mode if service unavailable)
- Receive unique Aptos NFT with calculated rarity score

## Technical Deep Dive

### **Generative Art Algorithm**
```typescript
// Mood-based color palettes
const moodPalettes = {
  happy: [[255, 223, 0], [255, 165, 0]], // Warm yellows
  calm: [[64, 224, 208], [0, 191, 255]], // Cool blues  
  mysterious: [[75, 0, 130], [138, 43, 226]] // Deep purples
};

// Particle behavior based on transaction count
const particleCount = Math.min(transactionCount + 10, 35);
const behaviors = ['orbiting', 'spiral', 'wave']; // Different motion patterns
```

### **Rarity Calculation (Move Smart Contract)**
```move
fun calculate_rarity(tx_count: u64, mood_seed: String): u8 {
    let base_rarity = if (tx_count > 5000) 90      // Ultra rare
                     else if (tx_count > 1000) 80  // Rare  
                     else if (tx_count > 100) 60   // Uncommon
                     else 40;                      // Common
    
    let seed_bonus = calculate_complexity_bonus(mood_seed);
    let diversity_bonus = count_unique_characters(mood_seed);
    
    min(base_rarity + seed_bonus + diversity_bonus, 100)
}
```

### **Blockchain Integration**
```typescript
// NFT Minting with Aptos TypeScript SDK
const response = await signAndSubmitTransaction({
  data: {
    function: "0x[CONTRACT]::aura_nft::mint_aura",
    functionArguments: [moodSeed, transactionCount, tokenName, metadataUri],
  },
  options: {
    maxGasAmount: 10000,
    gasUnitPrice: 100,
  }
});
```

## Project Structure

```
Aptos-Aura-Weaver/
├── frontend/                    # React TypeScript app
│   ├── src/
│   │   ├── components/         # React components (Landing, Wallet, Aura pages)
│   │   ├── contexts/           # Global state management
│   │   ├── services/           # IPFS and external API services
│   │   ├── utils/              # Validation, analytics, performance utilities
│   │   ├── types/              # TypeScript type definitions
│   │   └── AuraGenerator.tsx   # p5.js generative art engine
│   ├── public/                 # Static assets and PWA config
│   └── build/                  # Production build output
│
├── backend/                     # Express.js API server  
│   ├── server.js               # Main server with IPFS integration
│   ├── rateLimiter.js          # API rate limiting middleware
│   ├── logger.js               # Comprehensive logging system
│   └── logs/                   # Application logs
│
├── move-contracts/              # Aptos Move smart contracts
│   ├── sources/aura_nft.move   # Main NFT contract with rarity logic
│   ├── Move.toml               # Package configuration  
│   └── build/                  # Compiled contract bytecode
│
└── build/                       # Contract build artifacts
```

## Live Demo & Contract Info

- **Live App**: [https://alokumarjaiswal.github.io/Aptos-Aura-Weaver](https://alokumarjaiswal.github.io/Aptos-Aura-Weaver)
- **Contract Address**: `0x0b65f8046e689981c490d760553a03b9d11775d03d78c141d6a44041c3b12a43`
- **Network**: Aptos Devnet (Switch wallet to Devnet)
- **Gas**: ~0.001-0.01 APT per mint (use faucet for test tokens)

## Security & Best Practices

### **Smart Contract Security**
- Input validation for mood seeds (length, character filtering)
- Gas optimization for minting operations  
- Event emission for transaction tracking
- Proper error handling with descriptive messages

### **Frontend Security**
- XSS prevention through input sanitization
- CSP headers and security middleware
- Rate limiting on API endpoints
- Secure wallet integration patterns

### **Data Privacy**
- No personal data storage (only public blockchain data)
- Optional IPFS storage with user consent
- Local image generation (no server-side processing)
- Transparent on-chain metadata

## Advanced Configuration

### **Network Switching**
```typescript
// Supports multiple Aptos networks
const networks = {
  devnet: 'https://fullnode.devnet.aptoslabs.com/v1',
  testnet: 'https://fullnode.testnet.aptoslabs.com/v1', 
  mainnet: 'https://fullnode.mainnet.aptoslabs.com/v1'
};
```

### **Custom Rarity Tuning**
```move
// Adjustable rarity parameters in smart contract
const RARITY_THRESHOLDS: [u64; 4] = [50, 100, 1000, 5000];
const COMPLEXITY_MULTIPLIERS: [u8; 3] = [5, 10, 15];
```

### **Performance Optimization**
- Lazy loading for heavy components (AuraGenerator)  
- Code splitting with dynamic imports
- Image compression and caching
- Efficient p5.js rendering with `noLoop()` for static generation

## Rarity System Breakdown

| Transaction Count | Base Rarity | Bonus Factors |
|------------------|-------------|---------------|
| 5000+ | 90 (Ultra Rare) | +15 for complex mood |
| 1000-4999 | 80 (Rare) | +10 for medium complexity |
| 500-999 | 70 (Uncommon) | +5 for simple mood |  
| 100-499 | 60 (Common) | +10 for character diversity |
| 50-99 | 50 (Basic) | Max total: 100 |
| <50 | 40 (Starter) | |

## Troubleshooting

### **Common Issues**

**"Transaction failed: Insufficient funds"**
- Get test APT from Aptos faucet
- Ensure you're on Devnet network

**"Network mismatch detected"**  
- Switch Petra wallet to Devnet
- Refresh page after network change

**"IPFS upload failed"**
- App continues with demo mode
- Check backend service status

**"Wallet connection failed"**
- Install/update Petra wallet extension
- Unlock wallet before connecting

## Contributing

We welcome contributions! Areas of interest:

- **New mood-based algorithms** for particle generation
- **Enhanced rarity mechanisms** in smart contracts  
- **Mobile app development** (React Native)
- **Advanced IPFS integration** and metadata standards
- **Multi-chain deployment** (other Move-based chains)

### **Development Workflow**
1. Fork repository and create feature branch
2. Run full test suite: `npm test`
3. Test on Devnet before PR submission
4. Follow TypeScript strict mode and ESLint rules
5. Update documentation for new features

## Roadmap

- [ ] **Mobile App** - React Native version
- [ ] **Social Features** - Share auras on social media
- [ ] **Advanced Algorithms** - More complex generative patterns  
- [ ] **Marketplace Integration** - Trade auras on Aptos NFT markets
- [ ] **DAO Governance** - Community-driven feature development
- [ ] **Multi-Chain** - Deploy to other Move-based blockchains
- [ ] **AI Integration** - ML-enhanced mood interpretation
- [ ] **VR/AR Support** - Immersive aura visualization

## License

MIT License - feel free to use, modify, and distribute

## Acknowledgments

- **Aptos Labs** - For the incredible Move language and TypeScript SDK
- **p5.js Community** - For the powerful generative art framework  
- **Petra Wallet Team** - For seamless wallet integration
- **IPFS/Pinata** - For decentralized storage infrastructure

---

**Generate your unique digital aura and mint it as an NFT on Aptos blockchain today!**

*Built with ❤️ for the Aptos ecosystem*
