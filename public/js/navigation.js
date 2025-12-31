import { isAuthorized } from './auth.js';

export const initNavigation = () => {
    document.addEventListener("click", (e) => {
        const link = e.target.closest(".nav__link");

        if (!link) return;

        const page = link.dataset.page;
        if (!page) return;

        e.preventDefault();

        if (page === "profile") {
            if (isAuthorized()) {
                window.location.href = "/profile";
            } else {
                window.location.href = "/login";
            }
        }
    });
};
