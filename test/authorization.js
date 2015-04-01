'use strict';

var assert = require('assert');

var R = require('ramda');
var Promise = require('bluebird');
var restify = require('restify');
Promise.promisifyAll(restify.StringClient.prototype);

var authorization = require('../app/authorization');

describe('Authorization middleware', function() {
  before(function(done) {
    this.app = restify.createServer();
    this.app.use(restify.authorizationParser());
    this.app.use(authorization({'key': 'user'}));
    this.app.get('/', function(req, res, next) {
      res.send('test');
      next();
    });
    this.app.listen(0, done);
  });

  after(function() {
    this.app.close();
  });

  describe('without authorization', function() {
    it('returns UnauthorizedError', function() {
      var client = restify.createStringClient(this.app.url);
      return client.getAsync('/')
        .then(R.F).then(assert)
        .catch(restify.UnauthorizedError, R.T);
    });
  });

  describe('with invalid API key', function() {
    it('returns UnauthorizedError', function() {
      var client = restify.createStringClient(this.app.url);
      client.basicAuth('user', 'invalid');
      return client.getAsync('/')
        .then(R.F).then(assert)
        .catch(restify.UnauthorizedError, R.T);
    });
  });

  describe('with mismatched username', function() {
    it('returns UnauthorizedError', function() {
      var client = restify.createStringClient(this.app.url);
      client.basicAuth('mismatch', 'key');
      return client.getAsync('/')
        .then(R.F).then(assert)
        .catch(restify.UnauthorizedError, R.T);
    });
  });

  describe('with authorization', function() {
    it('passes through', function() {
      var client = restify.createStringClient(this.app.url);
      client.basicAuth('user', 'key');
      return client.getAsync('/');
    });
  });
});
