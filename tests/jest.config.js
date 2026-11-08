// https://jestjs.io/docs/next/configuration
export default {
  // https://jestjs.io/docs/code-transformation
  transform: {},
  preset: 'jest-puppeteer',
  testEnvironment: './CE.js',
  setupFiles: [
    "<rootDir>/web/setEnvVars.js"
  ],
  moduleNameMapper: {
    '^jquery$': '<rootDir>/node_modules/jquery/dist/jquery.min.js'
  },
  testMatch: [ "<rootDir>/web/**/?(*.)+(spec|test).js?(x)" ]
}

// also possible
// process.env = Object.assign(process.env, {MINISERVER_TEST_PORT:8001 })
