# Data service configuration

PECS will save, load and delete both characters and inter-party event triggers ("messages") by performing http(s) GET and POST queries on the configured data service URL. This URL must be accessible from your players' browsers.

If you are using a data service, you need to create a config.json file in src/ and configure the service URL with or without port as follows:

{
    "dataServiceURL": "https://your.database.connector:port"
}

Security should be handled in the connector, if needed. The /Login API is required with or without functioning security.

# Data service requirements

The easiest way to run PECS is to use the release, which comes with a data service included and only needs to be unpacked and started.

In case you only have a webhost and can't run executables, the next best way is to setup a MongoDB on your server or on Atlas, and use [my service](https://github.com/bukiro/PECS-Data-Service) to connect to it. The service can run on node.js and will create a characters collection on the database and handle all queries.

Alternatively, you can use any JSON database, as long as the service can handle all the following queries. All queries except login will be sent with an `x-access-token` header included:

- `POST /Login` - Login with an Md5-hashed password and receive a login token in return. The Post content is `{"password": ...}`, and the response is `{"token": ...}`. If login fails, `token` needs to be `false`.
- `GET /listCharacters` - Return all characters.
- `GET /loadCharacter/:query` - Return a single character identified by `id`, where :query is the character ID as a string.
- `POST /saveCharacter` - Save the posted content into the database, replacing an entry if `id` matches. The POST content is the character converted to JSON.
- `POST /deleteCharacter` - Delete one character identified by `id`. The POST content is a JSON blob containing the character ID (`{"id": ...}`).
- `GET /time` - Return the current time as a Unix timestamp. This is used to age messages independently of the players' system time.
- `GET /loadMessages/:query` - Return all messages for a single recipient, identified by `recipientID`, where :query is the recipient ID as a string.
- `POST /saveMessages` - Save the posted content into the database in multiple entries as needed. The POST content is a JSON blob containing one or more messages.
- `POST /deleteMessage` - Delete one message identified by `id`. The POST content is a JSON blob containing the message ID (`{"id": ...}`).
- `POST /cleanupMessages` - Delete all expired messages. It is sent without parameters every time a character checks for messages, just before `/loadMessages`.