module.exports = {
  root: true, 
  parserOptions: {
      sourceType: 'module'
  },
  extends: "airbnb",
  parser: 'babel-eslint',
  env: {
      browser: true,
  },
  rules: {
      "indent": ["error", 2],
      "quotes": ["error", "single"],
      "semi": 0,
      "no-console": 0,
      "no-await-in-loop": 0,
      "max-len": 0,
      "arrow-parens": 0,
      "class-methods-use-this": 0,
      "no-restricted-syntax": 0
  }
}