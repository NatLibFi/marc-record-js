export default {
	type: 'object',
	properties: {
		leader: {
			type: 'string'
		},
		fields: {
			type: 'array',
			minItems: 1,
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
								minItems: 1,
								items: {
									type: 'object',
									properties: {
										code: {
											type: 'string',
											minLength: 1
										},
										value: {
											type: 'string',
											minLength: 1
										}
									},
									required: [
										'code',
										'value'
									]
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
