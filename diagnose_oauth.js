// diagnose_oauth.js - OAuth2 Configuration Diagnostic Tool
const { google } = require('googleapis');
require('dotenv').config();

console.log('🔍 Diagnosing OAuth2 Configuration...\n');

// Check environment variables
const requiredVars = ['CLIENT_ID', 'CLIENT_SECRET', 'REFRESH_TOKEN', 'EMAIL_ADDRESS'];
const missing = requiredVars.filter(v => !process.env[v]);

if (missing.length > 0) {
    console.error('❌ Missing environment variables:', missing.join(', '));
    console.log('\nPlease ensure these are set in your .env file:');
    requiredVars.forEach(v => console.log(`${v}=your_value`));
    process.exit(1);
}

console.log('✅ All required environment variables are present\n');

// Display (partial) values
console.log('Configuration:');
console.log(`- CLIENT_ID: ${process.env.CLIENT_ID.substring(0, 20)}...`);
console.log(`- CLIENT_SECRET: ${process.env.CLIENT_SECRET.substring(0, 10)}...`);
console.log(`- REFRESH_TOKEN: ${process.env.REFRESH_TOKEN.substring(0, 20)}...`);
console.log(`- EMAIL_ADDRESS: ${process.env.EMAIL_ADDRESS}\n`);

// Test OAuth2 client
const oAuth2Client = new google.auth.OAuth2(
    process.env.CLIENT_ID,
    process.env.CLIENT_SECRET,
    process.env.REDIRECT_URI || 'http://localhost:3000/oauth2callback'
);

oAuth2Client.setCredentials({
    refresh_token: process.env.REFRESH_TOKEN
});

async function testOAuth() {
    try {
        console.log('🔐 Testing OAuth2 credentials...');

        // Try to get access token
        const accessTokenResponse = await oAuth2Client.getAccessToken();

        if (accessTokenResponse.token) {
            console.log('✅ Successfully obtained access token');
            console.log(`   Token (first 20 chars): ${accessTokenResponse.token.substring(0, 20)}...\n`);

            // Try to get user info to verify the account
            console.log('👤 Fetching user info...');
            const oauth2 = google.oauth2({ version: 'v2', auth: oAuth2Client });
            const userInfo = await oauth2.userinfo.get();

            console.log('✅ OAuth2 authentication successful!');
            console.log(`   Email: ${userInfo.data.email}`);
            console.log(`   Name: ${userInfo.data.name}\n`);

            // Check if EMAIL_ADDRESS matches
            if (userInfo.data.email !== process.env.EMAIL_ADDRESS) {
                console.error('⚠️  WARNING: EMAIL_ADDRESS in .env does NOT match OAuth account!');
                console.error(`   .env EMAIL_ADDRESS: ${process.env.EMAIL_ADDRESS}`);
                console.error(`   OAuth account email: ${userInfo.data.email}`);
                console.error('\n🔧 FIX: Update EMAIL_ADDRESS in .env to match OAuth account\n');
                return false;
            }

            console.log('✅ EMAIL_ADDRESS matches OAuth account');

            // Check Gmail API access
            console.log('\n📧 Testing Gmail API access...');
            const gmail = google.gmail({ version: 'v1', auth: oAuth2Client });
            const profile = await gmail.users.getProfile({ userId: 'me' });

            console.log('✅ Gmail API is accessible');
            console.log(`   Email: ${profile.data.emailAddress}\n`);

            console.log('✅ ALL CHECKS PASSED! Your OAuth2 setup is correct.\n');
            console.log('If you\'re still getting auth errors, try:');
            console.log('1. Regenerate the refresh token (delete old one in Google settings)');
            console.log('2. Make sure Gmail API is enabled in Google Cloud Console');
            console.log('3. Check that your OAuth app has your email as a test user\n');

            return true;

        } else {
            console.error('❌ Failed to get access token');
            return false;
        }

    } catch (error) {
        console.error('❌ OAuth2 test failed!\n');
        console.error('Error:', error.message);

        if (error.message.includes('invalid_grant')) {
            console.error('\n🔧 FIX: Your refresh token is invalid or expired.');
            console.error('   Run: node token.js');
            console.error('   Follow the prompts to generate a new refresh token\n');
        } else if (error.message.includes('invalid_client')) {
            console.error('\n🔧 FIX: Your CLIENT_ID or CLIENT_SECRET is incorrect.');
            console.error('   Verify these values in Google Cloud Console\n');
        } else {
            console.error('\nFull error:', error);
        }

        return false;
    }
}

testOAuth().then(success => {
    process.exit(success ? 0 : 1);
});
