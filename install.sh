#!/bin/bash

# OpenVPN Panel Easy Installer
# https://github.com/ehsanking/openvpn-panel

echo "🚀 Starting OpenVPN Panel installation..."

# Check for .env and create from example if missing
if [ ! -f .env ]; then
    echo "📄 Creating .env from template..."
    cp .env.example .env
    echo "⚠️  Please edit .env to set your database credentials!"
fi

# Install dependencies
echo "📦 Installing npm dependencies..."
npm install

# Build the project
echo "🛠 Building the application..."
npm run build

echo "✅ Installation complete!"
echo "👉 Start the panel with: npm start"
echo "🌐 Access your panel at http://localhost:3000"
