'use strict';

var fs = require('fs');
var path = require('path');
var assert = require('assert');

var restify = require('restify');

var config = require('./config');
var authorization = require('./authorization');
var controller = require('./controller');

// Load configuration from a file in development only.
if (process.env.NODE_ENV !== 'production') {
  try {
    var configPath = path.join(__dirname, '..', 'config.json');
    config.loadObject(JSON.parse(fs.readFileSync(configPath, {encoding: 'utf8'})));
  } catch (err) {
    if (err.code && err.code !== 'ENOENT') throw err;
  }
}

config.loadEnvironment(process.env);

assert.notEqual(config.encryptionKeys.length, 0, 'encryption keys configured');

var app = restify.createServer();
app.acceptable.unshift('text/plain');
app.use(restify.acceptParser(app.acceptable));
app.use(restify.authorizationParser());
app.use(restify.bodyParser());
app.use(restify.gzipResponse());

if (process.env.NODE_ENV === 'production') {
  app.use(authorization(config.apiKeys));
}

app.post('/vault', controller.post);
app.get('/vault/:id', controller.get);
app.put('/vault/:id', controller.put);
app.del('/vault/:id', controller.delete);

if (require.main === module) {
  app.listen(config.port, function() {
    console.log('%s listening at %s', app.name, app.url);
  });
}

module.exports = app;
