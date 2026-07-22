import { state } from "../state.js";
import { getPictocode } from "../utils/pictocodes.js";
import { getAdvisory } from "../utils/advisory.js";
import { forecastCards } from "../components/chart.js";
import { loadPage } from "../router.js";

export function initHomePage() {
  document.querySelectorAll("[data-page-link]").forEach(button => button.addEventListener("click", () => loadPage(button.dataset.pageLink)));
  if (!state.weather) return;
  const { data_1h: hourly, data_day: daily, currentIndex } = state.weather;
  const i = currentIndex; const info = getPictocode(hourly.pictocode[i]); const location = [state.location.name, state.location.admin1, state.location.country].filter(Boolean).join(", ");
  document.body.dataset.condition = info.category;
  document.getElementById("locationName").textContent = location;
  document.getElementById("updatedAt").textContent = `Updated ${new Date(hourly.time[i]).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
  document.getElementById("conditionIcon").innerHTML = `<i data-lucide="${info.icon}"></i>`;
  document.getElementById("tempValue").textContent = Math.round(hourly.temperature[i]); document.getElementById("conditionText").textContent = info.label;
  const humidity = Math.round(hourly.relativehumidity[i]); document.getElementById("humidityValue").textContent = humidity; document.getElementById("humidityBar").style.width = `${humidity}%`;
  document.getElementById("windValue").textContent = Math.round(hourly.windspeed[i]); document.getElementById("windNeedle").style.transform = `translate(-50%, -100%) rotate(${hourly.winddirection[i]}deg)`;
  document.getElementById("forecastPreview").innerHTML = forecastCards(daily, 7);
  const advisory = getAdvisory(info, hourly.windspeed[i], daily.windspeed_max[0], daily.precipitation_probability[0]);
  const badge = document.getElementById("advisory"); badge.dataset.level = advisory.level; badge.querySelector(".hero__advisory-text").textContent = `${advisory.emoji} ${advisory.text}`;
  document.getElementById("footerCoords").textContent = `${state.location.latitude.toFixed(2)}°, ${state.location.longitude.toFixed(2)}°`;
  window.lucide?.createIcons();
}
