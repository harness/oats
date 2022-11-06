module.exports = {
	parser: '@typescript-eslint/parser',
	parserOptions: {
		ecmaVersion: 2020,
		sourceType: 'module',
		ecmaFeatures: {
			jsx: true,
			impliedStrict: true,
		},
		project: './tsconfig.json',
	},
	plugins: ['@typescript-eslint/eslint-plugin', 'import'],
	settings: {
		'import/resolver': {
			typescript: true,
			node: true,
		},
	},
	env: {
		browser: true,
		node: true,
		'shared-node-browser': true,
		es6: true,
		jest: true,
	},
	extends: [
		'eslint:recommended',
		'plugin:@typescript-eslint/recommended',
		'prettier',
		'plugin:import/recommended',
		'plugin:import/typescript',
	],
	rules: {
		camelcase: 2,
		'no-shadow': 2,
		'no-console': 2,
		'@typescript-eslint/no-use-before-define': 0,
		'@typescript-eslint/explicit-function-return-type': [
			1,
			{
				allowExpressions: true,
			},
		],
		'no-unused-vars': 0,
		'@typescript-eslint/no-unused-vars': [
			2,
			{
				vars: 'all',
				args: 'after-used',
				ignoreRestSiblings: true,
				argsIgnorePattern: '^_',
			},
		],
		'@typescript-eslint/member-delimiter-style': 0,
		'@typescript-eslint/naming-convention': [
			2,
			{
				selector: 'interface',
				format: ['PascalCase'],
				prefix: ['I'],
			},
			{
				selector: 'typeAlias',
				format: ['PascalCase'],
				prefix: ['I'],
			},
			{
				selector: 'typeParameter',
				format: ['PascalCase'],
				prefix: ['T'],
			},
		],
		'import/no-cycle': 2,
	},
	overrides: [
		{
			files: ['bin/**/*.js'],
			rules: {
				'@typescript-eslint/no-var-requires': 0,
			},
		},
		{
			files: ['**/*.test.ts', '**/*.test.tsx'],
			rules: {
				'@typescript-eslint/no-magic-numbers': 0,
				'@typescript-eslint/no-non-null-assertion': 0,
				'@typescript-eslint/no-explicit-any': 0,
				'@typescript-eslint/no-non-null-asserted-optional-chain': 0,
				'no-await-in-loop': 0,
			},
		},
	],
};
