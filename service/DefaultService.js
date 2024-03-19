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
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin':'*'
  });

  // Send the current status of all jobs as the first message
  getAllJobsStatus().then(allJobsStatus => {
    res.write(`data: ${JSON.stringify(allJobsStatus)}\n\n`);
  }).catch(error => {
    console.error('Error fetching initial job statuses:', error);
  });

  // Keep the connection open by sending a comment every 20 seconds
  const intervalId = setInterval(() => {
    res.write(': keep-alive\n\n');
  }, 20000);

  // Listen for job status updates and send them to the client
  jobStatusEmitter.on('jobStatusChanged', (jobStatus) => {
    res.write(`data: ${JSON.stringify(jobStatus)}\n\n`);
  });

  // Clean up when the client disconnects
  req.on('close', () => {
    clearInterval(intervalId);
    jobStatusEmitter.removeAllListeners('jobStatusChanged');
  });
};