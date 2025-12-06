const db = require('../db');
const fs = require('fs');
const path = require('path');

const dataPath = path.join(__dirname, '../data/members.json');
const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

db.serialize(() => {
    const stmt = db.prepare("INSERT INTO members (name, businessname, phoneno, emailid, shopno, photo, remarks) VALUES (?, ?, ?, ?, ?, ?, ?)");

    data.forEach(item => {
        stmt.run(item.name, item.businessname, item.phoneno, item.emailid, item.shopno, item.photo, item.remarks, (err) => {
            if (err) {
                console.error('Error inserting data:', err.message);
            } else {
                console.log(`Inserted member: ${item.name}`);
            }
        });
    });

    stmt.finalize();
});
