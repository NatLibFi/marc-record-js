import generatedTests from '@natlibfi/fixugen';
import {Readers} from '@natlibfi/fixura';
import {expect} from 'chai';
import createDebugLogger from 'debug';

/*
describe('#sortFields', () => {
  it('should sort shuffled fields to correct order', () => {
    const rec = new MarcRecord();

    rec.appendFields([
      {tag: 'CAT', ind1: ' ', ind2: ' ', subfields: [{code: 'a', value: 'b'}]},
      {tag: 'SID', ind1: ' ', ind2: ' ', subfields: [{code: 'a', value: 'b'}]},
      {tag: 'LDR', value: '0'},
      {tag: '900', ind1: ' ', ind2: ' ', subfields: [{code: 'a', value: 'b'}]},
      {tag: '003', value: '0'},
      {tag: 'STA', ind1: ' ', ind2: ' ', subfields: [{code: 'a', value: 'b'}]},
      {tag: '080', ind1: ' ', ind2: ' ', subfields: [{code: 'a', value: 'b'}]},
      {tag: 'LOW', ind1: ' ', ind2: ' ', subfields: [{code: 'a', value: 'b'}]},
      {tag: '100', ind1: ' ', ind2: ' ', subfields: [{code: 'a', value: 'b'}]}
    ]);
    expect(rec.fields.map(f => f.tag).join()).to.equal(['CAT', 'SID', 'LDR', '900', '003', 'STA', '080', 'LOW', '100'].join());

    rec.sortFields();
    expect(rec.fields.map(f => f.tag).join()).to.equal(['LDR', '003', '080', 'STA', '100', 'SID', 'CAT', 'LOW', '900'].join());
  });
});
*/
