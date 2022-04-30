This is a standalone executable to host PECS for you and your fellow players. It is intended to save you the effort of installing and using node.js to build and serve PECS.
However, it still requires some input.

===== Configuration =====

Before the executable can start, you need a config.json file. You can copy and rename config.json.example to see all the possible options.
PECS has three different ways to save your characters and communication between players:
----- Local -----
This is the default option. PECS saves your characters in a local database and takes care of the player communication.

----- External database -----
You can configure an external MongoDB database to save your characters. To connect to it, PECS needs to be configured with MongoDB parameters described below. PECS still takes care of the player communication.

----- External data service -----
In this option, an external data service provides an API for player communication and character management. To connect to it, PECS needs to be configured with a DataServiceConnectionURL parameter as described below.

===== Configuration parameters =====

HTTPPort
(optional, default 4200)
The insecure port where PECS is going to run. Your players will connect to http://<your-url-or-ip>:<HTTPPort> in their browser. Take care that your server doesn't run on the same computer with the same port as your database connector.

HTTPSPort
(optional, default 4443)
The alternative SSL port to use for more security. Your players will connect to https://<your-url-or-ip>:<HTTPSPort> if the HTTPS port is running.

SSLCertificatePath
(optional)
If you want to use HTTPS, you need an SSL certificate. This is the path to where certificate lies.

SSLPrivateKeyPath
(optional)
If you want to use HTTPS, your SSL certificate needs a private key. This is the path to the key. Password-protected private keys are not supported.

Password
(optional)
If you set a password, PECS will require players to enter it before they can use the tool and access your data.

DataServiceConnectionURL
(optional, not needed with MongoDBConnectionURL)
If you are running an external database connector, you need to configure its URL here. This URL needs to work for everybody who is using your PECS server. If you have a dynamic IP address, you may need to update this value before starting the server.

MongoDBConnectionURL
(optional, not needed with externaldbConnectionURL)
If you are not running an external database connector, this is the connection URL for your MongoDB database server. Both MongoDB Atlas and MongoDB Compass can show you the exact url to use for your server. If the server requires an authenticated user for the connection, you must enter the user and password here. MongoDB Atlas always requires authenticated users.

MongoDBDatabase
(optional, not needed with externaldbConnectionURL)
If you are not running an external database connector, name the MongoDB database that you will connect to.

MongoDBCharacterCollection
(optional, not needed with externaldbConnectionURL, default characters)
The name of the collection in the database where the character are stored.

ConvertMongoDBToLocal
(optional, default false)
ONLY if you have previously connected to a MongoDB and wish to switch to the local database, set this value to true and keep the MongoDB parameters. The next time you start the application, the characters stored in your MongoDB database will be converted to the local database. After that process has finished, you can remove the MongoDB parameters and this parameter from the config file and restart the application.

When the above points are taken care of, you can start PECS simply by running the executable: On Windows, run pecs.exe, and on Linux, run pecs.

===== CUSTOM CONTENT =====

You can place any custom content in JSON format in the appropriate folder in /src/assets/json, and let the app know that there is content to load by also placing an extensions.json file in the same folder. The extensions.json file should have the following format, and only files listed here are used in the app. If you are updating or expanding existing content, you should use the "overridePriority" attribute in each conflicting new object - objects with a higher value override those with a lower value.

```
[
    {
        "name": "my_campaign",
        "filename": "custom_my_campaign.json"
    }
]
```

When you copy a new version of PECS in this folder, the custom content files and config.json will not be overwritten.
