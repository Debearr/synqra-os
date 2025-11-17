#!/bin/bash
# Quick deployment script for Synqra OS
# Run this after setting up Vercel/Railway tokens

set -e

echo "🚀 Synqra OS Deployment Script"
echo "================================"
echo ""

# Check for deployment tools
if command -v vercel &> /dev/null; then
    echo "✓ Vercel CLI found"
    read -p "Deploy to Vercel? (y/n): " deploy_vercel
    if [ "$deploy_vercel" = "y" ]; then
        echo "Deploying to Vercel..."
        vercel --prod
    fi
elif command -v railway &> /dev/null; then
    echo "✓ Railway CLI found"
    read -p "Deploy to Railway? (y/n): " deploy_railway
    if [ "$deploy_railway" = "y" ]; then
        echo "Deploying to Railway..."
        railway up
    fi
else
    echo "⚠️  No deployment CLI found"
    echo ""
    echo "Install options:"
    echo "  Vercel: npm i -g vercel"
    echo "  Railway: bash <(curl -fsSL cli.new)"
    echo ""
    echo "Or deploy via web:"
    echo "  Vercel: https://vercel.com/new"
    echo "  Railway: https://railway.app/new"
    exit 1
fi

echo ""
echo "✅ Deployment initiated!"
echo "Check your dashboard for the live URL"
