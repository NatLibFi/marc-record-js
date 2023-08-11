/* eslint-disable max-lines */
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

    it('Should consider the record invalid (control character in subfield value, noControlCharacters: true)', () => {
      const record = {'leader': '12345cam a22002417i 4500',
        'fields': [
          {'tag': '001', 'value': '000123456'},
          {'tag': '100', 'ind1': '1', 'ind2': ' ', 'subfields': [{'code': 'a', 'value': '\tSukunimi, Etunimi'}]},
          {'tag': '245', 'ind1': '1', 'ind2': ' ', 'subfields': [{'code': 'a', 'value': 'Nimeke.'}]}
        ]};

      try {
        Utils.validateRecord(record, {noControlCharacters: true});
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
        Utils.validateField(field, {controlFieldValues: true});
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

    it('Should consider the field invalid (tag, indicators and both value and subfields)', () => {
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

    it('Should consider the field invalid (tag, value and subfields)', () => {
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

      it('Should consider the field invalid (numeric controlfield tag not beginning with 00), characters: true', () => {
        const field = {'tag': '500', 'value': '123456'};

        try {
          Utils.validateField(field, {characters: true});
        } catch (err) {
          expect(err.message).to.match(/^Field is invalid:/u);
          expect(err).to.have.property('validationResults');
          return;
        }

        throw new Error('Should throw');
      });

      it('Should consider the field valid (numeric controlfield tag not beginning with 00), characters: false', () => {
        const field = {'tag': '500', 'value': '123456'};

        // eslint-disable-next-line no-unused-expressions
        expect(Utils.validateField(field, {characters: false})).not.to.throw;
      });


      it('Should consider the field invalid (controlfield with non-ASCII content), characters: true', () => {
        const field = {'tag': '003', 'value': 'ÅÖÖ'};

        try {
          Utils.validateField(field, {characters: true});
        } catch (err) {
          expect(err.message).to.match(/^Field is invalid:/u);
          expect(err).to.have.property('validationResults');
          return;
        }

        throw new Error('Should throw');
      });

      it('Should consider the field valid (controlfield with non-ASCII content), characters: false', () => {
        const field = {'tag': '003', 'value': 'ÅÖÖ'};
        // eslint-disable-next-line no-unused-expressions
        expect(Utils.validateField(field, {characters: false})).not.to.throw;
      });


      // https://www.loc.gov/marc/specifications/specrecstruc.html
      // data field. A variable field containing bibliographic or other data. Data fields are assigned tags beginning with characters other than two zeroes.
      // Data fields contain data in any MARC 21 character set unless a field-specific restriction applies.

      it('Should consider the field invalid (datafield tag beginning with 00), characters: true', () => {
        const field = {'tag': '004', 'ind1': ' ', 'ind2': ' ', 'subfields': [{'code': 'c', 'value': '20150121'}]};

        try {
          Utils.validateField(field, {characters: true});
        } catch (err) {
          expect(err.message).to.match(/^Field is invalid:/u);
          expect(err).to.have.property('validationResults');
          return;
        }

        throw new Error('Should throw');
      });

      it('Should consider the field valid (datafield tag beginning with 00), characters: false', () => {
        const field = {'tag': '004', 'ind1': ' ', 'ind2': ' ', 'subfields': [{'code': 'c', 'value': '20150121'}]};
        // eslint-disable-next-line no-unused-expressions
        expect(Utils.validateField(field, {characters: false})).not.to.throw;
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

      it('Should consider the field invalid (tag with non-alphanumeric character), characters: true', () => {
        const field = {'tag': '#44', 'ind1': ' ', 'ind2': ' ', 'subfields': [{'code': 'c', 'value': '20150121'}]};

        try {
          Utils.validateField(field, {characters: true});
        } catch (err) {
          expect(err.message).to.match(/^Field is invalid: /u);
          expect(err).to.have.property('validationResults');
          return;
        }

        throw new Error('Should throw');
      });

      it('Should consider the field valid (tag with non-alphanumeric character), characters: false', () => {
        const field = {'tag': '#44', 'ind1': ' ', 'ind2': ' ', 'subfields': [{'code': 'c', 'value': '20150121'}]};
        // eslint-disable-next-line no-unused-expressions
        expect(Utils.validateField(field, {characters: false})).not.to.throw;
      });

      it('Should consider the field invalid (tag with mixed case characters), characters: true', () => {
        const field = {'tag': 'AaA', 'ind1': ' ', 'ind2': ' ', 'subfields': [{'code': 'c', 'value': '20150121'}]};

        try {
          Utils.validateField(field, {characters: true});
        } catch (err) {
          expect(err.message).to.match(/^Field is invalid: /u);
          expect(err).to.have.property('validationResults');
          return;
        }

        throw new Error('Should throw');
      });


      it('Should consider the field valid (tag with mixed case characters), characters: false', () => {
        const field = {'tag': 'AaA', 'ind1': ' ', 'ind2': ' ', 'subfields': [{'code': 'c', 'value': '20150121'}]};
        // eslint-disable-next-line no-unused-expressions
        expect(Utils.validateField(field, {characters: false})).not.to.throw;
      });


      it('Should consider the field invalid (tag with non-ASCII characters), characters: true', () => {
        const field = {'tag': 'ÄÄÄ', 'ind1': ' ', 'ind2': ' ', 'subfields': [{'code': 'c', 'value': '20150121'}]};

        try {
          Utils.validateField(field, {characters: true});
        } catch (err) {
          expect(err.message).to.match(/^Field is invalid: /u);
          expect(err).to.have.property('validationResults');
          return;
        }

        throw new Error('Should throw');
      });

      it('Should consider the field valid (tag with non-ASCII characters), characters: false', () => {
        const field = {'tag': 'ÄÄÄ', 'ind1': ' ', 'ind2': ' ', 'subfields': [{'code': 'c', 'value': '20150121'}]};
        // eslint-disable-next-line no-unused-expressions
        expect(Utils.validateField(field, {characters: false})).not.to.throw;
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

        it('Should consider the field invalid (subfield with empty code), characters: true', () => {
          const field = {'tag': 'CAT', 'ind1': ' ', 'ind2': ' ', 'subfields': [{'code': ' ', 'value': 'foo'}, {'code': 'c', 'value': '20150121'}]};

          try {
            Utils.validateField(field, {characters: true});
          } catch (err) {
            expect(err.message).to.match(/^Field is invalid: /u);
            expect(err).to.have.property('validationResults');
            return;
          }

          throw new Error('Should throw');
        });

        it('Should consider the field valid (subfield with empty code), characters: false', () => {
          const field = {'tag': 'CAT', 'ind1': ' ', 'ind2': ' ', 'subfields': [{'code': ' ', 'value': 'foo'}, {'code': 'c', 'value': '20150121'}]};
          // eslint-disable-next-line no-unused-expressions
          expect(Utils.validateField(field, {characters: false})).not.to.throw;
        });

        it('Should consider the field invalid (subfield with two-character code)', () => {
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

        it('Should consider the field invalid (subfield with uppercase code), characters: true', () => {
          const field = {'tag': 'CAT', 'ind1': ' ', 'ind2': ' ', 'subfields': [{'code': 'A', 'value': 'foo'}, {'code': 'c', 'value': '20150121'}]};

          try {
            Utils.validateField(field, {characters: true});
          } catch (err) {
            expect(err.message).to.match(/^Field is invalid: /u);
            expect(err).to.have.property('validationResults');
            return;
          }

          throw new Error('Should throw');
        });

        it('Should consider the field valid (subfield with uppercase code), characters: false', () => {
          const field = {'tag': 'CAT', 'ind1': ' ', 'ind2': ' ', 'subfields': [{'code': 'A', 'value': 'foo'}, {'code': 'c', 'value': '20150121'}]};
          // eslint-disable-next-line no-unused-expressions
          expect(Utils.validateField(field, {characters: false})).not.to.throw;
        });

        it('Should consider the field invalid (subfield with non-ASCII code), characters: true', () => {
          const field = {'tag': 'CAT', 'ind1': ' ', 'ind2': ' ', 'subfields': [{'code': 'Ä', 'value': 'foo'}, {'code': 'c', 'value': '20150121'}]};

          try {
            Utils.validateField(field, {characters: true});
          } catch (err) {
            expect(err.message).to.match(/^Field is invalid: /u);
            expect(err).to.have.property('validationResults');
            return;
          }

          throw new Error('Should throw');
        });

        it('Should consider the field valid (subfield with non-ASCII code), characters: false', () => {
          const field = {'tag': 'CAT', 'ind1': ' ', 'ind2': ' ', 'subfields': [{'code': 'Ä', 'value': 'foo'}, {'code': 'c', 'value': '20150121'}]};
          // eslint-disable-next-line no-unused-expressions
          expect(Utils.validateField(field, {characters: false})).not.to.throw;
        });

      });

      describe('subfieldValues', () => {

        it('Should consider the field invalid (subfield with empty value), subieldValues: true', () => {
          const field = {'tag': 'CAT', 'ind1': ' ', 'ind2': ' ', 'subfields': [{'code': 'b', 'value': ''}, {'code': 'c', 'value': '20150121'}]};

          try {
            Utils.validateField(field, {subfieldValues: true});
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

        it('Should consider the field invalid (subfield with no value), subfieldValues: true', () => {
          const field = {'tag': 'CAT', 'ind1': ' ', 'ind2': ' ', 'subfields': [{'code': 'b'}, {'code': 'c', 'value': '20150121'}]};

          try {
            Utils.validateField(field, {subfieldValues: true});
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

        it('Should consider the field invalid (subfield with value containing control characters), noControlCharacters: true', () => {
          const field = {'tag': 'CAT', 'ind1': ' ', 'ind2': ' ', 'subfields': [{'code': 'c', 'value': `2015\n0121\t124`}]};

          try {
            Utils.validateField(field, {noControlCharacters: true});
          } catch (err) {
            expect(err.message).to.match(/^Field is invalid: /u);
            expect(err).to.have.property('validationResults');
            return;
          }

          throw new Error('Should throw');
        });

        it('Should consider the field valid (subfield with value containing control characters), noControlCharacters: false', () => {
          const field = {'tag': 'CAT', 'ind1': ' ', 'ind2': ' ', 'subfields': [{'code': 'c', 'value': `2015\n0121\t124`}]};
          // eslint-disable-next-line no-unused-expressions
          expect(Utils.validateField(field, {subfieldValues: true})).not.to.throw;

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

      it('Should consider the field invalid (uppercase indicator), characters: true', () => {
        const field = {'tag': 'CAT', 'ind1': 'A', 'ind2': ' ', 'subfields': [{'code': 'c', 'value': '20150121'}]};

        try {
          Utils.validateField(field, {characters: true});
        } catch (err) {
          expect(err.message).to.match(/^Field is invalid: /u);
          expect(err).to.have.property('validationResults');
          return;
        }

        throw new Error('Should throw');
      });

      it('Should consider the field valid (uppercase indicator), characters: false', () => {
        const field = {'tag': 'CAT', 'ind1': 'A', 'ind2': ' ', 'subfields': [{'code': 'c', 'value': '20150121'}]};
        // eslint-disable-next-line no-unused-expressions
        expect(Utils.validateField(field, {characters: false})).not.to.throw;
      });


      it('Should consider the field invalid (non alpha-numeric/blank indicator), characters: true', () => {
        const field = {'tag': 'CAT', 'ind1': '#', 'ind2': ' ', 'subfields': [{'code': 'c', 'value': '20150121'}]};

        try {
          Utils.validateField(field, {characters: true});
        } catch (err) {
          expect(err.message).to.match(/^Field is invalid: /u);
          expect(err).to.have.property('validationResults');
          return;
        }

        throw new Error('Should throw');
      });

      it('Should consider the field invalid (non alpha-numeric/blank indicator), characters: false', () => {
        const field = {'tag': 'CAT', 'ind1': '#', 'ind2': ' ', 'subfields': [{'code': 'c', 'value': '20150121'}]};

        // eslint-disable-next-line no-unused-expressions
        expect(Utils.validateField(field, {characters: false})).not.to.throw;
      });

      it('Should consider the field invalid (non-ASCII indicator), characters: true', () => {
        const field = {'tag': 'CAT', 'ind1': 'Ä', 'ind2': ' ', 'subfields': [{'code': 'c', 'value': '20150121'}]};

        try {
          Utils.validateField(field, {characters: true});
        } catch (err) {
          expect(err.message).to.match(/^Field is invalid: /u);
          expect(err).to.have.property('validationResults');
          return;
        }

        throw new Error('Should throw');
      });

      it('Should consider the field invalid (non-ASCII indicator), characters: false', () => {
        const field = {'tag': 'CAT', 'ind1': 'Ä', 'ind2': ' ', 'subfields': [{'code': 'c', 'value': '20150121'}]};
        // eslint-disable-next-line no-unused-expressions
        expect(Utils.validateField(field, {characters: false})).not.to.throw;
      });

    });


    describe('additionalProperties', () => {
      it('Should consider the field with additional properties invalid, noAdditionalFieldProperties: true', () => {
        const field = {'tag': 'CAT', 'ind1': ' ', 'ind2': ' ', 'subfields': [{'code': 'c', 'value': `20150121124`}], 'foo': 'bar'};

        try {
          Utils.validateField(field, {noAdditionalFieldProperties: true});
        } catch (err) {
          expect(err.message).to.match(/^Field is invalid: /u);
          expect(err).to.have.property('validationResults');
          return;
        }

        throw new Error('Should throw');
      });

      it('Should consider the field with additional properties valid, noAdditionalFieldProperties: false', () => {
        const field = {'tag': 'CAT', 'ind1': ' ', 'ind2': ' ', 'subfields': [{'code': 'c', 'value': `20150121124`}], 'foo': 'bar'};

        // eslint-disable-next-line no-unused-expressions
        expect(Utils.validateField(field, {noAdditionalFieldProperties: false})).not.to.throw;

      });

    });


    describe('fieldLength', () => {

      it('Should consider datafield with too long subfield value (>9999 chars) invalid', () => {
        const field = {'tag': 'CAT', 'ind1': ' ', 'ind2': ' ', 'subfields': [{'code': 'c', 'value': 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Ut aliquam consequat sem finibus volutpat. Pellentesque eu auctor elit, sit amet hendrerit tortor. Cras finibus risus sed arcu ullamcorper, quis semper nibh facilisis. Quisque auctor molestie aliquam. Fusce ornare, metus sed rhoncus sodales, risus lectus auctor velit, ut suscipit tortor augue eget risus. Aliquam in tempus augue. Nam metus erat, vulputate eu nunc vel, tempor dignissim orci. In aliquet vel tellus eu interdum. Mauris vitae ultrices urna. Curabitur tempus lorem ac convallis vehicula. Aliquam bibendum efficitur tellus. Curabitur eu odio tristique, mollis dui ac, vehicula nulla. Proin quis nisi justo. Nunc pellentesque, lorem in auctor malesuada, mauris ex rhoncus est, in lobortis felis risus eu eros. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Curabitur tincidunt rhoncus velit, vitae egestas magna dapibus ut. Vestibulum feugiat odio eu nulla sagittis, sit amet hendrerit enim molestie. Vestibulum ante ipsum primis in faucibus orci luctus et ultrices posuere cubilia curae; Suspendisse non rutrum nibh. Vivamus ullamcorper vel turpis dapibus tempus. Phasellus porta ac quam at gravida. Maecenas luctus arcu tortor, ac interdum purus congue a. Mauris lobortis aliquam risus euismod volutpat. Fusce eu nibh dignissim, elementum est vitae, convallis felis. Quisque ut faucibus sem. Proin mattis tortor sit amet auctor pharetra. Etiam et mollis dolor, in posuere tellus. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Pellentesque laoreet hendrerit tortor sit amet porta. Donec lobortis ex sit amet posuere porta. Integer eu est ipsum. Nam laoreet tristique mi, vulputate fermentum purus pellentesque in. Mauris auctor aliquam nunc, ut iaculis tortor maximus vehicula. Nunc id cursus eros. Nam a aliquet ligula. Aliquam tempus tincidunt risus, et semper mi aliquet quis. Interdum et malesuada fames ac ante ipsum primis in faucibus. Morbi rhoncus, arcu nec vulputate placerat, magna nibh ullamcorper ipsum, nec cursus nisl tellus vitae felis. Pellentesque justo dolor, ultricies sed leo nec, condimentum pretium odio. Ut sem diam, feugiat a faucibus quis, molestie eget quam. In tempus et tortor a accumsan. Integer condimentum sapien in elementum pharetra. Proin interdum velit orci, quis facilisis mauris tincidunt eget. Morbi eu ante at nulla vulputate elementum. Phasellus sollicitudin sollicitudin laoreet. Mauris ultrices eros vitae mi vehicula pharetra. Mauris consectetur turpis ultrices blandit feugiat. Etiam id viverra metus. In convallis semper ipsum ut ullamcorper. Mauris vel dictum odio. Mauris commodo odio id dui scelerisque commodo. Sed ipsum turpis, ultricies ut nisl eget, tempus lacinia felis. Maecenas pharetra facilisis quam ac sodales. Ut sed erat pellentesque, ornare elit in, vehicula elit. Sed varius lectus justo. Suspendisse sit amet mi ligula. Vestibulum sollicitudin massa eget placerat accumsan. Donec a orci ut quam lobortis viverra. Curabitur ut egestas mi. Class aptent taciti sociosqu ad litora torquent per conubia nostra, per inceptos himenaeos. Nunc tellus tortor, tristique eu iaculis sed, pretium at leo. Vivamus porta imperdiet ex, ac tempus diam lacinia ut. Suspendisse accumsan quam mi, et eleifend metus tristique pretium. Quisque vulputate nisi quis augue pulvinar ultricies. Mauris vestibulum dictum condimentum. Nullam sit amet vulputate turpis. Vivamus a nibh fermentum, porta lacus non, sollicitudin orci. Quisque sed nulla in nulla porta ornare. Sed scelerisque mauris ac libero mattis commodo. Pellentesque nulla enim, dignissim in sodales sit amet, lacinia in eros. Integer pulvinar sapien ac sapien varius, in gravida velit sodales. Donec facilisis placerat mattis. Sed arcu dui, porta eu pretium imperdiet, porttitor eget ante. Integer varius tortor efficitur, eleifend est quis, congue dolor. Integer pulvinar urna massa, ut mollis risus condimentum quis. Suspendisse lobortis ipsum eleifend lectus pellentesque, ac ullamcorper turpis efficitur. In quis venenatis risus. Quisque interdum suscipit eros, et faucibus nulla. Fusce quis blandit nibh. Morbi aliquam convallis leo, eu maximus odio elementum quis. Aenean at neque neque. Praesent gravida nisi ex, a vulputate libero ultricies eu. Nam mi purus, semper sed elementum eget, sodales at ex. Maecenas tincidunt ligula vitae accumsan pretium. Aenean sed porta justo. Fusce mollis nec metus a sagittis. Etiam ultricies augue id lorem maximus, rhoncus mollis risus sollicitudin. Donec vel ligula nec turpis volutpat tristique sed a diam. Proin dapibus, nisl vitae elementum ultricies, ligula lectus egestas massa, ut viverra metus velit at ligula. Nunc posuere nec neque in mollis. Nulla sed blandit sapien. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Donec non felis ut ante iaculis vestibulum. Integer suscipit arcu lectus, imperdiet imperdiet enim vehicula a. Suspendisse sit amet nibh egestas, rutrum turpis non, interdum massa. Nulla vitae ullamcorper arcu, sed dictum magna. Pellentesque vitae velit nibh. Aenean eget elit a turpis dignissim dignissim. Vestibulum et tincidunt dui, nec tincidunt dui. Morbi tristique eget felis quis dictum. Proin molestie scelerisque volutpat. Maecenas et quam id orci commodo sodales in nec urna. Vivamus eu convallis enim. Ut at convallis ex, ac accumsan arcu. Ut consequat pharetra nisl eu malesuada. Donec lobortis mauris in metus consectetur interdum. Morbi quis elementum odio. Praesent commodo elit luctus convallis consequat. Aliquam venenatis aliquam ex, ut pellentesque nisl pharetra vitae. Etiam ac interdum velit, vitae finibus nunc. Nunc enim ligula, malesuada at turpis a, congue suscipit metus. Quisque auctor nec ipsum ut malesuada. Sed in ligula vel leo cursus venenatis in eu diam. Nullam vehicula, mauris eget laoreet mattis, justo urna interdum mauris, a scelerisque enim dolor non ante. Cras rutrum mattis neque non fringilla. Phasellus nec diam lobortis, fringilla sem vitae, pharetra metus. In hac habitasse platea dictumst. Integer elementum elit felis, sit amet mattis urna tristique in. Vestibulum ante ipsum primis in faucibus orci luctus et ultrices posuere cubilia curae; Duis ullamcorper vulputate mauris, vitae vestibulum nisi ornare non. Quisque non ornare erat. Donec viverra, purus vel vulputate facilisis, risus velit semper tellus, sed mattis elit nibh et felis. Quisque egestas risus turpis, in imperdiet dolor malesuada ac. Interdum et malesuada fames ac ante ipsum primis in faucibus. Suspendisse potenti. Sed ullamcorper eget est vitae lacinia. Proin lacinia lacus est, ac aliquam nisi posuere non. Aliquam risus ex, dictum ut ante quis, rutrum molestie libero. In hac habitasse platea dictumst. In hac habitasse platea dictumst. Cras condimentum mauris quis quam bibendum, id accumsan lorem vehicula. Sed vehicula mauris leo, ac varius lorem hendrerit at. Mauris orci elit, volutpat quis commodo at, ultrices sed est. Ut feugiat urna tortor, vel aliquam turpis luctus a. Aliquam posuere non nisl sed efficitur. Vestibulum tempus magna id massa sollicitudin, ac cursus ligula varius. Aliquam iaculis orci nec malesuada ornare. Praesent placerat nisl sed nulla pulvinar tincidunt in nec felis. Aenean sollicitudin viverra pellentesque. Pellentesque semper purus vel mi dictum, pretium ullamcorper purus congue. Fusce nec euismod augue. Duis at libero sollicitudin, cursus erat sit amet, facilisis ipsum. Aliquam varius rutrum felis et elementum. Fusce ipsum justo, feugiat sed elit eu, pretium luctus tortor. Sed ex ante, fringilla id tincidunt non, malesuada a neque. In mattis urna ut nunc gravida, ut efficitur magna laoreet. Sed tellus risus, posuere vitae sollicitudin quis, pretium quis leo. Proin eleifend commodo nulla, a consectetur est iaculis in. Nulla scelerisque pharetra mauris, vel dapibus mi convallis sit amet. Mauris tincidunt ipsum in lorem mattis accumsan sed sed purus. Maecenas tristique sit amet nunc in placerat. Vestibulum nisl diam, interdum non lacus et, ullamcorper imperdiet orci. Donec mattis nunc sit amet elit porttitor, eget convallis magna lobortis. Vestibulum nec libero at libero molestie eleifend vitae eu metus.  In hac habitasse platea dictumst. Nulla ex nulla, sagittis eget porttitor ut, tincidunt quis ante. Nam quis tortor elit. Vestibulum in urna odio. Sed cursus nisi sit amet turpis rhoncus, ac consectetur magna condimentum. Nullam aliquam, nisl vitae consectetur varius, felis augue convallis felis, vel porta ipsum nibh eu lacus. Maecenas in porta nibh, congue ultrices turpis. Suspendisse elit sapien, finibus sed feugiat in, malesuada at magna. Morbi nec mi vel nisl imperdiet dictum. Sed ut ante pharetra eros finibus luctus vitae sed sapien. Quisque non lacus eu lacus vehicula lacinia et sit amet ex. Pellentesque eget turpis et tortor lobortis accumsan. Donec congue est at metus posuere varius tristique a leo. Duis ullamcorper tincidunt nisi, vitae ultrices tellus. Maecenas sodales eros sed ligula interdum, eget lacinia erat semper. Duis rhoncus mauris eu turpis dapibus, ac varius tellus iaculis. Curabitur ornare, ex quis lacinia sodales, dolor diam vulputate nisl, nec aliquam magna magna eget augue. Aliquam condimentum ante ante, eget luctus orci molestie vel. Morbi varius, tellus nec faucibus pretium, lorem ante fermentum metus, in accumsan eros ex non erat. Maecenas eget suscipit magna, nec bibendum neque. Cras sapien neque, blandit ut erat at, sagittis aliquet lorem. Curabitur varius est neque. Duis bibendum id lectus vel luctus. Curabitur sodales nisi felis, in mattis tellus consectetur volutpat.Aenean at varius ante. Suspendisse vitae ante leo. Vivamus molestie, nisi vel efficitur scelerisque, nisi erat mollis erat, nec dapibus purus neque et nisi. In dictum neque dui. Nullam nec tincidunt libero. Quisque a dui lobortis, fringilla magna quis, tempus mi. Mauris laoreet viverra dolor, vitae bibendum augue luctus ut. Nam vitae metus consequat eros tempus fringilla. Praesent iaculis tristique ultrices. Proin justo tortor, sagittis amet.'}]};

        try {
          Utils.validateField(field);
        } catch (err) {
          expect(err.message).to.match(/^Field is invalid: /u);
          expect(err).to.have.property('validationResults');
          return;
        }

        throw new Error('Should throw');
      });

      it('Should consider controlField with too long value (>9999 chars) invalid', () => {
        const field = {'tag': '009', 'value': 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Ut aliquam consequat sem finibus volutpat. Pellentesque eu auctor elit, sit amet hendrerit tortor. Cras finibus risus sed arcu ullamcorper, quis semper nibh facilisis. Quisque auctor molestie aliquam. Fusce ornare, metus sed rhoncus sodales, risus lectus auctor velit, ut suscipit tortor augue eget risus. Aliquam in tempus augue. Nam metus erat, vulputate eu nunc vel, tempor dignissim orci. In aliquet vel tellus eu interdum. Mauris vitae ultrices urna. Curabitur tempus lorem ac convallis vehicula. Aliquam bibendum efficitur tellus. Curabitur eu odio tristique, mollis dui ac, vehicula nulla. Proin quis nisi justo. Nunc pellentesque, lorem in auctor malesuada, mauris ex rhoncus est, in lobortis felis risus eu eros. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Curabitur tincidunt rhoncus velit, vitae egestas magna dapibus ut. Vestibulum feugiat odio eu nulla sagittis, sit amet hendrerit enim molestie. Vestibulum ante ipsum primis in faucibus orci luctus et ultrices posuere cubilia curae; Suspendisse non rutrum nibh. Vivamus ullamcorper vel turpis dapibus tempus. Phasellus porta ac quam at gravida. Maecenas luctus arcu tortor, ac interdum purus congue a. Mauris lobortis aliquam risus euismod volutpat. Fusce eu nibh dignissim, elementum est vitae, convallis felis. Quisque ut faucibus sem. Proin mattis tortor sit amet auctor pharetra. Etiam et mollis dolor, in posuere tellus. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Pellentesque laoreet hendrerit tortor sit amet porta. Donec lobortis ex sit amet posuere porta. Integer eu est ipsum. Nam laoreet tristique mi, vulputate fermentum purus pellentesque in. Mauris auctor aliquam nunc, ut iaculis tortor maximus vehicula. Nunc id cursus eros. Nam a aliquet ligula. Aliquam tempus tincidunt risus, et semper mi aliquet quis. Interdum et malesuada fames ac ante ipsum primis in faucibus. Morbi rhoncus, arcu nec vulputate placerat, magna nibh ullamcorper ipsum, nec cursus nisl tellus vitae felis. Pellentesque justo dolor, ultricies sed leo nec, condimentum pretium odio. Ut sem diam, feugiat a faucibus quis, molestie eget quam. In tempus et tortor a accumsan. Integer condimentum sapien in elementum pharetra. Proin interdum velit orci, quis facilisis mauris tincidunt eget. Morbi eu ante at nulla vulputate elementum. Phasellus sollicitudin sollicitudin laoreet. Mauris ultrices eros vitae mi vehicula pharetra. Mauris consectetur turpis ultrices blandit feugiat. Etiam id viverra metus. In convallis semper ipsum ut ullamcorper. Mauris vel dictum odio. Mauris commodo odio id dui scelerisque commodo. Sed ipsum turpis, ultricies ut nisl eget, tempus lacinia felis. Maecenas pharetra facilisis quam ac sodales. Ut sed erat pellentesque, ornare elit in, vehicula elit. Sed varius lectus justo. Suspendisse sit amet mi ligula. Vestibulum sollicitudin massa eget placerat accumsan. Donec a orci ut quam lobortis viverra. Curabitur ut egestas mi. Class aptent taciti sociosqu ad litora torquent per conubia nostra, per inceptos himenaeos. Nunc tellus tortor, tristique eu iaculis sed, pretium at leo. Vivamus porta imperdiet ex, ac tempus diam lacinia ut. Suspendisse accumsan quam mi, et eleifend metus tristique pretium. Quisque vulputate nisi quis augue pulvinar ultricies. Mauris vestibulum dictum condimentum. Nullam sit amet vulputate turpis. Vivamus a nibh fermentum, porta lacus non, sollicitudin orci. Quisque sed nulla in nulla porta ornare. Sed scelerisque mauris ac libero mattis commodo. Pellentesque nulla enim, dignissim in sodales sit amet, lacinia in eros. Integer pulvinar sapien ac sapien varius, in gravida velit sodales. Donec facilisis placerat mattis. Sed arcu dui, porta eu pretium imperdiet, porttitor eget ante. Integer varius tortor efficitur, eleifend est quis, congue dolor. Integer pulvinar urna massa, ut mollis risus condimentum quis. Suspendisse lobortis ipsum eleifend lectus pellentesque, ac ullamcorper turpis efficitur. In quis venenatis risus. Quisque interdum suscipit eros, et faucibus nulla. Fusce quis blandit nibh. Morbi aliquam convallis leo, eu maximus odio elementum quis. Aenean at neque neque. Praesent gravida nisi ex, a vulputate libero ultricies eu. Nam mi purus, semper sed elementum eget, sodales at ex. Maecenas tincidunt ligula vitae accumsan pretium. Aenean sed porta justo. Fusce mollis nec metus a sagittis. Etiam ultricies augue id lorem maximus, rhoncus mollis risus sollicitudin. Donec vel ligula nec turpis volutpat tristique sed a diam. Proin dapibus, nisl vitae elementum ultricies, ligula lectus egestas massa, ut viverra metus velit at ligula. Nunc posuere nec neque in mollis. Nulla sed blandit sapien. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Donec non felis ut ante iaculis vestibulum. Integer suscipit arcu lectus, imperdiet imperdiet enim vehicula a. Suspendisse sit amet nibh egestas, rutrum turpis non, interdum massa. Nulla vitae ullamcorper arcu, sed dictum magna. Pellentesque vitae velit nibh. Aenean eget elit a turpis dignissim dignissim. Vestibulum et tincidunt dui, nec tincidunt dui. Morbi tristique eget felis quis dictum. Proin molestie scelerisque volutpat. Maecenas et quam id orci commodo sodales in nec urna. Vivamus eu convallis enim. Ut at convallis ex, ac accumsan arcu. Ut consequat pharetra nisl eu malesuada. Donec lobortis mauris in metus consectetur interdum. Morbi quis elementum odio. Praesent commodo elit luctus convallis consequat. Aliquam venenatis aliquam ex, ut pellentesque nisl pharetra vitae. Etiam ac interdum velit, vitae finibus nunc. Nunc enim ligula, malesuada at turpis a, congue suscipit metus. Quisque auctor nec ipsum ut malesuada. Sed in ligula vel leo cursus venenatis in eu diam. Nullam vehicula, mauris eget laoreet mattis, justo urna interdum mauris, a scelerisque enim dolor non ante. Cras rutrum mattis neque non fringilla. Phasellus nec diam lobortis, fringilla sem vitae, pharetra metus. In hac habitasse platea dictumst. Integer elementum elit felis, sit amet mattis urna tristique in. Vestibulum ante ipsum primis in faucibus orci luctus et ultrices posuere cubilia curae; Duis ullamcorper vulputate mauris, vitae vestibulum nisi ornare non. Quisque non ornare erat. Donec viverra, purus vel vulputate facilisis, risus velit semper tellus, sed mattis elit nibh et felis. Quisque egestas risus turpis, in imperdiet dolor malesuada ac. Interdum et malesuada fames ac ante ipsum primis in faucibus. Suspendisse potenti. Sed ullamcorper eget est vitae lacinia. Proin lacinia lacus est, ac aliquam nisi posuere non. Aliquam risus ex, dictum ut ante quis, rutrum molestie libero. In hac habitasse platea dictumst. In hac habitasse platea dictumst. Cras condimentum mauris quis quam bibendum, id accumsan lorem vehicula. Sed vehicula mauris leo, ac varius lorem hendrerit at. Mauris orci elit, volutpat quis commodo at, ultrices sed est. Ut feugiat urna tortor, vel aliquam turpis luctus a. Aliquam posuere non nisl sed efficitur. Vestibulum tempus magna id massa sollicitudin, ac cursus ligula varius. Aliquam iaculis orci nec malesuada ornare. Praesent placerat nisl sed nulla pulvinar tincidunt in nec felis. Aenean sollicitudin viverra pellentesque. Pellentesque semper purus vel mi dictum, pretium ullamcorper purus congue. Fusce nec euismod augue. Duis at libero sollicitudin, cursus erat sit amet, facilisis ipsum. Aliquam varius rutrum felis et elementum. Fusce ipsum justo, feugiat sed elit eu, pretium luctus tortor. Sed ex ante, fringilla id tincidunt non, malesuada a neque. In mattis urna ut nunc gravida, ut efficitur magna laoreet. Sed tellus risus, posuere vitae sollicitudin quis, pretium quis leo. Proin eleifend commodo nulla, a consectetur est iaculis in. Nulla scelerisque pharetra mauris, vel dapibus mi convallis sit amet. Mauris tincidunt ipsum in lorem mattis accumsan sed sed purus. Maecenas tristique sit amet nunc in placerat. Vestibulum nisl diam, interdum non lacus et, ullamcorper imperdiet orci. Donec mattis nunc sit amet elit porttitor, eget convallis magna lobortis. Vestibulum nec libero at libero molestie eleifend vitae eu metus.  In hac habitasse platea dictumst. Nulla ex nulla, sagittis eget porttitor ut, tincidunt quis ante. Nam quis tortor elit. Vestibulum in urna odio. Sed cursus nisi sit amet turpis rhoncus, ac consectetur magna condimentum. Nullam aliquam, nisl vitae consectetur varius, felis augue convallis felis, vel porta ipsum nibh eu lacus. Maecenas in porta nibh, congue ultrices turpis. Suspendisse elit sapien, finibus sed feugiat in, malesuada at magna. Morbi nec mi vel nisl imperdiet dictum. Sed ut ante pharetra eros finibus luctus vitae sed sapien. Quisque non lacus eu lacus vehicula lacinia et sit amet ex. Pellentesque eget turpis et tortor lobortis accumsan. Donec congue est at metus posuere varius tristique a leo. Duis ullamcorper tincidunt nisi, vitae ultrices tellus. Maecenas sodales eros sed ligula interdum, eget lacinia erat semper. Duis rhoncus mauris eu turpis dapibus, ac varius tellus iaculis. Curabitur ornare, ex quis lacinia sodales, dolor diam vulputate nisl, nec aliquam magna magna eget augue. Aliquam condimentum ante ante, eget luctus orci molestie vel. Morbi varius, tellus nec faucibus pretium, lorem ante fermentum metus, in accumsan eros ex non erat. Maecenas eget suscipit magna, nec bibendum neque. Cras sapien neque, blandit ut erat at, sagittis aliquet lorem. Curabitur varius est neque. Duis bibendum id lectus vel luctus. Curabitur sodales nisi felis, in mattis tellus consectetur volutpat.Aenean at varius ante. Suspendisse vitae ante leo. Vivamus molestie, nisi vel efficitur scelerisque, nisi erat mollis erat, nec dapibus purus neque et nisi. In dictum neque dui. Nullam nec tincidunt libero. Quisque a dui lobortis, fringilla magna quis, tempus mi. Mauris laoreet viverra dolor, vitae bibendum augue luctus ut. Nam vitae metus consequat eros tempus fringilla. Praesent iaculis tristique ultrices. Proin justo tortor, sagittis amet.'};

        try {
          Utils.validateField(field);
        } catch (err) {
          expect(err.message).to.match(/^Field is invalid: /u);
          expect(err).to.have.property('validationResults');
          // eslint-disable-next-line no-console
          //console.log(err.validationResults);
          return;
        }

        throw new Error('Should throw');
      });
    });
  });
});
