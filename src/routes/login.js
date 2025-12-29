
const bcrypt = require('bcrypt');
const db = require('../db');

module.exports = (req, res) => {
    const { email, password } = req.body;

    db.query('SELECT * FROM users WHERE email = ?', [email], (err, result) => {
        if (err) return res.status(500).send('Ошибка сервера');
        if (result.length === 0) {
            return res.status(400).send('Неверная почта или пароль');
        }

        const user = result[0];

        bcrypt.compare(password, user.password, (err, isMatch) => {
            if (err) return res.status(500).send('Ошибка сервера');
            if (!isMatch) {
                return res.status(400).send('Неверная почта или пароль');
            }

            res.status(200).send('Авторизация успешна');
        });
    });
};
