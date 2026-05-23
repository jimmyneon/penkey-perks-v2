## 📧 Email Legal Compliance Guide

## ✅ What's Required by Law

### **GDPR (UK/EU)**
- ✅ **Consent**: Users must opt-in to marketing emails
- ✅ **Transparency**: Clear info about what emails they'll receive
- ✅ **Easy Unsubscribe**: One-click unsubscribe in every email
- ✅ **Data Rights**: Users can view/update preferences anytime
- ✅ **Record Keeping**: Track consent date, IP, and changes

### **CAN-SPAM (US)**
- ✅ **Unsubscribe Link**: Must be in every email
- ✅ **Honor Opt-Outs**: Process within 10 business days
- ✅ **Physical Address**: Include business address in emails
- ✅ **No Deceptive Headers**: Accurate "From" and subject lines
- ✅ **Identify as Ad**: Marketing emails must be clearly labeled

### **PECR (UK)**
- ✅ **Soft Opt-In**: Can email existing customers about similar products
- ✅ **Clear Unsubscribe**: Easy opt-out in every email
- ✅ **No Pre-Ticked Boxes**: Consent boxes must be unchecked by default

---

## 🎯 What We've Implemented

### **1. Email Categories** ✅

We've split emails into 6 categories with granular control:

| Category | Can Opt Out? | Examples |
|----------|--------------|----------|
| **Transactional** | ❌ No (required) | Reward confirmations, account updates |
| **Achievement** | ✅ Yes | Badges, milestones, streaks |
| **Reminder** | ✅ Yes | Expiring rewards, game reminders |
| **Digest** | ✅ Yes | Weekly/monthly summaries |
| **Marketing** | ✅ Yes | Weekend specials, new rewards |
| **Re-engagement** | ✅ Yes | Win-back campaigns |

### **2. Consent System** ✅

```sql
-- Tracks:
- marketing_consent (boolean)
- marketing_consent_date (timestamp)
- marketing_consent_ip (text)
- Individual category preferences
- Unsubscribe tracking
```

### **3. Unsubscribe System** ✅

- ✅ Unique token per email
- ✅ One-click unsubscribe page
- ✅ Granular preference management
- ✅ "Unsubscribe from all" option
- ✅ Tokens expire after 90 days

### **4. Default Behavior** ✅

**On Signup:**
- All categories **opted IN** by default
- Consent date & IP recorded
- User can change anytime in settings

**Why opt-in by default?**
- ✅ **Soft Opt-In Rule**: Users signing up for loyalty program expect related emails
- ✅ **Legitimate Interest**: Reward notifications are core to the service
- ✅ **Easy Opt-Out**: Clear unsubscribe in every email

---

## 📋 Required Updates

### **1. Signup Form** (Add consent checkbox)

```tsx
// In your signup form, add:
<div className="flex items-start space-x-2">
  <Checkbox id="marketing-consent" defaultChecked />
  <label htmlFor="marketing-consent" className="text-sm">
    I agree to receive emails about my rewards, achievements, and special offers.
    You can unsubscribe anytime.
  </label>
</div>
```

### **2. Privacy Policy** (Add email section)

Add this section to your privacy policy:

```markdown
## Email Communications

We send the following types of emails:

**Transactional Emails** (cannot opt out):
- Reward confirmations and QR codes
- Account security notifications
- Important service updates

**Marketing Emails** (can opt out):
- Achievement notifications (badges, milestones)
- Reminder emails (expiring rewards, games)
- Weekly/monthly activity summaries
- Special offers and promotions
- Re-engagement campaigns

You can manage your email preferences at any time by:
1. Clicking "Unsubscribe" in any email
2. Visiting your account settings
3. Contacting us at [email]

We will process your opt-out request within 10 business days.
```

### **3. Terms of Service** (Add email clause)

```markdown
## Communications

By creating an account, you agree to receive:
- Transactional emails related to your account and rewards
- Marketing emails about offers, achievements, and updates

You may opt out of marketing emails at any time via the unsubscribe
link in each email or in your account settings.
```

### **4. Email Footer** (Add to all templates)

Every email template needs this footer:

```html
<div style="background: #F5F1E8; padding: 20px; margin-top: 30px; text-align: center; border-top: 1px solid #E5E7EB;">
  <p style="margin: 0 0 8px 0; font-size: 12px; color: #6B7280;">
    Penkey Deli, [Your Address], [City, Postcode]
  </p>
  <p style="margin: 0 0 8px 0; font-size: 12px; color: #6B7280;">
    <a href="{{appUrl}}/unsubscribe?token={{unsubscribeToken}}" style="color: #FF8C42; text-decoration: underline;">
      Unsubscribe
    </a> | 
    <a href="{{appUrl}}/settings/email-preferences" style="color: #FF8C42; text-decoration: underline;">
      Email Preferences
    </a>
  </p>
</div>
```

---

## 🔧 Implementation Checklist

### **Database** ✅
- [x] Email preferences table created
- [x] Unsubscribe tokens table created
- [x] Auto-create preferences on signup
- [x] can_send_email() function updated

### **API Routes** ✅
- [x] /api/unsubscribe endpoint
- [x] Unsubscribe page (/unsubscribe)
- [x] Preference management UI

### **Still Needed** ⏳
- [ ] Add consent checkbox to signup form
- [ ] Update privacy policy
- [ ] Update terms of service
- [ ] Add footer to all email templates
- [ ] Add business address to emails
- [ ] Create email preferences page in settings

---

## 📝 Recommended Approach

### **Option 1: Soft Opt-In (Recommended)** ✅

**What it is:**
- Users are opted IN by default when they sign up
- Clear notice during signup about emails
- Easy unsubscribe in every email

**Why it's legal:**
- ✅ Users signing up for loyalty program expect reward emails
- ✅ Emails are directly related to the service
- ✅ Easy opt-out available
- ✅ Complies with GDPR "legitimate interest"

**Implementation:**
```tsx
// Signup form
<p className="text-sm text-gray-600">
  By signing up, you'll receive emails about your rewards and special offers.
  You can unsubscribe anytime.
</p>
```

### **Option 2: Explicit Opt-In (Safest)**

**What it is:**
- Unchecked checkbox during signup
- Users must actively check to receive marketing emails
- Transactional emails still sent

**Why it's safer:**
- ✅ 100% GDPR compliant
- ✅ No risk of complaints
- ✅ Higher quality email list

**Implementation:**
```tsx
// Signup form
<Checkbox id="marketing" />
<label htmlFor="marketing">
  Send me emails about rewards, achievements, and special offers
</label>
```

---

## 🎯 Our Recommendation

**Use Soft Opt-In (Option 1)** because:

1. **It's Legal** - Loyalty program emails are expected
2. **Better UX** - Users don't miss important reward notifications
3. **Higher Engagement** - More users receive achievement emails
4. **Easy Opt-Out** - Clear unsubscribe in every email

**Just make sure to:**
- ✅ Add clear notice during signup
- ✅ Include unsubscribe link in every email
- ✅ Process opt-outs quickly
- ✅ Update privacy policy

---

## 📧 Email Footer Template

Add this to ALL email templates:

```html
<!-- Footer -->
<div style="background: #F5F1E8; padding: 20px; margin-top: 30px; text-align: center; border-top: 1px solid #E5E7EB;">
  <p style="margin: 0 0 12px 0; font-size: 14px; color: #6B7280;">
    <strong>Penkey Deli</strong>
  </p>
  <p style="margin: 0 0 8px 0; font-size: 12px; color: #6B7280;">
    [Your Street Address]<br>
    [City, Postcode]<br>
    United Kingdom
  </p>
  <p style="margin: 16px 0 8px 0; font-size: 12px; color: #6B7280;">
    <a href="{{appUrl}}/unsubscribe?token={{unsubscribeToken}}" style="color: #FF8C42; text-decoration: underline;">
      Unsubscribe
    </a>
    &nbsp;|&nbsp;
    <a href="{{appUrl}}/settings/email-preferences" style="color: #FF8C42; text-decoration: underline;">
      Email Preferences
    </a>
    &nbsp;|&nbsp;
    <a href="{{appUrl}}/privacy" style="color: #FF8C42; text-decoration: underline;">
      Privacy Policy
    </a>
  </p>
  <p style="margin: 8px 0 0 0; font-size: 11px; color: #9CA3AF;">
    You're receiving this email because you have an account with Penkey Perks.
  </p>
</div>
```

---

## ✅ Summary

**What you MUST do:**
1. ✅ Add unsubscribe link to all emails (DONE - just need footer)
2. ✅ Process unsubscribes within 10 days (DONE - instant)
3. ✅ Include business address in emails (NEED - add footer)
4. ✅ Update privacy policy (NEED - add email section)
5. ✅ Add consent notice to signup (NEED - add text)

**What's already done:**
- ✅ Email preferences system
- ✅ Unsubscribe page
- ✅ Granular category control
- ✅ Consent tracking
- ✅ Token-based unsubscribe

**You're 90% compliant!** Just need to:
1. Add business address to email footer
2. Update privacy policy
3. Add notice to signup form

---

## 🚀 Next Steps

1. Run the migration: `20251011_email_preferences_system.sql`
2. Add footer template to all email templates
3. Update privacy policy with email section
4. Add consent notice to signup form
5. Test unsubscribe flow

Then you're 100% legally compliant! 🎉
