import {validate} from 'jsonschema';
import createSchema from './schema.js';
import MarcRecordError from './error.js';
//import createDebugLogger from 'debug';
//import {inspect} from 'util';

export function clone(obj) {
  return JSON.parse(JSON.stringify(obj));
}
//const debug = createDebugLogger('@natlibfi/marc-record:utils');
//const debugData = debug.extend('data');
//const debugDev = debug.extend('dev');


export function validateRecord(record, options = {}) {
  const {noFailValidation} = options;
  const validationResults = validate(record, createSchema(options), {nestedErrors: false});
  //debugData(JSON.stringify(record));
  //debugDev(inspect(validationResults), {depth: 3});
  //debugDev(inspect(validationResults.errors));
  //debugData(validationResults.errors.toString());
  if (noFailValidation) {
    return validationResults.errors.map(valError => valError.toString());
  }
  if (validationResults.errors.length > 0) {
    throw new MarcRecordError('Record is invalid', validationResults);
  }
  return [];
}

export function validateField(field, options = {}) {
  const {noFailValidation} = options;
  const validationResults = validate(field, createSchema(options).properties.fields.items, {nestedErrors: false});
  //debugData(JSON.stringify(field));
  //debugDev(inspect(validationResults));
  //debugDev(inspect(validationResults.errors));
  //debugData(validationResults.errors.toString());
  if (noFailValidation) {
    return validationResults.errors.map(valError => valError.toString());
  }
  if (validationResults.errors.length > 0) {
    throw new MarcRecordError(`Field is invalid: ${JSON.stringify(field)}`, validationResults);
  }
  return [];
}
