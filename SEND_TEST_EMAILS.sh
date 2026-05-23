#!/bin/bash

# =============================================
# SEND ALL TEST EMAILS
# =============================================
# Run this after executing TEST_ALL_22_EMAILS.sql
# =============================================

echo "🚀 Processing email queue..."
echo ""

curl -X POST http://localhost:3000/api/emails/process-queue \
  -H "Authorization: Bearer 3dkh5DxjlHY+7JI6o7wAWT2okd/pK/TzJdcKAwVzRcc=" \
  -H "Content-Type: application/json"

echo ""
echo ""
echo "✅ Done! Check your email inbox for all 22 test emails!"
echo "📧 They should arrive within a few minutes"
