'use strict';

var os = require('os');

var R = require('ramda');
var Promise = require('bluebird');
var pg = require('pg');
var Cursor = require('pg-cursor');
Promise.promisifyAll(pg);
Promise.promisifyAll(Cursor.prototype);

// Load configuration.
require('../app');
var config = require('../app/config');
var cipher = require('../app/cipher');
var vault = require('../app/vault');

var UPDATE_QUERY = [
  'UPDATE vault',
  'SET key_id = $2, salt = $3, data = $4',
  'WHERE id = $1'
].join(' ');

// Decrypt and re-encrypt a vault row.
function reEncrypt(decryptionKey, encryptionKey, row) {
  var encrypt = cipher.decrypt(decryptionKey.key, row.salt, row.data)
    .then(R.partial(cipher.encrypt, encryptionKey.key));

  return Promise.using(vault.getConnection(config.databaseURL), function (client) {
    return encrypt.spread(function(salt, data) {
      return client.queryAsync({
        name: 'rotate_update',
        text: UPDATE_QUERY,
        values: [row.id, encryptionKey.id, salt, data]
      });
    });
  });
}

var SELECT_QUERY = [
  'SELECT id, key_id AS "keyID", salt, data',
  'FROM vault',
  'WHERE key_id != $1'
].join(' ');

Promise.using(vault.getConnection(config.databaseURL), function(client) {
  var encryptionKey = config.encryptionKeys[0];

  var cursor = client.query(new Cursor(SELECT_QUERY, [encryptionKey.id]));

  var readChunk = function() {
    return cursor.readAsync(os.cpus().length).map(function(row) {
      var decryptionKey = R.find(R.propEq('id', row.keyID), config.encryptionKeys);
      return reEncrypt(decryptionKey, encryptionKey, row);
    }).then(function(updates) {
      // Continue reading until we get zero rows.
      if (updates.length) return readChunk();
    });
  };

  return readChunk();
});
