const fs = require('fs');
const path = require('path');

const { restartJobsFromTasks } = require('../service/JobManager');

const changed_files_path = path.join(__dirname, 'changed_source_files.txt');
const tasks_path = path.join(__dirname, 'reindexing_tasks.txt');

const directoryToUuidMapping = {
  notebook: '71c05f53-8775-43c9-9747-1269f8a2b6e6',
  web: 'c3334f24-0379-436f-a917-30270077444f',
  dataset: '91820dc4-b653-474c-958f-b7539d7c3c53',
  api: '2263b73a-3222-4fc0-bf97-ba4b62baf0bf',
};

function resolveReindexingTasks() {
    try {
      const data = fs.readFileSync(changed_files_path, 'utf8');
      const lines = data.trim().split('\n');
      const directoriesSet = new Set();
  
      lines.forEach(line => {
        const parts = line.trim().split('/');
        if (parts.length >= 4) {
          directoriesSet.add(parts[3]);
        }
      });
  
      const uuids = Array.from(directoriesSet).map(directory => directoryToUuidMapping[directory]);
      
      const outputContent = uuids.join('\n');
      
      fs.writeFileSync(tasks_path, outputContent);
      console.log(`UUIDs have been written to ${tasks_path}`);
      restartJobsFromTasks();

    } catch (err) {
      console.error('Error processing the file:', err);
    }
  }
  
  module.exports = { resolveReindexingTasks };
