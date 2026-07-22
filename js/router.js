import { setCurrentPage } from "./state.js";

import { initHomePage } from "./pages/home.js";
import { initForecastPage } from "./pages/forecast.js";
import { initFerryPage } from "./pages/ferry.js";
import { initAdvisoryPage } from "./pages/advisory.js";
import { initAboutPage } from "./pages/about.js";

const VALID_PAGES = [
    "home",
    "forecast",
    "ferry",
    "advisory",
    "about"
];

const container = document.getElementById("pageContent");
const pages = document.getElementById("pages");

export async function loadPage(page) {

    if (!VALID_PAGES.includes(page)) {
        page = "home";
    }

    try {

        pages.hidden = true;

        const response = await fetch(`pages/${page}.html`);

        if (!response.ok) {
            throw new Error("Unable to load page.");
        }

        container.innerHTML = await response.text();

        pages.hidden = false;

        history.replaceState({}, "", `#${page}`);

        setCurrentPage(page);

        highlightNavigation(page);

        initializePage(page);
        window.scrollTo({ top: 0, behavior: "smooth" });

    }

    catch (error) {

        console.error(error);
        pages.hidden = false;
        container.innerHTML = `<section class="empty"><div class="empty__content"><p class="empty__title">Unable to load this page</p><p class="empty__body">Please refresh and try again.</p></div></section>`;

    }

}

function initializePage(page) {

    switch (page) {

        case "home":
            initHomePage();
            break;

        case "forecast":
            initForecastPage();
            break;

        case "ferry":
            initFerryPage();
            break;

        case "advisory":
            initAdvisoryPage();
            break;

        case "about":
            initAboutPage();
            break;

    }

}

export function getInitialPage() {

    const hash = window.location.hash.replace("#", "");

    return VALID_PAGES.includes(hash)
        ? hash
        : "home";

}

export function highlightNavigation(page) {

    document.querySelectorAll(".navlink").forEach(button => {

        const active = button.dataset.page === page;

        button.classList.toggle("active", active);

        if (active) {
            button.setAttribute("aria-current", "page");
        } else {
            button.removeAttribute("aria-current");
        }

    });

}
