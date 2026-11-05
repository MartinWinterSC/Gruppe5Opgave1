const path = require("path");
// her hentes node.js indbyggede http-modul.
// http gør det muligt at oprette en webserver, som kan modtage forespørgelser fra browseren og sende svar tilbage
const http = require("http");
// fs står for File System og henter node.js indbyggede modul til filer
const fs = require("fs");
/* opretter serveren med createServer. 
req er request (det browseren spørger om)
res er response - det serveren svarer tilbage med*/
const server = http.createServer((req, res) => {
// hvis brugeren åbner forsiden, altså browseren spørger om sidens er forsiden / 
    if (req.url === "/") {
/* hvis det er forsiden skal serveren udføre koden på index.html. fs.readFile = serveren læser filen, errr indholder fejl. data indholde filens indhold hvis læsningen af filen lykkes*/

        fs.readFile("index.html", (err, data) => {
// funktionen kører hvis filen er læst, res.writehead angiver http status og header, 200 er oftes det man anvender af kode til at fortælle "det lykkes" 
// hvis der sker en fejl
            if(err) {
            res.writeHead(500); //normal anvender man 500 ved en serverfejl
            res.end("der skete en fejl ved læsning af filen");
            // stopper funktionen, så serveren ikke fortsætter med at sende filens indhold
            return;
                        }
            res.writeHead(200, {
                // fortæller hvilken type indhold der er i filen, her er det html
                "Content-Type": "text/html"
            });
// indholdet af index.html sendes til borwseren og svaret/kaldet afsluttes.
            res.end(data);
        });
// henter forside.html
    } else if (req.url === "/forside.html") {
        fs.readFile("forside.html", (err, data) => {
            if (err) {
                console.log(err);
                res.writeHead(500);
                res.end("fjel ved indlæsning af forsiden html side");
                    return;
                }
                res.writeHead(200, {
                    "Content-Type": "text/html"
                });
                res.end(data);
        });
// 
// henter opret.html
    } else if (req.url === "/opret.html") {
        fs.readFile("opret.html", (err, data) => {
            if (err) {
                console.log(err);
                res.writeHead(500);
                res.end("fjel ved indlæsning af forsiden html side");
                    return;
                }
                res.writeHead(200, {
                    "Content-Type": "text/html"
                });
                res.end(data);
        });
// 
            } else if (req.url === "/profile.html"){
        fs.readFile("profile.html", (err, data) => {
            if (err) {
                console.log(err);
                res.writeHead(500);
                res.end("fjel ved indlæsning af profil html side");
                    return;
                }
                res.writeHead(200, {
                    "Content-Type": "text/html"
                });
                res.end(data);
        });
        // vi gør det samme med style.css
    } else if (req.url === "/assets/css/style.css"){
        // console.log("CSS-routen bliver brugt!");
        fs.readFile("./assets/css/style.css", (err, data) => {
            if (err) {
                console.log(err);
                res.writeHead(500);
                res.end("fjel ved indlæsning af CSS");
                    return;
                }
                res.writeHead(200, {
                    "Content-Type": "text/css"
                });
                res.end(data);
        });
// serveren undersøger om browseren spørger efter filen app.js, som er her vores "almindelig" js ligger
    } else if (req.url === "/assets/js/script.js") {
// læser filen
        fs.readFile("./assets/js/script.js", (err, data) => {
            // hvis der sker en fejl
            if(err) {
            res.writeHead(500); //normal anvender man 500 ved en serverfejl
            res.end("der skete en fejl ved læsning af filen");
            // stopper funktionen, så serveren ikke fortsætter med at sende filens indhold
            return;
                        }
// fortæller http status og type af indhold, her javascript
            res.writeHead(200, {
                "Content-Type": "application/javascript"
            });
// sender data og afslutter kaldet
            res.end(data);
        });

// her skal indsættes at jeg læser indholdet og henter indhlold fra user.json! altså anvender GET!
// henter bruger oplysninger her! 

// Serveren undersøger, om browseren efterspørger en fil fra assets-mappen
    } else if (req.url.startsWith("/assets/")) {

        // Henter filens sti fra URL'en
        const pathname = decodeURIComponent(
            new URL(req.url, "http://localhost").pathname
        );
    
        // Finder den faktiske placering af filen på computeren
        const filePath = path.resolve(__dirname, "." + pathname);
    
        // Definerer den mappe, som serveren må hente filer fra
        const assetsPath = path.resolve(__dirname, "assets");
    
        // Kontrollerer, at filen ligger inden for assets-mappen
        if (!filePath.startsWith(assetsPath + path.sep)) {
            res.writeHead(403);
            res.end("Adgang nægtet");
            return;
        }
    
        // Finder den korrekte filtype ud fra filens endelse
        const filType = "image/png";
    
        // Læser billedfilen
        fs.readFile(filePath, (err, data) => {
        
            if (err) {
                console.log(err);
                res.writeHead(err.code === "ENOENT" ? 404 : 500);
                res.end("Fejl ved indlæsning af fil");
                return;
            }
        
            // Sender filen med den korrekte indholdstype
            const filEndelse = path.extname(filePath).toLowerCase();
        
            res.writeHead(200, {
                "Content-Type": filType[filEndelse] || "application/octet-stream"
            });
        
            res.end(data);
        });    
    
    } else if (req.url === "/getUsers" && req.method === "GET") {
        fs.readFile("users.json", (err, data) =>{
            if (err) {
                res.writeHead(500);
                res.end("fjel ved læsning af brugere");
                return;
            }
            res.writeHead(200, {
                "Content-Type": "application/json"
            });
            res.end(data);
        });
        // her hentes og gemmes en bruger!
// else id, vi undersøger igen en nu betingelse.
/* forespørgelsen skal være til url /saveUser og den skal indehold POSt metoden (altså vil sende noget til filen)*/
    } else if (req.url === "/saveUser" && req.method === "POST") {
// opretter en tom variabel body der skal indholde det data som browseren sender.
        let body = "";
/*req.on() registere en funktion som køre en bestemt hændelse på request/forespørgelsen
data er hændelsen, chunk er den del af data der er modtage*/
// kilde: https://www.geeksforgeeks.org/node-js/what-is-chunk-in-node-js/
        req.on("data", chunk => {
            // tilføjer det data der modtaget til body, der anvendes chunk forid node.js kan modtgae data i flere mindre dele
            body += chunk;
        });
// når alle dat er modtaget lyttes igen efter en hændelse
        req.on("end", () => {
// funktion der skal køres når alle data er hentet
// omdanner data til JSON tekst til en javascript værdi her er det et objekt, vores data er gemt i body som indholder den modtagne JSON tekst
          
// OBS!!!! evt noget try og catch fejl håndtering ind her, hvis der sende ugyldig JSON kan serveren gå ned.
const user = JSON.parse(body);
// læser users.json filen for eksistende data/åbner filen og læser indholdet
            fs.readFile("users.json", (err, data) => {
                
            if(err) {
            res.writeHead(500); //normal anvender man 500 ved en serverfejl
            res.end("fejl ved læsning af brugere");
            // stopper funktionen, så serveren ikke fortsætter med at sende filens indhold
            return;
                        }
// opretter variable users og omdanner data fra JSON til javascript array
            let users = JSON.parse(data);
                
// users arrayet, her anvenders push() til at tilføje nye elementer i slutningen af arrayet og user er den nye bruger der tilføjes.
                users.push(user);
// gemmer brugeren i filen
// fs.writeFile skriver indhold til en fil, users.json fortæller hvilken fil
                fs.writeFile(
                    "users.json", 
                    // omdanner javascriot data til JSON tekst, useres er dataten der skal gemmes, null betyder der ikke anvends nogen filtering, 2 betyder at JSON-teksen bliver indrykket med to mellemrum, så er den den nemmere at læse for os mennesker
                    JSON.stringify(users, null, 2),
                    (err) => {
                        // hvis der sker en fejl
                        if(err) {
                            res.writeHead(500); //normal anvender man 500 ved en serverfejl
                            res.end("der skete en fejl, da bruger skulle gemmes");
                            // stopper funktionen, så serveren ikke fortsætter med at sende filens indhold
                            return;
                        }
                        // sender satus kode
                        res.writeHead(200);
                        // sender teksten til browseren
                        res.end("Bruger gemt");
                       
                    }
                );
            });
        });
// nyt her!
    } else if (req.url ==="/gemPref" && req.method === "POST") {
        let body = "";
        req.on("data", chunk => {
            body+= chunk;
        });
        req.on("end", () => {
            let pref;
            try {
                pref =JSON.parse(body);
            } catch (error) {
                res.writeHead(400);
                res.end("fejl ved modtagelse af JSON");
                return;
            }
            // læser filen users.json for de bruger der er gemt
            fs.readFile("users.json", (err,data) =>{
                if (err) {
                    res.writeHead(500);
                    res.end("fejl ved læsning af brugere");
                    return;
                }
                let users =JSON.parse(data);
                
                const user = users.find(user => user.name === pref.name);
                if(!user) {
                    res.writeHead(404);
                    res.end("brugeren findes ikke");
                    return;
                }
                user.koldt = pref.koldt;
                user.varmt = pref.varmt;
                user.toej = pref.toej;
                fs.writeFile("users.json", JSON.stringify(users, null, 2), err=> {
                    if (err) {
                        res.writeHead(500);
                        res.end("Fejl da præfermecer skulle gemmes!");
                        return;
                    }
                    res.writeHead(200);
                    res.end("præferencer er gemt");
                })
            })
        })
// nyt her!

    } else {
// hvis siden ikke findes send fejlbesked "siden ikke fundet" og http status kode 400
        res.writeHead(404);
        res.end("Side ikke fundet");

    }

});
// starter serveren på port 3000
server.listen(3000, () => {
    // følgende besked kommer i terminalen
    console.log("Kører på http://localhost:3000");
});