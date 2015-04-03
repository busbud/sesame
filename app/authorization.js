'use strict';

var restify = require('restify');

module.exports = function(apiKeys) {
  return function(req, res, next) {
    var authorized =
      req.authorization &&
      req.authorization.basic &&
      apiKeys.hasOwnProperty(req.authorization.basic.username) &&
      req.authorization.basic.password === apiKeys[req.authorization.basic.username];

    if (authorized) return next();
    next(new restify.UnauthorizedError('Invalid API key'));
  };
};
