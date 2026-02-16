#!/bin/bash

# Simple server script for local development
# Synthient Marketing Website

echo "🚀 Starting Synthient Website Server..."
echo ""

# Check for Python
if command -v python3 &> /dev/null; then
    echo "✓ Using Python 3 HTTP server"
    echo "📍 Server running at: http://localhost:8000"
    echo "🛑 Press Ctrl+C to stop"
    echo ""
    python3 -m http.server 8000
    exit 0
fi

# Check for Node.js
if command -v node &> /dev/null; then
    echo "✓ Using Node.js HTTP server"
    echo "📍 Server running at: http://localhost:8000"
    echo "🛑 Press Ctrl+C to stop"
    echo ""
    npx http-server -p 8000
    exit 0
fi

# Check for PHP
if command -v php &> /dev/null; then
    echo "✓ Using PHP built-in server"
    echo "📍 Server running at: http://localhost:8000"
    echo "🛑 Press Ctrl+C to stop"
    echo ""
    php -S localhost:8000
    exit 0
fi

# No server available
echo "❌ No HTTP server found!"
echo ""
echo "Please install one of the following:"
echo "  • Python 3: https://www.python.org/"
echo "  • Node.js: https://nodejs.org/"
echo "  • PHP: https://www.php.net/"
echo ""
echo "Or simply open index.html directly in your browser."
exit 1
