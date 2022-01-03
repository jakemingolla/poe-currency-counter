const moment = require('moment');

const snapshotHandler = async () => {
  const { config, log, db, delay } = await require('../core/index.js');
  const { SNAPSHOT_FREQUENCY_MINUTES } = config;

  const countByBaseType = async (league, createdAt) => {
    const pipeline = await db.items.aggregate([
      {
        $match: { league },
      },
      {
        $group: {
          _id: '$baseType',
          sum: { $sum: '$stackSize' },
          count: { $sum: 1 },
          icon: { $first: '$icon' },
        },
      },
      {
        $project: {
          _id: 0,
          baseType: '$_id',
          sum: 1,
          count: 1,
          icon: 1,
        },
      },
      {
        $sort: {
          sum: -1,
        },
      },
    ]);

    const results = await pipeline.toArray();

    return results.map((x) => {
      x.league = league;
      x.createdAt = createdAt;

      return x;
    });
  };

  const persistSnapshots = async (league, snapshots) => {
    const promises = [];

    snapshots.forEach((snapshot) => {
      promises.push(db.snapshots.insertOne(snapshot));
    });

    const start = new Date();
    log.debug(
      `Attempting to insert ${snapshots.length} snapshots into MongoDB. ` +
        `for league ${league}.`
    );

    return Promise.all(promises).then(() => {
      const durationMs = new Date() - start;

      log.debug(
        `Successfully inserted ${snapshots.length} snapshots into MongoDB ` +
          `for league ${league} in ${durationMs} milliseconds.`
      );
    });
  };

  const getMostRecentSnapshot = async (league) => {
    const query = await db.snapshots.find({ league });
    const results = await query.sort({ createdAt: -1 }).limit(1).toArray();

    if (results.length) {
      return results[0];
    } else {
      return null;
    }
  };

  const getSnapshots = async (league, baseType) => {
    log.debug('start');
    const query = await db.snapshots.find({ league, baseType });
    const results = await query.sort({ createdAt: -1 }).limit(50).toArray();
    log.debug('finish');

    return results;
  };

  const periodicallyTakeSnapshots = async () => {
    const leagues = config.POE_API_COUNTED_LEAGUE_NAMES;

    while (true) {
      const now = moment();

      for await (const league of leagues) {
        const mostRecentSnapshot = await getMostRecentSnapshot(league);

        if (
          !mostRecentSnapshot ||
          now.diff(mostRecentSnapshot.createdAt, 'minutes') >=
            SNAPSHOT_FREQUENCY_MINUTES
        ) {
          snapshots = await countByBaseType(league, now.toISOString());
          await persistSnapshots(league, snapshots);
        }
      }

      // Check back after 1 minute
      await delay(60);
    }
  };

  return { periodicallyTakeSnapshots };
};

module.exports = snapshotHandler();
