#!/bin/bash
# ── Patient History Copilot — Quick Start ────────────────────────────────────
set -e

echo ""
echo "🏥  Patient History Copilot — Setup"
echo "────────────────────────────────────"

# Check .env
if [ ! -f .env ]; then
  echo "📋  Copying .env.example → .env"
  cp .env.example .env
  echo ""
  echo "⚠️  Please edit .env and fill in your API keys before continuing:"
  echo "    COGNEE_API_KEY   → https://cognee.ai (use code COGNEE-35 for free \$35 credit)"
  echo "    ANTHROPIC_API_KEY → https://console.anthropic.com"
  echo ""
  read -p "Press Enter once you've filled in .env..."
fi

# Option: Docker or local
echo ""
echo "How do you want to run the app?"
echo "  1) Docker Compose (recommended)"
echo "  2) Local (manual)"
read -p "Choice [1/2]: " CHOICE

if [ "$CHOICE" = "1" ]; then
  echo ""
  echo "🐳  Starting with Docker Compose..."
  docker compose up --build
else
  echo ""
  echo "🐍  Setting up backend..."
  cd backend
  python -m venv venv
  source venv/bin/activate
  pip install -r requirements.txt
  python -m spacy download en_core_web_lg
  echo ""
  echo "🚀  Starting FastAPI backend on http://localhost:8000"
  uvicorn main:app --reload &
  BACKEND_PID=$!
  cd ..

  echo ""
  echo "⚛️   Setting up frontend..."
  cd frontend
  npm install
  echo "🚀  Starting React frontend on http://localhost:5173"
  npm run dev &
  FRONTEND_PID=$!
  cd ..

  echo ""
  echo "✅  Both servers running."
  echo "    Backend:  http://localhost:8000"
  echo "    Frontend: http://localhost:5173"
  echo "    API docs: http://localhost:8000/docs"
  echo ""
  echo "Press Ctrl+C to stop."
  wait $BACKEND_PID $FRONTEND_PID
fi
