// generateRefreshToken.js
const { google } = require("googleapis");
require("dotenv").config();
const readline = require("readline");

// Load credentials from .env
const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;
const REDIRECT_URI = process.env.REDIRECT_URI || "http://localhost:3000/oauth2callback";

const oAuth2Client = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);

// 1️⃣ Generate the auth URL
// Use full Gmail scope for nodemailer OAuth2
const SCOPES = ["https://mail.google.com/"];

const authUrl = oAuth2Client.generateAuthUrl({
    access_type: "offline", // ensures refresh token is returned
    scope: SCOPES,
    prompt: "consent",      // forces consent every time
});

console.log("🔗 Open this URL in your browser:\n", authUrl);
console.log("\nAfter granting access, you'll be redirected to your REDIRECT_URI with a code.");
console.log("It will look like: ?code=XXXX\n");

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
});

// 2️⃣ Prompt user for the code
rl.question("Enter the code from the URL here: ", async (code) => {
    try {
        const { tokens } = await oAuth2Client.getToken(code.trim());
        oAuth2Client.setCredentials(tokens);

        console.log("\n✅ Tokens received successfully!\n");

        if (tokens.refresh_token) {
            console.log("💡 Copy this refresh token to your .env file:");
            console.log(`REFRESH_TOKEN=${tokens.refresh_token}\n`);
        } else {
            console.log("⚠️ No refresh token returned. Make sure you used prompt: 'consent' and a test user.");
        }

        console.log("Full tokens object:\n", tokens);
    } catch (err) {
        console.error("❌ Error getting tokens:", err);
    } finally {
        rl.close();
    }
});
