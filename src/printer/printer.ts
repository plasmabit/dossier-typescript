import { Kind, type Dossier, type DossierValue } from '../types';

const IDENTIFIER_PATTERN = /^[A-Za-z][A-Za-z0-9]*$/;
const NUMBER_PATTERN = /^[+-]?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?$/;

type DossierContext = 'root' | 'children' | 'array';

export function printDossier(dossier: Dossier): string {
	return printDossierNode(dossier, 0, 'root');
}

function printDossierNode(dossier: Dossier, depth: number, context: DossierContext): string {
	if (!dossier.identifier) {
		return printAnonymousDossier(dossier, depth, context);
	}

	const identifier = dossier.identifier.value.value;
	assertIdentifier(identifier);

	const indentation = indent(depth);
	let opening = `${indentation}${identifier}`;

	if (dossier.value) {
		opening += `: ${printValue(dossier.value, depth)}`;
	}

	const children = dossier.children?.value ?? [];

	if (children.length > 0) {
		const renderedChildren = children.map(child => printDossierNode(child, depth + 1, 'children'));
		return `${opening} ::\n${renderedChildren.join('\n')}\n${indentation};;`;
	}

	if (!dossier.value) {
		return `${opening} :: ;;`;
	}

	return opening;
}

function printAnonymousDossier(
	dossier: Dossier,
	depth: number,
	context: DossierContext,
): string {
	if (dossier.value) {
		throw new Error('Anonymous dossiers cannot have values');
	}

	if (context === 'children') {
		throw new Error('Anonymous dossiers are only allowed at the root or inside arrays');
	}

	const children = dossier.children?.value ?? [];

	if (context === 'root') {
		return children.map(child => printDossierNode(child, depth, 'children')).join('\n');
	}

	const indentation = indent(depth);

	if (children.length === 0) {
		return `${indentation}:: ;;`;
	}

	const renderedChildren = children.map(child => printDossierNode(child, depth + 1, 'children'));
	return `${indentation}::\n${renderedChildren.join('\n')}\n${indentation};;`;
}

function printValue(value: DossierValue, depth: number): string {
	switch (value.kind) {
		case Kind.string:
			return printString(value.value);
		case Kind.integer:
			return printInteger(value.value);
		case Kind.float:
			assertNumberLexeme(value.value, Kind.float);
			return `(${value.value})`;
		case Kind.decimal:
			assertNumberLexeme(value.value, Kind.decimal);
			return value.value;
		case Kind.boolean:
			return String(value.value);
		case Kind.null:
			return 'null';
		case Kind.array:
			if (value.value.length === 0) {
				return '[]';
			}

			return [
				'[',
				...value.value.map(item => {
					if (item.kind === Kind.dossier) {
						return `${printDossierNode(item, depth + 1, 'array')},`;
					}

					return `${indent(depth + 1)}${printValue(item, depth + 1)},`;
				}),
				`${indent(depth)}]`,
			].join('\n');
	}
}

function printString(value: string): string {
	const escaped = value
		.replace(/\\/g, '\\\\')
		.replace(/"/g, '\\"')
		.replace(/\n/g, '\\n')
		.replace(/\t/g, '\\t')
		.replace(/\r/g, '\\r');

	return `"${escaped}"`;
}

function printInteger(value: number): string {
	if (!Number.isFinite(value) || !Number.isInteger(value)) {
		throw new Error(`Invalid Dossier integer: ${String(value)}`);
	}

	if (Object.is(value, -0)) {
		return '-0';
	}

	const lexeme = String(value);

	if (!/[eE]/.test(lexeme)) {
		return lexeme;
	}

	const match = /^(-?)(\d)(?:\.(\d+))?[eE]\+?(-?\d+)$/.exec(lexeme);

	if (!match) {
		throw new Error(`Invalid Dossier integer: ${lexeme}`);
	}

	const [, sign, leadingDigit, fraction = '', exponentText] = match;
	const digits = `${leadingDigit}${fraction}`;
	const decimalPosition = 1 + Number(exponentText);

	if (decimalPosition <= 0) {
		return `${sign}0.${'0'.repeat(-decimalPosition)}${digits}`;
	}

	return `${sign}${digits.padEnd(decimalPosition, '0')}`;
}

function assertIdentifier(identifier: string): void {
	if (!IDENTIFIER_PATTERN.test(identifier)) {
		throw new Error(
			`Invalid Dossier identifier "${identifier}": expected /^[A-Za-z][A-Za-z0-9]*$/`,
		);
	}
}

function assertNumberLexeme(value: string, kind: typeof Kind.float | typeof Kind.decimal): void {
	const isValidNumber = NUMBER_PATTERN.test(value);
	const isCorrectKind = kind === Kind.float || value.includes('.') || /e/i.test(value);

	if (!isValidNumber || !isCorrectKind) {
		throw new Error(`Invalid Dossier ${kind}: ${JSON.stringify(value)}`);
	}
}

function indent(depth: number): string {
	return '\t'.repeat(depth);
}
