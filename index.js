const express = require('express');
const swaggerUi = require('swagger-ui-express');
const YAML = require('yamljs');
const swaggerDocument = YAML.load('api/openapi.yaml');
var Default = require('./service/DefaultService');
const cors = require('cors');
const { initFirebase } = require('./utils/authenticate');
const { getIndexers, runIndexingPipeline, subscribeToEvents } = require('./controllers/Default');

const app = express();

initFirebase();

app.options('*', cors());

app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

app.get('/indexers', getIndexers);
app.post('/index', runIndexingPipeline);
app.get('/events', subscribeToEvents);

app.listen(8090, () => {
  console.log('Server is running on http://localhost:8090');
});
