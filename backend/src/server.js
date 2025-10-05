import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

// Import routes
import imagesRouter from './routes/images.js';
import labelsRouter from './routes/labels.js';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// Rate limiting - 60 req/min/user as required
const limiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 60, // limit each IP to 60 requests per minute
  message: { error: { code: 'RATE_LIMIT', message: 'Too many requests, please try again later.' } },
  standardHeaders: true,
  legacyHeaders: false
});

// Middleware
app.use(cors());
app.use(limiter);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Create uploads directory if it doesn't exist
const uploadDir = process.env.UPLOAD_DIR || join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Serve static files from uploads directory
app.use('/uploads', express.static(uploadDir));

// Routes
app.use('/api/images', imagesRouter);
app.use('/api/labels', labelsRouter);

// Required submission endpoints
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'SafetySnap API is running' });
});

app.get('/api/_meta', (req, res) => {
  res.json({
    app_name: 'SafetySnap',
    version: '1.0.0',
    description: 'PPE Detection System - Upload images, detect helmets and vests, get analysis',
    author: 'Madhav',
    created_at: '2025-10-05',
    endpoints: [
      'POST /api/images',
      'GET /api/images',
      'GET /api/images/:id',
      'DELETE /api/images/:id',
      'GET /api/labels',
      'GET /api/health',
      'GET /api/_meta'
    ],
    features: ['PPE Detection', 'Image Upload', 'History Filtering', 'Analytics Dashboard']
  });
});

app.get('/.well-known/hackathon.json', (req, res) => {
  res.json({
    hackathon: 'Skillion Hackathon',
    problem_statement: 'SafetySnap - Image Upload + PPE Analysis',
    team: 'Solo Developer',
    submission_date: '2025-10-05',
    demo_credentials: {
      email: 'admin@mail.com',
      password: 'admin123'
    },
    api_base_url: 'http://localhost:3001/api',
    frontend_url: 'http://localhost:5173',
    features_implemented: [
      'Image upload with PPE detection',
      'Detection results with bounding boxes',
      'Upload history with filtering',
      'Analytics dashboard',
      'Rate limiting (60 req/min)',
      'Duplicate file detection',
      'Normalized bounding boxes (0-1)',
      'Detection hash generation'
    ]
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    error: 'Something went wrong!',
    message: err.message 
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`SafetySnap backend server running on port ${PORT}`);
});

export default app;
