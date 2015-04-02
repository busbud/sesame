'use strict';

var fs = require('fs');
var path = require('path');
var assert = require('assert');

var R = require('ramda');
var Promise = require('bluebird');
var restify = require('restify');

var config = require('./config');
var authorization = require('./authorization');
var cipher = require('./cipher');
var vault = require('./vault');

var UUID_REGEXP = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

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

app.post('/vault', function(req, res, next) {
  if (!req.body || !req.body.data) {
    return next(new restify.InvalidContentError('No data'));
  }

  var encryptionKey = config.encryptionKeys[0];
  var data = new Buffer(req.body.data, 'utf8');

  var encrypt = cipher.encrypt(encryptionKey.key, data);

  var create = Promise.join(
    config.databaseURL, encryptionKey.id, encrypt.get(0), encrypt.get(1)
  ).spread(vault.create);

  create.then(function(id) {
    var uri = config.baseURI + '/vault/' + id;
    res.set('Location', uri);
    res.send(201, uri);
    next();
  }).catch(next);
});

function validateID(req, res, next) {
  if (req.params.id.length !== 36 || !UUID_REGEXP.test(req.params.id)) {
    return next(new restify.InvalidContentError('Invalid ID'));
  }
  next();
}

app.get('/vault/:id', validateID, function(req, res, next) {
  var read = vault.read(config.databaseURL, req.params.id)
    .tap(function(entry) {
      if (!entry) throw new restify.ResourceNotFoundError('Resource not found');
    });

  var decrypt = read.then(function(entry) {
    var encryptionKey = R.find(R.propEq('id', entry.keyID), config.encryptionKeys);

    if (!encryptionKey) {
      return vault.delete(config.databaseURL, entry.id)
        .throw(new restify.ResourceNotFoundError('Resource not found'));
    }

    return cipher.decrypt(encryptionKey.key, entry.salt, entry.data);
  });

  decrypt.then(function(data) {
    var string = data.toString('utf8');
    res.send(200, string);
    next();
  }).catch(next);
});

app.put('/vault/:id', validateID, function(req, res, next) {
  if (!req.body || !req.body.data) {
    return next(new restify.InvalidContentError('No data'));
  }

  var encryptionKey = config.encryptionKeys[0];
  var data = new Buffer(req.body.data, 'utf8');

  var encrypt = cipher.encrypt(encryptionKey.key, data);

  var update = Promise.join(
    config.databaseURL,
    req.params.id,
    encryptionKey.id,
    encrypt.get(0),
    encrypt.get(1)
  ).spread(vault.update);

  update.then(function(success) {
    if (!success) throw new restify.ResourceNotFoundError('Resource not found');
    res.status(204);
    res.end();
    next();
  }).catch(next);
});

app.del('/vault/:id', validateID, function(req, res, next) {
  vault.delete(config.databaseURL, req.params.id).then(function(success) {
    if (!success) throw new restify.ResourceNotFoundError('Resource not found');
    res.status(204);
    res.end();
    next();
  }).catch(next);
});

if (require.main === module) {
  app.listen(config.port, function() {
    console.log('%s listening at %s', app.name, app.url);
  });
}

module.exports = app;
