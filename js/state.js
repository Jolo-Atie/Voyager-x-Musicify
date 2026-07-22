// ===============================================
// VOYAGER STATE
// Shared Application State
// ===============================================

export const state = {

    // Current Page
    currentPage: "home",

    // Loading State
    loading: false,

    // Search State
    searchQuery: "",

    // Selected Location
    location: {

        name: "",
        admin1: "",
        country: "",

        latitude: null,
        longitude: null

    },

    // Weather Data

    weather: null,

    forecast: null,

    advisory: null,

    ferry: null

};

// ===============================================
// State Helpers
// ===============================================

export function setCurrentPage(page) {

    state.currentPage = page;

}

export function setLoading(value) {

    state.loading = value;

}

export function setLocation(location) {

    state.location = {

        ...state.location,

        ...location

    };

}

export function setWeather(weather) {

    state.weather = weather;

}

export function setForecast(forecast) {

    state.forecast = forecast;

}

export function setAdvisory(advisory) {

    state.advisory = advisory;

}

export function setFerry(routes) {

    state.ferry = routes;

}
// ===============================================
// Getters
// ===============================================

export function getCurrentPage() {

    return state.currentPage;

}

export function isLoading() {

    return state.loading;

}

export function getLocation() {

    return state.location;

}

export function getWeather() {

    return state.weather;

}

export function getForecast() {

    return state.forecast;

}

export function getAdvisory() {

    return state.advisory;

}

export function getFerry() {

    return state.ferry;

}