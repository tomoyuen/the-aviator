module.exports = {
  root: true,
  parser: 'babel-eslint',
  parserOptions: {
    sourceType: 'module'
  },
  extends: 'airbnb-base',
  plugins: [
    'html'
  ],
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
