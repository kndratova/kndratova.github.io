export const initNavigation = () => {
    document.addEventListener("click", (e) => {
        const link = e.target.closest(".nav__link");
        if (!link) return;

        const page = link.dataset.page;
        if (!page) return;

        e.preventDefault();

        if (page === "profile" && !isAuthorized()) {
            window.location.href = "/login";
            return;
        }

        if (page === "cart" && !isAuthorized()) {
            localStorage.setItem("melagrano_return_to", "/cart");
            window.location.href = "/login";
            return;
        }

        window.location.href = page + ".html";
    });
};
