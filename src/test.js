// notes:
// - need to store stashes by id in mongo
// - update each stash at every time
// - does POE API include a 'last updated' timestamp?
const axios = require('axios');
const bunyan = require('bunyan');

const APPLICATION_NAME = 'poe-stash-currency-crawler';
const APPLICATION_VERSION = '0.0.1';
const APPLICATION_CONTACT = `jakemingolla+${APPLICATION_NAME}@gmail.com`;
const API_HTTP_ENDPOINT = 'https://api.pathofexile.com/public-stash-tabs';
const API_HTTP_DELAY_MS = 2 * 1000;
const LOG_LEVEL = process.env.LOG_LEVEL || 'trace';

// Set constant HTTP Header with authorization information
// TODO: Update name / version in real time
axios.interceptors.request.use((config) => {
  config.headers['User-Agent'] =
    'OAuth ' +
    `${APPLICATION_NAME}/${APPLICATION_VERSION}` +
    `(contact ${APPLICATION_CONTACT})`;

  return config;
});

const log = bunyan.createLogger({
  name: `${APPLICATION_NAME}/${APPLICATION_VERSION}`,
  level: LOG_LEVEL,
});
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const fetch = async (paginationCode) => {
  log.trace(
    `Attempting HTTP request to ${API_HTTP_ENDPOINT} using ${paginationCode}`
  );
  const { status, headers, data } = await axios.get(API_HTTP_ENDPOINT, {
    params: { id: paginationCode },
  });

  log.trace(`HTTP ${status} response from ${API_HTTP_ENDPOINT}`);

  const { stashes, next_change_id: nextPaginationCode } = data;

  return { stashes, nextPaginationCode };
};

const LEAGUE_NAMES = [
  'Standard',
  'Hardcore',
  'SSF Standard',
  'SSF Hardcore',
  'Scourge',
  'Hardcore Scourge',
  'SSF Scourge',
  'SSF Scourge HC',
  'Ziz Krangled HCSSF Class Gauntlet (DE003)',
  'Endless Heist (DE004)',
  'Endless Heist SSF (DE006)',
  'Endless Heist HC (DE005)',
  'Endless Heist HC SSF (DE007)',
  'Path of Exile: Royale',
  'Atlas Invasion (DE008)',
  'Atlas Invasion HC (DE009)',
  'Atlas Invasion SSF (DE010)',
  'Atlas Invasion HC SSF (DE011)',
];

const leagues = LEAGUE_NAMES.reduce((acc, name) => {
  acc[name] = {};
  return acc;
}, {});

const parse = (stashes) => {
  const publicCurrencyStashes = stashes.filter(
    (x) => x.stashType === 'CurrencyStash' && x.public === true
  );

  publicCurrencyStashes.forEach((stash) => {
    stash.items.forEach((item) => {
      const { league, stackSize, baseType, extended } = item;

      if (!extended || extended.category !== 'currency') {
        return;
      }

      if (baseType in leagues[league]) {
        leagues[league][baseType].sum += stackSize;
        leagues[league][baseType].count += 1;
      } else {
        leagues[league][baseType] = {
          sum: stackSize,
          count: 1,
        };
      }
    });
  });
};

const main = async () => {
  let workLoopIterations = 0;
  let currentPaginationCode = process.env.PAGINATION_CODE || '';

  while (true) {
    const { stashes: unparsedStashes, nextPaginationCode } = await fetch(
      currentPaginationCode
    );

    if (workLoopIterations % 10 === 0 || unparsedStashes.length === 0) {
      console.log();
      console.log(JSON.stringify(leagues, null, 2));
    }

    if (unparsedStashes.length === 0) {
      console.log(
        `Found end of river in ${workLoopIterations} work loop iterations.`
      );
      break;
    }

    const parsedStashes = parse(unparsedStashes);

    await delay(API_HTTP_DELAY_MS);
    console.log(nextPaginationCode);
    currentPaginationCode = nextPaginationCode;
    workLoopIterations++;
  }
};

return main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
