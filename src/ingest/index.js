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
      `using pagination code ${currentPaginationCode}.`
  );

  const { status, data } = await axios.get(POE_API_HTTP_ENDPOINT, {
    params: { id: currentPaginationCode },
  });

  const { stashes, next_change_id: nextPaginationCode } = data;

  log.trace(`Received ${status} HTTP response with ${stashes.length} stashes.`);

  return { stashes, nextPaginationCode };
};

const parseItems = (log, stashes, currentPaginationCode) => {
  const items = [];
  const publicCurrencyStashes = stashes.filter(
    (x) => x.stashType === 'CurrencyStash' && x.public === true
  );

  publicCurrencyStashes.forEach((stash) => {
    const stashId = stash.id;

    stash.items.forEach((item) => {
      const { league, stackSize, baseType, extended } = item;
      const updatedAt = new Date().toISOString();

      // Items can be put into a currency stash tab in the main
      // compartment even if they are not technically a currency
      // item. Ignore it.
      if (!extended || extended.category !== 'currency') {
        return;
      }

      items.push({
        league,
        stashId,
        baseType,
        // Certain items like prophecies cannot stack,
        // which is equivalent to a single stack from an accounting perspective.
        stackSize: stackSize === undefined ? 1 : stackSize,
        updatedAt,
        paginationCode: currentPaginationCode,
      });
    });
  });

  log.debug(
    `Pagination code ${currentPaginationCode} had ` +
      `${publicCurrencyStashes.length} public currency stashes with ` +
      `${items.length} parseable currency items.`
  );

  return items;
};

const persistItems = (config, log, db, items) => {
  const promises = [];

  items.forEach((item) => {
    const { league, stashId, baseType } = item;

    promises.push(
      db.items.replaceOne({ league, stashId, baseType }, item, {
        upsert: true,
      })
    );
  });

  const start = new Date();
  log.debug(`Attempting to update/insert ${items.length} items into MongoDB.`);

  return Promise.all(promises).then(() => {
    const durationMs = new Date() - start;

    log.debug(
      `Successfully updated/inserted ${items.length} items into MongoDB ` +
        `in ${durationMs} milliseconds.`
    );
  });
};

const persistPaginationCode = (config, log, db, paginationCode) => {
  log.debug(`Attempting to persist pagination code ${paginationCode}.`);
  const updatedAt = new Date().toISOString();
  const owner = config.APPLICATION_NAME;

  return db.paginationCodes
    .replaceOne(
      { owner },
      { owner, updatedAt, paginationCode },
      { upsert: true }
    )
    .then(() =>
      log.debug(`Pagination code ${paginationCode} persisted successfully.`)
    );
};

const retrievePaginationCode = async (config, log, db) => {
  const owner = config.APPLICATION_NAME;

  log.info(`Attempting to retrieve most recent paginationCode from MongoDB.`);

  const breadcrumb = await db.paginationCodes.findOne({ owner });

  if (!breadcrumb) {
    log.info(`No breadcrumb found. Beginning with an empty pagination code.`);
    return null;
  } else {
    const { paginationCode, updatedAt } = breadcrumb;

    log.info(`Retrieved pagination code ${paginationCode} from ${updatedAt}.`);
    return paginationCode;
  }
};

const main = async () => {
  const { config, db, log, delay } = await require('../core/index.js');

  setupAxios(config);
  await waitForApiServerPing(config, log, delay);

  log.info('Ingestion ready to begin.');

  let workLoopIterations = 0;
  let currentPaginationCode = await retrievePaginationCode(config, log, db);

  while (true) {
    const { stashes, nextPaginationCode } = await fetch(
      log,
      config,
      currentPaginationCode
    );

    if (stashes.length === 0) {
      log.info(
        `Found end of river in ${workLoopIterations} work loop iterations.`
      );
      break;
    }

    const items = parseItems(log, stashes, currentPaginationCode);

    if (items.length) {
      await persistItems(config, log, db, items);
    }

    await persistPaginationCode(config, log, db, currentPaginationCode);
    await delay(config.POE_API_HTTP_REQUEST_DELAY_SECONDS);

    currentPaginationCode = nextPaginationCode;
    workLoopIterations++;
  }
};

main().catch((err) => {
  console.error(err);
  return process.exit(1);
});

// Pagination code 3404007-2868164-3254302-3360456-2801163 had 1 public currency stashes with 0 parseable currency items
//
// Pagination code 4869819-5130631-5156262-5529853-4733515 had 1 public currency stashes with 12 parseable currency items.
