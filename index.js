const express = require('express');
const swaggerUi = require('swagger-ui-express');
const YAML = require('yamljs');
const swaggerDocument = YAML.load('api/openapi.yaml');
var Default = require('./service/DefaultService');
const cors = require('cors');
const { initFirebase } = require('./utils/authenticate');
const { getIndexers, runIndexingPipeline, subscribeToEvents } = require('./controllers/Default');
const { resolveExistingIndexerOptions } = require('./indexconfig/parse-indexers');
const { setupK8S } = require('./service/JobManager');
const bodyParser = require('body-parser');

const app = express();
const serverPort = 8090;

initFirebase();

resolveExistingIndexerOptions();
//TODO: setupK8S throws an error (Connection refused)
setupK8S();

app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

app.get('/indexers', getIndexers);
app.post('/index', bodyParser.json(), runIndexingPipeline);
app.get('/events', subscribeToEvents);

app.options('*', cors());
app.use(cors());


app.listen(serverPort, function () {
    console.log('Your server is listening on port %d (http://localhost:%d)', serverPort, serverPort);
    console.log('Swagger-ui is available on http://localhost:%d/docs', serverPort);
});
