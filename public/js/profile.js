const qs = (s, r = document) => r.querySelector(s);

const applyPhoneMask = (input) => {
    if (!input) return;

    const format = (digits) => {
        const d = digits.replace(/\D/g, '').slice(0, 11);
        
        const norm = d.startsWith('8') ? ('7' + d.slice(1)) : d;
        const dd = norm;

        if (!dd) return '';
        if (dd[0] !== '7') {
            // если начали не с 7, просто показываем как ввели
            return '+' + dd;
        }

        const p1 = dd.slice(1, 4);
        const p2 = dd.slice(4, 7);
        const p3 = dd.slice(7, 9);
        const p4 = dd.slice(9, 11);

        let out = '+7';
        if (p1) out += ` (${p1}`;
        if (p1.length === 3) out += ')';
        if (p2) out += ` ${p2}`;
        if (p3) out += `-${p3}`;
        if (p4) out += `-${p4}`;
        return out;
    };

    const onInput = () => {
        const prev = input.value;
        const digits = prev.replace(/\D/g, '');
        input.value = format(digits);
    };

    input.addEventListener('input', onInput);
    input.addEventListener('blur', onInput);
};

const phoneToDigitsForServer = (value) => {
    const digits = String(value ?? '').replace(/\D/g, '');
    if (!digits) return '';
    // храним нормализовано: +7XXXXXXXXXX (если 11 цифр и начинается с 7/8)
    if (digits.length === 11 && (digits.startsWith('7') || digits.startsWith('8'))) {
        const d = digits.startsWith('8') ? ('7' + digits.slice(1)) : digits;
        return `+${d}`;
    }
    // иначе отправим как есть, но с + если нет
    return value.trim();
};

document.addEventListener('DOMContentLoaded', async () => {
    if (!document.body.classList.contains('profile-page')) return;

    if (localStorage.getItem('melagrano_auth') !== 'true') {
        window.location.href = '/login';
        return;
    }

    const nameInput = qs('input[name="name"]');
    const emailInput = qs('input[name="email"]');
    const phoneInput = qs('input[name="phone"]');

    const editBtn = qs('.panel.panel--stack .field-btn'); // кнопка в panel-head
    const logoutBtn = qs('.profile-logout');

    let isEditing = false;

    const setReadonly = (ro) => {
        nameInput && (nameInput.readOnly = ro);
        phoneInput && (phoneInput.readOnly = ro);
        emailInput && (emailInput.readOnly = true);

        nameInput?.classList.toggle('field--readonly', ro);
        phoneInput?.classList.toggle('field--readonly', ro);
        emailInput?.classList.add('field--readonly');
    };

    const updateButtonLabel = () => {
        if (!editBtn) return;
        editBtn.textContent = isEditing ? 'Сохранить' : 'Изменить';
    };

    applyPhoneMask(phoneInput);

    try {
        const r = await fetch('/api/me');
        if (!r.ok) throw new Error('not authenticated');

        const me = await r.json();

        if (nameInput) nameInput.value = me.name || '';
        if (emailInput) emailInput.value = me.email || '';
        if (phoneInput) phoneInput.value = me.phone || '';

        if (phoneInput) phoneInput.dispatchEvent(new Event('input'));

        setReadonly(true);
        updateButtonLabel();
    } catch (e) {
        localStorage.removeItem('melagrano_auth');
        localStorage.removeItem('melagrano_auth_user');
        window.location.href = '/login';
        return;
    }

    // edit/save name + phone
    editBtn?.addEventListener('click', async () => {
        if (!isEditing) {
            isEditing = true;
            setReadonly(false);
            updateButtonLabel();
            nameInput?.focus();
            return;
        }

        const name = (nameInput?.value ?? '').trim();
        const phoneMasked = (phoneInput?.value ?? '').trim();
        const phone = phoneToDigitsForServer(phoneMasked);

        if (name.length < 2) {
            alert('Имя слишком короткое');
            return;
        }

        try {
            const r = await fetch('/api/profile', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, phone })
            });

            const data = await r.json().catch(() => ({}));
            if (!r.ok) {
                alert(data.message || 'Ошибка сохранения');
                return;
            }

            isEditing = false;
            setReadonly(true);
            updateButtonLabel();
        } catch {
            alert('Ошибка сети/сервера');
        }
    });

    const passForm = qs('.password-form');
    passForm?.addEventListener('submit', async (e) => {
        e.preventDefault();

        const inputs = Array.from(passForm.querySelectorAll('input'));
        const currentPassword = inputs[0]?.value ?? '';
        const newPassword = inputs[1]?.value ?? '';
        const newPassword2 = inputs[2]?.value ?? '';

        if (newPassword !== newPassword2) {
            alert('Новые пароли не совпадают');
            return;
        }
        if (newPassword.length < 6) {
            alert('Новый пароль слишком короткий (мин. 6)');
            return;
        }

        try {
            const r = await fetch('/api/password', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ currentPassword, newPassword })
            });

            const data = await r.json().catch(() => ({}));
            if (!r.ok) {
                alert(data.message || 'Ошибка смены пароля');
                return;
            }

            inputs.forEach(i => (i.value = ''));
            alert('Пароль изменён');
        } catch {
            alert('Ошибка сети/сервера');
        }
    });

    // logout
    logoutBtn?.addEventListener('click', async () => {
        try { await fetch('/api/logout', { method: 'POST' }); } catch {}
        localStorage.removeItem('melagrano_auth');
        localStorage.removeItem('melagrano_auth_user');
        window.location.href = '/login';
    });
});
