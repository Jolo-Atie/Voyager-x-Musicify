/* ============================================================
   Location Search
   Geocoding-backed destination search with suggestions.
   Also kicks off the initial dashboard load on page ready.
   Relies on loadWeather() from script.js.
   Exposes: selectPlace(place)
   ============================================================ */

const GEOCODE_URL = "https://geocoding-api.open-meteo.com/v1/search";

const searchForm = document.getElementById("searchForm");
const searchInput = document.getElementById("searchInput");
const suggestionsEl = document.getElementById("suggestions");

let searchTimer = null;
let activeSuggestions = [];

searchInput.addEventListener("input", () => {
  clearTimeout(searchTimer);
  const query = searchInput.value.trim();
  if (query.length < 2) {
    hideSuggestions();
    return;
  }
  searchTimer = setTimeout(() => runGeocode(query), 300);
});

searchForm.addEventListener("submit", (e) => {
  e.preventDefault();
  if (activeSuggestions.length > 0) {
    selectPlace(activeSuggestions[0]);
  }
});

document.addEventListener("click", (e) => {
  if (!searchForm.contains(e.target)) hideSuggestions();
});

async function runGeocode(query) {
  try {
    const url = `${GEOCODE_URL}?name=${encodeURIComponent(query)}&count=6&language=en&format=json`;
    const res = await fetch(url);
    const data = await res.json();
    activeSuggestions = data.results || [];
    renderSuggestions(activeSuggestions);
  } catch (err) {
    console.error("Geocoding error:", err);
    hideSuggestions();
  }
}

function renderSuggestions(results) {
  if (!results.length) {
    hideSuggestions();
    return;
  }
  suggestionsEl.innerHTML = "";
  results.forEach((place) => {
    const li = document.createElement("li");
    const region = [place.admin1, place.country].filter(Boolean).join(", ");
    li.innerHTML = `${place.name}<small>${region}</small>`;
    li.addEventListener("click", () => selectPlace(place));
    suggestionsEl.appendChild(li);
  });
  suggestionsEl.hidden = false;
}

function hideSuggestions() {
  suggestionsEl.hidden = true;
  suggestionsEl.innerHTML = "";
}
function selectPlace(place) {

  searchInput.value =
    `${place.name}${place.admin1 ? ", " + place.admin1 : ""}`;

  hideSuggestions();

  currentPlace = place;

  loadWeather(place);

  loadStorms({
    city: place.name,
    country: place.country,
    latitude: place.latitude,
    longitude: place.longitude
  });

  loadFerryRoutes(place);
}


window.addEventListener("DOMContentLoaded", () => {
  selectPlace({
    name: "Manila",
    admin1: "Metro Manila",
    country: "Philippines",
    latitude: 14.5995,
    longitude: 120.9842,
  });
});
