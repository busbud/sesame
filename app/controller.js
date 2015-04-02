'use strict';

var R = require('ramda');
var Promise = require('bluebird');
var restify = require('restify');

var cipher = require('./cipher');
var vault = require('./vault');
var config = require('./config');

var UUID_REGEXP = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function validateData(req, res, next) {
  if (!req.params.data) {
    return next(new restify.InvalidContentError('No data'));
  }
  next();
}

function validateID(req, res, next) {
  if (req.params.id.length !== 36 || !UUID_REGEXP.test(req.params.id)) {
    return next(new restify.InvalidContentError('Invalid ID'));
  }
  next();
};

exports.post = [
  validateData,
  function(req, res, next) {
    var encryptionKey = config.encryptionKeys[0];
    var data = new Buffer(req.params.data, 'utf8');

    var encrypt = cipher.encrypt(encryptionKey.key, data);

    var create = Promise.join(
      config.databaseURL, encryptionKey.id, encrypt.get(0), encrypt.get(1)
    ).spread(vault.create);

    create
      .then(function(id) {
        var uri = config.baseURI + '/vault/' + id;
        res.set('Location', uri);
        res.send(201, uri);
      })
      .then(next, next);
  }
];

exports.get = [
  validateID,
  function(req, res, next) {
    vault.read(config.databaseURL, req.params.id)
      .then(function(row) {
        if (!row) throw new restify.ResourceNotFoundError('Resource not found');
        res.header('Last-Modified', row.updatedAt);
        req.row = row;
      })
      .then(next, next);
  },
  restify.conditionalRequest(),
  function(req, res, next) {
    var encryptionKey = R.find(R.propEq('id', req.row.keyID), config.encryptionKeys);
    if (!encryptionKey) {
      return next(new restify.ResourceNotFoundError('Resource not found'));
    }

    var decrypt = cipher.decrypt(encryptionKey.key, req.row.salt, req.row.data);

    decrypt
      .then(function(data) {
        var string = data.toString('utf8');
        res.send(200, string);
      })
      .then(next, next);
  }
];

exports.put = [
  validateID,
  validateData,
  function(req, res, next) {
    var encryptionKey = config.encryptionKeys[0];
    var data = new Buffer(req.params.data, 'utf8');

    var encrypt = cipher.encrypt(encryptionKey.key, data);

    var update = Promise.join(
      config.databaseURL,
      req.params.id,
      encryptionKey.id,
      encrypt.get(0),
      encrypt.get(1)
    ).spread(vault.update);

    update
      .then(function(success) {
        if (!success) throw new restify.ResourceNotFoundError('Resource not found');
        res.status(204);
        res.end();
      })
      .then(next, next);
  }
];

exports.delete = [
  validateID,
  function(req, res, next) {
    vault.delete(config.databaseURL, req.params.id)
      .then(function(success) {
        if (!success) throw new restify.ResourceNotFoundError('Resource not found');
        res.status(204);
        res.end();
      })
      .then(next, next);
  }
];
