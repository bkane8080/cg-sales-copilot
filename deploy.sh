#!/bin/bash
# ============================================================
# Velvet F&B — One-command local deployment
# Usage: ./deploy.sh
# ============================================================

set -e

echo "╔══════════════════════════════════════════════════╗"
echo "║  Velvet F&B Wholesale Companion — Deployment    ║"
echo "╚══════════════════════════════════════════════════╝"
echo ""

# Check prerequisites
command -v node >/dev/null 2>&1 || { echo "❌ Node.js is required. Install from https://nodejs.org"; exit 1; }
command -v npm >/dev/null 2>&1 || { echo "❌ npm is required."; exit 1; }

# Prompt for Snowflake credentials if not set
if [ -z "$SNOWFLAKE_ACCOUNT" ]; then
    echo "Enter your Snowflake account identifier (e.g., MYORG-MYACCOUNT):"
    read -r SNOWFLAKE_ACCOUNT
    export SNOWFLAKE_ACCOUNT
fi

if [ -z "$SNOWFLAKE_USER" ]; then
    echo "Enter your Snowflake username:"
    read -r SNOWFLAKE_USER
    export SNOWFLAKE_USER
fi

if [ -z "$SNOWFLAKE_PASSWORD" ]; then
    echo "Enter your Snowflake password/token:"
    read -rs SNOWFLAKE_PASSWORD
    export SNOWFLAKE_PASSWORD
    echo ""
fi

export SNOWFLAKE_WAREHOUSE="${SNOWFLAKE_WAREHOUSE:-COMPUTE_WH}"
export SNOWFLAKE_ROLE="${SNOWFLAKE_ROLE:-ACCOUNTADMIN}"

echo ""
echo "📦 Installing backend dependencies..."
cd "$(dirname "$0")/backend"
npm install --silent

echo "📦 Installing frontend dependencies..."
cd "../apps/field-sales"
npm install --silent

echo ""
echo "════════════════════════════════════════════════════"
echo "✅ Dependencies installed!"
echo ""
echo "⚠️  IMPORTANT: Before running the app, execute setup_full.sql"
echo "   in your Snowflake account to create the database and tables."
echo ""
echo "   You can do this via:"
echo "   - Snowflake Worksheets (copy/paste setup_full.sql)"
echo "   - SnowSQL: snowsql -f setup_full.sql"
echo "   - Cortex Code: ask it to execute setup_full.sql"
echo ""
echo "════════════════════════════════════════════════════"
echo ""
echo "🚀 To start the app, run these in separate terminals:"
echo ""
echo "  Terminal 1 (Backend):"
echo "    cd backend"
echo "    SNOWFLAKE_ACCOUNT=$SNOWFLAKE_ACCOUNT \\"
echo "    SNOWFLAKE_USER=$SNOWFLAKE_USER \\"
echo "    SNOWFLAKE_PASSWORD=<your-password> \\"
echo "    SNOWFLAKE_WAREHOUSE=$SNOWFLAKE_WAREHOUSE \\"
echo "    SNOWFLAKE_ROLE=$SNOWFLAKE_ROLE \\"
echo "    node server.js"
echo ""
echo "  Terminal 2 (Frontend):"
echo "    cd apps/field-sales"
echo "    npm run dev"
echo ""
echo "  Then open: http://localhost:5173"
echo ""
echo "  Reset demo data:"
echo "    curl -X POST http://localhost:8080/api/demo/reset \\"
echo "      -H 'Content-Type: application/json' -d '{\"rep_id\":1}'"
echo ""
