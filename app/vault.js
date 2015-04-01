'use strict';

var Promise = require('bluebird');
var pg = require('pg');
Promise.promisifyAll(pg);
Promise.promisifyAll(pg.Client.prototype);

// Get a Disposer for a pg connection.
function getConnection(connectionString) {
  var dispose;
  return pg.connectAsync(connectionString)
    .spread(function(client, done) {
      dispose = done;
      return client;
    })
    .disposer(function() {
      if (dispose) dispose();
    });
}

// Create a vault entry and return its ID.
var CREATE_SQL = [
  'INSERT INTO vault (key_id, salt, data)',
  'VALUES ($1, $2, $3)',
  'RETURNING id'
].join(' ');
exports.create = function(connectionString, keyID, salt, data) {
  return Promise.using(getConnection(connectionString), function(client) {
    return client.queryAsync(CREATE_SQL, [keyID, salt, data]);
  }).then(function(result) {
    return result.rows[0].id;
  });
};

// Find a vault entry by ID and return its ID, keyID, salt and data.
var READ_SQL = [
  'UPDATE vault',
  'SET accessed_at = now()',
  'WHERE id = $1',
  'RETURNING id, key_id AS "keyID", salt, data'
].join(' ');
exports.read = function(connectionString, id) {
  return Promise.using(getConnection(connectionString), function(client) {
    return client.queryAsync(READ_SQL, [id]);
  }).then(function(result) {
    if (result.rowCount === 0) return null;
    return result.rows[0];
  });
};

// Update a vault entry by ID. Returns boolean indicating success.
var UPDATE_SQL = [
  'UPDATE vault',
  'SET key_id = $2, salt = $3, data = $4, updated_at = now()',
  'WHERE id = $1'
].join(' ');
exports.update = function(connectionString, id, keyID, salt, data) {
  return Promise.using(getConnection(connectionString), function(client) {
    return client.queryAsync(UPDATE_SQL, [id, keyID, salt, data]);
  }).then(function(result) {
    return (result.rowCount === 1);
  });
};

// Delete a vault entry by ID. Returns boolean indicating success.
var DELETE_SQL = [
  'DELETE FROM vault',
  'WHERE id = $1'
].join(' ');
exports.delete = function(connectionString, id) {
  return Promise.using(getConnection(connectionString), function(client) {
    return client.queryAsync(DELETE_SQL, [id]);
  }).then(function(result) {
    return (result.rowCount === 1);
  });
};
