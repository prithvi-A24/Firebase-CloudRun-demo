# Firebase + Cloud Run Deployment

This repository documents the **deployment of an existing web application** using Google Cloud and Firebase.

The application source is based on the original project by **Enakai00**. This repository focuses on the **deployment architecture, cloud configuration, authentication configuration, containerization, Firebase Hosting, Artifact Registry, Cloud Run, IAM, and service integration** rather than the application implementation itself.

---

# 1. Original Project & Credits

This deployment is based on the original project by **Enakai00**.

Original repository:

```text
https://github.com/enakai00/react-google-login-example
```

Credit and attribution are retained for the original project and its source code.

The deployment work documented here focuses on:

* Google Cloud deployment
* Docker/container deployment
* Artifact Registry
* Cloud Run
* Cloud Run IAM
* Firebase Hosting
* Firebase Authentication configuration
* Firebase Hosting → Cloud Run integration
* Deployment verification
* Cloud service configuration

---

# 2. Deployment Architecture

The final architecture is:

```text
                           INTERNET
                               |
                               v
                    +-------------------+
                    | Firebase Hosting  |
                    |                   |
                    | React Frontend    |
                    +---------+---------+
                              |
                              |
                       Firebase Rewrite
                              |
                              v
                    +-------------------+
                    |    Cloud Run      |
                    |                   |
                    | hello-world-      |
                    | service           |
                    +---------+---------+
                              |
                              v
                    +-------------------+
                    | Container         |
                    |                   |
                    | Port 8080         |
                    +-------------------+
```

Supporting services:

```text
             Google Cloud Project
                     |
       +-------------+-------------+
       |             |             |
       v             v             v
 Artifact        Cloud Run      IAM
 Registry
       |
       v
Container Image
```

Firebase Authentication is used for the frontend authentication configuration.

---

# 3. Google Cloud Project

The deployment uses the following Google Cloud project:

```text
Project ID:
terraform-001-490014
```

Primary Cloud Run region:

```text
asia-south1
```

Using a specific region is important because Cloud Run services, Artifact Registry repositories, and other regional resources need to be deployed consistently.

The region used here is:

```text
asia-south1
```

---

# 4. Artifact Registry

## What is Artifact Registry?

Artifact Registry is Google's managed service for storing build artifacts such as:

* Docker images
* Language packages
* Application artifacts

For this deployment, Artifact Registry is used to store the Docker image that Cloud Run executes.

The flow is:

```text
Application
     |
     v
Docker build
     |
     v
Docker image
     |
     v
Artifact Registry
     |
     v
Cloud Run
```

The image used in this deployment is:

```text
asia-south1-docker.pkg.dev/terraform-001-490014/cloud-run-demo/hello-world-service:v1
```

Breaking this down:

```text
asia-south1
    |
    +-- Artifact Registry region

docker.pkg.dev
    |
    +-- Google Artifact Registry hostname

terraform-001-490014
    |
    +-- GCP project

cloud-run-demo
    |
    +-- Artifact Registry repository

hello-world-service
    |
    +-- Container image

v1
    |
    +-- Image tag
```

---

# 5. Why Containerize the Application?

Cloud Run runs applications as containers.

Instead of deploying the source code directly to Cloud Run, the application is packaged into a Docker image.

Conceptually:

```text
Source Code
     |
     v
Dockerfile
     |
     v
Docker Image
     |
     v
Artifact Registry
     |
     v
Cloud Run
```

The container provides a consistent runtime environment.

Cloud Run then starts the container and sends incoming HTTP requests to the port configured by the container.

For this deployment:

```text
Container Port = 8080
```

---

# 6. Cloud Run Deployment

## What is Cloud Run?

Cloud Run is a fully managed serverless container platform.

It allows the container image stored in Artifact Registry to run without manually managing:

* Virtual machines
* Operating systems
* Server patching
* Load balancers
* Server scaling

Cloud Run handles infrastructure and scaling.

The deployed service is:

```text
hello-world-service
```

Region:

```text
asia-south1
```

Container port:

```text
8080
```

Cloud Run URL:

```text
https://hello-world-service-ha4papxnxa-el.a.run.app
```

---

# 7. Cloud Run Deployment Flow

The deployment flow is:

```text
Docker Image
     |
     v
Artifact Registry
     |
     | Cloud Run pulls image
     v
Cloud Run Service
     |
     v
Revision
     |
     v
Running Container
```

When a new version of the container image is deployed, Cloud Run creates a new revision.

Cloud Run then manages the lifecycle of the container instances belonging to that revision.

---

# 8. Cloud Run Container Port

The deployed container exposes:

```text
8080
```

Cloud Run needs to know which port the application is listening on.

The deployed configuration shows:

```text
containerPort: 8080
```

The application process inside the container listens on:

```text
0.0.0.0:8080
```

This is important.

The application must listen on an address accessible from outside the container, rather than only on:

```text
127.0.0.1
```

The deployment was verified through the Cloud Run logs, which showed:

```text
Listening at: http://0.0.0.0:8080
```

Therefore the container is correctly listening on the expected Cloud Run port.

---

# 9. Making Cloud Run Public

By default, Cloud Run can require IAM authentication for invocation.

For this deployment, the requirement was:

> Make the Cloud Run API publicly accessible.

The Cloud Run service therefore uses:

```text
allUsers
```

with:

```text
roles/run.invoker
```

Conceptually:

```text
Internet
   |
   v
Cloud Run IAM
   |
   | allUsers
   v
Cloud Run Service
```

This means users do not need a Google Cloud IAM identity simply to invoke the Cloud Run service.

The IAM configuration was verified using:

```bash
gcloud run services get-iam-policy hello-world-service \
  --region=asia-south1
```

---

# 10. Important Difference: Cloud Run IAM vs Application Authentication

Making Cloud Run public does **not** automatically remove authentication implemented inside the application.

There are two separate layers:

```text
Layer 1
Cloud Run IAM
        |
        v
"Can this request invoke Cloud Run?"
```

and:

```text
Layer 2
Application
        |
        v
"Does this request satisfy the application's authentication?"
```

Therefore:

```text
Internet
   |
   v
Cloud Run IAM
   |
   | Public
   v
Container
   |
   v
Application
   |
   v
Application-level authentication
```

Cloud Run being public means the request can reach the container.

The application can still return its own HTTP status codes.

This distinction is important when troubleshooting deployment issues.

---

# 11. Firebase Hosting

Firebase Hosting is used to serve the frontend.

The deployed frontend is available at:

```text
https://terraform-001-490014.web.app
```

Firebase Hosting provides:

* HTTPS
* CDN-backed delivery
* Hosting for static frontend assets
* Routing configuration
* Integration with Firebase services

The deployment flow is:

```text
React Build
    |
    v
Firebase Hosting
    |
    v
terraform-001-490014.web.app
```

---

# 12. Frontend Build

Before deploying the frontend, the application is built:

```bash
npm run build
```

The build process converts the development project into production-ready frontend assets.

Conceptually:

```text
React Source
     |
     v
npm run build
     |
     v
Production Build
     |
     v
Firebase Hosting
```

The important deployment principle is that Firebase Hosting serves the **built frontend**, not the development server.

---

# 13. Firebase Hosting Configuration

The Firebase Hosting configuration contains a rewrite for the backend:

```json
{
  "hosting": {
    "public": "build",
    "ignore": [
      "firebase.json",
      "**/.*",
      "**/node_modules/**"
    ],
    "rewrites": [
      {
        "source": "/hello-world-service/**",
        "run": {
          "serviceId": "hello-world-service",
          "region": "asia-south1"
        }
      },
      {
        "source": "**",
        "destination": "/index.html"
      }
    ]
  }
}
```

There are two important rewrite rules.

---

# 14. Backend Rewrite

The first rewrite is:

```json
{
  "source": "/hello-world-service/**",
  "run": {
    "serviceId": "hello-world-service",
    "region": "asia-south1"
  }
}
```

This tells Firebase Hosting:

> Requests matching `/hello-world-service/**` should be routed to the Cloud Run service named `hello-world-service` in `asia-south1`.

The architecture becomes:

```text
Browser
   |
   | https://terraform-001-490014.web.app/hello-world-service/...
   |
   v
Firebase Hosting
   |
   | Rewrite
   v
Cloud Run
   |
   v
hello-world-service
```

This allows the frontend and backend to be accessed through the Firebase Hosting domain.

---

# 15. Frontend SPA Rewrite

The second rewrite is:

```json
{
  "source": "**",
  "destination": "/index.html"
}
```

This is commonly used for a single-page application.

The purpose is to ensure that frontend routes are handled by the React application's `index.html`.

Conceptually:

```text
Browser
   |
   | /some-frontend-route
   v
Firebase Hosting
   |
   v
index.html
   |
   v
React Router / Frontend
```

This prevents Firebase Hosting from treating frontend routes as missing static files.

---

# 16. Firebase Authentication

Firebase Authentication is configured for Google Sign-In.

The purpose is to provide user authentication for the frontend.

The architecture is:

```text
User
 |
 v
React Frontend
 |
 v
Firebase Authentication
 |
 v
Google Sign-In
```

Firebase Authentication is separate from Cloud Run IAM.

Therefore:

```text
Firebase Authentication
        |
        +-- Application user authentication

Cloud Run IAM
        |
        +-- Cloud Run service invocation
```

They solve different problems.

---

# 17. Deployment Testing

After deployment, Cloud Run was tested directly.

The Cloud Run URL was:

```text
https://hello-world-service-ha4papxnxa-el.a.run.app
```

A request to the root endpoint returned:

```text
HTTP 200
```

This verified:

```text
Internet
   |
   v
Cloud Run
   |
   v
Container
   |
   v
Application
```

was reachable.

Cloud Run logs were also inspected using:

```bash
gcloud run services logs read hello-world-service \
  --region=asia-south1 \
  --limit=50
```

The logs confirmed that Gunicorn was running and listening on:

```text
0.0.0.0:8080
```

---

# 18. Deployment Verification Checklist

The deployment was verified at multiple layers.

### Frontend

```text
Firebase Hosting
        |
        v
React application
```

Status:

```text
DEPLOYED
```

### Authentication

```text
Firebase Authentication
        |
        v
Google Sign-In
```

Status:

```text
CONFIGURED
```

### Container

```text
Docker image
        |
        v
Artifact Registry
```

Status:

```text
AVAILABLE
```

### Cloud Run

```text
Artifact Registry
        |
        v
Cloud Run
```

Status:

```text
DEPLOYED
```

### IAM

```text
allUsers
    |
    v
roles/run.invoker
```

Status:

```text
PUBLIC
```

### Firebase Rewrite

```text
/hello-world-service/**
        |
        v
hello-world-service
        |
        v
asia-south1
```

Status:

```text
CONFIGURED
```

---

# 19. Useful Deployment Commands

## Check Cloud Run service

```bash
gcloud run services describe hello-world-service \
  --region=asia-south1
```

## Get Cloud Run URL

```bash
gcloud run services describe hello-world-service \
  --region=asia-south1 \
  --format="value(status.url)"
```

## Check Cloud Run IAM

```bash
gcloud run services get-iam-policy hello-world-service \
  --region=asia-south1
```

## Read Cloud Run logs

```bash
gcloud run services logs read hello-world-service \
  --region=asia-south1 \
  --limit=50
```

## Deploy Firebase Hosting

```bash
firebase deploy --only hosting
```

## Deploy Cloud Run

```bash
gcloud run deploy hello-world-service \
  --image asia-south1-docker.pkg.dev/terraform-001-490014/cloud-run-demo/hello-world-service:v1 \
  --region asia-south1
```

## Make Cloud Run public

```bash
gcloud run services add-iam-policy-binding hello-world-service \
  --region=asia-south1 \
  --member="allUsers" \
  --role="roles/run.invoker"
```

---

# 20. Final Architecture

The final deployment can be summarized as:

```text
                           USER
                             |
                             v
                  +--------------------+
                  | Firebase Hosting   |
                  |                    |
                  | React Frontend     |
                  +---------+----------+
                            |
                            |
                     Firebase Routing
                            |
                            v
                  +--------------------+
                  | Firebase Rewrite   |
                  +---------+----------+
                            |
                            |
                            v
                  +--------------------+
                  |     Cloud Run      |
                  |                    |
                  | hello-world-       |
                  | service            |
                  +---------+----------+
                            |
                            v
                  +--------------------+
                  | Docker Container   |
                  |                    |
                  | Port: 8080         |
                  +--------------------+
                            |
                            v
                       Application


Supporting Infrastructure:

        +----------------------+
        |   Artifact Registry  |
        +----------+-----------+
                   |
                   | Docker Image
                   v
        +----------------------+
        |      Cloud Run       |
        +----------------------+

        +----------------------+
        | Firebase Auth        |
        | Google Sign-In       |
        +----------------------+
```

---

# 21. Deployment Summary

The deployment takes an existing application and makes it available through a cloud-based architecture:

```text
Existing Application
        |
        v
Docker Container
        |
        v
Artifact Registry
        |
        v
Cloud Run
        |
        | Public IAM
        v
Internet
```

The frontend is deployed separately:

```text
React Application
        |
        v
Production Build
        |
        v
Firebase Hosting
```

Firebase Hosting then provides the routing layer between the frontend and Cloud Run:

```text
Firebase Hosting
       |
       | /hello-world-service/**
       v
Cloud Run
```

This creates a deployment architecture where **Firebase handles frontend hosting and authentication services, while Cloud Run handles the backend container workload**.

---

## Repository

GitHub:

```text
https://github.com/prithvi-A24/Firebase-CloudRun-demo
```

## Original Project

Original source project:

```text
https://github.com/enakai00/react-google-login-example
```

**Credit:** The original application and source code belong to **Enakai00**. This repository documents the deployment and cloud infrastructure work performed around that existing project.
