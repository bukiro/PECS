This is a standalone executable to host PECS for you and your fellow players. It is intended to save you the effort of installing and using node.js to build and serve PECS.
However, it still requires some input:

1. If you want to save any of your created characters, you will need a MongoDB database. If you prefer a different database, you need a database API connector instead.

MongoDB can be downloaded for free at https://www.mongodb.com/. You can also host a free database on the MongoDB Atlas servers and connect to that.
To develop your own database connector, you can reference my standalone MongoDB connector on https://github.com/bukiro/PECS-MongoDB-Connector, or see the documentation on https://github.com/bukiro/PECS/blob/4f8bffcfeabab0320469bef3e4d0ec7697b10931/Database.md

2. Before the executable can start, you need a config.json file. You can copy and rename config.json.examble to see all the possible options:

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

DataServiceConnectionURL
(not needed with MongoDBConnectionURL)
If you are running an external database connector (likely because you are not using MongoDB for your database), you need to configure its URL here. This URL needs to work for everybody who is using your PECS server. If you have a dynamic IP address, you may need to update this value before starting the server.

MongoDBConnectionURL
(not needed with externaldbConnectionURL)
If you are not running an external database connector, this is the connection URL for your MongoDB database server. Both MongoDB Atlas and MongoDB Compass can show you the exact url to use for your server. If the server requires an authenticated user for the connection, you must enter the user and password here. MongoDB Atlas always requires authenticated users.

MongoDBDatabase
(not needed with externaldbConnectionURL)
If you are not running an external database connector, name the MongoDB database that you will connect to.

MongoDBCharacterCollection
(not needed with externaldbConnectionURL, default characters)
The name of the collection in the database where the character are stored.

MongoDBMessagesCollection
(not needed with externaldbConnectionURL, default messages)
The name of the messages collection in the database.

3. When the above points are taken care of, you can start PECS simply by running the executable: On Windows, run pecs.exe, and on Linux, run pecs.

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