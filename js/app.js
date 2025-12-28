(() => {
    const CART_KEY = "melagrano_cart";
    const USER_KEY = "melagrano_user";
    const AUTH_KEY = "melagrano_auth";

    const API_URL = "https://dummyjson.com/products?limit=50";
    const USD_TO_RUB = 95;

    const qs = (s, r = document) => r.querySelector(s);
    const qsa = (s, r = document) => Array.from(r.querySelectorAll(s));

    const toRub = (usd) => Math.round((Number(usd) || 0) * USD_TO_RUB);
    const formatRub = (n) => `${Math.round(Number(n) || 0).toLocaleString("ru-RU")} ₽`;

    const isCatalogPage = () => Boolean(qs("#catalogGrid"));
    const isCartPage = () => Boolean(qs(".cart"));
    const isProfilePage = () => Boolean(qs(".profile"));

    /* ===================== AUTH ===================== */

    const getUser = () => {
        try { return JSON.parse(localStorage.getItem(USER_KEY)); }
        catch { return null; }
    };

    const saveUser = (user) => localStorage.setItem(USER_KEY, JSON.stringify(user));

    const isAuthorized = () =>
        localStorage.getItem(AUTH_KEY) === "true" && !!getUser();

    const loginUser = () => localStorage.setItem(AUTH_KEY, "true");

    const logoutUser = () => {
        localStorage.removeItem(AUTH_KEY);
        window.location.href = "login.html";
    };

    /* ===================== CART STORAGE ===================== */

    const getCart = () => {
        try {
            const raw = JSON.parse(localStorage.getItem(CART_KEY)) || [];
            return raw
                .map((x) => ({
                    key: String(x.key ?? ""),
                    title: String(x.title ?? ""),
                    img: String(x.img ?? ""),
                    price: Number(x.price) || 0,
                }))
                .filter((x) => x.key);
        } catch {
            return [];
        }
    };

    const setCart = (cart) => localStorage.setItem(CART_KEY, JSON.stringify(cart));

    /* ===================== PHONE MASK ===================== */

    function applyPhoneMaskToInput(input) {
        if (!input) return;

        input.addEventListener("input", () => {
            let digits = input.value.replace(/\D/g, "");

            if (digits.startsWith("8")) digits = digits.slice(1);
            if (digits.startsWith("7")) digits = digits.slice(1);

            digits = digits.slice(0, 10);

            if (digits.length === 0) {
                input.value = "";
                return;
            }

            let v = "+7";

            if (digits.length < 4) {
                v += " (" + digits;
            } else if (digits.length < 7) {
                v += ` (${digits.slice(0, 3)}) ${digits.slice(3)}`;
            } else if (digits.length < 9) {
                v += ` (${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
            } else {
                v += ` (${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 8)}-${digits.slice(8, 10)}`;
            }

            input.value = v;
        });
    }

    function initPhoneMaskOnRegister() {
        const tel = qs('input[type="tel"]');
        if (!tel) return;
        applyPhoneMaskToInput(tel);
    }

    /* ===================== CATALOG (DummyJSON) ===================== */

    function setButtonState(btn, inCart) {
        if (!btn) return;

        if (inCart) {
            btn.textContent = "В корзине →";
            btn.classList.remove("btn--primary");
            btn.dataset.state = "in-cart";
        } else {
            btn.textContent = "В корзину";
            btn.classList.add("btn--primary");
            btn.dataset.state = "add";
        }
    }

    function syncCatalogButtons() {
        const grid = qs("#catalogGrid");
        if (!grid) return;

        const keysInCart = new Set(getCart().map((i) => i.key));
        qsa(".btn[data-key]", grid).forEach((btn) => {
            const key = btn.dataset.key;
            setButtonState(btn, keysInCart.has(key));
        });
    }

    async function renderCatalogFromAPI() {
        const grid = qs("#catalogGrid");
        if (!grid) return;

        grid.innerHTML = "";

        try {
            const res = await fetch(API_URL);
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const data = await res.json();

            const keysInCart = new Set(getCart().map((i) => i.key));
            const fragment = document.createDocumentFragment();

            data.products.forEach((product) => {
                const key = `api_${product.id}`;
                const inCart = keysInCart.has(key);

                const priceRub = toRub(product.price);

                const card = document.createElement("article");
                card.className = "card";

                card.innerHTML = `
                    <img class="card__img" src="${product.thumbnail}" alt="">
                    <p class="card__title">${product.title}</p>
                    <div class="card__bottom">
                        <span class="price">${formatRub(priceRub)}</span>
                        <button class="btn ${inCart ? "" : "btn--primary"}"
                                type="button"
                                data-key="${key}">
                            ${inCart ? "В корзине →" : "В корзину"}
                        </button>
                    </div>
                `;

                const btn = qs(".btn", card);
                btn.dataset.state = inCart ? "in-cart" : "add";

                btn.addEventListener("click", () => {
                    if (btn.dataset.state === "in-cart") {
                        window.location.href = "cart.html";
                        return;
                    }

                    const cart = getCart();
                    if (!cart.some((x) => x.key === key)) {
                        cart.push({
                            key,
                            title: product.title,
                            price: priceRub,
                            img: product.thumbnail,
                        });
                        setCart(cart);
                    }

                    setButtonState(btn, true);
                });

                fragment.appendChild(card);
            });

            grid.appendChild(fragment);
        } catch (e) {
            grid.innerHTML = "<p>Ошибка загрузки каталога</p>";
            console.error(e);
        }
    }

    /* ===================== CART ===================== */

    function setCartTitle(count) {
        const title = qs(".cart-title");
        if (!title) return;
        title.textContent = `КОРЗИНА (${count})`;
    }

    function renderEmptyCart(list) {
        list.innerHTML = `
            <div class="cart-empty">
                <p class="cart-empty__title">Ваша корзина пуста</p>
                <a class="cart-empty__link" href="index.html">За покупками →</a>
            </div>
        `;

        setCartTitle(0);

        const totalEl = qs(".cart-summary__total span");
        if (totalEl) totalEl.textContent = formatRub(0);

        const btn = qs(".cart-summary__btn");
        if (btn) btn.disabled = true;
    }

    function renderCart() {
        const list = qs(".cart-list");
        if (!list) return;

        const cart = getCart();

        if (cart.length === 0) {
            renderEmptyCart(list);
            return;
        }

        list.innerHTML = cart.map((item) => `
            <article class="cart-item" data-key="${item.key}">
                <img class="cart-item__img" src="${item.img}" alt="">
                <p class="cart-item__title">${item.title}</p>
                <span class="cart-item__price">${formatRub(item.price)}</span>
                <button class="cart-item__remove" type="button">Удалить</button>
            </article>
        `).join("");

        const totalSum = cart.reduce((s, x) => s + (Number(x.price) || 0), 0);

        const totalEl = qs(".cart-summary__total span");
        if (totalEl) totalEl.textContent = formatRub(totalSum);

        const btn = qs(".cart-summary__btn");
        if (btn) btn.disabled = false;

        setCartTitle(cart.length);
    }

    function initCart() {
        if (!isCartPage()) return;

        renderCart();

        qs(".cart-list")?.addEventListener("click", (e) => {
            const removeBtn = e.target.closest(".cart-item__remove");
            if (!removeBtn) return;

            const itemEl = removeBtn.closest(".cart-item");
            const key = itemEl?.dataset.key;
            if (!key) return;

            const next = getCart().filter((x) => x.key !== key);
            setCart(next);

            renderCart();
            syncCatalogButtons();
        });
    }

    /* ===================== REGISTRATION ===================== */

    function initRegister() {
        const form = qs(".auth-form");
        if (!form || !document.title.includes("Регистрация")) return;

        const errorBox = qs(".auth-error");
        const PHONE_REGEX = /^\+7\s\(\d{3}\)\s\d{3}-\d{2}-\d{2}$/;

        form.addEventListener("submit", (e) => {
            e.preventDefault();

            errorBox?.classList.add("is-hidden");

            const email = qs('input[type="email"]')?.value.trim() || "";
            const name = qs('input[type="text"]')?.value.trim() || "";
            const phone = qs('input[type="tel"]')?.value.trim() || "";

            const pass = qsa('input[type="password"]');
            const p1 = pass[0]?.value || "";
            const p2 = pass[1]?.value || "";

            const showError = (text) => {
                if (!errorBox) return;
                errorBox.textContent = `Ошибка: ${text}`;
                errorBox.classList.remove("is-hidden");
            };

            if (!email || !p1 || !p2) {
                showError("почта и пароль обязательны");
                return;
            }

            if (p1 !== p2) {
                showError("пароли не совпадают");
                return;
            }

            if (phone && !PHONE_REGEX.test(phone)) {
                showError("телефон должен быть в формате +7 (981) 876-42-45");
                return;
            }

            saveUser({ email, name, phone, password: p1 });
            loginUser();
            window.location.href = "profile.html";
        });
    }

    /* ===================== LOGIN ===================== */

    function initLogin() {
        const form = qs(".auth-form");
        if (!form || !document.title.includes("Вход")) return;

        const errorBox = qs(".auth-error");

        form.addEventListener("submit", (e) => {
            e.preventDefault();

            errorBox?.classList.add("is-hidden");

            const email = qs('input[type="email"]')?.value.trim() || "";
            const password = qs('input[type="password"]')?.value || "";

            const user = getUser();

            if (!user || user.email !== email || user.password !== password) {
                if (errorBox) {
                    errorBox.textContent = "Ошибка: неверная почта или пароль";
                    errorBox.classList.remove("is-hidden");
                }
                return;
            }

            loginUser();
            window.location.href = "profile.html";
        });
    }

    /* ===================== PROFILE ===================== */

    function initProfile() {
        if (!isProfilePage()) return;

        if (!isAuthorized()) {
            window.location.href = "login.html";
            return;
        }

        const user = getUser();
        if (!user) return;

        const fields = qsa(".profile-fields .field");
        const nameInput = fields[0] || null;
        const emailInput = fields[1] || null;
        const phoneInput = fields[2] || null;

        if (nameInput) nameInput.value = user.name || "";
        if (emailInput) emailInput.value = user.email || "";

        const phoneRow = phoneInput?.closest(".profile-row") || null;
        const addBtn = phoneRow ? qs(".field-btn", phoneRow) : null;

        const PHONE_REGEX = /^\+7\s\(\d{3}\)\s\d{3}-\d{2}-\d{2}$/;

        function setPhoneViewMode() {
            if (!phoneInput) return;

            phoneInput.type = "text";
            phoneInput.classList.add("field--readonly");
            phoneInput.readOnly = true;

            const hasPhone = Boolean(user.phone && user.phone.trim());
            phoneInput.value = hasPhone ? user.phone : "не указан";

            if (addBtn) {
                addBtn.style.display = hasPhone ? "none" : "inline-block";
                addBtn.textContent = "Добавить";
                addBtn.dataset.mode = "add";
            }
        }

        function setPhoneEditMode() {
            if (!phoneInput) return;

            phoneInput.type = "tel";
            phoneInput.classList.remove("field--readonly");
            phoneInput.readOnly = false;

            phoneInput.value = user.phone || "+7 ";
            phoneInput.focus();

            if (addBtn) {
                addBtn.style.display = "inline-block";
                addBtn.textContent = "Сохранить";
                addBtn.dataset.mode = "save";
            }

            applyPhoneMaskToInput(phoneInput);
        }

        if (addBtn && phoneInput) {
            addBtn.addEventListener("click", () => {
                const mode = addBtn.dataset.mode || "add";

                if (mode === "add") {
                    setPhoneEditMode();
                    return;
                }

                const raw = (phoneInput.value || "").trim();

                if (!PHONE_REGEX.test(raw)) {
                    alert("Телефон должен быть в формате +7 (981) 876-42-45");
                    return;
                }

                user.phone = raw;
                saveUser(user);
                setPhoneViewMode();
            });
        }

        setPhoneViewMode();

        qs(".profile-logout")?.addEventListener("click", logoutUser);

        const passForm = qs(".password-form");
        passForm?.addEventListener("submit", (e) => {
            e.preventDefault();

            const passInputs = qsa('.password-form input[type="password"]');
            const oldPass = passInputs[0]?.value || "";
            const newPass = passInputs[1]?.value || "";
            const newPass2 = passInputs[2]?.value || "";

            if (oldPass !== (user.password || "")) {
                alert("Текущий пароль неверен");
                return;
            }

            if (!newPass || newPass !== newPass2) {
                alert("Новые пароли не совпадают");
                return;
            }

            user.password = newPass;
            saveUser(user);

            passInputs.forEach(i => i.value = "");
            alert("Пароль успешно изменён");
        });
    }

    /* ===================== NAVIGATION ===================== */

    function initNavigation() {
        document.addEventListener("click", (e) => {
            const link = e.target.closest(".nav__link");
            if (!link) return;

            const page = link.dataset.page;
            if (!page) return;

            e.preventDefault();

            if (page === "profile.html" && !isAuthorized()) {
                window.location.href = "login.html";
                return;
            }

            window.location.href = page;
        });
    }

    /* ===================== INIT ===================== */

    document.addEventListener("DOMContentLoaded", () => {
        if (isCatalogPage()) {
            renderCatalogFromAPI();
        }

        initNavigation();
        initCart();
        initRegister();
        initLogin();
        initProfile();
        initPhoneMaskOnRegister();
    });
})();
