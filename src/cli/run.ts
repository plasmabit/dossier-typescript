import { readFileSync } from 'node:fs';
import path from 'node:path';

import { Lexer, Parser } from '../index';
import { dossierToJSON, renderDossierTree, serializeTokens } from './formatters';

type OutputWriter = {
	write(chunk: string): unknown;
};

export type CliEnvironment = {
	cwd: string;
	readFile: (filePath: string) => string;
	stdout: OutputWriter;
	stderr: OutputWriter;
};

type CliCommand = 'lex' | 'parse' | 'tree';

type CliInvocation =
	| {
			kind: 'command';
			command: CliCommand;
			filePath: string;
	  }
	| {
			kind: 'help';
	  }
	| {
			kind: 'error';
			message: string;
	  };

const HELP_TEXT = [
	'Usage:',
	'  dossier <file.ds>',
	'  dossier <command> <file.ds>',
	'',
	'Commands:',
	'  lex, lexer      Print lexer tokens as JSON.',
	'  parse, parser   Print a simplified AST as JSON.',
	'  tree            Print an ASCII tree of dossier nodes and value kinds.',
	'  help            Show this message.',
].join('\n');

const DEFAULT_ENVIRONMENT: CliEnvironment = {
	cwd: process.cwd(),
	readFile: filePath => readFileSync(filePath, 'utf8'),
	stdout: process.stdout,
	stderr: process.stderr,
};

export function runCli(
	args: string[],
	environment: CliEnvironment = DEFAULT_ENVIRONMENT,
): number {
	const invocation = parseCliArgs(args);

	if (invocation.kind === 'help') {
		environment.stdout.write(`${HELP_TEXT}\n`);
		return 0;
	}

	if (invocation.kind === 'error') {
		environment.stderr.write(`${invocation.message}\n\n${HELP_TEXT}\n`);
		return 1;
	}

	try {
		const filePath = path.resolve(environment.cwd, invocation.filePath);
		const source = environment.readFile(filePath);
		const lexer = new Lexer(source);
		const tokens = lexer.tokenize();

		switch (invocation.command) {
			case 'lex':
				environment.stdout.write(`${JSON.stringify(serializeTokens(tokens), null, 2)}\n`);
				return 0;

			case 'parse': {
				const parser = new Parser(tokens);
				const dossier = parser.parse();

				environment.stdout.write(`${JSON.stringify(dossierToJSON(dossier), null, 2)}\n`);
				return 0;
			}

			case 'tree': {
				const parser = new Parser(tokens);
				const dossier = parser.parse();

				environment.stdout.write(`${renderDossierTree(dossier)}\n`);
				return 0;
			}
		}
	} catch (error) {
		environment.stderr.write(`${formatError(error)}\n`);
		return 1;
	}
}

function parseCliArgs(args: string[]): CliInvocation {
	if (args.length === 0) {
		return {
			kind: 'error',
			message: 'Missing .ds file path.',
		};
	}

	if (isHelpArgument(args[0])) {
		return {
			kind: 'help',
		};
	}

	if (args.length === 1) {
		return {
			kind: 'command',
			command: 'tree',
			filePath: args[0],
		};
	}

	const command = normalizeCommand(args[0]);

	if (!command) {
		return {
			kind: 'error',
			message: `Unknown command "${args[0]}".`,
		};
	}

	if (args.length !== 2) {
		return {
			kind: 'error',
			message: `Expected exactly one .ds file path for "${args[0]}".`,
		};
	}

	return {
		kind: 'command',
		command: command,
		filePath: args[1],
	};
}

function normalizeCommand(command: string): CliCommand | undefined {
	switch (command) {
		case 'lex':
		case 'lexer':
			return 'lex';
		case 'parse':
		case 'parser':
			return 'parse';
		case 'tree':
			return 'tree';
		default:
			return undefined;
	}
}

function isHelpArgument(argument: string): boolean {
	return argument === 'help' || argument === '--help' || argument === '-h';
}

function formatError(error: unknown): string {
	if (error instanceof Error) {
		return error.message;
	}

	return String(error);
}
