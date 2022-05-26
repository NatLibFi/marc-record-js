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
 * ----------------------------------------------------------------------------
 *
 * Test case directory structure:
 *
 *    test-fixtures/index/MyTest/01/
 *
 *        metadata.json   - Test specifications
 *        input.json      - if input record is not specified in metadata.json
 *        result.json     - if expected output record is not specified in metadata.json
 *
 * ----------------------------------------------------------------------------
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
 *    noinput: [optional] true/false
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
 *    immutable: [optional] true/false
 *
 *      If your test case should not modify the input, set "immutable: true"
 *      to omit expected result record. In this case, result record is compared
 *      to input record.
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
 *          operations: [
 *            { name: "myFunc", args { ... } },
 *            { name: "myFunc", args { ... } },
 *            ...
 *          ]
 *
 *      Args are parsed in runOperation() function. You can add new operations
 *      to that specific function, as well as argument parsing for it.
 *
 *    returns: [optional] object / array
 *
 *      In some tests, you are interested in the return values of the operations,
 *      not the modifications in input record. If "returns" field is present,
 *      the return value of last operation is compared to it.
 *
 *      For example, you may check return values of MarcRecord.get() or
 *      MarcRecord.toString(), and expect the input record stays immutable.
 *
 *    throws: [optional] string
 *
 *      In some cases, you are not interested in return values, but how the
 *      operation fails. I
 *
 * ----------------------------------------------------------------------------
 *
 * Consult test case descriptions in test-fixtures/index/ directory tree.
 *
 * In case your test case is not suitable for automated generation, you can
 * add it in mocha way as usual (consult the end of this file for examples).
 *
 ******************************************************************************/

describe('index', () => {

  beforeEach(() => {
    // Reset global validation options before each case
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

    assert(!metadata.disabled, 'Test disabled.');

    if (metadata.bypass) {
      debug('Passed case.');
      return;
    }

    // Get input & expected output
    const {getFixture} = metadata;
    const {input, result, immutable, noinput, validationOptions} = metadata;

    const inputRecord = noinput ? null : getRecord(input, 'input.json');
    const record = inputRecord ? MarcRecord.clone(inputRecord, validationOptions) : null;

    // Operations may lead to record validation errors after changes. We don't want to
    // get those errors when reading the expected result record, so we turn off
    // global validation checks temporarily.

    MarcRecord.setValidationOptions({fields: false, subfields: false, subfieldValues: false});
    const outputRecord = immutable ? inputRecord : getRecord(result, 'result.json');
    MarcRecord.setValidationOptions({});

    // Get operations
    const {operations, returns, throws} = metadata;

    checkResults(operations, throws, returns);
    expect(record).to.eql(outputRecord);

    return;

    //---------------------------------------------------------------------------

    function checkResults(operations, throws, returns) {
      //debug(`Returns: ${returns} ${result}`);
      if (throws) {
        return expect(runOps).to.throw(throws);
      }
      const result = runOps();
      if (returns === undefined) {
        return;
      }
      expect(result).to.eql(returns);

      function runOps() {
        return operations.reduce((_, op) => runOperation(op), record);
      }
    }

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
        const what = (function (args) {
          const {string, field, regexp, index} = args;

          if (string || field) {
            return string || field;
          }

          if (regexp) {
            return new RegExp(regexp, 'u');
          }

          if (index !== undefined) {
            return record.fields[index];
          }

          throw new Error(`No arg for ${name}(): ${JSON.stringify(args, null, 2)}`);
        }(args));

        expect(record.removeField(what)).to.eql(record);
        return record;
      }

      //-------------------------------------------------------------------------
      if (name === 'removeFields') {
        const what = (function (args) {
          const {getRegExp} = args;

          if (getRegExp) {
            return record.get(new RegExp(getRegExp, 'u'));
          }

          throw new Error(`No arg for ${name}(): ${JSON.stringify(args, null, 2)}`);
        }(args));

        expect(record.removeFields(what)).to.eql(record);
        return record;
      }

      //-------------------------------------------------------------------------
      if (['get', 'pop'].includes(name)) {
        const what = (function (args) {
          const {string, regexp} = args;

          if (string) {
            return string;
          }
          if (regexp) {
            return new RegExp(regexp, 'u');
          }

          throw new Error(`No arg for ${name}(): ${JSON.stringify(args, null, 2)}`);
        }(args));

        if (name === 'pop') {
          return record.pop(what); // eslint-disable-line functional/immutable-data
        }
        return record.get(what);
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
      if (name === 'clone') {
        const {validationOptions} = args ?? {};
        const cloned = MarcRecord.clone(record, validationOptions);

        // Expect cloned record to be deeply cloned, and still being identical
        expect(record._validationOptions !== cloned._validationOptions);
        expect(record.fields !== cloned.fields);
        expect(record.leader !== cloned.leader);
        expect(record.equalsTo(cloned) === true);
        return cloned;
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
        const what = (function (args) {
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
      if (name === 'removeSubfield') {
        const field = record.fields[args.field];
        const subfield = field.subfields[args.subfield];
        return record.removeSubfield(subfield, field);
      }

      //-------------------------------------------------------------------------
      if (name === 'getFields') {
        const {tag, value} = args;

        const fields = record.getFields(tag, value);
        expect(record.containsFieldWithValue(tag, value)).eql(fields.length > 0);
        return fields;
      }

      //-------------------------------------------------------------------------
      throw new Error(`Invalid operation: ${name}`);
    }
  }

  //*****************************************************************************
  //*****************************************************************************

  /*
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
  });
  */
});
