# syntax=docker/dockerfile:1

ARG NODE_VERSION=21.6.2

FROM node:${NODE_VERSION}-alpine

ENV NODE_ENV production

WORKDIR /usr/src/app

RUN --mount=type=bind,source=package.json,target=package.json \
    --mount=type=bind,source=package-lock.json,target=package-lock.json \
    --mount=type=cache,target=/root/.npm \
    npm ci --omit=dev

RUN mkdir -p /usr/src/app && \
    chown -R node:node /usr/src/app

USER node

COPY --chown=node:node . .

EXPOSE 3000
CMD npm start
