var express = require('express');
var cors = require('cors');
var mongodb = require('mongodb');
var bodyParser = require('body-parser');

var port = process.env.PORT || 8080;

var app = express()

app.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
   next();
  });

mongodb.connect("mongodb+srv://PECSDBconnect:6LzhFZZYkji8SZKN@pecs.n3rcj.mongodb.net/myFirstDatabase?retryWrites=true&w=majority", function(err, client) {
    var db = client.db('pecs')
    var collection = db.collection('characters');

    app.post('/save', bodyParser.json(), function(req, res) {
        var query = req.body;
        query._id = query.id;

        collection.findOneAndReplace({_id:query._id}, query, { upsert: true, returnNewDocument: true }, function(err, result) {
            if (err) throw err;

            res.send(result);
        })
    })

    app.get('/list', cors(), function(req, res) {
        collection.find().toArray(function(err, result) {
            if (err) throw err;

            res.send(result)
        })
    })

    app.get('/load/:query', cors(), function(req, res) {
        var query = req.params.query;
        collection.findOne({'id': query}, function(err, result) {
            if (err) throw err;

            res.send(result)
        })
    })

    app.get('/delete/:query', cors(), function(req, res) {
        var query = req.params.query;
        collection.findOneAndDelete({'id': query}, function(err, result) {
            if (err) throw err;

            res.send(result)
        })
    })

})

app.listen(port, () => {
    console.log('Connector listening on port ' + port)
})