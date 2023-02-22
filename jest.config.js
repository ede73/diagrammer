// https://jestjs.io/docs/next/configuration
export default {
  // https://jestjs.io/docs/code-transformation
  transform: {},
  preset: 'jest-puppeteer',
  moduleNameMapper: {
    '^jquery$': '<rootDir>/node_modules/jquery/dist/jquery.min.js'
  },
  // Disable TypeScript, jest crappy support via Babel, but not worth the try??
  // It needs  separate setup. Could transform be used with tsc to achieve the same?
  // Also the transform sounds like overengineered machine
  testMatch: [ "**/__tests__/**/*.js?(x)", "**/?(*.)+(spec|test).js?(x)" ]
}
