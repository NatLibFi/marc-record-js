/* eslint-disable no-unused-vars */

export function fieldOrderComparator(fieldA, fieldB) {

  //const sorterFunctions = [sortByTag, sortByLOW, sortBySID, sortByIndexterms, sortAlphabetically];
  const sorterFunctions = [sortByTag, sortByLOW, sortBySID, sortByIndexterms];

  for (const sortFn of sorterFunctions) { // eslint-disable-line functional/no-loop-statement
    const result = sortFn(fieldA, fieldB);
    if (result !== 0) {
      return result;
    }
  }

  return 0;

  function getSortIndex(tag) {
    const sortIndex = {
      LDR: '000',
      STA: '099.1',
      SID: '899.1',
      CAT: '899.2',
      LOW: '899.3',
      HLI: '899.4'
    };

    if (isNaN(tag)) {
      return sortIndex[tag] || '9999';
    }
    return tag;
  }

  function sortByTag(fieldA, fieldB) {
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
    const dictionarySortIndex = {
      'yso/fin': '0',
      'yso/swe': '1',
      'yso/eng': '2',
      'kaunokki': '3',
      'bella': '4'
    };

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

    if (fieldA.tag === fieldB.tag && indexTermFields.includes(fieldA.tag)) {
      if (fieldA.ind2 > fieldB.ind2) {
        return 1;
      }
      if (fieldA.ind2 < fieldB.ind2) {
        return -1;
      }

      const dictionaryA = selectFirstValue(fieldA, '2');
      const dictionaryB = selectFirstValue(fieldB, '2');

      const orderByDictionaryA = dictionarySortIndex[dictionaryA] || dictionaryA;
      const orderByDictionaryB = dictionarySortIndex[dictionaryB] || dictionaryB;

      if (orderByDictionaryA > orderByDictionaryB) {
        return 1;
      }
      if (orderByDictionaryA < orderByDictionaryB) {
        return -1;
      }

      const fenniKeepSelector = fieldHasSubfield('9', 'FENNI<KEEP>');
      const fenniDropSelector = fieldHasSubfield('9', 'FENNI<DROP>');
      const hasFENNI9A = fenniKeepSelector(fieldA) || fenniDropSelector(fieldA);
      const hasFENNI9B = fenniKeepSelector(fieldB) || fenniDropSelector(fieldA);

      if (hasFENNI9A && !hasFENNI9B) {
        return -1;
      }
      if (!hasFENNI9A && hasFENNI9B) {
        return 1;
      }

      const valueA = selectFirstValue(fieldA, 'a');
      const valueB = selectFirstValue(fieldB, 'a');

      if (valueA > valueB) {
        return 1;
      }
      if (valueA < valueB) {
        return -1;
      }

      const valueAX = selectFirstValue(fieldA, 'x');
      const valueBX = selectFirstValue(fieldB, 'x');

      if (valueAX > valueBX) {
        return 1;
      }
      if (valueAX < valueBX) {
        return -1;
      }

      const valueAZ = selectFirstValue(fieldA, 'z');
      const valueBZ = selectFirstValue(fieldB, 'z');

      if (valueAZ > valueBZ) {
        return 1;
      }
      if (valueAZ < valueBZ) {
        return -1;
      }

      const valueAY = selectFirstValue(fieldA, 'y');
      const valueBY = selectFirstValue(fieldB, 'y');
      if (valueAY > valueBY) {
        return 1;
      }
      if (valueAY < valueBY) {
        return -1;
      }

    }
    return 0;
  }


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

  //-----------------------------------------------------------------------------

  function fieldHasSubfield(code, value) {
    const querySubfield = {code, value};

    return function (field) {
      return field.subfields.some(subfield => subfield === querySubfield);
    };
  }

  function selectFirstValue(field, subcode) {
    if (field.subfields) {
      return field.subfields
        .filter(subfield => subcode.equals ? subcode.equals(subfield.code) : subcode === subfield.code)
        .map(subfield => subfield.value)
        .slice(1);
    }
    return field.value;
  }
}
