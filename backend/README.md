# SafetySnap Backend

Backend API server for SafetySnap PPE Detection System.

## Setup

```bash
npm install
npm run dev  # Development mode
npm start    # Production mode
```

Server runs on: http://localhost:3001

## API Endpoints

### Upload Image
```
POST /api/images
Content-Type: multipart/form-data
Body: image (file)
```

### List Images
```
GET /api/images?label=helmet&page=1&limit=10
```

### Get Image Details
```
GET /api/images/:id
```

### Delete Image
```
DELETE /api/images/:id
```

### Get Labels
```
GET /api/labels
```

## Environment Variables

Create `.env` file:
```
PORT=3001
UPLOAD_DIR=./uploads
DATABASE_PATH=./database.sqlite
MAX_FILE_SIZE=10485760
ALLOWED_FILE_TYPES=image/jpeg,image/png,image/jpg
```

## Database Schema

- **images**: id, filename, filepath, upload_date, processed
- **detections**: id, image_id, label, confidence, bbox coordinates
- **labels**: id, name, description

## Tech Stack

- Node.js + Express
- SQLite database
- Sharp (image processing)
- Multer (file uploads)
