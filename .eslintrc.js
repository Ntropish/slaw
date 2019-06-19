module.exports = {
  env: {
    browser: true,
    commonjs: true,
    es6: true,
    node: true,
    'jest/globals': true,
  },
  extends: ['eslint:recommended', 'plugin:vue/recommended'],
  globals: {
    Atomics: 'readonly',
    Zdog: 'readonly',
    SharedArrayBuffer: 'readonly',
  },
  plugins: ['vue', 'jest'],
  parserOptions: {
    parser: 'babel-eslint',

    ecmaVersion: 2019,
    sourceType: 'module',
  },
  rules: {
    'no-unused-vars': [0],
    'vue/max-attributes-per-line': [0],
    'vue/html-closing-bracket-spacing': [0],
  },
}
