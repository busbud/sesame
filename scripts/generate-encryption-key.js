'use strict';

var crypto = require('crypto');

var Promise = require('bluebird');
Promise.promisifyAll(crypto);

if (process.argv.length < 3) {
  console.error('usage: generate-encryption-key <id>');
  return;
}

crypto.randomBytesAsync(33).then(function(key) {
  console.log(process.argv[2] + ':' + key.toString('base64'));
});
