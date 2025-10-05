# SafetySnap - PPE Detection System

SafetySnap is a web application that detects safety gear (helmet, vest) in uploaded images. Users can upload images, view detection results, check history, and analyze safety compliance data.

## 🚀 Quick Start

### Backend
```bash
cd backend
npm install
npm run dev
```
Backend runs on: http://localhost:3001

### Frontend
```bash
cd frontend
npm install
npm run dev
```
Frontend runs on: http://localhost:5173

## 🛠️ Tech Stack

- **Frontend**: React.js + Vite, React Router
- **Backend**: Node.js + Express
- **Database**: SQLite
- **Detection**: Advanced computer vision PPE detection service
- **Image Processing**: Sharp, Canvas

## 📁 Project Structure

```
SafetySnap/
├── backend/          # Node.js API server
│   ├── src/         # Source code
│   │   ├── routes/  # API routes
│   │   ├── detection.js # PPE detection engine
│   │   ├── database.js  # Database setup
│   │   └── server.js    # Express server
│   └── uploads/     # Image storage
└── frontend/        # React application
    └── src/         # Components & pages
        ├── pages/   # Route components
        └── services/# API client
```

## 🔐 Demo Credentials

- **Email**: admin@mail.com
- **Password**: admin123

## ✨ Features

- **Image Upload**: Multipart file upload with PPE detection
- **PPE Detection**: Advanced detection of helmets, vests, and full PPE kits
- **Bounding Boxes**: Normalized coordinates (0-1) for detected objects
- **History Filtering**: Filter by label, date range with pagination
- **Analytics Dashboard**: Detection statistics and trends
- **Duplicate Detection**: File hash-based duplicate prevention
- **Rate Limiting**: 60 requests per minute per IP
- **Idempotency**: Support for idempotent requests

## 📡 API Summary

### Core Endpoints
- `POST /api/images` - Upload and analyze images
- `GET /api/images` - List images with filtering and pagination
- `GET /api/images/:id` - Get specific image details
- `DELETE /api/images/:id` - Delete an image
- `GET /api/labels` - Get available PPE labels

### System Endpoints
- `GET /api/health` - Health check
- `GET /api/_meta` - API metadata
- `GET /.well-known/hackathon.json` - Hackathon submission info

## 📋 API Documentation

### POST /api/images
Upload an image for PPE detection analysis.

**Request:**
```bash
curl -X POST http://localhost:3001/api/images \
  -H "Content-Type: multipart/form-data" \
  -H "Idempotency-Key: unique-key-123" \
  -F "image=@safety-worker.jpg"
```

**Response:**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "filename": "safety-worker.jpg",
  "detections_hash": "abc123def456",
  "detections": [
    {
      "label": "helmet",
      "confidence": "0.95",
      "bbox": {
        "x": 0.1,
        "y": 0.05,
        "width": 0.3,
        "height": 0.25
      }
    },
    {
      "label": "vest",
      "confidence": "0.88",
      "bbox": {
        "x": 0.2,
        "y": 0.3,
        "width": 0.6,
        "height": 0.5
      }
    }
  ],
  "message": "Image uploaded and processed successfully"
}
```

### GET /api/images
List images with optional filtering and pagination.

**Request:**
```bash
curl "http://localhost:3001/api/images?limit=10&offset=0&label=helmet&from=2025-10-01&to=2025-10-05"
```

**Response:**
```json
{
  "images": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "filename": "worker.jpg",
      "filepath": "/uploads/worker.jpg",
      "upload_date": "2025-10-05T10:30:00Z",
      "detection_count": 2,
      "detections_hash": "abc123def456"
    }
  ],
  "pagination": {
    "limit": 10,
    "offset": 0,
    "total": 25,
    "next_offset": 10
  }
}
```

### GET /api/images/:id
Get detailed information about a specific image.

**Request:**
```bash
curl http://localhost:3001/api/images/550e8400-e29b-41d4-a716-446655440000
```

**Response:**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "filename": "worker.jpg",
  "filepath": "/uploads/worker.jpg",
  "upload_date": "2025-10-05T10:30:00Z",
  "processed": true,
  "detections_hash": "abc123def456",
  "detections": [
    {
      "id": 1,
      "label": "helmet",
      "confidence": "0.95",
      "bbox": {
        "x": 0.1,
        "y": 0.05,
        "width": 0.3,
        "height": 0.25
      }
    }
  ]
}
```

### DELETE /api/images/:id
Delete an image and its associated data.

**Request:**
```bash
curl -X DELETE http://localhost:3001/api/images/550e8400-e29b-41d4-a716-446655440000
```

**Response:**
```json
{
  "message": "Image deleted successfully"
}
```

### GET /api/labels
Get available PPE detection labels.

**Request:**
```bash
curl http://localhost:3001/api/labels
```

**Response:**
```json
{
  "labels": [
    {
      "id": 1,
      "name": "helmet",
      "description": "Safety helmets in various colors"
    },
    {
      "id": 2,
      "name": "vest",
      "description": "High-visibility safety vests"
    },
    {
      "id": 3,
      "name": "person",
      "description": "Human person detection"
    }
  ]
}
```

## 🔒 Robustness Features

### Pagination
All list endpoints support pagination with `limit` and `offset` parameters:
- Default limit: 10
- Response includes `next_offset` for easy pagination
- Total count provided for UI pagination controls

### Idempotency
POST requests support `Idempotency-Key` header:
- Duplicate requests with same key return cached results
- Prevents accidental duplicate uploads
- Key stored securely in database

### Rate Limiting
- **Limit**: 60 requests per minute per IP address
- **Response**: HTTP 429 with proper error format when exceeded
- **Headers**: Standard rate limit headers included

### Error Handling
Uniform error format across all endpoints:
```json
{
  "error": {
    "code": "FIELD_REQUIRED",
    "field": "image",
    "message": "Image file is required"
  }
}
```

### CORS
- Fully enabled for cross-origin requests
- Supports all HTTP methods
- Allows custom headers including Idempotency-Key

## 🧪 Seed Data

The application starts with:
- Empty database (SQLite auto-created)
- Sample PPE labels pre-populated
- Upload directory auto-created

## 🏛️ Architecture Notes

SafetySnap uses a clean separation between frontend and backend with a RESTful API design. The backend employs advanced computer vision techniques for PPE detection, including color-based helmet detection (green, yellow, dark blue), high-visibility vest recognition with reflective stripe analysis, and full PPE kit detection for protective suits. The system uses SQLite for reliable data persistence, implements comprehensive error handling with proper HTTP status codes, and includes robust features like duplicate detection via file hashing, idempotency support, and rate limiting. The frontend provides an intuitive React-based interface with real-time detection visualization using HTML5 Canvas for bounding box overlays.

- `POST /api/images` - Upload & detect PPE
- `GET /api/images` - List images
- `GET /api/images/:id` - Get details
- `DELETE /api/images/:id` - Delete image
- `GET /api/labels` - Get labels

## 📄 License

MIT
