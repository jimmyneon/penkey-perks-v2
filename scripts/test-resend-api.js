#!/usr/bin/env node

/**
 * Test Resend API directly
 * This script tests if your Resend API key is working
 * 
 * Usage: 
 *   RESEND_API_KEY=re_xxx node scripts/test-resend-api.js
 * Or set variables in your shell before running
 */

const { Resend } = require('resend')
const fs = require('fs')
const path = require('path')

// Try to load .env.local manually
function loadEnvFile() {
  const envPath = path.join(process.cwd(), '.env.local')
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8')
    envContent.split('\n').forEach(line => {
      const match = line.match(/^([^=:#]+)=(.*)$/)
      if (match) {
        const key = match[1].trim()
        const value = match[2].trim()
        if (!process.env[key]) {
          process.env[key] = value
        }
      }
    })
  }
}

loadEnvFile()

async function testResendAPI() {
  console.log('🧪 Testing Resend API')
  console.log('=====================\n')

  // Check API key
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    console.error('❌ RESEND_API_KEY not found in .env.local')
    process.exit(1)
  }

  console.log('✅ API Key found:', apiKey.substring(0, 10) + '...')
  console.log('📧 From Email:', process.env.RESEND_FROM_EMAIL || 'Not set')
  console.log('📧 Reply To:', process.env.RESEND_REPLY_TO_EMAIL || 'Not set')
  console.log('')

  // Initialize Resend
  const resend = new Resend(apiKey)

  try {
    // Test 1: Get API key info
    console.log('1️⃣ Testing API key validity...')
    
    // Test 2: Try to send a test email
    console.log('2️⃣ Attempting to send test email...')
    
    const testEmail = process.env.RESEND_REPLY_TO_EMAIL || 'nfdrepairs@gmail.com'
    
    const { data, error } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'Penkey Perks <noreply@rewards.penkey.co.uk>',
      to: testEmail,
      subject: 'Test Email from Penkey Perks',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #f97316;">🎉 Test Email</h1>
          <p>This is a test email from your Penkey Perks application.</p>
          <p>If you received this, your email system is working correctly!</p>
          <p style="color: #666; font-size: 12px; margin-top: 20px;">
            Sent at: ${new Date().toISOString()}
          </p>
        </div>
      `
    })

    if (error) {
      console.error('❌ Email send failed:', error)
      console.log('\n📋 Common issues:')
      console.log('   - API key is invalid or expired')
      console.log('   - Domain not verified in Resend dashboard')
      console.log('   - From email domain not matching verified domain')
      console.log('   - Rate limit exceeded')
      process.exit(1)
    }

    console.log('✅ Email sent successfully!')
    console.log('📧 Email ID:', data.id)
    console.log('📬 Sent to:', testEmail)
    console.log('\n✨ Check your inbox!')
    console.log('   If you don\'t see it, check spam folder')
    
  } catch (error) {
    console.error('❌ Error:', error.message)
    console.log('\n📋 Troubleshooting:')
    console.log('   1. Check your RESEND_API_KEY in .env.local')
    console.log('   2. Verify domain in Resend dashboard: https://resend.com/domains')
    console.log('   3. Ensure from email matches verified domain')
    console.log('   4. Check Resend API status: https://resend.com/status')
    process.exit(1)
  }
}

testResendAPI()
