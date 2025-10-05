#!/bin/bash
# Quick deployment script for SafetySnap backend

echo "🚀 SafetySnap Backend Deployment"
echo "================================="

# Install dependencies
echo "📦 Installing dependencies..."
npm install --production

# Create necessary directories
echo "📁 Creating directories..."
mkdir -p uploads
mkdir -p data

# Set environment variables
export NODE_ENV=production
export PORT=${PORT:-3001}
export DATABASE_PATH=${DATABASE_PATH:-./database.sqlite}
export UPLOAD_DIR=${UPLOAD_DIR:-./uploads}

echo "✅ Setup complete!"
echo "🌐 Starting server..."

# Start the server
npm start