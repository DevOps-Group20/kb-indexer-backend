'use strict';

const { getPods, createJob } = require('./JobManager');
const indexersJson = require('../indexconfig/indexers.json');
/**
 * Returns list of all available indexers and their respective resource types
 *
 * returns List
 **/
exports.getIndexers = function () {
  return Object.entries(indexersJson).map(([key, value]) => ({name: key, sources: value}))
}


/**
 * Runs indexing pipline
 *
 * body Index_body Request indexer to execute with optional respecitive source (optional)
 * returns inline_response_200
 **/
exports.runIndexingPipeline = async function (body) {
  const pipeline_id = 'pipeline_id' in body ? body['pipeline_id'] : undefined
  
  createJob(pipeline_id);
  /**
   * TODO: This is where we need to implement the server events (event-stream)
   * TODO: there is some weird issue witht the return value being an empty object. maybe itll be fixed when we implement the actual backend
   */

  return { status: "Job Started" };
}

const { jobStatusEmitter } = require('./JobManager');

exports.subscribeToEvents = function (req, res) {

  // Set headers for SSE
  res.writeHead(200, {
    'Access-Control-Allow-Origin': '*',
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive'
  });

  // Keep the connection open by sending a comment every X seconds
  const intervalId = setInterval(() => {
    res.write(': keep-alive\n\n');
  }, 20000); // 20 seconds

  // Listen for job status updates and send them to the client
  jobStatusEmitter.on('jobStatusChanged', (jobStatus) => {
    res.write('event: jobStatusChanged')
    res.write(`data: ${JSON.stringify(jobStatus)}\n\n`);
    res.write(`id: ${counter}\n\n`); 
    counter++;
  });

  // Clean up when the client disconnects
  req.on('close', () => {
      // clearInterval(intervalId);
      jobStatusEmitter.removeAllListeners('jobStatusChanged');
  });
};