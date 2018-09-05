/**
*
* @licstart  The following is the entire license notice for the JavaScript code in this file.
*
* Copyright 2014-2017 Pasi Tuominen
* Copyright 2018 University Of Helsinki (The National Library Of Finland)
*
* Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:
*
* The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
*
* THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
*
* @licend  The above is the entire license notice
* for the JavaScript code in this file.
*
*/

/* eslint-disable no-unused-expressions */
import {expect} from 'chai';
import * as Utils from './utils';

describe('utils', () => {
	describe('#clone', () => {
		it('Should clone an object', () => {
			const a = {foo: 'bar'};
			const b = Utils.clone(a);

			expect(JSON.stringify(a)).to.equal(JSON.stringify(b));
			expect(a).to.be.eql(b);
			expect(a).to.not.equal(b);
		});
	});

	describe('#createValidator', () => {
		it('Should create the expected object', () => {
			const Validator = Utils.createValidator();

			expect(Validator).to.be.an('object').that
				.respondsTo('validateRecord')
				.and.respondsTo('validateField');
		});

		describe('#validateRecord', () => {
			it('Should consider the record valid', () => {
				const Validator = Utils.createValidator();
				const record = {
					leader: 'foo',
					fields: []
				};

				expect(Validator.validateRecord(record)).to.be.true;
			});

			it('Should consider the record invalid', () => {
				const Validator = Utils.createValidator();
				const record = {
					leader: 'foo'
				};

				expect(Validator.validateRecord(record)).to.be.false;
			});
		});

		describe('#validateField', () => {
			it('Should consider the field valid', () => {
				const Validator = Utils.createValidator();
				const field = {tag: 'FOO', value: 'BAR'};

				expect(Validator.validateField(field)).to.be.true;
			});

			it('Should consider the field invalid', () => {
				const Validator = Utils.createValidator();
				const field = {tag: 'FOO'};

				expect(Validator.validateField(field)).to.be.false;
			});
		});
	});
});