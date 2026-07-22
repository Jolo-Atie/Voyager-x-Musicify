import { WEATHER, GEOCODING, FERRY, DEFAULT_LOCATION } from "./config.js";
import { setWeather, setForecast, setLocation, setFerry, setLoading } from "./state.js";


async function request(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Request failed (${response.status}).`);
  return response.json();
}

export async function searchLocation(query) {
  if (!query.trim()) return [];
  const url = `${GEOCODING.BASE_URL}?name=${encodeURIComponent(query)}&count=8&language=en&format=json`;
  return (await request(url)).results || [];
}

export async function getWeather(latitude, longitude) {
  setLoading(true);
  try {
    const params = new URLSearchParams({
      latitude, longitude, timezone: "auto", forecast_days: "7",
      current: "temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m,wind_direction_10m",
      hourly: "temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m,wind_direction_10m",
      daily: "weather_code,temperature_2m_max,temperature_2m_min,wind_speed_10m_max,precipitation_probability_max"
    });
    const raw = await request(`${WEATHER.BASE_URL}?${params}`);
    const currentTime = raw.current.time;
    const currentIndex = Math.max(0, raw.hourly.time.indexOf(currentTime));
    const data = {
      metadata: { utc_timeoffset: raw.utc_offset_seconds / 3600 },
      currentIndex,
      data_1h: {
        time: raw.hourly.time, temperature: raw.hourly.temperature_2m,
        relativehumidity: raw.hourly.relative_humidity_2m, pictocode: raw.hourly.weather_code,
        windspeed: raw.hourly.wind_speed_10m, winddirection: raw.hourly.wind_direction_10m
      },
      data_day: {
        time: raw.daily.time, pictocode: raw.daily.weather_code,
        temperature_max: raw.daily.temperature_2m_max, temperature_min: raw.daily.temperature_2m_min,
        windspeed_max: raw.daily.wind_speed_10m_max,
        precipitation_probability: raw.daily.precipitation_probability_max
      }
    };
    setWeather(data); setForecast(data);
    return data;
  } finally { setLoading(false); }
}

export async function selectLocation(place) {
  setLocation({ name: place.name, admin1: place.admin1 || "", country: place.country || "", latitude: place.latitude, longitude: place.longitude });
  return getWeather(place.latitude, place.longitude);
}

export async function getFerryRoutes() {
  try { const routes = await request(FERRY.BASE_URL); setFerry(routes); return routes; }
  catch (error) { console.error("Ferry API Error:", error); return []; }
}

export function loadDefaultLocation() { return selectLocation(DEFAULT_LOCATION); }
