const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const basePath = path.join(__dirname, 'indexers_base.json');
const targetPath = path.join(__dirname, 'indexers.json');

const entryPointPath = path.join(__dirname, 'indexers/notebook/entrypoint.py');
const datasetsDirPath = path.join(__dirname, 'indexers/dataset/repositories');

const id_base = path.join(__dirname, 'indexers_id_base.json');
const id_target = path.join(__dirname, 'indexers_id.json');

function parseNotebookNames() {
  const data = fs.readFileSync(entryPointPath, 'utf8');
  const regex = /'([^']+)': repositories\.[^,}]+/g;
  let match;
  const repos = [];
  while ((match = regex.exec(data)) !== null) {
    repos.push(match[1]);
  }
  return repos;
}

function parseDatasetNames() {
  const files = fs.readdirSync(datasetsDirPath);
  const datasetNames = files.map(file => {
    const content = fs.readFileSync(path.join(datasetsDirPath, file), 'utf8');
    const match = content.match(/class\s+\w+Repository[\s\S]*?name\s*=\s*['"]([^'"]+)['"]/);
    return match ? match[1] : null;
  }).filter(Boolean);
  return datasetNames;
}

function resolveExistingIndexerOptions() {
  const notebookRepos = parseNotebookNames();
  const datasetNames = parseDatasetNames();

  Promise.all([
    fs.promises.readFile(basePath, 'utf8'),
    fs.promises.readFile(id_base, 'utf8')
  ])
    .then(([baseData, idBaseData]) => {
      try {
        const baseConfig = JSON.parse(baseData);
        // Assuming id_base also contains a JSON configuration
        const idBaseConfig = JSON.parse(idBaseData);

        notebookRepos.forEach(repo => {
          const uuid = crypto.randomUUID();
          baseConfig.notebook.push({
            name: repo,
            command: `kb_indexer notebook -r ${repo} pipeline`,
            uuid: uuid
          });
          idBaseConfig[uuid] = `kb_indexer notebook -r ${repo} pipeline`;
        });

        datasetNames.forEach(name => {
          const uuid = crypto.randomUUID();
          baseConfig.dataset.push({
            name: name,
            command: `kb_indexer dataset -r '${name}' pipeline`,
            uuid: uuid
          });
          idBaseConfig[uuid] = `kb_indexer dataset -r '${name}' pipeline`;
        });

        fs.promises.writeFile(targetPath, JSON.stringify(baseConfig, null, 2))
          .then(() => {
            console.log('Current available indexers successfully saved to', targetPath);
          })
          .catch(err => {
            console.error('Error writing to targetPath:', err);
          });

        fs.promises.writeFile(id_target, JSON.stringify(idBaseConfig, null, 2))
          .then(() => {
            console.log('ID configurations successfully saved to', id_target);
          })
          .catch(err => {
            console.error('Error writing to id_target:', err);
          });
      } catch (parseError) {
        console.error('Error parsing JSON data:', parseError);
      }
    })
    .catch(err => {
      console.error('Error reading file:', err);
    });
}

module.exports = { resolveExistingIndexerOptions };