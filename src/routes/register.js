
const bcrypt = require('bcrypt');
const db = require('../db');

module.exports = (req, res) => {
    const { email, password, name, phone } = req.body;

    bcrypt.hash(password, 10, (err, hashedPassword) => {
        if (err) {
            console.error('Ошибка хэширования пароля:', err);
            return res.status(500).send('Ошибка сервера');
        }

        console.log(hashedPassword);
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
};
