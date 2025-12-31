import { renderCatalog } from './catalog.js';
import { renderCart } from './cart.js';
import { handleAuthorization } from './auth.js';
import { initNavigation } from './navigation.js';
import './profile.js';

document.addEventListener("DOMContentLoaded", async () => {
    handleAuthorization();

    if (document.body.classList.contains('catalog-page')) {
        await renderCatalog();
    }

    if (document.body.classList.contains('cart-page')) {
        renderCart();
    }

    initNavigation();
});
