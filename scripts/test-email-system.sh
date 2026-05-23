#!/bin/bash

# Test Email System
# This script tests the email queue and processing system

echo "🧪 Testing Email System"
echo "======================="
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if .env.local exists
if [ ! -f .env.local ]; then
    echo -e "${RED}❌ .env.local file not found${NC}"
    exit 1
fi

# Load environment variables
source .env.local

# Check required environment variables
echo "1️⃣ Checking environment variables..."
if [ -z "$RESEND_API_KEY" ]; then
    echo -e "${RED}❌ RESEND_API_KEY not set${NC}"
    exit 1
fi
echo -e "${GREEN}✅ RESEND_API_KEY is set${NC}"

if [ -z "$RESEND_FROM_EMAIL" ]; then
    echo -e "${YELLOW}⚠️  RESEND_FROM_EMAIL not set (will use default)${NC}"
else
    echo -e "${GREEN}✅ RESEND_FROM_EMAIL: $RESEND_FROM_EMAIL${NC}"
fi

if [ -z "$CRON_SECRET" ]; then
    echo -e "${YELLOW}⚠️  CRON_SECRET not set${NC}"
else
    echo -e "${GREEN}✅ CRON_SECRET is set${NC}"
fi

echo ""
echo "2️⃣ Checking email queue in database..."
echo "   Run this SQL in Supabase to check pending emails:"
echo ""
echo "   SELECT id, recipient_email, subject, status, created_at"
echo "   FROM email_queue"
echo "   WHERE status = 'pending'"
echo "   ORDER BY created_at DESC"
echo "   LIMIT 10;"
echo ""

echo "3️⃣ Testing email processing endpoint..."
if [ -z "$CRON_SECRET" ]; then
    echo -e "${YELLOW}⚠️  Cannot test endpoint without CRON_SECRET${NC}"
else
    echo "   Testing: POST http://localhost:3000/api/emails/process-queue"
    
    response=$(curl -s -X POST \
        -H "Authorization: Bearer $CRON_SECRET" \
        -H "Content-Type: application/json" \
        -d '{"batchSize": 5}' \
        http://localhost:3000/api/emails/process-queue)
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Endpoint responded${NC}"
        echo "   Response: $response"
    else
        echo -e "${RED}❌ Endpoint failed${NC}"
    fi
fi

echo ""
echo "4️⃣ Manual test options:"
echo "   A. Check email queue status:"
echo "      curl http://localhost:3000/api/emails/process-queue"
echo ""
echo "   B. Process emails (with auth):"
echo "      curl -X POST \\"
echo "        -H \"Authorization: Bearer \$CRON_SECRET\" \\"
echo "        -H \"Content-Type: application/json\" \\"
echo "        -d '{\"batchSize\": 10}' \\"
echo "        http://localhost:3000/api/emails/process-queue"
echo ""
echo "   C. Check Resend API directly:"
echo "      curl https://api.resend.com/emails \\"
echo "        -H \"Authorization: Bearer \$RESEND_API_KEY\""
echo ""

echo "5️⃣ Common issues:"
echo "   - Check if RESEND_API_KEY is valid (not expired)"
echo "   - Verify domain is verified in Resend dashboard"
echo "   - Check email_queue table has pending emails"
echo "   - Ensure CRON_SECRET matches in .env.local"
echo "   - Check Supabase function 'mark_email_sent' exists"
echo ""

echo "✅ Test script complete"
