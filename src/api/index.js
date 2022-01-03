const express = require('express');

const app = express();

app.get('/ping', (req, res) => {
  console.log('/ping!');
  return res.status(200).json({
    message: 'Hello!',
  });
});

const main = async () => {
  const { config } = await require('../core/index.js');
  const { periodicallyTakeSnapshots } = await require('./snapshot.js');
  const { APPLICATION_NAME, API_SERVER_HTTP_PORT } = config;

  app.listen(API_SERVER_HTTP_PORT, () => {
    console.log(`${APPLICATION_NAME} running on port ${API_SERVER_HTTP_PORT}.`);
  });

  periodicallyTakeSnapshots();
};

main().catch((err) => {
  console.error(err);
  return process.exit(1);
});
