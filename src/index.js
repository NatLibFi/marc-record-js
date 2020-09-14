/**
*
* @licstart  The following is the entire license notice for the JavaScript code in this file.
*
* Copyright 2014-2017 Pasi Tuominen
* Copyright 2018-2020 University Of Helsinki (The National Library Of Finland)
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

import {clone, validateRecord, validateField} from './utils';
export {default as MarcRecordError} from './error';

const validationOptionsDefaults = {
  fields: true,
  subfields: true,
  subfieldValues: true
};

let globalValidationOptions = {...validationOptionsDefaults}; // eslint-disable-line functional/no-let

export class MarcRecord {
  static setValidationOptions(options) {
    globalValidationOptions = {...validationOptionsDefaults, ...options};
  }

  static getValidationOptions() {
    return clone(globalValidationOptions);
  }

  constructor(record, validationOptions = {}) {
    this._validationOptions = validationOptions; // eslint-disable-line functional/no-this-expression

    if (record) {
      const recordClone = clone(record);
      recordClone.leader = recordClone.leader || '';
      recordClone.fields = recordClone.fields || [];

      recordClone.fields
        .filter(({subfields}) => subfields)
        .forEach(field => {
          field.ind1 = field.ind1 || ' ';
          field.ind2 = field.ind2 || ' ';
        });

      validateRecord(recordClone, {...globalValidationOptions, ...this._validationOptions}); // eslint-disable-line functional/no-this-expression
      this.leader = recordClone.leader; // eslint-disable-line functional/no-this-expression
      this.fields = recordClone.fields; // eslint-disable-line functional/no-this-expression
      return;
    }

    this.leader = ''; // eslint-disable-line functional/no-this-expression
    this.fields = []; // eslint-disable-line functional/no-this-expression
  }

  get(query) {
    return this.fields.filter(field => field.tag.match(query)); // eslint-disable-line functional/no-this-expression
  }

  removeField(field) {
    this.fields.splice(this.fields.indexOf(field), 1); // eslint-disable-line functional/no-this-expression, functional/immutable-data
  }

  removeSubfield(subfield, field) { // eslint-disable-line class-methods-use-this
    const index = field.subfields.indexOf(subfield);
    field.subfields.splice(index, 1); // eslint-disable-line functional/immutable-data
  }

  appendField(field) {
    this.insertField(field, this.fields.length); // eslint-disable-line functional/no-this-expression
  }

  insertField(field, index) {
    const newField = Array.isArray(field) ? format(convertFromArray(field)) : format(field);

    validateField(newField, {...globalValidationOptions, ...this._validationOptions}); // eslint-disable-line functional/no-this-expression

    if (index === undefined) {
      const newIndex = this.findPosition(newField.tag); // eslint-disable-line functional/no-this-expression
      this.fields.splice(newIndex, 0, newField); // eslint-disable-line functional/no-this-expression, functional/immutable-data
      return;
    }

    this.fields.splice(index, 0, field); // eslint-disable-line functional/no-this-expression, functional/immutable-data

    function format(field) {
      const cloned = clone(field);

      if ('subfields' in field) {
        return {
          ...cloned,
          ind1: cloned.ind1 || ' ',
          ind2: cloned.ind2 || ' '
        };
      }

      return cloned;
    }

    function convertFromArray(args) {
      if (field.length === 2) {
        const [tag, value] = args;
        return {tag, value};
      }

      const [tag, ind1, ind2] = args;
      const subfields = parseSubfields(args.slice(3));

      return {tag, ind1, ind2, subfields};

      function parseSubfields(args, subfields = []) {
        const [code, value] = args;

        if (code) {
          return parseSubfields(args.slice(2), subfields.concat({code, value}));
        }

        return subfields;
      }
    }
  }

  findPosition(tag) {
    const index = this.fields.findIndex(({tag: fieldTag}) => fieldTag > tag); // eslint-disable-line functional/no-this-expression
    return index < 0 ? this.fields.length : index; // eslint-disable-line functional/no-this-expression
  }

  getControlfields() {
    return this.fields.filter(field => 'value' in field); // eslint-disable-line functional/no-this-expression
  }

  getDatafields() {
    return this.fields.filter(field => 'subfields' in field); // eslint-disable-line functional/no-this-expression
  }

  getFields(tag, query) {
    const fields = this.fields.filter(f => f.tag === tag); // eslint-disable-line functional/no-this-expression
    if (typeof query === 'string') {
      return fields.filter(f => f.value === query);
    }

    if (Array.isArray(query)) {
      return fields.filter(field => query.every(sfQuery => field.subfields.some(sf => sf.code === sfQuery.code && sf.value === sfQuery.value)));
    }

    return fields;
  }

  containsFieldWithValue(tag, query) {
    return this.getFields(tag, query).length > 0; // eslint-disable-line functional/no-this-expression
  }

  equalsTo(record) {
    return MarcRecord.isEqual(this, record); // eslint-disable-line functional/no-this-expression
  }

  toString() {
    return [].concat(
      `LDR    ${this.leader}`, // eslint-disable-line functional/no-this-expression
      this.getControlfields().map(f => `${f.tag}    ${f.value}`), // eslint-disable-line functional/no-this-expression
      this.getDatafields().map(mapDatafield) // eslint-disable-line functional/no-this-expression
    ).join('\n');

    function mapDatafield(f) {
      return `${f.tag} ${f.ind1}${f.ind2} ‡${formatSubfields(f)}`;

      function formatSubfields(field) {
        return field.subfields.map(sf => `${sf.code}${sf.value || ''}`).join('‡');
      }
    }
  }

  toObject() {
    return Object.entries(clone(this)) // eslint-disable-line functional/no-this-expression
      .filter(([k]) => k.startsWith('_') === false)
      .reduce((acc, [k, v]) => ({...acc, [k]: v}), {});
  }

  static fromString(str, validationOptions) {
    const record = new MarcRecord(undefined, validationOptions);

    str.split('\n')
      .map(ln => ({
        tag: ln.substr(0, 3),
        ind1: ln.substr(4, 1),
        ind2: ln.substr(5, 1),
        data: ln.substr(7)
      }))
      .forEach(field => {
        const {tag, ind1, ind2, data} = field;

        if (tag === 'LDR') {
          record.leader = data; // eslint-disable-line functional/immutable-data
          return;
        }

        if (data.substr(0, 1) === '‡') {
          record.appendField({tag, ind1, ind2, subfields: parseSubfields(data)});
          return;
        }

        record.appendField({tag, value: data});
      });

    return record;

    function parseSubfields(str) {
      return str.substr(1).split('‡').map(data => {
        const code = data.substr(0, 1);
        const value = data.substr(1);
        return value ? {code, value} : {code};
      });
    }
  }

  static clone(record, validationOptions = {}) {
    return new MarcRecord(record, validationOptions);
  }

  // This uses a strict string-to-string check but re-orders the object keys beforehand (MARC fields should be in same order, but the instance's properties order doesn't matter)
  static isEqual(r1, r2) {
    return JSON.stringify(reorder(r1)) === JSON.stringify(reorder(r2));

    function reorder(obj) {
      return Object.keys(obj).sort().reduce((acc, key) => ({ // eslint-disable-line functional/immutable-data
        ...acc,
        [key]: typeof obj[key] === 'object' ? reorder(obj[key]) : obj[key]
      }), {});
    }
  }
}
