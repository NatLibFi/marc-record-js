//const tagCharacters = '^[0-9A-Z]{3}$';
const indicatorCharacters = /^[0-9 ]$/u;

export default function ({fields = true, subfields = true, subfieldValues = true}) {
  return {
    type: 'object',
    properties: {
      leader: {
        type: 'string'
        // maxLength: 24,
        // minLength: 24
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
                  //minLength: 1
                  minLength: 3,
                  maxLength: 3,
                  // pattern: controlFieldTag
                  pattern: /^[0-9A-Z]{3}$/u
                },
                value: {
                  type: 'string',
                  minLength: 1
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
                  //minLength: 1
                  minLength: 3,
                  maxLength: 3,
                  pattern: /^[0-9A-Z]{3}$/u
                  // pattern: notControlFieldTag
                  // pattern: tagCharacters
                },
                ind1: {
                  type: 'string',
                  minLength: 1,
                  maxLength: 1,
                  //pattern: /^[0-9 ]$/u
                  pattern: indicatorCharacters
                },
                ind2: {
                  type: 'string',
                  minLength: 1,
                  maxLength: 1,
                  pattern: /^[0-9 ]$/u
                  // pattern: indicatorCharacters
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
