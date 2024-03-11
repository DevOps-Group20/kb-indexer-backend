'use strict';

var utils = require('../utils/writer.js');
var Default = require('../service/DefaultService');

module.exports.getIndexers = function getIndexers (req, res, next) {
  Default.getIndexers()
    .then(resp => utils.writeJson(res, resp))
};

module.exports.runIndexingPipeline = function runIndexingPipeline (req, res, next, body) {
  Default.runIndexingPipeline(body)
    .then(resp => utils.writeJson(res, resp))
};

module.exports.subscribeToEvents = function subscribeToEvents(req, res, next) {
  Default.subscribeToEvents(req, res);
}

