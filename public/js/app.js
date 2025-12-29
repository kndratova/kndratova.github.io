(() => {
    const CART_KEY = "melagrano_cart";

    // NEW: users storage + current user pointer
    const USERS_KEY = "melagrano_users";          // { [email]: userObj }
    const AUTH_KEY = "melagrano_auth";            // "true"/null
    const AUTH_USER_KEY = "melagrano_auth_user";  // current email

    // legacy (for migration)
    const LEGACY_USER_KEY = "melagrano_user";

    const RETURN_TO_KEY = "melagrano_return_to";
    const FLASH_KEY = "melagrano_flash";

    const API_URL = "https://dummyjson.com/products?limit=50";
    const USD_TO_RUB = 95;

    const qs = (s, r = document) => r.querySelector(s);
    const qsa = (s, r = document) => Array.from(r.querySelectorAll(s));

    const toRub = (usd) => Math.round((Number(usd) || 0) * USD_TO_RUB);
    const formatRub = (n) => `${Math.round(Number(n) || 0).toLocaleString("ru-RU")} ₽`;

    const isCatalogPage = () => Boolean(qs("#catalogGrid"));
    const isCartPage = () => Boolean(qs(".cart"));
    const isProfilePage = () => Boolean(qs(".profile"));

    /* ===================== USERS / AUTH ===================== */

    const safeJsonParse = (raw, fallback) => {
        try { return JSON.parse(raw); } catch { return fallback; }
    };

    const getUsers = () => {
        const obj = safeJsonParse(localStorage.getItem(USERS_KEY), {});
        return obj && typeof obj === "object" ? obj : {};
    };

    const setUsers = (users) => {
        localStorage.setItem(USERS_KEY, JSON.stringify(users || {}));
    };

    const getCurrentUserKey = () => {
        const k = (localStorage.getItem(AUTH_USER_KEY) || "").trim().toLowerCase();
        return k || "";
    };

    const setCurrentUserKey = (email) => {
        localStorage.setItem(AUTH_USER_KEY, String(email || "").trim().toLowerCase());
    };

    const clearCurrentUserKey = () => {
        localStorage.removeItem(AUTH_USER_KEY);
    };

    const getUserByKey = (email) => {
        if (!email) return null;
        const users = getUsers();
        const u = users[email.toLowerCase()];
        return u && typeof u === "object" ? u : null;
    };

    const saveUserByKey = (email, user) => {
        if (!email) return false;
        const users = getUsers();
        users[email.toLowerCase()] = user;
        setUsers(users);
        return true;
    };

    const deleteUserByKey = (email) => {
        if (!email) return;
        const users = getUsers();
        delete users[email.toLowerCase()];
        setUsers(users);
    };

    const getUser = () => {
        const email = getCurrentUserKey();
        return getUserByKey(email);
    };

    const isAuthorized = () => {
        if (localStorage.getItem(AUTH_KEY) !== "true") return false;
        const email = getCurrentUserKey();
        return !!email && !!getUserByKey(email);
    };

    const loginUser = (email) => {
        localStorage.setItem(AUTH_KEY, "true");
        setCurrentUserKey(email);
    };

    const logoutUser = () => {
        localStorage.removeItem(AUTH_KEY);
        clearCurrentUserKey();
        window.location.href = "login.html";
    };

    /* ---------- migration from legacy single-user storage ---------- */
    function migrateLegacyUserIfNeeded() {
        const already = localStorage.getItem(USERS_KEY);
        if (already) return;

        const legacy = safeJsonParse(localStorage.getItem(LEGACY_USER_KEY), null);
        if (!legacy || typeof legacy !== "object") return;

        const email = String(legacy.email || "").trim().toLowerCase();
        if (!email) return;

        // create users map
        const users = {};
        users[email] = legacy;
        setUsers(users);

        // if legacy auth existed, set current user
        if (localStorage.getItem(AUTH_KEY) === "true") {
            setCurrentUserKey(email);
        }

        // keep legacy data (optional) - you can remove it if you want
        // localStorage.removeItem(LEGACY_USER_KEY);
    }

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

    /* ===================== FLASH ===================== */

    const setFlash = (text) => localStorage.setItem(FLASH_KEY, String(text || ""));
    const popFlash = () => {
        const t = localStorage.getItem(FLASH_KEY);
        if (t) localStorage.removeItem(FLASH_KEY);
        return t || "";
    };

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

    function renderEmptyCart(list, successMessage = "") {
        const isSuccess = Boolean(successMessage && successMessage.trim());

        list.innerHTML = `
            <div class="cart-empty">
                <p class="cart-empty__title">${isSuccess ? successMessage : "Ваша корзина пуста"}</p>
                <a class="cart-empty__link" href="index.html">
                    ${isSuccess ? "Продолжить покупки →" : "За покупками →"}
                </a>
            </div>
        `;

        setCartTitle(0);

        const totalEl = qs(".cart-summary__total span");
        if (totalEl) totalEl.textContent = formatRub(0);

        const btn = qs(".cart-summary__btn");
        if (btn) btn.disabled = true;
    }

    function renderCart(successMessage = "") {
        const list = qs(".cart-list");
        if (!list) return;

        const cart = getCart();

        if (cart.length === 0) {
            renderEmptyCart(list, successMessage);
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

    function createOrderFromCart(cart) {
        const total = cart.reduce((s, x) => s + (Number(x.price) || 0), 0);
        const id = Math.floor(1000 + Math.random() * 9000);

        const pad2 = (n) => String(n).padStart(2, "0");
        const d = new Date();
        const date = `${pad2(d.getDate())}.${pad2(d.getMonth() + 1)}.${d.getFullYear()}`;

        return {
            id: `#${id}`,
            date,
            status: "Оформлен",
            total,
            items: cart.map(x => ({ title: x.title, price: x.price, key: x.key })),
        };
    }

    function saveOrderToUser(order) {
        const email = getCurrentUserKey();
        if (!email) return false;

        const user = getUserByKey(email);
        if (!user) return false;

        if (!Array.isArray(user.orders)) user.orders = [];
        user.orders.unshift(order);

        return saveUserByKey(email, user);
    }

    function initCheckout() {
        if (!isCartPage()) return;

        const btn = qs(".cart-summary__btn");
        if (!btn) return;

        btn.addEventListener("click", () => {
            const cart = getCart();
            if (cart.length === 0) return;

            if (!isAuthorized()) {
                localStorage.setItem(RETURN_TO_KEY, "cart.html");
                window.location.href = "login.html";
                return;
            }

            const order = createOrderFromCart(cart);
            const ok = saveOrderToUser(order);

            if (!ok) {
                localStorage.setItem(RETURN_TO_KEY, "cart.html");
                window.location.href = "login.html";
                return;
            }

            setCart([]);
            setFlash("Заказ успешно оформлен");

            renderCart(popFlash());
            syncCatalogButtons();
        });
    }

    function initCart() {
        if (!isCartPage()) return;

        const flash = popFlash();
        renderCart(flash);

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

        initCheckout();
    }

    /* ===================== REGISTRATION ===================== */

    async function initRegister() {
        const form = qs(".auth-form");
        if (!form || !document.title.includes("Регистрация")) return;

        const errorBox = qs(".auth-error");
        const PHONE_REGEX = /^\+7\s\(\d{3}\)\s\d{3}-\d{2}-\d{2}$/;

        form.addEventListener("submit", async (e) => {
            e.preventDefault();

            errorBox?.classList.add("is-hidden");

            const emailRaw = qs('input[type="email"]')?.value.trim() || "";
            const email = emailRaw.toLowerCase();

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

            try {
                const response = await fetch('/register', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password: p1, name, phone })
                });

                if (!response.ok) throw new Error('Ошибка регистрации');

                loginUser(email);

                const back = localStorage.getItem(RETURN_TO_KEY);
                if (back) {
                    localStorage.removeItem(RETURN_TO_KEY);
                    window.location.href = back;
                    return;
                }

                window.location.href = "profile.html";
            } catch (error) {
                showError("Ошибка на сервере. Попробуйте позже.");
            }
        });
    }



    /* ===================== LOGIN ===================== */

    async function initLogin() {
        const form = qs(".auth-form");
        if (!form || !document.title.includes("Вход")) return;

        const errorBox = qs(".auth-error");

        form.addEventListener("submit", async (e) => {
            e.preventDefault();

            errorBox?.classList.add("is-hidden");

            const email = (qs('input[type="email"]')?.value.trim() || "").toLowerCase();
            const password = qs('input[type="password"]')?.value || "";

            try {
                const response = await fetch('http://localhost:63342/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password })
                });


                if (!response.ok) {
                    throw new Error("Неверная почта или пароль");
                }

                loginUser(email);

                const back = localStorage.getItem(RETURN_TO_KEY);
                if (back) {
                    localStorage.removeItem(RETURN_TO_KEY);
                    window.location.href = back;
                    return;
                }

                window.location.href = "profile.html";
            } catch (error) {
                if (errorBox) {
                    errorBox.textContent = "Ошибка: " + error.message;
                    errorBox.classList.remove("is-hidden");
                }
            }
        });
    }


    /* ===================== PROFILE (DATA + ORDERS) ===================== */

    function renderOrders(container, orders) {
        if (!container) return;

        if (!orders || !orders.length) {
            container.innerHTML = `
                <div class="cart-empty">
                    <p class="cart-empty__title">Заказов пока нет</p>
                    <a class="cart-empty__link" href="index.html">Перейти в каталог →</a>
                </div>
            `;
            return;
        }

        const take = orders;

        container.innerHTML = take.map((o) => {
            const count = Array.isArray(o.items) ? o.items.length : 0;

            let oneLine = "";
            if (count === 1) {
                oneLine = `1 товар: ${o.items[0]?.title || "товар"}`;
            } else if (count > 1) {
                const titles = o.items.slice(0, 3).map(x => x.title).filter(Boolean);
                oneLine = `${count} товара: ${titles.join(", ")}${count > 3 ? "…" : ""}`;
            } else {
                oneLine = "Товары: —";
            }

            return `
                <article class="order">
                    <div class="order-main">
                        <span class="order-id">Заказ ${o.id}</span>
                        <span class="order-date">${o.date || ""}</span>
                        <span class="order-status">${o.status || "Оформлен"}</span>
                        <span class="order-sum">${formatRub(o.total || 0)}</span>
                    </div>
                    <div class="order-items">${oneLine}</div>
                </article>
            `;
        }).join("");
    }

    function initProfile() {
        if (!isProfilePage()) return;

        if (!isAuthorized()) {
            window.location.href = "login.html";
            return;
        }

        const email = getCurrentUserKey();
        const user = getUserByKey(email);
        if (!user) return;

        const fields = qsa(".profile-fields .field");
        const nameInput = fields[0] || null;
        const emailInput = fields[1] || null;
        const phoneInput = fields[2] || null;

        if (emailInput) {
            emailInput.value = user.email || "";
            emailInput.type = "email";
            emailInput.classList.add("field--readonly");
            emailInput.readOnly = true;
        }

        const PHONE_REGEX = /^\+7\s\(\d{3}\)\s\d{3}-\d{2}-\d{2}$/;

        /* ---------- NAME (edit like phone, but always available) ---------- */

        const nameRow = nameInput?.closest(".profile-row") || null;
        let nameBtn = nameRow ? qs(".field-btn", nameRow) : null;

        if (nameRow && !nameBtn) {
            nameBtn = document.createElement("button");
            nameBtn.type = "button";
            nameBtn.className = "btn field-btn";
            nameRow.appendChild(nameBtn);
        }

        function setNameViewMode() {
            if (!nameInput || !nameBtn) return;

            nameInput.type = "text";
            nameInput.classList.add("field--readonly");
            nameInput.readOnly = true;

            const hasName = Boolean(user.name && user.name.trim());
            nameInput.value = hasName ? user.name : "не указан";

            nameBtn.style.display = "inline-block";
            nameBtn.textContent = hasName ? "Изменить" : "Добавить";
            nameBtn.dataset.mode = "edit";
        }

        function setNameEditMode() {
            if (!nameInput || !nameBtn) return;

            nameInput.type = "text";
            nameInput.classList.remove("field--readonly");
            nameInput.readOnly = false;

            nameInput.value = user.name || "";
            nameInput.focus();

            nameBtn.textContent = "Сохранить";
            nameBtn.dataset.mode = "save";
        }

        if (nameBtn && nameInput) {
            nameBtn.addEventListener("click", () => {
                const mode = nameBtn.dataset.mode || "edit";

                if (mode === "edit") {
                    setNameEditMode();
                    return;
                }

                const raw = (nameInput.value || "").trim();

                if (!raw) {
                    user.name = "";
                    saveUserByKey(email, user);
                    setNameViewMode();
                    return;
                }

                user.name = raw;
                saveUserByKey(email, user);
                setNameViewMode();
            });
        }

        setNameViewMode();

        /* ---------- PHONE (existing logic) ---------- */

        const phoneRow = phoneInput?.closest(".profile-row") || null;
        const phoneBtn = phoneRow ? qs(".field-btn", phoneRow) : null;

        function setPhoneViewMode() {
            if (!phoneInput) return;

            phoneInput.type = "text";
            phoneInput.classList.add("field--readonly");
            phoneInput.readOnly = true;

            const hasPhone = Boolean(user.phone && user.phone.trim());
            phoneInput.value = hasPhone ? user.phone : "не указан";

            if (phoneBtn) {
                phoneBtn.style.display = hasPhone ? "none" : "inline-block";
                phoneBtn.textContent = "Добавить";
                phoneBtn.dataset.mode = "add";
            }
        }

        function setPhoneEditMode() {
            if (!phoneInput) return;

            phoneInput.type = "tel";
            phoneInput.classList.remove("field--readonly");
            phoneInput.readOnly = false;

            phoneInput.value = user.phone || "+7 ";
            phoneInput.focus();

            if (phoneBtn) {
                phoneBtn.style.display = "inline-block";
                phoneBtn.textContent = "Сохранить";
                phoneBtn.dataset.mode = "save";
            }

            applyPhoneMaskToInput(phoneInput);
        }

        if (phoneBtn && phoneInput) {
            phoneBtn.addEventListener("click", () => {
                const mode = phoneBtn.dataset.mode || "add";

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
                saveUserByKey(email, user);
                setPhoneViewMode();
            });
        }

        setPhoneViewMode();

        /* ---------- logout ---------- */

        qs(".profile-logout")?.addEventListener("click", logoutUser);

        /* ---------- change password ---------- */

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
            saveUserByKey(email, user);

            passInputs.forEach(i => i.value = "");
            alert("Пароль успешно изменён");
        });

        /* ---------- orders ---------- */

        const ordersHost = qs(".orders");
        const orders = Array.isArray(user.orders) ? user.orders : [];
        renderOrders(ordersHost, orders);
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
        migrateLegacyUserIfNeeded();

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
