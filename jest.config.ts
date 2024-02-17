module.exports = {
    preset: 'jest-preset-angular',
    modulePaths: ["<rootDir>"],
    setupFilesAfterEnv: ['<rootDir>/src/setup-jest.ts'],
    testPathIgnorePatterns: [
        '<rootDir>/node_modules/',
        '<rootDir>/dist/',
    ],
    transform: {
        '^.+\\.{ts|tsx}?$': [
            'ts-jest',
            {
                tsconfig: '<rootDir>/tsconfig.spec.json',
                stringifyContentPathRegex: '\\.html$',
            },
        ],
    },
};
