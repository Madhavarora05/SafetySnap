#!/bin/bash

# SafetySnap API Testing Script
# Run this to verify all endpoints are working

API_BASE="http://localhost:3001"

echo "🧪 Testing SafetySnap API Endpoints..."
echo "=================================="

# Test health endpoint
echo "1. Testing /api/health"
curl -s "${API_BASE}/api/health" | jq . || echo "❌ Health check failed"
echo ""

# Test meta endpoint
echo "2. Testing /api/_meta"
curl -s "${API_BASE}/api/_meta" | jq . || echo "❌ Meta endpoint failed"
echo ""

# Test hackathon.json
echo "3. Testing /.well-known/hackathon.json"  
curl -s "${API_BASE}/.well-known/hackathon.json" | jq . || echo "❌ Hackathon endpoint failed"
echo ""

# Test labels endpoint
echo "4. Testing /api/labels"
curl -s "${API_BASE}/api/labels" | jq . || echo "❌ Labels endpoint failed"
echo ""

# Test images endpoint (empty list)
echo "5. Testing /api/images"
curl -s "${API_BASE}/api/images" | jq . || echo "❌ Images endpoint failed"
echo ""

# Test rate limiting
echo "6. Testing rate limiting (making 5 quick requests)"
for i in {1..5}; do
  response=$(curl -s -o /dev/null -w "%{http_code}" "${API_BASE}/api/health")
  echo "Request $i: HTTP $response"
done
echo ""

echo "✅ API testing complete!"
echo ""
echo "🚀 Ready to deploy to:"
echo "- Railway: https://railway.app"  
echo "- Render: https://render.com"
echo "- Vercel: https://vercel.com"
echo ""
echo "📋 Don't forget to:"
echo "1. Push to GitHub"
echo "2. Set environment variables"
echo "3. Test the live deployment"
echo "4. Submit to Skillion Hackathon!"