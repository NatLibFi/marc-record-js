/* eslint-disable max-lines */
/* eslint-disable max-statements */
/* eslint-disable complexity */
/* eslint-disable no-unused-vars */
/* eslint-disable no-console */

import generateTests from '@natlibfi/fixugen';
import {READERS} from '@natlibfi/fixura';
import {expect, assert} from 'chai';
import createDebugLogger from 'debug';
import {MarcRecord} from '.';

const debug = createDebugLogger('@natlibfi/marc-record/index.spec.js'); // <---

/******************************************************************************
 *
 * Short guide to make generated test cases:
 *
 * Test case directory structure:
 *
 *    test-fixtures/index/MyTest/01/
 *
 *        metadata.json   - Test specifications
 *        input.json      - if input record is not specified in metadata.json
 *        result.json     - if expected output record is not specified in metadata.json
 *
 * metadata.json:
 *
 *    description: string
 *
 *      Test description.
 *
 *    disabled: false
 *
 *      Set to true to disable this particular case.
 *
 * Specifying input record for test case:
 *
 *    input: object / array of strings
 *
 *      Either object suitable for MarcRecord constructor, or a list of
 *      strings joined with newlines to be used with MarcRecord.fromString.
 *
 *    noinput: [optional]
 *
 *      Some test cases have no sensible input records, for example cases that test
 *      MarcRecord constructor. You can omit "input" field by setting "noinput: true".
 *
 * Specifying expected result of test case:
 *
 *    result: object / array of strings
 *
 *      Record to compare the modifications made to input. Similar to input record,
 *      you can specify the result either as object for MacrRecord(), or as a list
 *      of strings for MarcRecord.fromString()
 *
 *    immutable: [optional]
 *
 *      If your test case should not modify the input, set "immutable: true"
 *      to omit result record.
 *
 * Specifying operations performed in test case:
 *
 *    operations: array of objects
 *
 *      Operations performed to input record. The exact syntax is found from
 *      runOperation() function below. In general, names match to function names,
 *      but arguments may have special cases to feed internal values to functions.
 *
 *      Operations are pairs of name and args:
 *
 *          name - string
 *          args - any
 *
 *      Args are parsed in runOperation() function. You can add new operations
 *      to that specific function, as well as argument parsing for it.
 *
 *      You can add return value checks to operations.
 *
 *    returns: object / array
 *
 *      In some tests, you are interested in the return values of the operations,
 *      not the modifications in input record. If "returns" field is present,
 *      the return value of last operation is compared to it.
 *
 *      For example, you may check return values of MarcRecord.get() or
 *      MarcRecord.toString(), and expect the input record stays immutable.
 *
 * For examples, consult test case descriptions in test-fixtures/index/ directory
 * tree.
 *
 * In case your test case is not suitable for automated generation, you can
 * add it in mocha way as usual (consult the end of this file for examples).
 *
 ******************************************************************************/

describe('index', () => {

  afterEach(() => {
    MarcRecord.setValidationOptions({});
  });

  //***************************************************************************
  //
  // Generate tests which use operations table in metadata to perform operations
  // to input record, and check it equals to result record after operations.
  //
  //***************************************************************************

  generateTests({
    callback: doTest,
    path: [__dirname, '..', 'test-fixtures', 'index'],
    useMetadataFile: true,
    recurse: true,
    fixura: {
      reader: READERS.JSON,
      failWhenNotFound: true
    }
  });

  function doTest(metadata) {
    const {disabled} = metadata;

    if (disabled) {
      throw new Error('Test disabled.');
    }

    // Get input & expected output
    const {getFixture, validationOptions, input, result, immutable, noinput} = metadata;

    const inputRecord = noinput ? null : getRecord(input, 'input.json');
    const outputRecord = immutable ? inputRecord : getRecord(result, 'result.json');

    const record = inputRecord ? MarcRecord.clone(inputRecord, validationOptions) : null;

    // Get operations
    const {operations, returns, throws} = metadata;

    if (throws) {
      expect(runOps).to.throw(throws);
      expect(record).to.eql(outputRecord);
      return;
    }

    if (returns !== undefined) {
      const result = runOps();
      //debug(`Returns: ${returns} ${result}`);
      expect(result).to.eql(returns);
      expect(record).to.eql(outputRecord);
      return;
    }

    runOps();
    expect(record).to.eql(outputRecord);

    return;

    //---------------------------------------------------------------------------

    function getRecord(fromMeta, filename) {
      const data = fromMeta || getFixture(filename);

      if (Array.isArray(data)) {
        const text = data.join('\n');
        return MarcRecord.fromString(text, validationOptions);
      }
      return new MarcRecord(data, validationOptions);
    }

    //---------------------------------------------------------------------------

    function runOps() {
      return operations.reduce((_, op) => runOperation(op), record);
    }

    function runOperation(op) {
      const {name, args} = op;

      //-------------------------------------------------------------------------
      if (name === 'nop') {
        return record;
      }

      //-------------------------------------------------------------------------
      if (name === 'insertField') {
        expect(record.insertField(args)).to.eql(record);
        return record;
      }

      //-------------------------------------------------------------------------
      if (name === 'insertFields') {
        expect(record.insertFields(args)).to.eql(record);
        return record;
      }

      //-------------------------------------------------------------------------
      if (name === 'appendField') {
        expect(record.appendField(args)).to.eql(record);
        return record;
      }

      //-------------------------------------------------------------------------
      if (name === 'appendFields') {
        expect(record.appendFields(args)).to.eql(record);
        return record;
      }

      //-------------------------------------------------------------------------
      if (name === 'removeField') {
        const what = (function(args) {
          const {string, field, regexp, index} = args;

          if (string || field) {
            return string || field;
          }

          if (regexp) {
            return new RegExp(regexp, 'u');
          }

          if (regexp) {
            return new RegExp(regexp, 'u');
          }

          if (index) {
            return record.fields[index];
          }

          throw new Error(`No arg for removeField(): ${args}`);
        }(args));

        expect(record.removeField(what)).to.eql(record);
        return record;
      }

      //-------------------------------------------------------------------------
      if (name === 'removeFields') {
        const what = (function(args) {
          const {getRegExp} = args;

          if (getRegExp) {
            return new RegExp(getRegExp, 'u');
          }

          throw new Error(`No arg for removeFields(): ${args}`);
        }(args));

        expect(record.removeFields(record.get(what))).to.eql(record);
        return record;
      }

      //-------------------------------------------------------------------------
      if (name === 'get') {
        const what = (function(args) {
          const {string, regexp} = args;

          if (string) {
            return string;
          }
          if (regexp) {
            return new RegExp(regexp, 'u');
          }

          throw new Error(`No arg for pop(): ${args}`);
        }(args));

        return record.get(what); // eslint-disable-line functional/immutable-data
      }

      //-------------------------------------------------------------------------
      if (name === 'getControlfields') {
        return record.getControlfields();
      }

      //-------------------------------------------------------------------------
      if (name === 'getDatafields') {
        return record.getDatafields();
      }

      //-------------------------------------------------------------------------
      if (name === 'getValidationOptions') {
        return MarcRecord.getValidationOptions();
      }

      //-------------------------------------------------------------------------
      if (name === 'setValidationOptions') {
        return MarcRecord.setValidationOptions(args);
      }

      //-------------------------------------------------------------------------
      if (name === 'pop') {
        const what = (function(args) {
          const {string, regexp} = args;

          if (string) {
            return string;
          }
          if (regexp) {
            return new RegExp(regexp, 'u');
          }

          throw new Error(`No arg for pop(): ${args}`);
        }(args));

        return record.pop(what); // eslint-disable-line functional/immutable-data
      }

      //-------------------------------------------------------------------------
      if (name === 'MarcRecord') {
        const {leader, fields, validationOptions} = args ?? {};
        const object = args && {leader, fields};
        //debug(`Object: ${JSON.stringify(object, null, 2)}`);

        const created = new MarcRecord(object, validationOptions);
        expect(created).to.be.an('object');
        expect(object === undefined || created.fields !== object.fields);
        //debug(`Created: ${JSON.stringify(created, null, 2)}`);
        return created;
      }

      //-------------------------------------------------------------------------
      if (name === 'toString') {
        return record.toString().split('\n');
      }

      //-------------------------------------------------------------------------
      if (name === 'toObject') {
        return record.toObject();
      }

      //-------------------------------------------------------------------------
      if (name === 'equalsTo') {
        const what = (function(args) {
          const {self, clone, string, object} = args;

          if (self) {
            return record;
          }
          if (clone) {
            return MarcRecord.clone(record);
          }
          if (string) {
            return MarcRecord.fromString(string.join('\n'));
          }
          if (object) {
            return object;
          }

          const {leader, fields, validationOptions} = args;
          return new MarcRecord({leader, fields}, validationOptions);
        }(args));

        //debug(`Record: ${JSON.stringify(record, null, 2)}`);
        //debug(`What: ${JSON.stringify(what, null, 2)}`);

        const result = record.equalsTo(what);
        expect(MarcRecord.isEqual(record, what)).to.eql(result);
        return result;
      }

      //-------------------------------------------------------------------------
      throw new Error(`Invalid operation: ${name}`);
    }
  }

  //*****************************************************************************
  //*****************************************************************************

  //*****************************************************************************

  describe('#clone', () => {
    let record; // eslint-disable-line functional/no-let

    beforeEach(() => {
      record = MarcRecord.fromString([
        'LDR    lead',
        '001    28474',
        '100    ‡aTest Author',
        '245 0  ‡aTest Title',
        '500 #  ‡aNote‡bSecond subfield'
      ].join('\n'));
    });

    it('should make a deep copy of the record', () => {
      const cloneOfMarcRecord = MarcRecord.clone(record);

      expect(cloneOfMarcRecord.equalsTo(record)).to.be.true; // eslint-disable-line no-unused-expressions
      expect(cloneOfMarcRecord.fields !== record.fields);
    });

    it('should make a deep copy of the record with custom validation options', () => {
      const newRecord = new MarcRecord(record, {subfieldValues: false});
      const cloneOfMarcRecord = MarcRecord.clone(record, {subfieldValues: false});

      expect(cloneOfMarcRecord.equalsTo(newRecord)).to.be.true; // eslint-disable-line no-unused-expressions
      expect(cloneOfMarcRecord.fields !== newRecord.fields);
      expect(cloneOfMarcRecord._validationOptions.subfieldValues).to.equals(false);
    });
  });

  //*****************************************************************************

  describe('#removeSubfield', () => {
    it('Should remove a subfield from the record', () => {
      const recordObject = {
        leader: 'foo',
        fields: [{tag: '245', ind1: ' ', ind2: ' ', subfields: [{code: 'a', value: 'foo'}, {code: 'b', value: 'bar'}]}]
      };
      const record = new MarcRecord(JSON.parse(JSON.stringify(recordObject)));

      record.removeSubfield(record.fields[0].subfields[1], record.fields[0]);

      expect(record.get()).to.eql([
        {
          tag: '245', ind1: ' ', ind2: ' ',
          subfields: [{code: 'a', value: 'foo'}]
        }
      ]);
    });
  });

  //*****************************************************************************

  describe('#containsFieldWithValue', () => {
    const record = MarcRecord.fromString([
      'LDR    leader',
      '001    28474',
      '003    aaabbb',
      '100    ‡aTest Author',
      '245 0  ‡aSome content',
      '245 0  ‡aTest Title‡bTest field‡cTest content',
      'STA    ‡aDELETED'
    ].join('\n'));

    it('throws when called with less than 2 parameters', () => {
      expect(record.containsFieldWithValue).to.throw; // eslint-disable-line no-unused-expressions
    });

    it('returns true if matching control field is found', () => {
      expect(record.containsFieldWithValue('003', 'aaabbb')).to.equal(true);
    });

    it('returns false if matching control field is not found', () => {
      expect(record.containsFieldWithValue('003', 'aaabbc')).to.equal(false);
    });

    it('returns true if matching subfield of a datafield is found', () => {
      expect(record.containsFieldWithValue('245', {
        code: 'b', value: 'Test field'
      })).to.equal(true);
    });

    it('returns true if all subfields are matching', () => {
      expect(record.containsFieldWithValue('245', [
        {code: 'b', value: 'Test field'},
        {code: 'c', value: 'Test content'}
      ])).to.equal(true);
    });

    it('returns true if all subfields are matching in array form', () => {
      expect(record.containsFieldWithValue('245', [
        {code: 'b', value: 'Test field'},
        {code: 'c', value: 'Test content'}
      ])).to.equal(true);
    });

    it('returns false if any subfield is not matching', () => {
      expect(record.containsFieldWithValue('245', 'b', 'Test field', 'c', 'not-matching')).to.equal(false);
    });
  });

  //*****************************************************************************

  describe('#getFields', () => {
    const record = MarcRecord.fromString([
      'LDR    leader',
      '001    28474',
      '003    aaabbb',
      '100    ‡aTest Author',
      '245    ‡aSome content‡bTest field',
      '245    ‡aTest Title‡bTest field‡cTest content',
      'STA    ‡aDELETED'
    ].join('\n'));

    it('returns array of fields that match the given tag', () => {
      expect(record.getFields('245')).to.eql([
        {
          tag: '245', ind1: ' ', ind2: ' ', subfields: [
            {code: 'a', value: 'Some content'},
            {code: 'b', value: 'Test field'}
          ]
        },
        {
          tag: '245', ind1: ' ', ind2: ' ', subfields: [
            {code: 'a', value: 'Test Title'},
            {code: 'b', value: 'Test field'},
            {code: 'c', value: 'Test content'}
          ]
        }
      ]);
    });
    it('returns array of fields that match a control field', () => {
      expect(record.getFields('001', '28474')).to.eql([{tag: '001', value: '28474'}]);
    });
    it('returns array of fields that match a datafield', () => {
      expect(record.getFields('245', [{code: 'c', value: 'Test content'}])).to.eql([
        {
          tag: '245', ind1: ' ', ind2: ' ', subfields: [
            {code: 'a', value: 'Test Title'},
            {code: 'b', value: 'Test field'},
            {code: 'c', value: 'Test content'}
          ]
        }
      ]);
    });
    it('returns an empty array when no tags match', () => {
      expect(record.getFields('246')).to.eql([]);
    });
  });
});
