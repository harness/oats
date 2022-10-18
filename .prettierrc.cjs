module.exports = {
	printWidth: 100,
	tabWidth: 2,
	useTabs: true,
	semi: true,
	singleQuote: true,
	trailingComma: 'all',
	bracketSpacing: true,
	arrowParens: 'always',
	overrides: [
		{
			files: ['*.yml', '*.yaml', '*.md', '*.toml', '*.json'],
			options: {
				tabWidth: 2,
				useTabs: false,
			},
		},
	],
};
