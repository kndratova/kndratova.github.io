const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
const { PORT } = require('./config');
const { connectToDatabase, db } = require('./db');

const app = express();

app.use(cors());

connectToDatabase();

app.use(bodyParser.json());

app.use(express.static(path.join(__dirname, '..', 'public')));

app.get('/', (req, res) => {
    res.sendFile(path.resolve(__dirname, '..', 'public', 'index.html'));
});

app.get('/cart', (req, res) => {
    res.sendFile(path.resolve(__dirname, '..', 'public', 'cart.html'));
});

app.get('/profile', (req, res) => {
    res.sendFile(path.resolve(__dirname, '..', 'public', 'profile.html'));
});

app.get('/api/products', async (req, res) => {
    try {
        const query = 'SELECT * FROM products';
        const results = await new Promise((resolve, reject) => {
            db.query(query, (err, results) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(results);
                }
            });
        });
        res.json(results);
    } catch (err) {
        console.error('Ошибка при запросе к базе данных:', err);
        res.status(500).send('Ошибка при получении продуктов');
    }
});


app.use('/register', require('./routes/register'));
app.use('/login', require('./routes/login'));
app.use('/order', require('./routes/order'));
app.use('/orders', require('./routes/getOrders'));

app.listen(PORT, () => {
    console.log(`server started at ${PORT}`);
});
