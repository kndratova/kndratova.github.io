export const getCurrentUserKey = () => {
    const userKey = localStorage.getItem('melagrano_auth_user');
    return userKey || null;
};

export const isAuthorized = () => {
    const authStatus = localStorage.getItem('melagrano_auth');
    return authStatus === 'true' && getCurrentUserKey() !== null;
};

export const handleAuthorization = () => {
    if (localStorage.getItem('melagrano_auth') === 'true') {
        const profileLink = document.querySelector('.nav__link[href="/login"]');
        if (profileLink) {
            profileLink.href = '/profile';
            profileLink.textContent = 'Личный кабинет';
        }
    } else {
        const profileLink = document.querySelector('.nav__link[href="/profile"]');
        if (profileLink) {
            profileLink.href = '/login';
            profileLink.textContent = 'Вход';
        }
    }
};

export const handleLoginFormSubmit = async (e) => {
    e.preventDefault();

    const email = document.getElementById('email')?.value ?? '';
    const password = document.getElementById('password')?.value ?? '';

    const errEl = document.querySelector('.auth-error');
    errEl?.classList.add('is-hidden');

    try {
        const response = await fetch('/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
        });

        const data = await response.json().catch(() => ({}));

        if (data.success) {
            localStorage.setItem('melagrano_auth', 'true');
            localStorage.setItem('melagrano_auth_user', email);
            window.location.href = '/profile';
            return;
        }

        errEl?.classList.remove('is-hidden');
    } catch (error) {
        console.error('Ошибка при отправке данных на сервер:', error);
        errEl?.classList.remove('is-hidden');
    }
};
