'use strict';

const { getPods, createJob, getAllJobsStatus, createCronJob, getAllCronJobsStatus } = require('./JobManager');
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
  const pipeline_id = 'pipeline_id' in body ? body['pipeline_id'] : undefined;
  const schedule = 'schedule' in body ? body['schedule'] : undefined

  if(schedule) {
    return createCronJob(pipeline_id, schedule);
  }
  
  return createJob(pipeline_id);
}



const { jobStatusEmitter } = require('./JobManager');
const s = require('swagger-express-middleware');

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
  const jobsStatus = await getAllJobsStatus();
  const cronJobsStatus = await getAllCronJobsStatus();

  // Constructing the response object
  const response = {
      jobs: jobsStatus,
      cronJobs: cronJobsStatus
  };

  // Converting the response object to a JSON string
  const jsonResponse = JSON.stringify(response);

  // Logging the response
  res.write(`data: ${jsonResponse}\n\n`);
  res.write(`id: ${counter}\n\n`); 

  
  counter++;

  
  // Listen for job status updates and send them to the client
  jobStatusEmitter.on('jobStatusChanged', (jobStatus) => {
    console.log("fire event");
    res.write('event: jobStatusChanged\n')
    res.write(`data: ${JSON.stringify(jobStatus)}\n\n`);
    res.write(`id: ${counter}\n\n`); 
    counter++;
  });

  jobStatusEmitter.on('cronJobStatusChanged', (jobStatus) => {
    console.log("fire cron event");
    res.write('event: cronJobStatusChanged\n')
    res.write(`data: ${JSON.stringify(jobStatus)}\n\n`);
    res.write(`id: ${counter}\n\n`); 
    counter++;
  });

  // Clean up when the client disconnects
  req.on('close', () => {
      jobStatusEmitter.removeAllListeners('jobStatusChanged');
  });
};