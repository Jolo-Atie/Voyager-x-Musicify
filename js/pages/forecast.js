import { state } from "../state.js";
import { forecastCards, hourlyChart } from "../components/chart.js";
export function initForecastPage() {
  if (!state.weather) return;
  const name = [state.location.name, state.location.admin1, state.location.country].filter(Boolean).join(", ");
  document.getElementById("forecastLocationLine").textContent = `Showing the 7-day outlook for ${name}.`;
  document.getElementById("forecastRow").innerHTML = forecastCards(state.weather.data_day);
  document.getElementById("hourlyChart").innerHTML = hourlyChart(state.weather.data_1h, state.weather.currentIndex);
  window.lucide?.createIcons();
}
