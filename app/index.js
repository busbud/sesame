'use strict';

var fs = require('fs');
var path = require('path');
var assert = require('assert');

var config = require('./config');

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
