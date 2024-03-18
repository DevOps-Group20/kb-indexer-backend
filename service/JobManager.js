const k8s = require('@kubernetes/client-node');

const fs = require('fs');
const uuid = require('uuid');

let kc, k8sApi, batchV1Api;

exports.setupK8S = async function () {
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
    let commandArgs = ['notebook', '-r', 'Kaggle', 'index']; // Example: running the full API indexing pipeline

    // Generate a unique job name
    let jobName = `kb-indexer-${uuid.v4()}`;

    // Set the required environment variables for the kb-indexer container
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
                        image: 'qcdis/kb-indexer', 
                        command: ['kb_indexer', ...commandArgs],
                        env: envVars
                    }],
                    restartPolicy: 'Never'
                }
            },
            backoffLimit: 4
        }
    };

    try {
        // Check for existing jobs with the same labels
        const labelSelector = `pipeline_id=${pipeline_id}`;
        const existingJobs = await batchV1Api.listNamespacedJob('default', null, null, null, null, labelSelector);

        if (existingJobs.body.items.length > 0) {
            console.log('A job with the same pipeline_id already exists');
            return;
        }

        // Create the Kubernetes job
        let response = await batchV1Api.createNamespacedJob('default', job);
        console.log('Job created:', response.body);
    } catch (err) {
        console.error('Error in job creation:', err);
    }
};

// Example usage
// createJob('some-indexer-id', 'some-source-id').then(() => console.log('Job creation initiated.'));


const { EventEmitter } = require('events');
const jobStatusEmitter = new EventEmitter();

exports.watchJobStatus = function(jobName) {
    const watch = new k8s.Watch(kc);
    const path = `/apis/batch/v1/namespaces/default/jobs/${jobName}/status`;

    watch.watch(path, 
        // optional query parameters can go here.
        {},
        // callback for when a change is detected
        (type, apiObj, watchObj) => {
            if (type === 'ADDED' || type === 'MODIFIED') {
                console.log('Job status changed');
                jobStatusEmitter.emit('jobStatusChanged', apiObj);
            }
        },
        // callback for any errors
        (err) => {
            console.error(err);
        }
    );
    
    // Optional: handle watch termination, etc.
};
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

    // Optional: handle watch termination, etc.
};
// Export the emitter so other modules can listen to it
exports.jobStatusEmitter = jobStatusEmitter;
