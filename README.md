## Project Overview

This project is a backend service for a web application that retrieves research assets and stores data in an Elasticsearch database. The backend is designed to handle multiple indexing pipeline jobs and uses Firebase authentication to enable secure requests to the frontend.

The backend service is deployed to a Kubernetes cluster using several deployment workflows. These workflows include deploying the backend image, setting up necessary secrets, and configuring a load balancer. They can be found in `.github/workflows/`

## Deployment Details

The backend service is deployed using a Kubernetes Deployment, as defined in `kb-indexer-backend-deployment.yaml`. The deployment specifies a single replica of the backend service, which uses the Docker image from Docker Hub. The service listens on port 8090 and is configured with a couple of environment variables.

The service uses a Kubernetes Service Account `kb-indexer-backend-sa` for authorization within the cluster. This service account is bound to two roles: `pod-listing-role` and `job-management-role`, which allow it to list and get pods, and to create, get, list, watch, and delete jobs and cronjobs respectively.

The service also uses a Kubernetes Secret `kb-indexer-secrets` to store sensitive data such as the Elasticsearch username and password, Kaggle username and key, and a GitHub API token.

The service is exposed externally using a Kubernetes Service of type LoadBalancer, as defined in `service.yaml`. The service listens on port 8090 and forwards traffic to the backend service.

# Running
As the backend is designed to run in a Kubernetes cluster, that is the best way to use it. This can either be done locally (using minikube or microk8s), or deploying to a cloud provider's kubernetes service.

## Deploying to the cloud
The easiest way to do this is to use the Github action workflow. Even if you are not using Azure, it should provide you with a template to adjust to other cloud providers. 
Note that the following Github secrets should be set:
- `AZURE_CLIENT_ID`
- `AZURE_SUBSCRIPTION_ID`
- `AZURE_TENANT_ID`
- `DOCKER_ACCESS_TOKEN`
- `DOCKER_USERNAME`
- `ELASTICSEARCH_PASSWORD`
- `ELASTICSEARCH_USERNAME`
- `FIREBASE_ADMIN_SDK_JSON`
- `GH_API_TOKEN`
- `KAGGLE_KEY`
- `KAGGLE_USERNAME`

And the following variables:
- `CLUSTER_NAME`: 'kb-indexer-backend'
- `DH_USER`: *the docker hub repository user name*
- `RESOURCE_GROUP`: *Azure resource group*

## Running Locally

### Running Through Kubernetes
First, build the image `docker builder -t kb-indexer-backend .`.
Then push it to the registry `docker push {{name}}/kb-indexer-backend:latest`

Replace the placholder text in `deployments/secrets.yaml`, with the correct secrets encoded in base64.

Install [minikube](https://minikube.sigs.k8s.io/docs/start/) or [microk8s](https://microk8s.io/) to create a local cluster. Follow their respect instructions on applying the deployment files. Ensure that the right docker hub repository is set in `deployments/kb-indexer-backend-deployment.yaml`

### Running just the server
To run the server, run:

```
npm start
```

To view the Swagger UI interface:

```
open http://localhost:8080/docs
```

### Running through Docker
First, build the image `docker builder -t kb-indexer-backend .`.

When you're ready, start your application by running:
`docker compose up --build`.

Your application will be available at http://localhost:3000.

## Contributing

This project uses JavaScript and Python, and package management is handled by npm. Please ensure that you have these installed and up-to-date before contributing.
