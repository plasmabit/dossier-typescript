import { Kind, type Dossier, type DossierValue, type Token, TokenType } from '../types';

export type SerializedToken = {
	type: string;
	lexeme?: string;
	line: number;
	column: number;
	offset: number;
};

type SerializedScalarKind =
	| typeof Kind.string
	| typeof Kind.float
	| typeof Kind.decimal
	| typeof Kind.boolean
	| typeof Kind.integer
	| typeof Kind.null;

export type SerializedScalarValue = {
	kind: SerializedScalarKind;
	value: string | number | boolean | null;
};

export type SerializedArrayValue = {
	kind: typeof Kind.array;
	value: SerializedNode[];
};

export type SerializedValue = SerializedScalarValue | SerializedArrayValue;

export type SerializedDossier = {
	kind: typeof Kind.dossier;
	identifier?: string;
	value?: SerializedValue;
	children?: SerializedDossier[];
};

export type SerializedNode = SerializedDossier | SerializedValue;

type TreeNode = {
	label: string;
	children: TreeNode[];
};

export function serializeTokens(tokens: Token[]): SerializedToken[] {
	return tokens.map(token => ({
		type: TokenType[token.type],
		lexeme: token.lexeme,
		line: token.line,
		column: token.column,
		offset: token.offset,
	}));
}

export function dossierToJSON(dossier: Dossier): SerializedDossier {
	const serialized: SerializedDossier = {
		kind: Kind.dossier,
	};

	if (dossier.identifier) {
		serialized.identifier = dossier.identifier.value.value;
	}

	if (dossier.value) {
		serialized.value = serializeValue(dossier.value);
	}

	if (dossier.children && dossier.children.value.length > 0) {
		serialized.children = dossier.children.value.map(child => dossierToJSON(child));
	}

	return serialized;
}

export function renderDossierTree(dossier: Dossier): string {
	const rootNode = buildDossierTree(dossierToJSON(dossier), 'root');
	const lines = [rootNode.label];

	appendTreeLines(rootNode.children, '', lines);

	return lines.join('\n');
}

function serializeNode(node: Dossier | DossierValue): SerializedNode {
	if (node.kind === Kind.dossier) {
		return dossierToJSON(node);
	}

	return serializeValue(node);
}

function serializeValue(value: DossierValue): SerializedValue {
	if (value.kind === Kind.array) {
		return {
			kind: Kind.array,
			value: value.value.map(item => serializeNode(item)),
		};
	}

	return {
		kind: value.kind,
		value: value.value,
	};
}

function buildDossierTree(dossier: SerializedDossier, labelOverride?: string): TreeNode {
	const children: TreeNode[] = [];

	if (dossier.value) {
		children.push(buildValueTree('=', dossier.value));
	}

	for (const child of dossier.children ?? []) {
		children.push(buildDossierTree(child));
	}

	return {
		label: `${labelOverride ?? dossier.identifier ?? '(anonymous)'} [${dossier.kind}]`,
		children: children,
	};
}

function buildValueTree(label: string, value: SerializedValue): TreeNode {
	if (value.kind === Kind.array) {
		return {
			label: value.value.length === 0 ? `${label} [${value.kind}] []` : `${label} [${value.kind}]`,
			children: value.value.map((item, index) => buildIndexedTree(item, index)),
		};
	}

	return {
		label: `${label} [${value.kind}] ${formatScalarValue(value)}`,
		children: [],
	};
}

function buildIndexedTree(node: SerializedNode, index: number): TreeNode {
	const label = `[${index}]`;

	if (node.kind === Kind.dossier) {
		return buildDossierTree(node, `${label} ${node.identifier ?? '(anonymous)'}`);
	}

	return buildValueTree(label, node);
}

function appendTreeLines(nodes: TreeNode[], prefix: string, lines: string[]): void {
	nodes.forEach((node, index) => {
		const isLast = index === nodes.length - 1;
		const connector = isLast ? '`-- ' : '|-- ';
		const childPrefix = `${prefix}${isLast ? '    ' : '|   '}`;

		lines.push(`${prefix}${connector}${node.label}`);
		appendTreeLines(node.children, childPrefix, lines);
	});
}

function formatScalarValue(value: SerializedScalarValue): string {
	if (value.kind === Kind.string) {
		return JSON.stringify(value.value);
	}

	return String(value.value);
}
