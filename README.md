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
    leader: 'foo',
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

### Record equality check
```ks
MarcRecord.isEqual(recordA, recordB);
recordA.equalsTo(recordB);
```

### Validation options

Setting and getting global validation options:

```js
MarcRecord.getValidationOptions();

// Default settings
MarcRecord.setValidationOptions(
  {
    fields: true,          // Do not allow record without fields
    subfields: true,       // Do not allow empty subfields
    subfieldsValues: true, // Do not allow subfields without value
  }
);

// Reset to default
MarcRecord.setValidationOptions({});
```

Record specific validation options can be given when constructing:

```js
const record = new MarcRecord(
  {
    leader: 'foo',
    fields: []
  },
  {fields: false} // Allow empty fields
);
```

Validation examples:

```js
// Error: fields[] is empty
new MarcRecord(
  {
    leader: 'foo',
    fields: []
  }
);

// Error: subfields[] is empty
new MarcRecord(
  {
    leader: 'foo',
    fields: [
      {tag: "021", subfields: []}
    ]
  }
);

// Error: subfield has no value
new MarcRecord(
  {
    leader: 'foo',
    fields: [
      {tag: "021", subfields: [{code: "a", value: ""}]}
    ]
  }
);
```

### Querying for fields
```js
record.getControlfields();
record.getDatafields();
record.get(/^001$/)
record.fields;
record.getFields('245', [{code: 'a', value: 'foo'}]);
record.getFields('001', 'foo');
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
  leader: "foo",
  fields: [
    {tag: "001", value: "bar"}
  ]
})

// FAIL: Even if fields have same values, they are different fields
record.removeField({tag: "001", value: "bar"})

// FAIL: Insert may insert copy of a parameter field
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

## Sorting fields

```js
record.sortFields();
```

## Chaining

Sorting, inserting and removing can be chained together:

```js
record
  .removeField(record.get(/005/u))        // Remove all 005 fields
  .insertField({tag: "005", value: "A"})  // Insert new 005 field
  .sortFields();                          // Sort fields

// Note: In this case, there is no need for sort, as insert puts the field to
// correct place. It is there just as an example.
```

### Simple assertions
```js
record.containsFieldWithValue('245', [{code: 'a', value: 'foo'}]);
record.containsFieldWithValue('001', 'foo');
```

## See also
To serialize and unserialize MARC records, see [marc-record-serializers](https://github.com/natlibfi/marc-record-serializers)


## License and copyright

Copyright (c) 2014-2017 **Pasi Tuominen <pasi.tuominen@gmail.com>**

Copyright (c) 2018 **University Of Helsinki (The National Library Of Finland)**

This project's source code is licensed under the terms of **MIT License** or any later version.
