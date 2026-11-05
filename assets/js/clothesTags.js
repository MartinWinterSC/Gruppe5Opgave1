const toejRegler = {
    "nederdel": {
        condition: "warm",
        image: "./assets/img/icons/nederdel.png"
    },

    "t-shirt": {
        condition: "warm",
        image: "./assets/img/icons/t-shirt.png"
    },

    "kjole": {
        condition: "warm",
        image: "./assets/img/icons/kjole.png"
    },

    "sandaler": {
        condition: "warm",
        image: "./assets/img/icons/sandaler.png"
    },

    "langærmet-bluse": {
        condition: "mild",
        image: "./assets/img/icons/langTrøje.png"
    },

    "let-jakke": {
        condition: "mild",
        image: "./assets/img/icons/letjakke.png"
    },

    "sneakers": {
        condition: "coldOrWarmer",
        image: "./assets/img/icons/sneakers.png"
    },

    "sweater": {
        condition: "cold",
        image: "./assets/img/icons/sweater.png"
    },

    "vinterjakke": {
        condition: "cold",
        image: "./assets/img/icons/vinterjakke.png"
    },

    "hue": {
        condition: "cold",
        image: "./assets/img/icons/hue.png"
    },

    "halstoerklaede": {
        condition: "cold",
        image: "./assets/img/icons/halstørklæde.png"
    },

    "vinterstoevler": {
        condition: "cold",
        image: "./assets/img/icons/vinterstøvler.png"
    },

    "solbriller": {
        condition: "sunny",
        image: "./assets/img/icons/solbriller.png"
    },

    "kasket": {
        condition: "sunny",
        image: "./assets/img/icons/kasket.png"
    },

    "regnjakke": {
        condition: "rain",
        image: "./assets/img/icons/regnjakke.png"
    }
};

// Finder tøj der passer til brugerens præferencer og vejret
function getToejAnbefalinger(user, currentWeather) {

    // Tjek at vi har de nødvendige oplysninger
    if (!user || !user.toej || !currentWeather || !currentWeather.main) {
        return [];
    }

    // Hent temperatur og brugerens temperaturpræferencer
    const temperatur = currentWeather.main.temp;
    const koldt = Number(user.koldt);
    const varmt = Number(user.varmt);

    if (!Number.isFinite(temperatur) ||
        !Number.isFinite(koldt) ||
        !Number.isFinite(varmt) ||
        koldt >= varmt) {
        return [];
    }

    // Bestem temperaturkategori
    let temperaturKategori;

    if (temperatur < koldt) {
        temperaturKategori = "cold";
    } else if (temperatur > varmt) {
        temperaturKategori = "warm";
    } else {
        temperaturKategori = "mild";
    }

    // Hent vejrinformation fra OpenWeather
    const weatherInfo = currentWeather.weather?.[0];

    const weatherMain = weatherInfo?.main;
    const weatherIcon = weatherInfo?.icon;

    // Undersøg om det er solskin eller regnvejr
    const solskin = ["01d", "02d"].includes(weatherIcon);

    const regn = ["Rain", "Drizzle", "Thunderstorm"].includes(weatherMain);

    // Opret liste til anbefalinger
    const anbefalinger = [];

    // Gennemgå brugerens valgte tøj
    for (const toej of user.toej) {

        const regel = toejRegler[toej];

        if (!regel) {
            continue;
        }

        let passer = false;

        switch (regel.condition) {

            case "warm":
                passer = temperaturKategori === "warm";
                break;

            case "mild":
                passer = temperaturKategori === "mild";
                break;

            case "cold":
                passer = temperaturKategori === "cold";
                break;

            case "all":
                passer = true;
                break;

            case "sunny":
                passer = solskin;
                break;

            case "rain":
                passer = regn;
                break;
            
            case "coldOrWarmer":
                passer = temperaturKategori !== "cold";
                break;
        }

        // Tilføj tøj hvis det passer til vejret
        if (passer) {
            anbefalinger.push({
                tag: toej,
                ...regel
            });
        }
    }

    // Begræns anbefalingerne til maksimalt 4
    return anbefalinger.slice(0, 4);
} 

// Viser de fire tøjanbefalinger på hjemmesiden
function visToejAnbefalinger(anbefalinger) {

    // Gennemgår de fire pladser i HTML
    for (let i = 0; i < 4; i++) {

        const billede = document.getElementById(`spot${i + 1}`);

        if (!billede) {
            continue;
        }

        // Findes der en anbefaling til pladsen?
        if (anbefalinger[i]) {

            console.log("Anbefaling:", anbefalinger[i]);
            console.log("Billedsti:", anbefalinger[i]?.image);

            billede.src = anbefalinger[i].image;
            billede.alt = anbefalinger[i].tag;

            // Viser tøjet
            billede.parentElement.parentElement.style.display = "";

        } else {

            // Skjul pladsen hvis der ikke er flere anbefalinger
            billede.parentElement.parentElement.style.display = "none";
        }
    }
}