const axios = require('axios');

const setupAxios = (config) => {
  const { APPLICATION_NAME, APPLICATION_CONTACT } = config;

  axios.interceptors.request.use((_config) => {
    _config.headers[
      'User-Agent'
    ] = `OAuth ${APPLICATION_NAME}/dev (contact ${APPLICATION_CONTACT})`;

    return _config;
  });
};

const waitForApiServerPing = async (config, log, delay) => {
  const { API_SERVER_HTTP_ENDPOINT } = config;
  log.info(
    'Attempting to reach the API server at ' +
      `${API_SERVER_HTTP_ENDPOINT}/ping...`
  );
  let delaySeconds = 1;

  while (true) {
    try {
      await axios.get(API_SERVER_HTTP_ENDPOINT + '/ping');
      break;
    } catch (err) {
      log.debug(
        'Failed to reach the API server. ' +
          `Retrying in ${delaySeconds} seconds.`
      );
      await delay(delaySeconds);
      delaySeconds *= 2;
    }
  }

  log.info(`Successfully pinged the API server at ${API_SERVER_HTTP_ENDPOINT}`);
};

const fetch = async (log, config, currentPaginationCode) => {
  const { POE_API_HTTP_ENDPOINT } = config;
  log.trace(
    `Attempting HTTP request to ${POE_API_HTTP_ENDPOINT} ` +
      `using ${currentPaginationCode}.`
  );

  const { status, headers, data } = await axios.get(POE_API_HTTP_ENDPOINT, {
    params: { id: currentPaginationCode },
  });

  const { stashes, next_change_id: nextPaginationCode } = data;

  return { stashes, nextPaginationCode };
};

const main = async () => {
  const { config, log, delay } = await require('../core/index.js');

  setupAxios(config);
  await waitForApiServerPing(config, log, delay);

  log.info('Ingestion ready to begin.');

  const { stashes, nextPaginationCode } = await fetch(log, config);

  log.info(
    `${stashes.length} stashes, next pagination code: ${nextPaginationCode}`
  );
};

main().catch((err) => {
  console.error(err);
  return process.exit(1);
});
