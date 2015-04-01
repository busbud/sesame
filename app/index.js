'use strict';

var fs = require('fs');
var path = require('path');
var assert = require('assert');

var restify = require('restify');

var config = require('./config');
var authorization = require('./authorization');

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
app.use(restify.acceptParser(app.acceptable));
app.use(restify.authorizationParser());
app.use(restify.bodyParser());
app.use(restify.gzipResponse());

if (process.env.NODE_ENV === 'production') {
  app.use(authorization(config.apiKeys));
}

if (require.main === module) {
  app.listen(config.port, function() {
    console.log('%s listening at %s', app.name, app.url);
  });
}

module.exports = app;
