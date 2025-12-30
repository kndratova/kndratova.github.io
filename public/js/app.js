import { initNavigation } from './navigation.js';
import { renderCatalog } from './catalog.js';
import { renderCart } from './cart.js';

document.addEventListener("DOMContentLoaded", async () => {

    if (document.body.classList.contains('catalog-page')) {
        await renderCatalog();
    }

    if (document.body.classList.contains('cart-page')) {
        renderCart();
    }


    initNavigation();

    const logoutButton = document.querySelector(".profile-logout");

    if (logoutButton) {
        logoutButton.addEventListener("click", () => {
            logoutUser();
            window.location.href = "/login";
        });
    }
});


const logoutUser = () => {
    localStorage.removeItem("melagrano_auth");
    localStorage.removeItem("melagrano_auth_user");
};
