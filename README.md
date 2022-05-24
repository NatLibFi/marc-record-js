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

### Validation options

Setting and getting global validation options:

```js
MarcRecord.getValidationOptions();

// Default settings
MarcRecord.setValidationOptions(
  {
    fields: true,          // Do not allow empty fields
    subfields: true,       // Do not allow empty subfields
    subfieldsValues: true, // Do not allow subfields without value
  }
);
```

Local validation options can be given when constructing:

```js
const record = new MarcRecord(
  {
    leader: 'foo',
    fields: []
  },
	{fields: false} // Allow empty fields
);
```

```js
try {
  const record = new MarcRecord({leader: 'foo', fields: []}, {fields: true); // No longer ok
 } catch (err) {
   MarcRecord.setValidationOptions({}); // Reset to default
 }
```

### Mutating the record

**Adding new fields**

Insertion handles the proper field ordering automatically:

```js
record.leader = "00000cam^a22001817i^4500";

// Insert single field:
record.insertField({
  tag: "001",
  value: "007045872"
});
```
You can add multiple fields either by chaining insertions, or
from an Array:

```js
// Insert multiple fields to record:
record
  .insertField({tag: "001", value: "A"})
  .insertField({tag: "002", value: "B"})
  .insertField({tag: "003", value: "C"});

// from Array:
record.insertFields([
  {tag: "001", value: "A"},
  {tag: "002", value: "B"},
  {tag: "003", value: "C"}
]);
```

Appending fields to the end of record:

```js
// Append single field:
record.appendField({
  tag: '245',
  ind2: '1',
  subfields: [
    {
      code: "a"
      value: "The title of the book"
    },
    {
      code: "c",
      value: "Some author"
    }
  ]
});
```

You can append multiple fields by chaining appends, or from an Array:

```js
// Append multiple fields to the end of the record
record
  .appendField({tag: "001", value: "A"})
  .appendField({tag: "002", value: "B"})
  .appendField({tag: "003", value: "C"});

// ...or:
record.appendFields([
  {tag: "001", value: "A"},
  {tag: "002", value: "B"},
  {tag: "003", value: "C"}
]);
```

**Removing fields**

Removing single field:

```js
// Remove single field:
record.removeField({
  tag: "001"
  value: "007045872"
});
```

Removing multiple fields:

```js
// Chain removes:
record
  .removeField({tag: "001", value: "A"})
  .removeField({tag: "002", value: "B"})
  .removeField({tag: "003", value: "C"});

// Remove fields in an Array:
record.removeFields([
  {tag: "001", value: "A"},
  {tag: "002", value: "B"},
  {tag: "003", value: "C"}
]);
```

You can use queries to remove multiple fields:
```js
// Remove all 020 and 021 fields
const fields = record.get(/020|021/u);
record.removeFields(fields)
```

**Popping fields**

Popping fields with queries. Query matches field tag. Matched fields are returned, and removed from record. Once you have modified the fields according to your needs, you can push them back with insert.

```js
// Record tags: [001, 001, 002, 003, 003, 004, 005, 006]

// 1) Query without removing fields:
fields = record.get(/(001|004)/u);

// Result:
// - Field tags: [001, 001, 004]
// - Record tags: [001, 001, 002, 003, 003, 004, 005, 006]

// 2) Pop fields with query:
fields = record.pop(/(001|004)/u);

// Result:
// - Field tags: [001, 001, 004]
// - Record tags: [002, 003, 003, 005, 006]

// 3) Push back modified fields:
record.insertFields(fields)
// Result: Record tags: [001, 001, 002, 003, 003, 004, 005, 006]
```

**Sorting fields**

```js
// Sort fields in record:
record.sortFields();
```

**Chaining**

Sorting, inserting and removing can be chained together:

```js
// Sort fields in record:
record
  .removeField({tag: "001", value: "A"})
  .insertField({tag: "005", value: "A"})
  .sortFields();
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

### Cloning a record
```js
const recordB = MarcRecord.clone(recordA)
```

### Record equality check
```ks
MarcRecord.isEqual(recordA, recordB);
recordA.equalsTo(recordB);
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
