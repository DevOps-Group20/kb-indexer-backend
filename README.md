## Project Overview

This project is a backend service for a web application that retrieves research assets and stores data in an Elasticsearch database. The backend is designed to handle multiple indexing pipeline jobs and uses Firebase authentication to enable secure requests to the frontend.

The backend service is deployed to a Kubernetes cluster using several deployment workflows. These workflows include deploying the backend image, setting up necessary secrets, and configuring a load balancer.

## Deployment Details

The backend service is deployed using a Kubernetes Deployment, as defined in `kb-indexer-backend-deployment.yaml`. The deployment specifies a single replica of the backend service, which uses the Docker image `philippsommer27/kb-indexer-backend:latest`. The service listens on port 8090 and is configured with a couple of environment variables.

The service uses a Kubernetes Service Account `kb-indexer-backend-sa` for authorization within the cluster. This service account is bound to two roles: `pod-listing-role` and `job-management-role`, which allow it to list and get pods, and to create, get, list, watch, and delete jobs and cronjobs respectively.

The service also uses a Kubernetes Secret `kb-indexer-secrets` to store sensitive data such as the Elasticsearch username and password, Kaggle username and key, and a GitHub API token.

The service is exposed externally using a Kubernetes Service of type LoadBalancer, as defined in `service.yaml`. The service listens on port 8090 and forwards traffic to the backend service.

### Running the server
To run the server, run:

```
npm start
```

To view the Swagger UI interface:

```
open http://localhost:8080/docs
```

## Running through Container Locally

When you're ready, start your application by running:
`docker compose up --build`.

Your application will be available at http://localhost:3000.

### Deploying your application to the cloud

First, build your image, e.g.: `docker build -t myapp .`.
If your cloud uses a different CPU architecture than your development
machine (e.g., you are on a Mac M1 and your cloud provider is amd64),
you'll want to build the image for that platform, e.g.:
`docker build --platform=linux/amd64 -t myapp .`.

Then, push it to your registry, e.g. `docker push myregistry.com/myapp`.

Consult Docker's [getting started](https://docs.docker.com/go/get-started-sharing/) docs for more detail on building and pushing.

### References
* [Docker's Node.js guide](https://docs.docker.com/language/nodejs/)

Please note that you will need to provide your own values for the secrets in `secrets.yaml` before applying the manifests.

## Contributing

This project uses JavaScript and Python, and package management is handled by npm. Please ensure that you have these installed and up-to-date before contributing.
