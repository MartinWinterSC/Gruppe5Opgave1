const API_KEY = "2477ec907cc26dfafb54844cc25bd5fe";
const STORAGE_KEY = "userLocation";
const CITY_STORAGE_KEY = "selectedCity";

const cities = {
    "København": {
        latitude: 55.6759, longitude: 12.5655
    },
    "Aarhus": {
        latitude: 56.1567, longitude: 10.2108
    },
    "Odense": {
        latitude: 55.3959, longitude: 10.3883
    },
    "Aalborg": {
        latitude: 57.0480, longitude: 9.9187
    },
    "Esbjerg": {
        latitude: 55.4703, longitude: 8.4519
    }
};

// 1. GET USER LOCATION
function getUserLocation(forceRefresh = false) {
    return new Promise((resolve, reject) => {
        // Check localStorage unless refreshing location
        if (!forceRefresh) {
            try {
                const savedLocation = localStorage.getItem(STORAGE_KEY);

                if (savedLocation) {
                    const location = JSON.parse(savedLocation);

                    if (
                        typeof location.latitude === "number" && typeof location.longitude === "number"
                    ) {
                        console.log("Using saved location:", location);
                        resolve(location);
                        return;
                    }
                }

            } catch (error) {
                console.warn("Invalid saved location.");
                localStorage.removeItem(STORAGE_KEY);
            }
        }

        // Request location from browser
        if (!navigator.geolocation) {
            reject(new Error("Geolocation is not supported."));
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                const location = {
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude
                };

                // Save coordinates
                localStorage.setItem(
                    STORAGE_KEY,
                    JSON.stringify(location)
                );

                console.log("Location saved:", location);
                resolve(location);
            },

            (error) => {
                reject(new Error(
                    `Could not get location: ${error.message}`
                ));
            },

            {
                enableHighAccuracy: false,
                timeout: 10000,
                maximumAge: forceRefresh ? 0 : 300000
            }
        );
    });
}

// 2. FETCH WEATHER DATA
async function fetchJSON(url) {
    const response = await fetch(url);

    if (!response.ok) {
        throw new Error(
            `OpenWeather API error: ${response.status}`
        );
    }

    return response.json();
}


async function getWeather(location) {
    const params = new URLSearchParams({
        lat: location.latitude,
        lon: location.longitude,
        appid: API_KEY,
        units: "metric"
    });

    const baseURL = "https://api.openweathermap.org/data/2.5/";

    // Fetch current weather and 5-day forecast
    const [currentData, forecastData] = await Promise.all([
        fetchJSON(baseURL + "weather?" + params),
        fetchJSON(baseURL + "forecast?" + params)
    ]);

    return {
        current: currentData,
        hourly: forecastData.list,
        timezoneOffset: forecastData.city.timezone
    };
}

// 3. FONT AWESOME WEATHER ICONS
// Convert OpenWeather icon codes into Font Awesome classes

const weatherIcons = {
    "01d": "fa-sun",
    "01n": "fa-moon",

    "02d": "fa-cloud-sun",
    "02n": "fa-cloud-moon",

    "03d": "fa-cloud",
    "03n": "fa-cloud",

    "04d": "fa-cloud",
    "04n": "fa-cloud",

    "09d": "fa-cloud-showers-heavy",
    "09n": "fa-cloud-showers-heavy",

    "10d": "fa-cloud-sun-rain",
    "10n": "fa-cloud-moon-rain",

    "11d": "fa-cloud-bolt",
    "11n": "fa-cloud-bolt",

    "13d": "fa-snowflake",
    "13n": "fa-snowflake",

    "50d": "fa-smog",
    "50n": "fa-smog"
};

// Collect all weather icon classes
const allWeatherIconClasses = [
    ...new Set(Object.values(weatherIcons))
];


// Update an existing Font Awesome icon
function updateWeatherIcon(elementID, iconCode) {
    const iconElement = document.getElementById(elementID);

    if (!iconElement) return;

    // Remove previous weather icon class
    iconElement.classList.remove(...allWeatherIconClasses);

    // Add the new icon class
    const newIcon = weatherIcons[iconCode] || "fa-cloud";

    iconElement.classList.add(newIcon);
}

// 4. UPDATE CURRENT WEATHER (NOW)

function updateCurrentWeather(current) {
    // Get OpenWeather icon code
    const iconCode = current.weather[0].icon;

    // Update current Font Awesome icon
    updateWeatherIcon("iconPlus0", iconCode);

    // Update current weather image
    document.querySelectorAll(".currentWeatherImage").forEach(element => {
        element.src =
            `https://openweathermap.org/img/wn/${iconCode}@4x.png`;
    });

    // Update all elements displaying current temperature
    const temperature = Math.round(current.main.temp);

    document.querySelectorAll(".currentTemp").forEach(element => {
        if (element.classList.contains("time-temp")) {
            element.textContent = temperature + "°";
        } else {
            element.textContent = temperature;
        }
    });

    // Update weather description
    const description = document.getElementById("vejrbeskrivelse");

    if (description) {
        description.textContent = current.weather[0].description;
    }
}

// 5. FORMAT TIME

function formatHour(timestamp, timezoneOffset) {
    const localDate = new Date(
        (timestamp + timezoneOffset) * 1000
    );

    return new Intl.DateTimeFormat("da-DK", {
        hour: "2-digit",
        hourCycle: "h23",
        timeZone: "UTC"
    }).format(localDate);
}

// 6. UPDATE HOURLY FORECAST
function updateHourlyForecast(hourly, timezoneOffset) {
    // Only use upcoming forecast times
    const now = Math.floor(Date.now() / 1000);

    const nextHours = hourly
        .filter(hour => hour.dt > now)
        .slice(0, 5);

    // Update the five forecast slots
    for (let i = 1; i <= 5; i++) {

        const hour = nextHours[i - 1];

        if (!hour) {
            // Clear a slot if no forecast data is available
            document.getElementById(`timePlus${i}`).textContent = "--";
            document.getElementById(`tempPlus${i}`).textContent = "--";

            updateWeatherIcon(`iconPlus${i}`, "");

            continue;
        }

        // Update time
        document.getElementById(`timePlus${i}`).textContent = formatHour(hour.dt, timezoneOffset);

        // Update icon
        updateWeatherIcon(
            `iconPlus${i}`,
            hour.weather[0].icon
        );

        // Update temperature
        document.getElementById(`tempPlus${i}`).textContent = Math.round(hour.main.temp) + "°";
    }
}

// 7. MAIN WEATHER FUNCTION

async function loadWeather(forceRefresh = false, cityName = null) {

    const status = document.getElementById("status");

    if (status) {
        status.textContent = "Loading weather...";
    }

    try {
        let location;

        // FIRST: Use the city selected by the user
        if (cityName && cities[cityName]) {

            location = cities[cityName];

            localStorage.setItem(CITY_STORAGE_KEY, cityName);

            console.log("Using selected city:", cityName);
        }

        // SECOND: Check whether a city was saved previously
        else if (!forceRefresh) {

            const savedCity = localStorage.getItem(CITY_STORAGE_KEY);

            if (savedCity && cities[savedCity]) {
                location = cities[savedCity];

                console.log("Using saved city:", savedCity);
            }
        }

        // THIRD: If no city was selected, use browser location
        if (!location) {
            location = await getUserLocation(forceRefresh);
        }

        // Fetch weather using the chosen coordinates
        const weatherData = await getWeather(location);

        // Update current weather
        updateCurrentWeather(weatherData.current);

        // Update forecast
        updateHourlyForecast(
            weatherData.hourly,
            weatherData.timezoneOffset
        );

        if (status) {
            status.textContent = "Weather updated!";
        }

        console.log("Weather successfully updated:", weatherData);

    } catch (error) {

        console.error(error);

        if (status) {
            status.textContent = error.message;
        }

    }
}

// 8. CITY SEARCH
const cityInput = document.getElementById("soegefelt");
if (cityInput) {
    // Show previously selected city in the search field
    const savedCity = localStorage.getItem(CITY_STORAGE_KEY);

    if (savedCity && cities[savedCity]) {
        cityInput.value = savedCity;
    }

    // Listen for a city selection
    cityInput.addEventListener("change", () => {

        const selectedCity = cityInput.value.trim();

        if (cities[selectedCity]) {
            loadWeather(false, selectedCity);
        } else {
            const status = document.getElementById("status");

            if (status) {
                status.textContent = "Please select a valid city.";
            }
        }
    });
}

// 9. REFRESH LOCATION BUTTON
const refreshButton = document.getElementById("refreshLocation");
if (refreshButton) {
    refreshButton.addEventListener("click", () => {
        // Remove saved city preference
        localStorage.removeItem(CITY_STORAGE_KEY);

        // Clear city search field
        if (cityInput) {
            cityInput.value = "";
        }

        // Request the browser's current location again
        loadWeather(true);
    });
}

// 10. START EVERYTHING
loadWeather();