import createDebugLogger from 'debug';

const debug = createDebugLogger('@natlibfi/marc-record:marcFieldSort');
//const debugData = debug.extend('data');
const debugDev = debug.extend('dev');

export const defaultSorterFunctions = [sortByTag, sortAlphabetically];

export function fieldOrderComparator(fieldA, fieldB, sorterFunctions = defaultSorterFunctions) {

  function fieldToString(f) {
    if ('subfields' in f) {
      return `${f.tag} ${f.ind1}${f.ind2} ‡${formatSubfields(f)}`;
    }
    return `${f.tag}    ${f.value}`;
    function formatSubfields(field) {
      return field.subfields.map(sf => `${sf.code}${sf.value || ''}`).join('‡');
    }
  }

  for (const sortFn of sorterFunctions) { // eslint-disable-line functional/no-loop-statements
    const result = sortFn(fieldA, fieldB);
    debugDev(`${sortFn.name}: '${fieldToString(fieldA)}' vs '${fieldToString(fieldB)}' ${result}`);
    if (result !== 0) {
      return result;
    }
  }

  return 0;
}

export function sortByTag(fieldA, fieldB) {

  function getSortIndex(tag) {
    const sortIndex = {
      LDR: '000',
      STA: '001.1', // STA comes now after 001. However 003+001 form a combo, so I'm not sure...
      SID: '999.1',
      LOW: '999.2',
      CAT: '999.3',
      HLI: '999.4'
    };

    if (tag in sortIndex) { // <- this allows weights for numeric values as well (not that we use them yet)
      return sortIndex[tag];
    }
    if (isNaN(tag)) {
      return '999.9';
    }
    return tag;
  }

  const orderA = getSortIndex(fieldA.tag);
  const orderB = getSortIndex(fieldB.tag);

  if (orderA > orderB) {
    return 1;
  }
  if (orderA < orderB) {
    return -1;
  }

  return 0;
}


export function sortAlphabetically(fieldA, fieldB) {
  // These are Aleph specific rules. However, we think that they are ok for all Aleph users, and irrelevant for others.
  const tagToSortingSubfields = {
    'LOW': ['a'],
    'SID': ['b']
  };

  function scoreSubfieldsAlphabetically(setOfSubfields) {
    if (setOfSubfields.length === 0) {
      return 0;
    }
    const [subfieldCode, ...remainingSubfieldCodes] = setOfSubfields;
    const valA = selectFirstValue(fieldA, subfieldCode);
    const valB = selectFirstValue(fieldB, subfieldCode);
    //debugDev(`CHECKING SUBFIELD '${subfieldCode}'`);
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

  if (fieldA.tag === fieldB.tag) {
    if (!(fieldA.tag in tagToSortingSubfields)) {
      return 0;
    }

    const subfieldsToCheck = tagToSortingSubfields[fieldA.tag];

    //debugDev(`CHECKING ${subfieldsToCheck.join(', ')}`);
    const result = scoreSubfieldsAlphabetically(subfieldsToCheck);
    debugDev(`RESULT ${result}`);
    return result;
  }
  return 0;
}

function selectFirstValue(field, subcode) {
  return field.subfields
    .filter(subfield => subcode === subfield.code)
    .map(subfield => subfield.value)
    .slice(0, 1);
}
