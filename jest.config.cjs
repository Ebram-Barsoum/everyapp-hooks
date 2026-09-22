/** @type {import('jest').Config} */
module.exports = {
  testEnvironment: "jsdom",
  roots: ["<rootDir>/test"],
  testMatch: ["**/*.test.ts?(x)"],
  transform: { "^.+\\.[jt]sx?$": "babel-jest" },
  setupFilesAfterEnv: ["<rootDir>/test/setupTests.ts"],
  collectCoverageFrom: ["src/**/*.ts", "!src/index.ts"],
  clearMocks: true,
  restoreMocks: true,
};
