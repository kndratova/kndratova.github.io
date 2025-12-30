const express = require('express');
const { db } = require('../db');

const router = express.Router();

router.post('/', (req, res) => {
    const { userId, orderDetails } = req.body;

    const query = 'INSERT INTO orders (user_id, order_details) VALUES (?, ?)';
    db.query(query, [userId, JSON.stringify(orderDetails)], (err) => {
        if (err) return res.status(500).send('Ошибка при оформлении заказа');
        res.status(200).send('Заказ оформлен');
    });
});

module.exports = router;
