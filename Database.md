# Database configuration

PECS will save, load and delete both characters and inter-party event triggers ("messages") by performing http(s) GET and POST queries on the configured database connector URL.

You need to create a config.json file in src/ and configure the database connector URL (before queries) with or without port as follows:

{
    "dbConnectionURL": "http://your.database.connector:port"
}

Security should be handled in the connector, if needed.

# Database connector requirements

The easiest way to setup the database for PECS is to host a MongoDB locally or on Atlas with a character collection and a message collection, and use [my connector](https://github.com/bukiro/PECS-MongoDB-Connector).

Alternatively, you can use any JSON database, as long as the connector can handle the following queries:

`GET` /listCharacters - Return all characters.

`GET` /loadCharacter/:query - Return a single character identified by `id`, where :query is the character ID as a string.

`POST` /saveCharacter - Save the posted content into the database, replacing an entry if `id` matches. The POST content is the character as JSON.

`POST` /deleteCharacter - Delete one character identified by `id`. The POST content is a JSON blob containing the character ID (`{"id": [...]}`).

`GET` /time - Return the current time as a Unix timestamp. This is used to properly age messages independently of the players' system time.

`GET` /loadMessages/:query - Return all messages for a single recipient, identified by `recipientID`, where :query is the recipient ID as a string.

`POST` /saveMessages - Save the posted content into the database in multiple entries as needed. The POST content is a JSON blob containing one or more messages.

`POST` /deleteMessage - Delete one message identified by `id`. The POST content is a JSON blob containing the message ID (`{"id": [...]}`).

`POST` /deleteMyMessages - Delete all message for a single recipient, identified by `recipientId`. The POST content is a JSON blob containing the recipient ID (`{"recipientId": [...]}`).

`POST` /cleanupMessages - Delete all expired messages, identified by `timeStamp` being older than the specified age limit. You need to make the calculations in the connector (or the database), and you can choose the age limit. My default is 10 minutes. Feel free to do the cleanup in the database and have this query do nothing. It is sent every time a character checks for messages, just before /loadMessages.