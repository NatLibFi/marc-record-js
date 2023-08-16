const anythingPattern = /[\s\S]*/su;

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

// DEVELOP: Can we somehow check actual field length in addition to single field/subfield value
// 9999 includes indicators + subfield separators + subfield coded in datafields, these could be subtracted

// DEVELOP: Can we check the record length (maximum 99999 octets) ?
// https://www.loc.gov/marc/specifications/specrecstruc.html
// Record length (character positions 00-04), contains a five-character ASCII numeric string equal to the length of the entire record,
// including itself and the record terminator. The five-character numeric string is right justified and unused positions contain zeroes (zero fill).
// The maximum length of a record is 99999 octets.

// DEVELOP: We could add a checker for MARC21 hardcoded codes in leader

// https://www.loc.gov/marc/specifications/specrecstruc.html#leader
// ...
// * Indicator count (character position 10), contains one ASCII numeric character specifying the number of indicators
// occurring in each variable data field. In MARC 21 records, the indicator count is always 2.
// * Subfield code length (character position 11), contains one ASCII numeric character specifying the sum of the lengths
// of the delimiter and the data element identifier used in the record. In MARC 21 records,
// the subfield code length is always 2. The ANSI Z39.2 and ISO 2709 name for this data element is identifier length .
// * Entry map (character positions 20-23), contains four single digit ASCII numeric characters that specify the structure of the entries in the directory.
// ** Length of length-of-field (character position 20): specifies the length of that part of each directory entry; in MARC 21 records, it is always set to 4.
// ** Length of starting-character-position (character position 21): specifies the length of that part of each directory entry; in MARC 21 records, it is always set to 5.
// ** Length of implementation-defined (character position 22): specifies that part of each directory entry; in MARC 21 records, a directory entry does not contain an implementation-defined portion, therefore this position is always set to 0.
// ** Undefined (character position 23): this character position is undefined; it is always set to 0.


// Default setting for validationOptions:
// strict: false                  // All validationOptions below are set to true
//
// fields: true,                  // Do not allow record without fields
// subfields: true,               // Do not allow empty subfields
// subfieldValues: true,          // Do not allow subfields without value
// controlFieldValues: true       // Do not allow controlFields without value
// leader: false,                 // Do not allow record without leader, with empty leader or with leader with length != 24
// characters: false              // Do not allow erronous characters in tags, indicators and subfield codes
// noControlCharacters: false,    // Do not allow ASCII control characters in field/subfield values
// noAdditionalProperties: false  // Do not allow additional properties in fields


export default function ({strict = false, fields = true, subfields = true, subfieldValues = true, controlFieldValues = true, leader = false, characters = false, noControlCharacters = false, noAdditionalFieldProperties = false}) {
  if (strict) {
    return schema({fields: true, subfields: true, subfieldValues: true, controlFieldValues: true, leader: true, characters: true, noControlCharacters: true, noAdditionalFieldProperties: true});
  }
  return schema({fields, subfields, subfieldValues, controlFieldValues, leader, characters, noControlCharacters, noAdditionalFieldProperties});
}

function schema({fields = true, subfields = true, subfieldValues = true, controlFieldValues = true, leader = false, characters = false, noControlCharacters = false, noAdditionalFieldProperties = false}) {
  return {
    type: 'object',
    properties: {
      leader: {
        type: 'string',
        minLength: leader ? 24 : 0,
        maxLength: leader ? 24 : maximumFieldLength,
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
                  pattern: characters ? controlFieldTagPattern : anythingPattern
                },
                value: {
                  type: 'string',
                  minLength: controlFieldValues ? 1 : 0,
                  maxLength: maximumFieldLength,
                  pattern: characters ? controlFieldValuePattern : anythingPattern
                },
                ind1: false,
                ind2: false,
                subfields: false
              },
              required: controlFieldValues ? ['tag', 'value'] : ['tag'],
              additionalProperties: !noAdditionalFieldProperties
            },
            {
              type: 'object',
              properties: {
                tag: {
                  type: 'string',
                  minLength: 3,
                  maxLength: 3,
                  pattern: characters ? dataFieldTagPattern : anythingPattern
                },
                ind1: {
                  type: 'string',
                  minLength: 1,
                  maxLength: 1,
                  pattern: characters ? indicatorPattern : anythingPattern
                },
                ind2: {
                  type: 'string',
                  minLength: 1,
                  maxLength: 1,
                  pattern: characters ? indicatorPattern : anythingPattern
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
                        pattern: characters ? subfieldCodePattern : anythingPattern
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
    required: leader ? ['leader', 'fields'] : ['fields']
  };
}
