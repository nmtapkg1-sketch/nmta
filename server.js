// server.js
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const db = require('./db');
require('dotenv').config();
const nodemailer = require('nodemailer');
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
    console.error(err);
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

// ---------- Gmail OAuth2 Email Setup ----------
const oAuth2Client = new google.auth.OAuth2(
    process.env.CLIENT_ID,
    process.env.CLIENT_SECRET,
    process.env.REDIRECT_URI
);
oAuth2Client.setCredentials({ refresh_token: process.env.REFRESH_TOKEN });

// ---------- Send Email Function ----------
async function sendEmail(to, subject, body) {
    if (!subject || !body) throw new Error('Subject and body are required');

    const accessTokenObj = await oAuth2Client.getAccessToken();
    const accessToken = accessTokenObj?.token || accessTokenObj;

    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            type: 'OAuth2',
            user: process.env.EMAIL_ADDRESS,
            clientId: process.env.CLIENT_ID,
            clientSecret: process.env.CLIENT_SECRET,
            refreshToken: process.env.REFRESH_TOKEN,
            accessToken,
        },
    });

    const mailOptions = {
        from: `NMTA <${process.env.EMAIL_ADDRESS}>`,
        to: to || process.env.EMAIL_ADDRESS,
        subject,
        html: body,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('📧 Email sent:', info.response);
    return info;
}

// ---------- API Endpoint to Send Email ----------
app.post('/api/send-email', async (req, res) => {
    const { to, subject, body } = req.body;

    try {
        const info = await sendEmail(to, subject, body);
        res.json({ message: 'Email sent successfully', info: info.response });
    } catch (err) {
        console.error('❌ Error sending email:', err);
        res.status(500).json({ error: 'Failed to send email', details: err.message });
    }
});

// ---------- OAuth2 Callback (Optional) ----------
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
});
