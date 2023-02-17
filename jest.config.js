// https://jestjs.io/docs/next/configuration
export default {
  transform: {},
  preset: 'jest-puppeteer',
  // transformIgnorePatterns: ['node_modules/(?!@ngrx)'],
  moduleNameMapper: {
    '^jquery$': '<rootDir>/node_modules/jquery/dist/jquery.min.js'
  }
}
