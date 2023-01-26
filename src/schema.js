/* eslint-disable no-nested-ternary */
export default function ({fields = true, subfields = true, subfieldValues = true, allowNonBreakingSpace = true, allowSubfieldValuesEndingWhitespace = true}) {
  return {
    type: 'object',
    properties: {
      leader: {
        type: 'string'
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
                  minLength: 1
                },
                value: {
                  type: 'string',
                  minLength: 1,
                  pattern: allowNonBreakingSpace && allowSubfieldValuesEndingWhitespace
                    ? /.*/u : allowSubfieldValuesEndingWhitespace
                      ? /^(?!.*\u00A0)/u : allowNonBreakingSpace
                        ? /[^\s]*$/u
                        : /^(?!.*\u00A0)|[^\s]*$/u
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
                  minLength: 1
                },
                ind1: {
                  type: 'string',
                  minLength: 1,
                  maxLength: 1
                },
                ind2: {
                  type: 'string',
                  minLength: 1,
                  maxLength: 1
                },
                subfields: {
                  type: 'array',
                  minItems: subfields ? 1 : 0,
                  items: {
                    type: 'object',
                    properties: {
                      code: {
                        type: 'string',
                        minLength: 1
                      },
                      value: {
                        type: 'string',
                        minLength: subfieldValues ? 1 : 0,
                        pattern: allowNonBreakingSpace && allowSubfieldValuesEndingWhitespace
                          ? /.*/u : allowSubfieldValuesEndingWhitespace
                            ? /^(?!.*\u00A0)/u : allowNonBreakingSpace
                              ? /[^\s]*$/u
                              : /^(?!.*\u00A0)|[^\s]*$/u
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
/* eslint-enable no-nested-ternary */
