
const db = require('../db');

module.exports = (req, res) => {
    const { userId } = req.params;

    db.query('SELECT * FROM orders WHERE user_id = ?', [userId], (err, result) => {
        if (err) return res.status(500).send('Ошибка сервера');
        res.status(200).json(result);
    });
};
