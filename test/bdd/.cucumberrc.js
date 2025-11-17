module.exports = {
  requireModule: ['ts-node/register'],
  require: [
    'test/bdd/support/hooks.ts',
    'test/bdd/steps/common-steps.ts',
    'test/bdd/steps/chat-health-steps.ts',
    'src/**/steps/*.ts',
  ],
  format: [
    '@cucumber/pretty-formatter',
    'json:test/bdd/reports/cucumber-report.json',
    'html:test/bdd/reports/cucumber-report.html',
  ],
  formatOptions: {
    snippetInterface: 'async-await',
  },
  paths: [
    'src/properties/features/*.feature',
    'src/chat/features/*.feature',
  ],
  publishQuiet: true,
};

