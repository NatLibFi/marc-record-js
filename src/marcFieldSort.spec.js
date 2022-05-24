/* eslint-disable no-unused-vars */
/* eslint-disable no-console */

import generateTests from '@natlibfi/fixugen';
import {READERS} from '@natlibfi/fixura';
import {expect} from 'chai';
import createDebugLogger from 'debug';
import {MarcRecord} from '.';

const debug = createDebugLogger('@natlibfi/marc-record/marcFieldSort.spec.js'); // <---

generateTests({
  callback,
  path: [__dirname, '..', 'test-fixtures', 'marcFieldSort'],
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
  expect(sorted).to.eql(new MarcRecord(getFixture('result.json')));
}
