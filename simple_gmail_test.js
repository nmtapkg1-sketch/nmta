// simple_gmail_test.js - Test Gmail API directly
const { google } = require('googleapis');
require('dotenv').config();

console.log('🔍 Testing Gmail API Access...\n');

const oAuth2Client = new google.auth.OAuth2(
    process.env.CLIENT_ID,
    process.env.CLIENT_SECRET,
    process.env.REDIRECT_URI || 'http://localhost:3000/oauth2callback'
);

oAuth2Client.setCredentials({
    refresh_token: process.env.REFRESH_TOKEN
});

async function testGmailAPI() {
    try {
        console.log('🔐 Getting access token...');
        const accessTokenResponse = await oAuth2Client.getAccessToken();
        console.log('✅ Access token obtained\n');

        console.log('📧 Testing Gmail API access...');
        const gmail = google.gmail({ version: 'v1', auth: oAuth2Client });

        // Try to get user profile - this is the simplest Gmail API call
        const profile = await gmail.users.getProfile({ userId: 'me' });

        console.log('✅ Gmail API is ENABLED and accessible!');
        console.log(`   Email: ${profile.data.emailAddress}`);
        console.log(`   Total messages: ${profile.data.messagesTotal}\n`);

        console.log('🎉 SUCCESS! Your Gmail API is configured correctly.');
        console.log('You can now send emails using OAuth2.\n');

        return true;

    } catch (error) {
        console.error('❌ Gmail API test failed!\n');

        if (error.code === 403 || error.message.includes('Gmail API has not been used')) {
            console.error('🔧 Gmail API is NOT ENABLED in your Google Cloud project\n');
            console.error('Fix:');
            console.error('1. Go to https://console.cloud.google.com/');
            console.error('2. Select your project');
            console.error('3. Go to APIs & Services → Library');
            console.error('4. Search for "Gmail API"');
            console.error('5. Click "Enable"\n');
        } else if (error.message.includes('invalid_grant')) {
            console.error('🔧 Your refresh token is invalid or expired\n');
            console.error('Fix: Run "node token.js" to generate a new refresh token\n');
        } else {
            console.error('Error:', error.message);
        }

        return false;
    }
}

testGmailAPI().then(success => {
    process.exit(success ? 0 : 1);
});
