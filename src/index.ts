import createDebugLogger from 'debug';
import MarcRecordError from './error.ts';
import {fieldOrderComparator} from './marcFieldSort.ts';
import {validateRecord, validateField} from './utils.ts';

export {default as MarcRecordError} from './error.ts';

/** Plain data structure for constructing a MARC record. */
export interface MarcRecordObject {
  leader: string;
  fields: (MarcControlField | MarcField)[];
}

/**
 * A MARC control field (tag + value, no indicators or subfields).
 */
export interface MarcControlField {
  tag: string;
  value: string;
}

/**
 * A MARC data field (tag + two optional indicators + subfields).
 */
export interface MarcField {
  tag: string;
  ind1: string;
  ind2: string;
  subfields: MarcSubfield[];
}

/**
 * A MARC subfield with a code and value.
 */
export interface MarcSubfield {
  code: string;
  value?: string;
}

/** Type-of-material short codes derivable from the leader. */
export type TypeOfMaterial = 'BK' | 'CF' | 'CR' | 'MP' | 'MU' | 'MX' | 'VM';

const debug = createDebugLogger('@natlibfi/marc-record');
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

/**
 * Options for MARC record validation.
 */
export interface ValidationOptions {
  /** Enable strict mode: Enables all validation options. */
  strict?: boolean;
  /** If true, validation errors are collected instead of throwing. */
  noFailValidation?: boolean;
  /** Validate that fields array is present and non-empty. */
  fields?: boolean;
  /** Validate that subfields arrays are present and non-empty. */
  subfields?: boolean;
  /** Validate that subfield values are non-empty. */
  subfieldValues?: boolean;
  /** Validate that control field values are present and non-empty. */
  controlFieldValues?: boolean;
  /** Validate the leader field (length and content). */
  leader?: boolean;
  /** Enforce character pattern restrictions (ASCII graphics, etc.). */
  characters?: boolean;
  /** Reject control characters (0x00-0x1F, 0x7F) in field values. */
  noControlCharacters?: boolean;
  /** Reject additional properties beyond the defined schema. */
  noAdditionalProperties?: boolean;
}

/** Shorthand for insertField: [tag, value] creates a control field. */
export type MarcControlFieldShorthand = [tag: string, value: string];

/** Shorthand for insertField: [tag, ind1, ind2, ...code/value pairs] creates a data field. */
export type MarcDataFieldShorthand = [tag: string, ind1: string, ind2: string, ...subfieldCodesAndValues: string[]];

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

let globalValidationOptions: ValidationOptions = {...validationOptionsDefaults};

export class MarcRecord {
  leader: string;
  fields: (MarcControlField | MarcField)[];
  _validationOptions: ValidationOptions;
  _validationErrors?: string[];

  /**
    * Set global validation options that apply to all MarcRecord instances.
    * @param options - Validation options to apply globally.
    */
  static setValidationOptions(options: ValidationOptions): void {
    globalValidationOptions = {...validationOptionsDefaults, ...options};
  }

  /**
   * Get a copy of the current global validation options.
   * @returns A clone of the global validation options.
   */
  static getValidationOptions(): ValidationOptions {
    return structuredClone(globalValidationOptions);
  }

  /**
   * Create a new MARC record.
   * @param record - Optional record data to initialize the record. If omitted, creates an empty record.
   * @param validationOptions - Optional validation options for this record instance.
   */
  constructor(record?: MarcRecordObject, validationOptions: ValidationOptions = {}) {
    this._validationOptions = validationOptions;

    if (record) {
      const recordClone = structuredClone(record);
      recordClone.leader = recordClone.leader || '';
      recordClone.fields = recordClone.fields || [];

      recordClone.fields
        .filter((field): field is MarcField => 'subfields' in field)
        .forEach((field) => {
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

  /**
   * Get validation errors for this record. Returns an empty array if noFailValidation is false.
   * @returns Array of validation error strings, or empty array.
   */
  getValidationErrors(): string[] {
    debugDev(`getting validationErrors: ${this._validationErrors} <-`);
    if (!this._validationOptions.noFailValidation) {
      return [];
    }
    return this._validationErrors ?? [];
  }

  /**
   * Find all fields whose tag matches the given query.
   * String queries match as substrings (matching String.prototype.match semantics),
   * RegExp queries are tested against the tag.
   * @param query - Regular expression or substring to match against field tags.
   * @returns Array of matching field entries.
   */
  get(query: RegExp | string): (MarcControlField | MarcField)[] {
    return this.fields.filter(field => field.tag.match(query));
  }

  /**
   * Find and remove all fields whose tag matches the given query.
   * @param query - Regular expression or substring to match against field tags.
   * @returns Array of removed field entries.
   */
  pop(query: RegExp | string): (MarcControlField | MarcField)[] {
    const fields = this.get(query);
    this.removeFields(fields);
    return fields;
  }

  /**
   * Sort fields in place using the default field order comparator, returning this record.
   * @returns This MarcRecord instance for chaining.
   */
  sortFields(): this {
    this.fields.sort(fieldOrderComparator);
    return this;
  }

  /**
   * Remove a single field by reference. Throws an error if this is the last field and the fields validation option is enabled.
   * @param field - The field entry to remove.
   * @returns This MarcRecord instance for chaining.
   */
  removeField(field: MarcControlField | MarcField): this {
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

  /**
   * Remove multiple fields. Each field is removed one at a time.
   * @param fields - Array of field entries to remove.
   * @returns This MarcRecord instance for chaining.
   */
  removeFields(fields: (MarcControlField | MarcField)[]): this {
    fields.forEach(f => this.removeField(f));
    return this;
  }

  /**
   * Remove a subfield from a data field. If the field has no subfields remaining, removes the entire field.
   * @param subfield - The subfield to remove.
   * @param field - The data field containing the subfield.
   * @returns This MarcRecord instance for chaining.
   */
  removeSubfield(subfield: MarcSubfield, field: MarcField): this {
    const index = field.subfields.indexOf(subfield);
    if (index === -1) {
      return this;
    }
    field.subfields.splice(index, 1);
    if (field.subfields.length === 0) {
      return this.removeField(field);
    }
    return this;
  }

  /**
   * Append a field to the end of the record.
   * @param field - Field entry or array shorthand to append.
   * @returns This MarcRecord instance for chaining.
   */
  appendField(field: MarcControlField | MarcField): this {
    this.insertField(field, this.fields.length);
    return this;
  }

  /**
   * Append multiple fields to the end of the record.
   * @param fields - Array of field entries to append.
   * @returns This MarcRecord instance for chaining.
   */
  appendFields(fields: (MarcControlField | MarcField)[]): this {
    fields.forEach(f => this.appendField(f));
    return this;
  }

  /**
   * Insert a field at a specific position, or at the auto-sorted position if index is undefined.
   * Fields can be provided as MarcField objects or as array shorthands:
   * - `[tag, value]` for control fields
   * - `[tag, ind1, ind2, ...]` for data fields with subfields
   * @param field - Field entry or array shorthand to insert.
   * @param index - Optional position to insert at. If omitted, uses auto-sort position.
   * @returns This MarcRecord instance for chaining.
   */
  insertField(field: MarcControlField | MarcField | MarcControlFieldShorthand | MarcDataFieldShorthand, index?: number): this {
    const newField = Array.isArray(field) ? format(convertFromArray(field)) : format(field);

    validateField(newField, {...globalValidationOptions, ...this._validationOptions});

    this.fields.splice(index ?? this.findPosition(newField), 0, newField);
    return this;

    function format(field: MarcField | MarcControlField): MarcField | MarcControlField {
      const cloned = structuredClone(field);

      if ('subfields' in field) {
        return {
          ...field,
          ind1: field.ind1 ?? ' ',
          ind2: field.ind2 ?? ' '
        };
      }

      return cloned;
    }

    function convertFromArray(args: MarcControlFieldShorthand | MarcDataFieldShorthand): MarcField | MarcControlField {
      if (isControlFieldShorthand(args)) {
        const [tag, value] = args;
        return {tag, value};
      }

      const [tag, ind1, ind2, ...rest] = args;
      const subfields = parseSubfields(rest);

      return {tag, ind1, ind2, subfields};

      function parseSubfields(
        remaining: string[],
        subfields: MarcSubfield[] = [],
      ): MarcSubfield[] {
        const [code, value] = remaining;

        if (code) {
          return parseSubfields(remaining.slice(2), subfields.concat({code, value}));
        }

        return subfields;
      }

      function isControlFieldShorthand(args: MarcControlFieldShorthand | MarcDataFieldShorthand): args is MarcControlFieldShorthand {
        return args.length === 2;
      }
    }
  }

  /**
   * Insert multiple fields at their auto-sorted positions.
   * @param fields - Array of field entries to insert.
   * @returns This MarcRecord instance for chaining.
   */
  insertFields(fields: (MarcControlField | MarcField)[]): this {
    fields.forEach(f => this.insertField(f));
    return this;
  }


  /**
   * Find the correct auto-sort position for a field.
   * @param fieldA - The field to find a position for.
   * @returns The index where the field should be inserted.
   */
  findPosition(fieldA: MarcControlField | MarcField): number {
    const index = this.fields.findIndex((fieldB) =>
      fieldOrderComparator(fieldB, fieldA) > 0
    );
    return index < 0 ? this.fields.length : index;
  }

  /**
   * Get all control fields from the record.
   * @returns Array of control field entries.
   */
  getControlfields(): MarcControlField[] {
    return this.fields.filter((field): field is MarcControlField => 'value' in field);
  }

  /**
   * Get all data fields from the record.
   * @returns Array of data field entries.
   */
  getDatafields(): MarcField[] {
    return this.fields.filter((field): field is MarcField => 'subfields' in field);
  }

  /**
   * Find fields by tag, with optional value or subfield query filtering.
   * @param tag - Three-character field tag to match.
   * @param query - Optional value string (for control fields) or array of subfield queries (for data fields).
   * @returns Array of matching field entries.
   */
  getFields(tag: string, query?: string | MarcSubfield[]): (MarcControlField | MarcField)[] {
    const fields = this.fields.filter((f) => f.tag === tag);
    if (typeof query === 'string') {
      return fields.filter((f) => 'value' in f && f.value === query);
    }

    if (Array.isArray(query)) {
      return fields.filter(
        (field) => 'subfields' in field && query.every(
          sfQuery => field.subfields.some(
            (sf) => sf.code === sfQuery.code && sf.value === sfQuery.value
          )
        )
      );
    }

    return fields;
  }

  /**
   * Check if the record contains a field with a specific tag and value.
   * @param tag - Three-character field tag to check.
   * @param query - Value to match against the field.
   * @returns True if a matching field exists.
   */
  containsFieldWithValue(tag: string, query: string | MarcSubfield[]): boolean {
    return this.getFields(tag, query).length > 0;
  }

  /**
   * Get the type of record from leader position 6.
   * @returns Type character (e.g., 'a' for language material, 'c' for notated music).
   */
  getTypeOfRecord(): string | undefined {
    return this.leader?.[6];
  }

  /**
   * Get the bibliographic level from leader position 7.
   * @returns Bibliographic level character (e.g., 'a' for monographic component part, 'm' for monograph).
   */
  getBibliographicLevel(): string | undefined {
    return this.leader?.[7];
  }

  /**
   * Check if the record represents a book or language material.
   * @returns True if the record type is BK.
   */
  isBK(): boolean {
    const type = this.getTypeOfRecord();
    return (type === 'a' || type === 't') && !this._bibliographicLevelIsBis();
  }

  /**
   * Check if the record represents a cartographic material (monograph).
   * @returns True if the record type is CF.
   */
  isCF(): boolean {
    return this.getTypeOfRecord() === 'm';
  }

  /**
   * Check if the record represents a combined material.
   * @returns True if the record type is CR.
   */
  isCR(): boolean {
    const type = this.getTypeOfRecord();
    return (type === 'a' || type === 't') && this._bibliographicLevelIsBis();
  }

  /**
   * Check if the record represents a moving image material.
   * @returns True if the record type is MP.
   */
  isMP(): boolean {
    return ['e', 'f'].includes(this.getTypeOfRecord() ?? '');
  }

  /**
   * Check if the record represents a musical score or sound recording.
   * @returns True if the record type is MU.
   */
  isMU(): boolean {
    return ['c', 'd', 'i', 'j'].includes(this.getTypeOfRecord() ?? '');
  }

  /**
   * Check if the record represents a manuscript language material.
   * @returns True if the record type is MX.
   */
  isMX(): boolean {
    return this.getTypeOfRecord() === 'p';
  }

  /**
   * Check if the record represents a visual or nonprojectable medium.
   * @returns True if the record type is VM.
   */
  isVM(): boolean {
    return ['g', 'k', 'o', 'r'].includes(this.getTypeOfRecord() ?? '');
  }

  /**
   * Get the type of material as a short code.
   * @returns One of 'BK', 'CF', 'CR', 'MP', 'MU', 'MX', 'VM', or undefined if unrecognized.
   */
  getTypeOfMaterial(): TypeOfMaterial | undefined {
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
    return undefined;
  }

  private _bibliographicLevelIsBis(): boolean {
    return ['b', 'i', 's'].includes(this.getBibliographicLevel() ?? '');
  }

  /**
   * Check if this record equals another record (ignoring field order).
   * @param record - The other MarcRecord to compare against.
   * @returns True if the records are equivalent.
   */
  equalsTo(record: MarcRecord): boolean {
    return MarcRecord.isEqual(this, record);
  }

  /**
   * Serialize the record to a human-readable MARC string format.
   * @returns String representation of the record.
   */
  toString(): string {
    return [
      `LDR    ${this.leader}`,
      ...this.getControlfields().map(f => `${f.tag}    ${f.value}`),
      ...this.getDatafields().map(mapDatafield)
    ].join('\n');

    function mapDatafield(f: MarcField): string {
      return `${f.tag} ${f.ind1}${f.ind2} ‡${formatSubfields(f)}`;

      function formatSubfields(field: MarcField): string {
        return field.subfields.map(sf => `${sf.code}${sf.value || ''}`).join('‡');
      }
    }
  }

  /**
   * Convert the record to a plain JavaScript object (excluding private fields).
   * @returns Plain object representation of the record.
   */
  toObject(): MarcRecordObject {
    return {
      leader: this.leader,
      fields: structuredClone(this.fields)
    };
  }

  /**
   * Parse a MARC string representation into a new MarcRecord.
   * @param str - MARC string to parse.
   * @param validationOptions - Optional validation options for the new record.
   * @returns A new MarcRecord instance.
   */
  static fromString(str: string, validationOptions?: ValidationOptions): MarcRecord {
    const record = new MarcRecord(undefined, validationOptions);

    str.split('\n')
      .map(ln => {
        return {
          tag: ln.substring(0, 3),
          ind1: ln.substring(4, 5),
          ind2: ln.substring(5, 6),
          data: ln.substring(7)
        }
      })
      .forEach(field => {
        const {tag, ind1, ind2, data} = field;

        if (tag === 'LDR') {
          record.leader = data;
          return;
        }

        if (data.substring(0, 1) === '‡') {
          record.appendField({tag, ind1, ind2, subfields: parseSubfields(data)});
          return;
        }

        record.appendField({tag, value: data});
      });

    return record;

    function parseSubfields(str: string): MarcSubfield[] {
      return str.substring(1).split('‡').map(data => {
        const code = data.substring(0, 1);
        const value = data.substring(1);
        return value ? {code, value} : {code};
      });
    }
  }

  /**
   * Create a deep clone of a MarcRecord.
   * @param record - The record to clone.
   * @param validationOptions - Optional validation options for the cloned record.
   * @returns A new MarcRecord with the same data.
   */
  static clone(record: MarcRecord, validationOptions?: ValidationOptions): MarcRecord {
    return new MarcRecord(record, validationOptions);
  }

  /**
   * Compare two MarcRecords for equality (ignoring field order).
   * @param r1 - First record to compare.
   * @param r2 - Second record to compare.
   * @returns True if the records have equivalent data.
   */
  static isEqual(r1: MarcRecord, r2: MarcRecord): boolean {
    const r1c = MarcRecord.clone(r1);
    const r2c = MarcRecord.clone(r2);
    return JSON.stringify(r1c.sortFields()) === JSON.stringify(r2c.sortFields());
  }
}

