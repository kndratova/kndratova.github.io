
const db = require('../db');

module.exports = (req, res) => {
    const { userId, items, total } = req.body;

    db.query('INSERT INTO orders (user_id, items, total) VALUES (?, ?, ?)',
        [userId, JSON.stringify(items), total],
        (err, result) => {
            if (err) return res.status(500).send('Ошибка сервера');
            res.status(201).send('Заказ оформлен');
        });
};
