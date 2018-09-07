# MARC record implementation in JavaScript

[![NPM Version](https://img.shields.io/npm/v/@natlibfi/marc-record.svg)](https://npmjs.org/package/@natlibfi/marc-record)
[![Build Status](https://travis-ci.org/NatLibFi/marc-record-js.svg)](https://travis-ci.org/NatLibFi/marc-record-js)
[![Test Coverage](https://codeclimate.com/github/NatLibFi/marc-record-js/badges/coverage.svg)](https://codeclimate.com/github/NatLibFi/marc-record-js/coverage)

MARC record implementation in JavaScript. [A JSON schema](schema.json) file specifies the data format.

This a fork of the original [marc-record-js](https://github.com/petuomin/marc-record-js). The new implementation uses ES6 syntax and adds validation of the record structure.

## Usage
```js
import {MarcRecord} from '@natlibfi/marc-record';
const record = new MarcRecord();
```
### Create record from object
```js
const record = new MarcRecord({leader: 'foo', fields: [
  {tag: '001', value: 'bar'}
]})
```

### Mutating the record
```js
record.leader = "00000cam^a22001817i^4500";

// Insert field to the record. Proper ordering is handled automatically.
record.insertField({
	tag: "001"
	value: "007045872"
});

// Append fields to the end of the record
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
