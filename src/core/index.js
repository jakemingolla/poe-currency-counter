const bunyan = require('bunyan');

const { prepareConfig } = require('./config');
const { prepareDatabase } = require('./db');

const prepareCore = async () => {
  const config = prepareConfig();

  return { config };
};

module.exports = prepareCore();
