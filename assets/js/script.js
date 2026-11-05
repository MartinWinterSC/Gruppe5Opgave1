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
// her gemmer vi brugeren
async function saveUser() {
    const name =document.getElementById("nameInput").value;
    try {
        const response = await fetch("/saveUser", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                name: name
            })
        });
        if(!response.ok) {
            throw new Error("kunne ikke gemme bruger");
        }
        const data = await response.text();
        console.log(data);
    } catch (error){
        console.log("Fejl:", error);
    }
}

// her henter vi brugerne fra vores JSON fil.
// anvender asyc funktion fordi vi ikke skal vente på at data bliver hentet, til at javascript kan kører videre (super dårlig formulering - lav om!)
async function getUsers() {
    try{
        const response =await fetch("/getUsers");
        if(!response.ok) {
            throw new Error("kunne ikke hente bruger");
        }
        const users = await response.json();
        // console.log(users);
        return users;
    } catch (error) {
        console.log("fejl:", error);
        return null;
    }
}

// login funktion
async function login() {
    const name = document.getElementById("nameInputlogin").value.trim();
    if(name === "") {
        console.log("skriv dit navn");
        return;
    }
    // gemmer funktionen getUsers som er vores data fra JSON filen i variablen users
    const users = await getUsers();
// er filen tom?
    if(users == null) {
        return;
    }
    // find() gennemgår arrayet og leder efter user med det pågældende navn
    const nuUsers = users.find(user => user.name === name);
    if(nuUsers){
        // gemmer brugerens navn i variabel loginUser i browseren ved hjælp af sessionStorage, så ved browseren hvem der logget ind på siden så længe den er åben.
        sessionStorage.setItem("loginUser", nuUsers.name);
        window.location.href ="/forside.html";
        // gammel kode skal slettes!
        // document.getElementById("loginBesked").textContent = "Goddag " + nuUsers.name;
        // console.log("velkommen tilbage" + nuUsers.name);
    } else {
        // console.log("Forkert brugernavn. Prøv igen eller opret dig som bruger");
       document.getElementById("loginBesked").textContent = "Forkert burgernavn. Prøv igen eller opret dig som bruger";
    }
}

// obs! hvor skal det vises henne? hvordan ser vores login side/pop up ud? skal vi have en side der bare hedder login? eller hvad gør vi lige!
// Løsning: vi laver en forside.html og laver index.html til login siden!
// funktion der viser data fra vores database/users.json filen i DOM
function showUser() {
    const name = sessionStorage.getItem("loginUser");
    const hilsen = document.getElementById("hilsen");
    const profilNavn = document.getElementById("navn");
    if (name) {
    // tjekker om id=hilsen er på siden
    if (hilsen) {
        hilsen.textContent = "Godmorgen, " + name;
    }
    if (profilNavn) {
        profilNavn.value = name;
    }
}
}
showUser();

// gemme brugerens præferencer og sender dem til serveren
async function savePref() {
    const name =sessionStorage.getItem("loginUser");
    // henter temperatur vlaget
    const koldt = Number(document.getElementById("koldt").value);
    const varmt = Number(document.getElementById("varmt").value);
    // tjek at de bliver gemt
    // console.log("Bruger:", name);
    // console.log("Koldt under:", koldt);
    // console.log("Varmt over:", varmt);
    // finder alle de markede checkbokse
    const valgtToej = document.querySelectorAll('input[name="toej"]:checked');
    // oprette en to liste
    let toej = [];
    // gennemgåt hver checkbox
    for (const checkbox of valgtToej) {
        // tilføjer checkboxens værdi til listen
        toej.push(checkbox.value);
    }
    if(!name) {
        console.log("Ingen bruger er logget ind");
        return;
    }
    try {
        const response =await fetch("/gemPref", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            // det data vi ønsker at sende i vores users.json fil
            body: JSON.stringify({
                name: name,
                koldt: koldt,
                varmt: varmt,
                toej: toej
            })
        });
        // fejl håndtering
        if(!response.ok) {
            throw new Error("kunne ikke gemme bruger præferencer");
        }
        const data = await response.text();
        console.log(data);
    } catch (error) {
        console.log("Fejl:", error);
    }

}
// savePref(); skal ikke kaldes her men i html ved tryk på knappen!

// funktion der viser/henter brugerens temperatur præferencer fra users.json 
async function showPrf() {
    const name =sessionStorage.getItem("loginUser");

    const koldtInput = document.getElementById("koldt");
    const varmtInput = document.getElementById("varmt");
    
if (!name || !koldtInput || !varmtInput) {
    return;
}
const users =  await getUsers();
if (users == null) {
    return;
}
const user =users.find(user => user.name === name);
if (user) {
    if(user.koldt !== undefined) {
        koldtInput.value = user.koldt;
    }
    if(user.varmt !== undefined) {
        varmtInput.value = user.varmt;
    }
    // tilføjer her tøj delen
    if(user.toej) {
        const checkbokse = document.querySelectorAll('input[name="toej"]');
        for (const checkbox of checkbokse) {
            checkbox.checked =user.toej.includes(checkbox.value);
        }
    }
}
// kalder funktionen showtoej for at opdatere listen med brugerens gemte tøj
showToej();
}
showPrf();

function showToej() {
    const liste =document.getElementById("toejListe");
    if(!liste){
        return;
    }
    // tømmer listen så tøjet ikke vises flere gange
        liste.innerHTML ="";
        const valgtToej =document.querySelectorAll('input[name=toej]:checked');
        for (const checkbox of valgtToej) {
            // laver en liste til DOM 
            const li =document.createElement("li");
            // tilføjer class til li, så den følger css
            li.className ="tag";
            // finder tøjets navn fra checkboxens label
            li.textContent = checkbox.parentElement.textContent;
            // tilføjer tøjet til listen
            liste.appendChild(li);
        }
}
// opdatere listen løbende uden at brugeren behøver at trykke på gem knappen hver gang
const checkbokse = document.querySelectorAll('input[name="toej"]');
for (const checkbox of checkbokse) {
    checkbox.addEventListener("change", showToej);
}
