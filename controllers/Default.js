'use strict';

var utils = require('../utils/writer.js');
var Default = require('../service/DefaultService');
const { verifyToken } = require('../utils/authenticate.js');

module.exports.getIndexers = async function getIndexers(req, res, next) {
  if (await verifyToken(req)) {
    utils.writeJson(res, { message: 'Success'}, 200);
  } else {
    utils.writeJson(res, { error: "Unauthorized access. Please provide a valid token." }, 401)
  }
};

module.exports.runIndexingPipeline = function runIndexingPipeline (req, res, next, body) {
  Default.runIndexingPipeline(body)
    .then(resp => utils.writeJson(res, resp))
  next();
};

module.exports.subscribeToEvents = function subscribeToEvents(req, res, next) {
  Default.subscribeToEvents(req, res);
}

