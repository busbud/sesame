'use strict';

var R = require('ramda');

// HTTP port.
exports.port = 6666;

// PostgreSQL connection URL.
exports.databaseURL = 'postgres://localhost/sesame';

// Base resource URI.
exports.baseURI = 'http://localhost:6666';

// Array of encryption key objects with 'id' and 'key' properties, in priority
// order.
exports.encryptionKeys = [];

// Dictionary of lower-cased client names to API keys.
exports.apiKeys = {};

// Load configuration from a plain object.
exports.loadObject = function(obj) {
  if (obj.port) exports.port = obj.port;
  if (obj.databaseURL) exports.databaseURL = obj.databaseURL;
  if (obj.baseURI) exports.baseURI = obj.baseURI;
  if (obj.encryptionKeys) exports.encryptionKeys = obj.encryptionKeys;
  if (obj.apiKeys) exports.apiKeys = obj.apiKeys;

  if (obj.port && !obj.baseURI) {
    exports.baseURI = 'http://localhost:' + exports.port;
  }
};

// Load configuration from envrionment variables.
exports.loadEnvironment = function(env) {
  var obj = {};

  if (env.PORT) obj.port = parseInt(env.PORT, 10);
  if (env.DATABASE_URL) obj.databaseURL = env.DATABASE_URL;
  if (env.BASE_URI) obj.baseURI = env.BASE_URI;

  if (env.ENCRYPTION_KEYS) {
    obj.encryptionKeys = [];
    var pairs = env.ENCRYPTION_KEYS.split(',');
    R.forEach(function(pair) {
      var split = pair.split(':');
      if (split.length !== 2) {
        console.warn('Invalid encryption key configuration:', pair);
        return;
      }
      obj.encryptionKeys.push({id: split[0], key: split[1]});
    }, pairs);
  }

  var apiKeyVars = R.filter(R.compose(R.eq(0), R.strIndexOf('API_KEY_')), R.keys(env));
  if (apiKeyVars.length) {
    obj.apiKeys = {};
    R.forEach(function(envVar) {
      var client = R.toLower(R.substringFrom(8, envVar));
      obj.apiKeys[client] = env[envVar];
    }, apiKeyVars);
  }

  exports.loadObject(obj);
};
