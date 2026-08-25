import type {MarcControlField, MarcField, MarcRecordObject, ValidationOptions} from './index.ts';
import {validate} from 'jsonschema';
import createSchema, {createFieldSchema} from './schema.ts';
import MarcRecordError from './error.ts';
//import createDebugLogger from 'debug';
//import {inspect} from 'util';
//const debug = createDebugLogger('@natlibfi/marc-record:utils');
//const debugData = debug.extend('data');
//const debugDev = debug.extend('dev');

/**
 * Deep clone an object using JSON serialization.
 * @param obj - The object to clone.
 * @returns A deep copy of the object.
 */
export function clone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

export function validateRecord(record: MarcRecordObject, options: ValidationOptions = {}): string[] {
  const {noFailValidation = false} = options;
  const validationResults = validate(record, createSchema(options), {nestedErrors: false});
  //debugData(JSON.stringify(record));
  //debugDev(inspect(validationResults), {depth: 3});
  //debugDev(inspect(validationResults.errors));
  //debugData(validationResults.errors.toString());
  if (noFailValidation === true) {
    const errorStrings = validationResults.errors.map(valError => valError.toString());
    return errorStrings;
  }
  if (validationResults.errors.length > 0) {
    //console.log('Record validation throws');
    throw new MarcRecordError('Record is invalid', validationResults);
  }
  return [];
}

/**
 * Validate a single MARC field (control or data) against the schema.
 * @param field - The field object to validate.
 * @param options - Validation options.
 * @returns Array of validation error strings if noFailValidation is true; empty array otherwise.
 * @throws MarcRecordError if validation fails and noFailValidation is false.
 */
export function validateField(field: MarcControlField | MarcField, options: ValidationOptions = {}): string[] {
  const {noFailValidation = false} = options;
  const validationResults = validate(
    field,
    createFieldSchema(options),
    {nestedErrors: false}
  );
  //debugData(JSON.stringify(field));
  //debugDev(inspect(validationResults));
  //debugDev(inspect(validationResults.errors));
  //debugData(validationResults.errors.toString());
  if (noFailValidation === true) {
    return validationResults.errors.map(valError => valError.toString());
  }
  if (validationResults.errors.length > 0) {
    throw new MarcRecordError(`Field is invalid: ${JSON.stringify(field)}`, validationResults);
  }
  return [];
}
