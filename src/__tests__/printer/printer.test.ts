import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

import { Kind, Lexer, Parser, printDossier, type Dossier } from '../../index';

const FIXTURES = [
	'course.ds',
	'main-sample.ds',
	'store-hidden-treasures.ds',
	'wallet-nested.ds',
	'warehouse-location.ds',
];

function parseSource(source: string): Dossier {
	return new Parser(new Lexer(source).tokenize()).parse();
}

function readFixture(fileName: string): string {
	return readFileSync(path.join(__dirname, '..', 'data', 'valid', fileName), 'utf8').replace(
		/\r\n/g,
		'\n',
	);
}

describe('printDossier', () => {
	it.each(FIXTURES)('should round-trip %s', fileName => {
		const dossier = parseSource(readFixture(fileName));
		const printed = printDossier(dossier);

		expect(parseSource(printed)).toEqual(dossier);
	});

	it('should print canonical Dossier syntax', () => {
		const dossier = parseSource(
			[
				'expedition: "night-run" ::',
				'\ttitle: "Night archive"',
				'\tnotes: null',
				'\ttags: []',
				'\tlocker :: ;;',
				'\tcheckpoints: ["north", "east",]',
				';;',
			].join('\n'),
		);

		expect(printDossier(dossier)).toBe(
			[
				'expedition: "night-run" ::',
				'\ttitle: "Night archive"',
				'\tnotes: null',
				'\ttags: []',
				'\tlocker :: ;;',
				'\tcheckpoints: [',
				'\t\t"north",',
				'\t\t"east",',
				'\t]',
				';;',
			].join('\n'),
		);
	});

	it('should use only lexer-supported string escapes', () => {
		const dossier: Dossier = {
			kind: Kind.dossier,
			children: {
				kind: Kind.children,
				value: [
					{
						kind: Kind.dossier,
						identifier: {
							kind: Kind.identifier,
							value: { kind: Kind.string, value: 'text' },
						},
						value: {
							kind: Kind.string,
							value: 'quote: " slash: \\ newline:\n tab:\t return:\r backspace:\b',
						},
					},
				],
			},
		};

		const printed = printDossier(dossier);

		expect(printed).toContain('\\"');
		expect(printed).toContain('\\\\');
		expect(printed).toContain('\\n');
		expect(printed).toContain('\\t');
		expect(printed).toContain('\\r');
		expect(printed).not.toContain('\\b');
		expect(printed).not.toContain('\\u');
		expect(parseSource(printed)).toEqual(dossier);
	});

	it('should preserve integer kind when JavaScript formats the value with an exponent', () => {
		const dossier: Dossier = {
			kind: Kind.dossier,
			children: {
				kind: Kind.children,
				value: [
					{
						kind: Kind.dossier,
						identifier: {
							kind: Kind.identifier,
							value: { kind: Kind.string, value: 'large' },
						},
						value: { kind: Kind.integer, value: 1e21 },
					},
				],
			},
		};

		expect(printDossier(dossier)).toBe('large: 1000000000000000000000');
		expect(parseSource(printDossier(dossier))).toEqual(dossier);
	});

	it('should reject identifiers outside the lexer grammar', () => {
		const dossier: Dossier = {
			kind: Kind.dossier,
			identifier: {
				kind: Kind.identifier,
				value: { kind: Kind.string, value: 'invalid_key' },
			},
			value: { kind: Kind.boolean, value: true },
		};

		expect(() => printDossier(dossier)).toThrow(
			'Invalid Dossier identifier "invalid_key": expected /^[A-Za-z][A-Za-z0-9]*$/',
		);
	});
});
