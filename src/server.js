const express = require('express');
const mysql = require('mysql2');
const bodyParser = require('body-parser');
const path = require('path');
const bcrypt = require('bcrypt');
const cors = require('cors');
const app = express();

const PORT = 63342;
const saltRounds = 10;

app.use(cors());

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

app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, '..', 'public')));

app.get('/', (req, res) => {
    res.sendFile(path.resolve(__dirname, '..', 'public', 'index.html'));
});

const loginUser = (email) => {
    console.log(`Пользователь ${email} авторизован`);
};

app.post('/register', require('./routes/register'));
app.post('/login', require('./routes/login'));
app.post('/order', require('./routes/order'));
app.get('/orders/:userId', require('./routes/getOrders'));

app.listen(PORT, () => {
    console.log(`Сервер запущен на порту ${PORT}`);
});
