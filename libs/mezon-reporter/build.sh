#!/bin/bash

# Mezon Reporter Library Build and Publish Script

echo "🚀 Building @mezon/playwright-reporter..."

# Navigate to the library directory
cd "$(dirname "$0")"

# Clean previous build
echo "🧹 Cleaning previous build..."
npm run clean

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Build the library
echo "🔨 Building library..."
npm run build

# Check if build was successful
if [ $? -eq 0 ]; then
    echo "✅ Build successful!"
    
    # Check if we should publish
    if [ "$1" = "--publish" ]; then
        echo "📤 Publishing to npm..."
        npm publish
        
        if [ $? -eq 0 ]; then
            echo "🎉 Published successfully!"
        else
            echo "❌ Publish failed!"
            exit 1
        fi
    else
        echo "💡 To publish, run: ./build.sh --publish"
    fi
else
    echo "❌ Build failed!"
    exit 1
fi

echo "📋 Library info:"
echo "Name: $(npm pkg get name | tr -d '"')"
echo "Version: $(npm pkg get version | tr -d '"')"
echo "Main: $(npm pkg get main | tr -d '"')"
echo "Types: $(npm pkg get types | tr -d '"')"
