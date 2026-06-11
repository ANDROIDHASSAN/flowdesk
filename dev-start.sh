#!/bin/bash
echo "🚀 Starting Pulse CRM development environment..."
echo ""

# Kill any existing processes
pkill -f "node\|tsx\|vite" 2>/dev/null || true
sleep 2

# Start the API with in-memory DB
echo "🔧 Booting API server with demo data..."
cd /d/truecodeai/taskmanagement/server
npx tsx scripts/dev-seed.ts &
SERVER_PID=$!
sleep 8

echo ""
echo "✨ ============================================"
echo "✨ Pulse CRM is ready!"
echo "✨ ============================================"
echo ""
echo "📱 Open your browser:"
echo "   👉 http://localhost:5174"
echo ""
echo "🔐 Demo logins (click on login page):"
echo "   • Owner: owner@pulse.demo / pulse1234"
echo "   • Priya: priya@pulse.demo / pulse1234"
echo "   • Rahul: rahul@pulse.demo / pulse1234"
echo "   • Sana:  sana@pulse.demo / pulse1234"
echo ""
echo "💡 The API is at http://localhost:4000"
echo ""

# Start the client
cd /d/truecodeai/taskmanagement/client
npx vite --port 5174
