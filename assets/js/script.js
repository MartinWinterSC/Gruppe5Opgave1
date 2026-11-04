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