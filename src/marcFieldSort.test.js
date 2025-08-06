import generateTests from '@natlibfi/fixugen';
import {READERS} from '@natlibfi/fixura';
import assert from 'node:assert';
//import createDebugLogger from 'debug';
import {MarcRecord} from './index.js';

//const debug = createDebugLogger('@natlibfi:marc-record:marcFieldSort:test);
//const debugData = debug.extend('data');


generateTests({
  callback,
  path: [import.meta.dirname, '..', 'test-fixtures', 'marcFieldSort'],
  useMetadataFile: true,
  recurse: false,
  fixura: {
    reader: READERS.JSON,
    failWhenNotFound: false
  }
});

function callback({getFixture, disabled}) {
  if (disabled) {
    throw new Error('Test disabled.');
  }

  const rec = new MarcRecord(getFixture('input.json'));
  const sorted = rec.sortFields();
  const expectedResult = new MarcRecord(getFixture('result.json'));
  assert.deepStrictEqual(sorted, expectedResult);
}
