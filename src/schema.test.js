import {describe, it} from 'node:test';
import assert from 'node:assert';
import createSchema from './schema.js';

describe('schema', () => {
  it('Create a schema', () => {
    const schema = createSchema({});
    assert.equal(typeof schema, 'object');
  });

  it('Create a schema with options', () => {
    const schema = createSchema({fields: false, subfields: false, subfieldValues: false});
    assert.equal(typeof schema, 'object');
    assert.equal(schema.properties.fields.minItems, 0);
    assert.equal(schema.properties.fields.items.anyOf[1].properties.subfields.minItems, 0);
    assert.deepStrictEqual(schema.properties.fields.items.anyOf[1].properties.subfields.items.required, ['code']);
  });
});
