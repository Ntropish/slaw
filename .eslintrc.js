module.exports = {
  env: {
    browser: true,
    commonjs: true,
    es6: true,
    node: true,
  },
  extends: ['eslint:recommended', 'plugin:vue/recommended'],
  globals: {
    Atomics: 'readonly',
    SharedArrayBuffer: 'readonly',
  },
  plugins: ['vue'],
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
