const { MongoClient } = require('mongodb');

const METHODS = ['find', 'findOne', 'updateOne'];

const decorateDatabase = (client, collectionNames) => {};

const prepareDatabase = async (config, log) => {
  const {
    MONGODB_CONNECTION_URI,
    MONGODB_COLLECTION_NAMES,
    MONGODB_DATABASE_NAME,
  } = config;

  const client = new MongoClient(DATABASE_URI);

  try {
    await client.connect();

    const db = decorateDatabase(client, DATABASE_COLLECTION_NAMES);
  } catch (err) {
    log.error(err);
  }
};

module.exports = {
  prepareDatabase,
};
