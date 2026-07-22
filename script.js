
const GEOCODE_URL = "https://geocoding-api.open-meteo.com/v1/search";
const GEOCODE_REVERSE = "https://nominatim.openstreetmap.org/reverse";
const FORECAST_URL = "https://my.meteoblue.com/packages/basic-1h_basic-day";
const METEOBLUE_API_KEY = "ZFgqArEKt497xQiY";
const FERRY_API_URL = "./api/ferry-routes.json";
const STORMS_API_URL = "./api/storms.php";


const PICTOCODES = {
  1: { label: "Clear sky", icon: "☀️", category: "clear" },
  2: { label: "Slightly cloudy", icon: "🌤️", category: "clear" },
  3: { label: "Partly cloudy", icon: "⛅", category: "cloudy" },
  4: { label: "Partly cloudy with thunder", icon: "⛈️", category: "storm" },
  5: { label: "Mixed with showers", icon: "🌦️", category: "rain" },
  6: { label: "Overcast with rain", icon: "🌧️", category: "rain" },
  7: { label: "Mixed with snow", icon: "🌨️", category: "snow" },
  8: { label: "Overcast with snow", icon: "❄️", category: "snow" },
  9: { label: "Overcast with rain and snow", icon: "🌨️", category: "snow" },
  10: { label: "Overcast", icon: "☁️", category: "cloudy" },
  11: { label: "Fog", icon: "🌫️", category: "fog" },
  13: { label: "Overcast with heavy rain", icon: "🌧️", category: "rain" },
  14: { label: "Overcast with heavy snow", icon: "❄️", category: "snow" },
  15: { label: "Overcast with thunderstorm", icon: "⛈️", category: "storm" },
  16: { label: "Overcast with light rain", icon: "🌦️", category: "rain" },
  17: { label: "Overcast with light snow", icon: "🌨️", category: "snow" },
};

function pictoInfo(code) {
  return PICTOCODES[code] || { label: "Unknown", icon: "🌡️", category: "clear" };
}

const searchForm = document.getElementById("searchForm");
const searchInput = document.getElementById("searchInput");
const suggestionsEl = document.getElementById("suggestions");

const pagesEl = document.getElementById("pages");
const emptyState = document.getElementById("emptyState");
const loadingState = document.getElementById("loadingState");

const locationName = document.getElementById("locationName");
const updatedAt = document.getElementById("updatedAt");
const conditionIcon = document.getElementById("conditionIcon");
const tempValue = document.getElementById("tempValue");
const conditionText = document.getElementById("conditionText");
const advisory = document.getElementById("advisory");

const humidityValue = document.getElementById("humidityValue");
const humidityBar = document.getElementById("humidityBar");
const windValue = document.getElementById("windValue");
const windNeedle = document.getElementById("windNeedle");

const forecastPreview = document.getElementById("forecastPreview");
const forecastRow = document.getElementById("forecastRow");
const forecastLocationLine = document.getElementById("forecastLocationLine");
const hourlyChart = document.getElementById("hourlyChart");

const advisoryFullBadge = document.getElementById("advisoryFullBadge");
const advisoryFullLevel = document.getElementById("advisoryFullLevel");
const advisoryFullText = document.getElementById("advisoryFullText");
const advisoryFactors = document.getElementById("advisoryFactors");

const alertBanner = document.getElementById("alertBanner");
const alertText = document.getElementById("alertText");
const footerCoords = document.getElementById("footerCoords");
const locateBtn = document.getElementById("locateBtn");

// Ferry Routes
const ferryRoutesContainer = document.getElementById("ferryRoutes");
const ferryRecommendation = document.getElementById("ferryRecommendation");
const ferryLoading = document.getElementById("ferryLoading");
const ferryError = document.getElementById("ferryError");
const refreshFerryBtn = document.getElementById("refreshFerryBtn");

let searchTimer = null;
let activeSuggestions = [];
let activeSuggestionIndex = -1;
let currentPlace = null;

const burgerBtn = document.getElementById("burgerBtn");
const drawer = document.getElementById("drawer");
const drawerOverlay = document.getElementById("drawerOverlay");
const drawerClose = document.getElementById("drawerClose");
const navlinks = document.querySelectorAll(".navlink");
const pages = document.querySelectorAll(".page");
const pageLinkTriggers = document.querySelectorAll("[data-page-link]");

function openDrawer() {
  document.body.classList.add("drawer-open");
  burgerBtn.setAttribute("aria-expanded", "true");
}
function closeDrawer() {
  document.body.classList.remove("drawer-open");
  burgerBtn.setAttribute("aria-expanded", "false");
}

burgerBtn.addEventListener("click", openDrawer);
drawerClose.addEventListener("click", closeDrawer);
drawerOverlay.addEventListener("click", closeDrawer);

function goToPage(pageId) {
  pages.forEach((p) => { p.hidden = p.dataset.page !== pageId; });
  navlinks.forEach((link) => {
    if (link.dataset.page === pageId) link.setAttribute("aria-current", "page");
    else link.removeAttribute("aria-current");
  });
  closeDrawer();
  window.scrollTo({ top: 0, behavior: "smooth" });
  history.replaceState(null, "", `#${pageId}`);
}

navlinks.forEach((link) => {
  link.addEventListener("click", () => goToPage(link.dataset.page));
});
pageLinkTriggers.forEach((el) => {
  el.addEventListener("click", () => goToPage(el.dataset.pageLink));
});

function initialPage() {
  const hash = window.location.hash.replace("#", "");
  const valid = ["home", "forecast", "advisory", "about"];
  return valid.includes(hash) ? hash : "home";
}

searchInput.addEventListener("input", () => {
  clearTimeout(searchTimer);
  const query = searchInput.value.trim();
  if (query.length < 2) {
    hideSuggestions();
    return;
  }
  searchTimer = setTimeout(() => runGeocode(query), 300);
});

searchInput.addEventListener("keydown", (e) => {
  if (suggestionsEl.hidden || !activeSuggestions.length) return;

  switch (e.key) {
    case "ArrowDown":
      e.preventDefault();
      setActiveSuggestion(activeSuggestionIndex < 0 ? 0 : Math.min(activeSuggestionIndex + 1, activeSuggestions.length - 1));
      break;
    case "ArrowUp":
      e.preventDefault();
      setActiveSuggestion(activeSuggestionIndex <= 0 ? -1 : activeSuggestionIndex - 1);
      break;
    case "Enter":
      if (activeSuggestionIndex >= 0) {
        e.preventDefault();
        selectPlace(activeSuggestions[activeSuggestionIndex]);
      }
      break;
    case "Escape":
      e.preventDefault();
      hideSuggestions();
      break;
  }
});

searchForm.addEventListener("submit", (e) => {
  e.preventDefault();
  if (activeSuggestionIndex >= 0 && activeSuggestions[activeSuggestionIndex]) {
    selectPlace(activeSuggestions[activeSuggestionIndex]);
  } else if (activeSuggestions.length > 0) {
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
async function loadStorms(location)
{
  try {
    console.log(STORMS_API_URL);
console.log(`${STORMS_API_URL}?country=${location.country}`);


    const response = await fetch(
      `${STORMS_API_URL}?country=${encodeURIComponent(location.country)}`
    );

    if (!response.ok) {
      throw new Error("Storm API failed");
    }

    const storms = await response.json();

    console.log(
      "Storm search:",
      location.country,
      storms
    );

    const stormInfo =
      document.getElementById("stormInfo");


    if (!stormInfo) return;


    if (!Array.isArray(storms) || storms.length === 0) {

      stormInfo.innerHTML = `
        <p style="margin-bottom: 20px">
        🟢 No active tropical storms near 
        ${location.city}, ${location.country}
        </p>
      `;

      return;
    }


   stormInfo.innerHTML = storms.map(storm => `
  <div class="storm-card">

    <h3>
      🌀 ${storm.name ?? "Unnamed Storm"}
    </h3>

    <p>
      <strong>Government ID:</strong>
      ${storm.govId ?? "N/A"}
    </p>

    <p>
      <strong>Basin:</strong>
      ${storm.basinId ?? "N/A"}
    </p>

    <p>
      <strong>Status:</strong>

      <span class="${storm.isActive ? "storm-active" : "storm-inactive"}">
        ${storm.isActive ? "🟢 Active" : "⚪ Inactive"}
      </span>

    </p>

  </div>
`).join("");



  }
  catch(error){

    console.error(error);

    document.getElementById("stormInfo").innerHTML =
    `
    <p>
    Unable to load storm information.
    </p>
    `;

  }
}



function renderSuggestions(results) {
  if (!results.length) {
    hideSuggestions();
    return;
  }
  suggestionsEl.innerHTML = "";
  activeSuggestionIndex = -1;

  results.forEach((place, index) => {
    const li = document.createElement("li");
    const button = document.createElement("button");
    const region = [place.admin1, place.country].filter(Boolean).join(", ");

    button.type = "button";
    button.className = "search__suggestion-btn";
    button.setAttribute("role", "option");
    button.setAttribute("aria-selected", "false");
    button.setAttribute("id", `suggestion-${index}`);

    const nameEl = document.createElement("span");
    nameEl.className = "search__suggestion-name";
    nameEl.textContent = place.name;

    const regionEl = document.createElement("small");
    regionEl.textContent = region;

    button.appendChild(nameEl);
    if (region) button.appendChild(regionEl);
    button.addEventListener("click", () => selectPlace(place));

    li.appendChild(button);
    suggestionsEl.appendChild(li);
  });

  suggestionsEl.hidden = false;
  searchInput.setAttribute("aria-expanded", "true");
}

function setActiveSuggestion(index) {
  activeSuggestionIndex = index;
  const buttons = suggestionsEl.querySelectorAll(".search__suggestion-btn");

  buttons.forEach((button, buttonIndex) => {
    const isActive = buttonIndex === index;
    button.classList.toggle("is-active", isActive);
    button.setAttribute("aria-selected", isActive ? "true" : "false");
    searchInput.setAttribute("aria-activedescendant", isActive ? button.id : "");
  });

  if (index >= 0) {
    buttons[index].scrollIntoView({ block: "nearest" });
  }
}

function hideSuggestions() {
  suggestionsEl.hidden = true;
  suggestionsEl.innerHTML = "";
  activeSuggestionIndex = -1;
  searchInput.setAttribute("aria-expanded", "false");
  searchInput.removeAttribute("aria-activedescendant");
}
function selectPlace(place) {
  searchInput.value =
    `${place.name}${place.admin1 ? ", " + place.admin1 : ""}`;

  hideSuggestions();

  // remember the selected place for other features (ferry routes, refresh)
  currentPlace = place;

  loadWeather(place);

  loadStorms({
    city: place.name,
    country: place.country,
    latitude: place.latitude,
    longitude: place.longitude
  });

  // load ferry routes relevant to the recently selected place
  loadFerryRoutes(place);
}


async function loadWeather(place) {
  emptyState.hidden = true;
  pagesEl.hidden = true;
  if (loadingState) loadingState.hidden = false;
  document.body.dataset.loaded = "false";
  alertBanner.hidden = true;

  try {
    const params = new URLSearchParams({
      lat: place.latitude,
      lon: place.longitude,
      apikey: METEOBLUE_API_KEY,
      format: "json",
      temperature: "C",
      windspeed: "kmh",
      winddirection: "degree",
      precipitationamount: "mm",
      timeformat: "iso8601",
    });
    const res = await fetch(`${FORECAST_URL}?${params.toString()}`);
    if (!res.ok) throw new Error(`meteoblue request failed (${res.status})`);
    const data = await res.json();
    if (!data.data_1h || !data.data_day) throw new Error("Unexpected meteoblue response shape");
    renderDashboard(place, data);
  } catch (err) {
    console.error("Weather fetch error:", err);
    if (loadingState) loadingState.hidden = true;
    document.body.dataset.loaded = "false";
    emptyState.hidden = false;
    emptyState.querySelector(".empty__title").textContent = "Couldn't load weather";
    emptyState.querySelector(".empty__body").textContent =
      "Couldn't reach meteoblue. This is often a CORS/referrer restriction — check that your API key's " +
      "referrer allow list includes this site (or use a permissive setting while testing locally), and that " +
      "the key hasn't hit its daily call limit.";
  }
}

function renderDashboard(place, data) {
  if (loadingState) loadingState.hidden = true;
  pagesEl.hidden = false;
  document.body.dataset.loaded = "true";
  goToPage(initialPage());

  const hourly = data.data_1h;
  const daily = data.data_day;
  const meta = data.metadata;

  const nowIdx = 0;
  const info = pictoInfo(daily.pictocode[0]);

  const nowUtcMs = Date.now();
  const localMs = nowUtcMs + meta.utc_timeoffset * 3600 * 1000;
  const localHour = new Date(localMs).getUTCHours();
  const isDay = localHour >= 6 && localHour < 18;
  document.body.dataset.daytime = isDay ? "day" : "night";
  document.body.dataset.condition = info.category;

  const region = [place.admin1, place.country].filter(Boolean).join(", ");
  const fullName = region ? `${place.name}, ${region}` : place.name;
  locationName.textContent = fullName;
  updatedAt.textContent = `Updated ${new Date(hourly.time[nowIdx]).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
  footerCoords.textContent = `${place.latitude.toFixed(2)}°, ${place.longitude.toFixed(2)}°`;
  forecastLocationLine.textContent = `Showing the 7-day outlook for ${fullName}.`;

  conditionIcon.textContent = info.icon;
  tempValue.textContent = Math.round(hourly.temperature[nowIdx]);
  conditionText.textContent = info.label;

  const humidity = Math.round(hourly.relativehumidity[nowIdx]);
  humidityValue.textContent = humidity;
  humidityBar.style.width = `${humidity}%`;

  const wind = Math.round(hourly.windspeed[nowIdx]);
  windValue.textContent = wind;
  windNeedle.style.transform = `translate(-50%, -100%) rotate(${hourly.winddirection[nowIdx]}deg)`;

  const maxWindToday = daily.windspeed_max[0];
  const rainChance = daily.precipitation_probability[0];
  setAdvisory(info, wind, maxWindToday, rainChance);
  setAlert(info.category, maxWindToday, rainChance);

  renderForecast(daily);
  renderHourlyChart(hourly);
}

function setAdvisory(info, currentWind, maxWindToday, rainChance) {
  const category = info.category;
  let level = "safe";
  let text = "Conditions look clear — safe to travel.";

  const severe = category === "storm" || maxWindToday >= 60 || rainChance >= 80;
  const caution = category === "rain" || category === "snow" || category === "fog" ||
    maxWindToday >= 35 || rainChance >= 45 || currentWind >= 35;

  if (severe) {
    level = "danger";
    text = "Severe weather expected — travel not recommended.";
  } else if (caution) {
    level = "caution";
    text = "Changeable conditions — travel with caution.";
  }

  const dotIcon = level === "danger" ? "🔴" : level === "caution" ? "🟡" : "🟢";
  const levelLabel = level === "danger" ? "Travel not recommended" : level === "caution" ? "Travel with caution" : "Safe to travel";

  // Compact badge on Home
  advisory.dataset.level = level;
  advisory.querySelector(".hero__advisory-text").textContent = `${dotIcon} ${text}`;

  // Full detail on the Advisory page
  advisoryFullBadge.textContent = dotIcon;
  advisoryFullLevel.textContent = levelLabel;
  advisoryFullText.textContent = `${text} Based on current conditions in the area: ${info.label.toLowerCase()}.`;

  const factors = [
    `Condition: ${info.label}`,
    `Wind now: ${currentWind} km/h`,
    `Wind today (peak): ${Math.round(maxWindToday)} km/h`,
    `Rain chance today: ${Math.round(rainChance)}%`,
  ];
  advisoryFactors.innerHTML = factors.map((f) => `<li>${f}</li>`).join("");
}

function setAlert(category, maxWindToday, rainChance) {
  let message = null;

  if (category === "storm") {
    message = "Thunderstorm activity detected in the area. Seek shelter and avoid unnecessary travel.";
  } else if (maxWindToday >= 60) {
    message = `Strong winds expected today (up to ${Math.round(maxWindToday)} km/h). Secure loose objects outdoors.`;
  } else if (rainChance >= 80) {
    message = `Heavy rain likely today (${Math.round(rainChance)}% chance). Watch for localized flooding.`;
  } else if (category === "snow" && maxWindToday >= 40) {
    message = "Blowing snow expected — reduced visibility on the road.";
  }

  if (message) {
    alertText.textContent = message;
    alertBanner.hidden = false;
  } else {
    alertBanner.hidden = true;
  }
}

function forecastCardHTML(dateStr, i, info, hi, lo) {
  const dayFormatter = new Intl.DateTimeFormat([], { weekday: "short" });
  const date = new Date(dateStr);
  return `
    <div class="forecast__card">
      <p class="forecast__day">${i === 0 ? "Today" : dayFormatter.format(date)}</p>
      <div class="forecast__icon">${info.icon}</div>
      <span class="forecast__hi">${Math.round(hi)}°</span>
      <span class="forecast__lo">${Math.round(lo)}°</span>
    </div>
  `;
}

function renderForecast(daily) {
  forecastRow.innerHTML = daily.time
    .map((dateStr, i) => forecastCardHTML(dateStr, i, pictoInfo(daily.pictocode[i]), daily.temperature_max[i], daily.temperature_min[i]))
    .join("");

  forecastPreview.innerHTML = daily.time
    .slice(0, 3)
    .map((dateStr, i) => forecastCardHTML(dateStr, i, pictoInfo(daily.pictocode[i]), daily.temperature_max[i], daily.temperature_min[i]))
    .join("");
}

function renderHourlyChart(hourly) {
  if (!hourly || !hourly.time) return;

  const times = hourly.time.slice(0, 24);
  const temps = hourly.temperature.slice(0, 24);
  if (!times.length) return;

  const width = 720;
  const height = 140;
  const padX = 12;
  const padY = 18;

  const min = Math.min(...temps);
  const max = Math.max(...temps);
  const range = max - min || 1;

  const stepX = (width - padX * 2) / (temps.length - 1 || 1);
  const points = temps.map((t, i) => {
    const x = padX + i * stepX;
    const y = padY + (1 - (t - min) / range) * (height - padY * 2);
    return [x, y];
  });

  const linePath = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(" ");
  const areaPath = `${linePath} L ${points[points.length - 1][0].toFixed(1)} ${height - padY} L ${points[0][0].toFixed(1)} ${height - padY} Z`;

  const labelFormatter = new Intl.DateTimeFormat([], { hour: "2-digit" });
  const labels = times
    .map((t, i) => ({ i, text: labelFormatter.format(new Date(t)) }))
    .filter((l) => l.i % 3 === 0);

  hourlyChart.innerHTML = `
    <svg viewBox="0 0 ${width} ${height + 20}" preserveAspectRatio="none" class="hourly__svg">
      <defs>
        <linearGradient id="hourlyFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="var(--teal)" stop-opacity="0.35" />
          <stop offset="100%" stop-color="var(--teal)" stop-opacity="0" />
        </linearGradient>
      </defs>
      <path d="${areaPath}" fill="url(#hourlyFill)" stroke="none"></path>
      <path d="${linePath}" fill="none" stroke="var(--teal)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path>
      ${points.map((p) => `<circle cx="${p[0].toFixed(1)}" cy="${p[1].toFixed(1)}" r="2.5" fill="var(--teal)"></circle>`).join("")}
      ${labels.map((l) => `<text x="${(padX + l.i * stepX).toFixed(1)}" y="${height + 14}" class="hourly__label" text-anchor="middle">${l.text}</text>`).join("")}
    </svg>
  `;
}

// --- Geolocation support: reverse geocode and select place ---
/* ==========================
   Geolocation + Reverse Geocoding
========================== */

function showLocationError(message) {
  alertText.textContent = message;
  alertBanner.hidden = false;

  setTimeout(() => {
    alertBanner.hidden = true;
  }, 5000);
}

async function handleGeolocationSuccess(position) {
  const { latitude, longitude } = position.coords;

  try {
    const url =
      `${GEOCODE_REVERSE}?format=jsonv2&lat=${latitude}&lon=${longitude}`;

    const response = await fetch(url, {
      headers: {
        Accept: "application/json"
      }
    });

    if (!response.ok) {
      throw new Error(`Reverse geocoding failed (${response.status})`);
    }

    const data = await response.json();

    const address = data.address || {};

    const place = {
      name:
        address.city ||
        address.town ||
        address.village ||
        address.municipality ||
        address.county ||
        "Current location",

      admin1:
        address.state ||
        address.region ||
        "",

      country:
        address.country ||
        "",

      latitude,
      longitude
    };

    console.log("Detected location:", place);

    selectPlace(place);

  } catch (error) {

    console.error("Reverse geocoding failed:", error);

    showLocationError(
      "Could not determine a place name for your location."
    );

    selectPlace({
      name: "Current location",
      admin1: "",
      country: "",
      latitude,
      longitude
    });
  }
}

function handleGeolocationError(error) {

  console.error(error);

  switch (error.code) {

    case error.PERMISSION_DENIED:
      showLocationError("Location permission denied.");
      break;

    case error.POSITION_UNAVAILABLE:
      showLocationError("Location unavailable.");
      break;

    case error.TIMEOUT:
      showLocationError("Location request timed out.");
      break;

    default:
      showLocationError("Unable to retrieve your location.");
  }
}

function getCurrentLocation() {

  if (!navigator.geolocation) {
    showLocationError("Geolocation is not supported by this browser.");
    return;
  }

  navigator.geolocation.getCurrentPosition(
    handleGeolocationSuccess,
    handleGeolocationError,
    {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0
    }
  );
}

if (locateBtn) {
  locateBtn.addEventListener("click", getCurrentLocation);
}

/* ==========================
   Ferry Routes
========================== */

// Comprehensive port database with geographic data
const MAJOR_PORTS = [
  { name: "Manila", region: "Metro Manila", country: "Philippines", lat: 14.5995, lon: 120.9842 },
  { name: "Batangas", region: "CALABARZON", country: "Philippines", lat: 13.7563, lon: 121.0175 },
  { name: "Calapan", region: "Oriental Mindoro", country: "Philippines", lat: 13.1545, lon: 121.1869 },
  { name: "Coron", region: "Palawan", country: "Philippines", lat: 12.1891, lon: 120.2055 },
  { name: "Iloilo", region: "Western Visayas", country: "Philippines", lat: 10.6898, lon: 122.5626 },
  { name: "Cebu", region: "Central Visayas", country: "Philippines", lat: 10.3157, lon: 123.8854 },
  { name: "Davao", region: "Mindanao", country: "Philippines", lat: 7.0731, lon: 125.6121 },
  { name: "General Santos", region: "South Cotabato", country: "Philippines", lat: 6.1143, lon: 125.1608 },
  { name: "Zamboanga", region: "Mindanao", country: "Philippines", lat: 6.9271, lon: 122.0722 },
  { name: "Cagayan de Oro", region: "Northern Mindanao", country: "Philippines", lat: 8.4917, lon: 124.6331 },
];

const FERRY_OPERATORS = [
  "Montenegro",
  "Starlite Ferries",
  "2GO Travel",
  "Cokaliong Shipping",
  "Oceanjet",
  "Superferry",
  "Trans-Asia Shipping",
  "Weesam Express"
];

// Calculate distance between two coordinates (Haversine formula)
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Generate ferry routes based on location coordinates
function generateFerryRoutes(place) {
  if (!place || !place.latitude || !place.longitude) return [];

  const nearbyPorts = MAJOR_PORTS
    .map((port) => ({
      ...port,
      distance: calculateDistance(place.latitude, place.longitude, port.lat, port.lon),
    }))
    .sort((a, b) => a.distance - b.distance)
    .slice(0, 6);

  const routes = [];
  const baseHour = 6; // Start times begin at 6 AM
  const operators = FERRY_OPERATORS;
  const statuses = ["On Schedule", "On Schedule", "On Schedule", "Delayed", "Cancelled"];

  nearbyPorts.forEach((port, index) => {
    if (port.distance > 250) return; // Only include ports within 250km
    if (port.name === place.name) return; // Skip same location

    // Generate 1-2 routes per nearby port
    for (let i = 0; i < (index < 3 ? 2 : 1); i++) {
      const departureHour = (baseHour + index * 1.5 + i * 2) % 24;
      const travelTime = Math.min(6, Math.ceil(port.distance / 30)); // Estimate: ~30km/h
      const arrivalHour = (departureHour + travelTime) % 24;

      routes.push({
        id: routes.length + 1,
        route: `${place.name} → ${port.name}`,
        departure: `${String(Math.floor(departureHour)).padStart(2, "0")}:${String((departureHour % 1) * 60).padStart(2, "0")} ${departureHour < 12 ? "AM" : "PM"}`,
        arrival: `${String(Math.floor(arrivalHour)).padStart(2, "0")}:${String((arrivalHour % 1) * 60).padStart(2, "0")} ${arrivalHour < 12 ? "AM" : "PM"}`,
        operator: operators[Math.floor(Math.random() * operators.length)],
        status: statuses[Math.floor(Math.random() * statuses.length)],
        distance: port.distance,
      });
    }
  });

  return routes.sort((a, b) => {
    // Prioritize "On Schedule" routes and shorter distances
    const aScore = (a.status === "On Schedule" ? 0 : 1) + a.distance / 100;
    const bScore = (b.status === "On Schedule" ? 0 : 1) + b.distance / 100;
    return aScore - bScore;
  });
}

function normalizeFerryText(value) {
  return value
    .toLowerCase()
    .replace(/[\u2013\u2014]/g, " ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
}

function getFerryRouteRelevance(route, place) {
  const placeText = [place.name, place.admin1, place.country].filter(Boolean).join(" ");
  const placeTerms = normalizeFerryText(placeText);
  const routeText = normalizeFerryText(`${route.route} ${route.departure} ${route.arrival}`);

  let score = route.status === "On Schedule" ? 5 : -2;

  if (placeText && routeText.join(" ").includes(placeText.toLowerCase())) {
    score += 12;
  }

  placeTerms.forEach((term) => {
    if (routeText.includes(term)) score += 3;
  });

  const routeTerms = normalizeFerryText(route.route);
  const overlaps = routeTerms.filter((term) => placeTerms.includes(term));
  score += overlaps.length * 2;

  // Boost score for closer routes
  if (route.distance) score += Math.max(0, 5 - route.distance / 50);

  return { score, overlaps };
}

function getRelevantFerryRoutes(routes, place) {
  if (!place || !routes.length) return routes.slice(0, 3);

  const scoredRoutes = routes
    .map((route) => ({ ...route, relevance: getFerryRouteRelevance(route, place) }))
    .sort((a, b) => b.relevance.score - a.relevance.score);

  return scoredRoutes.slice(0, 3);
}

async function loadFerryRoutes(place = currentPlace) {
  ferryLoading.hidden = false;
  ferryError.hidden = true;

  try {
    // Simulate network delay for realism
    await new Promise((resolve) => setTimeout(resolve, 300));

    if (!place) {
      throw new Error("No location selected.");
    }

    const routes = generateFerryRoutes(place);

    if (!routes.length) {
      throw new Error("No routes available for this location.");
    }

    renderFerryRoutes(routes, place);
  } catch (error) {
    console.error(error);
    ferryError.hidden = false;
  }

  ferryLoading.hidden = true;
}

function renderFerryRoutes(routes, place = currentPlace) {
  ferryRoutesContainer.innerHTML = "";

  const relevantRoutes = getRelevantFerryRoutes(routes, place);

  if (!relevantRoutes.length) {
    const card = document.createElement("div");
    card.className = "ferry-card ferry-card--empty";
    card.innerHTML = `
      <h4>No ferry routes available</h4>
      <p>Try searching for a coastal location to see available ferry services.</p>
    `;
    ferryRoutesContainer.appendChild(card);
    ferryRecommendation.textContent = "No ferry routes available for this location.";
    return;
  }

  const hasDirectMatch = place && relevantRoutes.some((route) => route.relevance.score > 5);

  relevantRoutes.forEach((route) => {
    const card = document.createElement("div");
    card.className = "ferry-card";

    const badgeText =
      route.relevance.score >= 12
        ? "Best match"
        : route.relevance.score >= 8
          ? "Relevant"
          : route.relevance.score >= 5
            ? "Nearby"
            : "Available";
    const statusClass = route.status === "On Schedule" ? "ferry-card__status--on-time" : route.status === "Delayed" ? "ferry-card__status--delayed" : "ferry-card__status--cancelled";

    card.innerHTML = `
      <div class="ferry-card__head">
        <h4>${route.route}</h4>
        <span class="ferry-card__badge">${badgeText}</span>
      </div>
      <p><strong>Departure:</strong> ${route.departure}</p>
      <p><strong>Arrival:</strong> ${route.arrival}</p>
      <p><strong>Operator:</strong> ${route.operator}</p>
      <p class="ferry-card__status ${statusClass}"><strong>Status:</strong> ${route.status}</p>
      ${route.distance ? `<p><small>Distance: ~${Math.round(route.distance)} km</small></p>` : ""}
    `;

    ferryRoutesContainer.appendChild(card);
  });

  const destinationName = place ? `${place.name}${place.admin1 ? `, ${place.admin1}` : ""}` : "your selected destination";
  const recommendationPrefix = hasDirectMatch ? "Top ferry option for" : "Available routes from";
  ferryRecommendation.textContent = `${recommendationPrefix} ${destinationName}: ${relevantRoutes[0].route}`;
}

refreshFerryBtn.addEventListener("click", () => loadFerryRoutes(currentPlace));
window.addEventListener("DOMContentLoaded", () => {
  // Start with a sensible default place — this will trigger weather, storms, and ferries
  selectPlace({
    name: "Manila",
    admin1: "Metro Manila",
    country: "Philippines",
    latitude: 14.5995,
    longitude: 120.9842,
  });

  if (locateBtn) locateBtn.addEventListener("click", getCurrentLocation);
});
