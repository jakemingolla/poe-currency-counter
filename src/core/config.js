const LOCAL_DEV_CONFIG = [
  { name: 'APPLICATION_NAME', value: 'poe-currency-counter' },
  { name: 'LOG_LEVEL', value: 'debug' },
  {
    name: 'APPLICATION_CONTACT',
    value: 'jakemingolla+poe-currency-counter' + '@gmail' + '.com',
  },
  {
    name: 'POE_API_HTTP_ENDPOINT',
    value: 'https://api.pathofexile.com/public-stash-tabs',
  },
  { name: 'POE_API_HTTP_REQUEST_DELAY_SECONDS', value: 2, type: 'integer' },
  {
    name: 'POE_API_COUNTED_LEAGUE_NAMES',
    type: 'list:string',
    value: [
      'Standard',
      'Hardcore',
      'Scourge',
      'Hardcore Scourge',
      'Endless Heist (DE004)',
      'Endless Heist HC (DE005)',
      'Atlas Invasion (DE008)',
      'Atlas Invasion HC (DE009)',
    ].join(','),
  },
  { name: 'API_SERVER_HTTP_PORT', value: 13778, type: 'integer' },
  { name: 'API_SERVER_HTTP_ENDPOINT', value: 'http://api-server:13778' },
  { name: 'MONGODB_CONNECTION_URI', requiresEnvironmentOverride: true },
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
