import { describe, expect, it } from 'vitest';

import { Lexer } from '@lexer';
import { Parser } from '@parser';
import { Kind, type Dossier, type DossierValue } from '@types';
import { readFileSync } from 'node:fs';
import path from 'node:path';

type FixtureKind = 'valid' | 'invalid';

function readFixture(kind: FixtureKind, fileName: string): string {
	return readFileSync(path.join(__dirname, '..', 'data', kind, fileName), 'utf8').replace(
		/\r\n/g,
		'\n',
	);
}

function parseSource(source: string): Dossier {
	const lexer = new Lexer(source);
	const parser = new Parser(lexer.tokenize());

	return parser.parse();
}

function simplifyValue(value: Dossier | DossierValue): unknown {
	if (value.kind === Kind.dossier) {
		return simplifyDossier(value);
	}

	if (value.kind === Kind.array) {
		return {
			kind: value.kind,
			value: value.value.map(item => simplifyValue(item)),
		};
	}

	return {
		kind: value.kind,
		value: value.value,
	};
}

function simplifyDossier(dossier: Dossier): Record<string, unknown> {
	const simplified: Record<string, unknown> = {
		kind: dossier.kind,
	};

	if (dossier.identifier) {
		simplified.identifier = dossier.identifier.value.value;
	}

	if (dossier.value) {
		simplified.value = simplifyValue(dossier.value);
	}

	if (dossier.children) {
		simplified.children = dossier.children.value.map(child => simplifyDossier(child));
	}

	return simplified;
}

describe('parser', () => {
	describe('valid', () => {
		it('should parse warehouse-location.ds', () => {
			const source = readFixture('valid', 'warehouse-location.ds');

			const ast = parseSource(source);

			expect(simplifyDossier(ast)).toEqual({
				kind: Kind.dossier,
				children: [
					{
						kind: Kind.dossier,
						identifier: 'warehouse',
						value: {
							kind: Kind.integer,
							value: 10573,
						},
						children: [
							{
								kind: Kind.dossier,
								identifier: 'location',
								children: [
									{
										kind: Kind.dossier,
										identifier: 'x',
										value: {
											kind: Kind.float,
											value: '25.54325',
										},
									},
									{
										kind: Kind.dossier,
										identifier: 'y',
										value: {
											kind: Kind.float,
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

		it('should parse wallet-nested.ds', () => {
			const source = readFixture('valid', 'wallet-nested.ds');

			const ast = parseSource(source);

			expect(simplifyDossier(ast)).toEqual({
				kind: Kind.dossier,
				children: [
					{
						kind: Kind.dossier,
						identifier: 'wallet',
						value: {
							kind: Kind.array,
							value: [
								{
									kind: Kind.dossier,
									identifier: 'text',
									children: [
										{
											kind: Kind.dossier,
											identifier: 'text',
											value: {
												kind: Kind.string,
												value: 'text',
											},
										},
									],
								},
							],
						},
						children: [
							{
								kind: Kind.dossier,
								identifier: 'currency',
								value: {
									kind: Kind.string,
									value: 'USD',
								},
							},
							{
								kind: Kind.dossier,
								identifier: 'value',
								value: {
									kind: Kind.decimal,
									value: '294.12',
								},
							},
						],
					},
				],
			});
		});

		it('should parse course.ds', () => {
			const source = readFixture('valid', 'course.ds');

			const ast = parseSource(source);

			expect(simplifyDossier(ast)).toEqual({
				kind: Kind.dossier,
				children: [
					{
						kind: Kind.dossier,
						identifier: 'type',
						value: {
							kind: Kind.string,
							value: 'album',
						},
						children: [
							{
								kind: Kind.dossier,
								identifier: 'name',
								value: {
									kind: Kind.string,
									value: 'FreeCodeCamp Responsive Web Design Certification',
								},
							},
							{
								kind: Kind.dossier,
								identifier: 'source',
								value: {
									kind: Kind.string,
									value: 'web-course',
								},
								children: [
									{
										kind: Kind.dossier,
										identifier: 'url',
										value: {
											kind: Kind.string,
											value: 'https://www.freecodecamp.org/learn/responsive-web-design-v9/',
										},
									},
									{
										kind: Kind.dossier,
										identifier: 'describe',
										value: {
											kind: Kind.string,
											value: 'HTML',
										},
										children: [
											{
												kind: Kind.dossier,
												identifier: 'describe',
												value: {
													kind: Kind.string,
													value: 'Basic HTML',
												},
												children: [
													{
														kind: Kind.dossier,
														identifier: 'describe',
														value: {
															kind: Kind.string,
															value: 'Understanding HTML attributes',
														},
														children: [
															{
																kind: Kind.dossier,
																identifier: 'collection',
																value: {
																	kind: Kind.string,
																	value: 'What Role Does HTML Play on the Web',
																},
																children: [
																	{
																		kind: Kind.dossier,
																		identifier: 'related',
																		value: {
																			kind: Kind.array,
																			value: [
																				{
																					kind: Kind.string,
																					value: 'https://www.freecodecamp.org/learn/responsive-web-design-v9/lecture-understanding-html-attributes/what-is-html',
																				},
																			],
																		},
																	},
																	{
																		kind: Kind.dossier,
																		identifier: 'concerns',
																		value: {
																			kind: Kind.array,
																			value: [
																				{
																					kind: Kind.dossier,
																					children: [
																						{
																							kind: Kind.dossier,
																							identifier:
																								'name',
																							value: {
																								kind: Kind.string,
																								value: 'HTML',
																							},
																						},
																						{
																							kind: Kind.dossier,
																							identifier:
																								'index',
																							value: {
																								kind: Kind.integer,
																								value: 1,
																							},
																						},
																					],
																				},
																				{
																					kind: Kind.dossier,
																					children: [
																						{
																							kind: Kind.dossier,
																							identifier:
																								'name',
																							value: {
																								kind: Kind.string,
																								value: 'HTML element',
																							},
																						},
																						{
																							kind: Kind.dossier,
																							identifier:
																								'index',
																							value: {
																								kind: Kind.integer,
																								value: 2,
																							},
																						},
																					],
																				},
																				{
																					kind: Kind.dossier,
																					children: [
																						{
																							kind: Kind.dossier,
																							identifier:
																								'name',
																							value: {
																								kind: Kind.string,
																								value: 'HTML content',
																							},
																						},
																						{
																							kind: Kind.dossier,
																							identifier:
																								'index',
																							value: {
																								kind: Kind.integer,
																								value: 2,
																							},
																						},
																					],
																				},
																				{
																					kind: Kind.dossier,
																					children: [
																						{
																							kind: Kind.dossier,
																							identifier:
																								'name',
																							value: {
																								kind: Kind.string,
																								value: 'HTML tag',
																							},
																						},
																						{
																							kind: Kind.dossier,
																							identifier:
																								'index',
																							value: {
																								kind: Kind.integer,
																								value: 2,
																							},
																						},
																					],
																				},
																				{
																					kind: Kind.dossier,
																					children: [
																						{
																							kind: Kind.dossier,
																							identifier:
																								'name',
																							value: {
																								kind: Kind.string,
																								value: 'HTML void element',
																							},
																						},
																						{
																							kind: Kind.dossier,
																							identifier:
																								'index',
																							value: {
																								kind: Kind.integer,
																								value: 2,
																							},
																						},
																					],
																				},
																			],
																		},
																	},
																],
															},
														],
													},
												],
											},
										],
									},
									{
										kind: Kind.dossier,
										identifier: 'describe',
										value: {
											kind: Kind.string,
											value: 'Computers',
										},
									},
									{
										kind: Kind.dossier,
										identifier: 'describe',
										value: {
											kind: Kind.string,
											value: 'CSS',
										},
										children: [
											{
												kind: Kind.dossier,
												identifier: 'collection',
												value: {
													kind: Kind.string,
													value: 'CSS review',
												},
												children: [
													{
														kind: Kind.dossier,
														identifier: 'related',
														value: {
															kind: Kind.array,
															value: [
																{
																	kind: Kind.string,
																	value: 'https://www.freecodecamp.org/learn/responsive-web-design-v9/review-css/review-css',
																},
															],
														},
													},
													{
														kind: Kind.dossier,
														identifier: 'concerns',
														value: {
															kind: Kind.array,
															value: [
																{
																	kind: Kind.dossier,
																	children: [
																		{
																			kind: Kind.dossier,
																			identifier: 'name',
																			value: {
																				kind: Kind.string,
																				value: 'CSS',
																			},
																		},
																		{
																			kind: Kind.dossier,
																			identifier: 'depth',
																			value: {
																				kind: Kind.integer,
																				value: 1,
																			},
																		},
																	],
																},
																{
																	kind: Kind.dossier,
																	children: [
																		{
																			kind: Kind.dossier,
																			identifier: 'name',
																			value: {
																				kind: Kind.string,
																				value: 'CSS rule',
																			},
																		},
																		{
																			kind: Kind.dossier,
																			identifier: 'depth',
																			value: {
																				kind: Kind.integer,
																				value: 2,
																			},
																		},
																	],
																},
																{
																	kind: Kind.dossier,
																	children: [
																		{
																			kind: Kind.dossier,
																			identifier: 'name',
																			value: {
																				kind: Kind.string,
																				value: 'CSS selector',
																			},
																		},
																		{
																			kind: Kind.dossier,
																			identifier: 'depth',
																			value: {
																				kind: Kind.integer,
																				value: 2,
																			},
																		},
																	],
																},
																{
																	kind: Kind.dossier,
																	children: [
																		{
																			kind: Kind.dossier,
																			identifier: 'name',
																			value: {
																				kind: Kind.string,
																				value: 'CSS declaration block',
																			},
																		},
																		{
																			kind: Kind.dossier,
																			identifier: 'depth',
																			value: {
																				kind: Kind.integer,
																				value: 2,
																			},
																		},
																	],
																},
															],
														},
													},
												],
											},
										],
									},
								],
							},
						],
					},
				],
			});
		});

		it('should parse main-sample.ds', () => {
			const source = readFixture('valid', 'main-sample.ds');

			const ast = parseSource(source);

			expect(simplifyDossier(ast)).toEqual({
				kind: Kind.dossier,
				children: [
					{
						kind: Kind.dossier,
						identifier: 'person',
						value: {
							kind: Kind.string,
							value: 'human',
						},
						children: [
							{
								kind: Kind.dossier,
								identifier: 'name',
								value: {
									kind: Kind.string,
									value: 'John',
								},
							},
							{
								kind: Kind.dossier,
								identifier: 'surname',
								value: {
									kind: Kind.string,
									value: 'Doe',
								},
							},
							{
								kind: Kind.dossier,
								identifier: 'wallet',
								value: {
									kind: Kind.string,
									value: 'open',
								},
								children: [
									{
										kind: Kind.dossier,
										identifier: 'currency',
										value: {
											kind: Kind.string,
											value: 'USD',
										},
									},
									{
										kind: Kind.dossier,
										identifier: 'value',
										value: {
											kind: Kind.decimal,
											value: '294.12',
										},
									},
								],
							},
						],
					},
					{
						kind: Kind.dossier,
						identifier: 'fridgeContents',
						value: {
							kind: Kind.array,
							value: [
								{
									kind: Kind.string,
									value: 'cola',
								},
								{
									kind: Kind.string,
									value: 'chicken',
								},
								{
									kind: Kind.string,
									value: 'cheese sauce',
								},
							],
						},
					},
					{
						kind: Kind.dossier,
						identifier: 'purse',
						value: {
							kind: Kind.array,
							value: [
								{
									kind: Kind.dossier,
									identifier: 'wallet',
									children: [
										{
											kind: Kind.dossier,
											identifier: 'currency',
											value: {
												kind: Kind.string,
												value: 'USD',
											},
										},
										{
											kind: Kind.dossier,
											identifier: 'value',
											value: {
												kind: Kind.decimal,
												value: '190.01',
											},
										},
									],
								},
								{
									kind: Kind.dossier,
									children: [
										{
											kind: Kind.dossier,
											identifier: 'color',
											value: {
												kind: Kind.string,
												value: 'red',
											},
										},
										{
											kind: Kind.dossier,
											identifier: 'position',
											children: [
												{
													kind: Kind.dossier,
													identifier: 'x',
													value: {
														kind: Kind.float,
														value: '11.45',
													},
												},
												{
													kind: Kind.dossier,
													identifier: 'y',
													value: {
														kind: Kind.float,
														value: '-4.8',
													},
												},
											],
										},
									],
								},
							],
						},
					},
					{
						kind: Kind.dossier,
						identifier: 'isSummer',
						value: {
							kind: Kind.boolean,
							value: true,
						},
					},
					{
						kind: Kind.dossier,
						identifier: 'sale',
						value: {
							kind: Kind.null,
							value: null,
						},
					},
					{
						kind: Kind.dossier,
						identifier: 'tags',
						value: {
							kind: Kind.array,
							value: [],
						},
					},
					{
						kind: Kind.dossier,
						identifier: 'pillow',
					},
					{
						kind: Kind.dossier,
						identifier: 'floats',
						children: [
							{
								kind: Kind.dossier,
								identifier: 'zeroes',
								value: {
									kind: Kind.array,
									value: [
										{
											kind: Kind.float,
											value: '0',
										},
										{
											kind: Kind.float,
											value: '0.0',
										},
										{
											kind: Kind.float,
											value: '0e0',
										},
									],
								},
							},
							{
								kind: Kind.dossier,
								identifier: 'exponents',
								value: {
									kind: Kind.array,
									value: [
										{
											kind: Kind.float,
											value: '0e0',
										},
										{
											kind: Kind.float,
											value: '1e2',
										},
										{
											kind: Kind.float,
											value: '-2e21',
										},
										{
											kind: Kind.float,
											value: '+7e2',
										},
									],
								},
							},
						],
					},
				],
			});
		});

		it('should parse store-hidden-treasures.ds', () => {
			const source = readFixture('valid', 'store-hidden-treasures.ds');

			const ast = parseSource(source);

			expect(simplifyDossier(ast)).toEqual({
				kind: Kind.dossier,
				children: [
					{
						kind: Kind.dossier,
						identifier: 'store',
						value: {
							kind: Kind.string,
							value: 'downtown',
						},
						children: [
							{
								kind: Kind.dossier,
								identifier: 'name',
								value: {
									kind: Kind.string,
									value: 'Hidden Treasures',
								},
							},
							{
								kind: Kind.dossier,
								identifier: 'nearby',
								value: {
									kind: Kind.boolean,
									value: true,
								},
							},
							{
								kind: Kind.dossier,
								identifier: 'inventory',
								value: {
									kind: Kind.array,
									value: [
										{
											kind: Kind.dossier,
											identifier: 'apple',
											children: [
												{
													kind: Kind.dossier,
													identifier: 'qty',
													value: {
														kind: Kind.integer,
														value: 10,
													},
												},
												{
													kind: Kind.dossier,
													identifier: 'price',
													value: {
														kind: Kind.decimal,
														value: '1.25',
													},
												},
											],
										},
										{
											kind: Kind.dossier,
											identifier: 'milk',
											children: [
												{
													kind: Kind.dossier,
													identifier: 'qty',
													value: {
														kind: Kind.integer,
														value: 4,
													},
												},
												{
													kind: Kind.dossier,
													identifier: 'price',
													value: {
														kind: Kind.decimal,
														value: '3.50',
													},
												},
											],
										},
									],
								},
							},
							{
								kind: Kind.dossier,
								identifier: 'active',
								value: {
									kind: Kind.boolean,
									value: true,
								},
							},
						],
					},
				],
			});
		});

		it('should parse direct signed numeric values', () => {
			const ast = parseSource(
				[
					'count: -3',
					'offset: +7',
					'price: -1.25',
					'ratio: +2e3',
					'values: [-4, +5.5, -6e2,]',
				].join('\n'),
			);

			expect(simplifyDossier(ast)).toEqual({
				kind: Kind.dossier,
				children: [
					{
						kind: Kind.dossier,
						identifier: 'count',
						value: {
							kind: Kind.integer,
							value: -3,
						},
					},
					{
						kind: Kind.dossier,
						identifier: 'offset',
						value: {
							kind: Kind.integer,
							value: 7,
						},
					},
					{
						kind: Kind.dossier,
						identifier: 'price',
						value: {
							kind: Kind.decimal,
							value: '-1.25',
						},
					},
					{
						kind: Kind.dossier,
						identifier: 'ratio',
						value: {
							kind: Kind.decimal,
							value: '+2e3',
						},
					},
					{
						kind: Kind.dossier,
						identifier: 'values',
						value: {
							kind: Kind.array,
							value: [
								{
									kind: Kind.integer,
									value: -4,
								},
								{
									kind: Kind.decimal,
									value: '+5.5',
								},
								{
									kind: Kind.decimal,
									value: '-6e2',
								},
							],
						},
					},
				],
			});
		});

		it('should parse dossiers with delimited comments', () => {
			const ast = parseSource(
				[
					'## dossier frontmatter comment ##',
					'count: -3 ## signed integer ##',
					'##',
					'multiline comment',
					'##',
					'price: +1.25',
				].join('\n'),
			);

			expect(simplifyDossier(ast)).toEqual({
				kind: Kind.dossier,
				children: [
					{
						kind: Kind.dossier,
						identifier: 'count',
						value: {
							kind: Kind.integer,
							value: -3,
						},
					},
					{
						kind: Kind.dossier,
						identifier: 'price',
						value: {
							kind: Kind.decimal,
							value: '+1.25',
						},
					},
				],
			});
		});
	});

	describe('invalid', () => {
		it('should throw for missing-colon.ds', () => {
			const source = readFixture('invalid', 'missing-colon.ds');

			expect(() => {
				parseSource(source);
			}).toThrow('Expected ":" or "::" after identifier at 2:9');
		});

		it('should throw for anonymous dossiers nested inside dossiers', () => {
			expect(() => {
				parseSource(['expedition ::', '\t::', '\t\tage: 8759', '\t;;', ';;'].join('\n'));
			}).toThrow('Anonymous dossiers are only allowed at the root or inside arrays at 2:2');
		});

		it('should throw for named dossiers without values written as "name: ::"', () => {
			expect(() => {
				parseSource(['name: ::', ';;'].join('\n'));
			}).toThrow(
				'Unexpected "::" after ":" at 1:7. Use "identifier ::" for dossiers without values',
			);
		});

		it('should throw for arrays without trailing commas', () => {
			expect(() => {
				parseSource(['items: [1, 2]'].join('\n'));
			}).toThrow('Expected trailing comma after array item at 1:13');
		});
	});
});
