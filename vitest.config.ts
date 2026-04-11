import { defineConfig } from 'vitest/config';
import { resolve } from 'node:path';

export default defineConfig({
	resolve: {
		alias: {
			'@lexer': resolve(__dirname, 'src/lexer'),
			'@parser': resolve(__dirname, 'src/parser'),
			'@validator': resolve(__dirname, 'src/validator'),
			'@types': resolve(__dirname, 'src/types'),
		},
	},
	test: {
		include: ['src/__tests/**/*.test.ts'],
		exclude: ['dist/**'],
	},
});
