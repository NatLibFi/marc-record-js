


/* eslint-disable no-unused-vars */

import generateTests from '@natlibfi/fixugen';
import {READERS} from '@natlibfi/fixura';
import {describe, it} from 'node:test';
import assert from 'node:assert';
import createDebugLogger from 'debug';
import {MarcRecord} from './index.js';

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
 *    skip: Set true to skip this particular case.
 *
 *    only: Set true to run only this case.
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
  //***************************************************************************
  //
  // Generate tests which use operations table in metadata to perform operations
  // to input record, and check it equals to result record after operations.
  //
  //***************************************************************************

  generateTests({
    callback,
    path: [import.meta.dirname, '..', 'test-fixtures', 'index'],
    useMetadataFile: true,
    recurse: true,
    fixura: {
      reader: READERS.JSON,
      failWhenNotFound: true
    },
    hooks: {
      beforeEach: () => {
        // Reset global validation options before each case
        MarcRecord.setValidationOptions({});
      }
    }
  });

  function callback(metadata) {

    // Get input & expected output
    const {getFixture} = metadata;
    const {input, result, immutable, noinput, validationOptions} = metadata;

    // if !noinput and we have input in metadata we use it, otherwise we get it from file input.json
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
    assert.deepStrictEqual(record, outputRecord);

    return;

    //---------------------------------------------------------------------------
    // MARK: Check results
    function checkResults(operations, throws, returns) {
      //debug(`Returns: ${returns} ${result}`);
      if (throws) {
        try {
          return runOps();
        } catch (error) {
          assert.equal(Object.hasOwn(error, 'message'), true);
          assert.equal(Object.hasOwn(error, 'validationResults'), true);
          assert.match(error.message, new RegExp(`^${throws}`, 'u'));
        }
        return;
      }
      const result = runOps();
      if (returns === undefined) {
        return;
      }
      assert.deepEqual(result, returns);

      function runOps() {
        return operations.reduce((_, op) => runOperation(op), record);
      }
    }

    //---------------------------------------------------------------------------
    // MARK: Get Record
    function getRecord(fromMeta, filename) {
      const data = fromMeta || getFixture(filename);

      if (Array.isArray(data)) {
        const text = data.join('\n');
        return MarcRecord.fromString(text, validationOptions);
      }
      return new MarcRecord(data, validationOptions);
    }

    //---------------------------------------------------------------------------
    // Operation shuold return same object for chaining
    // MARK: Run Operation
    function runOperation(op) {
      const {name, args} = op;

      //-------------------------------------------------------------------------
      if (name === 'nop') {
        return record;
      }

      //-------------------------------------------------------------------------
      if (name === 'insertField') {
        assert.equal(record.insertField(args), record);

        return record;
      }

      //-------------------------------------------------------------------------
      if (name === 'insertFields') {
        assert.equal(record.insertFields(args), record);

        return record;
      }

      //-------------------------------------------------------------------------
      if (name === 'appendField') {
        assert.equal(record.appendField(args), record);
        return record;
      }

      //-------------------------------------------------------------------------
      if (name === 'appendFields') {
        assert.equal(record.appendFields(args), record);
        return record;
      }

      //-------------------------------------------------------------------------
      // MARK: Remove field
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

        assert.equal(record.removeField(what), record);
        return record;
      }

      //-------------------------------------------------------------------------
      // MARK: Remove fields
      if (name === 'removeFields') {
        const what = (function (args) {
          const {getRegExp} = args;

          if (getRegExp) {
            return record.get(new RegExp(getRegExp, 'u'));
          }

          throw new Error(`No arg for ${name}(): ${JSON.stringify(args, null, 2)}`);
        }(args));

        assert.equal(record.removeFields(what), record);
        return record;
      }

      //-------------------------------------------------------------------------
      // MARK: Remove subfield
      if (name === 'removeSubfield') {
        const field = record.fields[args.field];
        const subfield = field.subfields[args.subfield];
        assert.equal(record.removeSubfield(subfield, field), record);
        return record;
      }

      //-------------------------------------------------------------------------
      // MARK: Get & pop
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
          return record.pop(what);
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
      if (name === 'getValidationErrors') {
        return record.getValidationErrors();
      }

      //-------------------------------------------------------------------------
      // MARK: Marc record
      if (name === 'MarcRecord') {
        const {leader, fields, validationOptions} = args ?? {};
        const object = args && {leader, fields};
        //debug(`Object: ${JSON.stringify(object, null, 2)}`);

        const created = new MarcRecord(object, validationOptions);
        assert.equal(typeof created, 'object');
        assert.ok(object === undefined || created.fields !== object.fields);
        //debug(`Created: ${JSON.stringify(created, null, 2)}`);
        return created;
      }

      //-------------------------------------------------------------------------
      // MARK: Clone
      if (name === 'clone') {
        const {validationOptions = {}} = args ?? {};
        const cloned = MarcRecord.clone(record, validationOptions);

        // Expect cloned record to be deeply cloned, and still being identical
        assert.equal(Object.is(record, cloned), false);
        if (args === undefined || args.validationOptions === undefined) {
          assert.deepStrictEqual(record, cloned);
          return cloned;
        }

        assert.deepStrictEqual(validationOptions, cloned._validationOptions);
        assert.equal(record.leader, cloned.leader);
        assert.deepStrictEqual(record.fields, cloned.fields);
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
      // MARK: Equals to
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
        assert.equal(MarcRecord.isEqual(record, what), result);
        return result;
      }

      //-------------------------------------------------------------------------
      // MARK: Get fields
      if (name === 'getFields') {
        const {tag, value} = args;

        const fields = record.getFields(tag, value);
        assert.equal(record.containsFieldWithValue(tag, value), fields.length > 0);
        return fields;
      }

      //-------------------------------------------------------------------------
      // MARK: Is type of material
      if (name === 'isTypeOfMaterial') {
        const {target} = args;

        // console.info(`TARGET: '${target}'\n${record.toString()}`); // eslint-disable-line no-console
        if (target === 'BK') { // Book
          return record.isBK();
        }
        if (target === 'CF') { // Computer File
          return record.isCF();
        }
        if (target === 'CR') { // Continuing Resource
          return record.isCR();
        }
        if (target === 'MP') { // Map
          return record.isMP();
        }
        if (target === 'MU') { // Music
          return record.isMU();
        }
        if (target === 'MX') { // Mixed
          return record.isMX();
        }
        if (target === 'VM') { // Visual Material
          return record.isVM();
        }

        return false;
      }

      //-------------------------------------------------------------------------
      if (name === 'getTypeOfMaterial') {
        return record.getTypeOfMaterial();
      }

      //-------------------------------------------------------------------------
      throw new Error(`Invalid operation: ${name}`);
    }
  }
});
