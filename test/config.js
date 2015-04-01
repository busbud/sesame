'use strict';

var assert = require('assert');

var config = require('../app/config');

describe('Configuration', function() {
  describe('loadObject', function() {
    it('automatically sets base URI', function() {
      config.loadObject({port: 8888});
      assert.equal(config.baseURI, 'http://localhost:8888');
    });
  });

  describe('loadEnvironment', function() {
    describe('ENCRYPTION_KEYS', function() {
      it('parses configuration', function() {
        config.loadEnvironment({
          ENCRYPTION_KEYS: 't1:a,t2:b'
        });

        assert.equal(config.encryptionKeys.length, 2);
        assert.deepEqual(config.encryptionKeys[0], {id: 't1', key: 'a'});
        assert.deepEqual(config.encryptionKeys[1], {id: 't2', key: 'b'});
      });
    });

    describe('API_KEY_*', function() {
      it('parses configuration', function() {
        config.loadEnvironment({
          API_KEY_CLIENT_A: 'a',
          API_KEY_CLIENT_B: 'b'
        });

        assert.equal(config.apiKeys.a, 'client_a');
        assert.equal(config.apiKeys.b, 'client_b');
      });
    });
  });
})
