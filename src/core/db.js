const { MongoClient } = require('mongodb');

const METHODS = ['find', 'findOne', 'updateOne'];
const COLLECTION_NAMES = ['stashes', 'breadcrumbs'];

const nanosecondsToMilliseconds = (nanoseconds) => {
  return nanoseconds / 1000000000n;
};

const decorateDatabase = (db, log) => {
  COLLECTION_NAMES.forEach((collection) => {
    db[collection] = {};

    METHODS.forEach((method) => {
      db[collection][method] = async (...args) => {
        log.trace(`${collection} ${method} START.`);

        const start = process.hrtime.bigint();
        const result = await db.collection(collection)[method](...args);
        const end = process.hrtime.bigint();
        const durationMs = nanosecondsToMilliseconds(end - start);

        log.debug(`${collection} ${method} END ${durationMs} ms.`);
        return result;
      };
    });
  });

  return db;
};

const prepareDatabase = async (config, log) => {
  const { MONGODB_CONNECTION_URI, MONGODB_DATABASE_NAME } = config;

  log.info(`Attempting to connect to MongoDB at ${MONGODB_CONNECTION_URI}`);
  const client = new MongoClient(MONGODB_CONNECTION_URI);

  try {
    await client.connect();
    log.info(`Mongo connection successful.`);

    return decorateDatabase(client.db(MONGODB_DATABASE_NAME), log);
  } catch (err) {
    log.error(err);
  }
};

module.exports = {
  prepareDatabase,
};
