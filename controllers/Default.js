'use strict';

var utils = require('../utils/writer.js');
var Default = require('../service/DefaultService');

module.exports.getIndexers = function getIndexers (req, res, next) {
  console.log(res);
  utils.writeJson(res, Default.getIndexers())

  
};

module.exports.runIndexingPipeline = function runIndexingPipeline (req, res, next, body) {
  Default.runIndexingPipeline(body)
    .then(resp => utils.writeJson(res, resp))
  next();
};

module.exports.subscribeToEvents = function subscribeToEvents(req, res, next) {
  Default.subscribeToEvents(req, res);
}

