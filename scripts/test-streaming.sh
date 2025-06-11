#!/bin/bash

# Streaming API Test Script Wrapper
# Ensures proper environment setup and provides convenient shortcuts

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

echo -e "${BLUE}🧪 Streaming API Test Wrapper${NC}"
echo -e "${YELLOW}Project root: ${PROJECT_ROOT}${NC}"

# Check if Node.js is available
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js is not installed or not in PATH${NC}"
    echo -e "${YELLOW}Please install Node.js to run this test${NC}"
    exit 1
fi

# Check if we're in the right directory
if [ ! -f "$PROJECT_ROOT/package.json" ]; then
    echo -e "${RED}❌ package.json not found. Please run this script from the project root or scripts directory${NC}"
    exit 1
fi

# Check if the streaming test script exists
if [ ! -f "$SCRIPT_DIR/test-streaming.js" ]; then
    echo -e "${RED}❌ test-streaming.js not found in scripts directory${NC}"
    exit 1
fi

# Load environment variables if .env.local exists
if [ -f "$PROJECT_ROOT/.env.local" ]; then
    echo -e "${GREEN}📄 Loading environment variables from .env.local${NC}"
    set -a
    source "$PROJECT_ROOT/.env.local"
    set +a
fi

# Check for required environment variables
if [ -z "$OPENAI_API_KEY" ]; then
    echo -e "${YELLOW}⚠️  Warning: OPENAI_API_KEY not set${NC}"
    echo -e "${YELLOW}   The streaming test may fail without a valid OpenAI API key${NC}"
    echo -e "${YELLOW}   Set it in .env.local or as an environment variable${NC}"
    echo ""
fi

# Check if Next.js dev server is running
if [ -z "$NEXT_PUBLIC_APP_URL" ]; then
    echo -e "${BLUE}🔍 Checking if Next.js dev server is running on localhost:9002...${NC}"
    if ! curl -s -f http://localhost:9002/api/health > /dev/null 2>&1; then
        echo -e "${YELLOW}⚠️  Next.js dev server doesn't appear to be running${NC}"
        echo -e "${YELLOW}   Start it with: npm run dev${NC}"
        echo -e "${YELLOW}   Or set NEXT_PUBLIC_APP_URL to point to your running server${NC}"
        echo ""
    else
        echo -e "${GREEN}✅ Next.js dev server is running${NC}"
    fi
fi

# Change to project root directory
cd "$PROJECT_ROOT"

# Run the streaming test with all passed arguments
echo -e "${BLUE}🚀 Starting streaming test...${NC}"
echo ""

node "$SCRIPT_DIR/test-streaming.js" "$@"

exit_code=$?

if [ $exit_code -eq 0 ]; then
    echo -e "${GREEN}🎉 Streaming test completed successfully!${NC}"
else
    echo -e "${RED}💥 Streaming test failed with exit code $exit_code${NC}"
fi

exit $exit_code
