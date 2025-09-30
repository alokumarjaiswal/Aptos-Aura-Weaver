const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const multer = require('multer');
const FormData = require('form-data');
const fetch = require('node-fetch');
require('dotenv').config();

const { logger, requestLogger, logError, logIPFSOperation } = require('./logger');
const { generalLimiter, uploadLimiter, nftLimiter, healthLimiter } = require('./rateLimiter');

const app = express();
const port = process.env.PORT || 3001;

// Security middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  contentSecurityPolicy: false // Disable for API service
}));

// Request logging
app.use(requestLogger);

// CORS middleware with flexible origin handling
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin) return callback(null, true);
    
    // List of allowed origins and patterns
    const allowedOrigins = [
      process.env.FRONTEND_URL,
      'http://localhost:3000',
      'http://localhost:3001', 
      'http://localhost:3002',
      'https://alokumarjaiswal.github.io',
      'https://alokumarjaiswal.github.io/Aptos-Aura-Weaver'
    ].filter(Boolean);
    
    // Allow any localhost port for development
    const isLocalhost = origin.includes('localhost') || origin.includes('127.0.0.1');
    
    // Check for exact match or GitHub Pages variations
    const isGitHubPages = origin === 'https://alokumarjaiswal.github.io' || 
                          origin.startsWith('https://alokumarjaiswal.github.io/');
    
    // Check for exact origin match
    const isAllowedOrigin = allowedOrigins.includes(origin);
    
    if (isLocalhost || isGitHubPages || isAllowedOrigin) {
      logger.debug('CORS allowed origin', { origin });
      callback(null, true);
    } else {
      logger.warn('CORS blocked origin', { origin, allowedOrigins });
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));

// Apply general rate limiting to all routes
app.use(generalLimiter);

// Configure multer for file uploads
const upload = multer({ storage: multer.memoryStorage() });

// Health check endpoint
app.get('/health', healthLimiter, (req, res) => {
  const healthData = {
    status: 'OK', 
    message: 'Aura Weaver Backend Service',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    version: '1.0.0',
    ipfsConfigured: !!process.env.PINATA_API_KEY
  };
  
  logger.debug('Health check requested', { 
    requestId: req.requestId,
    ip: req.ip 
  });
  
  res.json(healthData);
});

// Test endpoint for logging and rate limiting
app.get('/test', generalLimiter, (req, res) => {
  logger.info('Test endpoint called', {
    requestId: req.requestId,
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });
  
  res.json({
    success: true,
    message: 'Test endpoint working',
    requestId: req.requestId,
    timestamp: new Date().toISOString(),
    logLevel: String(logger.level || 'info')
  });
});

// Upload file to IPFS
app.post('/api/upload-file', uploadLimiter, upload.single('file'), async (req, res) => {
  const startTime = Date.now();
  
  try {
    if (!req.file) {
      logger.warn('File upload attempt without file', { 
        requestId: req.requestId,
        ip: req.ip 
      });
      return res.status(400).json({ success: false, error: 'No file provided' });
    }

    logger.info('Starting file upload', {
      requestId: req.requestId,
      filename: req.file.originalname,
      size: req.file.size,
      mimetype: req.file.mimetype,
      ip: req.ip
    });

    const formData = new FormData();
    formData.append('file', req.file.buffer, {
      filename: req.file.originalname,
      contentType: req.file.mimetype
    });

    const response = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
      method: 'POST',
      headers: {
        'pinata_api_key': process.env.PINATA_API_KEY,
        'pinata_secret_api_key': process.env.PINATA_SECRET_KEY,
        ...formData.getHeaders()
      },
      body: formData
    });

    if (!response.ok) {
      throw new Error(`IPFS upload failed: ${response.statusText}`);
    }

    const result = await response.json();
    const duration = Date.now() - startTime;

    logIPFSOperation('file upload', true, {
      requestId: req.requestId,
      hash: result.IpfsHash,
      filename: req.file.originalname,
      size: req.file.size,
      duration
    });

    res.json({
      success: true,
      hash: result.IpfsHash,
      url: `https://gateway.pinata.cloud/ipfs/${result.IpfsHash}`
    });

  } catch (error) {
    const duration = Date.now() - startTime;
    
    logError(error, {
      requestId: req.requestId,
      operation: 'file upload',
      filename: req.file?.originalname,
      size: req.file?.size,
      duration,
      ip: req.ip
    });
    
    logIPFSOperation('file upload', false, {
      requestId: req.requestId,
      error: error.message,
      duration
    });

    res.status(500).json({
      success: false,
      error: error.message || 'Unknown IPFS upload error'
    });
  }
});

// Upload JSON metadata to IPFS
app.post('/api/upload-metadata', uploadLimiter, async (req, res) => {
  const startTime = Date.now();
  
  try {
    const { metadata } = req.body;

    if (!metadata) {
      logger.warn('Metadata upload attempt without data', { 
        requestId: req.requestId,
        ip: req.ip 
      });
      return res.status(400).json({ success: false, error: 'No metadata provided' });
    }

    logger.info('Starting metadata upload', {
      requestId: req.requestId,
      metadataName: metadata.name || 'unnamed',
      ip: req.ip
    });

    const response = await fetch('https://api.pinata.cloud/pinning/pinJSONToIPFS', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'pinata_api_key': process.env.PINATA_API_KEY,
        'pinata_secret_api_key': process.env.PINATA_SECRET_KEY,
      },
      body: JSON.stringify({
        pinataContent: metadata,
        pinataMetadata: {
          name: 'aura-nft-metadata.json'
        }
      })
    });

    if (!response.ok) {
      throw new Error(`IPFS metadata upload failed: ${response.statusText}`);
    }

    const result = await response.json();
    const duration = Date.now() - startTime;

    logIPFSOperation('metadata upload', true, {
      requestId: req.requestId,
      hash: result.IpfsHash,
      metadataName: metadata.name || 'unnamed',
      duration
    });

    res.json({
      success: true,
      hash: result.IpfsHash,
      url: `https://gateway.pinata.cloud/ipfs/${result.IpfsHash}`
    });

  } catch (error) {
    const duration = Date.now() - startTime;
    
    logError(error, {
      requestId: req.requestId,
      operation: 'metadata upload',
      metadataName: req.body?.metadata?.name || 'unknown',
      duration,
      ip: req.ip
    });
    
    logIPFSOperation('metadata upload', false, {
      requestId: req.requestId,
      error: error.message,
      duration
    });

    res.status(500).json({
      success: false,
      error: error.message || 'Unknown IPFS metadata upload error'
    });
  }
});

// Upload complete NFT (image + metadata) in one operation
app.post('/api/upload-nft', nftLimiter, upload.fields([
  { name: 'image', maxCount: 1 },
  { name: 'metadata', maxCount: 1 }
]), async (req, res) => {
  const startTime = Date.now();
  try {
    const imageFile = req.files?.image?.[0];
    const metadataString = req.body?.metadata;

    if (!imageFile) {
      logger.warn('NFT upload attempt without image', { 
        requestId: req.requestId,
        ip: req.ip 
      });
      return res.status(400).json({ success: false, error: 'No image file provided' });
    }

    if (!metadataString) {
      logger.warn('NFT upload attempt without metadata', { 
        requestId: req.requestId,
        ip: req.ip 
      });
      return res.status(400).json({ success: false, error: 'No metadata provided' });
    }

    let metadata;
    try {
      metadata = JSON.parse(metadataString);
    } catch (parseError) {
      logger.warn('NFT upload with invalid JSON metadata', { 
        requestId: req.requestId,
        ip: req.ip,
        parseError: parseError.message
      });
      return res.status(400).json({ success: false, error: 'Invalid metadata JSON' });
    }

    logger.info('Starting NFT upload', {
      requestId: req.requestId,
      nftName: metadata.name || 'unnamed',
      imageSize: imageFile.size,
      imageMimeType: imageFile.mimetype,
      ip: req.ip
    });

    // Upload image first
    const imageFormData = new FormData();
    imageFormData.append('file', imageFile.buffer, {
      filename: `aura-${Date.now()}.png`,
      contentType: imageFile.mimetype
    });

    const imageResponse = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
      method: 'POST',
      headers: {
        'pinata_api_key': process.env.PINATA_API_KEY,
        'pinata_secret_api_key': process.env.PINATA_SECRET_KEY,
        ...imageFormData.getHeaders()
      },
      body: imageFormData
    });

    if (!imageResponse.ok) {
      throw new Error(`Image upload failed: ${imageResponse.statusText}`);
    }

    const imageResult = await imageResponse.json();
    const imageUrl = `https://gateway.pinata.cloud/ipfs/${imageResult.IpfsHash}`;

    // Update metadata with image URL
    const completeMetadata = {
      ...metadata,
      image: imageUrl
    };

    // Upload metadata
    const metadataResponse = await fetch('https://api.pinata.cloud/pinning/pinJSONToIPFS', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'pinata_api_key': process.env.PINATA_API_KEY,
        'pinata_secret_api_key': process.env.PINATA_SECRET_KEY,
      },
      body: JSON.stringify({
        pinataContent: completeMetadata,
        pinataMetadata: {
          name: `${metadata.name || 'aura-nft'}-metadata.json`
        }
      })
    });

    if (!metadataResponse.ok) {
      throw new Error(`Metadata upload failed: ${metadataResponse.statusText}`);
    }

    const metadataResult = await metadataResponse.json();
    const metadataUrl = `https://gateway.pinata.cloud/ipfs/${metadataResult.IpfsHash}`;
    const duration = Date.now() - startTime;

    logIPFSOperation('NFT upload', true, {
      requestId: req.requestId,
      nftName: metadata.name || 'unnamed',
      imageHash: imageResult.IpfsHash,
      metadataHash: metadataResult.IpfsHash,
      imageSize: imageFile.size,
      duration
    });

    res.json({
      success: true,
      hash: metadataResult.IpfsHash,
      url: metadataUrl,
      imageHash: imageResult.IpfsHash,
      imageUrl: imageUrl,
      metadata: completeMetadata
    });

  } catch (error) {
    const duration = Date.now() - startTime;
    
    logError(error, {
      requestId: req.requestId,
      operation: 'NFT upload',
      nftName: req.body?.metadata?.name || 'unknown',
      imageSize: req.files?.image?.[0]?.size,
      duration,
      ip: req.ip
    });
    
    logIPFSOperation('NFT upload', false, {
      requestId: req.requestId,
      error: error.message,
      duration
    });

    res.status(500).json({
      success: false,
      error: error.message || 'Unknown NFT upload error'
    });
  }
});

// Global error handler
app.use((error, req, res, next) => {
  logError(error, {
    requestId: req.requestId,
    url: req.url,
    method: req.method,
    ip: req.ip
  });
  
  res.status(500).json({
    success: false,
    error: process.env.NODE_ENV === 'production' 
      ? 'Internal server error' 
      : error.message
  });
});

// 404 handler
app.use('*', (req, res) => {
  logger.warn('Route not found', {
    requestId: req.requestId,
    method: req.method,
    url: req.url,
    ip: req.ip
  });
  
  res.status(404).json({
    success: false,
    error: 'Route not found'
  });
});

app.listen(port, () => {
  // Force immediate log write
  logger.info('Aura Weaver Backend started', {
    port,
    environment: process.env.NODE_ENV || 'development',
    frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
    ipfsConfigured: !!process.env.PINATA_API_KEY,
    logLevel: logger.level
  });
  
  console.log(`🚀 Aura Weaver Backend running on port ${port}`);
  console.log(`🔗 Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:3000'}`);
  console.log(`🔑 IPFS configured: ${process.env.PINATA_API_KEY ? 'Yes' : 'No'}`);
  console.log(`📝 Log level: ${logger.level}`);
});