/* eslint-disable max-lines */
/* eslint-disable max-statements */
/* eslint-disable no-unused-vars */
/* eslint-disable no-console */

import generateTests from '@natlibfi/fixugen';
import {READERS} from '@natlibfi/fixura';
import {expect, assert} from 'chai';
import createDebugLogger from 'debug';
import {MarcRecord} from '.';

const debug = createDebugLogger('@natlibfi/marc-record/index.spec.js'); // <---

describe('index', () => {

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

    const {getFixture, validationOptions, input, result, immutable} = metadata;

    const inputRecord = new MarcRecord(input || getFixture('input.json'), validationOptions);
    const outputRecord = immutable ? inputRecord : new MarcRecord(result || getFixture('result.json'), validationOptions);

    const record = MarcRecord.clone(inputRecord, validationOptions);

    const {operations, returns, throws} = metadata;

    if (throws) {
      expect(runOps).to.throw(throws);
      expect(record).to.eql(outputRecord);
      return;
    }

    if (returns) {
      expect(runOps()).to.eql(returns);
      expect(record).to.eql(outputRecord);
      return;
    }

    runOps();
    expect(record).to.eql(outputRecord);

    return;

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
      if (name === 'removeField') {
        const {string, field, regexp, index} = args;

        if (string || field) {
          assert.equal(record.removeField(string || field), record);
          return record;
        }

        if (regexp) {
          assert.equal(record.removeField(new RegExp(regexp, 'u')), record);
          return record;
        }

        if (index) {
          assert.equal(record.removeField(record.fields[index]), record);
          return record;
        }

        throw new Error(`No arg for removeField: ${args}`);
      }

      //-------------------------------------------------------------------------
      if (name === 'removeFields') {
        const {getRegExp} = args;

        if (getRegExp) {
          assert.equal(record.removeFields(record.get(new RegExp(getRegExp, 'u'))), record);
          return record;
        }

        throw new Error(`No arg for removeField: ${args}`);
      }

      //-------------------------------------------------------------------------
      if (name === 'get') {
        const {string, regexp} = args;
        if (string) {
          return record.get(string);
        }

        if (regexp) {
          return record.get(new RegExp(regexp, 'u'));
        }

        throw new Error(`No arg for get: ${args}`);
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
      throw new Error(`Invalid operation: ${name}`);
      //assert.fail(`Invalid operation: ${name}`);
    }

  }

  //*****************************************************************************
  //*****************************************************************************

  describe('#constructor', () => {
    it('Should create a record', () => {
      const record = new MarcRecord();

      expect(record).to.be.an('object');
      expect(record).to.have.all.keys('_validationOptions', 'leader', 'fields');
    });

    it('Should create a record based on an object', () => {
      const a = {
        leader: '',
        fields: [{tag: '245', subfields: [{code: 'a', value: 'foo'}]}]
      };

      const b = new MarcRecord(a);

      expect({
        _validationOptions: {},
        leader: '',
        fields: [
          {
            tag: '245',
            ind1: ' ', ind2: ' ',
            subfields: [{code: 'a', value: 'foo'}]
          }
        ]
      }).to.eql(b);
    });

    it('Should create a record with validation options', () => {
      const record = new MarcRecord({
        leader: 'foo',
        fields: []
      }, {fields: false});

      expect(record).to.be.an('object');
      expect(record).to.have.all.keys('_validationOptions', 'leader', 'fields');
    });

    it('Should fail to create a record from an object', () => {
      expect(() => {
        new MarcRecord({}); // eslint-disable-line no-new
      }).to.throw(/^Record is invalid$/u);
    });
  });

  //*****************************************************************************

  describe('#pop', () => {
    it('Should get fields with tag matching query and remove them from record', () => {
      const rec = new MarcRecord({
        leader: 'foo',
        fields: [
          {tag: '001', value: 'foo'},
          {tag: '002', value: 'foo'}, // pop
          {tag: '002', value: 'foo'}, // pop
          {tag: '003', value: 'foo'}, // pop
          {tag: '004', value: 'foo'},
          {tag: '005', value: 'bar'}
        ]
      });

      const fields = rec.pop(/002|003/u); // eslint-disable-line functional/immutable-data

      expect(fields.map(f => f.tag).join()).to.equal(['002', '002', '003'].join());
      expect(rec.fields.map(f => f.tag).join()).to.equal(['001', '004', '005'].join());

      rec.insertFields(fields);
      expect(rec.fields.map(f => f.tag).join()).to.equal(['001', '002', '002', '003', '004', '005'].join());

      //record.removeField(record.fields[1]);
      //expect(record.get()).to.eql([{tag: '001', value: 'foo'}]);
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

  describe('#toString', () => {
    it('should generate human readable MARC string', () => {
      const testDataObject = {
        leader: 'leader',
        fields: [
          {
            tag: '001',
            value: '28474'
          }
        ]
      };
      const rec = new MarcRecord(testDataObject);

      rec.appendField({tag: '100', ind1: ' ', ind2: ' ', subfields: [{code: 'a', value: 'Test Author'}]});
      rec.appendField({tag: '245', ind1: '0', ind2: ' ', subfields: [{code: 'a', value: 'Test Title'}]});
      rec.appendField({tag: '500', ind1: '#', ind2: ' ', subfields: [{code: 'a', value: 'Note'}]});

      const compareRec = [
        'LDR    leader',
        '001    28474',
        '100    ‡aTest Author',
        '245 0  ‡aTest Title',
        '500 #  ‡aNote'
      ].join('\n');

      expect(rec.toString()).to.equal(compareRec);
    });
  });

  //*****************************************************************************

  describe('#fromString', () => {
    it('should create proper record from string generated by toString()', () => {
      const testDataObject = {
        leader: 'leader',
        fields: [
          {
            tag: '001',
            value: '28474'
          }
        ]
      };
      const rec = new MarcRecord(testDataObject);

      rec.appendField({tag: '100', ind1: ' ', ind2: ' ', subfields: [{code: 'a', value: 'Test Author'}]});
      rec.appendField({tag: '245', ind1: '0', ind2: ' ', subfields: [{code: 'a', value: 'Test Title'}]});
      rec.appendField({
        tag: '500', ind1: '#', ind2: ' ', subfields: [
          {code: 'a', value: 'Note'},
          {code: 'b', value: 'Second subfield'}
        ]
      });

      const stringRep = [
        'LDR    leader',
        '001    28474',
        '100    ‡aTest Author',
        '245 0  ‡aTest Title',
        '500 #  ‡aNote‡bSecond subfield'
      ].join('\n');

      const parsedMarcRecord = MarcRecord.fromString(stringRep);

      expect(parsedMarcRecord.toString()).to.equal(rec.toString());
    });

    it('should handle empty values', () => {
      const testDataObject = {
        leader: 'leader',
        fields: [
          {
            tag: '001',
            value: '28474'
          }
        ]
      };
      const rec = new MarcRecord(testDataObject, {fields: false, subfields: false, subfieldValues: false});

      rec.appendField({tag: '100', ind1: ' ', ind2: ' ', subfields: [{code: 'a', value: 'Test Author'}]});
      rec.appendField({tag: '245', ind1: '0', ind2: ' ', subfields: [{code: 'a', value: 'Test Title'}]});
      rec.appendField({
        tag: '500', ind1: '#', ind2: ' ', subfields: [
          {code: 'a', value: 'Note'},
          {code: 'b'}
        ]
      });

      const stringRep = [
        'LDR    leader',
        '001    28474',
        '100    ‡aTest Author',
        '245 0  ‡aTest Title',
        '500 #  ‡aNote‡b'
      ].join('\n');

      const parsedMarcRecord = MarcRecord.fromString(stringRep, {fields: false, subfields: false, subfieldValues: false});

      expect(parsedMarcRecord.toString()).to.equal(rec.toString());
    });
  });

  //*****************************************************************************

  describe('#toObject', () => {
    it('should generate a plain JSON-serializable object', () => {
      const obj = {
        leader: 'leader',
        fields: [
          {
            tag: '001',
            value: '28474'
          }
        ]
      };
      const record = new MarcRecord(obj);

      expect(record.toObject()).to.eql(obj);
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

  //*****************************************************************************

  describe('#equalsTo', () => {
    it('should return true when record is compared to itself', () => {
      const recordString = [
        'LDR    lead',
        '001    28474',
        '100    ‡aTest Author'
      ].join('\n');

      const record = MarcRecord.fromString(recordString);

      expect(record.equalsTo(record)).to.be.true; // eslint-disable-line no-unused-expressions
    });

    it('should return true if records are equal', () => {
      const recordString = [
        'LDR    lead',
        '001    28474',
        '100    ‡aTest Author'
      ].join('\n');

      const record1 = MarcRecord.fromString(recordString);
      const record2 = MarcRecord.fromString(recordString);

      expect(record1.equalsTo(record2)).to.be.true; // eslint-disable-line no-unused-expressions
    });
  });

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

  describe('#setValidationOptions/#getValidationOptions', () => {
    it('Should set validationOptions', () => {
      MarcRecord.setValidationOptions({fields: false});

      expect(MarcRecord.getValidationOptions({})).to.eql({
        fields: false, subfields: true, subfieldValues: true
      });

      MarcRecord.setValidationOptions({});

      expect(MarcRecord.getValidationOptions({})).to.eql({
        fields: true, subfields: true, subfieldValues: true
      });
    });
  });

  //*****************************************************************************

  describe('#isEqual', () => {
    it('should return true when record is compared to itself', () => {
      const recordString = [
        'LDR    lead',
        '001    28474',
        '100    ‡aTest Author'
      ].join('\n');

      const record = MarcRecord.fromString(recordString);

      expect(MarcRecord.isEqual(record, record)).to.be.true; // eslint-disable-line no-unused-expressions
    });

    it('should return true if records are equal', () => {
      const recordString = [
        'LDR    lead',
        '001    28474',
        '100    ‡aTest Author'
      ].join('\n');

      const record1 = MarcRecord.fromString(recordString);
      const record2 = MarcRecord.fromString(recordString);

      expect(MarcRecord.isEqual(record1, record2)).to.be.true; // eslint-disable-line no-unused-expressions
    });

    it('should return false if records have differing data fields', () => {
      const record1 = MarcRecord.fromString([
        'LDR    lead',
        '001    28474',
        '100    ‡aTest Author'
      ].join('\n'));

      const record2 = MarcRecord.fromString([
        'LDR    lead',
        '001    28474',
        '100    ‡aTest Author‡cExtra-content'
      ].join('\n'));

      expect(MarcRecord.isEqual(record1, record2)).to.be.false; // eslint-disable-line no-unused-expressions
    });

    it('should return false if records have differing amount of data fields', () => {
      const record1 = MarcRecord.fromString([
        'LDR    lead',
        '001    28474',
        '100    ‡aTest Author'
      ].join('\n'));

      const record2 = MarcRecord.fromString([
        'LDR    lead',
        '001    28474',
        '100    ‡aTest Author',
        '245    ‡aTest Title'
      ].join('\n'));

      expect(MarcRecord.isEqual(record1, record2)).to.be.false; // eslint-disable-line no-unused-expressions
    });

    it('should return false if records have differing indicators', () => {
      const record1 = MarcRecord.fromString([
        'LDR    lead',
        '001    28474',
        '100    ‡aTest Author'
      ].join('\n'));
      const record2 = MarcRecord.fromString([
        'LDR    lead',
        '001    28474',
        '100 2  ‡aTest Author'
      ].join('\n'));

      expect(MarcRecord.isEqual(record1, record2)).to.be.false; // eslint-disable-line no-unused-expressions
    });

    it('should return false if records have differing control fields', () => {
      const record1 = MarcRecord.fromString([
        'LDR    lead',
        '001    284333',
        '100    ‡aTest Author'
      ].join('\n'));
      const record2 = MarcRecord.fromString([
        'LDR    lead',
        '001    28474',
        '100    ‡aTest Author'
      ].join('\n'));

      expect(MarcRecord.isEqual(record1, record2)).to.be.false; // eslint-disable-line no-unused-expressions
    });

    it('should return false if records have differing leaders', () => {
      const record1 = MarcRecord.fromString([
        'LDR    leader1',
        '001    28474',
        '100    ‡aTest Author'
      ].join('\n'));
      const record2 = MarcRecord.fromString([
        'LDR    leader2',
        '001    28474',
        '100    ‡aTest Author'
      ].join('\n'));

      expect(MarcRecord.isEqual(record1, record2)).to.be.false; // eslint-disable-line no-unused-expressions
    });
  });
});
