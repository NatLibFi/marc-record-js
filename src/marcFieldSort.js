import createDebugLogger from 'debug';
import {fieldToString} from './utils';

const debug = createDebugLogger('@natlibfi/marc-record:marcFieldSort');
//const debugData = debug.extend('data');
const debugDev = debug.extend('dev');

const relatorTermScore = { // Here bigger is better
  // We should 1) check the order of these, and 2) add translations (support Swedish at the very least)
  'säveltäjä': 100,
  'kirjoittaja': 99,
  'sarjakuvantekijä': 99,
  'sanoittaja': 90,
  'käsikirjoittaja': 90,
  'toimittaja': 85,
  'kuvittaja': 84,
  'sovittaja': 80,
  'kääntäjä': 80,
  'editointi': 70, // for music, toimittjaja is another thins
  'esittäjä': 60,
  'johtaja': 50 // orkesterinjohtaja
};

export function fieldOrderComparator(fieldA, fieldB) {
  const BIG_BAD_NUMBER = 999.99;

  const sorterFunctions = [sortByTag, sortByIndexTerms, sortAlphabetically, sortByRelatorTerm, sortByOccurrenceNumber, preferFenniKeep];

  for (const sortFn of sorterFunctions) { // eslint-disable-line functional/no-loop-statements
    const result = sortFn(fieldA, fieldB);
    debugDev(`${sortFn.name}: '${fieldToString(fieldA)}' vs '${fieldToString(fieldB)}' ${result}`);
    if (result !== 0) {
      return result;
    }
  }

  return 0;

  function sortByTag(fieldA, fieldB) {

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

  function sortByIndexTerms(fieldA, fieldB) { // eslint-disable-line complexity, max-statements

    const indexTermFields = ['600', '610', '611', '630', '648', '650', '651', '652', '653', '654', '655', '656', '657', '658', '659', '662'];

    function scoreInd2(val) {
      const ind2Score = {'0': 0, '1': 1, '2': 2, '3': 3, '4': 8, '5': 5, '6': 6, '7': 7};

      if (val in ind2Score) {
        return ind2Score[val];
      }
      return 9;
    }

    // ATM this is not needed.
    // You may need this, if you change compare function order in sorterFunctions
    // istanbul ignore next
    if (fieldA.tag !== fieldB.tag) {
      return 0;
    }

    if (!indexTermFields.includes(fieldA.tag)) {
      return 0;
    }

    /* Puts ind2=4 last */
    if (scoreInd2(fieldA.ind2) > scoreInd2(fieldB.ind2)) {
      return 1;
    }
    if (scoreInd2(fieldA.ind2) < scoreInd2(fieldB.ind2)) {
      return -1;
    }

    function scoreDictionary(dictionary) {
      const dictionarySortIndex = {
        'yso/fin': 0,
        'yso/swe': 1,
        'yso/eng': 2,
        'slm/fin': 0.1,
        'slm/swe': 1.1,
        'kauno/fin': 2.1,
        'kauno/swe': 2.2,
        'kaunokki': 4,
        'bella': 5
      };

      if (dictionary in dictionarySortIndex) {
        return dictionarySortIndex[dictionary];
      }
      return BIG_BAD_NUMBER;
    }

    const dictionaryA = selectFirstValue(fieldA, '2');
    const dictionaryB = selectFirstValue(fieldB, '2');

    const dictScoreA = scoreDictionary(dictionaryA);
    const dictScoreB = scoreDictionary(dictionaryB);
    // Use priority order for listed dictionaries:
    if (dictScoreA > dictScoreB) {
      return 1;
    }
    if (dictScoreA < dictScoreB) {
      return -1;
    }
    // Unlisted dictionaries: sort $2 value alphabetically:
    //if (dictScoreA === BIG_BAD_NUMBER) {
    if (dictionaryA > dictionaryB) {
      return 1;
    }
    if (dictionaryA < dictionaryB) {
      return -1;
    }
    //}
    return 0;
  }

  function preferKeep(fieldA, fieldB, keepOwner = 'FENNI') {
    const keepSelector = fieldHasSubfield('9', `${keepOwner}<KEEP>`);
    const hasKeepA = keepSelector(fieldA);
    const hasKeepB = keepSelector(fieldB);

    if (hasKeepA && !hasKeepB) {
      return -1;
    }
    if (!hasKeepA && hasKeepB) {
      return 1;
    }

    return 0;
  }

  function preferFenniKeep(fieldA, fieldB) {
    const fenniPreference = preferKeep(fieldA, fieldB, 'FENNI');
    if (fenniPreference !== 0) {
      return fenniPreference;
    }
    const violaPreference = preferKeep(fieldA, fieldB, 'VIOLA');
    if (violaPreference !== 0) {
      return violaPreference;
    }
    return preferKeep(fieldA, fieldB, 'FIKKA');
  }

  function sortByRelatorTerm(fieldA, fieldB) {
    // Should this be done to 6XX and 8XX fields as well? Does $t affect sorting?
    if (!['700', '710', '711', '730'].includes(fieldA.tag)) {
      return 0;
    }

    function scoreRelatorTerm(value) {
      const normValue = value.replace(/[.,]+$/u, '');
      if (normValue in relatorTermScore) {
        return relatorTermScore[normValue];
      }
      return 0;
    }

    function fieldGetMaxRelatorTermScore(field) {
      if (!field.subfields) {
        return 0;
      }
      const e = field.subfields.filter(sf => sf.code === 'e');
      const scores = e.map(sf => scoreRelatorTerm(sf.value));
      debugDev(`RELATOR SCORE FOR '${fieldToString(field)}': ${scores.join(', ')}`);
      return Math.max(...scores);
    }

    const scoreA = fieldGetMaxRelatorTermScore(fieldA);
    const scoreB = fieldGetMaxRelatorTermScore(fieldB);

    if (scoreA < scoreB) {
      return 1;
    }
    if (scoreA > scoreB) {
      return -1;
    }
    return 0;
  }

  function sortByOccurrenceNumber(fieldA, fieldB) {
    // Must of this is copypasted from marc-record-validators-melinda src/subfield6Utils.js
    function isValidSubfield6(subfield) {
      const sf6Regexp = /^[0-9][0-9][0-9]-(?:[0-9][0-9]|[1-9][0-9]+)(?:[^0-9].*)?$/u;
      if (subfield.code !== '6') {
        return false;
      }
      return subfield.value.match(sf6Regexp);
    }

    function subfield6GetOccurrenceNumber(subfield) {
      if (isValidSubfield6(subfield)) {
        // Skip "TAG-" prefix. 2023-02-20: removed 2-digit requirement from here...
        return subfield.value.substring(4).replace(/\D.*$/u, '');
      }
      return undefined;
    }

    function fieldGetOccurrenceNumber(field) {
      if (!field.subfields) {
        return 0;
      }
      const subfield6 = field.subfields.find(sf => isValidSubfield6(sf));
      if (subfield6 === undefined) {
        return 0;
      }
      return parseInt(subfield6GetOccurrenceNumber(subfield6), 10);
    }

    if (fieldA.tag !== '880') {
      return 0;
    }
    const scoreA = fieldGetOccurrenceNumber(fieldA);
    const scoreB = fieldGetOccurrenceNumber(fieldB);

    debugDev(`A: '${fieldToString(fieldA)}: ${scoreA}`);
    debugDev(`B: '${fieldToString(fieldB)}: ${scoreB}`);

    if (scoreA === scoreB) {
      return 0;
    }
    if (scoreB === 0) {
      return -1;
    }
    if (scoreA === 0) {
      return 1;
    }
    if (scoreA > scoreB) { // smaller is better
      return 1;
    }
    return -1;
  }

  function sortAlphabetically(fieldA, fieldB) {
    const tagToSortingSubfields = {
      // '028': ['b', 'a']?
      'LOW': ['a'],
      'SID': ['c']
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

  //-----------------------------------------------------------------------------


  function fieldHasSubfield(subcode, value) {
    return (field) => field.subfields && field.subfields
      .some(subfield => subcode === subfield.code && subfield.value === value);
  }

  function selectFirstValue(field, subcode) {
    return field.subfields
      .filter(subfield => subcode === subfield.code)
      .map(subfield => subfield.value)
      .slice(0, 1);
  }
}
