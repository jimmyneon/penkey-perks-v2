# Resend Email Configuration

## Configuration Details

- **API Key**: `re_gCRZG5u7_LFyC36xo8YiMPR21FKH1Anu6`
- **From Email**: `noreply@rewards.penkey.co.uk`
- **Reply-To Email**: `nfdrepairs@gmail.com`

## Files Updated

### 1. `.env.example` ✅
Updated with the correct Resend configuration including the new reply-to email field.

### 2. `lib/email/send.ts` ✅
Added `reply_to` field to the email sending function so all emails will have the help email as the reply-to address.

### 3. `.env.local` ⚠️ MANUAL UPDATE REQUIRED

You need to manually update your `.env.local` file with the following environment variables:

```bash
RESEND_API_KEY=re_gCRZG5u7_LFyC36xo8YiMPR21FKH1Anu6
RESEND_FROM_EMAIL=noreply@rewards.penkey.co.uk
RESEND_REPLY_TO_EMAIL=nfdrepairs@gmail.com
```

## How It Works

- **From Address**: All emails will be sent from `noreply@rewards.penkey.co.uk`
- **Reply-To Address**: When users reply to emails, responses will go to `nfdrepairs@gmail.com`
- This keeps the sending address clean while directing support inquiries to the help email

## Testing

After updating `.env.local`, restart your development server to test:

```bash
npm run dev
```

Test by triggering any email notification (welcome email, reward earned, etc.) and verify:
1. Email is sent from `noreply@rewards.penkey.co.uk`
2. Reply-to header is set to `nfdrepairs@gmail.com`

## Production Deployment

Make sure to add these environment variables to your production environment (Vercel, etc.):
- `RESEND_API_KEY`
- `RESEND_FROM_EMAIL`
- `RESEND_REPLY_TO_EMAIL`
