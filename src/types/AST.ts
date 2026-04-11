export const Kind = {
	string: 'string',
	float: 'float',
	decimal: 'decimal',
	boolean: 'boolean',
	integer: 'integer',
	array: 'array',
	null: 'null',
	identifier: 'identifier',
	dossier: 'dossier',
	children: 'children',
} as const;

export type Kind = (typeof Kind)[keyof typeof Kind];

export type Dossier = NamedDossier | AnonymousDossier;

export type NamedDossier = {
	kind: typeof Kind.dossier;
	identifier: DossierIdentifier;
	value?: DossierValue;
	children?: DossierChildren;
};

export type AnonymousDossier = {
	kind: typeof Kind.dossier;
	identifier?: never;
	value?: never;
	children?: DossierChildren;
};

export type DossierChildren = {
	kind: typeof Kind.children;
	value: Dossier[];
};

export type DossierIdentifier = {
	kind: typeof Kind.identifier;
	value: DossierString;
};

export type DossierValue =
	| DossierString
	| DossierInteger
	| DossierFloat
	| DossierArray
	| DossierBoolean
	| DossierDecimal
	| DossierNull;

export type DossierString = {
	kind: typeof Kind.string;
	value: string;
};

export type DossierInteger = {
	kind: typeof Kind.integer;
	value: number;
};

export type DossierFloat = {
	kind: typeof Kind.float;
	value: string;
};

export type DossierArray = {
	kind: typeof Kind.array;
	value: Array<DossierValue | Dossier>;
};

export type DossierBoolean = {
	kind: typeof Kind.boolean;
	value: boolean;
};

export type DossierDecimal = {
	kind: typeof Kind.decimal;
	value: string;
};

export type DossierNull = {
	kind: typeof Kind.null;
	value: null;
};
