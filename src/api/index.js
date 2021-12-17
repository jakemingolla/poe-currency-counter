const express = require('express');

const PORT = 13778;

const app = express();

app.get('/ping', (req, res) => {
  console.log('/ping!');
  return res.status(200).json({
    message: 'Hello!',
  });
});

const main = async () => {
  const { config } = await require('../core/index.js');

  app.listen(PORT, () => {
    console.log(`${config.APPLICATION_NAME} running on port ${PORT}.`);
  });
};

main().catch((err) => {
  console.error(err);
  return process.exit(1);
});
