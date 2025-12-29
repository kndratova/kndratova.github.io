const express = require('express');
const mysql = require('mysql2');
const bodyParser = require('body-parser');
const path = require('path');
const bcrypt = require('bcrypt');
const cors = require('cors');
const app = express();

const PORT = 63342;
const saltRounds = 10;

// Настройка CORS для разрешения запросов с других портов (если нужно)
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
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Функция для логина (например, через сессии или JWT)
const loginUser = (email) => {
    // Логика для создания сессии или генерации токена
    console.log(`Пользователь ${email} авторизован`);
};

app.post('/register', (req, res) => {
    const { email, password, name, phone } = req.body;

    // Хэшируем пароль перед сохранением
    bcrypt.hash(password, saltRounds, (err, hashedPassword) => {
        if (err) {
            console.error('Ошибка хэширования пароля:', err);
            return res.status(500).send('Ошибка сервера');
        }

        db.query('SELECT * FROM users WHERE email = ?', [email], (err, result) => {
            if (err) return res.status(500).send('Ошибка сервера');
            if (result.length > 0) {
                return res.status(400).send('Пользователь с таким email уже существует');
            }

            db.query('INSERT INTO users (email, password, name, phone) VALUES (?, ?, ?, ?)',
                [email, hashedPassword, name, phone],
                (err, result) => {
                    if (err) return res.status(500).send('Ошибка сервера');
                    res.status(201).send('Пользователь зарегистрирован');
                });
        });
    });
});

app.post('/login', (req, res) => {
    const { email, password } = req.body;

    db.query('SELECT * FROM users WHERE email = ?', [email], (err, result) => {
        if (err) return res.status(500).send('Ошибка сервера');
        if (result.length === 0) {
            return res.status(400).send('Неверная почта или пароль');
        }

        const user = result[0];  // Предположим, что это первый (и единственный) пользователь с таким email

        bcrypt.compare(password, user.password, (err, isMatch) => {
            if (err) return res.status(500).send('Ошибка сервера');
            if (!isMatch) {
                return res.status(400).send('Неверная почта или пароль');
            }

            // Авторизация успешна
            loginUser(email);
            res.status(200).send('Авторизация успешна');
        });
    });
});

app.post('/order', (req, res) => {
    const { userId, items, total } = req.body;

    db.query('INSERT INTO orders (user_id, items, total) VALUES (?, ?, ?)',
        [userId, JSON.stringify(items), total],
        (err, result) => {
            if (err) return res.status(500).send('Ошибка сервера');
            res.status(201).send('Заказ оформлен');
        });
});

app.get('/orders/:userId', (req, res) => {
    const { userId } = req.params;

    db.query('SELECT * FROM orders WHERE user_id = ?', [userId], (err, result) => {
        if (err) return res.status(500).send('Ошибка сервера');
        res.status(200).json(result);
    });
});

app.listen(PORT, () => {
    console.log(`Сервер запущен на порту ${PORT}`);
});
