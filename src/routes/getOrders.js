const express = require('express');
const { db } = require('../db');

const router = express.Router();

router.get('/:userId', (req, res) => {
    const { userId } = req.params;

    const query = 'SELECT * FROM orders WHERE user_id = ?';
    db.query(query, [userId], (err, results) => {
        if (err) return res.status(500).send('Ошибка при получении заказов');
        res.status(200).json(results);
    });
});

module.exports = router;
