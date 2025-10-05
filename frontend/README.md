# SafetySnap Frontend

React web interface for SafetySnap PPE Detection System.

## Setup

```bash
npm install
npm run dev    # Development server
npm run build  # Production build
```

App runs on: http://localhost:5173

## Configuration

Create `.env` file:
```
VITE_API_URL=http://localhost:3001/api
```

## Features

- 📤 Upload images for PPE detection
- 📊 View detection results with bounding boxes
- 📜 Browse upload history with filters
- 📈 Analytics dashboard
- 🎨 Responsive UI

## Project Structure

```
src/
├── pages/          # Page components
│   ├── Upload.jsx
│   ├── History.jsx
│   ├── Result.jsx
│   └── Analytics.jsx
├── services/       # API service
│   └── api.js
└── App.jsx         # Main app
```

## Tech Stack

- React 18
- Vite
- React Router
- Axios
- CSS3
