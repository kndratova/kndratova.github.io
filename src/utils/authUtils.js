const { setCurrentUserKey } = require('../routes/login');

const loginUser = (email) => {
    console.log(`Пользователь ${email} авторизован`);
    setCurrentUserKey(email);
};

module.exports = { loginUser };
