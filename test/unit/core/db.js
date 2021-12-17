const { expect } = require('chai');
const sinon = require('sinon');

const { decorateDatabase } = require('../../../src/core/db').__test;

describe('src/core/db', () => {
  let db;
  let methodStub;
  let logStub;

  let expectedCollection = 'NEEDS TO BE SET';
  let expectedMethod = 'NEEDS TO BE SET';

  beforeEach(() => {
    logStub = {
      trace: sinon.stub(),
      debug: sinon.stub(),
    };
    // Return value needs to be overridden for async tests
    methodStub = sinon.stub();
    dbStub = {
      collection: sinon.stub((collection) => {
        expect(collection).to.equal(expectedCollection);

        return { [expectedMethod]: methodStub };
      }),
    };
  });

  afterEach(() => sinon.restore());

  it('can decorate the database for synchronous methods', () => {
    expectedCollection = 'stashes';
    expectedMethod = 'find';
    const args = ['42', '43'];
    const db = decorateDatabase(dbStub, logStub);

    db[expectedCollection][expectedMethod](...args);

    expect(methodStub.callCount).to.equal(1);
    expect(methodStub.firstCall.args).to.deep.equal(args);
  });

  it('can decorate the database for async methods', async () => {
    expectedCollection = 'breadcrumbs';
    expectedMethod = 'updateOne';
    methodStub.resolves(44);

    const args = ['42', '43'];
    const db = decorateDatabase(dbStub, logStub);
    const result = await db[expectedCollection][expectedMethod](...args);

    expect(methodStub.callCount).to.equal(1);
    expect(methodStub.firstCall.args).to.deep.equal(args);
    expect(result).to.equal(44);
  });
});
