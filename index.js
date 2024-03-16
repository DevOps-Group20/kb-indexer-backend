'use strict';

var path = require('path');
var http = require('http');
var cors = require('cors'); // Include the CORS middleware

var oas3Tools = require('oas3-tools');
var serverPort = 8090;

// swaggerRouter configuration
var options = {
    routing: {
        controllers: path.join(__dirname, './controllers')
    },
};

var expressAppConfig = oas3Tools.expressAppConfig(path.join(__dirname, 'api/openapi.yaml'), options);
var app = expressAppConfig.getApp();
app.options('*', cors()) // include before other routes


  

// const { setupK8S } = require('./service/JobManager');

// setupK8S();

// Initialize the Swagger middleware
const server = http.createServer(app)

server.listen(serverPort, function () {
    console.log('Your server is listening on port %d (http://localhost:%d)', serverPort, serverPort);
    console.log('Swagger-ui is available on http://localhost:%d/docs', serverPort);
});


