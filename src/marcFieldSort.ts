import createDebugLogger from 'debug';
import type {MarcControlField, MarcField} from './index.ts';
const debug = createDebugLogger('@natlibfi/marc-record:marcFieldSort');
const debugDev = debug.extend('dev');

/** Default array of sorter functions: sortByTag, then sortAlphabetically. */
export const defaultSorterFunctions: ((fieldA: MarcControlField | MarcField, fieldB: MarcControlField | MarcField) => number)[]
  = [sortByTag, sortAlphabetically];

/**
* Compare two MARC fields using the provided sorter functions.
* Iterates through sorter functions and returns the first non-zero result.
* @param fieldA - First field to compare.
* @param fieldB - Second field to compare.
* @param sorterFunctions - Array of comparator functions. Defaults to [sortByTag, sortAlphabetically].
* @returns Negative if fieldA < fieldB, positive if fieldA > fieldB, 0 if equal.
*/
export function fieldOrderComparator(
  fieldA: MarcControlField | MarcField,
  fieldB: MarcControlField | MarcField,
  sorterFunctions: ((fieldA: MarcControlField | MarcField, fieldB: MarcControlField | MarcField) => number)[] = defaultSorterFunctions): number {

  function fieldToString(f: MarcControlField | MarcField): string {
    if ('subfields' in f) {
      return `${f.tag} ${f.ind1}${f.ind2} ‡${formatSubfields(f)}`;
    }
    return `${f.tag}    ${f.value}`;

    function formatSubfields(dataField: MarcField): string {
      return dataField.subfields.map(sf => `${sf.code}${sf.value || ''}`).join('‡');
    }
  }

  for (const sortFn of sorterFunctions) {
    const result = sortFn(fieldA, fieldB);
    debugDev(`${sortFn.name}: '${fieldToString(fieldA)}' vs '${fieldToString(fieldB)}' ${result}`);
    if (result !== 0) {
      return result;
    }
  }

  return 0;
}

/**
 * Sort MARC fields by tag. Control fields (000-009) come before data fields.
 * Special tags (LDR, STA, SID, LOW, CAT, HLI) have fixed sort positions.
 * @param fieldA - First field to compare.
 * @param fieldB - Second field to compare.
 * @returns Negative if fieldA < fieldB, positive if fieldA > fieldB, 0 if equal.
 */
export function sortByTag(fieldA: MarcControlField | MarcField, fieldB: MarcControlField | MarcField): number {
  const orderA = getSortIndex(fieldA.tag);
  const orderB = getSortIndex(fieldB.tag);

  if (orderA > orderB) {
    return 1;
  }
  if (orderA < orderB) {
    return -1;
  }

  return 0;

  function getSortIndex(tag: string): string {
    const sortIndex: Record<string, string> = {
      LDR: '000',
      STA: '001.1', // STA comes now after 001. However 003+001 form a combo, so I'm not sure...
      SID: '999.1',
      LOW: '999.2',
      CAT: '999.3',
      HLI: '999.4'
    };

    const specialIndex = sortIndex[tag]; // <- this allows weights for numeric values as well (not that we use them yet)
    if (specialIndex !== undefined) {
      return specialIndex;
    }
    if (isNaN(Number(tag))) {
      return '999.9';
    }
    return tag;
  }
}

/**
 * Sort fields alphabetically by specific subfields for certain tags.
 * LOW fields are sorted by subfield 'a', SID fields by subfield 'b'.
 * @param fieldA - First field to compare.
 * @param fieldB - Second field to compare.
 * @returns Negative if fieldA < fieldB, positive if fieldA > fieldB, 0 if equal.
 */
export function sortAlphabetically(fieldA: MarcControlField | MarcField, fieldB: MarcControlField | MarcField): number {
  if (fieldA.tag !== fieldB.tag) {
    return 0;
  }

  const tagToSortingSubfields: Record<string, string[]> = {
    'LOW': ['a'],
    'SID': ['b']
  };

  const subfieldsToCheck = tagToSortingSubfields[fieldA.tag];
  if (subfieldsToCheck === undefined) {
    return 0;
  }

  const result = scoreSubfieldsAlphabetically(subfieldsToCheck);
  debugDev(`RESULT ${result}`);
  return result;

  function scoreSubfieldsAlphabetically(setOfSubfields: string[]): number {
    if (setOfSubfields.length === 0) {
      return 0;
    }
    const [subfieldCode, ...remainingSubfieldCodes] = setOfSubfields;
    if (subfieldCode === undefined) {
      return 0;
    }
    const valA = selectFirstValue(fieldA, subfieldCode);
    const valB = selectFirstValue(fieldB, subfieldCode);
    if (!valA) {
      if (!valB) {
        return scoreSubfieldsAlphabetically(remainingSubfieldCodes);
      }
      return -1;
    }
    if (!valB) {
      return 1;
    }
    debugDev(`CHECKING SUBFIELD '${subfieldCode}': '${valA}' vs '${valB}'`);

    if (valA < valB) {
      return -1;
    }
    if (valB < valA) {
      return 1;
    }
    return scoreSubfieldsAlphabetically(remainingSubfieldCodes);
  }

  function selectFirstValue(field: MarcControlField | MarcField, subcode: string): string | undefined {
    if ('subfields' in field) {
      return field.subfields
        .filter(subfield => subcode === subfield.code)
        .map(subfield => subfield.value)
        .slice(0, 1)[0];
    }
    return undefined;
  }
}
