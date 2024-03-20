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

let clients = []; // This will hold active clients

function broadcastEvent(eventType, data) {
    console.log("broadcast");
    clients.forEach(client => {
        client.res.write(`event: ${eventType}\n`);
        client.res.write(`data: ${JSON.stringify(data)}\n\n`);
        client.res.write(`id: ${client.counter}\n\n`);
    });
}

// Setup the shared listeners
jobStatusEmitter.on('jobStatusChanged', jobStatus => {
    broadcastEvent('jobStatusChanged', jobStatus);
});

jobStatusEmitter.on('cronJobStatusChanged', cronJobStatus => {
    broadcastEvent('cronJobStatusChanged', cronJobStatus);
});

let counter = 0;

exports.subscribeToEvents = async function (req, res) {
    // Set headers for SSE
    res.writeHead(200, {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive'
    });
    counter++;
    const client = { req, res, counter};
    clients.push(client);

    // Send initial data to the client
    const jobsStatus = await getAllJobsStatus();
    const cronJobsStatus = await getAllCronJobsStatus();
    const response = { jobs: jobsStatus, cronJobs: cronJobsStatus };
    res.write(`data: ${JSON.stringify(response)}\n\n`);
    res.write(`id: ${client.counter}\n\n`);

    // Clean up when the client disconnects
    req.on('close', () => {
        clients = clients.filter(c => c !== client);
    });
};
