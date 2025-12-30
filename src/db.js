const mysql = require('mysql2');
const { DB_HOST, DB_USER, DB_PASSWORD, DB_NAME, CHARSET } = require('./config');

const db = mysql.createConnection({
    host: DB_HOST,
    user: DB_USER,
    password: DB_PASSWORD,
    database: DB_NAME,
    charset: CHARSET,
});

const connectToDatabase = () => {
    db.connect((err) => {
        if (err) {
            console.error('database connection error:', err.stack);
            return;
        }
        console.log('successfully connected to database');
    });
};

module.exports = { db, connectToDatabase };
