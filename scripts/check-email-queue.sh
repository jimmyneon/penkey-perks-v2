#!/bin/bash

# Quick Email Queue Check
# This script provides SQL queries to check the email system

echo "📧 Email Queue Status Check"
echo "==========================="
echo ""
echo "Copy and paste these queries into Supabase SQL Editor:"
echo ""

echo "1️⃣ Check pending emails:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
cat << 'EOF'
SELECT 
  id,
  recipient_email,
  subject,
  status,
  created_at,
  scheduled_for
FROM email_queue
WHERE status = 'pending'
ORDER BY created_at DESC
LIMIT 10;
EOF
echo ""

echo "2️⃣ Check email statistics:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
cat << 'EOF'
SELECT 
  status,
  COUNT(*) as count,
  MIN(created_at) as oldest,
  MAX(created_at) as newest
FROM email_queue
GROUP BY status;
EOF
echo ""

echo "3️⃣ Check cron job status:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
cat << 'EOF'
SELECT 
  jobid,
  jobname,
  schedule,
  active,
  database
FROM cron.job
WHERE jobname = 'process-email-queue';
EOF
echo ""

echo "4️⃣ Check recent cron job runs:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
cat << 'EOF'
SELECT 
  jr.start_time,
  jr.end_time,
  jr.status,
  jr.return_message
FROM cron.job_run_details jr
JOIN cron.job j ON j.jobid = jr.jobid
WHERE j.jobname = 'process-email-queue'
ORDER BY jr.start_time DESC
LIMIT 10;
EOF
echo ""

echo "5️⃣ Check app_settings (required for cron):"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
cat << 'EOF'
SELECT key, value 
FROM app_settings 
WHERE key IN ('app_url', 'cron_secret');
EOF
echo ""

echo "6️⃣ Check failed emails (if any):"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
cat << 'EOF'
SELECT 
  id,
  recipient_email,
  subject,
  error_message,
  created_at
FROM email_queue
WHERE status = 'failed'
ORDER BY created_at DESC
LIMIT 10;
EOF
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "💡 Tips:"
echo "   - If no pending emails: Check if email triggers are working"
echo "   - If cron job not found: Run SUPABASE_CRON_SIMPLE.sql"
echo "   - If app_settings missing: See EMAIL_TROUBLESHOOTING_GUIDE.md"
echo "   - To manually process queue: curl -X POST http://localhost:3000/api/emails/process-queue"
echo ""
