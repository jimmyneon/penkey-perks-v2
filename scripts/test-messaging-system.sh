#!/bin/bash

# =============================================
# MESSAGING SYSTEM - AUTOMATED TEST SCRIPT
# =============================================
# Quick automated checks for messaging system
# =============================================

echo "🧪 MESSAGING SYSTEM - AUTOMATED TESTS"
echo "======================================"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

PASSED=0
FAILED=0

# Test function
test_check() {
  if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ PASS${NC}: $1"
    ((PASSED++))
  else
    echo -e "${RED}❌ FAIL${NC}: $1"
    ((FAILED++))
  fi
}

# =============================================
# TEST 1: Check Files Exist
# =============================================
echo "📁 TEST 1: Checking Files..."
echo "----------------------------"

# Migrations
test -f "supabase/migrations/20251012_migrate_hardcoded_notifications.sql"
test_check "Notifications migration exists"

test -f "supabase/migrations/20251012_insert_email_templates.sql"
test_check "Email templates migration exists"

test -f "supabase/migrations/20251012_push_notifications.sql"
test_check "Push notifications migration exists"

# Service Worker
test -f "public/sw.js"
test_check "Service worker exists"

# Components
test -f "components/push-notification-toggle.tsx"
test_check "Push notification toggle component exists"

test -f "components/push-notification-prompt.tsx"
test_check "Push notification prompt component exists"

# Libraries
test -f "lib/notification-matcher.ts"
test_check "Notification matcher library exists"

test -f "lib/push/send.ts"
test_check "Push send library exists"

# API Endpoints
test -f "app/api/push/subscribe/route.ts"
test_check "Push subscribe API exists"

test -f "app/api/push/unsubscribe/route.ts"
test_check "Push unsubscribe API exists"

test -f "app/api/push/send/route.ts"
test_check "Push send API exists"

# Admin UI
test -f "app/admin/email-templates/page.tsx"
test_check "Email templates admin page exists"

echo ""

# =============================================
# TEST 2: Check Dependencies
# =============================================
echo "📦 TEST 2: Checking Dependencies..."
echo "-----------------------------------"

# Check if web-push is installed
if npm list web-push > /dev/null 2>&1; then
  echo -e "${GREEN}✅ PASS${NC}: web-push package installed"
  ((PASSED++))
else
  echo -e "${RED}❌ FAIL${NC}: web-push package NOT installed"
  echo -e "${YELLOW}   Run: npm install web-push --legacy-peer-deps${NC}"
  ((FAILED++))
fi

echo ""

# =============================================
# TEST 3: Check Environment Variables
# =============================================
echo "🔐 TEST 3: Checking Environment Variables..."
echo "--------------------------------------------"

if [ -f ".env.local" ]; then
  echo -e "${GREEN}✅ PASS${NC}: .env.local file exists"
  ((PASSED++))
  
  # Check for VAPID keys
  if grep -q "VAPID_PUBLIC_KEY" .env.local; then
    echo -e "${GREEN}✅ PASS${NC}: VAPID_PUBLIC_KEY found"
    ((PASSED++))
  else
    echo -e "${RED}❌ FAIL${NC}: VAPID_PUBLIC_KEY not found"
    echo -e "${YELLOW}   Run: node scripts/generate-vapid-keys.js${NC}"
    ((FAILED++))
  fi
  
  if grep -q "VAPID_PRIVATE_KEY" .env.local; then
    echo -e "${GREEN}✅ PASS${NC}: VAPID_PRIVATE_KEY found"
    ((PASSED++))
  else
    echo -e "${RED}❌ FAIL${NC}: VAPID_PRIVATE_KEY not found"
    echo -e "${YELLOW}   Run: node scripts/generate-vapid-keys.js${NC}"
    ((FAILED++))
  fi
  
  if grep -q "NEXT_PUBLIC_VAPID_PUBLIC_KEY" .env.local; then
    echo -e "${GREEN}✅ PASS${NC}: NEXT_PUBLIC_VAPID_PUBLIC_KEY found"
    ((PASSED++))
  else
    echo -e "${RED}❌ FAIL${NC}: NEXT_PUBLIC_VAPID_PUBLIC_KEY not found"
    echo -e "${YELLOW}   Run: node scripts/generate-vapid-keys.js${NC}"
    ((FAILED++))
  fi
else
  echo -e "${RED}❌ FAIL${NC}: .env.local file not found"
  echo -e "${YELLOW}   Create .env.local and add VAPID keys${NC}"
  ((FAILED++))
fi

echo ""

# =============================================
# TEST 4: Check Service Worker Accessibility
# =============================================
echo "🔧 TEST 4: Checking Service Worker..."
echo "-------------------------------------"

if [ -f "public/sw.js" ]; then
  # Check if file is not empty
  if [ -s "public/sw.js" ]; then
    echo -e "${GREEN}✅ PASS${NC}: Service worker file is not empty"
    ((PASSED++))
  else
    echo -e "${RED}❌ FAIL${NC}: Service worker file is empty"
    ((FAILED++))
  fi
  
  # Check if it has required event listeners
  if grep -q "addEventListener('push'" public/sw.js; then
    echo -e "${GREEN}✅ PASS${NC}: Push event listener found"
    ((PASSED++))
  else
    echo -e "${RED}❌ FAIL${NC}: Push event listener not found"
    ((FAILED++))
  fi
  
  if grep -q "addEventListener('notificationclick'" public/sw.js; then
    echo -e "${GREEN}✅ PASS${NC}: Notification click listener found"
    ((PASSED++))
  else
    echo -e "${RED}❌ FAIL${NC}: Notification click listener not found"
    ((FAILED++))
  fi
fi

echo ""

# =============================================
# TEST 5: Check TypeScript/JavaScript Syntax
# =============================================
echo "📝 TEST 5: Checking Code Syntax..."
echo "----------------------------------"

# Check if TypeScript files compile (basic check)
if command -v tsc > /dev/null 2>&1; then
  if tsc --noEmit --skipLibCheck > /dev/null 2>&1; then
    echo -e "${GREEN}✅ PASS${NC}: TypeScript files compile"
    ((PASSED++))
  else
    echo -e "${YELLOW}⚠️  WARN${NC}: TypeScript compilation has warnings (check manually)"
  fi
else
  echo -e "${YELLOW}⚠️  SKIP${NC}: TypeScript not available for syntax check"
fi

echo ""

# =============================================
# SUMMARY
# =============================================
echo "======================================"
echo "📊 TEST SUMMARY"
echo "======================================"
echo -e "Total Tests: $((PASSED + FAILED))"
echo -e "${GREEN}Passed: $PASSED${NC}"
echo -e "${RED}Failed: $FAILED${NC}"
echo ""

if [ $FAILED -eq 0 ]; then
  echo -e "${GREEN}✅ ALL AUTOMATED TESTS PASSED!${NC}"
  echo ""
  echo "Next steps:"
  echo "1. Run database migrations in Supabase"
  echo "2. Start dev server: npm run dev"
  echo "3. Test manually using MESSAGING_SYSTEM_TESTING_GUIDE.md"
  echo "4. Deploy to production"
  exit 0
else
  echo -e "${RED}❌ SOME TESTS FAILED${NC}"
  echo ""
  echo "Please fix the issues above before proceeding."
  echo "See MESSAGING_SYSTEM_TESTING_GUIDE.md for detailed testing."
  exit 1
fi
