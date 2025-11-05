/* eslint-disable array-callback-return */

import createDebugLogger from 'debug';
import MarcRecordError from './error.js';
import {fieldOrderComparator} from './marcFieldSort.js';
import {clone, validateRecord, validateField} from './utils.js';

export {default as MarcRecordError} from './error.js';
const debug = createDebugLogger('@natlibfi/marc-record');
//const debugData = debug.extend('data');
const debugDev = debug.extend('dev');

// Default setting for validationOptions:
// These default validationOptions are (mostly) backwards compatible with marc-record-js < 7.3.0
//
// strict: false                  // All validationOptions below are set to true
// noFailValidation: false        // Do not error if validation fails, return validationResults instead
//
// fields: true,                  // Do not allow record without fields
// subfields: true,               // Do not allow empty subfields
// subfieldValues: true,          // Do not allow subfields without value
// controlFieldValues: true       // Do not allow controlFields without value
// leader: false,                 // Do not allow record without leader, with empty leader or with leader with length != 24
// characters: false              // Do not allow erronous characters in tags, indicators and subfield codes
// noControlCharacters: false,    // Do not allow ASCII control characters in field/subfield values
// noAdditionalProperties: false  // Do not allow additional properties in fields

const validationOptionsDefaults = {
  strict: false,
  noFailValidation: false,
  fields: true,
  subfields: true,
  subfieldValues: true,
  controlFieldValues: true,
  leader: false,
  characters: false,
  noControlCharacters: false,
  noAdditionalProperties: false
};

let globalValidationOptions = {...validationOptionsDefaults};

export class MarcRecord {

  static setValidationOptions(options) {
    globalValidationOptions = {...validationOptionsDefaults, ...options};
  }

  static getValidationOptions() {
    return clone(globalValidationOptions);
  }

  constructor(record, validationOptions = {}) {
    this._validationOptions = validationOptions;

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

      this.leader = recordClone.leader;
      this.fields = recordClone.fields;

      this._validationErrors = validateRecord(recordClone, {...globalValidationOptions, ...this._validationOptions});
      if (!this._validationOptions.noFailValidation) {
        delete this._validationErrors;
        return;
      }
      debugDev(`${JSON.stringify(this)}`);
      return;
    }

    this.leader = '';
    this.fields = [];
  }

  getValidationErrors() {
    debugDev(`getting validationErrors: ${this._validationErrors} <-`);
    if (!this._validationOptions.noFailValidation) {
      return [];
    }
    return this._validationErrors || [];
  }

  get(query) {
    return this.fields.filter(field => field.tag.match(query));
  }

  pop(query) {
    const fields = this.get(query);
    this.removeFields(fields);
    return fields;
  }

  sortFields() {
    this.fields.sort(fieldOrderComparator);
    return this;
  }

  removeField(field) {
    const index = this.fields.indexOf(field);
    if (index !== -1) {
      const {fields: keepLastField} = {...globalValidationOptions, ...this._validationOptions};
      if (this.fields.length === 1 && keepLastField) {
        throw new MarcRecordError('Cannot remove last field');
      }
      this.fields.splice(index, 1);
      return this;
    }
    return this;
  }

  removeFields(fields) {
    fields.forEach(f => this.removeField(f));
    return this;
  }

  removeSubfield(subfield, field) {
    const index = field.subfields.indexOf(subfield);
    field.subfields.splice(index, 1);
    if (field.subfields.length === 0) {
      return this.removeField(field);
    }
    return this;
  }

  appendField(field) {
    this.insertField(field, this.fields.length);
    return this;
  }

  appendFields(fields) {
    fields.forEach(f => this.appendField(f));
    return this;
  }

  insertField(field, index) {
    const newField = Array.isArray(field) ? format(convertFromArray(field)) : format(field);

    validateField(newField, {...globalValidationOptions, ...this._validationOptions});

    this.fields.splice(index ?? this.findPosition(newField), 0, newField);
    return this;

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

  insertFields(fields) {
    fields.forEach(f => this.insertField(f));
    return this;
  }

  findPosition(fieldA) {
    const index = this.fields.findIndex((fieldB) => fieldOrderComparator(fieldB, fieldA) > 0);
    return index < 0 ? this.fields.length : index;
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
      return fields.filter(field => query.every(sfQuery => field.subfields.some(sf => sf.code === sfQuery.code && sf.value === sfQuery.value)));
    }

    return fields;
  }

  containsFieldWithValue(tag, query) {
    return this.getFields(tag, query).length > 0;
  }

  getTypeOfRecord() {
    return this.leader[6];
  }

  getBibliograpicLevel() {
    return this.leader[7];
  }

  isBK() {
    return ['a', 't'].includes(this.getTypeOfRecord()) && !this._bibliographicLevelIsBis();
  }

  isCF() {
    return this.getTypeOfRecord() === 'm';
  }

  isCR() {
    return ['a', 't'].includes(this.getTypeOfRecord()) && this._bibliographicLevelIsBis();
  }

  isMP() {
    return ['e', 'f'].includes(this.getTypeOfRecord());
  }

  isMU() {
    return ['c', 'd', 'i', 'j'].includes(this.getTypeOfRecord());
  }

  isMX() {
    return this.getTypeOfRecord() === 'p';
  }

  isVM() {
    return ['g', 'k', 'o', 'r'].includes(this.getTypeOfRecord());
  }

  getTypeOfMaterial() {
    if (this.isBK()) {
      return 'BK';
    }
    if (this.isCF()) {
      return 'CF';
    }
    if (this.isCR()) {
      return 'CR';
    }
    if (this.isMP()) {
      return 'MP';
    }
    if (this.isMU()) {
      return 'MU';
    }
    if (this.isMX()) {
      return 'MX';
    }
    if (this.isVM()) {
      return 'VM';
    }
    return false;
  }

  _bibliographicLevelIsBis() {
    return ['b', 'i', 's'].includes(this.getBibliograpicLevel());
  }

  equalsTo(record) {
    return MarcRecord.isEqual(this, record);
  }

  toString() {
    return [].concat(
      `LDR    ${this.leader}`,
      this.getControlfields().map(f => `${f.tag}    ${f.value}`),
      this.getDatafields().map(mapDatafield)
    ).join('\n');

    function mapDatafield(f) {
      return `${f.tag} ${f.ind1}${f.ind2} ‡${formatSubfields(f)}`;

      function formatSubfields(field) {
        return field.subfields.map(sf => `${sf.code}${sf.value || ''}`).join('‡');
      }
    }
  }

  toObject() {
    return Object.entries(clone(this))
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
          record.leader = data;
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
      return Object.keys(obj).sort().reduce((acc, key) => ({
        ...acc,
        [key]: typeof obj[key] === 'object' ? reorder(obj[key]) : obj[key]
      }), {});
    }
  }
}
