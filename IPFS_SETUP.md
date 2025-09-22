# IPFS Setup Guide for Aptos Aura Weaver

## For Development/Testing (Demo Mode)

The application now works in **demo mode** without IPFS configuration. When you mint an NFT, it will:
- Use a placeholder image URI instead of uploading to IPFS
- Still create a valid NFT on the Aptos blockchain
- Show "(Demo Mode)" in the success notification

This is perfect for testing the minting functionality without setting up IPFS.

## For Production (Real IPFS)

To use real IPFS storage for NFTs, follow these detailed steps:

### Step 1: Create Pinata Account
1. **Visit Pinata**: Go to [https://pinata.cloud/](https://pinata.cloud/)
2. **Sign Up**: Click "Sign Up" and create a free account using email or GitHub
3. **Verify Email**: Check your inbox and verify your email address
4. **Complete Setup**: Fill out basic profile information

### Step 2: Create API Keys
1. **Navigate to API Keys**: In your Pinata dashboard, go to "API Keys" in the left sidebar
2. **Create New Key**: Click "New Key" button
3. **Configure Key**:
   - **Key Name**: `Aptos Aura Weaver` (or your preferred name)
   - **Admin Access**: ✅ Enable (needed for pinning)
   - **Endpoint Access**: ✅ Enable (needed for uploads)
   - **IPFS Pinning**: ✅ Enable (needed for permanent storage)
4. **Save Key**: Click "Create Key" and copy the API Key and Secret

### Step 3: Configure Environment Variables

Create a `.env` file in the **frontend** directory (not root):

```bash
# IPFS Configuration
REACT_APP_PINATA_API_KEY=your_actual_pinata_api_key_here
REACT_APP_PINATA_SECRET_KEY=your_actual_pinata_secret_key_here
REACT_APP_IPFS_GATEWAY=https://gateway.pinata.cloud/ipfs/

# Optional: Network Configuration
REACT_APP_APTOS_NETWORK=devnet
REACT_APP_APTOS_NODE_URL=https://fullnode.devnet.aptoslabs.com/v1
```

**⚠️ Security Note**: Never commit the `.env` file to version control!

### Step 4: Install Frontend Dependencies

```bash
cd frontend
npm install
```

### Step 5: Restart Development Server

```bash
npm start
```

### Step 6: Test Production Mode

1. **Connect Wallet**: Connect your Petra wallet
2. **Generate Aura**: Enter a mood seed and generate an aura
3. **Mint NFT**: Click "Mint as NFT"
4. **Verify Upload**: You should see:
   - "Uploading Image" notification
   - "Preparing Demo NFT" → "Minting Started" → "NFT Minted Successfully"
   - No "(Demo Mode)" notification

### Step 7: Verify IPFS Storage

1. **Check Pinata Dashboard**: Your uploaded files should appear in "Pinned Files"
2. **Verify NFT Metadata**: The NFT should have proper IPFS URIs
3. **Test Gateway**: IPFS links should be accessible via gateway

### Step 8: Production Deployment Considerations

For production deployment:

1. **Environment Variables**: Use your hosting platform's environment variable system
2. **Domain Configuration**: Set up CORS on your domain if needed
3. **Rate Limiting**: Monitor API usage on Pinata dashboard
4. **Backup Strategy**: Consider pinning important NFTs to multiple services
5. **Monitoring**: Set up alerts for failed uploads

## Benefits of IPFS

- **Decentralized Storage**: Your NFT images and metadata are stored on IPFS
- **Permanent Links**: IPFS hashes ensure your content is always accessible
- **Web3 Native**: Proper integration with blockchain ecosystems
- **Cost Effective**: Pinata has generous free tier limits

## Demo vs Production

| Feature | Demo Mode | Production Mode |
|---------|-----------|-----------------|
| NFT Minting | ✅ Works | ✅ Works |
| Blockchain | ✅ Real Aptos | ✅ Real Aptos |
| Image Storage | ❌ Placeholder | ✅ IPFS |
| Metadata | ❌ Placeholder | ✅ IPFS |
| Cost | ✅ Free | ✅ Free tier available |
| Setup Time | ✅ Instant | ✅ 5 minutes |

## Troubleshooting

If you get IPFS upload errors:
1. Check your API keys are correct
2. Ensure your Pinata account has upload permissions
3. Check your internet connection
4. Verify the Pinata service is operational

The application will automatically fall back to demo mode if IPFS fails, so your NFTs will still be created on-chain!
