const setCurrentUserKey = (email) => {
    console.log(`Пользователь ${email} авторизован`);
};

const loginUser = (req, res) => {
    const { email } = req.body;

    if (!email) {
        return res.status(400).send('Email обязателен');
    }

    setCurrentUserKey(email);
    res.status(200).send('Пользователь авторизован');
};

module.exports = loginUser;
