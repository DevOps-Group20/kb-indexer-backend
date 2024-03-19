'use strict';

var utils = require('../utils/writer.js');
var Default = require('../service/DefaultService');
const { verifyToken, verifyTokenString } = require('../utils/authenticate.js');



exports.runIndexingPipeline = async function runIndexingPipeline (req, res) {
  if (await verifyToken(req)) {
    Default.runIndexingPipeline(req.body)
      .then(resp => utils.writeJson(res, { message: resp.message }, resp.code));
  } else {
    utils.writeJson(res, { error: "Unauthorized access. Please provide a valid token." }, 401)
  }

};

exports.subscribeToEvents = async function subscribeToEvents(req, res) {
  Default.subscribeToEvents(req, res);
  // if (await verifyToken(req)) {
  //   console.log(req.headers);
  //   Default.subscribeToEvents(req, res);
  // } else {
  //   utils.writeJson(res, { error: "Unauthorized access. Please provide a valid token." }, 401);
  // }

}

exports.getIndexers = async function getIndexers(req, res) {
  if (await verifyToken(req)) {
    utils.writeJson(res, Default.getIndexers(), 200);
  } else {
    utils.writeJson(res, { error: "Unauthorized access. Please provide a valid token." }, 401);
  }
};

