'use strict';

var assert = require('assert');
var crypto = require('crypto');

var R = require('ramda');
var Promise = require('bluebird');
Promise.promisifyAll(crypto);

require('../app'); // Load configuration
var config = require('../app/config');
var vault = require('../app/vault');

describe('Vault', function() {
  before(function() {
    this.keyID = crypto.randomBytesAsync(2).call('toString', 'hex');
    this.salt = crypto.randomBytesAsync(16);
    this.data = crypto.randomBytesAsync(512);
  });

  it('creates', function() {
    return this.id = Promise.join(
      config.databaseURL, this.keyID, this.salt, this.data
    ).spread(vault.create);
  });

  it('reads', function() {
    var read = Promise.join(config.databaseURL, this.id).spread(vault.read);
    return Promise.join(
      read, this.id, this.keyID, this.salt, this.data,
      function(entry, id, keyID, salt, data) {
        assert.equal(entry.id, id);
        assert.equal(entry.keyID, keyID);
        assert.deepEqual(entry.salt, salt);
        assert.deepEqual(entry.data, data);
      }
    );
  });

  it('updates', function() {
    return Promise.join(config.databaseURL, this.id, this.keyID, this.salt, this.data)
      .spread(vault.update)
      .then(assert);
  });

  it('deletes', function() {
    return Promise.join(config.databaseURL, this.id)
      .spread(vault.delete)
      .then(assert);
  });

  describe('with missing entry', function() {
    it('read returns null', function() {
      return Promise.join(config.databaseURL, this.id)
        .spread(vault.read)
        .then(R.eq(null))
        .then(assert);
    });

    it('update returns false', function() {
      return Promise.join(config.databaseURL, this.id, this.keyID, this.salt, this.data)
        .spread(vault.update)
        .then(R.not)
        .then(assert);
    });

    it('delete returns false', function() {
      return Promise.join(config.databaseURL, this.id)
        .spread(vault.delete)
        .then(R.not)
        .then(assert);
    });
  });
});
