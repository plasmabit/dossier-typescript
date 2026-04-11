import { describe, expect, it } from 'vitest';

import { Lexer } from '@lexer';
import { TokenType } from '@types';
import { readFileSync } from 'node:fs';
import path from 'node:path';

type FixtureKind = 'valid' | 'invalid';

function readFixture(kind: FixtureKind, fileName: string): string {
	return readFileSync(path.join(__dirname, '..', 'data', kind, fileName), 'utf8').replace(
		/\r\n/g,
		'\n',
	);
}

function simplifyTokens(tokens: { type: TokenType; lexeme?: string }[]) {
	return tokens.map(token => [token.type, token.lexeme]);
}

describe('lexer', () => {
	describe('valid', () => {
		it('should tokenize identifiers with digits after the first letter', () => {
			const lexer = new Lexer('h1: "title"\nversion2: 3');
			const tokens = lexer.tokenize();

			expect(simplifyTokens(tokens)).toEqual([
				[TokenType.Word, 'h1'],
				[TokenType.Colon, ':'],
				[TokenType.String, 'title'],
				[TokenType.Word, 'version2'],
				[TokenType.Colon, ':'],
				[TokenType.Number, '3'],
				[TokenType.EOF, undefined],
			]);
		});
		it('should ignore delimited comments', () => {
			const source = [
				'## top comment ##',
				'count: -3 ## inline comment ##',
				'##',
				'multiline',
				'comment',
				'##',
				'value: "ok"',
			].join('\n');

			const lexer = new Lexer(source);
			const tokens = lexer.tokenize();

			expect(simplifyTokens(tokens)).toEqual([
				[TokenType.Word, 'count'],
				[TokenType.Colon, ':'],
				[TokenType.Minus, '-'],
				[TokenType.Number, '3'],
				[TokenType.Word, 'value'],
				[TokenType.Colon, ':'],
				[TokenType.String, 'ok'],
				[TokenType.EOF, undefined],
			]);
		});
		it('should tokenize warehouse-location.ds', () => {
			const source = readFixture('valid', 'warehouse-location.ds');

			const lexer = new Lexer(source);
			const tokens = lexer.tokenize();

			expect(tokens).toEqual([
				{ type: TokenType.Word, lexeme: 'warehouse', line: 1, column: 1, offset: 0 },
				{ type: TokenType.Colon, lexeme: ':', line: 1, column: 10, offset: 9 },
				{ type: TokenType.Number, lexeme: '10573', line: 1, column: 12, offset: 11 },
				{ type: TokenType.StartDossier, lexeme: '::', line: 1, column: 18, offset: 17 },
				{ type: TokenType.Word, lexeme: 'location', line: 2, column: 2, offset: 21 },
				{ type: TokenType.StartDossier, lexeme: '::', line: 2, column: 11, offset: 30 },
				{ type: TokenType.Word, lexeme: 'x', line: 3, column: 3, offset: 35 },
				{ type: TokenType.Colon, lexeme: ':', line: 3, column: 4, offset: 36 },
				{ type: TokenType.StartParenthesis, lexeme: '(', line: 3, column: 6, offset: 38 },
				{ type: TokenType.Number, lexeme: '25.54325', line: 3, column: 7, offset: 39 },
				{ type: TokenType.EndParenthesis, lexeme: ')', line: 3, column: 15, offset: 47 },
				{ type: TokenType.Word, lexeme: 'y', line: 4, column: 3, offset: 51 },
				{ type: TokenType.Colon, lexeme: ':', line: 4, column: 4, offset: 52 },
				{ type: TokenType.StartParenthesis, lexeme: '(', line: 4, column: 6, offset: 54 },
				{ type: TokenType.Number, lexeme: '75.34266', line: 4, column: 7, offset: 55 },
				{ type: TokenType.EndParenthesis, lexeme: ')', line: 4, column: 15, offset: 63 },
				{ type: TokenType.EndDossier, lexeme: ';;', line: 5, column: 2, offset: 66 },
				{ type: TokenType.EndDossier, lexeme: ';;', line: 6, column: 1, offset: 69 },
				{ type: TokenType.EOF, lexeme: undefined, line: 7, column: 1, offset: 72 },
			]);
		});
		it('should tokenize wallet-nested.ds', () => {
			const source = readFixture('valid', 'wallet-nested.ds');

			const lexer = new Lexer(source);
			const tokens = lexer.tokenize();

			expect(tokens).toEqual([
				{ type: TokenType.Word, lexeme: 'wallet', line: 1, column: 1, offset: 0 },
				{ type: TokenType.Colon, lexeme: ':', line: 1, column: 7, offset: 6 },
				{ type: TokenType.StartBracket, lexeme: '[', line: 1, column: 9, offset: 8 },
				{ type: TokenType.Word, lexeme: 'text', line: 2, column: 2, offset: 11 },
				{ type: TokenType.StartDossier, lexeme: '::', line: 2, column: 7, offset: 16 },
				{ type: TokenType.Word, lexeme: 'text', line: 3, column: 3, offset: 21 },
				{ type: TokenType.Colon, lexeme: ':', line: 3, column: 7, offset: 25 },
				{ type: TokenType.String, lexeme: 'text', line: 3, column: 9, offset: 27 },
				{ type: TokenType.EndDossier, lexeme: ';;', line: 4, column: 2, offset: 35 },
				{ type: TokenType.Comma, lexeme: ',', line: 4, column: 4, offset: 37 },
				{ type: TokenType.EndBracket, lexeme: ']', line: 5, column: 1, offset: 39 },
				{ type: TokenType.StartDossier, lexeme: '::', line: 5, column: 3, offset: 41 },
				{ type: TokenType.Word, lexeme: 'currency', line: 6, column: 2, offset: 45 },
				{ type: TokenType.Colon, lexeme: ':', line: 6, column: 10, offset: 53 },
				{ type: TokenType.String, lexeme: 'USD', line: 6, column: 12, offset: 55 },
				{ type: TokenType.Word, lexeme: 'value', line: 7, column: 2, offset: 62 },
				{ type: TokenType.Colon, lexeme: ':', line: 7, column: 7, offset: 67 },
				{ type: TokenType.Number, lexeme: '294.12', line: 7, column: 9, offset: 69 },
				{ type: TokenType.EndDossier, lexeme: ';;', line: 8, column: 1, offset: 76 },
				{ type: TokenType.EOF, lexeme: undefined, line: 9, column: 1, offset: 79 },
			]);
		});
		it('should tokenize course.ds', () => {
			const source = readFixture('valid', 'course.ds');

			const lexer = new Lexer(source);
			const tokens = lexer.tokenize();

			expect(simplifyTokens(tokens)).toEqual([
				[TokenType.Word, 'type'],
				[TokenType.Colon, ':'],
				[TokenType.String, 'album'],
				[TokenType.StartDossier, '::'],
				[TokenType.Word, 'name'],
				[TokenType.Colon, ':'],
				[TokenType.String, 'FreeCodeCamp Responsive Web Design Certification'],
				[TokenType.Word, 'source'],
				[TokenType.Colon, ':'],
				[TokenType.String, 'web-course'],
				[TokenType.StartDossier, '::'],
				[TokenType.Word, 'url'],
				[TokenType.Colon, ':'],
				[TokenType.String, 'https://www.freecodecamp.org/learn/responsive-web-design-v9/'],
				[TokenType.Word, 'describe'],
				[TokenType.Colon, ':'],
				[TokenType.String, 'HTML'],
				[TokenType.StartDossier, '::'],
				[TokenType.Word, 'describe'],
				[TokenType.Colon, ':'],
				[TokenType.String, 'Basic HTML'],
				[TokenType.StartDossier, '::'],
				[TokenType.Word, 'describe'],
				[TokenType.Colon, ':'],
				[TokenType.String, 'Understanding HTML attributes'],
				[TokenType.StartDossier, '::'],
				[TokenType.Word, 'collection'],
				[TokenType.Colon, ':'],
				[TokenType.String, 'What Role Does HTML Play on the Web'],
				[TokenType.StartDossier, '::'],
				[TokenType.Word, 'related'],
				[TokenType.Colon, ':'],
				[TokenType.StartBracket, '['],
				[
					TokenType.String,
					'https://www.freecodecamp.org/learn/responsive-web-design-v9/lecture-understanding-html-attributes/what-is-html',
				],
				[TokenType.Comma, ','],
				[TokenType.EndBracket, ']'],
				[TokenType.Word, 'concerns'],
				[TokenType.Colon, ':'],
				[TokenType.StartBracket, '['],
				[TokenType.StartDossier, '::'],
				[TokenType.Word, 'name'],
				[TokenType.Colon, ':'],
				[TokenType.String, 'HTML'],
				[TokenType.Word, 'index'],
				[TokenType.Colon, ':'],
				[TokenType.Number, '1'],
				[TokenType.EndDossier, ';;'],
				[TokenType.Comma, ','],
				[TokenType.StartDossier, '::'],
				[TokenType.Word, 'name'],
				[TokenType.Colon, ':'],
				[TokenType.String, 'HTML element'],
				[TokenType.Word, 'index'],
				[TokenType.Colon, ':'],
				[TokenType.Number, '2'],
				[TokenType.EndDossier, ';;'],
				[TokenType.Comma, ','],
				[TokenType.StartDossier, '::'],
				[TokenType.Word, 'name'],
				[TokenType.Colon, ':'],
				[TokenType.String, 'HTML content'],
				[TokenType.Word, 'index'],
				[TokenType.Colon, ':'],
				[TokenType.Number, '2'],
				[TokenType.EndDossier, ';;'],
				[TokenType.Comma, ','],
				[TokenType.StartDossier, '::'],
				[TokenType.Word, 'name'],
				[TokenType.Colon, ':'],
				[TokenType.String, 'HTML tag'],
				[TokenType.Word, 'index'],
				[TokenType.Colon, ':'],
				[TokenType.Number, '2'],
				[TokenType.EndDossier, ';;'],
				[TokenType.Comma, ','],
				[TokenType.StartDossier, '::'],
				[TokenType.Word, 'name'],
				[TokenType.Colon, ':'],
				[TokenType.String, 'HTML void element'],
				[TokenType.Word, 'index'],
				[TokenType.Colon, ':'],
				[TokenType.Number, '2'],
				[TokenType.EndDossier, ';;'],
				[TokenType.Comma, ','],
				[TokenType.EndBracket, ']'],
				[TokenType.EndDossier, ';;'],
				[TokenType.EndDossier, ';;'],
				[TokenType.EndDossier, ';;'],
				[TokenType.EndDossier, ';;'],
				[TokenType.Word, 'describe'],
				[TokenType.Colon, ':'],
				[TokenType.String, 'Computers'],
				[TokenType.StartDossier, '::'],
				[TokenType.EndDossier, ';;'],
				[TokenType.Word, 'describe'],
				[TokenType.Colon, ':'],
				[TokenType.String, 'CSS'],
				[TokenType.StartDossier, '::'],
				[TokenType.Word, 'collection'],
				[TokenType.Colon, ':'],
				[TokenType.String, 'CSS review'],
				[TokenType.StartDossier, '::'],
				[TokenType.Word, 'related'],
				[TokenType.Colon, ':'],
				[TokenType.StartBracket, '['],
				[
					TokenType.String,
					'https://www.freecodecamp.org/learn/responsive-web-design-v9/review-css/review-css',
				],
				[TokenType.Comma, ','],
				[TokenType.EndBracket, ']'],
				[TokenType.Word, 'concerns'],
				[TokenType.Colon, ':'],
				[TokenType.StartBracket, '['],
				[TokenType.StartDossier, '::'],
				[TokenType.Word, 'name'],
				[TokenType.Colon, ':'],
				[TokenType.String, 'CSS'],
				[TokenType.Word, 'depth'],
				[TokenType.Colon, ':'],
				[TokenType.Number, '1'],
				[TokenType.EndDossier, ';;'],
				[TokenType.Comma, ','],
				[TokenType.StartDossier, '::'],
				[TokenType.Word, 'name'],
				[TokenType.Colon, ':'],
				[TokenType.String, 'CSS rule'],
				[TokenType.Word, 'depth'],
				[TokenType.Colon, ':'],
				[TokenType.Number, '2'],
				[TokenType.EndDossier, ';;'],
				[TokenType.Comma, ','],
				[TokenType.StartDossier, '::'],
				[TokenType.Word, 'name'],
				[TokenType.Colon, ':'],
				[TokenType.String, 'CSS selector'],
				[TokenType.Word, 'depth'],
				[TokenType.Colon, ':'],
				[TokenType.Number, '2'],
				[TokenType.EndDossier, ';;'],
				[TokenType.Comma, ','],
				[TokenType.StartDossier, '::'],
				[TokenType.Word, 'name'],
				[TokenType.Colon, ':'],
				[TokenType.String, 'CSS declaration block'],
				[TokenType.Word, 'depth'],
				[TokenType.Colon, ':'],
				[TokenType.Number, '2'],
				[TokenType.EndDossier, ';;'],
				[TokenType.Comma, ','],
				[TokenType.EndBracket, ']'],
				[TokenType.EndDossier, ';;'],
				[TokenType.EndDossier, ';;'],
				[TokenType.EndDossier, ';;'],
				[TokenType.EndDossier, ';;'],
				[TokenType.EOF, undefined],
			]);

			expect(tokens[tokens.length - 1]).toEqual({
				type: TokenType.EOF,
				lexeme: undefined,
				line: 66,
				column: 1,
				offset: 1319,
			});
		});
		it('should tokenize main-sample.ds', () => {
			const source = readFixture('valid', 'main-sample.ds');

			const lexer = new Lexer(source);
			const tokens = lexer.tokenize();

			expect(simplifyTokens(tokens)).toEqual([
				[TokenType.Word, 'person'],
				[TokenType.Colon, ':'],
				[TokenType.String, 'human'],
				[TokenType.StartDossier, '::'],
				[TokenType.Word, 'name'],
				[TokenType.Colon, ':'],
				[TokenType.String, 'John'],
				[TokenType.Word, 'surname'],
				[TokenType.Colon, ':'],
				[TokenType.String, 'Doe'],
				[TokenType.Word, 'wallet'],
				[TokenType.Colon, ':'],
				[TokenType.String, 'open'],
				[TokenType.StartDossier, '::'],
				[TokenType.Word, 'currency'],
				[TokenType.Colon, ':'],
				[TokenType.String, 'USD'],
				[TokenType.Word, 'value'],
				[TokenType.Colon, ':'],
				[TokenType.Number, '294.12'],
				[TokenType.EndDossier, ';;'],
				[TokenType.EndDossier, ';;'],
				[TokenType.Word, 'fridgeContents'],
				[TokenType.Colon, ':'],
				[TokenType.StartBracket, '['],
				[TokenType.String, 'cola'],
				[TokenType.Comma, ','],
				[TokenType.String, 'chicken'],
				[TokenType.Comma, ','],
				[TokenType.String, 'cheese sauce'],
				[TokenType.Comma, ','],
				[TokenType.EndBracket, ']'],
				[TokenType.Word, 'purse'],
				[TokenType.Colon, ':'],
				[TokenType.StartBracket, '['],
				[TokenType.Word, 'wallet'],
				[TokenType.StartDossier, '::'],
				[TokenType.Word, 'currency'],
				[TokenType.Colon, ':'],
				[TokenType.String, 'USD'],
				[TokenType.Word, 'value'],
				[TokenType.Colon, ':'],
				[TokenType.Number, '190.01'],
				[TokenType.EndDossier, ';;'],
				[TokenType.Comma, ','],
				[TokenType.StartDossier, '::'],
				[TokenType.Word, 'color'],
				[TokenType.Colon, ':'],
				[TokenType.String, 'red'],
				[TokenType.Word, 'position'],
				[TokenType.StartDossier, '::'],
				[TokenType.Word, 'x'],
				[TokenType.Colon, ':'],
				[TokenType.StartParenthesis, '('],
				[TokenType.Number, '11.45'],
				[TokenType.EndParenthesis, ')'],
				[TokenType.Word, 'y'],
				[TokenType.Colon, ':'],
				[TokenType.StartParenthesis, '('],
				[TokenType.Minus, '-'],
				[TokenType.Number, '4.8'],
				[TokenType.EndParenthesis, ')'],
				[TokenType.EndDossier, ';;'],
				[TokenType.EndDossier, ';;'],
				[TokenType.Comma, ','],
				[TokenType.EndBracket, ']'],
				[TokenType.Word, 'isSummer'],
				[TokenType.Colon, ':'],
				[TokenType.Word, 'true'],
				[TokenType.Word, 'sale'],
				[TokenType.Colon, ':'],
				[TokenType.Word, 'null'],
				[TokenType.Word, 'tags'],
				[TokenType.Colon, ':'],
				[TokenType.StartBracket, '['],
				[TokenType.EndBracket, ']'],
				[TokenType.Word, 'pillow'],
				[TokenType.StartDossier, '::'],
				[TokenType.EndDossier, ';;'],
				[TokenType.Word, 'floats'],
				[TokenType.StartDossier, '::'],
				[TokenType.Word, 'zeroes'],
				[TokenType.Colon, ':'],
				[TokenType.StartBracket, '['],
				[TokenType.StartParenthesis, '('],
				[TokenType.Number, '0'],
				[TokenType.EndParenthesis, ')'],
				[TokenType.Comma, ','],
				[TokenType.StartParenthesis, '('],
				[TokenType.Number, '0.0'],
				[TokenType.EndParenthesis, ')'],
				[TokenType.Comma, ','],
				[TokenType.StartParenthesis, '('],
				[TokenType.Number, '0e0'],
				[TokenType.EndParenthesis, ')'],
				[TokenType.Comma, ','],
				[TokenType.EndBracket, ']'],
				[TokenType.Word, 'exponents'],
				[TokenType.Colon, ':'],
				[TokenType.StartBracket, '['],
				[TokenType.StartParenthesis, '('],
				[TokenType.Number, '0e0'],
				[TokenType.EndParenthesis, ')'],
				[TokenType.Comma, ','],
				[TokenType.StartParenthesis, '('],
				[TokenType.Number, '1e2'],
				[TokenType.EndParenthesis, ')'],
				[TokenType.Comma, ','],
				[TokenType.StartParenthesis, '('],
				[TokenType.Minus, '-'],
				[TokenType.Number, '2e21'],
				[TokenType.EndParenthesis, ')'],
				[TokenType.Comma, ','],
				[TokenType.StartParenthesis, '('],
				[TokenType.Plus, '+'],
				[TokenType.Number, '7e2'],
				[TokenType.EndParenthesis, ')'],
				[TokenType.Comma, ','],
				[TokenType.EndBracket, ']'],
				[TokenType.EndDossier, ';;'],
				[TokenType.EOF, undefined],
			]);

			expect(tokens[tokens.length - 1]).toEqual({
				type: TokenType.EOF,
				lexeme: undefined,
				line: 44,
				column: 1,
				offset: 454,
			});
		});
		it('should tokenize store-hidden-treasures.ds', () => {
			const source = readFixture('valid', 'store-hidden-treasures.ds');

			const lexer = new Lexer(source);
			const tokens = lexer.tokenize();

			expect(simplifyTokens(tokens)).toEqual([
				[TokenType.Word, 'store'],
				[TokenType.Colon, ':'],
				[TokenType.String, 'downtown'],
				[TokenType.StartDossier, '::'],
				[TokenType.Word, 'name'],
				[TokenType.Colon, ':'],
				[TokenType.String, 'Hidden Treasures'],
				[TokenType.Word, 'nearby'],
				[TokenType.Colon, ':'],
				[TokenType.Word, 'true'],
				[TokenType.Word, 'inventory'],
				[TokenType.Colon, ':'],
				[TokenType.StartBracket, '['],
				[TokenType.Word, 'apple'],
				[TokenType.StartDossier, '::'],
				[TokenType.Word, 'qty'],
				[TokenType.Colon, ':'],
				[TokenType.Number, '10'],
				[TokenType.Word, 'price'],
				[TokenType.Colon, ':'],
				[TokenType.Number, '1.25'],
				[TokenType.EndDossier, ';;'],
				[TokenType.Comma, ','],
				[TokenType.Word, 'milk'],
				[TokenType.StartDossier, '::'],
				[TokenType.Word, 'qty'],
				[TokenType.Colon, ':'],
				[TokenType.Number, '4'],
				[TokenType.Word, 'price'],
				[TokenType.Colon, ':'],
				[TokenType.Number, '3.50'],
				[TokenType.EndDossier, ';;'],
				[TokenType.Comma, ','],
				[TokenType.EndBracket, ']'],
				[TokenType.Word, 'active'],
				[TokenType.Colon, ':'],
				[TokenType.Word, 'true'],
				[TokenType.EndDossier, ';;'],
				[TokenType.EOF, undefined],
			]);

			expect(tokens[tokens.length - 1]).toEqual({
				type: TokenType.EOF,
				lexeme: undefined,
				line: 16,
				column: 1,
				offset: 179,
			});
		});
	});

	describe('invalid', () => {
		it('should throw for underscore in identifier', () => {
			expect(() => {
				const lexer = new Lexer('user_name: "John"');
				lexer.tokenize();
			}).toThrow("Unexpected character '_'");
		});
		it('should tokenize a leading digit separately from the following identifier', () => {
			const lexer = new Lexer('1name: "John"');
			const tokens = lexer.tokenize();

			expect(simplifyTokens(tokens)).toEqual([
				[TokenType.Number, '1'],
				[TokenType.Word, 'name'],
				[TokenType.Colon, ':'],
				[TokenType.String, 'John'],
				[TokenType.EOF, undefined],
			]);
		});
		it('should throw for unterminated comment', () => {
			expect(() => {
				const lexer = new Lexer('name: "x"\n## comment');
				lexer.tokenize();
			}).toThrow('Unterminated comment');
		});
		it('should throw for missing-closing-quote.ds', () => {
			const source = readFixture('invalid', 'missing-closing-quote.ds');

			expect(() => {
				const lexer = new Lexer(source);
				lexer.tokenize();
			}).toThrow();
		});
		it('should tokenize missing-colon.ds as lexer-valid input', () => {
			const source = readFixture('invalid', 'missing-colon.ds');

			const lexer = new Lexer(source);
			const tokens = lexer.tokenize();

			expect(tokens).toEqual([
				{ type: TokenType.Word, lexeme: 'data', line: 1, column: 1, offset: 0 },
				{ type: TokenType.StartDossier, lexeme: '::', line: 1, column: 6, offset: 5 },
				{ type: TokenType.Word, lexeme: 'person', line: 2, column: 2, offset: 9 },
				{ type: TokenType.String, lexeme: 'John', line: 2, column: 9, offset: 16 },
				{ type: TokenType.EndDossier, lexeme: ';;', line: 3, column: 1, offset: 23 },
				{ type: TokenType.EOF, lexeme: undefined, line: 3, column: 3, offset: 25 },
			]);
		});
	});
});
