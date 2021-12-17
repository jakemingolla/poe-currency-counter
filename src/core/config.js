const LOCAL_DEV_CONFIG = [
  { name: 'APPLICATION_NAME', value: 'poe-stash-currency-crawler' },
  { name: 'LOG_LEVEL', value: 'trace' },
  {
    name: 'APPLICATION_CONTACT',
    value: 'jakemingolla+poe-stash-currency-crawler' + '@gmail' + '.com',
  },
  { name: 'POE_API_HTTP_ENDPOINT', value: 'https://api.pathofexile.com' },
  { name: 'POE_API_CRAWL_DELAY_MS', value: 2 * 1000, type: 'integer' },
  { name: 'MONGODB_CONNECTION_URI', requiresEnvironmentOverride: true },
  { name: 'MONGODB_COLLECTION_NAMES', requiresEnvironmentOverride: true },
  { name: 'MONGODB_DATABASE_NAME', requiresEnvironmentOverride: true },
];

const prepareConfig = (localDefaults, environmentOverride) => {
  return localDefaults.reduce(
    (acc, { name, value, type, requiresEnvironmentOverride }) => {
      if (requiresEnvironmentOverride && !environmentOverride[name]) {
        throw new Error(`Missing required environment override for ${name}.`);
      }

      value = environmentOverride[name] || value;

      if (type === 'integer') {
        acc[name] = parseInt(value);
      } else if (type === 'list:integer') {
        acc[name] = value.split(',').map((x) => parseInt(x));
      } else if (type === 'list:string') {
        acc[name] = value.split(',');
      } else {
        acc[name] = value;
      }

      return acc;
    },
    {}
  );
};

module.exports = {
  prepareConfig: prepareConfig.bind(null, LOCAL_DEV_CONFIG, process.env),
  __test: {
    prepareConfig,
  },
};
