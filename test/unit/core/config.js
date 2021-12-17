const { expect } = require('chai');
const { prepareConfig } = require('../../../src/core/config').__test;

describe('src/core/config', () => {
  it('can return default strings', () => {
    const localDefaults = [
      {
        name: 'FOO',
        // NOTE: should NOT be cast to an ingeger
        value: '42',
      },
    ];
    const expected = { FOO: '42' };
    const config = prepareConfig(localDefaults, {});

    expect(config).to.deep.equal(expected);
  });

  it('can return default integers', () => {
    const localDefaults = [
      {
        name: 'FOO',
        value: 42,
        type: 'integer',
      },
    ];
    const expected = { FOO: 42 };
    const config = prepareConfig(localDefaults, {});

    expect(config).to.deep.equal(expected);
  });

  it('can return default lists of strings', () => {
    const localDefaults = [
      {
        name: 'FOO',
        value: '43,bar,baz',
        type: 'list:string',
      },
    ];
    const expected = { FOO: ['43', 'bar', 'baz'] };
    const config = prepareConfig(localDefaults, {});

    expect(config).to.deep.equal(expected);
  });

  it('can return default lists of integers', () => {
    const localDefaults = [
      {
        name: 'FOO',
        value: '43,42,41',
        type: 'list:integer',
      },
    ];
    const expected = { FOO: [43, 42, 41] };
    const config = prepareConfig(localDefaults, {});

    expect(config).to.deep.equal(expected);
  });

  it('can override strings', () => {
    const localDefaults = [
      {
        name: 'FOO',
        value: '42',
      },
    ];
    const environmentOverride = {
      FOO: 'overridden',
    };
    const expected = { FOO: 'overridden' };
    const config = prepareConfig(localDefaults, environmentOverride);

    expect(config).to.deep.equal(expected);
  });

  it('can override integers', () => {
    const localDefaults = [
      {
        name: 'FOO',
        value: 42,
        type: 'integer',
      },
    ];
    const environmentOverride = {
      FOO: '100',
    };
    const expected = { FOO: 100 };
    const config = prepareConfig(localDefaults, environmentOverride);

    expect(config).to.deep.equal(expected);
  });

  it('can override lists of strings', () => {
    const localDefaults = [
      {
        name: 'FOO',
        value: ['43', '42', '41'],
        type: 'list:string',
      },
    ];
    const environmentOverride = {
      FOO: '100,101,102',
    };
    const expected = { FOO: ['100', '101', '102'] };
    const config = prepareConfig(localDefaults, environmentOverride);

    expect(config).to.deep.equal(expected);
  });

  it('can override lists of integers', () => {
    const localDefaults = [
      {
        name: 'FOO',
        value: ['43', '42', '41'],
        type: 'list:integer',
      },
    ];
    const environmentOverride = {
      FOO: '100,101,102',
    };
    const expected = { FOO: [100, 101, 102] };
    const config = prepareConfig(localDefaults, environmentOverride);

    expect(config).to.deep.equal(expected);
  });

  it('ignores extraneous environment variables', () => {
    const localDefaults = [{ name: 'FOO', value: '42' }];
    const environmentOverride = {
      BAR: 'BAZ',
    };
    const expected = { FOO: '42' };
    const config = prepareConfig(localDefaults, environmentOverride);

    expect(config).to.deep.equal(expected);
  });

  it('can extract specific environment overrides', () => {
    const localDefaults = [
      {
        name: 'FOO',
        requiresEnvironmentOverride: true,
        type: 'integer',
      },
    ];
    const environmentOverride = { FOO: '42' };
    const expected = { FOO: 42 };
    const config = prepareConfig(localDefaults, environmentOverride);

    expect(config).to.deep.equal(expected);
  });

  it('can throw an error if required environment override is missing', () => {
    const localDefaults = [
      {
        name: 'FOO',
        requiresEnvironmentOverride: true,
        type: 'integer',
      },
    ];
    const environmentOverride = { BAR: '42' };

    try {
      prepareConfig(localDefaults, environmentOverride);
      throw new Error('Error not thrown, test is broken.');
    } catch (err) {
      expect(err.message).to.equal(
        'Missing required environment override for FOO.'
      );
    }
  });
});
