'use strict';

var restify = require('restify');

module.exports = function(apiKeys) {
  return function(req, res, next) {
    var authorized =
      req.authorization &&
      req.authorization.basic &&
      apiKeys.hasOwnProperty(req.authorization.basic.password) &&
      req.authorization.basic.username === apiKeys[req.authorization.basic.password];

    if (authorized) return next();
    next(new restify.UnauthorizedError('Invalid API key'));
  };
};
