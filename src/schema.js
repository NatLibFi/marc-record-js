//const tagPattern = /^[0-9A-Z]{3}$/u;
const controlFieldTagPattern = /^[0A-Z][0A-Z][0-9A-Z]$/u;
const dataFieldTagPattern = /^(?:(?:[1-9A-Z][0-9A-Z])|(?:[0-9A-Z][1-9A-Z]))[0-9A-Z]$/u;
const indicatorPattern = /^[0-9 ]$/u;
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
              ]
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
                        maxLength: 1
                        // pattern: subfieldCodeCharacters
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
              ]
            }
          ]
        }
      }
    },
    required: ['leader', 'fields']
  };
}
