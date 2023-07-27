import {validate} from 'jsonschema';
import createSchema from './schema';
import MarcRecordError from './error';

export function clone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

export function validateRecord(record, options = {}) {
  const validationResults = validate(record, createSchema(options));
  if (validationResults.errors.length > 0) { // eslint-disable-line functional/no-conditional-statements
    throw new MarcRecordError('Record is invalid', validationResults);
  }
}

export function validateField(field, options = {}) {
  const validationResults = validate(field, createSchema(options).properties.fields.items);
  if (validationResults.errors.length > 0) { // eslint-disable-line functional/no-conditional-statements
    throw new MarcRecordError(`Field is invalid: ${JSON.stringify(field)}`, validationResults);
  }
}
