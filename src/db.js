const mysql = require('mysql2');

const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '19012002',
    database: 'melagrano_db'
});

db.connect((err) => {
    if (err) {
        console.error('Ошибка подключения к базе данных:', err.stack);
        return;
    }
    console.log('Подключено к базе данных');
});

module.exports = db;
