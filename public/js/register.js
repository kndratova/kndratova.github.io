const applyPhoneMask = (input) => {
    if (!input) return;

    const format = (digits) => {
        const d = digits.replace(/\D/g, '').slice(0, 11);
        const norm = d.startsWith('8') ? ('7' + d.slice(1)) : d;

        if (!norm) return '';
        if (norm[0] !== '7') return '+' + norm;

        const p1 = norm.slice(1, 4);
        const p2 = norm.slice(4, 7);
        const p3 = norm.slice(7, 9);
        const p4 = norm.slice(9, 11);

        let out = '+7';
        if (p1) out += ` (${p1}`;
        if (p1.length === 3) out += ')';
        if (p2) out += ` ${p2}`;
        if (p3) out += `-${p3}`;
        if (p4) out += `-${p4}`;
        return out;
    };

    const onInput = () => {
        input.value = format(input.value);
    };

    input.addEventListener('input', onInput);
    input.addEventListener('blur', onInput);
};

const phoneToDigitsForServer = (value) => {
    const digits = String(value ?? '').replace(/\D/g, '');
    if (!digits) return '';
    if (digits.length === 11 && (digits.startsWith('7') || digits.startsWith('8'))) {
        const d = digits.startsWith('8') ? ('7' + digits.slice(1)) : digits;
        return `+${d}`;
    }
    return String(value ?? '').trim();
};

const showError = (msg) => {
    const errEl = document.querySelector('.auth-error');
    if (!errEl) return;
    errEl.textContent = msg || 'Ошибка: проверьте корректность заполнения полей';
    errEl.classList.remove('is-hidden');
};

document.addEventListener('DOMContentLoaded', () => {
    if (!document.body.classList.contains('register-page')) return;

    const form = document.getElementById('registerForm');
    const phoneInput = document.getElementById('regPhone');
    applyPhoneMask(phoneInput);

    form?.addEventListener('submit', async (e) => {
        e.preventDefault();

        const errEl = document.querySelector('.auth-error');
        errEl?.classList.add('is-hidden');

        const email = (document.getElementById('regEmail')?.value ?? '').trim();
        const name = (document.getElementById('regName')?.value ?? '').trim();
        const phoneMasked = (phoneInput?.value ?? '').trim();
        const phone = phoneToDigitsForServer(phoneMasked);

        const password = document.getElementById('regPassword')?.value ?? '';
        const password2 = document.getElementById('regPassword2')?.value ?? '';

        try {
            const r = await fetch('/api/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, name, phone, password, password2 })
            });

            const data = await r.json().catch(() => ({}));

            if (!r.ok || !data.success) {
                showError(data.message);
                return;
            }

            localStorage.setItem('melagrano_auth', 'true');
            localStorage.setItem('melagrano_auth_user', email);
            window.location.href = '/profile';
        } catch (err) {
            console.error(err);
            showError('Ошибка сети/сервера');
        }
    });
});
