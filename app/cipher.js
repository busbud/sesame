'use strict';

var crypto = require('crypto');

var Promise = require('bluebird');
Promise.promisifyAll(crypto);

var ALGORITHM = 'aes256';
var KEY_SIZE = 256;
var SALT_SIZE = 16;
var ITERATIONS = 12000;

// Derive a key and IV from inputKey and salt.
function deriveKeyIV(inputKey, salt) {
  var derivedKeyIV = crypto.pbkdf2Async(inputKey, salt, ITERATIONS, KEY_SIZE * 2);
  var derivedKey = derivedKeyIV.call('slice', 0, KEY_SIZE);
  var derivedIV = derivedKeyIV.call('slice', KEY_SIZE);
  return Promise.join(derivedKey, derivedIV);
}

// Read a stream into a Promise of a Buffer.
function streamToBuffer(stream) {
  return new Promise(function(resolve, reject) {
    stream.on('error', reject);

    var chunks = [];
    stream.on('data', function(chunk) {
      chunks.push(chunk);
    });

    stream.on('end', function() {
      resolve(Buffer.concat(chunks));
    });
  });
}

exports.encrypt = function(inputKey, data) {
  var salt = crypto.randomBytesAsync(SALT_SIZE);

  var derive = Promise.join(inputKey, salt).spread(deriveKeyIV);

  var createCipher = derive.spread(function(key, iv) {
    return crypto.createCipher(ALGORITHM, key, iv);
  });

  var encryptData = createCipher.then(function(cipher) {
    cipher.end(data);
    return streamToBuffer(cipher);
  });

  return Promise.join(salt, encryptData);
};

exports.decrypt = function(inputKey, salt, data) {
  var derive = deriveKeyIV(inputKey, salt);

  var createDecipher = derive.spread(function(key, iv) {
    return crypto.createDecipher(ALGORITHM, key, iv);
  });

  var decryptData = createDecipher.then(function(decipher) {
    decipher.end(data);
    return streamToBuffer(decipher);
  });

  return decryptData;
};
