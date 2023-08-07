// https://www.loc.gov/marc/specifications/specrecstruc.html
// tag. A three character string used to identify or label an associated variable field.
// The tag may consist of ASCII numeric characters (decimal integers 0-9) and/or ASCII alphabetic characters (uppercase or lowercase, but not both).

//  https://www.loc.gov/marc/specifications/specrecstruc.html
// control field. A variable field containing information useful or required for the processing of the record.
// Control fields are assigned tags beginning with two zeroes. Control fields with fixed length data elements are restricted to ASCII graphics.
// NOTE: Aleph uses also some other controlfields with non-numeric tags (FMT, LDR if its handled as a controlfield)

// ASCII - all printable/graphic: 32-126 (\x20 - \x7E)

const controlFieldTagPattern = /^(?:[0A-Z][0A-Z][0-9A-Z])|(?:[0a-z][0a-z][0-9a-z])$/u;
const controlFieldValuePattern = /^[\x20-\x7E]*$/u;

// https://www.loc.gov/marc/specifications/specrecstruc.html
// data field. A variable field containing bibliographic or other data. Data fields are assigned tags beginning with characters other than two zeroes.
// Data fields contain data in any MARC 21 character set unless a field-specific restriction applies.

const dataFieldTagPattern = /^(?:(?:(?:[1-9A-Z][0-9A-Z])|(?:[0-9A-Z][1-9A-Z]))[0-9A-Z])|(?:(?:(?:[1-9a-z][0-9a-z])|(?:[0-9a-z][1-9a-z]))[0-9a-z])$/u;

// https://www.loc.gov/marc/specifications/specrecstruc.html
// data element identifier: A one-character code used to identify individual data elements within a variable field.
// The data element may be any ASCII lowercase alphabetic, numeric, or graphic symbol except blank.
//
//      http://oeis.org/wiki/ASCII#ASCII_graphic.2Fnongraphic_characters
//      "Among the ninety-five ASCII printable characters, there are the ninety-four [visible] ASCII graphic characters
//      (of which the space is not) and the [invisible] ASCII nongraphic character, namely the space character."

// ASCII - all printable/graphic: 32-126 (\x20 - \x7E)
// ASCII - blank/space: 32 (\x20)
// ASCII - uppercase alphabetic: 65-90 (\x41 - \x5A)

// eslint-disable-next-line no-control-regex
const subfieldCodePattern = /^[\x21-\x40\x5B-\x7E]$/u;

// https://www.loc.gov/marc/specifications/specrecstruc.html:
// ... An indicator may be any ASCII lowercase alphabetic, numeric, or blank .

const indicatorPattern = /^[0-9a-z ]$/u;

// Option to not allow ASCII control characters in subfield values

// eslint-disable-next-line no-control-regex
const dataFieldValuePatternNoControlCharacters = /^[^\x00-\x1F\x7F]*$/u;
// Match anything - no restrictions
const dataFieldValuePattern = /.*/u;

// https://www.loc.gov/marc/specifications/specrecstruc.html
// ... MARC 21 sets the length of the length of field portion of the entry at four characters, thus a field may contain a maximum of 9999 octets.
// Note: We're limiting controlField value length and sibfieldValue length with this parameter, records can be too long before single field hitting
// this restriction
const maximumFieldLength = 9999;

export default function ({fields = true, subfields = true, subfieldValues = true, noControlCharacters = false, noAdditionalFieldProperties = false}) {
  // eslint-disable-next-line no-console
  //console.log(noControlCharacters);
  return {
    type: 'object',
    properties: {
      leader: {
        type: 'string',
        minLength: 24,
        maxLength: 24,
        maxOccurence: 1
      },
      fields: {
        type: 'array',
        minItems: fields ? 1 : 0,
        items: {
          anyOf: [
            {
              type: 'object',
              properties: {
                tag: {
                  type: 'string',
                  minLength: 3,
                  maxLength: 3,
                  pattern: controlFieldTagPattern
                },
                value: {
                  type: 'string',
                  minLength: 1,
                  maxLength: maximumFieldLength,
                  pattern: controlFieldValuePattern
                },
                ind1: false,
                ind2: false,
                subfields: false
              },
              required: [
                'tag',
                'value'
              ],
              additionalProperties: !noAdditionalFieldProperties
            },
            {
              type: 'object',
              properties: {
                tag: {
                  type: 'string',
                  minLength: 3,
                  maxLength: 3,
                  pattern: dataFieldTagPattern
                },
                ind1: {
                  type: 'string',
                  minLength: 1,
                  maxLength: 1,
                  pattern: indicatorPattern
                },
                ind2: {
                  type: 'string',
                  minLength: 1,
                  maxLength: 1,
                  pattern: indicatorPattern
                },
                subfields: {
                  type: 'array',
                  minItems: subfields ? 1 : 0,
                  items: {
                    type: 'object',
                    properties: {
                      code: {
                        type: 'string',
                        minLength: 1,
                        maxLength: 1,
                        pattern: subfieldCodePattern
                      },
                      value: {
                        type: 'string',
                        maxLength: maximumFieldLength,
                        minLength: subfieldValues ? 1 : 0,
                        pattern: noControlCharacters ? dataFieldValuePatternNoControlCharacters : dataFieldValuePattern
                      }
                    },
                    required: subfieldValues ? ['code', 'value'] : ['code']
                  }
                },
                value: false
              },
              required: [
                'tag',
                'ind1',
                'ind2',
                'subfields'
              ],
              additionalProperties: !noAdditionalFieldProperties
            }
          ]
        }
      }
    },
    required: ['leader', 'fields']
  };
}
