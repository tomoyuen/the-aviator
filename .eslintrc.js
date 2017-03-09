module.exports = {
  root: true,
  globals: {
    window: false,
    document: false,
  },
  parser: 'babel-eslint',
  parserOptions: {
    sourceType: 'module'
  },
  extends: 'airbnb-base',
  'rules': {
    'import/no-unresolved': 0,
    'no-debugger': process.env.NODE_ENV === 'production' ? 2 : 0,
    'linebreak-style': 0,
    'no-var': 0,
    'no-mixed-operators': 0,
    'no-plusplus': 0,
    'no-continue': 0,
  }
}
