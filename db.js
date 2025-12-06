const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const dbPath = path.resolve(__dirname, 'nmta.db');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error opening database ' + dbPath + ': ' + err.message);
    } else {
        console.log('Connected to the SQLite database.');
        initDb();
    }
});

function initDb() {
    const commonColumns = `
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT,
        businessname TEXT,
        phoneno TEXT,
        emailid TEXT,
        shopno TEXT,
        photo TEXT,
        remarks TEXT
    `;

    db.serialize(() => {
        db.run(`CREATE TABLE IF NOT EXISTS executive (${commonColumns})`);
        db.run(`CREATE TABLE IF NOT EXISTS members (${commonColumns})`);
        db.run(`CREATE TABLE IF NOT EXISTS founder_members (${commonColumns})`);
        
        db.run(`CREATE TABLE IF NOT EXISTS financial_history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT,
            receiptNo TEXT,
            date TEXT,
            amount REAL,
            fortheMonth TEXT,
            remarks TEXT
        )`);
    });
}

module.exports = db;
