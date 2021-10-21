/**
*
* @licstart  The following is the entire license notice for the JavaScript code in this file.
*
* Copyright 2014-2017 Pasi Tuominen
* Copyright 2018-2021 University Of Helsinki (The National Library Of Finland)
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
import * as Utils from './utils';

describe('utils', () => {
  describe('#clone', () => {
    it('Should clone an object', () => {
      const a = {foo: 'bar'};
      const b = Utils.clone(a);

      expect(JSON.stringify(a)).to.equal(JSON.stringify(b));
      expect(a).to.be.eql(b);
      expect(a).to.not.equal(b);
    });
  });

  describe('#validateRecord', () => {
    it('Should consider the record valid', () => {
      const record = {
        leader: 'foo',
        fields: [{tag: 'FOO', value: 'bar'}]
      };

      expect(Utils.validateRecord(record)).to.not.throw; // eslint-disable-line no-unused-expressions
    });

    it('Should consider the record invalid', () => {
      const record = {
        leader: 'foo'
      };

      try {
        Utils.validateRecord(record);
      } catch (err) {
        expect(err.message).to.match(/^Record is invalid$/u);
        expect(err).to.have.property('validationResults');
        return;
      }

      throw new Error('Should throw');
    });
  });

  describe('#validateField', () => {
    it('Should consider the field valid (tag and value)', () => {
      const field = {tag: 'FOO', value: 'BAR'};

      expect(Utils.validateField(field)).to.not.throw; // eslint-disable-line no-unused-expressions
    });

    it('Should consider the field valid (tag, indicators and subfields)', () => {
      const field = {tag: 'FOO', 'ind1': ' ', 'ind2': ' ', 'subfields': [{'code': 'b', 'value': '39'}, {'code': 'c', 'value': '20150121'}]};

      expect(Utils.validateField(field)).to.not.throw; // eslint-disable-line no-unused-expressions
    });

    it('Should consider the field invalid (just a tag)', () => {
      const field = {tag: 'FOO'};

      try {
        Utils.validateField(field);
      } catch (err) {
        expect(err.message).to.match(/^Field is invalid: \{"tag":"FOO"\}$/u);
        expect(err).to.have.property('validationResults');
        return;
      }

      throw new Error('Should throw');
    });

    it.skip('Should consider the field invalid (tag, indicators and value)', () => {
      const field = {'tag': 'CAT', 'ind1': ' ', 'ind2': ' ', 'value': '20150121'};

      try {
        Utils.validateField(field);
      } catch (err) {
        expect(err.message).to.match(/^Field is invalid: /u);
        expect(err).to.have.property('validationResults');
        return;
      }

      throw new Error('Should throw');
    });

    it.skip('Should consider the field invalid (tag, indicators and both value and subfields)', () => {
      const field = {'tag': 'CAT', 'ind1': ' ', 'ind2': ' ', 'value': '20150121', 'subfields': [{'code': 'b', 'value': '39'}, {'code': 'c', 'value': '20150121'}]};

      try {
        Utils.validateField(field);
      } catch (err) {
        expect(err.message).to.match(/^Field is invalid: /u);
        expect(err).to.have.property('validationResults');
        return;
      }

      throw new Error('Should throw');
    });

    it.skip('Should consider the field invalid (tag, value and subfields)', () => {
      const field = {'tag': 'CAT', 'value': '20150121', 'subfields': [{'code': 'b', 'value': '39'}, {'code': 'c', 'value': '20150121'}]};

      try {
        Utils.validateField(field);
      } catch (err) {
        expect(err.message).to.match(/^Field is invalid: /u);
        expect(err).to.have.property('validationResults');
        return;
      }

      throw new Error('Should throw');
    });


    it('Should consider the field invalid (tag, subfields but no indicators)', () => {
      const field = {'tag': 'CAT', 'subfields': [{'code': 'b', 'value': '39'}, {'code': 'c', 'value': '20150121'}]};

      try {
        Utils.validateField(field);
      } catch (err) {
        expect(err.message).to.match(/^Field is invalid: /u);
        expect(err).to.have.property('validationResults');
        return;
      }

      throw new Error('Should throw');
    });

    it('Should consider the field invalid (tag, indicators, no subfields)', () => {
      const field = {'tag': 'FOO', 'ind1': ' ', 'ind2': ' '};

      try {
        Utils.validateField(field);
      } catch (err) {
        expect(err.message).to.match(/^Field is invalid: /u);
        expect(err).to.have.property('validationResults');
        return;
      }

      throw new Error('Should throw');
    });


    describe('subfields', () => {
      it('Should consider the field invalid (subfield with no code)', () => {
        const field = {'tag': 'CAT', 'ind1': ' ', 'ind2': ' ', 'subfields': [{'value': 'foo'}, {'code': 'c', 'value': '20150121'}]};

        try {
          Utils.validateField(field);
        } catch (err) {
          expect(err.message).to.match(/^Field is invalid: /u);
          expect(err).to.have.property('validationResults');
          return;
        }

        throw new Error('Should throw');
      });

      it('Should consider the field invalid (subfield with empty value)', () => {
        const field = {'tag': 'CAT', 'ind1': ' ', 'ind2': ' ', 'subfields': [{'code': 'b', 'value': ''}, {'code': 'c', 'value': '20150121'}]};

        try {
          Utils.validateField(field);
        } catch (err) {
          expect(err.message).to.match(/^Field is invalid: /u);
          expect(err).to.have.property('validationResults');
          return;
        }

        throw new Error('Should throw');
      });

      it('Should consider the field valid (subfield with empty value), subfieldValues: false', () => {
        const field = {'tag': 'CAT', 'ind1': ' ', 'ind2': ' ', 'subfields': [{'code': 'b', 'value': ''}, {'code': 'c', 'value': '20150121'}]};

        // eslint-disable-next-line no-unused-expressions
        expect(Utils.validateField(field, {subfieldValues: false})).not.to.throw;

      });

      it('Should consider the field invalid (subfield with no value)', () => {
        const field = {'tag': 'CAT', 'ind1': ' ', 'ind2': ' ', 'subfields': [{'code': 'b'}, {'code': 'c', 'value': '20150121'}]};

        try {
          Utils.validateField(field);
        } catch (err) {
          expect(err.message).to.match(/^Field is invalid: /u);
          expect(err).to.have.property('validationResults');
          return;
        }

        throw new Error('Should throw');
      });

      it('Should consider the field valid (subfield with no value), subfieldValues: false', () => {
        const field = {'tag': 'CAT', 'ind1': ' ', 'ind2': ' ', 'subfields': [{'code': 'b'}, {'code': 'c', 'value': '20150121'}]};

        // eslint-disable-next-line no-unused-expressions
        expect(Utils.validateField(field, {subfieldValues: false})).not.to.throw;

      });
    });

    describe('indicators', () => {
      it('Should consider the field invalid (empty indicator)', () => {
        const field = {'tag': 'CAT', 'ind1': ' ', 'ind2': '', 'subfields': [{'code': 'c', 'value': '20150121'}]};

        try {
          Utils.validateField(field);
        } catch (err) {
          expect(err.message).to.match(/^Field is invalid: /u);
          expect(err).to.have.property('validationResults');
          return;
        }

        throw new Error('Should throw');
      });

      it('Should consider the field invalid (two-character indicator)', () => {
        const field = {'tag': 'CAT', 'ind1': '00', 'ind2': ' ', 'subfields': [{'code': 'c', 'value': '20150121'}]};

        try {
          Utils.validateField(field);
        } catch (err) {
          expect(err.message).to.match(/^Field is invalid: /u);
          expect(err).to.have.property('validationResults');
          return;
        }

        throw new Error('Should throw');
      });


    });

  });

});
