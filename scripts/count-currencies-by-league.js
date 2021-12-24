const { MongoClient } = require('mongodb');
const client = new MongoClient('mongodb://localhost:27017');

const main = async () => {
  await client.connect();

  const db = client.db('poe-currency-counter');
  const leagues = await db.collection('items').distinct('league');
  const counts = {};

  for await (const league of leagues) {
    const pipeline = await db.collection('items').aggregate([
      { $match: { league } },
      //{ $group: { _id: league, count: { $sum: 1 } } },
      { $group: { _id: '$baseType', count: { $sum: '$stackSize' } } },
    ]);
    const results = await pipeline.toArray();
    const renamed = results
      .map((x) => {
        x.baseType = x._id;
        delete x._id;
        return x;
      })
      .sort((a, b) => (a.count > b.count ? -1 : 1));

    console.log('---------------------------------------------------------');
    console.log(`                     ${league}`);
    console.log('---------------------------------------------------------');
    console.table(renamed, ['baseType', 'count']);
  }
};

main()
  .then(async () => {
    await client.close();
    return process.exit(0);
  })
  .catch(async (err) => {
    console.error(err);
    await client.close();
    return process.exit(1);
  });
