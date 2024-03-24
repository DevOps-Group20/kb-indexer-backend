# syntax=docker/dockerfile:1

ARG NODE_VERSION=21.6.2
# Add the ARG for Firebase Admin SDK JSON
ARG FIREBASE_ADMIN_SDK_JSON

FROM node:${NODE_VERSION}-alpine

ENV NODE_ENV production

WORKDIR /usr/src/app

# Install dependencies
RUN --mount=type=bind,source=package.json,target=package.json \
    --mount=type=bind,source=package-lock.json,target=package-lock.json \
    --mount=type=cache,target=/root/.npm \
    npm ci --omit=dev

# Create the utils directory and adjust ownership
RUN mkdir -p /usr/src/app/utils && \
    chown -R node:node /usr/src/app

# Switch to user 'node' before creating the Firebase SDK file
USER node

# Echo the Firebase Admin SDK JSON content into the file
RUN echo "$FIREBASE_ADMIN_SDK_JSON" > /usr/src/app/utils/devops-kb-indexer-firebase-adminsdk-1virk-e7cef204be.json

# Copy the application files
COPY --chown=node:node . .

EXPOSE 3000
CMD ["npm", "start"]
