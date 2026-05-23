#!/bin/bash

# Production Readiness Test Script
# Run this to verify everything is working before deployment

echo "🚀 Penkey Perks - Production Readiness Test"
echo "============================================"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if .env.local exists
echo "📋 Checking environment configuration..."
if [ ! -f .env.local ]; then
    echo -e "${RED}❌ .env.local not found${NC}"
    echo "   Create .env.local with required variables"
    exit 1
fi

# Check required env vars
REQUIRED_VARS=("NEXT_PUBLIC_SUPABASE_URL" "NEXT_PUBLIC_SUPABASE_ANON_KEY" "SUPABASE_SERVICE_ROLE_KEY")
for var in "${REQUIRED_VARS[@]}"; do
    if ! grep -q "^$var=" .env.local; then
        echo -e "${RED}❌ Missing $var in .env.local${NC}"
        exit 1
    fi
done
echo -e "${GREEN}✅ Environment variables configured${NC}"
echo ""

# Check if migrations directory exists
echo "📁 Checking migrations..."
if [ ! -d "supabase/migrations" ]; then
    echo -e "${RED}❌ Migrations directory not found${NC}"
    exit 1
fi

# Count migrations
MIGRATION_COUNT=$(ls -1 supabase/migrations/*.sql 2>/dev/null | wc -l)
echo -e "${GREEN}✅ Found $MIGRATION_COUNT migrations${NC}"
echo ""

# Check for critical migration
echo "🔍 Checking for critical fixes..."
if [ -f "supabase/migrations/20251014_fix_promotional_offers_reward_creation.sql" ]; then
    echo -e "${GREEN}✅ Promotional offers fix migration found${NC}"
else
    echo -e "${RED}❌ Critical migration missing: 20251014_fix_promotional_offers_reward_creation.sql${NC}"
    exit 1
fi
echo ""

# Check if node_modules exists
echo "📦 Checking dependencies..."
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}⚠️  node_modules not found. Running npm install...${NC}"
    npm install
fi
echo -e "${GREEN}✅ Dependencies installed${NC}"
echo ""

# Try to build
echo "🔨 Testing build..."
if npm run build > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Build successful${NC}"
else
    echo -e "${RED}❌ Build failed${NC}"
    echo "   Run 'npm run build' to see errors"
    exit 1
fi
echo ""

# Check for common issues
echo "🔍 Checking for common issues..."

# Check for duck_threshold references in code (excluding migrations and docs)
DUCK_REFS=$(grep -r "duck_threshold" app/ components/ lib/ 2>/dev/null | grep -v ".sql" | wc -l)
if [ "$DUCK_REFS" -gt 0 ]; then
    echo -e "${YELLOW}⚠️  Found $DUCK_REFS references to 'duck_threshold' in code${NC}"
    echo "   This might cause issues with the beans system"
else
    echo -e "${GREEN}✅ No duck_threshold references in code${NC}"
fi
echo ""

# Summary
echo "============================================"
echo "📊 Production Readiness Summary"
echo "============================================"
echo ""
echo -e "${GREEN}✅ Environment configured${NC}"
echo -e "${GREEN}✅ Migrations present${NC}"
echo -e "${GREEN}✅ Dependencies installed${NC}"
echo -e "${GREEN}✅ Build successful${NC}"
echo ""

# Critical checks
echo "⚠️  MANUAL CHECKS REQUIRED:"
echo ""
echo "1. Apply promotional offers fix migration:"
echo "   - Go to Supabase SQL Editor"
echo "   - Run: supabase/migrations/20251014_fix_promotional_offers_reward_creation.sql"
echo ""
echo "2. Test promotional offers redemption:"
echo "   - Create a test offer in /staff/promotional-offers"
echo "   - Try to redeem as a user"
echo "   - Verify no errors"
echo ""
echo "3. Configure Google OAuth (if using):"
echo "   - Follow GOOGLE_OAUTH_PRODUCTION_SETUP.md"
echo ""
echo "4. Test on mobile device"
echo ""
echo "5. Verify GPS validation is enabled (if needed)"
echo ""

# Final status
echo "============================================"
echo -e "${GREEN}✅ AUTOMATED CHECKS PASSED${NC}"
echo ""
echo "Complete manual checks above, then deploy!"
echo ""
echo "To deploy:"
echo "  git add ."
echo "  git commit -m 'Production ready'"
echo "  git push origin main"
echo ""
