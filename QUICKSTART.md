# 🚀 SafetySnap - Quick Start Guide

## ✅ Getting Started

### 🌐 Running the Application

**Backend (Terminal 1):**
```bash
cd backend
npm run dev
```
Access: http://localhost:3001

**Frontend (Terminal 2):**
```bash
cd frontend
npm run dev
```
Access: http://localhost:5173

### 📁 Project Structure

```
SafetySnap/
├── backend/                 # Node.js + Express API
│   ├── src/
│   │   ├── server.js       # Main server
│   │   ├── database.js     # SQLite setup
│   │   ├── detection.js    # PPE detection service
│   │   └── routes/         # API routes
│   ├── uploads/            # Uploaded images
│   └── package.json
│
└── frontend/               # React + Vite app
    ├── src/
    │   ├── pages/          # Page components
    │   ├── services/       # API client
    │   └── App.jsx         # Main app
    └── package.json
```

### 🎯 Features

1. **Upload Page** - Upload images for PPE detection
2. **History Page** - View all uploads with filters
3. **Result Page** - Detailed detection results with bounding boxes
4. **Analytics Page** - Statistics and charts

###  API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/images` | Upload & detect PPE |
| GET | `/api/images` | List images (with filters) |
| GET | `/api/images/:id` | Get image details |
| DELETE | `/api/images/:id` | Delete image |
| GET | `/api/labels` | Get available labels |

### 💡 Testing

1. Open http://localhost:5173
2. Go to Upload page
3. Upload a construction/worker image
4. See detection results (helmet, vest, person)
5. Check History and Analytics

### 🔧 Configuration

**Backend** (`backend/.env`):
```
PORT=3001
UPLOAD_DIR=./uploads
DATABASE_PATH=./database.sqlite
MAX_FILE_SIZE=10485760
```

**Frontend** (`frontend/.env`):
```
VITE_API_URL=http://localhost:3001/api
```

### � Troubleshooting

**Port already in use:**
- Change `PORT` in `backend/.env`
- Vite will auto-select another port

**Reset dependencies:**
```bash
rm -rf node_modules package-lock.json
npm install
```

### 📝 Notes

- Database: SQLite (auto-created)
- Uploads: `backend/uploads/`
- Max file size: 10MB
- Formats: JPEG, PNG

### 🔍 PPE Detection

The system uses computer vision techniques for PPE detection:
- Advanced image analysis algorithms
- Shape and color pattern recognition
- Real-time detection results
- Configurable confidence thresholds

### 🚀 Deployment

**Vercel (Frontend):**
1. Push to GitHub
2. Import in Vercel
3. Set `VITE_API_URL`
4. Deploy

**Render (Backend):**
1. Push to GitHub
2. Create Web Service
3. Set environment variables
4. Deploy
