/**
 * Generate VAPID Keys for Web Push Notifications
 * Run this once to generate your keys
 */

const webpush = require('web-push');

console.log('\n🔑 Generating VAPID Keys for Web Push...\n');

const vapidKeys = webpush.generateVAPIDKeys();

console.log('✅ VAPID Keys Generated Successfully!\n');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

console.log('📋 Copy these to your .env.local file:\n');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

console.log(`# VAPID Keys for Push Notifications`);
console.log(`VAPID_PUBLIC_KEY=${vapidKeys.publicKey}`);
console.log(`VAPID_PRIVATE_KEY=${vapidKeys.privateKey}`);
console.log(`VAPID_SUBJECT=mailto:nfdrepairs@gmail.com`);
console.log(`NEXT_PUBLIC_VAPID_PUBLIC_KEY=${vapidKeys.publicKey}`);

console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

console.log('⚠️  IMPORTANT:\n');
console.log('1. Add these to your .env.local file');
console.log('2. NEVER commit .env.local to git');
console.log('3. Keep the PRIVATE key secret');
console.log('4. Use the SAME public key for both variables');
console.log('5. Restart your dev server after adding keys\n');

console.log('✅ Done! Your VAPID keys are ready to use.\n');
