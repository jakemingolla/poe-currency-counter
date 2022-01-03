const inquirer = require('inquirer');
const moment = require('moment');
const { MongoClient } = require('mongodb');
const Chart = require('cli-chart');
const client = new MongoClient('mongodb://localhost:27017');

const main = async () => {
  await client.connect();

  const db = client.db('poe-currency-counter');
  const leagues = await db.collection('items').distinct('league');
  const baseTypes = await db.collection('items').distinct('baseType');

  const { league, baseType } = await inquirer.prompt([
    {
      type: 'list',
      name: 'league',
      message: 'Select league',
      choices: leagues,
    },
    {
      type: 'list',
      name: 'baseType',
      message: 'Select currency base type',
      choices: baseTypes,
    },
  ]);

  const snapshots = await db
    .collection('snapshots')
    .find({ league, baseType })
    .sort({ createdAt: -1 })
    .limit(60)
    .toArray();

  const { sum, count, createdAt: mostRecentCreatedAt } = snapshots[0];
  const { createdAt: beginningCreatedAt } = snapshots[snapshots.length - 1];
  const TABLE_DATE_FORMAT = 'dddd, MMMM Do YYYY, h:mm:ss a';
  const X_LABEL_DATE_FORMAT = 'MMMM Do YYYY';

  const results = [
    { key: baseType + ' Total', value: sum },
    { key: 'Public Stashes Counted', value: count },
    {
      key: 'Start Date',
      value: moment(beginningCreatedAt).format(TABLE_DATE_FORMAT),
    },
    {
      key: 'End Date',
      value: moment(mostRecentCreatedAt).format(TABLE_DATE_FORMAT),
    },
  ].reduce((acc, { key, value }) => {
    acc[key] = value;
    return acc;
  }, {});

  const chart = new Chart({
    ylabel: ' ',
    direction: 'y',
    width: snapshots.length,
    height: 20,
    lmargin: 2,
    step: 1,
  });

  const series = snapshots.reverse().map((x) => {
    return x.sum;
  });

  series.forEach((value) => chart.addBar(value, 'white'));

  console.table(results);
  console.log(
    ' '.repeat(20) +
      moment(beginningCreatedAt).format(X_LABEL_DATE_FORMAT) +
      ' → ' +
      moment(mostRecentCreatedAt).format(X_LABEL_DATE_FORMAT)
  );
  chart.draw();
};

return main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    return process.exit(1);
  });
