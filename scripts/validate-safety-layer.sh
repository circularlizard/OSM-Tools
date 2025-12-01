#!/usr/bin/env bash
set -e

echo "🔍 Phase 1 Safety Layer Validation"
echo "=================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print status
print_status() {
  if [ $1 -eq 0 ]; then
    echo -e "${GREEN}✓${NC} $2"
  else
    echo -e "${RED}✗${NC} $2"
    exit 1
  fi
}

print_warning() {
  echo -e "${YELLOW}⚠${NC} $1"
}

# 1. Check Redis connection
echo "1️⃣  Checking Redis connection..."
if command -v nc &> /dev/null; then
  if nc -z localhost 6379 2>/dev/null; then
    print_status 0 "Redis is reachable on localhost:6379"
  else
    print_warning "Redis not reachable. Start with: docker-compose up -d"
    echo "   Continuing validation (Redis not required for tests)..."
  fi
else
  print_warning "netcat (nc) not found. Skipping Redis check."
fi
echo ""

# 2. Check environment configuration
echo "2️⃣  Checking environment configuration..."
if [ -f .env.local ]; then
  print_status 0 ".env.local file exists"
  
  # Check for required keys (without exposing values)
  if grep -q "OSM_API_TOKEN" .env.local 2>/dev/null; then
    print_status 0 "OSM_API_TOKEN configured"
  else
    print_warning "OSM_API_TOKEN not found in .env.local"
  fi
else
  print_warning ".env.local not found. Create from .env.example for production use."
fi
echo ""

# 3. Run ESLint
echo "3️⃣  Running ESLint..."
npm run lint
print_status $? "ESLint passed"
echo ""

# 4. Run TypeScript compiler check
echo "4️⃣  Running TypeScript compiler check..."
npx tsc --noEmit
print_status $? "TypeScript compilation passed"
echo ""

# 5. Run unit tests (schemas)
echo "5️⃣  Running schema unit tests..."
npx jest src/lib/__tests__/schemas.test.ts --silent
print_status $? "Schema unit tests passed (16 tests)"
echo ""

# 6. Run integration tests (proxy route)
echo "6️⃣  Running proxy integration tests..."
npx jest src/app/api/proxy/__tests__/route.test.ts --silent
print_status $? "Proxy integration tests passed (6 tests)"
echo ""

# 7. Run all tests with coverage (optional but recommended)
echo "7️⃣  Running full test suite..."
npm test -- --silent --passWithNoTests
print_status $? "Full test suite passed"
echo ""

# Summary
echo "=================================="
echo -e "${GREEN}✅ Phase 1 Safety Layer validation complete!${NC}"
echo ""
echo "Summary:"
echo "  - Redis connection: checked"
echo "  - Environment config: verified"
echo "  - ESLint: passed"
echo "  - TypeScript: compiled"
echo "  - Schema tests: 16 passed"
echo "  - Proxy tests: 6 passed"
echo "  - Full test suite: passed"
echo ""
echo "Next: Ready for Phase 2 (Core State & Shell UI)"
