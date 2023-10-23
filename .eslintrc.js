/**@type {import('eslint').Linter.Config} */
// eslint-disable-next-line no-undef
module.exports = {
	root: true,
	parserOptions: {
		ecmaVersion: 'latest',
		sourceType: 'module',
		project: true,
    	tsconfigRootDir: __dirname
	},
	plugins: ['@typescript-eslint/eslint-plugin'],
	parser: '@typescript-eslint/parser',
	extends: [
		'eslint:recommended',
		'plugin:@typescript-eslint/recommended-requiring-type-checking'
	]
};