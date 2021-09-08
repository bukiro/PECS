const express = require("express");
var http = require('http');
var https = require('https');
var fs = require('fs');

var logFile = __dirname + "/pecs.log";
function log(message, withDate = true, die = false) {
    date = new Date();
    var day = ("0" + date.getDate()).slice(-2);
    var month = ("0" + (date.getMonth() + 1)).slice(-2);
    var year = date.getFullYear();
    var hours = date.getHours();
    var minutes = date.getMinutes();
    var seconds = date.getSeconds();
    var dateStr = year + "-" + month + "-" + day + " " + hours + ":" + minutes + ":" + seconds;
    var dateMessage = "\n" + message;
    if (withDate) {
        dateMessage = "\n" + dateStr + ":: " + message;
    }
    fs.appendFileSync(logFile, dateMessage);
    console.log(message);
    if (die) {
        process.exit(1);
    }
}

log('==================================================', false)

const app = express();
fs.readFile('./config.json', 'utf8', function (err, data) {
    if (err) {
        log('config.json was not found or could not be opened: ');
        log(err, true, true);
    }
    var config = JSON.parse(data);

    dir = __dirname + "/src";
    app.use(express.static(dir));

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

    var httpServer = http.createServer(app)
    httpServer.listen(HTTPPort, () => {
        log('HTTP server is running on port ' + HTTPPort)
    })

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
            var httpsServer = https.createServer(credentials, app);
            httpsServer.listen(HTTPSPort, () => {
                log('HTTPS server listening on port ' + HTTPSPort)
            })
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

})