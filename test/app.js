'use strict';

var assert = require('assert');

var R = require('ramda');
var Promise = require('bluebird');
var restify = require('restify');
Promise.promisifyAll(restify.StringClient.prototype);

var config = require('../app/config');

describe('App', function() {
  before(function() {
    config.loadObject({
      encryptionKeys: [{id: 't1', key: 'keyboardcat'}]
    });
  });

  before(function(done) {
    this.app = require('../app');
    this.app.listen(0, done);
  });

  before(function() {
    config.loadObject({baseURI: this.app.url});
    this.client = restify.createStringClient(this.app.url);
  });

  after(function() {
    this.app.close();
  });

  describe('POST /vault', function() {
    describe('without data', function() {
      it('returns 400 Bad Request', function() {
        return this.client.postAsync('/vault', {})
          .then(R.F).then(assert)
          .catch(restify.BadRequestError, R.T);
      });
    });

    describe('with data', function() {
      it('succeeds', function() {
        return this.request = this.client.postAsync('/vault', {data: 'test'});
      });

      it('returns 201 Created', function() {
        return this.request.spread(function(req, res, body) {
          assert.equal(res.statusCode, 201);
        });
      });

      it('sets Location header', function() {
        return this.request.spread(function(req, res, body) {
          assert(res.headers.location);
        });
      });

      it('sends URI in body', function() {
        return this.request.spread(function(req, res, body) {
          assert.equal(body, res.headers.location);
        });
      });

      after(function() {
        return this.request.get(2)
          .then(this.client.delAsync.bind(this.client));
      });
    });
  });

  describe('GET /vault/:id', function() {
    describe('with invalid ID', function() {
      it('returns 400 Bad Request', function() {
        return this.client.getAsync('/vault/1')
          .then(R.F).then(assert)
          .catch(restify.BadRequestError, R.T);
      });
    });

    describe('with missing row', function() {
      it('returns 404 Not Found', function() {
        return this.client.getAsync('/vault/475e8caa-3d34-4321-9ae5-ce5dbd7a3d35')
          .then(R.F).then(assert)
          .catch(restify.NotFoundError, R.T);
      });
    });

    describe('with missing encryption key', function() {
      before(function() {
        return this.createRequest = this.client.postAsync('/vault', {data: 'test'});
      });

      before(function() {
        config.loadObject({
          encryptionKeys: [{id: 't2', key: 'tacdraobyek'}]
        });
      });

      it('returns 404 Not Found', function() {
        return this.createRequest.get(2)
          .then(this.client.getAsync.bind(this.client))
          .then(R.F).then(assert)
          .catch(restify.NotFoundError, R.T);
      });

      after(function() {
        return this.createRequest.get(2)
          .then(this.client.delAsync.bind(this.client));
      });
    });

    describe('with valid ID', function() {
      before(function() {
        return this.createRequest = this.client.postAsync('/vault', {data: 'test'});
      });

      it('succeeds', function() {
        return this.request = this.createRequest.get(2)
          .then(this.client.getAsync.bind(this.client));
      });

      it('returns 200 OK', function() {
        return this.request.spread(function(req, res, body) {
          assert(res.statusCode, 200);
        });
      });

      it('sends data in body', function() {
        return this.request.spread(function(req, res, body) {
          assert.equal(body, 'test');
        });
      });

      after(function() {
        return this.createRequest.get(2)
          .then(this.client.delAsync.bind(this.client));
      });
    });
  });

  describe('PUT /vault/:id', function() {
    describe('with invalid ID', function() {
      it('returns 400 Bad Request', function() {
        return this.client.putAsync('/vault/1', {data: 'test'})
          .then(R.F).then(assert)
          .catch(restify.BadRequestError, R.T);
      });
    });

    describe('without data', function() {
      it('returns 400 Bad Request', function() {
        return this.client.putAsync('/vault/475e8caa-3d34-4321-9ae5-ce5dbd7a3d35', {})
          .then(R.F).then(assert)
          .catch(restify.BadRequestError, R.T);
      });
    });

    describe('with missing row', function() {
      it('returns 404 Not Found', function() {
        return this.client.putAsync('/vault/475e8caa-3d34-4321-9ae5-ce5dbd7a3d35', {data: 'test'})
          .then(R.F).then(assert)
          .catch(restify.NotFoundError, R.T);
      });
    });

    describe('with valid ID and data', function() {
      before(function() {
        return this.createRequest = this.client.postAsync('/vault', {data: 'test'});
      });

      it('succeeds', function() {
        return this.request = this.createRequest.bind(this).get(2)
          .then(function(uri) {
            return this.client.putAsync(uri, {data: 'new'});
          });
      });

      it('returns 204 No Content', function() {
        return this.request.spread(function(req, res, body) {
          assert.equal(res.statusCode, 204);
        });
      });

      after(function() {
        return this.createRequest.get(2)
          .then(this.client.delAsync.bind(this.client));
      });
    });
  });

  describe('DELETE /vault/:id', function() {
    describe('with invalid ID', function() {
      it('returns 400 Bad Request', function() {
        return this.client.delAsync('/vault/1')
          .then(R.F).then(assert)
          .catch(restify.BadRequestError, R.T);
      });
    });

    describe('with missing row', function() {
      it('returns 404 Not Found', function() {
        return this.client.delAsync('/vault/475e8caa-3d34-4321-9ae5-ce5dbd7a3d35')
          .then(R.F).then(assert)
          .catch(restify.NotFoundError, R.T);
      });
    });

    describe('with valid ID', function() {
      before(function() {
        return this.createRequest = this.client.postAsync('/vault', {data: 'test'});
      });

      it('succeeds', function() {
        return this.request = this.createRequest.get(2)
          .then(this.client.delAsync.bind(this.client));
      });

      it('returns 204 No Content', function() {
        return this.request.spread(function(req, res, body) {
          assert.equal(res.statusCode, 204);
        });
      });
    });
  });
});
