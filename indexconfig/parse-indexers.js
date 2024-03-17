const fs = require('fs');
const path = require('path');

const basePath = path.join(__dirname, 'indexers_base.json');
const targetPath = path.join(__dirname, 'indexers.json');
const entryPointPath = path.join(__dirname, 'indexers\\notebook\\entrypoint.py');
const datasetsDirPath = path.join(__dirname, 'indexers\\dataset\\repositories'); 

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

    fs.readFile(basePath, 'utf8', (err, data) => {
        if (err) {
            console.error('Error reading the base JSON file:', err);
            return;
        }

        try {
            const config = JSON.parse(data);

            notebookRepos.forEach(repo => {
                config.notebook.push({
                  name: repo,
                  command: `kb_indexer notebook -r ${repo} pipeline`
                });
              });

              datasetNames.forEach(name => {
                config.dataset.push({
                  name: name,
                  command: `kb_indexer dataset -r '${name}' pipeline`
                });
              });

            fs.writeFile(targetPath, JSON.stringify(config, null, 2), (err) => {
                if (err) {
                    console.error('Error writing the extended configuration to file:', err);
                } else {
                    console.log('Current available indexers succesfully saved to', targetPath);
                }
            });
        } catch (parseError) {
            console.error('Error parsing JSON data:', parseError);
        }
    });
}

module.exports = { resolveExistingIndexerOptions };