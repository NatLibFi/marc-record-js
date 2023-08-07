//const tagPattern = /^[0-9A-Z]{3}$/u;
const controlFieldTagPattern = /^[0A-Z][0A-Z][0-9A-Z]$/u;
const dataFieldTagPattern = /^(?:(?:[1-9A-Z][0-9A-Z])|(?:[0-9A-Z][1-9A-Z]))[0-9A-Z]$/u;

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

const controlFieldValuePattern = /^[ -~]*$/u;

export default function ({fields = true, subfields = true, subfieldValues = true}) {
  return {
    type: 'object',
    properties: {
      leader: {
        type: 'string',
        minLength: 24,
        maxLength: 24
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
                  pattern: controlFieldValuePattern
                  // maxLength: maximumFieldLength
                  // lengths depending on tag
                  // pattern controlFieldValueCharacters
                }
              },
              required: [
                'tag',
                'value'
              ],
              additionalProperties: false
            },
            {
              type: 'object',
              properties: {
                tag: {
                  type: 'string',
                  minLength: 3,
                  maxLength: 3,
                  pattern: dataFieldTagPattern
                  // pattern: notControlFieldTag
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
                  pattern: /^[0-9 ]$/u
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
                        minLength: subfieldValues ? 1 : 0
                        // maxLength: maximumFieldLength
                        // pattern: dataFieldValueCharacters
                      }
                    },
                    required: subfieldValues ? ['code', 'value'] : ['code']
                  }
                }
              },
              required: [
                'tag',
                'ind1',
                'ind2',
                'subfields'
              ],
              additionalProperties: false
            }
          ]
        }
      }
    },
    required: ['leader', 'fields']
  };
}
