export function getCart() {
    return JSON.parse(localStorage.getItem("cart") || "[]");
}

export function setCart(cart) {
    localStorage.setItem("cart", JSON.stringify(cart));
}

function setCartTitle(count) {
    const title = document.querySelector(".cart-title");
    if (!title) return;
    title.textContent = `Товары в корзине (${count})`;
}

export const renderCart = () => {
    const cartList = document.querySelector('.cart-list');
    const totalSumElement = document.querySelector('.cart-summary__total span');
    const cart = getCart();

    if (!cartList) return;
    setCartTitle(cart.length);

    if (cart.length === 0) {
        cartList.innerHTML = `
            <div class="cart-empty">
                <p class="cart-empty__title">Ваша корзина пуста</p>
                <a class="cart-empty__link" href="/">Перейти в каталог →</a>
            </div>
        `;
        if (totalSumElement) totalSumElement.textContent = "0 ₽";
        return;
    }

    cartList.innerHTML = cart.map((item) => {
        return `
            <article class="cart-item" data-key="${item.key}">
                <img class="cart-item__img" src="/images/products/${item.img}" alt="${item.title}">
                <p class="cart-item__title">${item.title}</p>
                <span class="cart-item__price">${Math.floor(item.price).toLocaleString('ru-RU')} ₽</span>
                <button class="cart-item__remove" type="button">Удалить</button>
            </article>
        `;
    }).join('');

    const totalSum = cart.reduce((acc, item) => acc + (Number(item.price) || 0), 0);
    if (totalSumElement) totalSumElement.textContent = `${Math.floor(totalSum).toLocaleString('ru-RU')} ₽`;

    cartList.querySelectorAll('.cart-item__remove').forEach((btn) => {
        btn.addEventListener('click', (e) => {
            const itemEl = e.target.closest('.cart-item');
            if (!itemEl) return;

            const key = itemEl.dataset.key;
            const updatedCart = getCart().filter((x) => x.key !== key);
            setCart(updatedCart);

            renderCart();
        });
    });
};