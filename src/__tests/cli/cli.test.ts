import { describe, expect, it } from 'vitest';

import { readFileSync } from 'node:fs';
import path from 'node:path';

import { runCli } from '../../cli/run';

type Writer = {
	write: (chunk: string) => true;
	output: () => string;
};

function createWriter(): Writer {
	const chunks: string[] = [];

	return {
		write(chunk: string) {
			chunks.push(chunk);
			return true;
		},
		output() {
			return chunks.join('');
		},
	};
}

function createEnvironment() {
	const stdout = createWriter();
	const stderr = createWriter();

	return {
		stdout,
		stderr,
		environment: {
			cwd: process.cwd(),
			readFile(filePath: string) {
				return readFileSync(filePath, 'utf8').replace(/\r\n/g, '\n');
			},
			stdout,
			stderr,
		},
	};
}

function fixturePath(fileName: string): string {
	return path.join('src', '__tests', 'data', 'valid', fileName);
}

describe('cli', () => {
	it('should print lexer output as readable JSON', () => {
		const { environment, stdout, stderr } = createEnvironment();

		const exitCode = runCli(['lex', fixturePath('warehouse-location.ds')], environment);
		const output = JSON.parse(stdout.output()) as Array<Record<string, unknown>>;

		expect(exitCode).toBe(0);
		expect(stderr.output()).toBe('');
		expect(output[0]).toEqual({
			type: 'Word',
			lexeme: 'warehouse',
			line: 1,
			column: 1,
			offset: 0,
		});
		expect(output[3]).toEqual({
			type: 'StartDossier',
			lexeme: '::',
			line: 1,
			column: 18,
			offset: 17,
		});
		expect(output[output.length - 1]).toEqual({
			type: 'EOF',
			line: 7,
			column: 1,
			offset: 72,
		});
	});

	it('should print parser output as simplified JSON', () => {
		const { environment, stdout, stderr } = createEnvironment();

		const exitCode = runCli(['parse', fixturePath('warehouse-location.ds')], environment);
		const output = JSON.parse(stdout.output()) as Record<string, unknown>;

		expect(exitCode).toBe(0);
		expect(stderr.output()).toBe('');
		expect(output).toEqual({
			kind: 'dossier',
			children: [
				{
					kind: 'dossier',
					identifier: 'warehouse',
					value: {
						kind: 'integer',
						value: 10573,
					},
					children: [
						{
							kind: 'dossier',
							identifier: 'location',
							children: [
								{
									kind: 'dossier',
									identifier: 'x',
									value: {
										kind: 'float',
										value: '25.54325',
									},
								},
								{
									kind: 'dossier',
									identifier: 'y',
									value: {
										kind: 'float',
										value: '75.34266',
									},
								},
							],
						},
					],
				},
			],
		});
	});

	it('should print a dossier tree when only a file path is provided', () => {
		const { environment, stdout, stderr } = createEnvironment();

		const exitCode = runCli([fixturePath('wallet-nested.ds')], environment);

		expect(exitCode).toBe(0);
		expect(stderr.output()).toBe('');
		expect(stdout.output()).toBe(
			[
				'root [dossier]',
				'`-- wallet [dossier]',
				'    |-- = [array]',
				'    |   `-- [0] text [dossier]',
				'    |       `-- text [dossier]',
				'    |           `-- = [string] "text"',
				'    |-- currency [dossier]',
				'    |   `-- = [string] "USD"',
				'    `-- value [dossier]',
				'        `-- = [decimal] 294.12',
				'',
			].join('\n'),
		);
	});
});
