import {expect} from 'chai';
import createSchema from './schema';

describe('schema', () => {
  it('Create a schema', () => {
    const schema = createSchema({});
    expect(schema).to.be.an('object');
  });

  it('Create a schema with options', () => {
    const schema = createSchema({fields: false, subfields: false, subfieldValues: false});
    expect(schema).to.be.an('object');
    expect(schema.properties.fields.minItems).to.equal(0);
    expect(schema.properties.fields.items.anyOf[1].properties.subfields.minItems).to.equal(0);
    expect(schema.properties.fields.items.anyOf[1].properties.subfields.items.required).to.eql(['code']);
  });
});
