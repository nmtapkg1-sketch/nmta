// server.js
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const db = require('./db');
require('dotenv').config();
const { google } = require('googleapis');

const app = express();
const port = process.env.PORT || 3000;

// ---------- Middleware ----------
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static('uploads'));

// ---------- File Upload Configuration ----------
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, 'uploads/'),
    filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
});
const upload = multer({ storage });

// ---------- DB Error Handler ----------
const handleDbError = (res, err) => {
    console.error('DB Error:', err);
    res.status(500).json({ error: err.message });
};

// ---------- Generic CRUD Routes ----------
const createCrudRoutes = (tableName) => {
    app.get(`/api/${tableName}`, (req, res) => {
        db.all(`SELECT * FROM ${tableName}`, [], (err, rows) => {
            if (err) return handleDbError(res, err);
            res.json(rows);
        });
    });

    app.get(`/api/${tableName}/:id`, (req, res) => {
        db.get(`SELECT * FROM ${tableName} WHERE id = ?`, [req.params.id], (err, row) => {
            if (err) return handleDbError(res, err);
            if (!row) return res.status(404).json({ error: 'Not found' });
            res.json(row);
        });
    });

    app.post(`/api/${tableName}`, upload.single('photo'), (req, res) => {
        const data = req.body;
        if (req.file) data.photo = req.file.filename;

        const keys = Object.keys(data);
        const values = Object.values(data);
        const placeholders = keys.map(() => '?').join(',');

        const sql = `INSERT INTO ${tableName} (${keys.join(',')}) VALUES (${placeholders})`;
        db.run(sql, values, function (err) {
            if (err) return handleDbError(res, err);
            res.json({ id: this.lastID, ...data });
        });
    });

    app.put(`/api/${tableName}/:id`, upload.single('photo'), (req, res) => {
        const data = req.body;
        if (req.file) data.photo = req.file.filename;

        const keys = Object.keys(data);
        const values = Object.values(data);
        const setClause = keys.map(key => `${key} = ?`).join(',');

        const sql = `UPDATE ${tableName} SET ${setClause} WHERE id = ?`;
        db.run(sql, [...values, req.params.id], function (err) {
            if (err) return handleDbError(res, err);
            res.json({ message: 'Updated successfully', changes: this.changes });
        });
    });

    app.delete(`/api/${tableName}/:id`, (req, res) => {
        db.run(`DELETE FROM ${tableName} WHERE id = ?`, [req.params.id], function (err) {
            if (err) return handleDbError(res, err);
            res.json({ message: 'Deleted successfully', changes: this.changes });
        });
    });
};

// ---------- Create CRUD Routes ----------
['executive', 'members', 'founder_members', 'financial_history'].forEach(createCrudRoutes);

// ---------- Sync from JSON ----------
app.post('/api/sync-from-json', (req, res) => {
    const dataPath = path.resolve(__dirname, 'data.json');
    fs.readFile(dataPath, 'utf8', (err, data) => {
        if (err) return handleDbError(res, err);
        try {
            const jsonData = JSON.parse(data);
            res.json({ message: 'JSON read successfully', data: jsonData });
        } catch (parseErr) {
            handleDbError(res, parseErr);
        }
    });
});

// ---------- Gmail API OAuth2 Setup ----------
const oAuth2Client = new google.auth.OAuth2(
    process.env.CLIENT_ID,
    process.env.CLIENT_SECRET,
    process.env.REDIRECT_URI
);
oAuth2Client.setCredentials({ refresh_token: process.env.REFRESH_TOKEN });

// ---------- Send Email via Gmail API (No SMTP) ----------
async function sendEmail(to, subject, body) {
    console.log('📩 Sending email via Gmail API (HTTPS - Port 443)...');

    if (!subject || !body) throw new Error('Subject and body are required');

    try {
        // Initialize Gmail API client
        const gmail = google.gmail({ version: 'v1', auth: oAuth2Client });

        // Create RFC 2822 email format
        const utf8Subject = `=?utf-8?B?${Buffer.from(subject).toString('base64')}?=`;
        const messageParts = [
            `From: NMTA <${process.env.EMAIL_ADDRESS}>`,
            `To: ${to || process.env.EMAIL_ADDRESS}`,
            `Subject: ${utf8Subject}`,
            'MIME-Version: 1.0',
            'Content-Type: text/html; charset=utf-8',
            '',
            body
        ];

        const message = messageParts.join('\n');

        // Encode in base64url format (required by Gmail API)
        const encodedMessage = Buffer.from(message)
            .toString('base64')
            .replace(/\+/g, '-')
            .replace(/\//g, '_')
            .replace(/=+$/, '');

        // Send via Gmail API
        const result = await gmail.users.messages.send({
            userId: 'me',
            requestBody: {
                raw: encodedMessage
            }
        });

        console.log('✅ Email sent successfully! Message ID:', result.data.id);
        return { messageId: result.data.id, response: '250 OK' };

    } catch (error) {
        console.error('❌ Gmail API Error:', error.message);
        if (error.response) {
            console.error('Error details:', error.response.data);
        }
        throw error;
    }
}

// ---------- API Endpoint to Send Email ----------
app.post('/api/send-email', async (req, res) => {
    const { to, subject, body } = req.body;
    try {
        const info = await sendEmail(to, subject, body);
        res.json({ message: 'Email sent successfully', info: info.response });
    } catch (err) {
        res.status(500).json({ error: 'Failed to send email', details: err.message });
    }
});

// ---------- Temporary Test Email Route ----------
app.get('/test-email', async (req, res) => {
    try {
        const info = await sendEmail(
            process.env.EMAIL_ADDRESS,
            'Test Email from Production Server',
            '<p>This is a test email from live production server using Gmail API.</p>'
        );
        res.send(`✅ Email sent! Response: ${info.response}`);
    } catch (err) {
        console.error('❌ Test email failed:', err);
        res.status(500).send(`❌ Failed to send email: ${err.message}`);
    }
});

// ---------- OAuth2 Callback Route ----------
app.get('/oauth2callback', async (req, res) => {
    try {
        const code = req.query.code;
        if (!code) return res.send('No code received.');

        const { tokens } = await oAuth2Client.getToken(code);
        console.log('✅ Tokens received:', tokens);

        res.send(`<h3>Tokens received! Check your console.</h3>
              <p>Refresh Token: ${tokens.refresh_token}</p>`);
    } catch (err) {
        console.error('❌ Error getting tokens:', err);
        res.status(500).send('Error getting tokens. Check console.');
    }
});

// ---------- Start Server ----------
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
    console.log('Connected to the SQLite database.');
    console.log(`Available at your primary URL: ${process.env.REDIRECT_URI.replace('/oauth2callback', '')}`);
});
