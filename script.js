
const GEOCODE_URL = "https://geocoding-api.open-meteo.com/v1/search";
const FORECAST_URL = "https://my.meteoblue.com/packages/basic-1h_basic-day";
const METEOBLUE_API_KEY = "ZFgqArEKt497xQiY";
const FERRY_API_URL = "./api/ferry-routes.json";

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

// Ferry Routes
const ferryRoutesContainer = document.getElementById("ferryRoutes");
const ferryRecommendation = document.getElementById("ferryRecommendation");
const ferryLoading = document.getElementById("ferryLoading");
const ferryError = document.getElementById("ferryError");
const refreshFerryBtn = document.getElementById("refreshFerryBtn");

let searchTimer = null;
let activeSuggestions = [];

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
  searchInput.value = `${place.name}${place.admin1 ? ", " + place.admin1 : ""}`;
  hideSuggestions();
  loadWeather(place);
}

async function loadWeather(place) {
  emptyState.hidden = true;
  pagesEl.hidden = true;
  loadingState.hidden = false;
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
    loadingState.hidden = true;
    emptyState.hidden = false;
    emptyState.querySelector(".empty__title").textContent = "Couldn't load weather";
    emptyState.querySelector(".empty__body").textContent =
      "Couldn't reach meteoblue. This is often a CORS/referrer restriction — check that your API key's " +
      "referrer allow list includes this site (or use a permissive setting while testing locally), and that " +
      "the key hasn't hit its daily call limit.";
  }
}

function renderDashboard(place, data) {
  loadingState.hidden = true;
  pagesEl.hidden = false;
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
  // Ferry recommendation
  if (level === "safe") {

    ferryRecommendation.textContent =
      "🟢 Ferry trips are operating normally.";

  }
  else if (level === "caution") {

    ferryRecommendation.textContent =
      "🟡 Some ferry departures may experience delays due to weather.";

  }
  else {

    ferryRecommendation.textContent =
      "🔴 Ferry trips are not recommended due to severe weather.";

  }
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
/* ==========================
   Ferry Routes
========================== */

async function loadFerryRoutes() {

  ferryLoading.hidden = false;
  ferryError.hidden = true;

  try {

    const response = await fetch(FERRY_API_URL);

    if (!response.ok) {
      throw new Error("Unable to load ferry routes.");
    }

    const routes = await response.json();

    renderFerryRoutes(routes);

  } catch (error) {

    console.error(error);

    ferryError.hidden = false;

  }

  ferryLoading.hidden = true;
}

async function addFerryRoute(routeData) {

  try {

    const response = await fetch(FERRY_API_URL, {

      method: "POST",

      headers: {
        "Content-Type": "application/json"
      },

      body: JSON.stringify(routeData)

    });

    if (!response.ok) {
      throw new Error("Failed to add route.");
    }

    const result = await response.json();

    console.log(result);

    loadFerryRoutes();

  } catch (error) {

    console.error(error);

  }

}

function renderFerryRoutes(routes) {

    ferryRoutesContainer.innerHTML = "";

    routes.forEach(route => {

        const card = document.createElement("div");

        card.className = "ferry-card";

        card.innerHTML = `
            <h4>${route.route}</h4>
            <p><strong>Departure:</strong> ${route.departure}</p>
            <p><strong>Arrival:</strong> ${route.arrival}</p>
            <p><strong>Operator:</strong> ${route.operator}</p>
            <p><strong>Status:</strong> ${route.status}</p>
        `;

        ferryRoutesContainer.appendChild(card);

    });

}

refreshFerryBtn.addEventListener("click", loadFerryRoutes);
window.addEventListener("DOMContentLoaded", () => {

    loadFerryRoutes();

    selectPlace({
        name: "Manila",
        admin1: "Metro Manila",
        country: "Philippines",
        latitude: 14.5995,
        longitude: 120.9842,
    });

});
