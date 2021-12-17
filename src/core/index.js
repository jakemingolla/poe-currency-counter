const bunyan = require('bunyan');

const { prepareConfig } = require('./config');
const { prepareDatabase } = require('./db');

const prepareCore = async () => {
  const config = prepareConfig();
  const log = bunyan.createLogger({
    name: config.APPLICATION_NAME,
    level: config.LOG_LEVEL,
  });
  const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
  const db = await prepareDatabase(config, log);

  return { config, log, delay, db };
};

module.exports = prepareCore();
