const express = require("express");
var http = require('http');
var https = require('https');
var fs = require('fs');

const app = express();
fs.readFile('./config.json', 'utf8', function (err, data) {
    if (err) {
        console.log('config.json was not found or could not be opened: ')
        throw err;
    }
    var config = JSON.parse(data);

    dir = __dirname + "/src";
    app.use(express.static(dir));

    var dbConnectionURL = config.dbConnectionURL || "";
    var HTTPPort = config.HTTPPort || 8080;
    var HTTPSPort = config.HTTPSPort || 8443;
    var SSLCertificatePath = config.SSLCertificatePath || "";
    var SSLPrivateKeyPath = config.SSLPrivateKeyPath || "";

    if (dbConnectionURL) {
        console.log("Preparing PECS config file in src/assets/config.json")
        fs.writeFile("src/assets/config.json", JSON.stringify({ dbConnectionURL: dbConnectionURL }), function (err) {
            if (err) {
                console.log("Could not prepare PECS config file: ");
                console.log(err);
            }
        });
    }

    var httpServer = http.createServer(app)
    httpServer.listen(HTTPPort, () => {
        console.log('HTTP server is running on port ' + HTTPPort)
    })

    if (SSLCertificatePath && SSLPrivateKeyPath) {
        try {
            var certificate = fs.readFileSync(SSLCertificatePath, 'utf8');
        } catch (err) {
            console.log('SSL certificate not found at ' + SSLCertificatePath)
            certificate = "";
        }
        try {
            var privateKey = fs.readFileSync(SSLPrivateKeyPath, 'utf8');
        } catch (err) {
            console.log('SSL private key not found at ' + SSLPrivateKeyPath)
            privateKey = "";
        }
        if (certificate && privateKey) {
            var credentials = { key: privateKey, cert: certificate };
            var httpsServer = https.createServer(credentials, app);
            httpsServer.listen(HTTPSPort, () => {
                console.log('HTTPS server listening on port ' + HTTPSPort)
            })
        } else {
            console.log('HTTPS server was not started.')
        }

    } else if (SSLCertificatePath || SSLPrivateKeyPath) {
        console.log('SSL information missing from config.json: ')
        if (!SSLCertificatePath) {
            console.log(' SSLCertificatePath');
        }
        if (!SSLPrivateKeyPath) {
            console.log(' SSLPrivateKeyPath');
        }
        console.log('HTTPS server was not started.')
    }

})