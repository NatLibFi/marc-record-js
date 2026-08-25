import type {ValidationOptions} from "./index.ts";

const anythingPattern = /[\s\S]*/su;

// https://www.loc.gov/marc/specifications/specrecstruc.html
// tag. A three character string used to identify or label an associated variable field.
// The tag may consist of ASCII numeric characters (decimal integers 0-9) and/or ASCII alphabetic characters (uppercase or lowercase, but not both).

//  https://www.loc.gov/marc/specifications/specrecstruc.html
// control field. A variable field containing information useful or required for the processing of the record.
// Control fields are assigned tags beginning with two zeroes. Control fields with fixed length data elements are restricted to ASCII graphics.
// NOTE: Aleph uses also some other controlfields with non-numeric tags (FMT, LDR if its handled as a controlfield)

// ASCII - all printable/graphic: 32-126 (\x20 - \x7E)

const controlFieldTagPattern = /^(?:[0A-Z][0A-Z][0-9A-Z]|[0a-z][0a-z][0-9a-z])$/u;
const controlFieldValuePattern = /^[\x20-\x7E]*$/u;

// https://www.loc.gov/marc/specifications/specrecstruc.html
// data field. A variable field containing bibliographic or other data. Data fields are assigned tags beginning with characters other than two zeroes.
// Data fields contain data in any MARC 21 character set unless a field-specific restriction applies.

const dataFieldTagPattern = /^(?:[1-9A-Z][0-9A-Z][0-9A-Z]|[0-9A-Z][1-9A-Z][0-9A-Z]|[1-9a-z][0-9a-z][0-9a-z]|[0-9a-z][1-9a-z][0-9a-z])$/u;

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
const subfieldCodePattern = /^[\x21-\x40\x5B-\x7E]$/u;

// https://www.loc.gov/marc/specifications/specrecstruc.html:
// ... An indicator may be any ASCII lowercase alphabetic, numeric, or blank .
const indicatorPattern = /^[0-9a-z ]$/u;

// Option to not allow ASCII control characters in subfield values

// data field value patterns
const dataFieldValuePatternNoControlCharacters = /^[^\x00-\x1F\x7F]*$/u;

// https://www.loc.gov/marc/specifications/specrecstruc.html
// ... MARC 21 sets the length of the length of field portion of the entry at four characters, thus a field may contain a maximum of 9999 octets.
// Note: We're limiting controlField value length and sibfieldValue length with this parameter, records can be too long before single field hitting
// this restriction
const maximumFieldLength = 9999;

// Default setting for validationOptions — see README.md

/**
 * Create a JSON Schema for MARC record validation.
 * If strict mode is enabled, all validation options are set to true.
 * @param options - Validation options (ignored in strict mode).
 * @returns A jsonschema-compatible schema object.
 */
export default function createSchema(options: ValidationOptions) {
  if (options.strict) {
    return schema({
      fields: true,
      subfields: true,
      subfieldValues: true,
      controlFieldValues: true,
      leader: true,
      characters: true,
      noControlCharacters: true,
      noAdditionalProperties: true
    });
  }
  return schema(options);
}

/**
 * Create the JSON Schema for a single MARC field (control or data field).
 * Used to validate fields in isolation, without wrapping them in a record schema.
 * @param options - Validation options.
 * @returns A jsonschema-compatible schema object with an anyOf for control and data fields.
 */
export function createFieldSchema(options: ValidationOptions) {
  return createSchema(options).properties.fields.items;
}

function schema({
  fields = true,
  subfields = true,
  subfieldValues = true,
  controlFieldValues = true,
  leader = false,
  characters = false,
  noControlCharacters = false,
  noAdditionalProperties = false,
}: ValidationOptions) {
  return {
    id: 'MarcRecordObject',
    type: 'object',
    properties: {
      leader: {
        id: 'MarcRecordObject leader ',
        type: 'string',
        minLength: leader ? 24 : 0,
        maxLength: leader ? 24 : maximumFieldLength,
        pattern: characters ? controlFieldValuePattern : anythingPattern,
        maxOccurence: 1
      },
      fields: {
        id: 'MarcRecordObject MarcField[]',
        type: 'array',
        minItems: fields ? 1 : 0,
        items: {
          anyOf: [
            // Control field schema
            {
              id: 'MarcControlField',
              type: 'object',
              properties: {
                tag: {
                  id: 'MarcControlField tag',
                  type: 'string',
                  minLength: 3,
                  maxLength: 3,
                  pattern: characters ? controlFieldTagPattern : anythingPattern
                },
                value: {
                  id: 'MarcControlField value',
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
              additionalProperties: !noAdditionalProperties
            },
            // MarcField schema
            {
              id: 'MarcField',
              type: 'object',
              properties: {
                tag: {
                  id: 'MarcField tag',
                  type: 'string',
                  minLength: 3,
                  maxLength: 3,
                  pattern: characters ? dataFieldTagPattern : anythingPattern
                },
                ind1: {
                  id: 'MarcField ind1',
                  type: 'string',
                  minLength: 1,
                  maxLength: 1,
                  pattern: characters ? indicatorPattern : anythingPattern
                },
                ind2: {
                  id: 'MarcField ind2',
                  type: 'string',
                  minLength: 1,
                  maxLength: 1,
                  pattern: characters ? indicatorPattern : anythingPattern
                },
                subfields: {
                  id: 'MarcField MarcSubfield[]',
                  type: 'array',
                  minItems: subfields ? 1 : 0,
                  items: {
                    id: 'MarcSubfield',
                    type: 'object',
                    properties: {
                      code: {
                        id: 'MarcSubfield code',
                        type: 'string',
                        minLength: 1,
                        maxLength: 1,
                        pattern: characters ? subfieldCodePattern : anythingPattern
                      },
                      value: {
                        id: 'MarcSubfield value',
                        type: 'string',
                        maxLength: maximumFieldLength,
                        minLength: subfieldValues ? 1 : 0,
                        pattern: noControlCharacters ? dataFieldValuePatternNoControlCharacters : anythingPattern
                      },
                    },
                    required: subfieldValues ? ['code', 'value'] : ['code'],
                    additionalProperties: !noAdditionalProperties
                  }
                },
                value: false,
                additionalProperties: !noAdditionalProperties
              },
              required: [
                'tag',
                'ind1',
                'ind2',
                'subfields'
              ],
              additionalProperties: !noAdditionalProperties
            }
          ]
        }
      }
    },
    required: leader ? ['leader', 'fields'] : ['fields']
  };




}
