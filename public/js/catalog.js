import { getCart, setCart } from './cart.js';

export const renderCatalog = async () => {
    const grid = document.querySelector("#catalogGrid");
    if (!grid) return;

    grid.innerHTML = "";

    try {
        const res = await fetch('/api/products');
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();

        console.log(data);
        const keysInCart = new Set(getCart().map((i) => i.key));
        const fragment = document.createDocumentFragment();

        data.forEach((product) => {
            const key = `api_${product.id}`;
            const inCart = keysInCart.has(key);
            const priceRub = product.price;

            const card = document.createElement("article");
            card.className = "card";

            card.innerHTML = `
                <img class="card__img" src="/images/products/${product.image}" alt="${product.title}">
                <p class="card__title">${product.title}</p>
                <div class="card__bottom">
                    <span class="price" style="font-weight: bold;">${Math.floor(priceRub).toLocaleString('ru-RU')} ₽</span>
                    <button class="btn ${inCart ? "" : "btn--primary"}"
                            type="button"
                            data-key="${key}">
                        ${inCart ? "В корзине →" : "В корзину"}
                    </button>
                </div>
            `;

            const btn = card.querySelector(".btn");
            btn.dataset.state = inCart ? "in-cart" : "add";

            btn.addEventListener("click", () => {
                if (btn.dataset.state === "in-cart") {
                    window.location.href = "/cart";
                    return;
                }

                const cart = getCart();
                if (!cart.some((x) => x.key === key)) {
                    cart.push({
                        key,
                        title: product.title,
                        price: priceRub,
                        img: product.image,
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
};

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