const CODES = {
  0: ["Clear sky", "sun", "clear"], 1: ["Mainly clear", "sun-medium", "clear"], 2: ["Partly cloudy", "cloud-sun", "cloudy"],
  3: ["Overcast", "cloud", "cloudy"], 45: ["Fog", "cloud-fog", "fog"], 48: ["Rime fog", "cloud-fog", "fog"],
  51: ["Light drizzle", "cloud-drizzle", "rain"], 53: ["Drizzle", "cloud-drizzle", "rain"], 55: ["Heavy drizzle", "cloud-rain", "rain"],
  61: ["Light rain", "cloud-rain", "rain"], 63: ["Rain", "cloud-rain", "rain"], 65: ["Heavy rain", "cloud-rain-wind", "rain"],
  71: ["Light snow", "cloud-snow", "snow"], 73: ["Snow", "cloud-snow", "snow"], 75: ["Heavy snow", "snowflake", "snow"],
  80: ["Rain showers", "cloud-rain", "rain"], 81: ["Rain showers", "cloud-rain", "rain"], 82: ["Heavy showers", "cloud-rain-wind", "rain"],
  95: ["Thunderstorm", "cloud-lightning", "storm"], 96: ["Thunderstorm with hail", "cloud-lightning", "storm"], 99: ["Thunderstorm with hail", "cloud-lightning", "storm"]
};
export function getPictocode(code) { const [label, icon, category] = CODES[code] || ["Unknown", "cloud", "cloudy"]; return { label, icon, category }; }
