export default function ({fields = true, subfields = true, subfieldValues = true}) {
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
									minLength: 1
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
												minLength: subfieldValues ? 1 : 0
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
