'use strict';


/**
 * Returns list of all available indexers and their respective resource types
 *
 * returns List
 **/
exports.getIndexers = async function () {
  return [{
    "id": "046b6c7f-0b8a-43b9-b35d-6489e6daee91",
    "name": "Notebooks",
    "sources": [{
      "name": "Kaggle",
      "id": "046b6c7f-0b8a-43b9-b35d-6489e6daee91"
    }, {
      "name": "Kaggle",
      "id": "046b6c7f-0b8a-43b9-b35d-6489e6daee91"
    }],
    "name": "Notebooks",
    "id": "046b6c7f-0b8a-43b9-b35d-6489e6daee91"
  }, {
    "sources": [{
      "name": "Kaggle",
      "id": "046b6c7f-0b8a-43b9-b35d-6489e6daee91"
    }, {
      "name": "Kaggle",
      "id": "046b6c7f-0b8a-43b9-b35d-6489e6daee91"
    }],

  }];
}


/**
 * Runs indexing pipline
 *
 * body Index_body Request indexer to execute with optional respecitive source (optional)
 * returns inline_response_200
 **/
exports.runIndexingPipeline = async function (body) {
  console.log("indexer_id is", body['indexer_id']);
  console.log("source_id is", 'source_id' in body ? body['source_id'] : undefined);

  /**
   * TODO: This is where we need to implement the server events (event-stream)
   * TODO: there is some weird issue witht the return value being an empty object. maybe itll be fixed when we implement the actual backend
   */

  return ({ "message": "message" });
}

