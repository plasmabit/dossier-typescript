import { describe, expect, it } from 'vitest';

import { Lexer } from '@lexer';
import { Parser } from '@parser';
import { type Dossier } from '@types';
import { Validator } from '@validator';

function parseSource(source: string): Dossier {
	const lexer = new Lexer(source);
	const parser = new Parser(lexer.tokenize());

	return parser.parse();
}

function validateSource(source: string): Dossier {
	const validator = new Validator(parseSource(source));

	return validator.validate();
}

describe('validator', () => {
	describe('valid', () => {
		it('should allow duplicate identifiers under different parents', () => {
			expect(() => {
				validateSource(
					[
						'::',
						"  user: '' ::",
						"    name: 'John'",
						'  ;;',
						"  wallet: '' ::",
						"    name: 'USD'",
						'  ;;',
						';;',
					].join('\n'),
				);
			}).not.toThrow();
		});
	});

	describe('invalid', () => {
		it('should throw for duplicate identifiers under the root dossier', () => {
			expect(() => {
				validateSource(
					[
						'::',
						"  hi: ''",
						"  hi: ''",
						';;',
					].join('\n'),
				);
			}).toThrow('Duplicate identifier "hi" under (root)');
		});

		it('should throw for duplicate identifiers under a nested dossier', () => {
			expect(() => {
				validateSource(
					[
						'::',
						'  person ::',
						"    name: 'John'",
						"    name: 'Jane'",
						'  ;;',
						';;',
					].join('\n'),
				);
			}).toThrow('Duplicate identifier "name" under person');
		});

		it('should throw for duplicate identifiers inside dossier items in arrays', () => {
			expect(() => {
				validateSource(
					[
						'::',
						'  items: [',
						'    ::',
						"      name: 'one'",
						"      name: 'two'",
						'    ;;,',
						'  ]',
						';;',
					].join('\n'),
				);
			}).toThrow('Duplicate identifier "name" under items[0]');
		});
	});
});
