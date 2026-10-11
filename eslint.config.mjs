import tsPlugin from '@typescript-eslint/eslint-plugin';

export default [
    { ignores: ['lib/', 'jsdoc/', 'node_modules/'] },
    ...tsPlugin.configs['flat/recommended'],
    {
        rules: {
            '@typescript-eslint/no-explicit-any': 'off',
            '@typescript-eslint/no-unused-vars': ['error', { args: 'none', caughtErrors: 'none' }],
        },
    },
];
