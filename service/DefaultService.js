'use strict';

const { getPods, createJob } = require('./JobManager');
/**
 * Returns list of all available indexers and their respective resource types
 *
 * returns List
 **/
exports.getIndexers = async function () {
  return [{
    "id": "046b6c7f-0b8a-43b9-b35d-6489e6daee91",
    "name": "Notebooks",
    "sources": [{
      "name": "Kaggle",
      "id": "046b6c7f-0b8a-43b9-b35d-6489e6daee91"
    }, {
      "name": "Kaggle",
      "id": "046b6c7f-0b8a-43b9-b35d-6489e6daee91"
    }],
    "name": "Notebooks",
    "id": "046b6c7f-0b8a-43b9-b35d-6489e6daee91"
  }, {
    "sources": [{
      "name": "Kaggle",
      "id": "046b6c7f-0b8a-43b9-b35d-6489e6daee91"
    }, {
      "name": "Kaggle",
      "id": "046b6c7f-0b8a-43b9-b35d-6489e6daee91"
    }],

  }];
}


/**
 * Runs indexing pipline
 *
 * body Index_body Request indexer to execute with optional respecitive source (optional)
 * returns inline_response_200
 **/
exports.runIndexingPipeline = async function (body) {
  console.log("indexer_id is", body['indexer_id']);
  console.log("source_id is", 'source_id' in body ? body['source_id'] : undefined);
  
  createJob(body['indexer_id'], 'source_id' in body ? body['source_id'] : undefined);
  /**
   * TODO: This is where we need to implement the server events (event-stream)
   * TODO: there is some weird issue witht the return value being an empty object. maybe itll be fixed when we implement the actual backend
   */

  return ({ "message": "message" });
}

const { jobStatusEmitter } = require('./JobManager');

exports.subscribeToEvents = function (req, res) {
  // Set headers for SSE
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive'
  });

  // Keep the connection open by sending a comment every X seconds
  const intervalId = setInterval(() => {
    res.write(': keep-alive\n\n');
  }, 20000); // 20 seconds

  jobStatusEmitter.on('jobStatusChanged', (jobStatus) => {
    res.write(`data: ${JSON.stringify(jobStatus)}\n\n`);
  });

  req.on('close', () => {
      clearInterval(intervalId);
      jobStatusEmitter.removeAllListeners('jobStatusChanged');
  });
};