import { TokenType } from './types';

export type Token = {
	type: TokenType;
	lexeme?: string;
	offset: number;
	line: number;
	column: number;
};
