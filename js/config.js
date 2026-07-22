// ======================================================
// VOYAGER CONFIGURATION
// ======================================================

// ---------- Open-Meteo ----------
export const WEATHER = {
    BASE_URL: "https://api.open-meteo.com/v1/forecast"
};

export const GEOCODING = {
    BASE_URL: "https://geocoding-api.open-meteo.com/v1/search"
};

// ---------- Ferry API ----------
// Replace later if you have a real endpoint.
export const FERRY = {
    BASE_URL:   "./api/ferry-routes.json"
};

// ---------- Travel Advisory API ----------
// Replace later if you have one.
export const ADVISORY = {
    BASE_URL: ""
};

// ---------- Default Location ----------

export const DEFAULT_LOCATION = {

    name: "Batangas City",

    admin1: "Batangas",

    country: "Philippines",

    latitude: 13.7565,

    longitude: 121.0583

};

// ---------- Search ----------

export const SEARCH = {

    MAX_RESULTS: 8,

    LANGUAGE: "en"

};
