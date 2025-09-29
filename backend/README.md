# Aura Weaver Backend API

Backend service for the Aptos Aura Weaver NFT application, handling secure IPFS uploads via Pinata.

## Features

- **Secure IPFS Storage**: API keys are kept server-side for security
- **Complete NFT Upload**: Single endpoint to upload both image and metadata
- **Individual Uploads**: Separate endpoints for image-only or metadata-only uploads
- **Health Check**: Service availability monitoring
- **CORS Support**: Configured for frontend communication

## API Endpoints

### Health Check
```
GET /health
```
Returns service status and availability.

### Upload Complete NFT
```
POST /api/upload-nft
```
Upload both image and metadata in one request.

**Request:** `multipart/form-data`
- `image`: Image file (File)
- `metadata`: JSON string containing NFT metadata

**Response:**
```json
{
  "success": true,
  "hash": "metadata_ipfs_hash",
  "url": "https://gateway.pinata.cloud/ipfs/metadata_hash",
  "imageHash": "image_ipfs_hash", 
  "imageUrl": "https://gateway.pinata.cloud/ipfs/image_hash",
  "metadata": { /* complete metadata with image URL */ }
}
```

### Upload File Only
```
POST /api/upload-file
```
Upload a single file to IPFS.

**Request:** `multipart/form-data`
- `file`: File to upload

### Upload Metadata Only
```
POST /api/upload-metadata
```
Upload JSON metadata to IPFS.

**Request:** `application/json`
```json
{
  "metadata": {
    "name": "NFT Name",
    "description": "NFT Description",
    // ... other metadata fields
  }
}
```

## Setup

1. **Install Dependencies**
   ```bash
   cd backend
   npm install
   ```

2. **Configure Environment**
   ```bash
   cp .env.example .env
   # Edit .env with your Pinata credentials
   ```

3. **Start Development Server**
   ```bash
   npm run dev
   ```

4. **Start Production Server**
   ```bash
   npm start
   ```

## Environment Variables

Create a `.env` file with:

```env
# Pinata IPFS API Keys
PINATA_API_KEY=your_pinata_api_key
PINATA_SECRET_KEY=your_pinata_secret_key

# Server Configuration
PORT=3002
NODE_ENV=development

# CORS Configuration
FRONTEND_URL=http://localhost:3000

# Logging Configuration (optional)
LOG_LEVEL=info  # error, warn, info, debug
```

## Security Features

- ✅ API keys stored server-side only
- ✅ CORS protection with helmet security headers
- ✅ Request validation and sanitization
- ✅ Comprehensive error handling
- ✅ Multi-tier rate limiting:
  - **General API**: 100 requests per 15 minutes
  - **File uploads**: 10 uploads per hour
  - **NFT uploads**: 5 NFTs per day
  - **Health checks**: 60 requests per minute
- ✅ Structured logging with Winston
- ✅ Request tracing with unique IDs

## Development

The service runs on `http://localhost:3001` by default.

Frontend should be configured with:
```env
REACT_APP_BACKEND_URL=http://localhost:3001
```

## Production Deployment

For production deployment:

1. Set `NODE_ENV=production`
2. Configure proper CORS origins
3. Use HTTPS
4. Add rate limiting
5. Add authentication if needed
6. Monitor service health

## Logging & Monitoring

The service uses structured logging with Winston for comprehensive monitoring:

### Log Files
- `logs/combined.log` - All application logs
- `logs/error.log` - Error logs only
- Console output - Real-time logs during development

### Log Levels
- **error**: Critical errors requiring immediate attention
- **warn**: Warning conditions (rate limits, validation failures)
- **info**: Normal operational messages (requests, uploads)
- **debug**: Detailed debugging information

### Request Tracing
Every request gets a unique ID for tracking across logs:
```
15:42:33 info: Incoming request [abc123def456] (127.0.0.1)
15:42:34 info: IPFS NFT upload [abc123def456] (1.2s)
15:42:34 info: Request completed [abc123def456] (1.3s)
```

### Key Metrics Logged
- Request/response times
- File upload sizes and types
- IPFS operation success/failure
- Rate limiting violations
- Error contexts with stack traces

## Rate Limiting

Multi-tier rate limiting protects against abuse:

| Endpoint | Limit | Window | Purpose |
|----------|-------|--------|---------|
| General API | 100 requests | 15 minutes | Prevent API abuse |
| File uploads | 10 uploads | 1 hour | Control bandwidth usage |
| NFT uploads | 5 NFTs | 24 hours | Prevent spam minting |
| Health checks | 60 requests | 1 minute | Allow monitoring |

Rate limit headers are included in responses:
- `RateLimit-Limit` - Request limit for the window
- `RateLimit-Remaining` - Requests remaining in current window
- `RateLimit-Reset` - Time when the window resets

## Error Handling

All endpoints return standardized error responses:

```json
{
  "success": false,
  "error": "Error message description"
}
```

Common error scenarios:
- Missing files or metadata
- IPFS service unavailable
- Invalid JSON metadata
- Network connectivity issues
- Rate limit exceeded
- File size/type restrictions