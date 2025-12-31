const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
const session = require('express-session');
const bcrypt = require('bcrypt');

const { PORT } = require('./config');
const { connectToDatabase, db } = require('./db');

const app = express();

connectToDatabase();

// важно: session должен быть ДО роутов
app.use(session({
    secret: 'melagrano_secret_key',
    resave: false,
    saveUninitialized: false,
    cookie: { httpOnly: true }
}));

app.use(cors());
app.use(bodyParser.json());

app.use(express.static(path.join(__dirname, '..', 'public')));

// pages
app.get('/', (req, res) => res.sendFile(path.resolve(__dirname, '..', 'public', 'index.html')));
app.get('/cart', (req, res) => res.sendFile(path.resolve(__dirname, '..', 'public', 'cart.html')));
app.get('/profile', (req, res) => res.sendFile(path.resolve(__dirname, '..', 'public', 'profile.html')));
app.get('/login', (req, res) => res.sendFile(path.resolve(__dirname, '..', 'public', 'login.html')));
app.get('/register', (req, res) => res.sendFile(path.resolve(__dirname, '..', 'public', 'register.html')));

// products
app.get('/api/products', async (req, res) => {
    try {
        const query = 'SELECT * FROM products';
        const results = await new Promise((resolve, reject) => {
            db.query(query, (err, results) => err ? reject(err) : resolve(results));
        });
        res.json(results);
    } catch (err) {
        console.error('database query error:', err);
        res.status(500).send('error in getting products');
    }
});

// current user (session-based)
app.get('/api/me', (req, res) => {
    if (!req.session?.userId) return res.status(401).json({ message: 'not authenticated' });

    db.query(
        'SELECT id, email, name, phone FROM users WHERE id = ? LIMIT 1',
        [req.session.userId],
        (err, rows) => {
            if (err) return res.status(500).json({ message: 'db error' });
            if (!rows.length) return res.status(404).json({ message: 'user not found' });
            return res.json(rows[0]);
        }
    );
});

// login (bcrypt)
app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        const userRows = await new Promise((resolve, reject) => {
            db.query('SELECT id, email FROM users WHERE email = ? LIMIT 1', [email], (err, results) => {
                if (err) reject(err);
                else resolve(results);
            });
        });

        if (!userRows.length) {
            return res.json({ success: false, message: 'user not found' });
        }

        const userId = userRows[0].id;

        const authRows = await new Promise((resolve, reject) => {
            db.query('SELECT password FROM authorization WHERE user_id = ? LIMIT 1', [userId], (err, results) => {
                if (err) reject(err);
                else resolve(results);
            });
        });

        if (!authRows.length) {
            return res.json({ success: false, message: 'incorrect login or password' });
        }

        const hash = authRows[0].password;

        // если у тебя раньше были plain-text пароли, bcrypt.compare вернет false
        // тогда нужно будет мигрировать пароли (скажи — дам скрипт)
        const ok = await bcrypt.compare(String(password ?? ''), hash);
        if (!ok) {
            return res.json({ success: false, message: 'incorrect login or password' });
        }

        req.session.userId = userId;
        return res.json({ success: true });
    } catch (err) {
        console.error('login error:', err);
        res.status(500).send('server error');
    }
});

// logout
app.post('/api/logout', (req, res) => {
    req.session.destroy(() => {
        res.json({ ok: true });
    });
});

// update profile (name + phone)
app.patch('/api/profile', (req, res) => {
    if (!req.session?.userId) return res.status(401).json({ message: 'not authenticated' });

    const name = (req.body?.name ?? '').trim();
    const phone = (req.body?.phone ?? '').trim();

    if (name.length < 2) return res.status(400).json({ message: 'name too short' });
    if (name.length > 255) return res.status(400).json({ message: 'name too long' });

    // разрешаем пустой, иначе ограничим
    if (phone && phone.length > 15) return res.status(400).json({ message: 'phone too long' });

    db.query(
        'UPDATE users SET name = ?, phone = ? WHERE id = ?',
        [name, phone || null, req.session.userId],
        (err) => {
            if (err) return res.status(500).json({ message: 'db error' });
            return res.json({ ok: true });
        }
    );
});

// change password
app.patch('/api/password', (req, res) => {
    if (!req.session?.userId) return res.status(401).json({ message: 'not authenticated' });

    const currentPassword = String(req.body?.currentPassword ?? '');
    const newPassword = String(req.body?.newPassword ?? '');

    if (newPassword.length < 6) return res.status(400).json({ message: 'new password too short' });

    db.query(
        'SELECT password FROM authorization WHERE user_id = ? LIMIT 1',
        [req.session.userId],
        async (err, rows) => {
            if (err) return res.status(500).json({ message: 'db error' });
            if (!rows.length) return res.status(404).json({ message: 'auth not found' });

            const hash = rows[0].password;

            const ok = await bcrypt.compare(currentPassword, hash);
            if (!ok) return res.status(400).json({ message: 'current password is wrong' });

            const newHash = await bcrypt.hash(newPassword, 10);

            db.query(
                'UPDATE authorization SET password = ? WHERE user_id = ?',
                [newHash, req.session.userId],
                (err2) => {
                    if (err2) return res.status(500).json({ message: 'db error' });
                    return res.json({ ok: true });
                }
            );
        }
    );
});

app.post('/api/register', async (req, res) => {
    const email = String(req.body?.email ?? '').trim().toLowerCase();
    const name = String(req.body?.name ?? '').trim();
    const phone = String(req.body?.phone ?? '').trim();
    const password = String(req.body?.password ?? '');
    const password2 = String(req.body?.password2 ?? '');

    if (!email || !password || !password2) {
        return res.status(400).json({ success: false, message: 'Заполните обязательные поля' });
    }
    if (password !== password2) {
        return res.status(400).json({ success: false, message: 'Пароли не совпадают' });
    }
    if (password.length < 6) {
        return res.status(400).json({ success: false, message: 'Пароль слишком короткий (минимум 6 символов)' });
    }

    try {
        // 1) проверим что email не занят
        const exists = await new Promise((resolve, reject) => {
            db.query('SELECT id FROM users WHERE email = ? LIMIT 1', [email], (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });

        if (exists.length) {
            return res.status(409).json({ success: false, message: 'Пользователь с такой почтой уже зарегистрирован' });
        }

        // 2) создаём user
        const userId = await new Promise((resolve, reject) => {
            db.query(
                'INSERT INTO users (email, name, phone, orders) VALUES (?, ?, ?, ?)',
                [email, name || null, phone || null, JSON.stringify([])],
                (err, result) => {
                    if (err) reject(err);
                    else resolve(result.insertId);
                }
            );
        });

        // 3) хэш пароля
        const hash = await bcrypt.hash(password, 10);

        // 4) создаём authorization
        await new Promise((resolve, reject) => {
            db.query(
                'INSERT INTO authorization (user_id, email, password) VALUES (?, ?, ?)',
                [userId, email, hash],
                (err) => (err ? reject(err) : resolve())
            );
        });

        // 5) сразу авторизуем
        req.session.userId = userId;

        return res.json({ success: true });
    } catch (err) {
        console.error('register error:', err);
        return res.status(500).json({ success: false, message: 'server error' });
    }
});


app.listen(PORT, () => {
    console.log(`server started at ${PORT}`);
});
