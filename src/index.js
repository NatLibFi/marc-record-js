/**
*
* @licstart  The following is the entire license notice for the JavaScript code in this file.
*
* Copyright 2014-2017 Pasi Tuominen
* Copyright 2018 University Of Helsinki (The National Library Of Finland)
*
* Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:
*
* The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
*
* THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
*
* @licend  The above is the entire license notice
* for the JavaScript code in this file.
*
*/
import {createValidator, clone} from './utils';

const Validator = createValidator();

export class MarcRecord {
	constructor(record) {
		if (record) {
			const recordClone = clone(record);

			recordClone.leader = recordClone.leader || '';

			if (Array.isArray(recordClone.fields)) {
				recordClone.fields.forEach(field => {
					if ('subfields' in field) {
						field.ind1 = field.ind1 || ' ';
						field.ind2 = field.ind2 || ' ';
					}
				});
			}

			if (Validator.validateRecord(recordClone)) {
				this.leader = recordClone.leader;
				this.fields = recordClone.fields;
			} else {
				throw new Error('Record is invalid');
			}
		} else {
			this.leader = '';
			this.fields = [];
		}
	}

	get(query) {
		return this.fields.filter(field => {
			return field.tag.match(query);
		});
	}

	removeField(field) {
		this.fields.splice(this.fields.indexOf(field), 1);
	}

	removeSubfield(subfield, field) {
		const index = field.subfields.indexOf(subfield);
		field.subfields.splice(index, 1);
	}

	appendField(field) {
		this.insertField(field, this.fields.length);
	}

	insertField(field, index) {
		if ('subfields' in field) {
			field.ind1 = field.ind1 || ' ';
			field.ind2 = field.ind2 || ' ';
		}

		if (Validator.validateField(field)) {
			if (index === undefined) {
				index = this.findPosition(field.tag);
			}

			this.fields.splice(index, 0, field);
			return;
		}

		throw new Error('Field is invalid');
	}

	findPosition(tag) {
		for (let i = 0; i < this.fields.length; i++) {
			if (this.fields[i].tag > tag) {
				return i;
			}
		}

		return this.fields.length;
	}

	getControlfields() {
		return this.fields.filter(field => 'value' in field);
	}

	getDatafields() {
		return this.fields.filter(field => 'subfields' in field);
	}

	getFields(tag, query) {
		const fields = this.fields.filter(f => f.tag === tag);
		if (typeof query === 'string') {
			return fields.filter(f => f.value === query);
		}

		if (Array.isArray(query)) {
			return fields.filter(field => {
				return query.every(sfQuery => {
					return field.subfields.some(sf => {
						return sf.code === sfQuery.code && sf.value === sfQuery.value;
					});
				});
			});
		}

		return fields;
	}

	containsFieldWithValue(tag, query) {
		return this.getFields(tag, query).length > 0;
	}

	equalsTo(record) {
		return MarcRecord.isEqual(this, record);
	}

	toString() {
		return [].concat(`LDR    ${this.leader}`,
			this.getControlfields().map(f => `${f.tag}    ${f.value}`),
			this.getDatafields().map(mapDatafield)
		).join('\n');

		function mapDatafield(f) {
			return `${f.tag} ${f.ind1}${f.ind2} ‡${formatSubfields(f)}`;

			function formatSubfields(field) {
				return field.subfields.map(sf => `${sf.code}${sf.value}`).join('‡');
			}
		}
	}

	toObject() {
		return clone(this);
	}

	static fromString(str) {
		const record = new MarcRecord();

		str.split('\n')
			.map(ln => {
				return {
					tag: ln.substr(0, 3),
					ind1: ln.substr(4, 1),
					ind2: ln.substr(5, 1),
					data: ln.substr(7)
				};
			})
			.forEach(field => {
				const {tag, ind1, ind2, data} = field;
				if (tag === 'LDR') {
					record.leader = data;
				} else if (data.substr(0, 1) === '‡') {
					record.appendField({tag, ind1, ind2, subfields: parseSubfields(data)});
				} else {
					record.appendField({tag, value: data});
				}
			});

		return record;

		function parseSubfields(str) {
			return str.substr(1).split('‡').map(data => {
				return {
					code: data.substr(0, 1),
					value: data.substr(1)
				};
			});
		}
	}

	static clone(record) {
		return new MarcRecord(record);
	}

	// This uses a strict string-to-string check but re-orders the object keys beforehand (MARC fields should be in same order, but the instance's properties order doesn't matter)
	static isEqual(r1, r2) {
		return JSON.stringify(reorder(r1)) === JSON.stringify(reorder(r2));

		function reorder(obj) {
			return Object.keys(obj).sort().reduce((acc, key) => {
				return Object.assign(acc, {
					[key]: typeof obj[key] === 'object' ? reorder(obj[key]) : obj[key]
				});
			}, {});
		}
	}
}
