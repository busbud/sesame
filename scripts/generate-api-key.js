'use strict';

var crypto = require('crypto');

var Promise = require('bluebird');
Promise.promisifyAll(crypto);

if (process.argv.length < 3) {
  console.error('usage: generate-api-key <client>');
  return;
}

crypto.randomBytesAsync(16).then(function(key) {
  console.log('API_KEY_' + process.argv[2].toUpperCase() + '=' + key.toString('hex'));
});
