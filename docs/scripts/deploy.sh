#!/bin/bash

# NeuroNest Deployment Script
echo "🚀 Deploying NeuroNest to production..."

# Check if build passes
echo "📦 Running production build..."
npm run build

if [ $? -eq 0 ]; then
    echo "✅ Build successful!"
    
    # Deploy to Vercel (if vercel CLI is installed)
    if command -v vercel &> /dev/null; then
        echo "🌐 Deploying to Vercel..."
        vercel --prod
    else
        echo "⚠️  Vercel CLI not found. Install with: npm i -g vercel"
        echo "📋 Manual deployment steps:"
        echo "1. Install Vercel CLI: npm i -g vercel"
        echo "2. Login: vercel login"
        echo "3. Deploy: vercel --prod"
    fi
    
    echo "🎉 Deployment process completed!"
    echo "📝 Don't forget to set environment variables in your deployment platform:"
    echo "   - NEXT_PUBLIC_SUPABASE_URL"
    echo "   - NEXT_PUBLIC_SUPABASE_ANON_KEY"
    
else
    echo "❌ Build failed. Please fix errors before deploying."
    exit 1
fi