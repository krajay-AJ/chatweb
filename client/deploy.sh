#!/bin/bash

# Vercel Deployment Script for ChatWeb Frontend

echo "🚀 Preparing ChatWeb Frontend for Vercel Deployment"
echo "=================================================="

# Build the project
echo "📦 Building React application..."
npm run build

if [ $? -eq 0 ]; then
    echo "✅ Build successful!"
    echo ""
    echo "🎯 Next Steps:"
    echo "1. Push your code to GitHub:"
    echo "   git init"
    echo "   git add ."
    echo "   git commit -m 'Deploy to Vercel'"
    echo "   git remote add origin https://github.com/YOUR_USERNAME/chatweb-frontend.git"
    echo "   git push -u origin main"
    echo ""
    echo "2. Deploy to Vercel:"
    echo "   - Go to https://vercel.com"
    echo "   - Sign in with GitHub"
    echo "   - Click 'New Project'"
    echo "   - Import your repository"
    echo "   - Deploy!"
    echo ""
    echo "3. Set Environment Variables in Vercel:"
    echo "   REACT_APP_SOCKET_URL = YOUR_BACKEND_URL"
    echo ""
    echo "📝 Your build is ready in the /build folder"
else
    echo "❌ Build failed. Check the errors above."
fi
