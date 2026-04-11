import { type Token, TokenType } from '@types';

export class Lexer {
	private source: string;

	private position = 0;
	private line = 1;
	private column = 1;

	private static LETTER = /[A-Za-z]/;
	private static IDENTIFIER_PART = /[A-Za-z0-9]/;
	private static WHITESPACE = /\s/;
	private static NULL_CHARACTER = '\0';
	private static NEW_LINE = '\n';
	private static DIGIT = /[0-9]/;

	constructor(source: string) {
		this.source = source;
	}

	private peek(offset: number = 0): string {
		return this.source[this.position + offset] ?? Lexer.NULL_CHARACTER;
	}

	private consume(): string {
		const charConsumed = this.peek();
		this.position++;

		if (charConsumed === Lexer.NEW_LINE) {
			this.line++;
			this.column = 1;
		} else {
			this.column++;
		}

		return charConsumed;
	}

	private isAtEnd(): boolean {
		return this.position >= this.source.length;
	}

	private isLetter(char: string): boolean {
		return Lexer.LETTER.test(char);
	}

	private isDigit(char: string): boolean {
		return Lexer.DIGIT.test(char);
	}

	private isIdentifierPart(char: string): boolean {
		return Lexer.IDENTIFIER_PART.test(char);
	}

	private isWrapString(char: string): boolean {
		return ['"', "'", '`'].includes(char);
	}

	private makeToken(
		type: TokenType,
		lexeme?: string,
		line: number = this.line,
		column: number = this.column,
		offset: number = this.position,
	): Token {
		return {
			type: type,
			lexeme: lexeme,
			line: line,
			column: column,
			offset: offset,
		};
	}

	private readWord(char: string): Token {
		const line = this.line;
		const column = this.column - 1;
		const offset = this.position - 1;
		let lexeme: string = char;

		while (this.isIdentifierPart(this.peek())) {
			lexeme += this.consume();
		}

		return this.makeToken(TokenType.Word, lexeme, line, column, offset);
	}

	private readNumber(char: string): Token {
		const line = this.line;
		const column = this.column - 1;
		const offset = this.position - 1;

		let lexeme = char;

		while (this.isDigit(this.peek())) {
			lexeme += this.consume();
		}

		if (this.peek() === '.' && this.isDigit(this.peek(1))) {
			lexeme += this.consume();

			while (this.isDigit(this.peek())) {
				lexeme += this.consume();
			}
		}

		if (this.peek() === 'e' || this.peek() === 'E') {
			const next = this.peek(1);
			const nextNext = this.peek(2);

			const hasValidExponent =
				this.isDigit(next) || ((next === '+' || next === '-') && this.isDigit(nextNext));

			if (hasValidExponent) {
				lexeme += this.consume();

				if (this.peek() === '+' || this.peek() === '-') {
					lexeme += this.consume();
				}

				while (this.isDigit(this.peek())) {
					lexeme += this.consume();
				}
			}
		}

		return this.makeToken(TokenType.Number, lexeme, line, column, offset);
	}

	private readString(quote: string): Token {
		const line = this.line;
		const column = this.column - 1;
		const offset = this.position - 1;
		let lexeme = '';

		while (!this.isAtEnd()) {
			const char = this.peek();

			if (char === quote) {
				this.consume();
				return this.makeToken(TokenType.String, lexeme, line, column, offset);
			}

			if (char === '\n' && quote !== '`') {
				throw new Error(`Newline not allowed in string at ${this.line}:${this.column}`);
			}

			if (char === '\\') {
				this.consume();
				const escape = this.consume();

				switch (escape) {
					case 'n':
						lexeme += '\n';
						break;
					case 't':
						lexeme += '\t';
						break;
					case 'r':
						lexeme += '\r';
						break;
					case '"':
						lexeme += '"';
						break;
					case "'":
						lexeme += "'";
						break;
					case '`':
						lexeme += '`';
						break;
					case '\\':
						lexeme += '\\';
						break;
					default:
						throw new Error(
							`Invalid escape \\${escape} at ${this.line}:${this.column}`,
						);
				}

				continue;
			}

			lexeme += this.consume();
		}

		throw new Error(`Unterminated string at ${this.line}:${this.column}`);
	}

	private skipWhitespace(): void {
		while (Lexer.WHITESPACE.test(this.peek())) {
			this.consume();
		}
	}

	private skipComment(): void {
		this.consume();
		this.consume();

		while (!this.isAtEnd()) {
			if (this.peek() === '#' && this.peek(1) === '#') {
				this.consume();
				this.consume();
				return;
			}

			this.consume();
		}

		throw new Error(`Unterminated comment at ${this.line}:${this.column}`);
	}

	private skipIgnored(): void {
		while (true) {
			this.skipWhitespace();

			if (!(this.peek() === '#' && this.peek(1) === '#')) {
				return;
			}

			this.skipComment();
		}
	}

	private nextToken(): Token {
		this.skipIgnored();

		if (this.isAtEnd()) {
			return this.makeToken(TokenType.EOF);
		}

		const line = this.line;
		const column = this.column;
		const offset = this.position;

		const charConsumed = this.consume();

		switch (charConsumed) {
			case ':':
				if (this.peek() === ':') {
					this.consume();
					return this.makeToken(TokenType.StartDossier, '::', line, column, offset);
				}
				return this.makeToken(TokenType.Colon, charConsumed, line, column, offset);
			case ',':
				return this.makeToken(TokenType.Comma, charConsumed, line, column, offset);
			case ';':
				if (this.peek() === ';') {
					this.consume();
					return this.makeToken(TokenType.EndDossier, ';;', line, column, offset);
				}
				throw new Error(
					`Unexpected single semicolon '${charConsumed}' at ${line}:${column}. Expected ;;.`,
				);
			case '[':
				return this.makeToken(TokenType.StartBracket, charConsumed, line, column, offset);
			case ']':
				return this.makeToken(TokenType.EndBracket, charConsumed, line, column, offset);
			case '(':
				return this.makeToken(
					TokenType.StartParenthesis,
					charConsumed,
					line,
					column,
					offset,
				);
			case ')':
				return this.makeToken(TokenType.EndParenthesis, charConsumed, line, column, offset);
			case '+':
				return this.makeToken(TokenType.Plus, charConsumed, line, column, offset);
			case '-':
				return this.makeToken(TokenType.Minus, charConsumed, line, column, offset);
			default:
				if (this.isLetter(charConsumed)) return this.readWord(charConsumed);
				if (this.isDigit(charConsumed)) return this.readNumber(charConsumed);
				if (this.isWrapString(charConsumed)) return this.readString(charConsumed);
		}

		throw new Error(`Unexpected character '${charConsumed}' at ${line}:${column}`);
	}

	public tokenize(): Token[] {
		const tokens: Token[] = [];

		while (true) {
			const token = this.nextToken();
			tokens.push(token);

			if (token.type === TokenType.EOF) break;
		}

		return tokens;
	}
}
