// https://jestjs.io/docs/next/configuration
export default {
  transform: {},
  preset: 'jest-puppeteer',
  moduleNameMapper: {
    '^jquery$': '<rootDir>/node_modules/jquery/dist/jquery.min.js'
  }
}
