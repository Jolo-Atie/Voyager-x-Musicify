import { loadPage, getInitialPage } from "./router.js";
import { loadDefaultLocation, selectLocation } from "./api.js";
import { initSearch } from "./components/search.js";
import { initDrawer } from "./components/drawer.js";

document.addEventListener("DOMContentLoaded", async () => {
  initDrawer();
  document.addEventListener("click", async event => {
    const link = event.target.closest(".navlink");
    if (link) await loadPage(link.dataset.page);
  });
  initSearch(async place => { await selectLocation(place); await loadPage("home"); });
  const initialPage = getInitialPage();
  await loadPage(initialPage);
  document.getElementById("emptyState").hidden = true;
  document.getElementById("loadingState").hidden = false;
  try {
    await loadDefaultLocation();
    await loadPage(initialPage);
  } catch (error) {
    console.error("Unable to load default weather:", error);
    document.getElementById("emptyState").hidden = false;
    document.querySelector(".empty__title").textContent = "Weather is unavailable";
    document.querySelector(".empty__body").textContent = "Please search for a city and try again in a moment.";
  } finally {
    document.getElementById("loadingState").hidden = true;
  }
});
