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
        leader: '02848ccm a22005894i 4500',
        fields: [{tag: 'FOO', value: 'bar'}]
      };

      expect(Utils.validateRecord(record)).to.not.throw; // eslint-disable-line no-unused-expressions
    });

    it('Should consider the record invalid', () => {
      const record = {
        leader: '02848ccm a22005894i 4500'
      };

      try {
        Utils.validateRecord(record);
      } catch (err) {
        expect(err.message).to.match(/^Record is invalid/u);
        expect(err).to.have.property('validationResults');
        return;
      }

      throw new Error('Should throw');
    });
  });

  describe('#validateField', () => {
    it('Should consider the field valid (control field: tag and value)', () => {
      const field = {tag: 'FOO', value: 'BAR'};

      expect(Utils.validateField(field)).to.not.throw; // eslint-disable-line no-unused-expressions
    });

    it('Should consider the field valid (data field: tag, indicators and subfields)', () => {
      const field = {tag: 'FOO', 'ind1': ' ', 'ind2': ' ', 'subfields': [{'code': 'b', 'value': '39'}, {'code': 'c', 'value': '20150121'}]};

      expect(Utils.validateField(field)).to.not.throw; // eslint-disable-line no-unused-expressions
    });

    it('Should consider the field invalid (just value)', () => {
      const field = {value: 'FOO'};

      try {
        Utils.validateField(field);
      } catch (err) {
        expect(err.message).to.match(/^Field is invalid:/u);
        expect(err).to.have.property('validationResults');
        return;
      }

      throw new Error('Should throw');
    });

    it('Should consider the field invalid (just a tag)', () => {
      const field = {tag: 'FOO'};

      try {
        Utils.validateField(field);
      } catch (err) {
        expect(err.message).to.match(/^Field is invalid: \{"tag":"FOO"\}/u);
        expect(err).to.have.property('validationResults');
        return;
      }

      throw new Error('Should throw');
    });

    it('Should consider the field invalid (just subfields)', () => {
      const field = {'subfields': [{'code': 'b', 'value': '39'}, {'code': 'c', 'value': '20150121'}]};

      try {
        Utils.validateField(field);
      } catch (err) {
        expect(err.message).to.match(/^Field is invalid:/u);
        expect(err).to.have.property('validationResults');
        return;
      }

      throw new Error('Should throw');
    });

    it('Should consider the field invalid (just indicators)', () => {
      const field = {'ind1': ' ', 'ind2': ' '};

      try {
        Utils.validateField(field);
      } catch (err) {
        expect(err.message).to.match(/^Field is invalid:/u);
        expect(err).to.have.property('validationResults');
        return;
      }

      throw new Error('Should throw');
    });


    // https://www.loc.gov/marc/specifications/specrecstruc.html:
    // ... Indicators are not used in control fields ...

    it('Should consider the field invalid (tag, indicators and value)', () => {
      const field = {'tag': 'CAT', 'ind1': ' ', 'ind2': ' ', 'value': '20150121'};

      try {
        Utils.validateField(field);
      } catch (err) {
        expect(err.message).to.match(/^Field is invalid:/u);
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


    it('Should consider the field invalid (tag, subfields, no indicators)', () => {
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

    describe('controlfields/datafields', () => {

      //  https://www.loc.gov/marc/specifications/specrecstruc.html
      // control field. A variable field containing information useful or required for the processing of the record.
      // Control fields are assigned tags beginning with two zeroes. Control fields with fixed length data elements are restricted to ASCII graphics.
      // NOTE: Aleph uses also some other controlfields with non-numeric tags (FMT, LDR if its handled as a controlfield)

      it.skip('Should consider the field invalid (numeric controlfield tag not beginning with 00)', () => {
        const field = {'tag': '500', 'value': '123456'};

        try {
          Utils.validateField(field);
        } catch (err) {
          expect(err.message).to.match(/^Field is invalid:/u);
          expect(err).to.have.property('validationResults');
          return;
        }

        throw new Error('Should throw');
      });

      it.skip('Should consider the field invalid (controlfield with non-ASCII content)', () => {
        const field = {'tag': '003', 'value': 'ÅÖÖ'};

        try {
          Utils.validateField(field);
        } catch (err) {
          expect(err.message).to.match(/^Field is invalid:/u);
          expect(err).to.have.property('validationResults');
          return;
        }

        throw new Error('Should throw');
      });

      // https://www.loc.gov/marc/specifications/specrecstruc.html
      // data field. A variable field containing bibliographic or other data. Data fields are assigned tags beginning with characters other than two zeroes.
      // Data fields contain data in any MARC 21 character set unless a field-specific restriction applies.

      it.skip('Should consider the field invalid (datafield tag beginning with 00)', () => {
        const field = {'tag': '004', 'ind1': ' ', 'ind2': ' ', 'subfields': [{'code': 'c', 'value': '20150121'}]};

        try {
          Utils.validateField(field);
        } catch (err) {
          expect(err.message).to.match(/^Field is invalid:/u);
          expect(err).to.have.property('validationResults');
          return;
        }

        throw new Error('Should throw');
      });


    });

    describe('tag', () => {

      // https://www.loc.gov/marc/specifications/specrecstruc.html
      // tag. A three character string used to identify or label an associated variable field.
      // The tag may consist of ASCII numeric characters (decimal integers 0-9) and/or ASCII alphabetic characters (uppercase or lowercase, but not both).

      it('Should consider the field invalid (4 character tag)', () => {
        const field = {'tag': '4444', 'ind1': ' ', 'ind2': ' ', 'subfields': [{'code': 'c', 'value': '20150121'}]};

        try {
          Utils.validateField(field);
        } catch (err) {
          expect(err.message).to.match(/^Field is invalid: /u);
          expect(err).to.have.property('validationResults');
          return;
        }

        throw new Error('Should throw');
      });

      it('Should consider the field invalid (2 character tag)', () => {
        const field = {'tag': '44', 'ind1': ' ', 'ind2': ' ', 'subfields': [{'code': 'c', 'value': '20150121'}]};

        try {
          Utils.validateField(field);
        } catch (err) {
          expect(err.message).to.match(/^Field is invalid: /u);
          expect(err).to.have.property('validationResults');
          return;
        }

        throw new Error('Should throw');
      });

      it('Should consider the field invalid (empty tag)', () => {
        const field = {'tag': '', 'ind1': ' ', 'ind2': ' ', 'subfields': [{'code': 'c', 'value': '20150121'}]};

        try {
          Utils.validateField(field);
        } catch (err) {
          expect(err.message).to.match(/^Field is invalid: /u);
          expect(err).to.have.property('validationResults');
          return;
        }

        throw new Error('Should throw');
      });

      it('Should consider the field invalid (tag with non-alphanumeric character)', () => {
        const field = {'tag': '#44', 'ind1': ' ', 'ind2': ' ', 'subfields': [{'code': 'c', 'value': '20150121'}]};

        try {
          Utils.validateField(field);
        } catch (err) {
          expect(err.message).to.match(/^Field is invalid: /u);
          expect(err).to.have.property('validationResults');
          return;
        }

        throw new Error('Should throw');
      });

      it('Should consider the field invalid (tag with mixed case characters)', () => {
        const field = {'tag': 'AaA', 'ind1': ' ', 'ind2': ' ', 'subfields': [{'code': 'c', 'value': '20150121'}]};

        try {
          Utils.validateField(field);
        } catch (err) {
          expect(err.message).to.match(/^Field is invalid: /u);
          expect(err).to.have.property('validationResults');
          return;
        }

        throw new Error('Should throw');
      });

      it('Should consider the field invalid (tag with non-ASCII characters)', () => {
        const field = {'tag': 'ÄÄÄ', 'ind1': ' ', 'ind2': ' ', 'subfields': [{'code': 'c', 'value': '20150121'}]};

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


    describe('subfields', () => {

      describe('subfieldCodes', () => {

        // https://www.loc.gov/marc/specifications/specrecstruc.html
        // data element identifier: A one-character code used to identify individual data elements within a variable field.
        // The data element may be any ASCII lowercase alphabetic, numeric, or graphic symbol except blank.
        //
        //      http://oeis.org/wiki/ASCII#ASCII_graphic.2Fnongraphic_characters
        //      "Among the ninety-five ASCII printable characters, there are the ninety-four [visible] ASCII graphic characters
        //      (of which the space is not) and the [invisible] ASCII nongraphic character, namely the space character."


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

        it.skip('Should consider the field invalid (subfield with empty code)', () => {
          const field = {'tag': 'CAT', 'ind1': ' ', 'ind2': ' ', 'subfields': [{'code': ' ', 'value': 'foo'}, {'code': 'c', 'value': '20150121'}]};

          try {
            Utils.validateField(field);
          } catch (err) {
            expect(err.message).to.match(/^Field is invalid: /u);
            expect(err).to.have.property('validationResults');
            return;
          }

          throw new Error('Should throw');
        });

        it.skip('Should consider the field invalid (subfield with two-character code)', () => {
          const field = {'tag': 'CAT', 'ind1': ' ', 'ind2': ' ', 'subfields': [{'code': 'aa', 'value': 'foo'}, {'code': 'c', 'value': '20150121'}]};

          try {
            Utils.validateField(field);
          } catch (err) {
            expect(err.message).to.match(/^Field is invalid: /u);
            expect(err).to.have.property('validationResults');
            return;
          }

          throw new Error('Should throw');
        });

        it.skip('Should consider the field invalid (subfield with uppercase code)', () => {
          const field = {'tag': 'CAT', 'ind1': ' ', 'ind2': ' ', 'subfields': [{'code': 'A', 'value': 'foo'}, {'code': 'c', 'value': '20150121'}]};

          try {
            Utils.validateField(field);
          } catch (err) {
            expect(err.message).to.match(/^Field is invalid: /u);
            expect(err).to.have.property('validationResults');
            return;
          }

          throw new Error('Should throw');
        });

        it.skip('Should consider the field invalid (subfield with non-ASCII code)', () => {
          const field = {'tag': 'CAT', 'ind1': ' ', 'ind2': ' ', 'subfields': [{'code': 'Ä', 'value': 'foo'}, {'code': 'c', 'value': '20150121'}]};

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

      describe('subfieldValues', () => {

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

      // https://www.loc.gov/marc/specifications/specrecstruc.html:
      // ... An indicator may be any ASCII lowercase alphabetic, numeric, or blank .

      it.skip('Should consider the field invalid (uppercase indicator)', () => {
        const field = {'tag': 'CAT', 'ind1': 'A', 'ind2': ' ', 'subfields': [{'code': 'c', 'value': '20150121'}]};

        try {
          Utils.validateField(field);
        } catch (err) {
          expect(err.message).to.match(/^Field is invalid: /u);
          expect(err).to.have.property('validationResults');
          return;
        }

        throw new Error('Should throw');
      });

      it.skip('Should consider the field invalid (non alpha-numercic/blank indicator)', () => {
        const field = {'tag': 'CAT', 'ind1': '#', 'ind2': ' ', 'subfields': [{'code': 'c', 'value': '20150121'}]};

        try {
          Utils.validateField(field);
        } catch (err) {
          expect(err.message).to.match(/^Field is invalid: /u);
          expect(err).to.have.property('validationResults');
          return;
        }

        throw new Error('Should throw');
      });

      it.skip('Should consider the field invalid (non-ASCII indicator)', () => {
        const field = {'tag': 'CAT', 'ind1': 'Ä', 'ind2': ' ', 'subfields': [{'code': 'c', 'value': '20150121'}]};

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
