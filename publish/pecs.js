const express = require("express");
var http = require('http');
var https = require('https');
var fs = require('fs');

var logFile = __dirname + "/pecs.log";
function log(message, withDate = true, error = false, die = false) {
    date = new Date();
    var day = ("0" + date.getDate()).slice(-2);
    var month = ("0" + (date.getMonth() + 1)).slice(-2);
    var year = date.getFullYear();
    var hours = ("0" + date.getHours()).slice(-2);
    var minutes = ("0" + date.getMinutes()).slice(-2);
    var seconds = ("0" + date.getSeconds()).slice(-2);
    var dateStr = year + "-" + month + "-" + day + " " + hours + ":" + minutes + ":" + seconds;
    var dateMessage = "\n" + message;
    if (withDate) {
        dateMessage = "\n" + dateStr + ":: " + message;
    }
    fs.appendFileSync(logFile, dateMessage);
    if (error) {
        console.error(message);
    } else {
        console.log(message);
    }
    if (die) {
        console.log('Press any key to exit');
        const keypress = async () => {
            process.stdin.setRawMode(true)
            return new Promise(resolve => process.stdin.once('data', () => {
                process.stdin.setRawMode(false)
                resolve()
            }))
        }
        (async () => {
            await keypress()
        })().then(process.exit)
    }
}

log('==================================================', false)

const app = express();
fs.readFile('./config.json', 'utf8', function (err, data) {
    if (err) {
        log('config.json was not found or could not be opened: ');
        log(err, true, true, true);
    } else {
        var config = JSON.parse(data);

        dataDir = __dirname + "/src";
        app.use(express.static(dataDir));

        var dbConnectionURL = config.dbConnectionURL || "";
        var HTTPPort = config.HTTPPort || 4200;
        var HTTPSPort = config.HTTPSPort || 4443;
        var SSLCertificatePath = config.SSLCertificatePath || "";
        var SSLPrivateKeyPath = config.SSLPrivateKeyPath || "";

        if (dbConnectionURL) {
            log("Preparing PECS config file in src/assets/config.json")
            fs.writeFileSync("src/assets/config.json", JSON.stringify({ dbConnectionURL: dbConnectionURL }), function (err) {
                if (err) {
                    log("Could not prepare PECS config file: ");
                    log(err);
                }
            });
        }

        async function startHTTP() {
            var httpServer = http.createServer(app);
            try {
                await new Promise((resolve, reject) => {
                    httpServer.listen(HTTPPort, () => {
                        log('HTTP server is listening on port ' + HTTPPort);
                        resolve();
                    });
                    httpServer.once('error', (err) => {
                        reject(err);
                    });
                });
                return;
            } catch (err) {
                log("HTTP server could not be started: ");
                log(err, true, true, true);
            }
        }
        startHTTP()

        if (SSLCertificatePath && SSLPrivateKeyPath) {
            try {
                var certificate = fs.readFileSync(SSLCertificatePath, 'utf8');
            } catch (err) {
                log('SSL certificate not found at ' + SSLCertificatePath)
                certificate = "";
            }
            try {
                var privateKey = fs.readFileSync(SSLPrivateKeyPath, 'utf8');
            } catch (err) {
                log('SSL private key not found at ' + SSLPrivateKeyPath)
                privateKey = "";
            }
            if (certificate && privateKey) {
                var credentials = { key: privateKey, cert: certificate };
                
                async function startHTTPS() {
                    var httpsServer = https.createServer(credentials, app);

                    try {
                        await new Promise((resolve, reject) => {
                            httpsServer.listen(HTTPSPort, () => {
                                log('HTTPS server is listening on port ' + HTTPSPort);
                                resolve();
                            });
                            httpsServer.once('error', (err) => {
                                reject(err);
                            });
                        });
                        return;
                    } catch (err) {
                        log("HTTPS server could not be started: ");
                        log(err, true, true, true);
                    }
                }
                startHTTPS()
            } else {
                log('HTTPS server was not started.')
            }

        } else if (SSLCertificatePath || SSLPrivateKeyPath) {
            log('SSL information missing from config.json: ')
            if (!SSLCertificatePath) {
                log(' SSLCertificatePath');
            }
            if (!SSLPrivateKeyPath) {
                log(' SSLPrivateKeyPath');
            }
            log('HTTPS server was not started.')
        }
    }

})