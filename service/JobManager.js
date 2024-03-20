const k8s = require('@kubernetes/client-node');

const fs = require('fs');
const uuid = require('uuid');

const path = require('path');

// Construct the absolute path to the JSON file
const jsonPath = path.join(__dirname, '..', 'indexconfig', 'indexers_id.json');
const indexers = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));

let kc, k8sApi, batchV1Api;

exports.setupK8S = function () {
    kc = new k8s.KubeConfig();
    kc.loadFromDefault();
    k8sApi = kc.makeApiClient(k8s.CoreV1Api);
    batchV1Api = kc.makeApiClient(k8s.BatchV1Api);
    //const jobYaml = fs.readFileSync('./service/job.yaml', 'utf8');
    //job = k8s.loadYaml(jobYaml);
    watchAllJobsStatus();
    console.log("K8S API client initialized");
};

exports.getPods = async function () {
    console.log("Getting pods 🔋");
    try {
        const podsRes = await k8sApi.listNamespacedPod('default');
        console.log(podsRes.body);
    } catch (err) {
        console.log("Error getting pods ❌");
        console.error(err);
    }
};



exports.createJob = async function (pipeline_id) {
    // Define the command arguments for the specific kb-indexer task
    


    let additionalCommand = "";
    try {
        const indexer = indexers[pipeline_id];
        if (indexer) {
            additionalCommand = indexer;
        } else {
            return {message:`No indexer found for pipeline_id: ${pipeline_id}`, code:404};
        }
    } catch (err) {
        return {message:'Error reading indexers.json:', code:500};
    }

    let mkdirCommand = 'mkdir -p /app/data';
    let fullCommandString = `${mkdirCommand} && ${additionalCommand}`;

    let finalCommand = ['sh', '-c', fullCommandString];
    console.log('Executing: ', finalCommand.join(" "));

    let jobName = `kb-indexer-${uuid.v4()}`;

    let envVars = [
        { name: 'DATA_DIR', value: '/app/data' },
        { name: 'ELASTICSEARCH_HOST', value: 'http://kms-elasticsearch.kms.svc.cluster.local:9200' },
        { name: 'ELASTICSEARCH_USERNAME', valueFrom: { secretKeyRef: { name: 'kb-indexer-secrets', key: 'ELASTICSEARCH_USERNAME' }}},
        { name: 'ELASTICSEARCH_PASSWORD', valueFrom: { secretKeyRef: { name: 'kb-indexer-secrets', key: 'ELASTICSEARCH_PASSWORD' }}},
        { name: 'KAGGLE_USERNAME', valueFrom: { secretKeyRef: { name: 'kb-indexer-secrets', key: 'KAGGLE_USERNAME' }}},
        { name: 'KAGGLE_KEY', valueFrom: { secretKeyRef: { name: 'kb-indexer-secrets', key: 'KAGGLE_KEY' }}},
        { name: 'GITHUB_API_TOKEN', valueFrom: { secretKeyRef: { name: 'kb-indexer-secrets', key: 'GITHUB_API_TOKEN' }}}
    ];

    // Construct the Kubernetes job object
    let job = {
        apiVersion: 'batch/v1',
        kind: 'Job',
        metadata: {
            name: jobName,
            labels: {
                pipeline_id: pipeline_id
            }
        },
        spec: {
            ttlSecondsAfterFinished: 3600,
            template: {
                spec: {
                    containers: [{
                        name: 'kb-indexer-container',
                        image: 'philippsommer27/kb-indexer', 
                        command: finalCommand,
                        env: envVars
                    }],
                    restartPolicy: 'Never'
                }
            },
            backoffLimit: 1
        }
    };

    try {
        // Check for existing jobs with the same labels
        const labelSelector = `pipeline_id=${pipeline_id}`;
        const existingJobs = await batchV1Api.listNamespacedJob('default', null, null, null, null, labelSelector);

        if (existingJobs.body.items.length > 0) {
            // Check if any of the existing jobs have failed
            const actionableJob = existingJobs.body.items.find(job => {
                const status = job.status;
                return (status && (status.failed || status.succeeded));
            });
        
            if (actionableJob) {
                // Logic to restart the actionable job (either failed or completed)
                await batchV1Api.deleteNamespacedJob(actionableJob.metadata.name, 'default');
                let response = await batchV1Api.createNamespacedJob('default', job);
                return {message: 'Job restarted', code: 200};
            } else {
                return {message: 'A job with the same pipeline_id is already running', code: 409};
            }
        }

        // Create the Kubernetes job
        let response = await batchV1Api.createNamespacedJob('default', job);
        return {message: 'Job created', code: 200};
    } catch (err) {
        return {message: 'Error in job creation:', code: 500};
    }
};

exports.createCronJob = async function (pipeline_id, cronSchedule) {
    let additionalCommand = "";
    try {
        const indexer = indexers[pipeline_id];
        if (indexer) {
            additionalCommand = indexer;
        } else {
            return {message:`No indexer found for pipeline_id: ${pipeline_id}`, code:404};
        }
    } catch (err) {
        return {message:'Error reading indexers.json:', code:500};
    }

    let mkdirCommand = 'mkdir -p /app/data';
    let fullCommandString = `${mkdirCommand} && ${additionalCommand}`;

    let finalCommand = ['sh', '-c', fullCommandString];
    console.log('Executing: ', finalCommand.join(" "));

    let cronJobName = `kb-indexer-cron-${uuid.v4()}`;

    let envVars = [
        { name: 'DATA_DIR', value: '/app/data' },
        { name: 'ELASTICSEARCH_HOST', value: 'http://kms-elasticsearch.kms.svc.cluster.local:9200' },
        { name: 'ELASTICSEARCH_USERNAME', valueFrom: { secretKeyRef: { name: 'kb-indexer-secrets', key: 'ELASTICSEARCH_USERNAME' }}},
        { name: 'ELASTICSEARCH_PASSWORD', valueFrom: { secretKeyRef: { name: 'kb-indexer-secrets', key: 'ELASTICSEARCH_PASSWORD' }}},
        { name: 'KAGGLE_USERNAME', valueFrom: { secretKeyRef: { name: 'kb-indexer-secrets', key: 'KAGGLE_USERNAME' }}},
        { name: 'KAGGLE_KEY', valueFrom: { secretKeyRef: { name: 'kb-indexer-secrets', key: 'KAGGLE_KEY' }}},
        { name: 'GITHUB_API_TOKEN', valueFrom: { secretKeyRef: { name: 'kb-indexer-secrets', key: 'GITHUB_API_TOKEN' }}}
    ];

    let cronJob = {
        apiVersion: 'batch/v1',
        kind: 'CronJob',
        metadata: {
            name: cronJobName,
            labels: {
                pipeline_id: pipeline_id
            }
        },
        spec: {
            schedule: cronSchedule,
            jobTemplate: {
                spec: {
                    ttlSecondsAfterFinished: 3600,
                    template: {
                        spec: {
                            containers: [{
                                name: 'kb-indexer-container',
                                image: 'philippsommer27/kb-indexer', 
                                command: finalCommand,
                                env: envVars
                            }],
                            restartPolicy: 'Never'
                        }
                    },
                    backoffLimit: 1
                }
            }
        }
    };

    try {
        // Check for existing cron jobs with the same labels
        const labelSelector = `pipeline_id=${pipeline_id}`;
        const existingCronJobs = await batchV1Api.listNamespacedCronJob('default', null, null, null, null, labelSelector);

        if (existingCronJobs.body.items.length > 0) {
            // Logic to handle existing cron job
            // Depending on your requirements, you may want to update the existing cron job,
            // delete and recreate it, or simply return an error message.

            // For simplicity, the following code deletes the old cron job and creates a new one
            await batchV1Api.deleteNamespacedCronJob(existingCronJobs.body.items[0].metadata.name, 'default');
            let response = await batchV1Api.createNamespacedCronJob('default', cronJob);
            return {message: 'Existing CronJob replaced', code: 200};
        } else {
            // Create the Kubernetes cron job
            let response = await batchV1Api.createNamespacedCronJob('default', cronJob);
            return {message: 'CronJob created', code: 200};
        }
    } catch (err) {
        console.log(err);
        return {message: `Error in cron job creation: ${JSON.stringify(err)}`, code: 500};
    }
};


const { EventEmitter } = require('events');
const jobStatusEmitter = new EventEmitter();

const watchAllJobsStatus = function() {
    const watch = new k8s.Watch(kc);
    const path = '/apis/batch/v1/namespaces/default/jobs';

    watch.watch(path, 
        {},
        // callback for when a change is detected
        (type, apiObj, watchObj) => {

            if (type === 'ADDED' || type === 'MODIFIED') {
                jobStatusEmitter.emit('jobStatusChanged', apiObj);
            }
        },
        // callback for any errors
        (err) => {
            console.error(err);
        }
    );

    const cronJobsPath = '/apis/batch/v1/namespaces/default/cronjobs';

    watch.watch(cronJobsPath,
        {},
        // callback for when a cron job change is detected
        (type, apiObj, watchObj) => {
            if (type === 'ADDED' || type === 'MODIFIED' || type === 'DELETED') {
                jobStatusEmitter.emit('cronJobStatusChanged', apiObj);
            }
        },
        (err) => { console.error(err); }
    );
};

exports.getAllJobsStatus = async function () {
    let jobStatuses = [];

    try {
        // Fetch all jobs in the specified namespace
        const { body } = await batchV1Api.listNamespacedJob('default'); // Replace 'default' with your namespace if different
        const jobs = body.items;

        // Extract the status and pipeline_id for each job
        jobStatuses = jobs.map(job => ({
            name: job.metadata.name,
            status: job.status, // You can further refine what you extract from the status
            pipeline_id: job.metadata.labels ? job.metadata.labels.pipeline_id : null
        }));

    } catch (error) {
        console.error('Error fetching job statuses:', error);
    }

    return jobStatuses;
};

exports.getAllCronJobsStatus = async function () {
    let cronJobStatuses = [];

    try {
        // Fetch all cron jobs in the specified namespace
        const { body } = await batchV1Api.listNamespacedCronJob('default'); // Replace 'default' with your namespace if different
        const cronJobs = body.items;

        // Extract relevant information for each cron job
        cronJobStatuses = cronJobs.map(cronJob => ({
            name: cronJob.metadata.name,
            schedule: cronJob.spec.schedule, // The schedule on which the job runs
            lastScheduleTime: cronJob.status.lastScheduleTime, // Time when last job was scheduled
            activeJobs: cronJob.status.active ? cronJob.status.active.length : 0, // Number of active jobs spawned by this cron job
            pipeline_id: cronJob.metadata.labels ? cronJob.metadata.labels.pipeline_id : null
        }));

    } catch (error) {
        console.error('Error fetching cron job statuses:', error);
    }

    return cronJobStatuses;
};


exports.restartJobsFromTasks = async function () {
    console.log('Restarting jobs from tasks...');
    const tasksPath = path.join(__dirname, '..', 'indexconfig', 'reindexing_tasks.txt');

    try {
        const pipelineIds = fs.readFileSync(tasksPath, 'utf8').split('\n').filter(Boolean);

        for (const pipeline_id of pipelineIds) {
            const labelSelector = `pipeline_id=${pipeline_id}`;
            const existingJobs = await batchV1Api.listNamespacedJob('default', null, null, null, null, labelSelector);

            if (existingJobs.body.items.length > 0) {
                for (const job of existingJobs.body.items) {
                    await batchV1Api.deleteNamespacedJob(job.metadata.name, 'default');
                }
            }
            const restartResponse = await exports.createJob(pipeline_id);
            console.log(restartResponse);
        }
    } catch (err) {
        console.error('Error in restarting jobs from tasks:', err);
    }
};


// Export the emitter so other modules can listen to it
exports.jobStatusEmitter = jobStatusEmitter;
