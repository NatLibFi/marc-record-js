export function fieldOrderComparator(fieldA, fieldB) {
  const BIG_BAD_NUMBER = 999.99;
  //const sorterFunctions = [sortByTag, sortByLOW, sortBySID, sortByIndexterms, sortAlphabetically];
  const sorterFunctions = [sortByTag, sortByLOW, sortBySID, sortByIndexterms, preferFenniKeep];

  for (const sortFn of sorterFunctions) { // eslint-disable-line functional/no-loop-statement
    const result = sortFn(fieldA, fieldB);
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

  function sortByLOW(fieldA, fieldB) {
    if (fieldA.tag === 'LOW' && fieldB.tag === 'LOW') {
      const lowA = selectFirstValue(fieldA, 'a');
      const lowB = selectFirstValue(fieldB, 'a');
      if (lowA > lowB) {
        return 1;
      }
      if (lowA < lowB) {
        return -1;
      }
    }
    return 0;
  }

  function sortBySID(fieldA, fieldB) {
    if (fieldA.tag === 'SID' && fieldB.tag === 'SID') {
      const sidA = selectFirstValue(fieldA, 'b');
      const sidB = selectFirstValue(fieldB, 'b');
      if (sidA > sidB) {
        return 1;
      }
      if (sidA < sidB) {
        return -1;
      }
    }
    return 0;
  }

  function sortByIndexterms(fieldA, fieldB) { // eslint-disable-line complexity, max-statements

    const indexTermFields = [
      '600',
      '610',
      '611',
      '630',
      '648',
      '650',
      '651',
      '652',
      '653',
      '654',
      '655',
      '656',
      '657',
      '658',
      '659',
      '662'
    ];

    function scoreInd2(val) {
      const ind2Score = {
        '0': 0,
        '1': 1,
        '2': 2,
        '3': 3,
        '4': 8,
        '5': 5,
        '6': 6,
        '7': 7
      };

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

  function preferFenniKeep(fieldA, fieldB) {
    const fenniKeepSelector = fieldHasSubfield('9', 'FENNI<KEEP>');
    const hasFENNI9A = fenniKeepSelector(fieldA);
    const hasFENNI9B = fenniKeepSelector(fieldB);

    if (hasFENNI9A && !hasFENNI9B) {
      return -1;
    }
    if (!hasFENNI9A && hasFENNI9B) {
      return 1;
    }

    return 0;
  }


  /*
  function sortAlphabetically(fieldA, fieldB) {
    if (fieldA.tag === fieldB.tag) {

      const anySelector = {
        equals: () => true
      };

      const valueA = selectFirstValue(fieldA, anySelector);
      const valueB = selectFirstValue(fieldB, anySelector);

      if (valueA > valueB) {
        return 1;
      }
      if (valueA < valueB) {
        return -1;
      }
    }
    return 0;
  }
  /**/

  //-----------------------------------------------------------------------------


  function fieldHasSubfield(subcode, value) {
    return (field) => field.subfields
      .filter(subfield => subcode === subfield.code)
      .some(subfield => subfield.value === value);
  }


  function selectFirstValue(field, subcode) {
    return field.subfields
      .filter(subfield => subcode === subfield.code)
      .map(subfield => subfield.value)
      .slice(0, 1);
  }
}
