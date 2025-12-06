const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const db = require('./db');
require('dotenv').config();
const nodemailer = require('nodemailer');

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static('uploads'));

// File Upload Configuration
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, 'uploads/'),
    filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
});
const upload = multer({ storage });

// Helper to handle DB errors
const handleDbError = (res, err) => {
    console.error(err);
    res.status(500).json({ error: err.message });
};

// Generic CRUD Routes Generator
const createCrudRoutes = (tableName) => {
    // GET all
    app.get(`/api/${tableName}`, (req, res) => {
        db.all(`SELECT * FROM ${tableName}`, [], (err, rows) => {
            if (err) return handleDbError(res, err);
            res.json(rows);
        });
    });

    // GET one
    app.get(`/api/${tableName}/:id`, (req, res) => {
        db.get(`SELECT * FROM ${tableName} WHERE id = ?`, [req.params.id], (err, row) => {
            if (err) return handleDbError(res, err);
            if (!row) return res.status(404).json({ error: 'Not found' });
            res.json(row);
        });
    });

    // POST (Create)
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

    // PUT (Update)
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

    // DELETE
    app.delete(`/api/${tableName}/:id`, (req, res) => {
        db.run(`DELETE FROM ${tableName} WHERE id = ?`, [req.params.id], function (err) {
            if (err) return handleDbError(res, err);
            res.json({ message: 'Deleted successfully', changes: this.changes });
        });
    });
};

// Create routes for all tables
['executive', 'members', 'founder_members', 'financial_history'].forEach(createCrudRoutes);

// Sync from JSON (Optional utility)
app.post('/api/sync-from-json', (req, res) => {
    const dataPath = path.resolve(__dirname, 'data.json');
    fs.readFile(dataPath, 'utf8', (err, data) => {
        if (err) return handleDbError(res, err);

        try {
            const jsonData = JSON.parse(data);
            // Logic to clear and re-populate DB could go here if requested.
            // For now, we just return the data.
            res.json({ message: 'JSON read successfully', data: jsonData });
        } catch (parseErr) {
            handleDbError(res, parseErr);
        }
    });
});

// Email Sending Endpoint
app.post('/api/send-email', async (req, res) => {
    const { to, subject, body } = req.body;

    console.log('--- Email Request Received ---');
    console.log('To:', to || process.env.EMAIL_USER);
    console.log('Subject:', subject);
    console.log('Email User:', process.env.EMAIL_USER);
    console.log('Email Pass Length:', process.env.EMAIL_PASS ? process.env.EMAIL_PASS.length : 'undefined');

    // Create Transporter with explicit configuration
    const transporter = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 587,
        secure: false, // use TLS
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
        },
        tls: {
            rejectUnauthorized: false
        },
        connectionTimeout: 10000, // 10 seconds
        greetingTimeout: 10000,
        socketTimeout: 10000
    });

    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: to || process.env.EMAIL_USER, // Default to self if no recipient specified
        subject: subject,
        html: body
    };

    try {
        // Verify transporter configuration
        console.log('Verifying SMTP connection...');
        await transporter.verify();
        console.log('SMTP connection verified successfully');

        const info = await transporter.sendMail(mailOptions);
        console.log('Email sent successfully:', info.response);
        res.json({ message: 'Email sent successfully', info: info.response });
    } catch (error) {
        console.error('!!! Error sending email !!!');
        console.error('Error Code:', error.code);
        console.error('Error Response:', error.response);
        console.error('Full Error:', error);
        res.status(500).json({ error: 'Failed to send email', details: error.message });
    }
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
