import {
	Kind,
	type Dossier,
	type DossierArray,
	type DossierChildren,
	type DossierIdentifier,
	type DossierValue,
	type Token,
	TokenType,
} from '@types';

export class Parser {
	private tokens: Token[];

	private position = 0;

	constructor(tokens: Token[]) {
		this.tokens = tokens;
	}

	private peek(offset: number = 0): Token {
		return this.tokens[this.position + offset] ?? this.tokens[this.tokens.length - 1];
	}

	private consume(): Token {
		const token = this.peek();
		this.position++;

		return token;
	}

	private isAtEnd(): boolean {
		return this.peek().type === TokenType.EOF;
	}

	private check(type: TokenType, offset: number = 0): boolean {
		return this.peek(offset).type === type;
	}

	private match(...types: TokenType[]): boolean {
		for (const type of types) {
			if (this.check(type)) {
				this.consume();
				return true;
			}
		}

		return false;
	}

	private expect(type: TokenType, message: string): Token {
		const token = this.peek();

		if (token.type !== type) {
			throw new Error(`${message} at ${token.line}:${token.column}`);
		}

		return this.consume();
	}

	private makeChildren(value: Dossier[]): DossierChildren | undefined {
		if (value.length === 0) {
			return undefined;
		}

		return {
			kind: Kind.children,
			value: value,
		};
	}

	private parseIdentifier(): DossierIdentifier {
		const token = this.expect(TokenType.Word, 'Expected identifier');

		return {
			kind: Kind.identifier,
			value: {
				kind: Kind.string,
				value: token.lexeme ?? '',
			},
		};
	}

	private parseChildrenUntilEndDossier(): Dossier[] {
		const dossiers: Dossier[] = [];

		while (!this.check(TokenType.EndDossier) && !this.isAtEnd()) {
			if (this.check(TokenType.StartDossier)) {
				const token = this.peek();
				throw new Error(
					`Anonymous dossiers are only allowed at the root or inside arrays at ${token.line}:${token.column}`,
				);
			}

			dossiers.push(this.parseNamedDossier());
		}

		this.expect(TokenType.EndDossier, 'Expected ";;" to close dossier');

		return dossiers;
	}

	private parseAnonymousDossierAfterStart(): Dossier {
		const children = this.parseChildrenUntilEndDossier();

		return {
			kind: Kind.dossier,
			children: this.makeChildren(children),
		};
	}

	private parseNamedDossier(): Dossier {
		const identifier = this.parseIdentifier();

		return this.parseNamedDossierAfterIdentifier(identifier);
	}

	private parseNamedDossierAfterIdentifier(identifier: DossierIdentifier): Dossier {
		if (this.match(TokenType.StartDossier)) {
			const children = this.parseChildrenUntilEndDossier();

			return {
				kind: Kind.dossier,
				identifier: identifier,
				children: this.makeChildren(children),
			};
		}

		this.expect(TokenType.Colon, 'Expected ":" or "::" after identifier');

		if (this.match(TokenType.StartDossier)) {
			const token = this.peek(-1);
			throw new Error(
				`Unexpected "::" after ":" at ${token.line}:${token.column}. Use "identifier ::" for dossiers without values`,
			);
		}

		const value = this.parseValue();

		if (this.match(TokenType.StartDossier)) {
			const children = this.parseChildrenUntilEndDossier();

			return {
				kind: Kind.dossier,
				identifier: identifier,
				value: value,
				children: this.makeChildren(children),
			};
		}

		return {
			kind: Kind.dossier,
			identifier: identifier,
			value: value,
		};
	}

	private parseDossier(): Dossier {
		if (this.match(TokenType.StartDossier)) {
			return this.parseAnonymousDossierAfterStart();
		}

		return this.parseNamedDossier();
	}

	private parseFloat(): DossierValue {
		this.expect(TokenType.StartParenthesis, 'Expected "(" to start float');

		let sign = '';

		if (this.match(TokenType.Plus)) {
			sign = '+';
		} else if (this.match(TokenType.Minus)) {
			sign = '-';
		}

		const numberToken = this.expect(TokenType.Number, 'Expected number inside float');

		this.expect(TokenType.EndParenthesis, 'Expected ")" to close float');

		return {
			kind: Kind.float,
			value: `${sign}${numberToken.lexeme ?? ''}`,
		};
	}

	private parseNumberValue(lexeme: string): DossierValue {
		if (lexeme.includes('.') || /e/i.test(lexeme)) {
			return {
				kind: Kind.decimal,
				value: lexeme,
			};
		}

		return {
			kind: Kind.integer,
			value: Number(lexeme),
		};
	}

	private parseSignedNumber(): DossierValue {
		const signToken = this.consume();
		const numberToken = this.expect(TokenType.Number, 'Expected number after sign');

		return this.parseNumberValue(`${signToken.lexeme ?? ''}${numberToken.lexeme ?? ''}`);
	}

	private parseArrayItem(): DossierValue | Dossier {
		if (this.check(TokenType.StartDossier)) {
			return this.parseDossier();
		}

		if (
			this.check(TokenType.Word) &&
			(this.check(TokenType.Colon, 1) || this.check(TokenType.StartDossier, 1))
		) {
			return this.parseDossier();
		}

		return this.parseValue();
	}

	private parseArray(): DossierArray {
		this.expect(TokenType.StartBracket, 'Expected "[" to start array');

		const items: Array<DossierValue | Dossier> = [];

		while (!this.check(TokenType.EndBracket) && !this.isAtEnd()) {
			items.push(this.parseArrayItem());
			this.expect(TokenType.Comma, 'Expected trailing comma after array item');
		}

		this.expect(TokenType.EndBracket, 'Expected "]" to close array');

		return {
			kind: Kind.array,
			value: items,
		};
	}

	private parseValue(): DossierValue {
		const token = this.peek();

		switch (token.type) {
			case TokenType.String:
				this.consume();

				return {
					kind: Kind.string,
					value: token.lexeme ?? '',
				};

			case TokenType.Number:
				this.consume();

				return this.parseNumberValue(token.lexeme ?? '');

			case TokenType.Plus:
			case TokenType.Minus:
				return this.parseSignedNumber();

			case TokenType.StartParenthesis:
				return this.parseFloat();

			case TokenType.StartBracket:
				return this.parseArray();

			case TokenType.Word:
				if (token.lexeme === 'true' || token.lexeme === 'false') {
					this.consume();

					return {
						kind: Kind.boolean,
						value: token.lexeme === 'true',
					};
				}

				if (token.lexeme === 'null') {
					this.consume();

					return {
						kind: Kind.null,
						value: null,
					};
				}
		}

		throw new Error(`Expected value at ${token.line}:${token.column}`);
	}

	public parse(): Dossier {
		if (this.match(TokenType.StartDossier)) {
			const root = this.parseAnonymousDossierAfterStart();

			this.expect(TokenType.EOF, 'Expected end of file');

			return root;
		}

		const children: Dossier[] = [];

		while (!this.isAtEnd()) {
			children.push(this.parseDossier());
		}

		this.expect(TokenType.EOF, 'Expected end of file');

		return {
			kind: Kind.dossier,
			children: this.makeChildren(children),
		};
	}
}
