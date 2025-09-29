const rateLimit = require('express-rate-limit');
const { logger } = require('./logger');

// General API rate limiting
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    success: false,
    error: 'Too many requests from this IP, please try again later.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  handler: (req, res) => {
    logger.warn('Rate limit exceeded', {
      ip: req.ip,
      requestId: req.requestId,
      url: req.url,
      method: req.method
    });
    
    res.status(429).json({
      success: false,
      error: 'Too many requests from this IP, please try again later.',
      retryAfter: '15 minutes'
    });
  }
});

// Stricter rate limiting for upload endpoints
const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // Limit each IP to 10 uploads per hour
  message: {
    success: false,
    error: 'Upload rate limit exceeded. Please wait before uploading again.',
    retryAfter: '1 hour'
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn('Upload rate limit exceeded', {
      ip: req.ip,
      requestId: req.requestId,
      url: req.url,
      method: req.method,
      fileSize: req.file?.size || 'unknown'
    });
    
    res.status(429).json({
      success: false,
      error: 'Upload rate limit exceeded. Please wait before uploading again.',
      retryAfter: '1 hour'
    });
  }
});

// Very strict rate limiting for NFT minting
const nftLimiter = rateLimit({
  windowMs: 24 * 60 * 60 * 1000, // 24 hours
  max: 5, // Limit each IP to 5 NFT uploads per day
  message: {
    success: false,
    error: 'Daily NFT upload limit reached. Please try again tomorrow.',
    retryAfter: '24 hours'
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn('NFT upload rate limit exceeded', {
      ip: req.ip,
      requestId: req.requestId,
      url: req.url,
      method: req.method
    });
    
    res.status(429).json({
      success: false,
      error: 'Daily NFT upload limit reached. Please try again tomorrow.',
      retryAfter: '24 hours'
    });
  }
});

// Health check rate limiting (very permissive)
const healthLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 60, // 60 requests per minute
  message: {
    success: false,
    error: 'Health check rate limit exceeded.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

module.exports = {
  generalLimiter,
  uploadLimiter,
  nftLimiter,
  healthLimiter
};