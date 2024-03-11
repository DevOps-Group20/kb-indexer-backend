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

exports.createJob = async function (indexer_id, source_id) {
    let commandArgs = ["print bpi(2000)"];
    let jobName = `pi-${uuid.v4()}`;
    
    // Construct the job object with labels
    let job = {
        apiVersion: 'batch/v1',
        kind: 'Job',
        metadata: {
            name: jobName,
            labels: {
                indexer_id: indexer_id,
                source_id: source_id
            }
        },
        spec: {
            ttlSecondsAfterFinished: 3600,
            template: {
                spec: {
                    containers: [{
                        name: 'pi',
                        image: 'perl:5.34.0',
                        command: ['perl', '-Mbignum=bpi', '-wle', ...commandArgs]
                    }],
                    restartPolicy: 'Never'
                }
            },
            backoffLimit: 4
        }
    };

    try {
        const labelSelector = `indexer_id=${indexer_id},source_id=${source_id}`;
        const existingJobs = await batchV1Api.listNamespacedJob('default', null, null, null, null, labelSelector);

        if (existingJobs.body.items.length > 0) {
            console.log('A job with the same indexer_id and source_id already exists');
            return; 
        }

        let response = await batchV1Api.createNamespacedJob('default', job);
        console.log('Job created:', response.body);
    } catch (err) {
        console.error('Error in job creation:', err);
    }
};
