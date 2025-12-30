const express = require('express');
const bcrypt = require('bcrypt');
const { db } = require('../db'); // Подключаем базу данных
const { SALT_ROUNDS } = require('../config'); // Конфигурация для соли

const router = express.Router();

router.post('/', (req, res) => {
    const { email, password, name, phone } = req.body;

    if (!email || !password) {
        return res.status(400).send('Email и пароль обязательны');
    }

    bcrypt.hash(password, SALT_ROUNDS, (err, hashedPassword) => {
        if (err) return res.status(500).send('Ошибка хеширования пароля');

        const query = 'INSERT INTO users (email, password, name, phone) VALUES (?, ?, ?, ?)';
        db.query(query, [email, hashedPassword, name, phone], (err) => {
            if (err) return res.status(500).send('Ошибка при регистрации пользователя');
            res.status(200).send('Пользователь успешно зарегистрирован');
        });
    });
});

module.exports = router;
