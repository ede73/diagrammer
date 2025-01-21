// https://jestjs.io/docs/next/configuration
export default {
  // https://jestjs.io/docs/code-transformation
  transform: {},
  preset: 'jest-puppeteer',
  testEnvironment: './tests/CE.js',
  setupFiles: [
    "<rootDir>/tests/web/setEnvVars.js"
  ],
  moduleNameMapper: {
    '^jquery$': '<rootDir>/node_modules/jquery/dist/jquery.min.js'
  },
  // Disable TypeScript, jest crappy support via Babel, but not worth the try??
  // It needs  separate setup. Could transform be used with tsc to achieve the same?
  // Also the transform sounds like overengineered machine
  testMatch: [ "**/__tests__/**/*.js?(x)", "**/?(*.)+(spec|test).js?(x)" ]
}

// also possible
// process.env = Object.assign(process.env, {MINISERVER_TEST_PORT:8001 })
