import { afterAll, describe, expect, test, vi } from 'vitest';
import { SearchParameters } from '../enums/searchParameters';
import {
  attemptStringConversion,
  clamp,
  classNames,
  filterEmpty,
  getSearchParameterNumber,
  isMacOs,
  parseJSON,
} from './generic';

const mockNavigator = {
  platform: 'MacIntel',
};

vi.stubGlobal('navigator', mockNavigator);

afterAll(() => {
  vi.restoreAllMocks();
});

describe('clamp', () => {
  test('Should clamp a number already in the correct range to the number itself', () => {
    const clampedNumber = clamp(10, 0, 20);
    expect(clampedNumber).toEqual(10);
  });

  test('Should clamp a number smaller than the correct range to the lower bound in the range', () => {
    const clampedNumber = clamp(5, 10, 20);
    expect(clampedNumber).toEqual(10);
  });

  test('Should clamp a number larger than the correct range to the upper bound in the range', () => {
    const clampedNumber = clamp(25, 10, 20);
    expect(clampedNumber).toEqual(20);
  });
});

describe('classNames', () => {
  test('Should generate the correct complete class string given an object of conditionals', () => {
    expect(
      classNames('foo', {
        bar: true,
        baz: false,
      }),
    ).toEqual('foo bar');

    expect(
      classNames('foo', {
        bar: true,
        baz: true,
      }),
    ).toEqual('foo bar baz');

    expect(
      classNames('foo', {
        bar: false,
        baz: false,
      }),
    ).toEqual('foo');
  });
});

describe('filterEmpty', () => {
  test('Should correctly determine if something is not null or undefined', () => {
    expect(filterEmpty(0)).toEqual(true);
    expect(filterEmpty(false)).toEqual(true);
    expect(filterEmpty(null)).toEqual(false);
    expect(filterEmpty(undefined)).toEqual(false);
  });

  test('Should correctly filter out null and undefined entries in arrays', () => {
    expect([0, 1, 2, null, 4, undefined, 5].filter(filterEmpty)).toStrictEqual([0, 1, 2, 4, 5]);
    expect(['false', false, { foo: 1 }, null, undefined].filter(filterEmpty)).toStrictEqual([
      'false',
      false,
      { foo: 1 },
    ]);
  });
});

describe('attemptStringConversion', () => {
  test('Should convert strings to strings', () => {
    expect(attemptStringConversion('')).toEqual('');
    expect(attemptStringConversion('Foo')).toEqual('Foo');
  });
  test('Should convert numbers to strings', () => {
    expect(attemptStringConversion(1.0101)).toEqual('1.0101');
  });
  test('Should convert arrays to strings', () => {
    expect(attemptStringConversion([1.0101, 'Foo'])).toEqual('1.0101,Foo');
  });
  test('Should convert booleans to strings', () => {
    expect(attemptStringConversion(true)).toEqual('true');
    expect(attemptStringConversion(false)).toEqual('false');
  });
  test('Should return null when attempting to convert non-stringable values', () => {
    expect(attemptStringConversion(null)).toEqual(null);
    expect(attemptStringConversion(undefined)).toEqual(null);
  });
});

describe('isMacOs', () => {
  test('Should return true for Mac browsers', () => {
    expect(isMacOs()).toEqual(true);

    mockNavigator.platform = 'MacPPC';
    expect(isMacOs()).toEqual(true);

    mockNavigator.platform = 'Mac68K';
    expect(isMacOs()).toEqual(true);
  });

  test('Should return false for Windows browsers', () => {
    mockNavigator.platform = 'Win32';
    expect(isMacOs()).toEqual(false);

    mockNavigator.platform = 'Windows';
    expect(isMacOs()).toEqual(false);
  });

  test('Should return false for Linux browsers', () => {
    mockNavigator.platform = 'Linux i686';
    expect(isMacOs()).toEqual(false);

    mockNavigator.platform = 'Linux x86_64';
    expect(isMacOs()).toEqual(false);
  });
});

describe('getSearchParameterNumber', () => {
  test.each(
    Object.keys(SearchParameters).map(key => ({
      key,
      parameter: SearchParameters[key as keyof typeof SearchParameters],
    })),
  )('Should correctly parse out the $key specified in the URL search query parameter', ({ parameter }) => {
    const random = Math.random();
    expect(
      getSearchParameterNumber(parameter as SearchParameters, new URLSearchParams(`?${parameter}=${random}`)),
    ).toBe(random);
  });

  test.each(
    Object.keys(SearchParameters).map(key => ({
      key,
      parameter: SearchParameters[key as keyof typeof SearchParameters],
    })),
  )('Should ignore non number values for the $key specified in the URL search query parameter', ({ parameter }) => {
    expect(getSearchParameterNumber(parameter as SearchParameters, new URLSearchParams(`?${parameter}=foo`))).toBe(
      null,
    );
  });
});

describe('parseJSON', () => {
  test.each([
    {
      testCase:
        '{"activities":[{"anchor_id":201,"anchored_to_start":true,"arguments":{"peelDirection":"fromTip"},"id":199,"metadata":{},"name":"PeelBanana","start_offset":"1 day 04:03:00.645","tags":[{"tag":{"color":"#c1def7","name":"bar"}},{"tag":{"color":"#ff0000","name":"flubber"}}],"type":"PeelBanana"},{"anchor_id":null,"anchored_to_start":true,"arguments":{"growingDuration":3600000000,"quantity":1},"id":200,"metadata":{},"name":"GrowBanana","start_offset":"00:29:51.705","tags":[{"tag":{"color":"#e0c3d4","name":"baz"}}],"type":"GrowBanana"},{"anchor_id":200,"anchored_to_start":true,"arguments":{"quantity":10},"id":201,"metadata":{},"name":"PickBanana","start_offset":"01:07:10.107","tags":[],"type":"PickBanana"},{"anchor_id":null,"anchored_to_start":true,"arguments":{"label":"unlabeled"},"id":202,"metadata":{},"name":"parent","start_offset":"00:00:00","tags":[],"type":"parent"},{"anchor_id":200,"anchored_to_start":false,"arguments":{"quantity":10},"id":203,"metadata":{},"name":"PickBanana","start_offset":"01:16:18.801","tags":[],"type":"PickBanana"},{"anchor_id":null,"anchored_to_start":true,"arguments":{"counter":0},"id":204,"metadata":{},"name":"child","start_offset":"00:00:00","tags":[],"type":"child"}],"duration":"24:00:00","id":61,"model_id":1,"name":"Banana Plan 39","simulation_arguments":{"initialProducer":"Chiquita3","initialPlantCount":203},"start_time":"2024-07-01T00:00:00.000+00:00","tags":[{"tag":{"color":"#ff0000","name":"foo"}},{"tag":{"color":"#c1def7","name":"bar"}}]}',
    },
    { testCase: '{"a": 1, "b": "foo", "c": "bar"}' },
  ])('Should successfully parse strings into JSON objects', async ({ testCase }) => {
    expect(await parseJSON(testCase)).toBeTypeOf('object');
  });

  test.each([{ testCase: 'a: 1, "b": "foo", "c": "bar"' }])(
    'Should throw an error when parsing invalid JSON strings',
    async ({ testCase }) => {
      await expect(parseJSON(testCase)).rejects.toThrowError(/Unexpected/);
    },
  );
});
