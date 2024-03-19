'use strict';

const { getPods, createJob, getAllJobsStatus } = require('./JobManager');
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
  
  let response = createJob(pipeline_id);
  /**
   * TODO: This is where we need to implement the server events (event-stream)
   * TODO: there is some weird issue witht the return value being an empty object. maybe itll be fixed when we implement the actual backend
   */

  return response;
}



const { jobStatusEmitter } = require('./JobManager');

exports.subscribeToEvents = async function (req, res) {

  let counter = 0;

  // Set headers for SSE
  res.writeHead(200, {
    'Access-Control-Allow-Origin': '*',
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive'
  });

  res.write('event: connected\n');
  res.write(`data: ${JSON.stringify(await getAllJobsStatus())}\n\n`);
  res.write(`id: ${counter}\n\n`); 

  
  counter++;

  
  // Listen for job status updates and send them to the client
  jobStatusEmitter.on('jobStatusChanged', (jobStatus) => {
    console.log(jobStatus);
    res.write('event: jobStatusChanged\n')
    res.write(`data: ${JSON.stringify(jobStatus)}\n\n`);
    res.write(`id: ${counter}\n\n`); 
    counter++;
  });

  // Clean up when the client disconnects
  req.on('close', () => {
      jobStatusEmitter.removeAllListeners('jobStatusChanged');
  });
};