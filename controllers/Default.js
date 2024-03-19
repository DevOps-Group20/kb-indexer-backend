'use strict';

var utils = require('../utils/writer.js');
var Default = require('../service/DefaultService');
const { verifyToken, verifyTokenString } = require('../utils/authenticate.js');



exports.runIndexingPipeline = async function runIndexingPipeline (req, res) {
  if (await verifyToken(req)) {
    Default.runIndexingPipeline(req.body)
      .then(resp => utils.writeJson(res, resp, 200));
  } else {
    utils.writeJson(res, { error: "Unauthorized access. Please provide a valid token." }, 401)
  }

};

exports.subscribeToEvents = async function subscribeToEvents(req, res) {
  Default.subscribeToEvents(req, res);
  /*
  // Extract token from query parameters
  const token = req.query.token;

  if (!token) {
    utils.writeJson(res, { error: "No token provided." }, 400);
    return;
  }

  if (await verifyTokenString(token)) {
    // If the token is valid, proceed with setting up the event stream
    Default.subscribeToEvents(req, res);
  } else {
    // If the token is invalid, return an unauthorized error
    utils.writeJson(res, { error: "Unauthorized access. Please provide a valid token." }, 401);
  }
  */
};

exports.getIndexers = async function getIndexers(req, res) {
  if (await verifyToken(req)) {
    utils.writeJson(res, Default.getIndexers(), 200);
  } else {
    utils.writeJson(res, { error: "Unauthorized access. Please provide a valid token." }, 401);
  }
};

