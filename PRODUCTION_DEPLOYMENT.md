# Production Deployment Guide for Aptos Aura Weaver

## 🚀 Complete Production Setup Guide

### Phase 1: IPFS Storage Setup (Current Focus)

#### **Step 1: Pinata Account Setup**
1. **Visit**: https://pinata.cloud/
2. **Sign Up**: Create free account with email/GitHub
3. **Verify**: Check email and complete verification
4. **Dashboard**: Access your Pinata dashboard

#### **Step 2: API Key Configuration**
1. **Navigate**: Go to "API Keys" in sidebar
2. **Create Key**:
   - Name: "Aptos Aura Weaver"
   - ✅ Admin Access (for pinning)
   - ✅ Endpoint Access (for uploads)
   - ✅ IPFS Pinning (for permanent storage)
3. **Copy Credentials**: Save API Key and Secret securely

#### **Step 3: Environment Configuration**
Create `.env` in frontend directory:

```bash
# IPFS Configuration
REACT_APP_PINATA_API_KEY=your_pinata_api_key_here
REACT_APP_PINATA_SECRET_KEY=your_pinata_secret_key_here
REACT_APP_IPFS_GATEWAY=https://gateway.pinata.cloud/ipfs/

# Network Configuration (for production)
REACT_APP_APTOS_NETWORK=mainnet
REACT_APP_APTOS_NODE_URL=https://fullnode.mainnet.aptoslabs.com/v1
```

#### **Step 4: Security Setup**
1. **Environment Variables**: Use secure environment variable management
2. **API Key Security**: Never expose keys in frontend code
3. **CORS Configuration**: Set up proper CORS policies
4. **Rate Limiting**: Monitor API usage

### Phase 2: Smart Contract Production Deployment

#### **Current State** ✅
- Contract: `0xb65f8046e689981c490d760553a03b9d11775d03d78c141d6a44041c3b12a43`
- Network: Devnet (ready for mainnet)
- Features: Auto-collection creation, validation, error handling

#### **For Mainnet Deployment**:
1. **Update Network**: Change to mainnet in environment variables
2. **Deploy Contract**: Use production deployment account
3. **Verify Contract**: Ensure contract is verified on Aptos Explorer
4. **Test Thoroughly**: Comprehensive testing on mainnet

### Phase 3: Frontend Production Deployment

#### **Build Optimization** ✅
- ✅ Lazy loading implemented
- ✅ Code splitting configured
- ✅ Bundle size optimized
- ✅ Production build tested

#### **Hosting Options**:
1. **Vercel/Netlify**: Easy deployment with environment variables
2. **AWS S3 + CloudFront**: Scalable with CDN
3. **IPFS**: Fully decentralized hosting
4. **Traditional Hosting**: Any static hosting provider

### Phase 4: Production Monitoring & Maintenance

#### **Monitoring Setup**:
1. **Error Tracking**: Sentry or similar
2. **Performance Monitoring**: Web vitals, Core Web Vitals
3. **Blockchain Monitoring**: Aptos Explorer, transaction monitoring
4. **IPFS Monitoring**: Pinata dashboard, upload success rates

#### **Maintenance Tasks**:
1. **Regular Updates**: Dependencies, security patches
2. **Content Moderation**: Monitor NFT content
3. **Gas Fee Monitoring**: Track transaction costs
4. **User Support**: Handle user issues and feedback

### Phase 5: Business & Legal Considerations

#### **Legal Setup**:
1. **Terms of Service**: User agreements
2. **Privacy Policy**: Data handling policies
3. **NFT Terms**: Usage rights, royalties
4. **Compliance**: KYC/AML if needed

#### **Business Model**:
1. **Revenue Streams**: Minting fees, premium features
2. **Marketing**: Community building, partnerships
3. **Growth**: User acquisition, retention strategies

## 🔧 Production Checklist

### ✅ Completed:
- [x] Smart contract deployment (devnet)
- [x] Frontend development
- [x] IPFS integration (demo mode)
- [x] Wallet integration
- [x] Error handling
- [x] Input validation
- [x] Gas fee funding

### 🔄 In Progress:
- [ ] IPFS production setup
- [ ] Mainnet deployment
- [ ] Production hosting

### 📋 To Do:
- [ ] Security audit
- [ ] Performance optimization
- [ ] Load testing
- [ ] Production monitoring
- [ ] Legal compliance
- [ ] Documentation completion

## 🚀 Quick Start Commands

### IPFS Setup:
```bash
# 1. Create .env file with Pinata keys
# 2. Test production mode
npm start
```

### Production Build:
```bash
npm run build
# Deploy build/ folder to hosting provider
```

### Contract Testing:
```bash
# Test on mainnet (when ready)
# Update .env with mainnet settings
# Deploy contract to mainnet account
```

## 🎯 Next Steps

1. **Complete IPFS Setup**: Follow the detailed guide above
2. **Test Production Mode**: Verify IPFS uploads work
3. **Deploy to Mainnet**: Move from devnet to mainnet
4. **Production Hosting**: Deploy frontend to production
5. **Monitoring Setup**: Implement production monitoring

Would you like me to help you with any specific step in the IPFS setup process, or shall we proceed with the next phase?
