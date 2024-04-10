# MARC record implementation in JavaScript

[![NPM Version](https://img.shields.io/npm/v/@natlibfi/marc-record.svg)](https://npmjs.org/package/@natlibfi/marc-record)
[![Build Status](https://travis-ci.org/NatLibFi/marc-record-js.svg)](https://travis-ci.org/NatLibFi/marc-record-js)
[![Test Coverage](https://codeclimate.com/github/NatLibFi/marc-record-js/badges/coverage.svg)](https://codeclimate.com/github/NatLibFi/marc-record-js/coverage)

MARC record implementation in JavaScript. [A JSON schema](src/schema.js) file specifies the data format.

This a fork of the original [marc-record-js](https://github.com/petuomin/marc-record-js). The new implementation uses ES6 syntax and adds validation of the record structure.

## Usage
```js
import {MarcRecord} from '@natlibfi/marc-record';
const record = new MarcRecord();
```
### Create record from object
```js
const record = new MarcRecord(
  {
    leader: '02848ccm a22005894i 4500',
',
    fields: [
      {tag: '001', value: 'foo'},
      {tag: '002', value: 'bar'},
    ]
  }
)
```

### Cloning a record
```js
const recordB = MarcRecord.clone(recordA)
```

### Record validation

When constructing or modifying the record, validation checks are run. You may need to alter these checks to work with incomplete intermediate records.

**strict**

validationOption `strict: true` sets all the other validationOptions as true regardless of if they are defined
validationOption `strict: false` sets other validationOptions as they are defined or as default

**Global validation options:**

```js
MarcRecord.getValidationOptions();

// Default settings
// These default validationOptions are (mostly) backwards compatible with marc-record-js < 7.3.0

MarcRecord.setValidationOptions(
  {
    fields: true,                  // Do not allow record without fields
    subfields: true,               // Do not allow empty subfields
    subfieldValues: true,          // Do not allow subfields without value
    controlFieldValues: true,      // Do not allow controlFields without value
    leader: false,                 // Do not allow record without leader, with empty leader or with leader with length != 24
    characters: false,             // Do not allow erronous characters in tags, indicators and subfield codes
    noControlCharacters: false,    // Do not allow ASCII control characters in field/subfield values
    noAdditionalProperties: false, // Do not allow additional properties in fields

    strict: false                  // If true, set all validationOptions to true
  }
);
```

You can reset global validation options to default with empty object:

```js
// Reset to default
MarcRecord.setValidationOptions({});
```

You can set all global validation options to true with validationOption strict: true:

```js
// Set all validationOptions to true with strict: true
MarcRecord.setValidationOptions({strict: true});
```


**Record specific validation options** can be given when constructing:

```js
const record = new MarcRecord(
  {
    leader: '02848ccm a22005894i 4500',
    fields: []
  },
  {fields: false} // Allow empty fields
);
```

**Validation examples:**

The following examples demonstrate the invalid records, when default validation options are used. To fix the errors, either fix the record, or modify global/record-specific validation options.

```js
// Error: fields[] is empty. Validation option: fields
new MarcRecord(
  {
    leader: '02848ccm a22005894i 4500',
    fields: []
  }
);

// Error: subfields[] is empty. Validation option: subfields
new MarcRecord(
  {
    leader: '02848ccm a22005894i 4500',
    fields: [
      {tag: "509", , ind1: " ", ind2: " ", subfields: []}
    ]
  }
);

// Error: subfield has no value. Validation option: subfieldValues
new MarcRecord(
  {
    leader: '02848ccm a22005894i 4500',
    fields: [
      {tag: "509", ind1: " ", ind2: " ", subfields: [{code: "a", value: ""}]}
    ]
  }
);
```

### Record equality check
```ks
MarcRecord.isEqual(recordA, recordB);
recordA.equalsTo(recordB);
```

### Querying for fields

**get()** returns fields which tags match the specified pattern:

```js
record.get("776")         // Return fields with tag 776
record.get(/020|021/u)    // Return fields matching the regexp
```

**getControlfields()** returns so called control fields, that is, fields
with simple value. These are generally fields 001 - 008.

```js
record.getControlfields();  // Return all control fields
```

**getDatafields()** returns fields with subfields.

```js
record.getDatafields();     // Return all data fields
```

**getFields()** fetches fields from record.

To get all 245 fields:

```js
record.getFields('245');
```

To get all 001 fields which values is foo:

```js
record.getFields('001', 'foo');
```

To get all 245 fields, which have specific subfields. All subfields given as argument should be present in the fetched fields:

```js
// Fetch all 245 fields containing subfields a and b with specified values
record.getFields('245', [{code: 'a', value: 'foo'}, {code: 'b', value: 'bar'}]);
```

**containsFieldWithValue()** uses the same arguments than getFields(). It is
a shorthand to check, if getFields() returns more than an empty list.

```js
record.containsFieldWithValues('001', 'foo'); // getFields('001', 'foo').length > 0
record.containsFieldWithValues('245', [{code: 'a', value: 'foo'}]);
```

**Custom queries:** You can access record fields to implement your custom
queries.

```js
record.fields;    // Access to record fields
```

### Adding fields

**insertField / insertFields:** Insertion handles the proper field ordering automatically.

```js
// Insert single field
record.insertField({tag: "001", value: "foo"});

// Chained inserts
record
  .insertField({tag: "001", value: "A"})
  .insertField({tag: "003", value: "C"})
  .insertField({tag: "002", value: "B"});

// Insert from array:
record.insertFields([
  {tag: "001", value: "A"},
  {tag: "003", value: "C"},
  {tag: "002", value: "B"}
]);
```

**appendField / appendFields:** Appending fields to the end of record. In general, you
close always use insert instead of append.

```js
// Append single field:
record.appendField({tag: "001", value: "foo"});

// Chained appending
record
  .appendField({tag: "001", value: "A"})
  .appendField({tag: "003", value: "C"})
  .appendField({tag: "002", value: "B"});

// Append from array
record.appendFields([
  {tag: "001", value: "A"},
  {tag: "003", value: "C"},
  {tag: "002", value: "B"}
]);

```

### Removing fields

Removing a field **ONLY** removes fields that are in the record. It
**DOES NOT** compare the field content to find field.

So, always use queries to remove fields:
```js
// Remove all 020 and 021 fields
const fields = record.get(/020|021/u);	// Returns an array
record.removeFields(fields); // Removes fields in array of matching fields
```

Failing examples:

```js
// Example record
const record = new MarcRecord(
{
  leader: "02848ccm a22005894i 4500",
  fields: [
    {tag: "001", value: "bar"}
  ]
})

// FAIL: Even if fields have same values, they are different fields
record.removeField({tag: "001", value: "bar"})

// FAIL: removeField accepts fields, not strings
record.removeField("001")     // FAIL: removeField does not perform query
record.removeField(/^001$/u)  // FAIL: removeField does not perform query

// FAIL: insertField (may) insert copy of a parameter field
const field = {tag: "300", subfields: [{code: "a", value: "b"}]}
record
  .insertField(field)
  .removeField(field);

// "Direct query"
const field = record.fields[2];
record.removeField({...field})  // Obvious FAIL
record.removeField(field) // OK
```

### Popping fields

Popping fields with queries. Query matches field tag. Matched fields are returned, and removed from record. Once you have modified the fields according to your needs, you can push them back with insert.

```js
// Record tags: [001, 001, 002, 003, 003, 004, 005, 006]

// 1) Pop fields with query:
fields = record.pop(/(001|004)/u);

// Result:
// - Field tags: [001, 001, 004]
// - Record tags: [002, 003, 003, 005, 006]

// 2) Do something with fields
...

// 3) Push back modified fields:
record.insertFields(fields)
// Result: Record tags: [001, 001, 002, 003, 003, 004, 005, 006]
```

### Type of Material detection

Type of material (BK/Book, CF/Computer File, CR/Continuing Resource, MP/Map, MU/Music, MX/Mixed Material, VM/Visual Material) of a given record can be queried in two ways:

```js
// 1) Ask if record belong to a certain type
if (record.isBK()) {
  // Do something
}

// 2) Ask for record type:
if (record.getTypeOfMaterial() === 'MU') { // NB! Failure returns false
  // Do something else
}
```

## Sorting fields

```js
record.sortFields();
```

## Chaining

Sorting, inserting and removing can be chained together:

```js
record
  .removeFields(record.get(/005/u))       // Remove all 005 fields
  .insertField({tag: "005", value: "A"})  // Insert new 005 field
  .sortFields();                          // Sort fields

// Note: In this case, there is no need for sort, as insert puts the field to
// correct place. It is there just as an example.
```



## See also
To serialize and unserialize MARC records, see [marc-record-serializers](https://github.com/natlibfi/marc-record-serializers)


## License and copyright

Copyright (c) 2014-2017 **Pasi Tuominen <pasi.tuominen@gmail.com>**

Copyright (c) 2018-2024 **University Of Helsinki (The National Library Of Finland)**

This project's source code is licensed under the terms of **MIT License** or any later version.
