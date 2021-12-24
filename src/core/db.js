const { MongoClient } = require('mongodb');

const COLLECTION_NAMES = ['items', 'paginationCodes'];
const METHODS = ['find', 'findOne', 'replaceOne'];

const nanosecondsToMilliseconds = (nanoseconds) => {
  // By multiplying and subsequently dividing by 1000,
  // we will get 4 digits of precision in the result.
  return Number((nanoseconds * 1000n) / 1000000000n) / 1000;
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

        log.trace(`${collection} ${method} END ${durationMs} ms.`);
        return result;
      };
    });
  });

  return db;
};

const ensureIndexes = (db, log) => {
  log.info('Attempting to ensure indexes in MongoDB.');

  return Promise.all([
    db.collection('items').createIndex(
      {
        league: 1,
        baseType: 1,
        stashId: 1,
      },
      {
        background: true,
        unique: true,
      }
    ),
  ]).then(() => log.info('Indexes successfully ensured.'));
};

const prepareDatabase = async (config, log) => {
  const { MONGODB_CONNECTION_URI, MONGODB_DATABASE_NAME } = config;

  log.info(`Attempting to connect to MongoDB at ${MONGODB_CONNECTION_URI}`);
  const client = new MongoClient(MONGODB_CONNECTION_URI);

  await client.connect();
  log.info(`Mongo connection successful.`);

  const db = client.db(MONGODB_DATABASE_NAME);

  await ensureIndexes(db, log);
  return decorateDatabase(db, log);
};

module.exports = {
  prepareDatabase,
  __test: {
    decorateDatabase,
    nanosecondsToMilliseconds,
  },
};
