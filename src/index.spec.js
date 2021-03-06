/**
*
* @licstart  The following is the entire license notice for the JavaScript code in this file.
*
* Copyright 2014-2017 Pasi Tuominen
* Copyright 2018-2020 University Of Helsinki (The National Library Of Finland)
*
* Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:
*
* The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
*
* THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
*
* @licend  The above is the entire license notice
* for the JavaScript code in this file.
*
*/

import {expect} from 'chai';
import {MarcRecord} from './index';

describe('index', () => {
  afterEach(() => {
    MarcRecord.setValidationOptions({});
  });

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

    describe('instance', () => {
      describe('#removeField', () => {
        it('Should remove a field from the record', () => {
          const recordObject = {
            leader: 'foo',
            fields: [{tag: '001', value: 'foo'}, {tag: '005', value: 'bar'}]
          };
          const record = new MarcRecord(JSON.parse(JSON.stringify(recordObject)));

          record.removeField(record.fields[1]);
          expect(record.get()).to.eql([{tag: '001', value: 'foo'}]);
        });
      });

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

      describe('#getControlfields', () => {
        it('should return controlfields and only controlfields', () => {
          const rec = new MarcRecord();
          rec.appendField({tag: '001', value: '98234240'});
          rec.appendField({tag: '008', value: 'field008'});

          rec.appendField({tag: '500', ind1: ' ', ind2: ' ', subfields: [{code: 'a', value: 'Note'}]});

          expect(rec.getControlfields()).to.have.lengthOf(2);
        });
      });

      describe('#getDatafields', () => {
        it('should return only datafields', () => {
          const rec = new MarcRecord();
          rec.appendField({tag: '001', value: '98234240'});
          rec.appendField({tag: '008', value: 'field008'});

          rec.appendField({tag: '500', ind1: ' ', ind2: ' ', subfields: [{code: 'a', value: 'Note'}]});

          expect(rec.getDatafields()).to.have.lengthOf(1);
        });
      });

      describe('#insertField', () => {
        it('should insert field into the correct location', () => {
          const rec = new MarcRecord();
          rec.appendField({tag: '001', value: '98234240'});
          rec.appendField({tag: '008', value: 'field008'});

          rec.appendField({tag: '500', subfields: [{code: 'a', value: 'Note'}]});
          rec.insertField({tag: '245', ind1: ' ', ind2: ' ', subfields: [{code: 'a', value: 'Note'}]});

          expect(rec.fields.map(f => f.tag).join()).to.equal(['001', '008', '245', '500'].join());
        });

        it('should append field into the end if its the correct location', () => {
          const rec = new MarcRecord();
          rec.appendField({tag: '001', value: '98234240'});
          rec.appendField({tag: '008', value: 'field008'});

          rec.appendField({tag: '500', ind1: ' ', ind2: ' ', subfields: [{code: 'a', value: 'Note'}]});
          rec.insertField({tag: '600', ind1: ' ', ind2: ' ', subfields: [{code: 'a', value: 'Note'}]});

          expect(rec.fields.map(f => f.tag).join()).to.equal(['001', '008', '500', '600'].join());
        });

        it('should insert fields specified as arrays', () => {
          const rec = new MarcRecord();
          rec.insertField(['FOO', 'bar']);
          rec.insertField(['BAR', '', '', 'a', 'foo', 'b', 'bar']);

          expect(rec.fields).to.eql([
            {
              tag: 'BAR', ind1: ' ', ind2: ' ', subfields: [
                {code: 'a', value: 'foo'},
                {code: 'b', value: 'bar'}
              ]
            },
            {tag: 'FOO', value: 'bar'}
          ]);
        });

        it('should insert fields specified as arrays (Incomplete subfields /w custom validation', () => {
          const rec = new MarcRecord();
          MarcRecord.setValidationOptions({subfieldValues: false});
          rec.insertField(['FOO', '', '', 'a', 'foo', 'b', '']);

          expect(rec.fields).to.eql([
            {
              tag: 'FOO', ind1: ' ', ind2: ' ',
              subfields: [
                {code: 'a', value: 'foo'},
                {code: 'b', value: ''}
              ]
            }
          ]);
        });

        it('should fail to insert a field', () => {
          const rec = new MarcRecord();
          expect(() => {
            rec.appendField({tag: '001'});
          }).to.throw(/^Field is invalid: \{"tag":"001"\}$/u);
        });
      });

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
    });
  });

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
});
