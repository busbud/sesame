'use strict';

var assert = require('assert');
var crypto = require('crypto');

var Promise = require('bluebird');
Promise.promisifyAll(crypto);

var cipher = require('../app/cipher');

describe('Cipher', function() {
  before(function() {
    this.key = crypto.randomBytesAsync(16).call('toString', 'hex');
    this.plaintext = crypto.randomBytesAsync(512);
    return Promise.join(this.key, this.plaintext);
  });

  it('encrypts', function() {
    var encrypt = Promise.join(this.key, this.plaintext).spread(cipher.encrypt);
    this.salt = encrypt.get(0);
    this.ciphertext = encrypt.get(1);
    return Promise.join(this.salt, this.ciphertext);
  });

  it('decrypts', function() {
    var decrypt = Promise.join(this.key, this.salt, this.ciphertext).spread(cipher.decrypt)
    return Promise.join(this.plaintext, decrypt).spread(assert.deepEqual);
  });

  it('produces distinct ciphertext', function() {
    var encrypt = Promise.join(this.key, this.plaintext).spread(cipher.encrypt);
    return Promise.join(encrypt.get(1), this.ciphertext).spread(assert.notDeepEqual);
  });
});
