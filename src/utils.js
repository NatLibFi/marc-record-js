import {validate} from 'jsonschema';
import createSchema from './schema';
import MarcRecordError from './error';
import createDebugLogger from 'debug';
//import {inspect} from 'util';

export function clone(obj) {
  return JSON.parse(JSON.stringify(obj));
}
const debug = createDebugLogger('@natlibfi/marc-record:utils');
const debugData = debug.extend('data');
//const debugDev = debug.extend('dev');


export function validateRecord(record, options = {}) {
  const validationResults = validate(record, createSchema(options), {nestedErrors: false});
  debugData(JSON.stringify(record));
  //debugDev(inspect(validationResults), {depth: 3});
  //debugDev(inspect(validationResults.errors));
  if (validationResults.errors.length > 0) { // eslint-disable-line functional/no-conditional-statements
    debugData(validationResults.toString());
    throw new MarcRecordError('Record is invalid', validationResults);
  }
}

export function validateField(field, options = {}) {
  const validationResults = validate(field, createSchema(options).properties.fields.items, {nestedErrors: false});
  debugData(JSON.stringify(field));
  //debugDev(inspect(validationResults));
  //debugDev(inspect(validationResults.errors));
  if (validationResults.errors.length > 0) { // eslint-disable-line functional/no-conditional-statements
    debugData(validationResults.toString());
    throw new MarcRecordError(`Field is invalid: ${JSON.stringify(field)}`, validationResults);
  }
}

export function fieldToString(f) {
  if ('subfields' in f) {
    return `${f.tag} ${f.ind1}${f.ind2} ‡${formatSubfields(f)}`;
  }
  return `${f.tag}    ${f.value}`;
  function formatSubfields(field) {
    return field.subfields.map(sf => `${sf.code}${sf.value || ''}`).join('‡');
  }
}
